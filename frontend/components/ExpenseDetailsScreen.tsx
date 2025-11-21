import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Button, Card, Avatar, TextInput as PaperTextInput } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ArrowLeft, Users, Calendar, DollarSign, MessageSquare, CreditCard, Edit } from 'lucide-react-native';
import { authStorage } from '../services/authStorage';
import type { Expense } from '../App';

type RootStackParamList = {
  expenseDetails: { expense: Expense };
  dashboard: undefined;
  'settle-payment': { 
    settlementType: 'individual' | 'group';
    expenseId?: number;
    groupId?: number;
  };
  // Add other screens...
};

type ExpenseDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'expenseDetails'>;
type ExpenseDetailsScreenRouteProp = RouteProp<RootStackParamList, 'expenseDetails'>;

interface ExpenseDetailsScreenProps {
  navigation: ExpenseDetailsScreenNavigationProp;
  route: ExpenseDetailsScreenRouteProp;
}

export function ExpenseDetailsScreen({ navigation, route }: ExpenseDetailsScreenProps) {
  const { expense } = route.params;
  const [newComment, setNewComment] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Get current user ID on component mount
  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const userData = await authStorage.getUserData();
        setCurrentUserId(userData?.id || null);
      } catch (error) {
        console.error('Error getting current user ID:', error);
      }
    };
    getCurrentUserId();
  }, []);

  // Handle expense_splits safely
  const expenseSplits = expense.expense_splits || [];
  const splitAmount = expenseSplits.length > 0 ? parseFloat(expense.amount) / expenseSplits.length : parseFloat(expense.amount);

  // Helper function to determine amount color and status for each split
  const getSplitDisplayInfo = (split: any) => {
    const splitAmount = parseFloat(split.amount);
    const isPaidBy = split.user?.id === expense.paid_by?.id;
    const isCurrentUser = split.user?.id === currentUserId;
    const paidByIsCurrentUser = expense.paid_by?.id === currentUserId;

    if (isPaidBy) {
      // This person paid the expense - show how much they will get back from others
      const otherSplits = expenseSplits.filter((s: any) => s.user?.id !== split.user?.id);
      const totalOthersOwe = otherSplits.reduce((sum: number, s: any) => sum + parseFloat(s.amount), 0);
      
      if (isCurrentUser) {
        // Current user paid - show how much others owe them
        return {
          amountColor: '#16a34a', // Green - money coming to you
          statusText: 'You paid',
          amountLabel: 'will receive',
          backgroundColor: '#f0fdf4',
          displayAmount: totalOthersOwe
        };
      } else {
        // Someone else paid - show how much others owe them
        return {
          amountColor: '#16a34a', // Green - they will receive money
          statusText: 'Paid the expense',
          amountLabel: 'will receive',
          backgroundColor: '#f0fdf4',
          displayAmount: totalOthersOwe
        };
      }
    } else {
      // This person owes money
      if (isCurrentUser) {
        // Current user owes money
        return {
          amountColor: splitAmount > 0 ? '#dc2626' : '#6b7280', // Red if owes, gray if settled
          statusText: splitAmount > 0 ? 'You owe' : 'You paid your share',
          amountLabel: splitAmount > 0 ? 'owe' : 'settled',
          backgroundColor: splitAmount > 0 ? '#fef2f2' : '#f9fafb',
          displayAmount: splitAmount
        };
      } else if (paidByIsCurrentUser) {
        // Current user paid, this person owes current user
        return {
          amountColor: splitAmount > 0 ? '#16a34a' : '#6b7280', // Green if they owe you, gray if settled
          statusText: splitAmount > 0 ? 'Owes you' : 'Paid their share',
          amountLabel: splitAmount > 0 ? 'owes you' : 'settled',
          backgroundColor: splitAmount > 0 ? '#f0fdf4' : '#f9fafb',
          displayAmount: splitAmount
        };
      } else {
        // Neither current user paid nor owes to current user
        return {
          amountColor: splitAmount > 0 ? '#f59e0b' : '#6b7280', // Orange for third-party debt, gray if settled
          statusText: splitAmount > 0 ? 'Owes the group' : 'Paid their share',
          amountLabel: splitAmount > 0 ? 'owes' : 'settled',
          backgroundColor: splitAmount > 0 ? '#fffbeb' : '#f9fafb',
          displayAmount: splitAmount
        };
      }
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    // Simulate adding comment
    console.log('Adding comment:', newComment);
    setNewComment('');
  };

  const handleSettle = () => {
    navigation.navigate('settle-payment', {
      settlementType: 'individual',
      expenseId: expense.id,
      groupId: expense.group?.id
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('dashboard')} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Expense Details</Text>
        <TouchableOpacity style={styles.editButton}>
          <Edit size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Expense Info */}
        <Card style={styles.expenseCard}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.expenseHeader}>
              <Text style={styles.expenseTitle}>{expense.title}</Text>
              <View style={[styles.statusBadge, styles.pendingBadge]}>
                <Text style={[styles.statusText, styles.pendingText]}>
                  Pending
                </Text>
              </View>
            </View>
            
            <View style={styles.expenseGrid}>
              <View style={styles.expenseItem}>
                <DollarSign size={16} color="#6b7280" />
                <View style={styles.expenseItemContent}>
                  <Text style={styles.expenseLabel}>Total Amount</Text>
                  <Text style={styles.expenseValue}>${parseFloat(expense.amount).toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.expenseItem}>
                <Calendar size={16} color="#6b7280" />
                <View style={styles.expenseItemContent}>
                  <Text style={styles.expenseLabel}>Date</Text>
                  <Text style={styles.expenseValue}>{new Date(expense.expense_date).toLocaleDateString()}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.expenseItem}>
              <Users size={16} color="#6b7280" />
              <View style={styles.expenseItemContent}>
                <Text style={styles.expenseLabel}>Split Type</Text>
                <Text style={styles.expenseValue}>{expense.split_type || 'equal'}</Text>
              </View>
            </View>

            <View style={styles.expenseItem}>
              <View style={styles.expenseItemContent}>
                <Text style={styles.expenseLabel}>Paid by</Text>
                <Text style={styles.expenseValue}>
                  {expense.paid_by?.full_name || expense.paid_by?.first_name || expense.paid_by?.email || 'Unknown'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Split Breakdown */}
        <Card style={styles.splitCard}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Users size={20} color="#1f2937" />
              <Text style={styles.cardTitle}>Split Breakdown</Text>
            </View>
            
            <View style={styles.splitList}>
              {/* Split participants */}
              {expenseSplits.map((split: any, index: number) => {
                const displayInfo = getSplitDisplayInfo(split);
                
                return (
                  <View 
                    key={split.id || index} 
                    style={[
                      styles.splitItem,
                      { backgroundColor: displayInfo.backgroundColor }
                    ]}
                  >
                    <Avatar.Text 
                      size={40} 
                      label={(split.user?.first_name || split.user?.email || 'U').charAt(0).toUpperCase()}
                      style={styles.splitAvatar} 
                    />
                    <View style={styles.splitContent}>
                      <Text style={styles.splitName}>
                        {split.user?.full_name || split.user?.first_name || split.user?.email || 'Unknown'}
                      </Text>
                      <Text style={[styles.splitRole, { color: displayInfo.amountColor }]}>
                        {displayInfo.statusText}
                      </Text>
                    </View>
                    <View style={styles.splitAmount}>
                      <Text style={[styles.amountValue, { color: displayInfo.amountColor }]}>
                        ${displayInfo.displayAmount.toFixed(2)}
                      </Text>
                      <Text style={[styles.amountLabel, { color: displayInfo.amountColor }]}>
                        {displayInfo.amountLabel}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        {/* Comments */}
        <Card style={styles.commentsCard}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <MessageSquare size={20} color="#1f2937" />
              <Text style={styles.cardTitle}>Comments ({expense.comments?.length || 0})</Text>
            </View>
            
            {expense.comments && expense.comments.length > 0 ? (
              <View style={styles.commentsList}>
                {expense.comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <Avatar.Text size={32} label={comment.user.split(' ').map(n => n[0]).join('')} />
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentUser}>{comment.user}</Text>
                        <Text style={styles.commentDate}>
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{comment.message}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noComments}>No comments yet</Text>
            )}
            
            <View style={styles.addComment}>
              <PaperTextInput
                mode="outlined"
                multiline
                numberOfLines={3}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment..."
                style={styles.commentInput}
              />
              <Button 
                mode="outlined"
                onPress={handleAddComment}
                disabled={!newComment.trim()}
                style={styles.commentButton}
              >
                Add Comment
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Footer Actions - Always show settle button since API doesn't track settled status */}
      <View style={styles.footer}>
        <Button 
          mode="contained"
          onPress={handleSettle}
          style={styles.settleButton}
          contentStyle={styles.buttonContent}
          icon={() => <CreditCard size={16} color="#fff" />}
        >
          Settle Payment
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  editButton: { padding: 8 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 100 },
  expenseCard: { marginBottom: 16, elevation: 2 },
  cardContent: { padding: 16 },
  expenseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  expenseTitle: { fontSize: 20, fontWeight: '600', color: '#1f2937' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  settledBadge: { backgroundColor: '#dcfce7' },
  pendingBadge: { backgroundColor: '#fef3c7' },
  statusText: { fontSize: 12, fontWeight: '500' },
  settledText: { color: '#166534' },
  pendingText: { color: '#92400e' },
  expenseGrid: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  expenseItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  expenseItemContent: { marginLeft: 8, flex: 1 },
  expenseLabel: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  expenseValue: { fontSize: 16, fontWeight: '500', color: '#1f2937' },
  splitCard: { marginBottom: 16, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginLeft: 8 },
  splitList: { gap: 12 },
  splitItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  splitAvatar: { backgroundColor: '#e5e7eb' },
  splitContent: { flex: 1, marginLeft: 12 },
  splitName: { fontSize: 16, fontWeight: '500', color: '#1f2937' },
  splitRole: { fontSize: 14, color: '#6b7280' },
  splitAmount: { alignItems: 'flex-end' },
  amountNeutral: { fontSize: 16, fontWeight: '600', color: '#374151' },
  amountValue: { fontSize: 16, fontWeight: '600' },
  amountLabel: { fontSize: 12, marginTop: 2 },
  commentsCard: { elevation: 2 },
  commentsList: { marginBottom: 16, gap: 12 },
  commentItem: { flexDirection: 'row', alignItems: 'flex-start' },
  commentContent: { flex: 1, marginLeft: 12 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  commentUser: { fontSize: 14, fontWeight: '500', color: '#1f2937' },
  commentDate: { fontSize: 12, color: '#6b7280' },
  commentText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  noComments: { textAlign: 'center', color: '#6b7280', marginBottom: 16 },
  addComment: { gap: 12 },
  commentInput: { backgroundColor: '#fff' },
  commentButton: { alignSelf: 'flex-start' },
  footer: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  settleButton: { backgroundColor: '#3b82f6' },
  buttonContent: { height: 48 },
});