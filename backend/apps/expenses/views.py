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
def group_balance_summary(request, group_id):
    """Get user's balance summary for a specific group"""
    user = request.user
    
    # Check if user is member of the group
    from apps.groups.models import GroupMembership
    membership = GroupMembership.objects.filter(
        group_id=group_id, user=user, is_active=True
    ).first()
    
    if not membership:
        return Response(
            {'error': 'You are not a member of this group'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Calculate balances from expense splits for this group
    user_splits = ExpenseSplit.objects.filter(
        user=user,
        expense__group_id=group_id
    ).select_related('expense')
    
    total_user_owes = 0  # What user owes to others
    total_owed_to_user = 0  # What others owe to user
    
    # Group by who user owes money to
    balances = defaultdict(Decimal)
    
    for split in user_splits:
        expense = split.expense
        if expense.paid_by != user:
            # User owes money to the person who paid
            balances[expense.paid_by.id] += split.amount
            total_user_owes += float(split.amount)
        else:
            # User paid, others in this expense owe to user
            other_splits = ExpenseSplit.objects.filter(
                expense=expense
            ).exclude(user=user)
            
            for other_split in other_splits:
                balances[other_split.user.id] -= other_split.amount
                total_owed_to_user += float(other_split.amount)
    
    # Calculate net balance (positive = others owe you, negative = you owe others)
    net_balance = total_owed_to_user - total_user_owes
    
    # Get total group expenses
    group_expenses = Expense.objects.filter(group_id=group_id)
    total_group_expenses = sum(float(exp.amount) for exp in group_expenses)
    
    return Response({
        'group_id': group_id,
        'total_expenses': total_group_expenses,
        'user_balance': net_balance,
        'total_user_owes': total_user_owes,
        'total_owed_to_user': total_owed_to_user,
        'net_status': 'owed_to_you' if net_balance > 0 else 'you_owe' if net_balance < 0 else 'settled'
    })


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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def settlement_summary(request):
    """Get user's settlement summary - who owes what to whom"""
    user = request.user
    
    # Calculate balances from expense splits
    user_splits = ExpenseSplit.objects.filter(user=user).select_related('expense')
    
    # Group by other users to calculate net amounts
    balances = defaultdict(Decimal)
    
    for split in user_splits:
        expense = split.expense
        if expense.paid_by != user:
            # User owes money to the person who paid
            balances[expense.paid_by.id] += split.amount
        else:
            # User paid, others owe to user
            other_splits = ExpenseSplit.objects.filter(
                expense=expense
            ).exclude(user=user)
            
            for other_split in other_splits:
                balances[other_split.user.id] -= other_split.amount
    
    # Convert to list format with user details
    summary = []
    for user_id, amount in balances.items():
        if amount != 0:  # Only include non-zero balances
            from apps.users.models import CustomUser
            other_user = CustomUser.objects.get(id=user_id)
            summary.append({
                'user_id': user_id,
                'user_name': other_user.get_full_name(),
                'user_email': other_user.email,
                'amount': float(amount),
                'type': 'owes_to_them' if amount > 0 else 'owes_to_you'
            })
    
    return Response({
        'summary': summary,
        'total_owed_by_you': sum(float(amt) for amt in balances.values() if amt > 0),
        'total_owed_to_you': sum(float(abs(amt)) for amt in balances.values() if amt < 0)
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_payment(request):
    """Process a payment (dummy implementation)"""
    
    # Extract payment data
    receiver_id = request.data.get('receiver_id')
    amount = request.data.get('amount')
    payment_method = request.data.get('payment_method')
    note = request.data.get('note', '')
    
    if not all([receiver_id, amount, payment_method]):
        return Response({
            'error': 'receiver_id, amount, and payment_method are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        amount = Decimal(str(amount))
        if amount <= 0:
            return Response({
                'error': 'Amount must be positive'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # Get receiver user
        from apps.users.models import CustomUser
        receiver = CustomUser.objects.get(id=receiver_id)
        
        # Simulate payment processing delay
        import time
        import random
        
        # Simulate different payment methods with different processing times
        processing_time = {
            'cash': 0.1,    # Instant for cash
            'upi': 0.3,     # Fast UPI transaction
            'venmo': 0.5,
            'paypal': 0.8,
            'bank': 1.2,
            'zelle': 0.3
        }.get(payment_method, 0.5)
        
        time.sleep(processing_time)
        
        # Simulate 95% success rate
        if random.random() < 0.95:
            # Create settlement record - but Settlement model requires group field
            # For now, let's create a simpler response without database storage
            # until we modify the Settlement model or create a separate Payment model
            
            import uuid
            transaction_id = str(uuid.uuid4())[:12].upper()
            
            # Create a simple payment record and track payments made
            from django.utils import timezone
            from datetime import datetime
            
            # For now, let's update the expense splits to reflect the payment
            # Find expenses where current user owes money to the receiver
            user_splits = ExpenseSplit.objects.filter(
                user=request.user,
                expense__paid_by=receiver
            ).select_related('expense')
            
            remaining_amount = amount
            payments_made = []
            
            # Actually update the database - reduce split amounts
            for split in user_splits:
                if remaining_amount <= 0:
                    break
                    
                # Calculate how much of this split we can pay
                split_amount = min(remaining_amount, split.amount)
                
                # Update the split amount in database
                split.amount -= split_amount
                split.save()
                
                # Create a payment record
                payments_made.append({
                    'expense_id': split.expense.id,
                    'expense_title': split.expense.title,
                    'original_amount': float(split.amount + split_amount),
                    'amount_paid': float(split_amount),
                    'remaining_amount': float(split.amount)
                })
                
                # Reduce the remaining amount
                remaining_amount -= split_amount
                
                # If split is fully paid, it will now show 0 in future settlements
                print(f"Updated split for expense {split.expense.title}: paid {split_amount}, remaining {split.amount}")
            
            return Response({
                'success': True,
                'transaction_id': transaction_id,
                'amount': float(amount),
                'receiver': receiver.get_full_name(),
                'payment_method': payment_method,
                'processing_time': int(processing_time * 1000),  # Convert to milliseconds
                'processed_at': datetime.now().isoformat(),
                'status': 'completed',
                'payments_made': payments_made,
                'note': note,
                'message': f'Payment of ₹{amount} sent successfully to {receiver.get_full_name()} via {payment_method.title()}'
            })
        else:
            # Simulate payment failure
            return Response({
                'success': False,
                'error': 'Payment processing failed. Please try again.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except CustomUser.DoesNotExist:
        return Response({
            'error': 'Receiver not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except (ValueError, TypeError):
        return Response({
            'error': 'Invalid amount'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'Payment processing error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
