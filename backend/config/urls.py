from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('auth_api.urls')),
    path('api/billing/', include('billing_api.urls'))
]
