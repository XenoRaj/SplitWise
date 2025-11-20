import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { Button, Card, Avatar, Checkbox, Chip } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ArrowLeft, Shield, Camera, Users, DollarSign } from 'lucide-react-native';
import { apiService } from '../services/api';
import type { User } from '../App';

type RootStackParamList = {
  'add-expense': { groupId?: number } | undefined;
  dashboard: undefined;
  success: { 
    message: string;
    nextScreen?: string;
    groupData?: any;
  };
  'group-details': { group: any };
  // Add other screens...
};

type AddExpenseScreenNavigationProp = StackNavigationProp<RootStackParamList, 'add-expense'>;
type AddExpenseScreenRouteProp = RouteProp<RootStackParamList, 'add-expense'>;

interface AddExpenseScreenProps {
  navigation: AddExpenseScreenNavigationProp;
  route: AddExpenseScreenRouteProp;
  user: User | null;
  showLoading: (callback: () => void) => void;
}

export function AddExpenseScreen({ navigation, route, user, showLoading }: AddExpenseScreenProps) {
  // Use multiple methods to get the groupId parameter
  const currentRoute = useRoute();
  const navigationState = navigation.getState();
  
  console.log('=== NAVIGATION DEBUG ===');
  console.log('currentRoute.params:', currentRoute.params);
  console.log('route.params:', route?.params);
  console.log('navigation state routes:', navigationState.routes);
  console.log('current route index:', navigationState.index);
  console.log('current route from state:', navigationState.routes[navigationState.index]);
  console.log('=====================');
  
  // Extract groupId with multiple fallbacks
  const groupIdFromUseRoute = (currentRoute.params as any)?.groupId;
  const groupIdFromRouteProp = (route?.params as any)?.groupId;
  const currentRouteFromState = navigationState.routes[navigationState.index];
  const groupIdFromNavigationState = (currentRouteFromState?.params as any)?.groupId;
  
  const groupId = groupIdFromUseRoute || groupIdFromRouteProp || groupIdFromNavigationState;
  
  console.log('=== EXTRACTED GROUP ID ===');
  console.log('groupIdFromUseRoute:', groupIdFromUseRoute);
  console.log('groupIdFromRouteProp:', groupIdFromRouteProp);
  console.log('groupIdFromNavigationState:', groupIdFromNavigationState);
  console.log('Final groupId:', groupId);
  console.log('Type:', typeof groupId);
  console.log('========================');
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    splitType: 'equal',
    groupId: groupId || null
  });
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [groupData, setGroupData] = useState<any>(null);

  useEffect(() => {
    fetchCurrentUserAndUsers();
  }, []);

  const fetchCurrentUserAndUsers = async () => {
    try {
      setLoading(true);
      
      // First get the current user from dashboard API
      const dashboardResult = await apiService.getDashboardData();
      if (dashboardResult.success && dashboardResult.data.user) {
        setCurrentUser(dashboardResult.data.user);
        console.log('Current user from dashboard:', dashboardResult.data.user);
        
        // If groupId is provided, fetch group details to get members
        if (groupId) {
          const groupResult = await apiService.getGroup(groupId);
          if (groupResult.success) {
            setGroupData(groupResult.data);
            console.log('Group data:', groupResult.data);
            
            // Extract user data from group memberships, excluding current user
            const groupMembers = groupResult.data.group_memberships?.filter((membership: any) => 
              membership.user.id !== dashboardResult.data.user.id
            ).map((membership: any) => ({
              id: membership.user.id,
              email: membership.user.email,
              first_name: membership.user.first_name,
              last_name: membership.user.last_name,
              full_name: membership.user.full_name,
              username: membership.user.username
            })) || [];
            
            console.log('Group members (excluding current user):', groupMembers);
            setUsers(groupMembers);
            setError('');
          } else {
            setError('Failed to fetch group details');
          }
        } else {
          // For personal expenses, get all users and filter out current user
          const usersResult = await apiService.getUsers();
          if (usersResult.success) {
            console.log('All users:', usersResult.data);
            const otherUsers = usersResult.data.filter((u: any) => {
              return u.id !== dashboardResult.data.user.id && u.id != dashboardResult.data.user.id;
            });
            console.log('Other users after filtering:', otherUsers);
            setUsers(otherUsers);
            setError('');
          } else {
            setError(usersResult.error);
          }
        }
      } else {
        setError('Failed to get current user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: any) => {
    const userIdStr = userId.toString();
    setSelectedMembers(prev => {
      if (prev.includes(userIdStr)) {
        return prev.filter(id => id !== userIdStr);
      } else {
        return [...prev, userIdStr];
      }
    });
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const categories = [
    'Food & Dining',
    'Transportation',
    'Entertainment',
    'Shopping',
    'Utilities',
    'Travel',
    'Healthcare',
    'Other'
  ];

  const handleAddExpense = async () => {
    if (!formData.title || !formData.amount) {
      setError('Please fill in title and amount');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    // Allow expenses without splits (personal expenses)
    if (selectedMembers.length === 0) {
      // Personal expense - only the current user
      console.log('Creating personal expense');
    }

    try {
      setSubmitting(true);
      setError('');

      // Create expense data for API
      const totalAmount = parseFloat(formData.amount);
      const numberOfPeople = selectedMembers.length + 1; // Including current user
      
      // Calculate splits with proper rounding to avoid decimal precision issues
      // Convert to cents for calculation, then back to dollars
      const totalCents = Math.round(totalAmount * 100);
      const baseSplitCents = Math.floor(totalCents / numberOfPeople);
      const remainderCents = totalCents % numberOfPeople; // Use modulo for exact remainder
      
      // Use Number() with toFixed() for exact decimal control
      const baseSplitAmount = Number((baseSplitCents / 100).toFixed(2));
      const creatorAmount = Number(((baseSplitCents + remainderCents) / 100).toFixed(2));
      
      console.log('Split calculation:', {
        totalAmount,
        totalCents,
        numberOfPeople,
        baseSplitCents,
        remainderCents,
        baseSplitAmount,
        creatorAmount,
        totalCheck: (baseSplitAmount * (numberOfPeople - 1)) + creatorAmount
      });
      
      console.log('=== Expense Creation Debug ===');
      console.log('Current groupId value:', groupId);
      console.log('groupId type:', typeof groupId);
      console.log('groupId || null result:', groupId || null);
      
      const expenseData = {
        title: formData.title,
        description: formData.description,
        amount: totalAmount,
        currency: 'USD',
        split_type: formData.splitType,
        expense_date: formData.date,
        group_id: groupId || null, // Include group_id if creating group expense
        // Create splits for selected members + current user
        splits: selectedMembers.length > 0 ? [
          // Include current user (give them any remainder to ensure total matches)
          {
            user_id: currentUser?.id || 0,
            amount: creatorAmount
          },
          // Include selected members
          ...selectedMembers.map(memberId => ({
            user_id: parseInt(memberId),
            amount: baseSplitAmount
          }))
        ] : [
          // Personal expense - only current user pays 100%
          {
            user_id: currentUser?.id || 0,
            amount: totalAmount
          }
        ]
      };

      console.log('Creating expense with groupId:', groupId);
      console.log('Creating expense data:', JSON.stringify(expenseData, null, 2));
      const result = await apiService.createExpense(expenseData);
      console.log('Expense creation result:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('Expense created successfully, navigating...');
        // Reset form
        setFormData({
          title: '',
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          splitType: 'equal',
          groupId: groupId || null
        });
        setSelectedMembers([]);
        setError('');
        
        // Show success and navigate
        const successMessage = groupId 
          ? `Expense "${formData.title}" added to the group successfully!`
          : `Personal expense "${formData.title}" added successfully!`;
        
        // Navigate back to groups list for proper refresh
        navigation.navigate('success', {
          message: successMessage,
          nextScreen: groupId ? 'groups' : 'dashboard',
          groupData: groupId ? groupData : undefined
        });
      } else {
        console.error('Expense creation failed:', result.error);
        setError(result.error || 'Failed to create expense');
      }
    } catch (error) {
      console.error('Add expense error:', error);
      setError('Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  // const updateFormData = (field: string, value: string) => {
  //   setFormData(prev => ({ ...prev, [field]: value }));
  // };

  const splitAmount = formData.amount ? 
    Math.round((parseFloat(formData.amount) / (selectedMembers.length + 1)) * 100) / 100 : 0;

  // Filter users based on search query AND ensure current user is never shown
  const filteredUsers = users.filter((userItem: any) => {
    // Double-check to exclude current user (fallback safety)
    if (userItem.id === currentUser?.id || userItem.id == currentUser?.id) return false;
    
    const fullName = `${userItem.first_name || ''} ${userItem.last_name || ''}`.toLowerCase();
    const email = userItem.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your groups...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('dashboard')} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {groupId ? 'Add Group Expense' : 'Add Expense'}
          </Text>
          {groupId && groupData && (
            <Text style={styles.headerSubtitle}>To "{groupData.name}"</Text>
          )}
        </View>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          {/* Basic Details */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Expense Title *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(value) => updateFormData('title', value)}
                  placeholder="e.g., Dinner at Italiano"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={styles.label}>Amount *</Text>
                  <View style={styles.inputWithIcon}>
                    <DollarSign size={16} color="#6b7280" style={styles.icon} />
                    <TextInput
                      style={styles.inputWithIconText}
                      keyboardType="numeric"
                      value={formData.amount}
                      onChangeText={(value) => updateFormData('amount', value)}
                      placeholder="0.00"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Date</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.date}
                    onChangeText={(value) => updateFormData('date', value)}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category *</Text>
                <View style={styles.pickerContainer}>
                  <TextInput
                    style={styles.input}
                    value={formData.category}
                    onChangeText={(value) => updateFormData('category', value)}
                    placeholder="Select a category"
                  />
                  {/* In a real app, use a proper picker */}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={styles.textarea}
                  multiline
                  numberOfLines={3}
                  value={formData.description}
                  onChangeText={(value) => updateFormData('description', value)}
                  placeholder="Add any notes about this expense..."
                />
              </View>
            </Card.Content>
          </Card>

          {/* Split With Friends */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {groupId ? `Split with Group Members` : 'Split with Friends'}
                </Text>
                <Text style={styles.sublabel}>
                  {groupId 
                    ? `Select members from "${groupData?.name || 'this group'}" to split the expense with`
                    : 'Select who participated in this expense'
                  }
                </Text>
                
                {/* Search Input */}
                <TextInput
                  style={[styles.input, { marginTop: 8, marginBottom: 12 }]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={groupId ? "Search group members..." : "Search friends by name or email..."}
                  clearButtonMode="while-editing"
                />
                
                {filteredUsers.length > 0 ? (
                  <View style={styles.usersList}>
                    {filteredUsers.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={styles.userItem}
                        onPress={() => toggleUserSelection(user.id)}
                      >
                        <View style={styles.userInfo}>
                          <Avatar.Text 
                            size={40} 
                            label={user.first_name ? user.first_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                            style={styles.userAvatar}
                          />
                          <View style={styles.userDetails}>
                            <Text style={styles.userName}>
                              {user.first_name && user.last_name 
                                ? `${user.first_name} ${user.last_name}`
                                : user.first_name || user.email.split('@')[0]
                              }
                            </Text>
                            <Text style={styles.userEmail}>{user.email}</Text>
                          </View>
                        </View>
                        <Checkbox
                          status={selectedMembers.includes(user.id.toString()) ? 'checked' : 'unchecked'}
                          onPress={() => toggleUserSelection(user.id)}
                          color="#3b82f6"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noUsersText}>
                    {searchQuery 
                      ? (groupId ? 'No group members found matching your search.' : 'No users found matching your search.')
                      : (groupId 
                          ? 'No other members in this group to split with.'
                          : 'No other users found. You can still add a personal expense.'
                        )
                    }
                  </Text>
                )}

                {/* Split Summary */}
                {selectedMembers.length > 0 && formData.amount && (
                  <View style={styles.splitSummary}>
                    <Text style={styles.summaryText}>
                      Split equally among {selectedMembers.length + 1} {groupId ? 'group members' : 'people'}
                    </Text>
                    <View style={styles.splitAmount}>
                      <Text style={styles.summaryText}>Each person pays:</Text>
                      <Text style={styles.amountText}>${splitAmount.toFixed(2)}</Text>
                    </View>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* Receipt Upload */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.label}>Receipt (Optional)</Text>
              <TouchableOpacity style={styles.uploadButton}>
                <Camera size={24} color="#6b7280" />
                <Text style={styles.uploadText}>Tap to add receipt photo</Text>
                <Text style={styles.uploadSubtext}>Helps with expense tracking</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button 
          mode="contained"
          onPress={handleAddExpense}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
          icon={() => <Shield size={16} color="#fff" />}
          loading={submitting}
          disabled={submitting || !formData.title || !formData.amount}
        >
          {submitting ? 'Adding Expense...' : 'Add Secure Expense'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  headerSubtitle: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  spacer: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 100 },
  errorContainer: { padding: 12, backgroundColor: '#fef2f2', borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#dc2626' },
  form: { gap: 16 },
  card: { elevation: 2 },
  cardContent: { padding: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center' },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#fff' },
  icon: { marginLeft: 12 },
  inputWithIconText: { flex: 1, paddingHorizontal: 8, paddingVertical: 12, fontSize: 16 },
  pickerContainer: {},
  textarea: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff', textAlignVertical: 'top' },
  uploadButton: { borderWidth: 2, borderColor: '#d1d5db', borderStyle: 'dashed', borderRadius: 8, padding: 24, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  uploadText: { marginTop: 8, fontSize: 16, color: '#6b7280' },
  uploadSubtext: { marginTop: 4, fontSize: 14, color: '#9ca3af' },
  splitHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  friendsList: { gap: 8 },
  friendItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 },
  friendItemSelected: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  avatar: { fontSize: 24, marginRight: 12 },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 16, color: '#1f2937' },
  splitSummary: { padding: 12, backgroundColor: '#f3f4f6', borderRadius: 8, marginTop: 16 },
  summaryText: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  splitAmount: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountText: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  footer: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  primaryButton: { backgroundColor: '#3b82f6' },
  buttonContent: { height: 48 },
  // New styles for real API integration
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  loadingText: { fontSize: 16, color: '#6b7280', marginTop: 16 },
  sublabel: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  usersList: { gap: 12, marginTop: 8 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f9fafb', borderRadius: 8 },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  userAvatar: { backgroundColor: '#3b82f6', marginRight: 12 },
  userDetails: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '500', color: '#1f2937' },
  userEmail: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  noUsersText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 16, fontStyle: 'italic' },
  groupScroll: { maxHeight: 120 },
  groupChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    marginRight: 12, 
    backgroundColor: '#f3f4f6', 
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center'
  },
  groupChipSelected: { backgroundColor: '#3b82f6' },
  groupChipText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  groupChipTextSelected: { color: '#fff' },
  groupMemberCount: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  noGroupsText: { 
    fontSize: 14, 
    color: '#6b7280', 
    textAlign: 'center', 
    paddingVertical: 20,
    fontStyle: 'italic'
  },
  payerItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    backgroundColor: '#f0fdf4', 
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#16a34a'
  },
  payerLabel: { 
    fontSize: 12, 
    color: '#16a34a', 
    fontWeight: '500',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  // Search input styles
  searchContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#1f2937',
  },
  // Split amount styles
  splitAmountText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  splitAmountValue: {
    fontWeight: '500',
    color: '#1f2937',
  },
});