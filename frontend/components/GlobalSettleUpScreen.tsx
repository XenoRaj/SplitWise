import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Button, Card, Avatar } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, DollarSign, CheckCircle, AlertCircle } from 'lucide-react-native';
import { apiService } from '../services/api';

type RootStackParamList = {
  'global-settle-up': undefined;
  'settle-payment': { 
    settlementType: 'individual' | 'group' | 'global';
    expenseId?: number;
    groupId?: number;
    recipientId?: number;
    amount?: number;
  };
  dashboard: undefined;
};

type GlobalSettleUpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'global-settle-up'>;
type GlobalSettleUpScreenRouteProp = RouteProp<RootStackParamList, 'global-settle-up'>;

interface DebtSummary {
  user_id: number;
  user_name: string;
  user_email: string;
  amount: number;
  type: 'owes_to_you' | 'owes_to_them';
}

interface GlobalSettleUpScreenProps {
  navigation: GlobalSettleUpScreenNavigationProp;
  route: GlobalSettleUpScreenRouteProp;
}

export function GlobalSettleUpScreen({ navigation, route }: GlobalSettleUpScreenProps) {
  const [debts, setDebts] = useState<DebtSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipient, setSelectedRecipient] = useState<number | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchAllDebts();
    }, [])
  );

  const fetchAllDebts = async () => {
    setLoading(true);
    const result = await apiService.getSettlementSummary();
    
    if (result.success) {
      setDebts(result.data.summary || []);
    } else {
      Alert.alert('Error', result.error || 'Failed to load debts');
    }
    setLoading(false);
  };

  const handleSettleWithUser = () => {
    if (!selectedRecipient) {
      Alert.alert('Error', 'Please select a person to settle with');
      return;
    }

    const debt = debts.find(d => d.user_id === selectedRecipient);
    if (!debt) {
      Alert.alert('Error', 'User not found');
      return;
    }

    navigation.navigate('settle-payment', {
      settlementType: 'global',
      recipientId: selectedRecipient,
      amount: debt.amount
    });
  };

  const youOweDebts = debts.filter(d => d.type === 'owes_to_them');
  const youAreOwedDebts = debts.filter(d => d.type === 'owes_to_you');
  const totalYouOwe = youOweDebts.reduce((sum, d) => sum + d.amount, 0);
  const totalOwedToYou = youAreOwedDebts.reduce((sum, d) => sum + d.amount, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('dashboard')} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Global Settle Up</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Summary Card */}
        {!loading && (
          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>Your Balance Summary</Text>
              
              <View style={styles.balanceGrid}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>You Owe</Text>
                  <Text style={styles.balanceAmountRed}>₹{totalYouOwe.toFixed(2)}</Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceLabel}>Owed to You</Text>
                  <Text style={styles.balanceAmountGreen}>₹{totalOwedToYou.toFixed(2)}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading your debts...</Text>
          </View>
        ) : (
          <>
            {/* You Owe Section */}
            {youOweDebts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>You Owe</Text>
                <View style={styles.debtsList}>
                  {youOweDebts.map((debt) => (
                    <TouchableOpacity
                      key={debt.user_id}
                      style={[
                        styles.debtItem,
                        selectedRecipient === debt.user_id && styles.debtItemSelected
                      ]}
                      onPress={() => setSelectedRecipient(debt.user_id)}
                    >
                      <Avatar.Text 
                        size={40} 
                        label={debt.user_name ? debt.user_name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                        style={styles.avatar}
                      />
                      <View style={styles.debtInfo}>
                        <Text style={styles.debtName}>{debt.user_name}</Text>
                        <Text style={styles.debtEmail}>{debt.user_email}</Text>
                      </View>
                      <View style={styles.debtAmount}>
                        <Text style={styles.amountRed}>₹{debt.amount.toFixed(2)}</Text>
                        <Text style={styles.amountLabel}>Owe</Text>
                      </View>
                      {selectedRecipient === debt.user_id && (
                        <CheckCircle size={24} color="#3b82f6" style={styles.checkIcon} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* You Are Owed Section */}
            {youAreOwedDebts.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Others Owe You</Text>
                <View style={styles.debtsList}>
                  {youAreOwedDebts.map((debt) => (
                    <View
                      key={debt.user_id}
                      style={[styles.debtItem, styles.debtItemDisabled]}
                    >
                      <Avatar.Text 
                        size={40} 
                        label={debt.user_name ? debt.user_name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                        style={styles.avatar}
                      />
                      <View style={styles.debtInfo}>
                        <Text style={styles.debtName}>{debt.user_name}</Text>
                        <Text style={styles.debtEmail}>{debt.user_email}</Text>
                      </View>
                      <View style={styles.debtAmount}>
                        <Text style={styles.amountGreen}>₹{debt.amount.toFixed(2)}</Text>
                        <Text style={styles.amountLabel}>Owes You</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.infoBox}>
                  <AlertCircle size={16} color="#16a34a" />
                  <Text style={styles.infoText}>Others can settle with you using their settlement screens</Text>
                </View>
              </View>
            )}

            {youOweDebts.length === 0 && youAreOwedDebts.length === 0 && (
              <View style={styles.noDebtsContainer}>
                <CheckCircle size={64} color="#16a34a" />
                <Text style={styles.noDebtsTitle}>All Settled!</Text>
                <Text style={styles.noDebtsSubtitle}>You have no outstanding debts</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Footer */}
      {youOweDebts.length > 0 && selectedRecipient !== null && (
        <View style={styles.footer}>
          <Button 
            mode="contained"
            onPress={handleSettleWithUser}
            style={styles.settleButton}
            contentStyle={styles.buttonContent}
            icon={() => <DollarSign size={16} color="#fff" />}
          >
            Settle with {debts.find(d => d.user_id === selectedRecipient)?.user_name?.split(' ')[0]}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937', flex: 1, textAlign: 'center' },
  spacer: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 120 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
  loadingText: { fontSize: 16, color: '#6b7280', marginTop: 16 },
  summaryCard: { elevation: 2, marginBottom: 24 },
  summaryContent: { padding: 20, backgroundColor: '#eff6ff', borderRadius: 12 },
  summaryTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 16 },
  balanceGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  balanceItem: { alignItems: 'center', flex: 1 },
  balanceDivider: { width: 1, height: 60, backgroundColor: '#d1d5db', marginHorizontal: 16 },
  balanceLabel: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  balanceAmountRed: { fontSize: 24, fontWeight: '700', color: '#dc2626' },
  balanceAmountGreen: { fontSize: 24, fontWeight: '700', color: '#16a34a' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  debtsList: { gap: 8 },
  debtItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 2, borderColor: '#e5e7eb' },
  debtItemSelected: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  debtItemDisabled: { opacity: 0.6 },
  avatar: { marginRight: 12 },
  debtInfo: { flex: 1 },
  debtName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  debtEmail: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  debtAmount: { alignItems: 'flex-end', marginRight: 12 },
  amountRed: { fontSize: 16, fontWeight: '700', color: '#dc2626' },
  amountGreen: { fontSize: 16, fontWeight: '700', color: '#16a34a' },
  amountLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  checkIcon: { marginLeft: 8 },
  infoBox: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f0fdf4', borderRadius: 8, marginTop: 12 },
  infoText: { fontSize: 13, color: '#16a34a', marginLeft: 8, flex: 1 },
  noDebtsContainer: { alignItems: 'center', paddingVertical: 80 },
  noDebtsTitle: { fontSize: 24, fontWeight: '700', color: '#16a34a', marginTop: 16, marginBottom: 8 },
  noDebtsSubtitle: { fontSize: 16, color: '#6b7280' },
  footer: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  settleButton: { backgroundColor: '#3b82f6' },
  buttonContent: { height: 48 },
});
