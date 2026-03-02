from datetime import date, timedelta
from decimal import Decimal
from uuid import uuid4

import requests
from django.db import transaction
from django.utils.timezone import now
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BillingProfile, Invoice, PaymentIntent
from .serializers import (
    BillingCheckoutSerializer,
    BillingEmailSerializer,
    BillingPaymentMethodSerializer,
    BillingPlanUpdateSerializer,
    BillingRefreshSerializer
)
from .stancer_client import StancerClient, StancerConfigurationError


PLAN_PRICES_CENTS = {'starter': 2900, 'pro': 7900, 'scale': 19900}


def _money(cents: int):
    return f'{Decimal(cents) / Decimal(100):.2f} €'


def _next_invoice_date_text():
    next_month_first_day = (date.today().replace(day=28) + timedelta(days=4)).replace(day=1)
    return next_month_first_day.strftime('%b %d, %Y')


def _profile(email: str):
    profile, _ = BillingProfile.objects.get_or_create(email=email)
    return profile


class BillingSummaryView(APIView):
    def get(self, request):
        serializer = BillingEmailSerializer(data={'email': request.query_params.get('email')})
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        profile = _profile(email)
        invoices = list(profile.invoices.order_by('-issued_at', '-created_at')[:25])

        latest_amount_cents = invoices[0].amount_cents if invoices else PLAN_PRICES_CENTS.get(profile.plan, 7900)
        projected = int(latest_amount_cents * 1.22)

        return Response(
            {
                'profile': {
                    'email': profile.email,
                    'plan': profile.plan,
                    'plan_price_cents': PLAN_PRICES_CENTS.get(profile.plan, 7900),
                    'payment_brand': profile.payment_brand,
                    'payment_last4': profile.payment_last4,
                    'payment_expiry': profile.payment_expiry
                },
                'stats': {
                    'current_month': _money(latest_amount_cents),
                    'projected': _money(projected),
                    'next_invoice_date': _next_invoice_date_text()
                },
                'invoices': [
                    {
                        'id': invoice.external_id,
                        'date': invoice.issued_at.strftime('%b %d, %Y'),
                        'amount': _money(invoice.amount_cents),
                        'status': invoice.status.title()
                    }
                    for invoice in invoices
                ]
            }
        )


class BillingSubscriptionView(APIView):
    def post(self, request):
        serializer = BillingPlanUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        plan = serializer.validated_data['plan']

        profile = _profile(email)
        profile.plan = plan
        profile.save(update_fields=['plan', 'updated_at'])
        return Response({'message': 'Plan updated.', 'plan': plan})


class BillingPaymentMethodView(APIView):
    def post(self, request):
        serializer = BillingPaymentMethodSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        profile = _profile(email)
        profile.payment_brand = serializer.validated_data['brand'].upper()
        profile.payment_last4 = serializer.validated_data['last4']
        profile.payment_expiry = serializer.validated_data['expiry']
        profile.save(update_fields=['payment_brand', 'payment_last4', 'payment_expiry', 'updated_at'])
        return Response({'message': 'Payment method updated.'})


class BillingCheckoutView(APIView):
    def post(self, request):
        serializer = BillingCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        profile = _profile(payload['email'])

        try:
            client = StancerClient.from_settings()
            stancer_payment_intent = client.create_payment_intent(
                amount_cents=payload['amount_cents'],
                currency=payload['currency'],
                description=payload['description'],
                email=payload['email']
            )
        except StancerConfigurationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except requests.RequestException as exc:
            return Response(
                {'detail': f'Stancer request failed: {exc}'},
                status=status.HTTP_502_BAD_GATEWAY
            )

        external_id = stancer_payment_intent.get('id', '')
        checkout_url = stancer_payment_intent.get('url', '')
        if not external_id or not checkout_url:
            return Response(
                {'detail': 'Stancer response missing id or url.'},
                status=status.HTTP_502_BAD_GATEWAY
            )

        with transaction.atomic():
            payment_intent = PaymentIntent.objects.create(
                profile=profile,
                provider='stancer',
                external_id=external_id,
                checkout_url=checkout_url,
                amount_cents=payload['amount_cents'],
                currency=payload['currency'],
                description=payload['description'],
                status='created',
                raw_response=stancer_payment_intent
            )
            invoice = Invoice.objects.create(
                profile=profile,
                external_id=f'INV-{now().year}-{uuid4().hex[:8].upper()}',
                amount_cents=payload['amount_cents'],
                currency=payload['currency'],
                status='pending',
                issued_at=date.today(),
                payment_intent=payment_intent
            )
            profile.plan = payload['plan']
            profile.save(update_fields=['plan', 'updated_at'])

        return Response(
            {
                'checkout_url': checkout_url,
                'invoice_id': invoice.external_id,
                'message': 'Checkout created.',
                'payment_intent_id': external_id
            },
            status=status.HTTP_201_CREATED
        )


class BillingPaymentIntentRefreshView(APIView):
    def post(self, request):
        serializer = BillingRefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment_intent_id = serializer.validated_data['payment_intent_id']

        payment_intent = PaymentIntent.objects.filter(external_id=payment_intent_id).first()
        if payment_intent is None:
            return Response({'detail': 'Unknown payment_intent_id.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            client = StancerClient.from_settings()
            stancer_payment_intent = client.retrieve_payment_intent(payment_intent_id)
        except StancerConfigurationError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except requests.RequestException as exc:
            return Response(
                {'detail': f'Stancer request failed: {exc}'},
                status=status.HTTP_502_BAD_GATEWAY
            )

        raw_status = (stancer_payment_intent.get('status') or '').lower()
        normalized_status = {
            'captured': 'succeeded',
            'authorized': 'processing',
            'created': 'created',
            'pending': 'processing',
            'refused': 'failed',
            'failed': 'failed',
            'canceled': 'canceled'
        }.get(raw_status, 'unknown')

        payment_intent.status = normalized_status
        payment_intent.raw_response = stancer_payment_intent
        payment_intent.save(update_fields=['status', 'raw_response', 'updated_at'])

        invoice = payment_intent.invoices.order_by('-created_at').first()
        if invoice is not None:
            if normalized_status == 'succeeded':
                invoice.status = 'paid'
            elif normalized_status in {'failed', 'canceled'}:
                invoice.status = 'failed'
            else:
                invoice.status = 'pending'
            invoice.save(update_fields=['status'])

        return Response({'status': normalized_status})
