import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Button, Card, Avatar, ActivityIndicator } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { 
  ArrowLeft, 
  Users, 
  DollarSign, 
  Plus, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  
} from 'lucide-react-native';
import { apiService } from '../services/api';
import type { User } from '../App';

interface GroupExpense {
  id: number;
  title: string;
  description?: string;
  amount: string;
  expense_date: string;
  paid_by: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  group?: {
    id: number;
    name: string;
  };
  status: 'pending' | 'completed' | 'rejected';
}

interface Group {
  id: number;
  name: string;
  description?: string;
  created_by: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  member_count: number;
  created_at: string;
}

type RootStackParamList = {
  'group-details': { group: Group };
  groups: undefined;
  'add-expense': { groupId?: number };
  'expense-creator': { categoryType: string; expenses: GroupExpense[]; group: Group };
  'verification-completed': { categoryType: string; expenses: GroupExpense[]; group: Group };
  'verification-rejected': { categoryType: string; expenses: GroupExpense[]; group: Group };
  'verification-pending': { categoryType: string; expenses: GroupExpense[]; group: Group };
  'settle-payment': undefined;
  // Add other screens...
};

type GroupDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'group-details'>;
type GroupDetailsScreenRouteProp = RouteProp<RootStackParamList, 'group-details'>;

interface GroupDetailsScreenProps {
  navigation: GroupDetailsScreenNavigationProp;
  route: GroupDetailsScreenRouteProp;
  user: User | null;
}

