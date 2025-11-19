from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
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


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = CustomUser.objects.get(email=email)
        # In a real app, you'd send an email with reset link
        return Response({'message': 'Password reset link sent to your email'})
    except CustomUser.DoesNotExist:
        return Response({'error': 'User with this email does not exist'}, status=status.HTTP_404_NOT_FOUND)


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
