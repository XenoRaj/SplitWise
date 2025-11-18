import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Button, Card, Badge } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ArrowLeft, CheckCircle, DollarSign, Calendar, Users, Eye, Shield,Plus } from 'lucide-react-native';
import type { GroupExpense, Group, User } from '../App';

type RootStackParamList = {
  verificationCompleted: { categoryType: string; expenses: GroupExpense[]; group: Group };
  groupDetails: { group: Group };
  expenseDetails: { expense: GroupExpense };
  addExpense: undefined;
  // Add other screens...
};

type VerificationCompletedScreenNavigationProp = StackNavigationProp<RootStackParamList, 'verificationCompleted'>;
type VerificationCompletedScreenRouteProp = RouteProp<RootStackParamList, 'verificationCompleted'>;

interface VerificationCompletedScreenProps {
  navigation: VerificationCompletedScreenNavigationProp;
  route: VerificationCompletedScreenRouteProp;
  user: User | null;
}

export function VerificationCompletedScreen({ navigation, route }: VerificationCompletedScreenProps) {
  const { categoryType, expenses, group } = route.params;

  if (!group) {
    return null;
  }

  // Filter completed expenses
  const completedExpenses = expenses.filter(expense => expense.status === 'completed');
  const totalVerified = completedExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const handleViewExpense = (expense: GroupExpense) => {
    navigation.navigate('expenseDetails', { expense });
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
            <CheckCircle size={20} color="#16a34a" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Verified Expenses</Text>
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
            <Text style={styles.statLabel}>Total Verified</Text>
            <Text style={styles.statValue}>${totalVerified.toFixed(2)}</Text>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <CheckCircle size={16} color="#6b7280" />
            </View>
            <Text style={styles.statLabel}>Expenses Count</Text>
            <Text style={styles.statValue}>{completedExpenses.length}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {completedExpenses.length > 0 ? (
          <View style={styles.expensesList}>
            {completedExpenses.map((expense) => (
              <Card key={expense.id} style={styles.expenseCard}>
                <Card.Content style={styles.expenseContent}>
                  <View style={styles.expenseHeader}>
                    <View style={styles.expenseMain}>
                      <Text style={styles.expenseTitle}>{expense.title}</Text>
                      <View style={styles.statusBadge}>
                        <CheckCircle size={12} color="#16a34a" />
                        <Text style={styles.statusText}>Verified</Text>
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

                  {/* Verification Info */}
                  <View style={styles.verificationInfo}>
                    <View style={styles.verificationHeader}>
                      <Shield size={16} color="#16a34a" />
                      <Text style={styles.verificationTitle}>Verification Completed</Text>
                    </View>
                    <Text style={styles.verificationText}>
                      This expense has been reviewed and approved by all group members. 
                      It's now included in the group balance calculations.
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

                  {/* Action Button */}
                  <View style={styles.actionContainer}>
                    <Button
                      mode="outlined"
                      onPress={() => handleViewExpense(expense)}
                      style={styles.actionButton}
                      contentStyle={styles.actionButtonContent}
                      icon={() => <Eye size={14} color="#3b82f6" />}
                    >
                      View Details
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <CheckCircle size={32} color="#16a34a" />
            </View>
            <Text style={styles.emptyTitle}>No verified expenses yet</Text>
            <Text style={styles.emptyText}>Once expenses are approved by group members, they'll appear here</Text>
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

      {/* Security Footer */}
      <View style={styles.securityFooter}>
        <Shield size={16} color="#16a34a" />
        <Text style={styles.securityText}>All verified expenses are cryptographically secured</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  backButton: { padding: 8, marginLeft: -8 },
  headerContent: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 16 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
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
  expensesList: { gap: 12 },
  expenseCard: { elevation: 2 },
  expenseContent: { padding: 16 },
  expenseHeader: { marginBottom: 12 },
  expenseMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  expenseTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  statusBadge: { backgroundColor: '#dcfce7', borderRadius: 12 },
  statusText: { color: '#166534', fontSize: 12, fontWeight: '500', marginLeft: 4 },
  expenseDetails: { gap: 4 },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 14, color: '#6b7280', marginLeft: 6 },
  verificationInfo: { padding: 12, backgroundColor: '#f0fdf4', borderRadius: 8, marginBottom: 12 },
  verificationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  verificationTitle: { fontSize: 14, fontWeight: '600', color: '#166534', marginLeft: 6 },
  verificationText: { fontSize: 14, color: '#166534' },
  participants: { marginBottom: 12 },
  participantsLabel: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  participantsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  participantBadge: { backgroundColor: '#f3f4f6' },
  actionContainer: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  actionButton: { borderColor: '#d1d5db' },
  actionButtonContent: { height: 36 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  emptyButton: { backgroundColor: '#3b82f6' },
  securityFooter: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#f0fdf4', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  securityText: { fontSize: 14, color: '#16a34a', marginLeft: 8 },
});