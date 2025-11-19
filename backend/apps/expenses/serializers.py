from rest_framework import serializers
from .models import Expense, ExpenseSplit, Settlement
from apps.users.serializers import UserSerializer
from apps.groups.serializers import GroupSerializer


class ExpenseSplitSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = ExpenseSplit
        fields = ('id', 'user', 'user_id', 'amount', 'percentage')
        extra_kwargs = {
            'percentage': {'required': False, 'allow_null': True}
        }


class ExpenseSerializer(serializers.ModelSerializer):
    paid_by = UserSerializer(read_only=True)
    group = GroupSerializer(read_only=True)
    expense_splits = ExpenseSplitSerializer(many=True, read_only=True)
    
    class Meta:
        model = Expense
        fields = ('id', 'title', 'description', 'amount', 'currency', 
                 'paid_by', 'group', 'split_type', 'receipt_image',
                 'created_at', 'updated_at', 'expense_date', 'expense_splits')
        read_only_fields = ('id', 'created_at', 'updated_at', 'paid_by', 'group')


class ExpenseCreateSerializer(serializers.ModelSerializer):
    group_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    splits = ExpenseSplitSerializer(many=True, write_only=True, required=False)
    
    class Meta:
        model = Expense
        fields = ('title', 'description', 'amount', 'currency', 'group_id',
                 'split_type', 'receipt_image', 'expense_date', 'splits')

    def validate_group_id(self, value):
        if value is None:
            return None
            
        from apps.groups.models import Group, GroupMembership
        request = self.context.get('request')
        
        try:
            group = Group.objects.get(id=value)
            # Check if user is a member of the group
            if not GroupMembership.objects.filter(
                group=group, user=request.user, is_active=True
            ).exists():
                raise serializers.ValidationError("You are not a member of this group")
            return value
        except Group.DoesNotExist:
            raise serializers.ValidationError("Group does not exist")

    def create(self, validated_data):
        splits_data = validated_data.pop('splits', [])
        group_id = validated_data.pop('group_id', None)
        request = self.context.get('request')
        
        print(f"Creating expense with data: {validated_data}")
        print(f"Splits data: {splits_data}")
        print(f"Group ID: {group_id}")
        
        group = None
        if group_id:
            from apps.groups.models import Group
            group = Group.objects.get(id=group_id)
        
        expense = Expense.objects.create(
            paid_by=request.user,
            group=group,
            **validated_data
        )
        
        # Create splits
        if splits_data:
            for split_data in splits_data:
                print(f"Creating split: {split_data}")
                ExpenseSplit.objects.create(expense=expense, **split_data)
        elif group and validated_data.get('split_type') == 'equal':
            # Create equal splits for all group members
            from apps.groups.models import GroupMembership
            members = GroupMembership.objects.filter(group=group, is_active=True)
            amount_per_person = expense.amount / members.count()
            
            for membership in members:
                ExpenseSplit.objects.create(
                    expense=expense,
                    user=membership.user,
                    amount=amount_per_person
                )
        
        return expense


class SettlementSerializer(serializers.ModelSerializer):
    from_user = UserSerializer(read_only=True)
    to_user = UserSerializer(read_only=True)
    group = GroupSerializer(read_only=True)
    
    class Meta:
        model = Settlement
        fields = ('id', 'from_user', 'to_user', 'group', 'amount', 'currency',
                 'status', 'notes', 'created_at', 'confirmed_at')
        read_only_fields = ('id', 'created_at', 'confirmed_at')


class SettlementCreateSerializer(serializers.ModelSerializer):
    to_user_id = serializers.IntegerField(write_only=True)
    group_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Settlement
        fields = ('to_user_id', 'group_id', 'amount', 'currency', 'notes')

    def create(self, validated_data):
        to_user_id = validated_data.pop('to_user_id')
        group_id = validated_data.pop('group_id')
        request = self.context.get('request')
        
        from apps.users.models import CustomUser
        from apps.groups.models import Group
        
        to_user = CustomUser.objects.get(id=to_user_id)
        group = Group.objects.get(id=group_id)
        
        settlement = Settlement.objects.create(
            from_user=request.user,
            to_user=to_user,
            group=group,
            **validated_data
        )
        
        return settlement