from django.contrib import admin
from django.urls import include, path

admin.site.site_header = 'MultiPaas Administration'
admin.site.site_title = 'MultiPaas Admin'
admin.site.index_title = 'Platform Control Center'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('auth_api.urls')),
    path('api/billing/', include('billing_api.urls'))
]
