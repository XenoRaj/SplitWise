from django.contrib import admin
from .models import Expense, ExpenseSplit, Settlement

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'amount', 'currency', 'paid_by', 'group', 'split_type', 'expense_date')
    list_filter = ('split_type', 'currency', 'expense_date', 'created_at')
    search_fields = ('title', 'description', 'paid_by__email', 'group__name')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'expense_date'
    ordering = ('-expense_date',)
    
    fieldsets = (
        (None, {'fields': ('title', 'description', 'amount', 'currency')}),
        ('Payment Info', {'fields': ('paid_by', 'group', 'split_type')}),
        ('Dates', {'fields': ('expense_date', 'created_at', 'updated_at')}),
        ('Additional', {'fields': ('receipt_image',)}),
    )

@admin.register(ExpenseSplit)
class ExpenseSplitAdmin(admin.ModelAdmin):
    list_display = ('expense', 'user', 'amount', 'percentage')
    list_filter = ('expense__split_type', 'expense__expense_date')
    search_fields = ('expense__title', 'user__email', 'user__first_name', 'user__last_name')
    ordering = ('-expense__expense_date',)

@admin.register(Settlement)
class SettlementAdmin(admin.ModelAdmin):
    list_display = ('from_user', 'to_user', 'amount', 'currency', 'status', 'group', 'created_at')
    list_filter = ('status', 'currency', 'created_at', 'confirmed_at')
    search_fields = ('from_user__email', 'to_user__email', 'group__name')
    readonly_fields = ('created_at', 'confirmed_at')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    
    fieldsets = (
        (None, {'fields': ('from_user', 'to_user', 'amount', 'currency')}),
        ('Details', {'fields': ('group', 'status', 'notes')}),
        ('Timestamps', {'fields': ('created_at', 'confirmed_at')}),
    )
