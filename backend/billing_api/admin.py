from django.contrib import admin

from .models import BillingProfile, Invoice, PaymentIntent


@admin.register(BillingProfile)
class BillingProfileAdmin(admin.ModelAdmin):
    list_display = ('email', 'plan', 'payment_brand', 'payment_last4', 'updated_at')
    search_fields = ('email',)


@admin.register(PaymentIntent)
class PaymentIntentAdmin(admin.ModelAdmin):
    list_display = ('external_id', 'profile', 'amount_cents', 'currency', 'status', 'created_at')
    list_filter = ('status', 'provider', 'currency')
    search_fields = ('external_id', 'profile__email')


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('external_id', 'profile', 'amount_cents', 'currency', 'status', 'issued_at')
    list_filter = ('status', 'currency')
    search_fields = ('external_id', 'profile__email')
