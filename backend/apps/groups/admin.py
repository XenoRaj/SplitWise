from django.contrib import admin
from .models import Group, GroupMembership

class GroupMembershipInline(admin.TabularInline):
    model = GroupMembership
    extra = 0
    readonly_fields = ('joined_at',)

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'member_count', 'total_expenses', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at', 'updated_at')
    search_fields = ('name', 'description', 'created_by__email')
    readonly_fields = ('created_at', 'updated_at', 'total_expenses', 'member_count')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    inlines = [GroupMembershipInline]
    
    fieldsets = (
        (None, {'fields': ('name', 'description', 'created_by')}),
        ('Settings', {'fields': ('is_active', 'group_image')}),
        ('Stats', {'fields': ('member_count', 'total_expenses')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )

@admin.register(GroupMembership)
class GroupMembershipAdmin(admin.ModelAdmin):
    list_display = ('group', 'user', 'is_admin', 'is_active', 'joined_at')
    list_filter = ('is_admin', 'is_active', 'joined_at')
    search_fields = ('group__name', 'user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('joined_at',)
    ordering = ('-joined_at',)
    
    fieldsets = (
        (None, {'fields': ('group', 'user')}),
        ('Permissions', {'fields': ('is_admin', 'is_active')}),
        ('Timestamps', {'fields': ('joined_at',)}),
    )
