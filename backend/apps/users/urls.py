from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('password-reset/', views.password_reset_request, name='password_reset'),
    path('verify-2fa/', views.verify_two_factor, name='verify_2fa'),
]