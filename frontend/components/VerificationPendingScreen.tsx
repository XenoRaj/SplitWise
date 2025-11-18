import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Button, Card, Badge } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ArrowLeft, Clock, DollarSign, Calendar, Users, Eye, Bell, MessageCircle,Plus } from 'lucide-react-native';
import type { GroupExpense, Group, User } from '../App';

type RootStackParamList = {
  verificationPending: { categoryType: string; expenses: GroupExpense[]; group: Group };
  groupDetails: { group: Group };
  expenseDetails: { expense: GroupExpense };
  success: { message: string };
  // Add other screens...
};

type VerificationPendingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'verificationPending'>;
type VerificationPendingScreenRouteProp = RouteProp<RootStackParamList, 'verificationPending'>;

interface VerificationPendingScreenProps {
  navigation: VerificationPendingScreenNavigationProp;
  route: VerificationPendingScreenRouteProp;
  user: User | null;
  showLoading: (callback: () => void) => void;
}

export function VerificationPendingScreen({ navigation, route, user, showLoading }: VerificationPendingScreenProps) {
  const { categoryType, expenses, group } = route.params;

  if (!group || !user) {
    return null;
  }

  // Filter pending expenses
  const pendingExpenses = expenses.filter(expense => expense.status === 'pending');
  const totalPending = pendingExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const handleViewExpense = (expense: GroupExpense) => {
    navigation.navigate('expenseDetails', { expense });
  };

  const handleSendReminder = (expense: GroupExpense) => {
    showLoading(() => {
      navigation.navigate('success', { message: 'Reminder sent to group members' });
    });
  };

  const handleAddComment = (expense: GroupExpense) => {
    showLoading(() => {
      navigation.navigate('success', { message: 'Comment feature would be implemented here' });
    });
  };

  // Mock pending duration calculation
  const getPendingDuration = (expenseDate: string) => {
    const date = new Date(expenseDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Mock verification progress
  const getVerificationProgress = (expenseId: string) => {
    const progress = {
      '2': { verified: 2, total: 3, pending: ['Emily Davis'] },
      '5': { verified: 1, total: 2, pending: ['Lisa Brown'] }
    };
    return progress[expenseId as keyof typeof progress] || { verified: 0, total: 4, pending: ['Sarah Chen', 'Mike Wilson', 'Emily Davis'] };
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
            <Clock size={20} color="#d97706" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Pending Verification</Text>
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
            <Text style={styles.statLabel}>Total Pending</Text>
            <Text style={styles.statValue}>${totalPending.toFixed(2)}</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Clock size={16} color="#6b7280" />
            </View>
            <Text style={styles.statLabel}>Expenses Count</Text>
            <Text style={styles.statValue}>{pendingExpenses.length}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {pendingExpenses.length > 0 ? (
          <>
            {/* Info Notice */}
            <View style={styles.infoNotice}>
              <View style={styles.noticeContent}>
                <Clock size={20} color="#d97706" />
                <View style={styles.noticeText}>
                  <Text style={styles.noticeTitle}>Waiting for Verification</Text>
                  <Text style={styles.noticeSubtitle}>
                    These expenses are waiting for approval from group members. You can send reminders or add comments to help speed up the process.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.expensesList}>
              {pendingExpenses.map((expense) => {
                const pendingDays = getPendingDuration(expense.date);
                const progress = getVerificationProgress(expense.id);
                
                return (
                  <Card key={expense.id} style={styles.expenseCard}>
                    <Card.Content style={styles.expenseContent}>
                      <View style={styles.expenseHeader}>
                        <View style={styles.expenseMain}>
                          <Text style={styles.expenseTitle}>{expense.title}</Text>
                          <View style={styles.statusBadge}>
                            <Clock size={12} color="#d97706" />
                            <Text style={styles.statusText}>{pendingDays}d pending</Text>
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

                      {/* Verification Progress */}
                      <View style={styles.progressContainer}>
                        <View style={styles.progressHeader}>
                          <Text style={styles.progressTitle}>Verification Progress</Text>
                          <Text style={styles.progressCount}>
                            {progress.verified}/{progress.total} approved
                          </Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { width: `${(progress.verified / progress.total) * 100}%` }]} />
                        </View>
                        <Text style={styles.progressPending}>
                          Waiting for: {progress.pending.join(', ')}
                        </Text>
                      </View>

                      {/* Participants List */}
                      <View style={styles.participants}>
                        <Text style={styles.participantsLabel}>Split between:</Text>
                        <View style={styles.participantsList}>
                          {expense.participants.map((participant, index) => {
                            const isVerified = !progress.pending.includes(participant);
                            return (
                              <View 
                                key={index} 
                                style={[
                                  styles.participantBadge,
                                  isVerified ? styles.participantVerified : styles.participantPending
                                ]}
                              >
                                {participant} {isVerified && '✓'}
                              </View>
                            );
                          })}
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
                          onPress={() => handleSendReminder(expense)}
                          style={styles.actionButton}
                          contentStyle={styles.actionButtonContent}
                          icon={() => <Bell size={14} color="#3b82f6" />}
                        >
                          Remind
                        </Button>
                        <Button
                          mode="outlined"
                          onPress={() => handleAddComment(expense)}
                          style={styles.actionButton}
                          contentStyle={styles.actionButtonContent}
                          icon={() => <MessageCircle size={14} color="#3b82f6" />}
                        >
                          Comment
                        </Button>
                      </View>
                    </Card.Content>
                  </Card>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Clock size={32} color="#d97706" />
            </View>
            <Text style={styles.emptyTitle}>No pending expenses</Text>
            <Text style={styles.emptyText}>All expenses have been verified or rejected</Text>
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

      {/* Tips Footer */}
      <View style={styles.tipsFooter}>
        <Clock size={16} color="#d97706" />
        <Text style={styles.tipsText}>Tip: Send reminders to speed up verification process</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  backButton: { padding: 8, marginLeft: -8 },
  headerContent: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 16 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
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
  infoNotice: { padding: 16, backgroundColor: '#fef3c7', borderRadius: 8, marginBottom: 16 },
  noticeContent: { flexDirection: 'row' },
  noticeText: { flex: 1, marginLeft: 12 },
  noticeTitle: { fontSize: 16, fontWeight: '600', color: '#92400e', marginBottom: 4 },
  noticeSubtitle: { fontSize: 14, color: '#92400e', lineHeight: 20 },
  expensesList: { gap: 12 },
  expenseCard: { elevation: 2 },
  expenseContent: { padding: 16 },
  expenseHeader: { marginBottom: 12 },
  expenseMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  expenseTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  statusBadge: { backgroundColor: '#fef3c7', borderRadius: 12 },
  statusText: { color: '#92400e', fontSize: 12, fontWeight: '500', marginLeft: 4 },
  expenseDetails: { gap: 4 },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 14, color: '#6b7280', marginLeft: 6 },
  progressContainer: { padding: 12, backgroundColor: '#fef3c7', borderRadius: 8, marginBottom: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  progressTitle: { fontSize: 14, color: '#92400e', fontWeight: '600' },
  progressCount: { fontSize: 14, color: '#92400e' },
  progressBar: { height: 4, backgroundColor: '#f59e0b', borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 4, backgroundColor: '#d97706', borderRadius: 2 },
  progressPending: { fontSize: 12, color: '#92400e' },
  participants: { marginBottom: 12 },
  participantsLabel: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  participantsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  participantBadge: { backgroundColor: '#fef3c7' },
  participantVerified: { backgroundColor: '#dcfce7' },
  participantPending: { backgroundColor: '#fef3c7' },
  actions: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  actionButton: { flex: 1, borderColor: '#d1d5db' },
  actionButtonContent: { height: 36 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  emptyButton: { backgroundColor: '#3b82f6' },
  tipsFooter: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#fef3c7', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  tipsText: { fontSize: 14, color: '#92400e', marginLeft: 8 },
});