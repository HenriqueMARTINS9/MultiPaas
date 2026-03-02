from django.urls import path

from .views import change_password_view, login_view, profile_view, signup_view

urlpatterns = [
    path('login/', login_view, name='login'),
    path('signup/', signup_view, name='signup'),
    path('profile/', profile_view, name='profile'),
    path('change-password/', change_password_view, name='change-password')
]
