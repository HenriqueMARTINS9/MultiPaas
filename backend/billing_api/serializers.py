from rest_framework import serializers


class BillingEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()


class BillingPlanUpdateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    plan = serializers.ChoiceField(choices=['starter', 'pro', 'scale'])


class BillingPaymentMethodSerializer(serializers.Serializer):
    email = serializers.EmailField()
    brand = serializers.CharField(max_length=24, default='VISA')
    expiry = serializers.RegexField(regex=r'^\d{2}\/\d{2}$')
    last4 = serializers.RegexField(regex=r'^\d{4}$')


class BillingCheckoutSerializer(serializers.Serializer):
    amount_cents = serializers.IntegerField(min_value=50)
    currency = serializers.CharField(default='eur')
    description = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    plan = serializers.ChoiceField(choices=['starter', 'pro', 'scale'])


class BillingRefreshSerializer(serializers.Serializer):
    payment_intent_id = serializers.CharField(max_length=128)
