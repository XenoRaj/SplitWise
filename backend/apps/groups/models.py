from django.db import models
from django.conf import settings


class Group(models.Model):
    """
    Group model for splitting expenses among multiple users
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='created_groups'
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        through='GroupMembership', 
        related_name='user_groups'
    )
    group_image = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'groups'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    @property
    def total_expenses(self):
        """Calculate total expenses for this group"""
        return self.expenses.aggregate(
            total=models.Sum('amount')
        )['total'] or 0
    
    @property
    def member_count(self):
        """Get number of active members in the group"""
        return self.group_memberships.filter(is_active=True).count()


class GroupMembership(models.Model):
    """
    Through model for Group-User relationship with additional fields
    """
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='group_memberships')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='group_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)
    is_admin = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'group_memberships'
        unique_together = ('group', 'user')
        ordering = ['-joined_at']
    
    def __str__(self):
        return f"{self.user.full_name} in {self.group.name}"