export function GroupDetailsScreen({ navigation, route, user }: GroupDetailsScreenProps) {
  const { group } = route.params;
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groupStats, setGroupStats] = useState({
    totalExpenses: 0,
    userBalance: 0,
    userOwes: 0,
    userOwed: 0
  });

  useEffect(() => {
    fetchGroupExpenses();
  }, []);

  // Refresh when returning to screen
  useFocusEffect(
    useCallback(() => {
      fetchGroupExpenses();
    }, [])
  );

  const fetchGroupExpenses = async () => {
    try {
      setLoading(true);
      console.log('Fetching expenses for group:', group.id);
      const result = await apiService.getGroupExpenses(group.id);
      
      if (result.success) {
        console.log('Group expenses fetched:', result.data);
        setExpenses(result.data);
        await calculateGroupStats(result.data);
      } else {
        console.error('Failed to fetch group expenses:', result.error);
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Failed to fetch group expenses:', error);
      Alert.alert('Error', 'Failed to load group expenses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateGroupStats = async (expensesData: GroupExpense[]) => {
    const totalExpenses = expensesData.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
    // Get real balance from backend API
    const balanceResult = await apiService.getGroupBalanceSummary(group.id);
    
    if (balanceResult.success) {
      const balanceData = balanceResult.data;
      setGroupStats({
        totalExpenses: balanceData.total_expenses,
        userBalance: balanceData.user_balance,
        userOwes: balanceData.total_user_owes,
        userOwed: balanceData.total_owed_to_user
      });
    } else {
      // Fallback to simple calculation if API fails
      console.warn('Failed to get group balance, using fallback calculation');
      const userPaid = expensesData
        .filter(expense => expense.paid_by.id === user?.id)
        .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      
      const userShare = totalExpenses / (group.member_count || 1);
      const balance = userPaid - userShare;
      
      setGroupStats({
        totalExpenses,
        userBalance: balance,
        userOwes: Math.max(0, -balance),
        userOwed: Math.max(0, balance)
      });
    }
  };

  const getStatusIcon = (status: GroupExpense['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color="#16a34a" />;
      case 'rejected':
        return <XCircle size={16} color="#dc2626" />;
      case 'pending':
        return <Clock size={16} color="#d97706" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: GroupExpense['status']) => {
    switch (status) {
      case 'completed':
        return '#dcfce7';
      case 'rejected':
        return '#fef2f2';
      case 'pending':
        return '#fef3c7';
      default:
        return '#f9fafb';
    }
  };

  const categorizeExpenses = () => {
    const categories = {
      creator: expenses.filter(expense => expense.paid_by.id === user?.id),
      completed: expenses.filter(expense => expense.status === 'completed'),
      rejected: expenses.filter(expense => expense.status === 'rejected'),
      pending: expenses.filter(expense => expense.status === 'pending')
    };
    return categories;
  };

  const categories = categorizeExpenses();

  const handleCategoryClick = (categoryType: string, expenses: GroupExpense[]) => {
    const categoryData = { 
      categoryType, 
      expenses, 
      group 
    };

    switch (categoryType) {
      case 'creator':
        navigation.navigate('expense-creator', categoryData);
        break;
      case 'completed':
        navigation.navigate('verification-completed', categoryData);
        break;
      case 'rejected':
        navigation.navigate('verification-rejected', categoryData);
        break;
      case 'pending':
        navigation.navigate('verification-pending', categoryData);
        break;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('groups')} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.groupAvatarContainer}>
            <Text style={styles.groupAvatar}>{group.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>{group.name}</Text>
            <Text style={styles.headerSubtitle}>{group.member_count} members</Text>
          </View>
        </View>
      </View>

      {/* Group Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <DollarSign size={16} color="#6b7280" />
            </View>
            <Text style={styles.statLabel}>Total Expenses</Text>
            <Text style={styles.statValue}>₹{groupStats.totalExpenses.toFixed(2)}</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Users size={16} color="#6b7280" />
            </View>
            <Text style={styles.statLabel}>Your Balance</Text>
            <Text style={[styles.statValue, { color: groupStats.userBalance >= 0 ? '#16a34a' : '#dc2626' }]}>
              ₹{Math.abs(groupStats.userBalance).toFixed(2)} {groupStats.userBalance >= 0 ? 'owed to you' : 'you owe'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading group expenses...</Text>
          </View>
        ) : (
          <>
        {/* Expense Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Expense Categories</Text>
          <View style={styles.categoriesList}>
            
            {/* Created by You */}
            <TouchableOpacity 
              style={styles.categoryCard}
              onPress={() => handleCategoryClick('creator', categories.creator)}
            >
              <Card.Content style={styles.categoryContent}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIcon, { backgroundColor: '#dbeafe' }]}>
                    <Users size={20} color="#3b82f6" />
                  </View>
                  <View style={styles.categoryText}>
                    <Text style={styles.categoryTitle}>Created by You</Text>
                    <Text style={styles.categorySubtitle}>
                      Expenses you've added to this group
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.badgeText}>{categories.creator.length} expenses</Text>
                </View>
              </Card.Content>
            </TouchableOpacity>

            {/* Verification Completed */}
            <TouchableOpacity 
              style={styles.categoryCard}
              onPress={() => handleCategoryClick('completed', categories.completed)}
            >
              <Card.Content style={styles.categoryContent}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIcon, { backgroundColor: '#dcfce7' }]}>
                    <CheckCircle size={20} color="#16a34a" />
                  </View>
                  <View style={styles.categoryText}>
                    <Text style={styles.categoryTitle}>Verification Completed</Text>
                    <Text style={styles.categorySubtitle}>
                      Approved and verified expenses
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={[styles.badgeText, { color: '#16a34a' }]}>{categories.completed.length} verified</Text>
                </View>
              </Card.Content>
            </TouchableOpacity>

            {/* Verification Rejected */}
            <TouchableOpacity 
              style={styles.categoryCard}
              onPress={() => handleCategoryClick('rejected', categories.rejected)}
            >
              <Card.Content style={styles.categoryContent}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIcon, { backgroundColor: '#fef2f2' }]}>
                    <XCircle size={20} color="#dc2626" />
                  </View>
                  <View style={styles.categoryText}>
                    <Text style={styles.categoryTitle}>Verification Rejected</Text>
                    <Text style={styles.categorySubtitle}>
                      Expenses that need review or correction
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={[styles.badgeText, { color: '#dc2626' }]}>{categories.rejected.length} rejected</Text>
                </View>
              </Card.Content>
            </TouchableOpacity>

            {/* Verification Pending */}
            <TouchableOpacity 
              style={styles.categoryCard}
              onPress={() => handleCategoryClick('pending', categories.pending)}
            >
              <Card.Content style={styles.categoryContent}>
                <View style={styles.categoryHeader}>
                  <View style={[styles.categoryIcon, { backgroundColor: '#fef3c7' }]}>
                    <Clock size={20} color="#d97706" />
                  </View>
                  <View style={styles.categoryText}>
                    <Text style={styles.categoryTitle}>Verification Pending</Text>
                    <Text style={styles.categorySubtitle}>
                      Expenses waiting for approval
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={[styles.badgeText, { color: '#d97706' }]}>{categories.pending.length} pending</Text>
                </View>
              </Card.Content>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {expenses.length === 0 ? (
              <Card style={styles.activityItem}>
                <Card.Content style={styles.activityContent}>
                  <Text style={styles.emptyText}>No expenses yet. Add your first expense to get started!</Text>
                </Card.Content>
              </Card>
            ) : (
              expenses.slice(0, 3).map((expense) => (
                <TouchableOpacity key={expense.id} style={styles.activityItem}>
                  <Card.Content style={styles.activityContent}>
                    <View style={styles.activityHeader}>
                      {getStatusIcon(expense.status)}
                      <View style={styles.activityText}>
                        <Text style={styles.activityTitle}>{expense.title}</Text>
                        <Text style={styles.activityMeta}>
                          Added by {expense.paid_by.first_name || expense.paid_by.email} • {new Date(expense.expense_date).toLocaleDateString()}
                        </Text>
                        {expense.description && (
                          <Text style={styles.activityDescription}>{expense.description}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.activityFooter}>
                      <Text style={styles.activityAmount}>${parseFloat(expense.amount).toFixed(2)}</Text>
                      <View style={[styles.statusChip, { backgroundColor: getStatusColor(expense.status) }]}>
                        <Text style={styles.statusChipText}>{expense.status}</Text>
                      </View>
                    </View>
                  </Card.Content>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={() => {
                console.log('=== GROUP DETAILS NAVIGATION ===');
                console.log('Group object:', group);
                console.log('Group ID:', group.id);
                console.log('Navigating to add-expense with params:', { groupId: group.id });
                console.log('===============================');
                navigation.navigate('add-expense', { groupId: group.id })
              }}
              style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
              contentStyle={styles.actionButtonContent}
              icon={() => <Plus size={20} color="#fff" />}
            >
              Add Expense
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('settle-payment')}
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
              icon={() => <DollarSign size={20} color="#3b82f6" />}
            >
              Settle Up
            </Button>
          </View>
        </View>
        </>
        )}
      </ScrollView>

      {/* Security Badge */}
      <View style={styles.securityBadge}>
        <Shield size={16} color="#16a34a" />
        <Text style={styles.securityText}>Secure group with end-to-end verification</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  backButton: { padding: 8, marginLeft: -8 },
  headerContent: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 16 },
  groupAvatarContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  groupAvatar: { fontSize: 18, color: '#fff', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  headerSubtitle: { fontSize: 14, color: '#6b7280' },
  statsSection: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  statsGrid: { flexDirection: 'row', gap: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statIcon: { marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 100 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
  loadingText: { fontSize: 16, color: '#6b7280', marginTop: 16 },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center', fontStyle: 'italic' },
  categoriesSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 16 },
  categoriesList: { gap: 12 },
  categoryCard: { elevation: 2, borderRadius: 8 },
  categoryContent: { padding: 16 },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  categoryIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  categoryText: { flex: 1 },
  categoryTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  categorySubtitle: { fontSize: 14, color: '#6b7280' },
  categoryBadge: { alignItems: 'flex-end' },
  badgeText: { fontSize: 14, fontWeight: '500', color: '#3b82f6' },
  activitySection: { marginBottom: 24 },
  activityList: { gap: 12 },
  activityItem: { elevation: 2, borderRadius: 8 },
  activityContent: { padding: 16 },
  activityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  activityText: { flex: 1, marginLeft: 8 },
  activityTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  activityMeta: { fontSize: 14, color: '#6b7280' },
  activityDescription: { fontSize: 13, color: '#6b7280', marginTop: 4, fontStyle: 'italic' },
  activityFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activityAmount: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  statusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusChipText: { fontSize: 12, fontWeight: '500' },
  actionsSection: { marginBottom: 24 },
  actionButtons: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1 },
  actionButtonContent: { height: 48 },
  securityBadge: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#f0fdf4', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  securityText: { fontSize: 14, color: '#16a34a', marginLeft: 8 },
});