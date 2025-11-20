from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
import random
from .models import CustomUser, OTP
from .serializers import UserRegistrationSerializer, UserSerializer, LoginSerializer
from .services import EmailService


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        print(f"REGISTRATION REQUEST DATA: {request.data}")
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"REGISTRATION VALIDATION ERRORS: {serializer.errors}")
            return Response({
                'error': 'Invalid registration data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.save()
        print(f"USER CREATED SUCCESSFULLY: {user.email} (ID: {user.id}, 2FA: {user.two_factor_enabled})")
        
        # Since 2FA is enabled by default, don't auto-login
        # User needs to go through 2FA flow first
        if user.two_factor_enabled:
            # Generate OTP for first-time verification
            otp = OTP.generate_for_user(user)
            email_sent = EmailService.send_otp_email(user, otp.code)
            
            if not email_sent:
                return Response({
                    'error': 'Account created but failed to send verification code. Please try logging in.'
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                'message': 'Account created successfully! A verification code has been sent to your email.',
                'requires_2fa': True,
                'email': user.email,
                'user_created': True
            }, status=status.HTTP_201_CREATED)
        else:
            # Fallback for users without 2FA (shouldn't happen with default=True)
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': 'Registration successful! Two-factor authentication is enabled for enhanced security.',
                'two_factor_enabled': user.two_factor_enabled
            }, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid login data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        user = serializer.validated_data['user']
        
        # Check if 2FA is required
        if user.two_factor_enabled:
            # Generate OTP and send email
            otp = OTP.generate_for_user(user)
            email_sent = EmailService.send_otp_email(user, otp.code)
            
            if not email_sent:
                return Response({
                    'error': 'Failed to send verification code. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            return Response({
                'requires_2fa': True,
                'email': user.email,  # Send email for 2FA verification
                'message': 'Verification code sent to your email'
            })
        
        # Generate JWT tokens for users without 2FA
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Login successful'
        })


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get(self, request, *args, **kwargs):
        user = self.get_object()
        user_data = UserSerializer(user).data
        
        # Get real balance data
        balance_data = user.get_balance_summary()
        
        # Add balance information with real calculations
        profile_data = {
            **user_data,
            'balance': balance_data['net_balance'],    # Net balance (positive = you're owed, negative = you owe)
            'owes': balance_data['owed_to_others'],    # Amount you owe to others  
            'owed': balance_data['owed_by_others'],    # Amount others owe to you
            'stats': {
                'total_expenses': 0,  # TODO: Calculate from actual expenses
                'groups_count': 0,    # TODO: Calculate from actual group memberships
            }
        }
        
        return Response(profile_data)


class DashboardView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        
        # Get user data
        user_data = UserSerializer(user).data
        
        # Get real balance data
        balance_data = user.get_balance_summary()
        
        # Get expense and group counts
        from apps.expenses.models import Expense, ExpenseSplit
        from apps.expenses.serializers import ExpenseSerializer
        from apps.groups.models import Group, GroupMembership
        from django.db.models import Q
        
        # Get user's groups for filtering
        user_groups = GroupMembership.objects.filter(
            user=user, is_active=True
        ).values_list('group_id', flat=True)
        
        # Get recent expenses (both group and personal expenses where user is involved)
        recent_expenses = Expense.objects.filter(
            Q(group_id__in=user_groups) |  # Group expenses where user is member
            Q(group__isnull=True, paid_by=user) |  # Personal expenses paid by user
            Q(expense_splits__user=user)  # Any expenses where user has splits
        ).distinct().order_by('-created_at')[:10]
        
        # Count expenses where user is involved (either paid by user or user has splits)
        total_expenses = Expense.objects.filter(
            Q(paid_by=user) | Q(expense_splits__user=user)
        ).distinct().count()
        
        # Count groups where user is a member
        total_groups = Group.objects.filter(members=user).count()
        
        # Build dashboard data with real calculations
        dashboard_data = {
            'user': user_data,
            'stats': {
                'total_expenses': total_expenses,
                'total_owed': balance_data['owed_to_others'],    # Amount user owes to others
                'total_owing': balance_data['owed_by_others'],   # Amount others owe to user
                'net_balance': balance_data['net_balance'],      # Net balance
                'groups_count': total_groups,
            },
            'recent_expenses': ExpenseSerializer(recent_expenses, many=True).data,
            'recent_groups': [],    # TODO: Add recent groups query
        }
        
        print(f"Dashboard data for user {user.email}:")
        print(f"Recent expenses count: {len(recent_expenses)}")
        print(f"Balance data: {balance_data}")
        
        return Response(dashboard_data)


