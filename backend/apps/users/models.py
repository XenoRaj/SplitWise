from django.contrib.auth.models import AbstractUser
from django.db import models
import random
import string
from datetime import datetime, timedelta
from django.utils import timezone
from django.utils import timezone
import random
import string


class CustomUser(AbstractUser):
    """
    Custom User model extending Django's AbstractUser
    """
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    profile_picture = models.URLField(blank=True, null=True)
    two_factor_enabled = models.BooleanField(default=True)  # Enable 2FA by default
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Use email as the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_balance_summary(self):
        """Calculate user's balance from expenses"""
        from django.db.models import Sum
        from apps.expenses.models import ExpenseSplit, Settlement, Expense
        
        # Amount user owes to others (splits where they are assigned, but EXCLUDE expenses they paid for)
        # Only count splits from expenses paid by OTHER people
        owed_to_others = self.expense_splits.exclude(
            expense__paid_by=self
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Amount others owe to user (from expenses they paid, minus their own split)
        owed_by_others = 0
        user_paid_expenses = Expense.objects.filter(paid_by=self)
        for expense in user_paid_expenses:
            # Sum of all splits except user's own split
            total_splits = expense.expense_splits.exclude(user=self).aggregate(total=Sum('amount'))['total'] or 0
            owed_by_others += total_splits
        
        return {
            'owed_to_others': float(owed_to_others),
            'owed_by_others': float(owed_by_others),
            'net_balance': float(owed_by_others - owed_to_others)
        }


class OTP(models.Model):
    """
    Model to store OTP codes for two-factor authentication
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='otps')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'user_otps'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"OTP {self.code} for {self.user.email}"
    
    @classmethod
    def generate_for_user(cls, user):
        """Generate a new OTP for the user"""
        # Deactivate any existing unused OTPs
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        
        # Generate 6-digit OTP
        code = ''.join(random.choices(string.digits, k=6))
        
        # Set expiration to 10 minutes from now
        expires_at = timezone.now() + timedelta(minutes=10)
        
        return cls.objects.create(
            user=user,
            code=code,
            expires_at=expires_at
        )
    
    def is_valid(self):
        """Check if OTP is still valid"""
        return not self.is_used and self.expires_at > timezone.now()
    
    def mark_as_used(self):
        """Mark OTP as used"""
        self.is_used = True
        self.save()


class OTPToken(models.Model):
    """
    Model to store OTP tokens for 2FA verification
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'otp_tokens'
        verbose_name = 'OTP Token'
        verbose_name_plural = 'OTP Tokens'
    
    def is_expired(self):
        """Check if OTP has expired (valid for 5 minutes)"""
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        """Check if OTP is valid (not expired and not used)"""
        return not self.is_expired() and not self.is_used
    
    @classmethod
    def generate_otp(cls, user):
        """Generate a new 6-digit OTP for user"""
        # Clear any existing unused OTPs for this user
        cls.objects.filter(user=user, is_used=False).delete()
        
        # Generate random 6-digit OTP
        otp_code = ''.join(random.choices(string.digits, k=6))
        
        # Set expiration time (5 minutes from now)
        expires_at = timezone.now() + timezone.timedelta(minutes=5)
        
        # Create new OTP record
        otp_token = cls.objects.create(
            user=user,
            otp_code=otp_code,
            expires_at=expires_at
        )
        
        return otp_token
    
    def __str__(self):
        return f"OTP {self.otp_code} for {self.user.email}"
