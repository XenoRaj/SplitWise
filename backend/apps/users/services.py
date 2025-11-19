from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """Service for sending emails"""
    
    @staticmethod
    def send_otp_email(user, otp_code):
        """Send OTP code to user's email"""
        try:
            subject = 'SplitWise - Your OTP Code'
            
            # Create a nice message
            message = f"""Hi {user.first_name or 'User'},

Your verification code for SplitWise is: {otp_code}

This code will expire in 10 minutes. If you didn't request this code, please ignore this email.

Best regards,
SplitWise Team"""
            
            # Send email
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            logger.info(f"OTP email sent successfully to {user.email}")
            print(f"SUCCESS: OTP email sent to {user.email}: {otp_code}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send OTP email to {user.email}: {str(e)}")
            print(f"EMAIL FAILED - OTP for {user.email}: {otp_code}")
            print(f"Error details: {str(e)}")
            return False