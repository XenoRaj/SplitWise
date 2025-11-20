from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, Count
from .models import Expense, ExpenseSplit, Settlement
from .serializers import (
    ExpenseSerializer, ExpenseCreateSerializer, 
    SettlementSerializer, SettlementCreateSerializer
)
from apps.groups.models import GroupMembership


class ExpenseListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ExpenseCreateSerializer
        return ExpenseSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Return expenses from groups where user is a member OR personal expenses
        user_groups = GroupMembership.objects.filter(
            user=user, is_active=True
        ).values_list('group_id', flat=True)
        
        return Expense.objects.filter(
            Q(group_id__in=user_groups) |  # Group expenses where user is member
            Q(group__isnull=True, paid_by=user) |  # Personal expenses by user
            Q(expense_splits__user=user)  # Expenses where user is involved in splits
        ).distinct().order_by('-created_at')


class ExpenseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        user_groups = GroupMembership.objects.filter(
            user=user, is_active=True
        ).values_list('group_id', flat=True)
        
        return Expense.objects.filter(
            Q(group_id__in=user_groups) |  # Group expenses where user is member
            Q(group__isnull=True, paid_by=user) |  # Personal expenses by user  
            Q(expense_splits__user=user)  # Expenses where user is involved in splits
        ).distinct()


class SettlementListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SettlementCreateSerializer
        return SettlementSerializer
    
    def get_queryset(self):
        return Settlement.objects.filter(
            Q(from_user=self.request.user) | Q(to_user=self.request.user)
        ).order_by('-created_at')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_dashboard_summary(request):
    user = request.user
    
    # Get user's groups
    user_groups = GroupMembership.objects.filter(
        user=user, is_active=True
    ).values_list('group_id', flat=True)
    
    # Get recent expenses (both group and personal expenses where user is involved)
    recent_expenses = Expense.objects.filter(
        Q(group_id__in=user_groups) |  # Group expenses where user is member
        Q(group__isnull=True, paid_by=user) |  # Personal expenses paid by user
        Q(expense_splits__user=user)  # Any expenses where user has splits
    ).distinct().order_by('-created_at')[:5]
    
    # Calculate what user owes (expenses paid by others where user has a split)
    user_owes = ExpenseSplit.objects.filter(
        user=user
    ).exclude(
        expense__paid_by=user
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Calculate what others owe user (expenses paid by user where others have splits)
    others_owe = ExpenseSplit.objects.filter(
        expense__paid_by=user
    ).exclude(
        user=user
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Net balance (positive means others owe you, negative means you owe others)
    net_balance = others_owe - user_owes
    
    # Group count
    group_count = len(user_groups)
    
    return Response({
        'recent_expenses': ExpenseSerializer(recent_expenses, many=True).data,
        'user_owes': user_owes,
        'others_owe': others_owe,
        'net_balance': net_balance,
        'group_count': group_count,
        'total_expenses': recent_expenses.count()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def group_expenses(request, group_id):
    print(f"=== GROUP EXPENSES API ===")
    print(f"Requested group_id: {group_id}")
    print(f"Requesting user: {request.user.id}")
    
    # Check if user is member of the group
    membership = GroupMembership.objects.filter(
        group_id=group_id, user=request.user, is_active=True
    ).first()
    
    if not membership:
        print(f"User {request.user.id} is not a member of group {group_id}")
        return Response(
            {'error': 'You are not a member of this group'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    expenses = Expense.objects.filter(group_id=group_id).order_by('-created_at')
    print(f"Found {expenses.count()} expenses for group {group_id}")
    for expense in expenses:
        print(f"- Expense: {expense.title}, Amount: {expense.amount}, Group ID: {expense.group_id}")
    print("=========================")
    
    return Response(ExpenseSerializer(expenses, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_settlement(request, settlement_id):
    settlement = get_object_or_404(Settlement, id=settlement_id)
    
    # Only the recipient can confirm the settlement
    if settlement.to_user != request.user:
        return Response(
            {'error': 'You can only confirm settlements made to you'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    if settlement.status == 'confirmed':
        return Response(
            {'error': 'Settlement is already confirmed'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    settlement.status = 'confirmed'
    settlement.save()
    
    return Response({'message': 'Settlement confirmed successfully'})
