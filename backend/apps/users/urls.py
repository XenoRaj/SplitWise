from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'users'

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('password-reset/', views.password_reset_request, name='password_reset'),
    path('verify-password-reset-otp/', views.verify_password_reset_otp, name='verify_password_reset_otp'),
    path('reset-password/', views.reset_password, name='reset_password'),
    path('verify-2fa/', views.verify_two_factor, name='verify_2fa'),
    path('resend-otp/', views.resend_otp, name='resend_otp'),
    path('users/', views.UsersListView.as_view(), name='users_list'),
]