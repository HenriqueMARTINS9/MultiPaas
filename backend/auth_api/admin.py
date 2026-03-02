from django.contrib import admin

from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'account_type', 'updated_at')
    list_filter = ('account_type',)
    search_fields = ('user__email', 'user__username', 'user__first_name', 'user__last_name')
