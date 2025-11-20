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
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expense_date = models.DateTimeField()
    
    class Meta:
        db_table = 'expenses'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - ${self.amount} by {self.paid_by.full_name}"
    
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
