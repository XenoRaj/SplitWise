from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Group, GroupMembership
from .serializers import GroupSerializer, GroupCreateSerializer, AddMemberSerializer
from apps.users.models import CustomUser


class GroupListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return GroupCreateSerializer
        return GroupSerializer
    
    def get_queryset(self):
        # Return groups where user is a member
        return Group.objects.filter(
            group_memberships__user=self.request.user,
            group_memberships__is_active=True,
            is_active=True
        ).distinct()


class GroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Group.objects.filter(
            group_memberships__user=self.request.user,
            group_memberships__is_active=True,
            is_active=True
        ).distinct()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_member_to_group(request, group_id):
    group = get_object_or_404(Group, id=group_id)
    
    # Check if user is admin of the group
    membership = GroupMembership.objects.filter(
        group=group, user=request.user, is_admin=True, is_active=True
    ).first()
    
    if not membership:
        return Response(
            {'error': 'You do not have permission to add members to this group'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = AddMemberSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    email = serializer.validated_data['email']
    is_admin = serializer.validated_data['is_admin']
    
    try:
        user = CustomUser.objects.get(email=email)
        membership, created = GroupMembership.objects.get_or_create(
            group=group,
            user=user,
            defaults={'is_admin': is_admin}
        )
        
        if not created:
            if membership.is_active:
                return Response(
                    {'error': 'User is already a member of this group'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                # Reactivate membership
                membership.is_active = True
                membership.is_admin = is_admin
                membership.save()
        
        return Response({'message': f'User {email} added to group successfully'})
        
    except CustomUser.DoesNotExist:
        return Response(
            {'error': 'User with this email does not exist'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_member_from_group(request, group_id, user_id):
    group = get_object_or_404(Group, id=group_id)
    
    # Check if requester is admin or removing themselves
    requester_membership = GroupMembership.objects.filter(
        group=group, user=request.user, is_active=True
    ).first()
    
    if not requester_membership:
        return Response(
            {'error': 'You are not a member of this group'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    if str(request.user.id) != user_id and not requester_membership.is_admin:
        return Response(
            {'error': 'You do not have permission to remove members from this group'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    membership = get_object_or_404(
        GroupMembership, 
        group=group, 
        user_id=user_id, 
        is_active=True
    )
    
    membership.is_active = False
    membership.save()
    
    return Response({'message': 'Member removed from group successfully'})
