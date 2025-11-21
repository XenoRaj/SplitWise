from django.db import models
from django.conf import settings
from decimal import Decimal


class Expense(models.Model):
    """
    Main expense model for tracking group expenses
    """
    SPLIT_TYPES = [
        ('equal', 'Split Equally'),
        ('exact', 'Exact Amounts'),
        ('percentage', 'Percentage'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    
    # Who paid for this expense
    paid_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='expenses_paid'
    )
    
    # Which group this expense belongs to (optional)
    group = models.ForeignKey(
        'groups.Group', 
        on_delete=models.CASCADE, 
        related_name='expenses',
        null=True,
        blank=True
    )
    
    # How to split the expense
    split_type = models.CharField(max_length=20, choices=SPLIT_TYPES, default='equal')
    
    # Receipt/image URL
    receipt_image = models.URLField(blank=True, null=True)
    
    # Expense verification fields
    verification_status = models.JSONField(default=dict, blank=True)  # {"user_id": "accepted|pending|rejected"}
    is_approved = models.BooleanField(default=False)  # True when all members have accepted
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expense_date = models.DateTimeField()
    
    class Meta:
        db_table = 'expenses'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - ${self.amount} by {self.paid_by.full_name}"
    
    def get_involved_users(self):
        """Get all users involved in this expense (payer + splitters)"""
        splitter_ids = set(self.expense_splits.values_list('user_id', flat=True))
        splitter_ids.add(self.paid_by.id)
        return list(splitter_ids)
    
    def update_verification_status(self, user_id, status):
        """Update verification status for a user"""
        valid_statuses = ['accepted', 'pending', 'rejected']
        if status not in valid_statuses:
            raise ValueError(f"Status must be one of: {valid_statuses}")
        
        self.verification_status[str(user_id)] = status
        self.check_and_update_approval_status()
        self.save()
    
    def check_and_update_approval_status(self):
        """Check if all involved users have accepted and update is_approved"""
        involved_users = self.get_involved_users()
        
        # Check if any user has rejected
        for user_id in involved_users:
            status = self.verification_status.get(str(user_id), 'pending')
            if status == 'rejected':
                self.is_approved = False
                return
        
        # Check if all users have accepted
        all_accepted = True
        for user_id in involved_users:
            status = self.verification_status.get(str(user_id), 'pending')
            if status != 'accepted':
                all_accepted = False
                break
        
        self.is_approved = all_accepted
    
    def initialize_verification_status(self):
        """Initialize verification status for all involved users"""
        involved_users = self.get_involved_users()
        
        for user_id in involved_users:
            if user_id == self.paid_by.id:
                # Creator automatically accepts
                self.verification_status[str(user_id)] = 'accepted'
            else:
                # Others start as pending
                self.verification_status[str(user_id)] = 'pending'
        
        self.check_and_update_approval_status()
        self.save()
    
    def calculate_splits(self):
        """Calculate how much each person owes for this expense"""
        splits = []
        if self.split_type == 'equal':
            # Split equally among all participants
            participants = self.expense_splits.all()
            if participants.count() > 0:
                amount_per_person = self.amount / participants.count()
                for split in participants:
                    splits.append({
                        'user': split.user,
                        'amount': amount_per_person,
                        'paid': split.user == self.paid_by
                    })
        return splits


class ExpenseSplit(models.Model):
    """
    Model to track how an expense is split among users
    """
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='expense_splits')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='expense_splits')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    
    class Meta:
        db_table = 'expense_splits'
        unique_together = ('expense', 'user')
    
    def __str__(self):
        return f"{self.user.full_name} owes ${self.amount} for {self.expense.title}"


class Settlement(models.Model):
    """
    Model to track settlements/payments between users
    """
    SETTLEMENT_STATUS = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    
    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='payments_made'
    )
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='payments_received'
    )
    group = models.ForeignKey(
        'groups.Group', 
        on_delete=models.CASCADE, 
        related_name='settlements'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=SETTLEMENT_STATUS, default='pending')
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'settlements'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.from_user.full_name} pays ${self.amount} to {self.to_user.full_name}"