def generate_otp():
    """Generate a 6-digit OTP"""
    return str(random.randint(100000, 999999))


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = CustomUser.objects.get(email=email)
        # Generate OTP for password reset
        otp_code = generate_otp()
        
        # Delete any existing OTPs for this user to avoid conflicts
        OTP.objects.filter(user=user).delete()
        
        # Create new OTP
        otp_obj = OTP.objects.create(
            user=user,
            code=otp_code,
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        
        # In a real app, you'd send this OTP via email
        # For now, we'll log it for testing purposes
        print(f"Password Reset OTP for {email}: {otp_code}")
        
        return Response({'message': 'Password reset OTP sent to your email'})
    except CustomUser.DoesNotExist:
        return Response({'error': 'User with this email does not exist'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_password_reset_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    
    if not email or not otp:
        return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = CustomUser.objects.get(email=email)
        otp_obj = OTP.objects.get(user=user, code=otp)
        
        # Check if OTP is still valid (within 10 minutes)
        if timezone.now() - otp_obj.created_at > timedelta(minutes=10):
            otp_obj.delete()
            return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        # OTP is valid - return success
        return Response({'message': 'OTP verified successfully', 'email': email})
        
    except (CustomUser.DoesNotExist, OTP.DoesNotExist):
        return Response({'error': 'Invalid OTP or email'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    
    if not all([email, otp, new_password, confirm_password]):
        return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if new_password != confirm_password:
        return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)
    
    if len(new_password) < 6:
        return Response({'error': 'Password must be at least 6 characters long'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = CustomUser.objects.get(email=email)
        otp_obj = OTP.objects.get(user=user, code=otp)
        
        # Check if OTP is still valid (within 10 minutes)
        if timezone.now() - otp_obj.created_at > timedelta(minutes=10):
            otp_obj.delete()
            return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update password
        user.set_password(new_password)
        user.save()
        
        # Delete the used OTP
        otp_obj.delete()
        
        return Response({'message': 'Password reset successfully'})
        
    except (CustomUser.DoesNotExist, OTP.DoesNotExist):
        return Response({'error': 'Invalid OTP or email'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])  # Allow access without authentication
def verify_two_factor(request):
    # Get the user email and OTP from request data
    email = request.data.get('email')
    otp_code = request.data.get('otp')
    
    if not email:
        return Response({'error': 'Email is required for 2FA verification'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not otp_code:
        return Response({'error': 'OTP code is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = CustomUser.objects.get(email=email)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user has 2FA enabled
    if not user.two_factor_enabled:
        return Response({'error': 'Two-factor authentication not enabled for this user'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Find valid OTP for this user
    try:
        otp = OTP.objects.get(
            user=user,
            code=otp_code,
            is_used=False
        )
        
        if not otp.is_valid():
            return Response({
                'error': 'OTP has expired. Please request a new one.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark OTP as used
        otp.mark_as_used()
        
        # Generate JWT tokens after successful 2FA
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': '2FA verification successful'
        })
        
    except OTP.DoesNotExist:
        return Response({
            'error': 'Invalid OTP code'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_otp(request):
    """Resend OTP code to user's email"""
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = CustomUser.objects.get(email=email)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if not user.two_factor_enabled:
        return Response({'error': 'Two-factor authentication not enabled for this user'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate new OTP and send email
    otp = OTP.generate_for_user(user)
    email_sent = EmailService.send_otp_email(user, otp.code)
    
    if not email_sent:
        return Response({
            'error': 'Failed to send verification code. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'message': 'New verification code sent to your email'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout user by blacklisting their refresh token
    """
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            # Blacklist the refresh token
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({
            'message': 'Successfully logged out'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': 'Failed to logout'
        }, status=status.HTTP_400_BAD_REQUEST)


class UsersListView(APIView):
    """
    Get list of all users for expense splitting
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            users = CustomUser.objects.all()
            serializer = UserSerializer(users, many=True)
            return Response(serializer.data, status=200)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
