import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Button, Card, Avatar, Chip } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Plus, Users, CreditCard, Home, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { apiService } from '../services/api';
import type { User, Expense } from '../App';

type RootStackParamList = {
  dashboard: undefined;
  'add-expense': undefined;
  groups: undefined;
  profile: undefined;
  'expense-details': { expense: Expense };
  'settle-payment': undefined;
  // Add other screens...
};

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'dashboard'>;
type DashboardScreenRouteProp = RouteProp<RootStackParamList, 'dashboard'>;

interface DashboardScreenProps {
  navigation: DashboardScreenNavigationProp;
  route: DashboardScreenRouteProp;
  user: User | null;
  expenses: Expense[];
}

export function DashboardScreen({ navigation, user, expenses }: DashboardScreenProps) {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Early return if user is null (logged out)
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>Please log in to view your dashboard</Text>
      </View>
    );
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      
      // Check if user is authenticated first
      const isAuth = await apiService.isAuthenticated();
      console.log('Is authenticated:', isAuth);
      
      if (!isAuth) {
        console.log('User not authenticated, cannot fetch dashboard data');
        setError('Authentication required. Please log in again.');
        return;
      }
      
      const result = await apiService.getDashboardData();
      console.log('Setting dashboard data:', result.data);
      console.log('User data in response:', result.data.user);
      console.log('Dashboard data result:', result);
        
      if (result.success) {
        console.log('Setting dashboard data:', result.data);
        console.log('User data in response:', result.data.user);
        setDashboardData(result.data);
        setError('');
      } else {
        setError(result.error);
        console.error('Dashboard data fetch failed:', result.error);
      }
    } catch (error) {
      console.error('Dashboard data fetch exception:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Button mode="contained" onPress={fetchDashboardData} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      </View>
    );
  }

  if (!dashboardData || !dashboardData.user) {
    console.log('Dashboard data check failed:', { dashboardData, hasUser: !!dashboardData?.user });
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No user data available</Text>
        </View>
      </View>
    );
  }

  const userData = dashboardData.user;
  const stats = dashboardData.stats;
  const recentExpenses = dashboardData.recent_expenses || [];
  
  // Use real data from backend
  const totalOwed = stats.total_owed;
  const totalOwing = stats.total_owing;
  const netBalance = stats.net_balance;
  
  console.log('Dashboard balance values:', {
    totalOwed,
    totalOwing,
    netBalance,
    stats
  });

  return (
    <View style={styles.container}>      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar.Text 
            size={48} 
            label={userData.first_name ? userData.first_name.charAt(0).toUpperCase() : userData.email.charAt(0).toUpperCase()}
            style={styles.avatar}
          />
          <View style={styles.userText}>
            <Text style={styles.greeting}>
              Welcome back, {userData.first_name || userData.email.split('@')[0]}
            </Text>
            <Text style={styles.subtitle}>Let's split some bills!</Text>
          </View>
        </View>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('add-expense')}
          style={styles.addButton}
          contentStyle={styles.addButtonContent}
          icon={() => <Plus size={16} color="#fff" />}
        >
          {' '}
        </Button>
      </View>

      {/* Balance Overview */}
      <View style={styles.balanceSection}>
        <Card style={styles.balanceCard}>
          <Card.Content style={styles.balanceContent}>
            <Text style={styles.balanceTitle}>Your Balance</Text>
            <View style={styles.balanceGrid}>
              <View style={styles.balanceItem}>
                <View style={styles.balanceIcon}>
                  <ArrowDownLeft size={16} color="#dc2626" />
                </View>
                <Text style={styles.balanceLabel}>You owe</Text>
                <Text style={styles.balanceAmount}>${totalOwed.toFixed(2)}</Text>
              </View>
              <View style={styles.balanceItem}>
                <View style={styles.balanceIcon}>
                  <ArrowUpRight size={16} color="#16a34a" />
                </View>
                <Text style={styles.balanceLabel}>You're owed</Text>
                <Text style={styles.balanceAmount}>${totalOwing.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.netBalance}>
              <Text style={styles.netLabel}>Net Balance</Text>
              <Text style={[styles.netAmount, { color: netBalance < 0 ? '#dc2626' : '#16a34a' }]}>
                ${Math.abs(parseFloat(netBalance.toFixed(2)))} {netBalance < 0 ? 'owed' : 'owing'}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('add-expense')}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
            icon={() => <Plus size={20} color="#3b82f6" />}
          >
            Add Expense
          </Button>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('settle-payment')}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
            icon={() => <CreditCard size={20} color="#3b82f6" />}
          >
            Settle Up
          </Button>
        </View>
      </View>

      {/* Recent Expenses */}
      <ScrollView style={styles.expensesSection} contentContainerStyle={styles.expensesContent}>
        <View style={styles.expensesHeader}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.expensesList}>
          {recentExpenses.map((expense) => (
            <TouchableOpacity
              key={expense.id}
              style={styles.expenseCard}
              onPress={() => navigation.navigate('expense-details', { expense })}
            >
              <View style={styles.expenseContent}>
                <View style={styles.expenseMain}>
                  <Text style={styles.expenseTitle}>{expense.title}</Text>
                  <Text style={styles.expenseAmount}>${expense.amount.toFixed(2)}</Text>
                </View>
                <View style={styles.expenseDetails}>
                  <Chip style={styles.categoryChip}>{expense.category}</Chip>
                  <Text style={styles.expenseDate}>
                    {new Date(expense.date).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.expenseMeta}>
                  Paid by {expense.paidBy} • Split {expense.splitWith.length} ways
                </Text>
              </View>
              <View style={styles.expenseStatus}>
                {expense.settled ? (
                  <Chip mode="flat" style={styles.settledChip}>Settled</Chip>
                ) : (
                  <Chip mode="flat" style={styles.pendingChip}>Pending</Chip>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {recentExpenses.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <CreditCard size={32} color="#6b7280" />
            </View>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptyText}>Start by adding your first expense</Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('add-expense')}
              style={styles.emptyButton}
              icon={() => <Plus size={16} color="#fff" />}
            >
              Add Expense
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItemActive}>
          <Home size={24} color="#3b82f6" />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('groups')}>
          <Users size={24} color="#6b7280" />
          <Text style={styles.navText}>Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('profile')}>
          <Users size={24} color="#6b7280" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  userText: { marginLeft: 12, flex: 1 },
  greeting: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280' },
  addButton: { backgroundColor: '#3b82f6', borderRadius: 24 },
  addButtonContent: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  balanceSection: { paddingHorizontal: 24, paddingVertical: 16 },
  balanceCard: { backgroundColor: '#3b82f6', elevation: 4 },
  balanceContent: { padding: 20 },
  balanceTitle: { fontSize: 16, fontWeight: '600', color: '#e0e7ff', marginBottom: 16 },
  balanceGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  balanceItem: { alignItems: 'center', flex: 1 },
  balanceIcon: { marginBottom: 4 },
  balanceLabel: { fontSize: 12, color: '#bfdbfe', marginBottom: 4 },
  balanceAmount: { fontSize: 20, fontWeight: '700', color: '#fff' },
  netBalance: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#3b82f6' },
  netLabel: { fontSize: 14, color: '#bfdbfe' },
  netAmount: { fontSize: 16, fontWeight: '600' },
  actionsSection: { paddingHorizontal: 24, paddingBottom: 16 },
  actionButtons: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, borderColor: '#3b82f6' },
  actionButtonContent: { height: 48 },
  expensesSection: { flex: 1, paddingHorizontal: 24 },
  expensesContent: { paddingBottom: 100 },
  expensesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  viewAll: { fontSize: 14, color: '#3b82f6' },
  expensesList: { gap: 12 },
  expenseCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  expenseContent: { flex: 1 },
  expenseMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  expenseTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  expenseAmount: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  expenseDetails: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  categoryChip: { backgroundColor: '#f3f4f6' },
  expenseDate: { fontSize: 14, color: '#6b7280' },
  expenseMeta: { fontSize: 14, color: '#6b7280' },
  expenseStatus: { marginTop: 8 },
  settledChip: { backgroundColor: '#dcfce7' },
  pendingChip: { backgroundColor: '#fef3c7' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  emptyButton: { backgroundColor: '#3b82f6' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingHorizontal: 24, paddingVertical: 12 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navItemActive: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navText: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  navTextActive: { fontSize: 12, color: '#3b82f6', marginTop: 4 },
  // New styles for loading, error, and real user data
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  loadingText: { fontSize: 16, color: '#6b7280', marginTop: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  errorText: { fontSize: 16, color: '#dc2626', marginBottom: 16, textAlign: 'center' },
  retryButton: { backgroundColor: '#3b82f6' },
  avatar: { backgroundColor: '#3b82f6' },
});