import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { Button, Card, Avatar } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ArrowLeft, Shield, CreditCard, Lock, Smartphone, CheckCircle } from 'lucide-react-native';
import { apiService } from '../services/api';
import { authStorage } from '../services/authStorage';

type RootStackParamList = {
  'settle-payment': { 
    settlementType: 'individual' | 'group' | 'global';
    expenseId?: number;
    groupId?: number;
    recipientId?: number;
    amount?: number;
  };
  dashboard: undefined;
  success: { message: string };
  // Add other screens...
};

type SettlePaymentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'settle-payment'>;
type SettlePaymentScreenRouteProp = RouteProp<RootStackParamList, 'settle-payment'>;

interface PaymentResult {
  transaction_id: string;
  processing_time: number;
  status: string;
}

interface Recipient {
  user_id: number;
  name: string;
  email?: string;
  balance: number;
  type: string;
  actionType: 'collect' | 'pay';
}

interface ExpenseSplit {
  user: { id: number; name?: string; username?: string; email: string };
  amount: string | number;
}

interface SettlePaymentScreenProps {
  navigation: SettlePaymentScreenNavigationProp;
  route: SettlePaymentScreenRouteProp;
  showLoading: (callback: () => void) => void;
}

export function SettlePaymentScreen({ navigation, route, showLoading }: SettlePaymentScreenProps) {
  const [paymentData, setPaymentData] = useState({
    recipient: '',
    amount: '',
    paymentMethod: '',
    note: ''
  });
  
  // Get settlement context from route params
  const { settlementType = 'group', expenseId, groupId } = route.params || {};

  // Helper function to get current user ID from auth storage
  const getCurrentUserId = async () => {
    try {
      const userData = await authStorage.getUserData();
      return userData?.id || null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  };
  const [step, setStep] = useState(1); // 1: Details, 2: Payment Method, 3: Confirmation, 4: Processing, 5: Success
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: '💵' },
    { id: 'upi', name: 'UPI', icon: '📱' }
  ];

  // Fetch settlement summary when component mounts
  useEffect(() => {
    fetchSettlementData();
  }, []);

  const fetchSettlementData = async () => {
    setLoading(true);
    
    if (settlementType === 'global' && route.params?.recipientId) {
      // For global settlement from GlobalSettleUpScreen, we have the recipient pre-selected
      const recipientId = route.params.recipientId;
      const amount = route.params.amount;
      
      // Fetch the recipient's details from settlement summary
      const result = await apiService.getSettlementSummary();
      setLoading(false);
      
      if (result.success) {
        const recipient = result.data.summary.find((item: Recipient) => item.user_id === recipientId);
        if (recipient) {
          // Map backend field names to our expected format
          const mappedRecipient: Recipient = {
            user_id: recipient.user_id,
            name: recipient.user_name,
            email: recipient.user_email,
            balance: recipient.amount,
            type: recipient.type,
            actionType: recipient.type === 'owes_to_you' ? 'collect' : 'pay'
          };
          setRecipients([mappedRecipient]);
          // Auto-select the recipient
          updatePaymentData('recipient', recipientId.toString());
          if (amount) {
            updatePaymentData('amount', amount.toString());
          }
        } else {
          Alert.alert('Error', 'Recipient not found');
        }
      } else {
        Alert.alert('Error', result.error);
      }
    } else if (settlementType === 'individual' && expenseId) {
      // For individual expense settlement, fetch specific expense details
      const result = await apiService.getExpenseDetails(expenseId);
      setLoading(false);
      
      if (result.success) {
        const expense = result.data;
        // Get the expense creator (person who paid)
        const creator = expense.paid_by;
        
        // Get current user ID
        const currentUserId = await getCurrentUserId();
        
        // If current user is not the creator, show creator as recipient (you owe them)
        // If current user is the creator, show split members who owe you money
        if (creator && creator.id !== currentUserId) {
          // Current user owes money to the expense creator
          // Find current user's split to get the exact amount they owe
          const currentUserSplit = expense.expense_splits?.find((split: ExpenseSplit) => 
            split.user.id === currentUserId
          );
          const amountOwed = currentUserSplit ? 
            parseFloat(currentUserSplit.amount || 0) : 
            parseFloat(expense.amount) / (expense.expense_splits?.length || 1);
            
          setRecipients([{
            user_id: creator.id,
            name: creator.name || creator.username || creator.email,
            balance: amountOwed,
            type: 'owes_to_them',
            actionType: 'pay' // Current user is paying money
          }]);
        } else {
          // Current user is the creator - others owe money to current user
          // Use the actual expense splits data to show who owes what
          const splitMembers = expense.expense_splits?.filter((split: ExpenseSplit) => 
            split.user.id !== currentUserId // Don't show current user
          ).map((split: ExpenseSplit) => ({
            user_id: split.user.id,
            name: split.user.name || split.user.username || split.user.email,
            balance: parseFloat(String(split.amount) || '0'),
            type: 'owes_to_you', // They owe money to current user
            actionType: 'collect' // Current user is collecting money
          })) || [];
          
          setRecipients(splitMembers);
        }
      } else {
        Alert.alert('Error', result.error);
      }
    } else if (settlementType === 'group' && groupId) {
      // For group settlement, get all group members and their balances
      const result = await apiService.getGroupSettlementSummary(groupId);
      setLoading(false);
      
      if (result.success) {
        console.log('Group settlement summary response:', result.data);
        const recipients = result.data.summary.map((item: Recipient) => ({
          user_id: item.user_id,
          name: item.name,
          email: item.email,
          balance: item.balance,
          type: item.type,
          actionType: item.type === 'owes_to_you' ? 'collect' : 'pay'
        }));
        console.log('Processed recipients:', recipients);
        setRecipients(recipients);
      } else {
        Alert.alert('Error', result.error);
      }
    } else {
      // Default: get all settlement data
      const result = await apiService.getSettlementSummary();
      setLoading(false);
      
      if (result.success) {
        // Show people who owe YOU money (for collection)
        // AND people you owe money to (for payment)
        // But since this is a "settle payment" screen, prioritize collections
        const owesToYou = result.data.summary.filter((item: Recipient) => item.type === 'owes_to_you');
        const youOweTo = result.data.summary.filter((item: Recipient) => item.type === 'owes_to_them');
        
        // Show collections first (people who owe you), then payments (people you owe)
        const allRecipients: Recipient[] = [
          ...owesToYou.map((item: Recipient) => ({ ...item, actionType: 'collect' as const })),
          ...youOweTo.map((item: Recipient) => ({ ...item, actionType: 'pay' as const }))
        ];
        
        setRecipients(allRecipients);
      } else {
        Alert.alert('Error', result.error);
      }
    }
  };

  const handleNext = () => {
    if (step === 1 && paymentData.recipient && paymentData.amount) {
      setStep(2);
    } else if (step === 2 && paymentData.paymentMethod) {
      setStep(3);
    }
  };

  const handlePayment = async () => {
    setStep(4); // Processing step
    
    const selectedRecipient = recipients.find(r => r.user_id.toString() === paymentData.recipient);
    
    const paymentRequest = {
      receiver_id: parseInt(paymentData.recipient),
      amount: parseFloat(paymentData.amount),
      payment_method: paymentData.paymentMethod,
      note: paymentData.note || '',
      settlement_type: settlementType,  // Pass settlement type to backend
      // Include expense_id if this is an individual expense settlement
      ...(settlementType === 'individual' && expenseId ? { expense_id: expenseId } : {})
    };
    
    console.log('Processing payment with data:', paymentRequest);
    console.log('Settlement type:', settlementType, 'Expense ID:', expenseId);
    console.log('Selected recipient:', selectedRecipient);
    
    // Validate required fields
    if (!paymentRequest.receiver_id || !paymentRequest.amount || !paymentRequest.payment_method) {
      Alert.alert('Payment Failed', 'Missing required payment information');
      setStep(3);
      return;
    }
    
    const result = await apiService.processPayment(paymentRequest);
    
    if (result.success) {
      setPaymentResult(result.data);
      setStep(5); // Success step
    } else {
      console.log('Payment failed with error:', result.error);
      Alert.alert('Payment Failed', result.error || 'Unknown error occurred');
      setStep(3); // Back to confirmation
    }
  };

  const handleConfirmPayment = async () => {
    await handlePayment();
  };

  const updatePaymentData = (field: string, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const renderProcessing = () => (
    <View style={styles.stepContent}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.processingContainer}>
            <View style={styles.loadingIcon}>
              {/* Add loading spinner here if needed */}
              <Text style={styles.loadingEmoji}>⏳</Text>
            </View>
            <Text style={styles.processingTitle}>Processing Payment</Text>
            <Text style={styles.processingSubtitle}>
              Securely processing your payment of ₹{parseFloat(paymentData.amount || '0').toFixed(2)}
            </Text>
            <Text style={styles.processingNote}>Please do not close this screen</Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.stepContent}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <CheckCircle size={64} color="#16a34a" />
            </View>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSubtitle}>
              ₹{parseFloat(paymentData.amount || '0').toFixed(2)} has been sent to {selectedRecipient?.name}
            </Text>
            
            {paymentResult && (
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>Transaction Details</Text>
                <View style={styles.transactionItem}>
                  <Text style={styles.transactionLabel}>Transaction ID</Text>
                  <Text style={styles.transactionValue}>{paymentResult.transaction_id}</Text>
                </View>
                <View style={styles.transactionItem}>
                  <Text style={styles.transactionLabel}>Processing Time</Text>
                  <Text style={styles.transactionValue}>{paymentResult.processing_time}ms</Text>
                </View>
                <View style={styles.transactionItem}>
                  <Text style={styles.transactionLabel}>Status</Text>
                  <Text style={[styles.transactionValue, styles.successStatus]}>
                    {paymentResult.status}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
      
      <Button 
        mode="contained"
        onPress={() => navigation.navigate('dashboard')}
        style={styles.primaryButton}
        contentStyle={styles.buttonContent}
      >
        Return to Dashboard
      </Button>
    </View>
  );

  const selectedRecipient = recipients.find(r => r.user_id.toString() === paymentData.recipient);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 1 ? navigation.navigate('dashboard') : setStep(step - 1)} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {settlementType === 'individual' ? 'Settle Expense' : 'Settle Payment'}
        </Text>
        <View style={styles.spacer} />
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.stepDot}>
              <View style={[styles.stepDotFill, i <= step && styles.stepDotActive]} />
              {i < 3 && <View style={[styles.stepLine, i < step && styles.stepLineActive]} />}
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Step 1: Payment Details */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <CreditCard size={20} color="#1f2937" />
                  <Text style={styles.cardTitle}>Payment Details</Text>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {recipients.length > 0 && recipients[0]?.actionType === 'collect' 
                      ? 'Collect from' 
                      : settlementType === 'individual' ? 'Pay to' : 'Select recipient'}
                  </Text>
                  
                  {loading ? (
                    <Text style={styles.loadingText}>Loading recipients...</Text>
                  ) : (
                    <View style={styles.recipientsList}>
                      {recipients.filter(r => r.balance !== 0).map((recipient) => (
                        <TouchableOpacity
                          key={recipient.user_id}
                          style={[
                            styles.recipientItem,
                            paymentData.recipient === recipient.user_id.toString() && styles.recipientSelected
                          ]}
                          onPress={() => updatePaymentData('recipient', recipient.user_id.toString())}
                        >
                          <Avatar.Text 
                            size={40} 
                            label={recipient.name ? recipient.name.split(' ').map(n => n[0]).join('') : 'U'} 
                          />
                          <View style={styles.recipientInfo}>
                            <Text style={styles.recipientName}>{recipient.name}</Text>
                            <Text style={styles.recipientBalance}>
                              {recipient.actionType === 'collect' || recipient.type === 'owes_to_you'
                                ? `Owes you: ₹${Math.abs(recipient.balance).toFixed(2)}`
                                : `You owe: ₹${recipient.balance.toFixed(2)}`
                              }
                            </Text>
                          </View>
                          {paymentData.recipient === recipient.user_id.toString() && (
                            <CheckCircle size={20} color="#3b82f6" />
                          )}
                        </TouchableOpacity>
                      ))}
                      
                      {recipients.filter(r => r.balance !== 0).length === 0 && !loading && (
                        <Text style={styles.noRecipientsText}>
                          {settlementType === 'individual' 
                            ? 'No one to pay for this expense' 
                            : 'All balances are settled'}
                        </Text>
                      )}
                      
                      {recipients.filter(r => r.balance !== 0).length > 0 && !loading && 
                       recipients.every(r => r.actionType === 'collect' || r.type === 'owes_to_you') && (
                        <View style={styles.noPaymentsNeeded}>
                          <CheckCircle size={48} color="#16a34a" />
                          <Text style={styles.noPaymentsTitle}>Great news!</Text>
                          <Text style={styles.noPaymentsSubtitle}>
                            You don't need to pay anyone. People owe you money instead!
                          </Text>
                          <Text style={styles.noPaymentsHint}>
                            Others can pay you using their settlement screens.
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Only show amount and note fields if there are people to pay */}
                {recipients.some(r => r.actionType === 'pay' || r.type === 'owes_to_them') && (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Amount</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={paymentData.amount}
                        onChangeText={(value) => updatePaymentData('amount', value)}
                        placeholder="0.00"
                      />
                      {selectedRecipient && (
                        <TouchableOpacity 
                          style={styles.fullAmountButton}
                          onPress={() => updatePaymentData('amount', selectedRecipient.balance.toString())}
                        >
                          <Text style={styles.fullAmountText}>Pay full amount (₹{selectedRecipient.balance.toFixed(2)})</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Note (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        value={paymentData.note}
                        onChangeText={(value) => updatePaymentData('note', value)}
                        placeholder="Payment for..."
                      />
                    </View>
                  </>
                )}
              </Card.Content>
            </Card>

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <Shield size={16} color="#16a34a" />
              <Text style={styles.securityText}>All payments are processed through secure, encrypted channels</Text>
            </View>
          </View>
        )}

        {/* Step 2: Payment Method */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Lock size={20} color="#1f2937" />
                  <Text style={styles.cardTitle}>Choose Payment Method</Text>
                </View>
                
                <View style={styles.paymentMethods}>
                  {paymentMethods.map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentMethod,
                        paymentData.paymentMethod === method.id && styles.paymentMethodSelected
                      ]}
                      onPress={() => updatePaymentData('paymentMethod', method.id)}
                    >
                      <Text style={styles.paymentIcon}>{method.icon}</Text>
                      <View style={styles.paymentInfo}>
                        <Text style={styles.paymentName}>{method.name}</Text>
                        <Text style={styles.paymentDesc}>Secure & instant transfer</Text>
                      </View>
                      {paymentData.paymentMethod === method.id && (
                        <CheckCircle size={20} color="#3b82f6" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </Card.Content>
            </Card>

            {/* Security Features */}
            <Card style={styles.securityCard}>
              <Card.Content style={styles.securityContent}>
                <Text style={styles.securityTitle}>Security Features</Text>
                <View style={styles.securityList}>
                  <View style={styles.securityItem}>
                    <CheckCircle size={16} color="#16a34a" />
                    <Text style={styles.securityItemText}>256-bit SSL encryption</Text>
                  </View>
                  <View style={styles.securityItem}>
                    <CheckCircle size={16} color="#16a34a" />
                    <Text style={styles.securityItemText}>Two-factor authentication</Text>
                  </View>
                  <View style={styles.securityItem}>
                    <CheckCircle size={16} color="#16a34a" />
                    <Text style={styles.securityItemText}>Fraud protection</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <CheckCircle size={20} color="#16a34a" />
                  <Text style={styles.cardTitle}>Confirm Payment</Text>
                </View>
                
                <View style={styles.confirmationList}>
                  <View style={styles.confirmationItem}>
                    <Text style={styles.confirmationLabel}>Recipient</Text>
                    <View style={styles.confirmationValue}>
                      <Avatar.Text size={24} label={selectedRecipient?.name? selectedRecipient.name.split(' ').map(n => n[0]).join('') : 'U'} />
                      <Text style={styles.confirmationText}>{selectedRecipient?.name}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.confirmationItem}>
                    <Text style={styles.confirmationLabel}>Amount</Text>
                    <Text style={styles.confirmationAmount}>₹{parseFloat(paymentData.amount || '0').toFixed(2)}</Text>
                  </View>
                  
                  <View style={styles.confirmationItem}>
                    <Text style={styles.confirmationLabel}>Payment Method</Text>
                    <Text style={styles.confirmationText}>
                      {paymentMethods.find(m => m.id === paymentData.paymentMethod)?.name}
                    </Text>
                  </View>
                  
                  {paymentData.note && (
                    <View style={styles.confirmationItem}>
                      <Text style={styles.confirmationLabel}>Note</Text>
                      <Text style={styles.confirmationText}>{paymentData.note}</Text>
                    </View>
                  )}
                  
                  <View style={styles.confirmationItem}>
                    <Text style={styles.confirmationLabel}>Processing Fee</Text>
                    <Text style={styles.confirmationText}>₹0.00</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Final Security Check */}
            <View style={styles.finalSecurity}>
              <Smartphone size={16} color="#3b82f6" />
              <Text style={styles.finalSecurityText}>A confirmation will be sent to your registered phone number</Text>
            </View>
          </View>
        )}

        {/* Step 4: Processing */}
        {step === 4 && renderProcessing()}

        {/* Step 5: Success */}
        {step === 5 && renderSuccess()}
      </ScrollView>

      {/* Footer - Hide during processing, success, and when only collections available */}
      {step < 4 && recipients.filter(r => r.balance !== 0).some(r => r.actionType === 'pay' || r.type === 'owes_to_them') && (
        <View style={styles.footer}>
          <Button 
            mode="contained"
            onPress={step === 3 ? handleConfirmPayment : handleNext}
            disabled={
              (step === 1 && (!paymentData.recipient || !paymentData.amount)) ||
              (step === 2 && !paymentData.paymentMethod)
            }
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
            icon={() => <Lock size={16} color="#fff" />}
          >
            {step === 3 ? 'Confirm Payment' : 'Continue'}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  backButton: { position: 'absolute', left: 16, top: 16, padding: 8, zIndex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', textAlign: 'center' },
  spacer: { width: 32 },
  stepIndicator: { position: 'absolute', right: 24, top: 16, flexDirection: 'row', alignItems: 'center' },
  stepDot: { flexDirection: 'row', alignItems: 'center' },
  stepDotFill: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d1d5db' },
  stepDotActive: { backgroundColor: '#3b82f6' },
  stepLine: { width: 24, height: 1, backgroundColor: '#d1d5db', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: '#3b82f6' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 100 },
  stepContent: { gap: 16 },
  card: { elevation: 2 },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginLeft: 8 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' },
  fullAmountButton: { marginTop: 8 },
  fullAmountText: { color: '#3b82f6', fontSize: 14 },
  securityNotice: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f0fdf4', borderRadius: 8 },
  securityText: { fontSize: 14, color: '#16a34a', marginLeft: 8 },
  paymentMethods: { gap: 12 },
  paymentMethod: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#fff' },
  paymentMethodSelected: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  paymentIcon: { fontSize: 24, marginRight: 12 },
  paymentInfo: { flex: 1 },
  paymentName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  paymentDesc: { fontSize: 14, color: '#6b7280' },
  securityCard: { elevation: 2 },
  securityContent: { padding: 16 },
  securityTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  securityList: { gap: 8 },
  securityItem: { flexDirection: 'row', alignItems: 'center' },
  securityItemText: { fontSize: 14, color: '#374151', marginLeft: 8 },
  confirmationList: { gap: 12 },
  confirmationItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  confirmationLabel: { fontSize: 14, color: '#6b7280' },
  confirmationValue: { flexDirection: 'row', alignItems: 'center' },
  confirmationText: { fontSize: 14, color: '#1f2937', marginLeft: 8 },
  confirmationAmount: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  finalSecurity: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#eff6ff', borderRadius: 8 },
  finalSecurityText: { fontSize: 14, color: '#3b82f6', marginLeft: 8 },
  processingContainer: { alignItems: 'center', paddingVertical: 32 },
  loadingIcon: { marginBottom: 16 },
  loadingEmoji: { fontSize: 48, textAlign: 'center' },
  processingTitle: { fontSize: 20, fontWeight: '600', color: '#1f2937', marginBottom: 8, textAlign: 'center' },
  processingSubtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  processingNote: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  successContainer: { alignItems: 'center', paddingVertical: 32 },
  successIcon: { marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: '700', color: '#16a34a', marginBottom: 8, textAlign: 'center' },
  successSubtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  transactionDetails: { width: '100%', backgroundColor: '#f9fafb', padding: 16, borderRadius: 8 },
  transactionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  transactionLabel: { fontSize: 14, color: '#6b7280' },
  transactionValue: { fontSize: 14, color: '#1f2937', fontWeight: '500' },
  successStatus: { color: '#16a34a', fontWeight: '600' },
  loadingText: { fontSize: 14, color: '#6b7280', textAlign: 'center', padding: 16 },
  recipientsList: { gap: 8 },
  recipientItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 8, 
    backgroundColor: '#fff' 
  },
  recipientSelected: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  recipientInfo: { flex: 1, marginLeft: 12 },
  recipientName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  recipientBalance: { fontSize: 14, color: '#6b7280' },
  noRecipientsText: { fontSize: 14, color: '#6b7280', textAlign: 'center', padding: 16 },
  noPaymentsNeeded: { 
    alignItems: 'center', 
    padding: 32, 
    backgroundColor: '#f0fdf4', 
    borderRadius: 12, 
    marginVertical: 16 
  },
  noPaymentsTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#16a34a', 
    marginTop: 12, 
    marginBottom: 8 
  },
  noPaymentsSubtitle: { 
    fontSize: 16, 
    color: '#15803d', 
    textAlign: 'center', 
    marginBottom: 8 
  },
  noPaymentsHint: { 
    fontSize: 14, 
    color: '#16a34a', 
    textAlign: 'center', 
    opacity: 0.8 
  },
  footer: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  primaryButton: { backgroundColor: '#3b82f6' },
  buttonContent: { height: 48 },
});