from django.urls import path

from .views import (
    BillingCheckoutView,
    BillingPaymentIntentRefreshView,
    BillingPaymentMethodView,
    BillingSubscriptionView,
    BillingSummaryView
)

urlpatterns = [
    path('summary/', BillingSummaryView.as_view(), name='billing-summary'),
    path('subscription/', BillingSubscriptionView.as_view(), name='billing-subscription'),
    path('payment-method/', BillingPaymentMethodView.as_view(), name='billing-payment-method'),
    path('checkout/', BillingCheckoutView.as_view(), name='billing-checkout'),
    path('payment-intents/refresh/', BillingPaymentIntentRefreshView.as_view(), name='billing-payment-intent-refresh')
]
