import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Button, Card, Avatar, Chip, Searchbar } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ArrowLeft, Search, Filter } from 'lucide-react-native';
import { apiService } from '../services/api';
import type { User, Expense } from '../App';

// Helper function to get relative time
const getRelativeTime = (dateString: string) => {
  const now = new Date();
  const expenseDate = new Date(dateString);
  const diffInMs = now.getTime() - expenseDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  
  if (diffInDays > 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  } else {
    return 'Just now';
  }
};

type RootStackParamList = {
  'all-expenses': undefined;
  'expense-details': { expense: Expense };
  dashboard: undefined;
};

type AllExpensesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'all-expenses'>;
type AllExpensesScreenRouteProp = RouteProp<RootStackParamList, 'all-expenses'>;

interface AllExpensesScreenProps {
  navigation: AllExpensesScreenNavigationProp;
  route: AllExpensesScreenRouteProp;
  user: User | null;
}

export function AllExpensesScreen({ navigation, user }: AllExpensesScreenProps) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAllExpenses();
  }, []);

  const fetchAllExpenses = async () => {
    try {
      setLoading(true);
      const result = await apiService.getExpenses();
      if (result.success) {
        setExpenses(result.data);
      } else {
        setError(result.error || 'Failed to fetch expenses');
      }
    } catch (error) {
      setError('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = expenses.filter((expense: any) =>
    expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchAllExpenses} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Expenses</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search expenses..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#6b7280"
        />
      </View>

      {/* Expenses List */}
      <ScrollView style={styles.expensesList} contentContainerStyle={styles.expensesContent}>
        <Text style={styles.resultsText}>
          {filteredExpenses.length} expense{filteredExpenses.length === 1 ? '' : 's'} found
        </Text>

        {filteredExpenses.map((expense: any) => (
          <TouchableOpacity
            key={expense.id}
            style={styles.expenseCard}
            onPress={() => navigation.navigate('expense-details', { expense })}
          >
            <View style={styles.expenseContent}>
              <View style={styles.expenseMain}>
                <Text style={styles.expenseTitle}>{expense.title}</Text>
                <Text style={styles.expenseAmount}>${parseFloat(expense.amount).toFixed(2)}</Text>
              </View>
              <View style={styles.expenseDetails}>
                <Chip style={styles.categoryChip}>
                  {expense.split_type === 'equal' ? 'Split Equally' : expense.split_type}
                </Chip>
                <Text style={styles.expenseDate}>
                  {new Date(expense.expense_date).toLocaleDateString()} • {getRelativeTime(expense.created_at)}
                </Text>
              </View>
              <Text style={styles.expenseMeta}>
                Paid by {expense.paid_by?.full_name || expense.paid_by?.first_name || expense.paid_by?.email || 'Unknown'}
                {expense.expense_splits && expense.expense_splits.length > 0 && 
                  ` • Split ${expense.expense_splits.length} ways`
                }
                {expense.group_name && ` • ${expense.group_name}`}
                {!expense.group_id && expense.expense_splits?.length <= 1 && ' • Personal Expense'}
              </Text>
              {expense.description && (
                <Text style={styles.expenseDescription}>{expense.description}</Text>
              )}
            </View>
            <View style={styles.expenseStatus}>
              <Chip mode="flat" style={styles.pendingChip}>
                ${parseFloat(expense.amount).toFixed(2)}
              </Chip>
            </View>
          </TouchableOpacity>
        ))}

        {filteredExpenses.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Search size={32} color="#6b7280" />
            </View>
            <Text style={styles.emptyTitle}>No expenses found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try adjusting your search terms' : 'Start by adding your first expense'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6b7280' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  errorText: { fontSize: 16, color: '#dc2626', marginBottom: 16, textAlign: 'center' },
  retryButton: { backgroundColor: '#3b82f6' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    padding: 8,
  },
  
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    backgroundColor: '#f9fafb',
    elevation: 0,
  },
  
  expensesList: { flex: 1 },
  expensesContent: { padding: 16, paddingBottom: 32 },
  resultsText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    fontWeight: '500',
  },
  
  expenseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  expenseContent: { flex: 1 },
  expenseMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', flex: 1 },
  expenseAmount: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  expenseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: { backgroundColor: '#f3f4f6' },
  expenseDate: { fontSize: 14, color: '#6b7280' },
  expenseMeta: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  expenseDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  expenseStatus: { marginTop: 8 },
  pendingChip: { backgroundColor: '#fef3c7' },
  
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
});