from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    ACCOUNT_TYPE_CHOICES = [
        ('personal', 'Personal'),
        ('company', 'Company')
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    account_type = models.CharField(max_length=16, choices=ACCOUNT_TYPE_CHOICES, default='personal')
    profile_photo = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user_id}:{self.account_type}'
