import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Button, TextInput, Card, Searchbar, Checkbox, Avatar, Chip } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ArrowLeft, Users, Search, UserPlus } from 'lucide-react-native';
import { apiService } from '../services/api';

type RootStackParamList = {
  createGroup: undefined;
  groups: undefined;
  success: { 
    message: string;
    nextScreen?: string;
  };
};

type CreateGroupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'createGroup'>;
type CreateGroupScreenRouteProp = RouteProp<RootStackParamList, 'createGroup'>;

interface CreateGroupScreenProps {
  navigation: CreateGroupScreenNavigationProp;
  route: CreateGroupScreenRouteProp;
}

interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
}

export function CreateGroupScreen({ navigation }: CreateGroupScreenProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    // Always exclude current user from selectable list
    let filtered = users.filter(user => user.id !== currentUser?.id);
    
    // Apply search filter if there's a search query
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(user => {
        const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
        const email = user.email || '';
        
        return (
          fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }
    
    setFilteredUsers(filtered);
  }, [searchQuery, users, currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const result = await apiService.getCurrentUser();
      console.log('Current user fetch result:', result);
      if (result.success && result.data) {
        setCurrentUser(result.data);
        console.log('Current user set to:', result.data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const result = await apiService.getUsers();
      
      if (result.success) {
        console.log('Users fetched for group creation:', result.data);
        setUsers(result.data);
      } else {
        console.error('Failed to fetch users:', result.error);
        Alert.alert('Error', 'Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleMemberSelection = (userId: number) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const getSelectedMemberNames = () => {
    return users
      .filter(user => selectedMembers.has(user.id))
      .map(user => user.full_name || user.first_name || user.email);
  };

  const handleCreateGroup = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      // Get emails of selected members (excluding current user since they're automatically included)
      const memberEmails = users
        .filter(user => selectedMembers.has(user.id))
        .map(user => user.email);

      // Automatically include current user in the group
      if (currentUser?.email) {
        memberEmails.push(currentUser.email);
      }

      console.log('Selected members:', Array.from(selectedMembers));
      console.log('Member emails to send (including current user):', memberEmails);

      // Create group with members in one API call
      const groupData = {
        name: name.trim(),
        description: description.trim() || null,
        member_emails: memberEmails // Use the backend's member_emails field
      };

      console.log('Sending group data:', groupData);

      const result = await apiService.createGroup(groupData);
      console.log('API response:', result);

      if (result.success) {
        console.log('Group created successfully:', result.data);
        
        // Reset form
        setName('');
        setDescription('');
        setSelectedMembers(new Set());
        setSearchQuery('');
        
        // Navigate to success screen with group creation message
        const totalMembers = selectedMembers.size + 1; // +1 for current user
        navigation.navigate('success', {
          message: `Group "${name}" has been created successfully with ${totalMembers} members!`,
          nextScreen: 'groups'
        });
      } else {
        console.error('Group creation failed:', result.error);
        
        // Show more detailed error information
        let errorMessage = result.error || 'Failed to create group';
        if (typeof result.error === 'object') {
          errorMessage = JSON.stringify(result.error);
        }
        
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Create group exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to create group: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Group</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.formCard}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Users size={32} color="#3b82f6" />
            </View>
            
            <Text style={styles.formTitle}>New Group</Text>
            <Text style={styles.formSubtitle}>
              Create a group to split expenses with friends and family. You'll automatically be added as a member.
            </Text>

            <View style={styles.form}>
              <TextInput
                label="Group Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                placeholder="Enter group name"
                maxLength={100}
              />

              <TextInput
                label="Description (Optional)"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
                placeholder="What's this group for?"
                maxLength={500}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Members Selection */}
        <Card style={styles.membersCard}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.membersHeader}>
              <View style={styles.membersHeaderContent}>
                <UserPlus size={20} color="#3b82f6" />
                <Text style={styles.membersTitle}>Add Members</Text>
              </View>
              {selectedMembers.size >= 0 && (
                <Chip mode="outlined" style={styles.selectedChip}>
                  {selectedMembers.size + 1} total
                </Chip>
              )}
            </View>

            {/* Search */}
            <Searchbar
              placeholder="Search users by name or email..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              inputStyle={styles.searchInput}
              icon={() => <Search size={20} color="#6b7280" />}
            />

            {/* Group Members Section - Always show current user + selected members */}
            <View style={styles.selectedMembersContainer}>
              <Text style={styles.selectedMembersTitle}>Group Members:</Text>
              <View style={styles.selectedMembersTags}>
                {/* Current user (always included) */}
                <Chip key="current-user" mode="flat" style={styles.currentUserChip}>
                  {currentUser?.full_name || currentUser?.first_name || currentUser?.email || 'You'} (You)
                </Chip>
                {/* Selected members */}
                {getSelectedMemberNames().map((name, index) => (
                  <Chip key={index} mode="flat" style={styles.selectedMemberChip}>
                    {name}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Users List */}
            <View style={styles.usersList}>
              {loadingUsers ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading users...</Text>
                </View>
              ) : filteredUsers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No users found matching your search' : 'No other users available'}
                  </Text>
                </View>
              ) : (
                filteredUsers.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.userItem,
                      selectedMembers.has(user.id) && styles.selectedUserItem
                    ]}
                    onPress={() => toggleMemberSelection(user.id)}
                  >
                    <View style={styles.userInfo}>
                      <Avatar.Text
                        size={40}
                        label={(user.full_name || user.first_name || user.email).charAt(0).toUpperCase()}
                        style={styles.userAvatar}
                      />
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>
                          {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
                        </Text>
                        <Text style={styles.userEmail}>{user.email}</Text>
                      </View>
                    </View>
                    <Checkbox
                      status={selectedMembers.has(user.id) ? 'checked' : 'unchecked'}
                      onPress={() => toggleMemberSelection(user.id)}
                    />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleCreateGroup}
            loading={loading}
            disabled={loading || !name.trim()}
            style={styles.createButton}
            contentStyle={styles.buttonContent}
          >
            {loading ? 'Creating...' : `Create Group${selectedMembers.size > 0 ? ` with ${selectedMembers.size + 1} members` : ' (just you)'}`}
          </Button>

          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            disabled={loading}
            style={styles.cancelButton}
            contentStyle={styles.buttonContent}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  formCard: {
    elevation: 2,
    marginBottom: 16,
  },
  membersCard: {
    elevation: 2,
    marginBottom: 16,
  },
  cardContent: {
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#fff',
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  membersHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  selectedChip: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  searchBar: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    fontSize: 16,
  },
  selectedMembersContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  selectedMembersTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e40af',
    marginBottom: 8,
  },
  selectedMembersTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedMemberChip: {
    backgroundColor: '#3b82f6',
  },
  currentUserChip: {
    backgroundColor: '#10b981',
  },
  usersList: {
    gap: 8,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedUserItem: {
    backgroundColor: '#f0f9ff',
    borderColor: '#3b82f6',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    backgroundColor: '#e5e7eb',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  buttonContainer: {
    gap: 12,
  },
  createButton: {
    backgroundColor: '#3b82f6',
  },
  cancelButton: {
    borderColor: '#d1d5db',
  },
  buttonContent: {
    height: 48,
  },
});