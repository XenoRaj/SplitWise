import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Button, Card, Avatar } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ArrowLeft, Shield, CreditCard, Lock, Smartphone, CheckCircle } from 'lucide-react-native';

type RootStackParamList = {
  settlePayment: undefined;
  dashboard: undefined;
  success: { message: string };
  // Add other screens...
};

type SettlePaymentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'settlePayment'>;
type SettlePaymentScreenRouteProp = RouteProp<RootStackParamList, 'settlePayment'>;

interface SettlePaymentScreenProps {
  navigation: SettlePaymentScreenNavigationProp;
  route: SettlePaymentScreenRouteProp;
  showLoading: (callback: () => void) => void;
}

export function SettlePaymentScreen({ navigation, showLoading }: SettlePaymentScreenProps) {
  const [paymentData, setPaymentData] = useState({
    recipient: '',
    amount: '',
    paymentMethod: '',
    note: ''
  });
  const [step, setStep] = useState(1); // 1: Details, 2: Payment Method, 3: Confirmation

  const recipients = [
    { id: '1', name: 'Sarah Chen', balance: 15.50 },
    { id: '2', name: 'Mike Wilson', balance: 8.25 },
    { id: '3', name: 'Emily Davis', balance: 22.75 }
  ];

  const paymentMethods = [
    { id: 'venmo', name: 'Venmo', icon: '📱' },
    { id: 'paypal', name: 'PayPal', icon: '💙' },
    { id: 'bank', name: 'Bank Transfer', icon: '🏦' },
    { id: 'zelle', name: 'Zelle', icon: '⚡' }
  ];

  const handleNext = () => {
    if (step === 1 && paymentData.recipient && paymentData.amount) {
      setStep(2);
    } else if (step === 2 && paymentData.paymentMethod) {
      setStep(3);
    }
  };

  const handleConfirmPayment = () => {
    showLoading(() => {
      navigation.navigate('success', { 
        message: 'Payment processed successfully! Your balance has been updated.' 
      });
    });
  };

  const updatePaymentData = (field: string, value: string) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  const selectedRecipient = recipients.find(r => r.id === paymentData.recipient);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 1 ? navigation.navigate('dashboard') : setStep(step - 1)} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settle Payment</Text>
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
                  <Text style={styles.label}>Pay to</Text>
                  <TextInput
                    style={styles.input}
                    value={paymentData.recipient}
                    onChangeText={(value) => updatePaymentData('recipient', value)}
                    placeholder="Select recipient"
                  />
                  {/* In a real app, use a proper picker */}
                </View>

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
                      <Text style={styles.fullAmountText}>Pay full amount (${selectedRecipient.balance.toFixed(2)})</Text>
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
                    <Text style={styles.confirmationAmount}>${parseFloat(paymentData.amount || '0').toFixed(2)}</Text>
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
                    <Text style={styles.confirmationText}>$0.00</Text>
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
      </ScrollView>

      {/* Footer */}
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
  footer: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  primaryButton: { backgroundColor: '#3b82f6' },
  buttonContent: { height: 48 },
});