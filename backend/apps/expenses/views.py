from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, Count
from django.utils import timezone
from collections import defaultdict
from decimal import Decimal
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
    
    # Use the debt calculation function to get accurate balances
    debt_response = calculate_user_debts(request)
    debt_data = debt_response.data
    
    user_owes = debt_data['total_owed_by_user']
    others_owe = debt_data['total_owed_to_user']
    net_balance = debt_data['net_balance']
    
    # Group count
    group_count = len(user_groups)
    
    return Response({
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.full_name,
        },
        'recent_expenses': ExpenseSerializer(recent_expenses, many=True).data,
        'user_owes': user_owes,
        'others_owe': others_owe,
        'net_balance': net_balance,
        'group_count': group_count,
        'total_expenses': recent_expenses.count(),
        'debts': debt_data['debts'],
        'settlements_received': debt_data['settlements_received']
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
    settlement.confirmed_at = timezone.now()
    settlement.save()
    
    return Response({'message': 'Settlement confirmed successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calculate_user_debts(request, group_id=None):
    """
    Calculate who owes whom in a specific group or across all groups
    """
    user = request.user
    
    if group_id:
        # Calculate debts for a specific group
        membership = GroupMembership.objects.filter(
            group_id=group_id, user=user, is_active=True
        ).first()
        
        if not membership:
            return Response(
                {'error': 'You are not a member of this group'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        expenses = Expense.objects.filter(group_id=group_id)
    else:
        # Calculate debts across all user's groups
        user_groups = GroupMembership.objects.filter(
            user=user, is_active=True
        ).values_list('group_id', flat=True)
        
        expenses = Expense.objects.filter(group_id__in=user_groups)
    
    # Calculate net balances between users
    balances = defaultdict(lambda: defaultdict(Decimal))
    
    for expense in expenses:
        paid_by = expense.paid_by
        expense_splits = expense.expense_splits.all()
        
        for split in expense_splits:
            ower = split.user
            amount = Decimal(str(split.amount))
            
            if ower != paid_by:
                # Person owes money to the payer
                balances[ower.id][paid_by.id] += amount
    
    # Calculate net balances (simplify debts)
    net_balances = defaultdict(lambda: defaultdict(Decimal))
    processed_pairs = set()
    
    for ower_id in balances:
        for payer_id in balances[ower_id]:
            pair = tuple(sorted([ower_id, payer_id]))
            if pair in processed_pairs:
                continue
            processed_pairs.add(pair)
            
            ower_to_payer = balances[ower_id][payer_id]
            payer_to_ower = balances[payer_id][ower_id]
            net_amount = ower_to_payer - payer_to_ower
            
            if net_amount > 0:
                net_balances[ower_id][payer_id] = net_amount
            elif net_amount < 0:
                net_balances[payer_id][ower_id] = abs(net_amount)
    
    # Convert to response format
    debts = []
    settlements_received = []
    
    # Get confirmed settlements to subtract from debts
    confirmed_settlements = Settlement.objects.filter(
        status='confirmed'
    )
    if group_id:
        confirmed_settlements = confirmed_settlements.filter(group_id=group_id)
    
    settlement_amounts = defaultdict(lambda: defaultdict(Decimal))
    for settlement in confirmed_settlements:
        settlement_amounts[settlement.from_user.id][settlement.to_user.id] += settlement.amount
    
    from apps.users.models import CustomUser
    
    for ower_id in net_balances:
        for payer_id in net_balances[ower_id]:
            amount = net_balances[ower_id][payer_id]
            # Subtract confirmed settlements
            settled_amount = settlement_amounts[ower_id][payer_id]
            remaining_amount = amount - settled_amount
            
            if remaining_amount > 0:
                ower = CustomUser.objects.get(id=ower_id)
                payer = CustomUser.objects.get(id=payer_id)
                
                if ower == user:
                    debts.append({
                        'id': payer_id,
                        'name': payer.full_name or f"{payer.first_name} {payer.last_name}".strip() or payer.email,
                        'email': payer.email,
                        'amount': float(remaining_amount),
                        'type': 'owes'  # User owes this person
                    })
                elif payer == user:
                    settlements_received.append({
                        'id': ower_id,
                        'name': ower.full_name or f"{ower.first_name} {ower.last_name}".strip() or ower.email,
                        'email': ower.email,
                        'amount': float(remaining_amount),
                        'type': 'owed'  # This person owes user
                    })
    
    return Response({
        'debts': debts,  # People user owes money to
        'settlements_received': settlements_received,  # People who owe user money
        'total_owed_by_user': sum(debt['amount'] for debt in debts),
        'total_owed_to_user': sum(settlement['amount'] for settlement in settlements_received),
        'net_balance': sum(settlement['amount'] for settlement in settlements_received) - sum(debt['amount'] for debt in debts)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_settlement(request):
    """
    Create a new settlement/payment
    """
    to_user_id = request.data.get('to_user_id')
    group_id = request.data.get('group_id')
    amount = request.data.get('amount')
    notes = request.data.get('notes', '')
    
    if not to_user_id or not amount:
        return Response(
            {'error': 'to_user_id and amount are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        amount = Decimal(str(amount))
        if amount <= 0:
            return Response(
                {'error': 'Amount must be positive'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except:
        return Response(
            {'error': 'Invalid amount format'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    from apps.users.models import CustomUser
    from apps.groups.models import Group
    
    try:
        to_user = CustomUser.objects.get(id=to_user_id)
    except CustomUser.DoesNotExist:
        return Response(
            {'error': 'Recipient user not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    group = None
    if group_id:
        try:
            group = Group.objects.get(id=group_id)
            # Check if both users are members of the group
            if not GroupMembership.objects.filter(group=group, user=request.user, is_active=True).exists():
                return Response(
                    {'error': 'You are not a member of this group'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            if not GroupMembership.objects.filter(group=group, user=to_user, is_active=True).exists():
                return Response(
                    {'error': 'Recipient is not a member of this group'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        except Group.DoesNotExist:
            return Response(
                {'error': 'Group not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    # Create settlement
    settlement = Settlement.objects.create(
        from_user=request.user,
        to_user=to_user,
        group=group,
        amount=amount,
        notes=notes,
        status='confirmed'  # For now, auto-confirm settlements
    )
    
    return Response({
        'id': settlement.id,
        'message': 'Settlement created successfully',
        'settlement': SettlementSerializer(settlement).data
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_settlement_history(request):
    """
    Get user's settlement history
    """
    settlements = Settlement.objects.filter(
        Q(from_user=request.user) | Q(to_user=request.user)
    ).order_by('-created_at')
    
    return Response(SettlementSerializer(settlements, many=True).data)
