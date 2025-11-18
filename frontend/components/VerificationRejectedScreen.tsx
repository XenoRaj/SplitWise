import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Button, Card, Badge } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ArrowLeft, XCircle, DollarSign, Calendar, Users, Eye, AlertTriangle, Edit3,Plus } from 'lucide-react-native';
import type { GroupExpense, Group, User } from '../App';

type RootStackParamList = {
  verificationRejected: { categoryType: string; expenses: GroupExpense[]; group: Group };
  groupDetails: { group: Group };
  expenseDetails: { expense: GroupExpense };
  success: { message: string };
  addExpense: undefined;
  // Add other screens...
};

type VerificationRejectedScreenNavigationProp = StackNavigationProp<RootStackParamList, 'verificationRejected'>;
type VerificationRejectedScreenRouteProp = RouteProp<RootStackParamList, 'verificationRejected'>;

interface VerificationRejectedScreenProps {
  navigation: VerificationRejectedScreenNavigationProp;
  route: VerificationRejectedScreenRouteProp;
  user: User | null;
  showLoading: (callback: () => void) => void;
}

export function VerificationRejectedScreen({ navigation, route, user,showLoading }: VerificationRejectedScreenProps) {
  const { categoryType, expenses, group } = route.params;

  if (!group || !user) {
    return null;
  }

  // Filter rejected expenses
  const rejectedExpenses = expenses.filter(expense => expense.status === 'rejected');
  const totalRejected = rejectedExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const handleViewExpense = (expense: GroupExpense) => {
    navigation.navigate('expenseDetails', { expense });
  };

  const handleEditExpense = (expense: GroupExpense) => {
    showLoading(() => {
      navigation.navigate('success', { message: 'Edit functionality would be implemented here' });
    });
  };

  const handleResubmit = (expense: GroupExpense) => {
    showLoading(() => {
      navigation.navigate('success', { message: 'Expense resubmitted for verification' });
    });
  };

  // Mock rejection reasons
  const getRejectionReason = (expenseId: string) => {
    const reasons = {
      '3': 'Receipt image is unclear. Please provide a clearer receipt or additional documentation.'
    };
    return reasons[expenseId as keyof typeof reasons] || 'This expense requires additional verification or documentation.';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('groupDetails', { group })} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <XCircle size={20} color="#dc2626" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Rejected Expenses</Text>
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
            <Text style={styles.statLabel}>Total Rejected</Text>
            <Text style={styles.statValue}>${totalRejected.toFixed(2)}</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <XCircle size={16} color="#6b7280" />
            </View>
            <Text style={styles.statLabel}>Expenses Count</Text>
            <Text style={styles.statValue}>{rejectedExpenses.length}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {rejectedExpenses.length > 0 ? (
          <>
            {/* Alert Notice */}
            <View style={styles.alertNotice}>
              <View style={styles.noticeContent}>
                <AlertTriangle size={20} color="#dc2626" />
                <View style={styles.noticeText}>
                  <Text style={styles.noticeTitle}>Action Required</Text>
                  <Text style={styles.noticeSubtitle}>
                    These expenses need your attention. Review the feedback and make necessary updates to resubmit for verification.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.expensesList}>
              {rejectedExpenses.map((expense) => (
                <Card key={expense.id} style={styles.expenseCard}>
                  <Card.Content style={styles.expenseContent}>
                    <View style={styles.expenseHeader}>
                      <View style={styles.expenseMain}>
                        <Text style={styles.expenseTitle}>{expense.title}</Text>
                        <View style={styles.statusBadge}>
                          <XCircle size={12} color="#dc2626" />
                          <Text style={styles.statusText}>Rejected</Text>
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
                            Created by {expense.creator} • Split with {expense.participants.length} people
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Rejection Reason */}
                    <View style={styles.rejectionReason}>
                      <View style={styles.reasonHeader}>
                        <AlertTriangle size={16} color="#dc2626" />
                        <Text style={styles.reasonTitle}>Rejection Reason:</Text>
                      </View>
                      <Text style={styles.reasonText}>
                        {getRejectionReason(expense.id)}
                      </Text>
                    </View>

                    {/* Participants List */}
                    <View style={styles.participants}>
                      <Text style={styles.participantsLabel}>Split between:</Text>
                      <View style={styles.participantsList}>
                        {expense.participants.map((participant, index) => (
                          <Badge key={index} style={styles.participantBadge}>
                            {participant}
                          </Badge>
                        ))}
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                      <Button
                        mode="outlined"
                        onPress={() => handleViewExpense(expense)}
                        style={styles.actionButton}
                        contentStyle={styles.actionButtonContent}
                        icon={() => <Eye size={14} color="#3b82f6" />}
                      >
                        View
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={() => handleEditExpense(expense)}
                        style={styles.actionButton}
                        contentStyle={styles.actionButtonContent}
                        icon={() => <Edit3 size={14} color="#3b82f6" />}
                      >
                        Edit
                      </Button>
                      <Button
                        mode="contained"
                        onPress={() => handleResubmit(expense)}
                        style={styles.resubmitButton}
                        contentStyle={styles.actionButtonContent}
                        icon={() => <XCircle size={14} color="#fff" />}
                      >
                        Resubmit
                      </Button>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <XCircle size={32} color="#dc2626" />
            </View>
            <Text style={styles.emptyTitle}>No rejected expenses</Text>
            <Text style={styles.emptyText}>All your expenses are either verified or pending verification</Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('addExpense')}
              style={styles.emptyButton}
              icon={() => <Plus size={16} color="#fff" />}
            >
              Add New Expense
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Help Footer */}
      <View style={styles.helpFooter}>
        <AlertTriangle size={16} color="#dc2626" />
        <Text style={styles.helpText}>Need help? Contact group admin for verification requirements</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  backButton: { padding: 8, marginLeft: -8 },
  headerContent: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 16 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
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
  alertNotice: { padding: 16, backgroundColor: '#fef2f2', borderRadius: 8, marginBottom: 16 },
  noticeContent: { flexDirection: 'row' },
  noticeText: { flex: 1, marginLeft: 12 },
  noticeTitle: { fontSize: 16, fontWeight: '600', color: '#dc2626', marginBottom: 4 },
  noticeSubtitle: { fontSize: 14, color: '#dc2626', lineHeight: 20 },
  expensesList: { gap: 12 },
  expenseCard: { elevation: 2 },
  expenseContent: { padding: 16 },
  expenseHeader: { marginBottom: 12 },
  expenseMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  expenseTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  statusBadge: { backgroundColor: '#fef2f2', borderRadius: 12 },
  statusText: { color: '#dc2626', fontSize: 12, fontWeight: '500', marginLeft: 4 },
  expenseDetails: { gap: 4 },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 14, color: '#6b7280', marginLeft: 6 },
  rejectionReason: { padding: 12, backgroundColor: '#fef2f2', borderRadius: 8, marginBottom: 12 },
  reasonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  reasonTitle: { fontSize: 14, fontWeight: '600', color: '#dc2626', marginLeft: 6 },
  reasonText: { fontSize: 14, color: '#dc2626' },
  participants: { marginBottom: 12 },
  participantsLabel: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  participantsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  participantBadge: { backgroundColor: '#f3f4f6' },
  actions: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  actionButton: { flex: 1, borderColor: '#d1d5db' },
  actionButtonContent: { height: 36 },
  resubmitButton: { flex: 1, backgroundColor: '#3b82f6' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  emptyButton: { backgroundColor: '#3b82f6' },
  helpFooter: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#fef2f2', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  helpText: { fontSize: 14, color: '#dc2626', marginLeft: 8 },
});