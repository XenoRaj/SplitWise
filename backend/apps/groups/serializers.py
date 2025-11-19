from rest_framework import serializers
from .models import Group, GroupMembership
from apps.users.serializers import UserSerializer


class GroupMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = GroupMembership
        fields = ('user', 'joined_at', 'is_admin', 'is_active')


class GroupSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    group_memberships = GroupMemberSerializer(many=True, read_only=True)
    member_count = serializers.ReadOnlyField()
    total_expenses = serializers.ReadOnlyField()
    
    class Meta:
        model = Group
        fields = ('id', 'name', 'description', 'created_by', 'group_image',
                 'created_at', 'updated_at', 'is_active', 'member_count',
                 'total_expenses', 'group_memberships')
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user
        group = super().create(validated_data)
        
        # Add the creator as an admin member
        GroupMembership.objects.create(
            group=group,
            user=request.user,
            is_admin=True
        )
        return group


class GroupCreateSerializer(serializers.ModelSerializer):
    member_emails = serializers.ListField(
        child=serializers.EmailField(),
        write_only=True,
        required=False,
        help_text="List of email addresses to add as members"
    )
    
    class Meta:
        model = Group
        fields = ('name', 'description', 'group_image', 'member_emails')

    def create(self, validated_data):
        member_emails = validated_data.pop('member_emails', [])
        request = self.context.get('request')
        validated_data['created_by'] = request.user
        
        group = super().create(validated_data)
        
        # Add creator as admin
        GroupMembership.objects.create(
            group=group,
            user=request.user,
            is_admin=True
        )
        
        # Add members by email
        from apps.users.models import CustomUser
        for email in member_emails:
            try:
                user = CustomUser.objects.get(email=email)
                GroupMembership.objects.get_or_create(
                    group=group,
                    user=user,
                    defaults={'is_admin': False}
                )
            except CustomUser.DoesNotExist:
                pass  # Silently skip non-existent users
        
        return group


class AddMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
    is_admin = serializers.BooleanField(default=False)

    def validate_email(self, value):
        from apps.users.models import CustomUser
        try:
            user = CustomUser.objects.get(email=value)
            return value
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist")