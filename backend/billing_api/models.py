from django.db import models


class BillingProfile(models.Model):
    PLAN_CHOICES = [
        ('starter', 'Starter'),
        ('pro', 'Pro'),
        ('scale', 'Scale')
    ]

    email = models.EmailField(unique=True)
    plan = models.CharField(max_length=24, choices=PLAN_CHOICES, default='pro')
    payment_brand = models.CharField(max_length=24, default='VISA')
    payment_last4 = models.CharField(max_length=4, default='2481')
    payment_expiry = models.CharField(max_length=7, default='08/28')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.email} ({self.plan})'


class PaymentIntent(models.Model):
    STATUS_CHOICES = [
        ('created', 'Created'),
        ('processing', 'Processing'),
        ('succeeded', 'Succeeded'),
        ('failed', 'Failed'),
        ('canceled', 'Canceled'),
        ('unknown', 'Unknown')
    ]

    profile = models.ForeignKey(BillingProfile, on_delete=models.CASCADE, related_name='payment_intents')
    provider = models.CharField(max_length=32, default='stancer')
    external_id = models.CharField(max_length=128, unique=True)
    checkout_url = models.URLField()
    amount_cents = models.PositiveIntegerField()
    currency = models.CharField(max_length=8, default='eur')
    description = models.CharField(max_length=255)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='created')
    raw_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.external_id} [{self.status}]'


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed')
    ]

    profile = models.ForeignKey(BillingProfile, on_delete=models.CASCADE, related_name='invoices')
    external_id = models.CharField(max_length=128, unique=True)
    amount_cents = models.PositiveIntegerField()
    currency = models.CharField(max_length=8, default='eur')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='pending')
    issued_at = models.DateField()
    payment_intent = models.ForeignKey(
        PaymentIntent, on_delete=models.SET_NULL, related_name='invoices', null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.external_id} ({self.status})'
