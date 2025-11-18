import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Button, Card, Badge } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ArrowLeft, DollarSign, Calendar, Users, Eye, Edit3, Plus } from 'lucide-react-native';
import type { GroupExpense, Group, User } from '../App';

type RootStackParamList = {
  expenseCreator: { categoryType: string; expenses: GroupExpense[]; group: Group };
  groupDetails: { group: Group };
  expenseDetails: { expense: GroupExpense };
  success: { message: string };
  // Add other screens...
};

type ExpenseCreatorScreenNavigationProp = StackNavigationProp<RootStackParamList, 'expenseCreator'>;
type ExpenseCreatorScreenRouteProp = RouteProp<RootStackParamList, 'expenseCreator'>;

interface ExpenseCreatorScreenProps {
  navigation: ExpenseCreatorScreenNavigationProp;
  route: ExpenseCreatorScreenRouteProp;
  user: User | null;
  showLoading: (callback: () => void) => void;
}

export function ExpenseCreatorScreen({ navigation, route, user, showLoading }: ExpenseCreatorScreenProps) {
  const { categoryType, expenses, group } = route.params;

  if (!group || !user) {
    return null;
  }

  // Filter expenses created by the current user
  const userExpenses = expenses.filter(expense => expense.creator === user.name);

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

  const getStatusTextColor = (status: GroupExpense['status']) => {
    switch (status) {
      case 'completed':
        return '#166534';
      case 'rejected':
        return '#dc2626';
      case 'pending':
        return '#92400e';
      default:
        return '#6b7280';
    }
  };

  const totalCreated = userExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const completedCount = userExpenses.filter(exp => exp.status === 'completed').length;
  const pendingCount = userExpenses.filter(exp => exp.status === 'pending').length;
  const rejectedCount = userExpenses.filter(exp => exp.status === 'rejected').length;

  const handleViewExpense = (expense: GroupExpense) => {
    navigation.navigate('expense-details', { expense });
  };

  const handleEditExpense = (expense: GroupExpense) => {
    showLoading(() => {
      navigation.navigate('success', { message: 'Edit functionality would be implemented here' });
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('group-details', { group })} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Users size={20} color="#3b82f6" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Your Expenses</Text>
            <Text style={styles.headerSubtitle}>In {group.name}</Text>
          </View>
        </View>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <DollarSign size={16} color="#6b7280" />
            </View>
            <Text style={styles.statLabel}>Total Created</Text>
            <Text style={styles.statValue}>${totalCreated.toFixed(2)}</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Users size={16} color="#6b7280" />
            </View>
            <Text style={styles.statLabel}>Expenses Count</Text>
            <Text style={styles.statValue}>{userExpenses.length}</Text>
          </View>
        </View>

        {/* Status Breakdown */}
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={[styles.statusCount, { color: '#166534' }]}>{completedCount} Completed</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusCount, { color: '#92400e' }]}>{pendingCount} Pending</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={[styles.statusCount, { color: '#dc2626' }]}>{rejectedCount} Rejected</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {userExpenses.length > 0 ? (
          <View style={styles.expensesList}>
            {userExpenses.map((expense) => (
              <Card key={expense.id} style={styles.expenseCard}>
                <Card.Content style={styles.expenseContent}>
                  <View style={styles.expenseHeader}>
                    <View style={styles.expenseMain}>
                      <Text style={styles.expenseTitle}>{expense.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(expense.status), paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center', justifyContent: 'center' }]}>
                        <Text style={[styles.statusText, { color: getStatusTextColor(expense.status) }]}>
                          {expense.status}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.expenseDetails}>
                      <View style={styles.detailItem}>
                        <DollarSign size={14} color="#6b7280" />
                        <Text style={styles.detailText}>
                          ${expense.amount.toFixed(2)} • {expense.category}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Calendar size={14} color="#6b7280" />
                        <Text style={styles.detailText}>{expense.date}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Users size={14} color="#6b7280" />
                        <Text style={styles.detailText}>
                          Split with {expense.participants.length} people
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => handleViewExpense(expense)}
                      style={styles.actionButton}
                      contentStyle={styles.actionButtonContent}
                      icon={() => <Eye size={14} color="#3b82f6" />}
                    >
                      View
                    </Button>
                    {expense.status !== 'completed' && (
                      <Button
                        mode="outlined"
                        onPress={() => handleEditExpense(expense)}
                        style={styles.actionButton}
                        contentStyle={styles.actionButtonContent}
                        icon={() => <Edit3 size={14} color="#3b82f6" />}
                      >
                        Edit
                      </Button>
                    )}
                  </View>

                  {/* Status-specific messages */}
                  {expense.status === 'rejected' && (
                    <View style={styles.statusMessage}>
                      <Text style={styles.statusMessageText}>
                        This expense was rejected. Please review and update the details.
                      </Text>
                    </View>
                  )}
                  {expense.status === 'pending' && (
                    <View style={[styles.statusMessage, { backgroundColor: '#fef3c7' }]}>
                      <Text style={[styles.statusMessageText, { color: '#92400e' }]}>
                        This expense is awaiting verification from group members.
                      </Text>
                    </View>
                  )}
                  {expense.status === 'completed' && (
                    <View style={[styles.statusMessage, { backgroundColor: '#dcfce7' }]}>
                      <Text style={[styles.statusMessageText, { color: '#166534' }]}>
                        This expense has been verified and approved by the group.
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Users size={32} color="#6b7280" />
            </View>
            <Text style={styles.emptyTitle}>No expenses created yet</Text>
            <Text style={styles.emptyText}>You haven't created any expenses in this group</Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('add-expense')}
              style={styles.emptyButton}
              icon={() => <Plus size={16} color="#fff" />}
            >
              Create Your First Expense
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Add New Expense Button */}
      {userExpenses.length > 0 && (
        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('add-expense')}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
          >
            Add New Expense
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  backButton: { padding: 8, marginLeft: -8 },
  headerContent: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 16 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  headerSubtitle: { fontSize: 14, color: '#6b7280' },
  statsSection: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statIcon: { marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  statusGrid: { flexDirection: 'row', gap: 8 },
  statusItem: { flex: 1, alignItems: 'center', paddingVertical: 8, backgroundColor: '#f9fafb', borderRadius: 6 },
  statusCount: { fontSize: 12, fontWeight: '500' },
  content: { flex: 1, paddingHorizontal: 24 },
  contentContainer: { paddingVertical: 16, paddingBottom: 100 },
  expensesList: { gap: 12 },
  expenseCard: { elevation: 2 },
  expenseContent: { padding: 16 },
  expenseHeader: { marginBottom: 12 },
  expenseMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  expenseTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  statusBadge: { borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '500' },
  expenseDetails: { gap: 4 },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 14, color: '#6b7280', marginLeft: 6 },
  actionButtons: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  actionButton: { flex: 1, borderColor: '#d1d5db' },
  actionButtonContent: { height: 36 },
  statusMessage: { marginTop: 12, padding: 8, backgroundColor: '#fef2f2', borderRadius: 6 },
  statusMessageText: { fontSize: 14, color: '#dc2626' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  emptyButton: { backgroundColor: '#3b82f6' },
  footer: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  primaryButton: { backgroundColor: '#3b82f6' },
  buttonContent: { height: 48 },
});