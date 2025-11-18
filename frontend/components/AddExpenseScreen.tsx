import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Button, Card, Avatar, Checkbox, Chip } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ArrowLeft, Shield, Camera, Users, DollarSign } from 'lucide-react-native';
import type { User } from '../App';

type RootStackParamList = {
  addExpense: undefined;
  dashboard: undefined;
  success: { message: string };
  // Add other screens...
};

type AddExpenseScreenNavigationProp = StackNavigationProp<RootStackParamList, 'addExpense'>;
type AddExpenseScreenRouteProp = RouteProp<RootStackParamList, 'addExpense'>;

interface AddExpenseScreenProps {
  navigation: AddExpenseScreenNavigationProp;
  route: AddExpenseScreenRouteProp;
  user: User | null;
  showLoading: (callback: () => void) => void;
}

export function AddExpenseScreen({ navigation, user, showLoading }: AddExpenseScreenProps) {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    splitType: 'equal'
  });
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [error, setError] = useState('');

  const categories = [
    'Food & Dining',
    'Transportation',
    'Entertainment',
    'Shopping',
    'Utilities',
    'Travel',
    'Healthcare',
    'Other'
  ];

  const friends = [
    { id: '1', name: 'Sarah Chen', avatar: '👩‍💼' },
    { id: '2', name: 'Mike Wilson', avatar: '👨‍💻' },
    { id: '3', name: 'Emily Davis', avatar: '👩‍🎓' },
    { id: '4', name: 'John Smith', avatar: '👨‍🏫' },
    { id: '5', name: 'Lisa Brown', avatar: '👩‍⚕️' }
  ];

  const handleAddExpense = () => {
    if (!formData.title || !formData.amount || !formData.category) {
      setError('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (selectedFriends.length === 0) {
      setError('Please select at least one person to split with');
      return;
    }

    setError('');
    showLoading(() => {
      navigation.navigate('success', { 
        message: 'Expense added successfully! Notifications sent to all participants.' 
      });
    });
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const splitAmount = formData.amount ? 
    parseFloat(formData.amount) / (selectedFriends.length + 1) : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('dashboard')} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Expense</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          {/* Basic Details */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Expense Title *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={(value) => updateFormData('title', value)}
                  placeholder="e.g., Dinner at Italiano"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                  <Text style={styles.label}>Amount *</Text>
                  <View style={styles.inputWithIcon}>
                    <DollarSign size={16} color="#6b7280" style={styles.icon} />
                    <TextInput
                      style={styles.inputWithIconText}
                      keyboardType="numeric"
                      value={formData.amount}
                      onChangeText={(value) => updateFormData('amount', value)}
                      placeholder="0.00"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Date</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.date}
                    onChangeText={(value) => updateFormData('date', value)}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category *</Text>
                <View style={styles.pickerContainer}>
                  <TextInput
                    style={styles.input}
                    value={formData.category}
                    onChangeText={(value) => updateFormData('category', value)}
                    placeholder="Select a category"
                  />
                  {/* In a real app, use a proper picker */}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description (Optional)</Text>
                <TextInput
                  style={styles.textarea}
                  multiline
                  numberOfLines={3}
                  value={formData.description}
                  onChangeText={(value) => updateFormData('description', value)}
                  placeholder="Add any notes about this expense..."
                />
              </View>
            </Card.Content>
          </Card>

          {/* Receipt Upload */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.label}>Receipt (Optional)</Text>
              <TouchableOpacity style={styles.uploadButton}>
                <Camera size={24} color="#6b7280" />
                <Text style={styles.uploadText}>Tap to add receipt photo</Text>
                <Text style={styles.uploadSubtext}>Helps with expense tracking</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>

          {/* Split With */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.splitHeader}>
                <Users size={20} color="#374151" />
                <Text style={styles.label}>Split with *</Text>
              </View>
              
              <View style={styles.friendsList}>
                {friends.map((friend) => (
                  <TouchableOpacity
                    key={friend.id}
                    style={[
                      styles.friendItem,
                      selectedFriends.includes(friend.id) && styles.friendItemSelected
                    ]}
                    onPress={() => toggleFriend(friend.id)}
                  >
                    <Text style={styles.avatar}>{friend.avatar}</Text>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{friend.name}</Text>
                    </View>
                    <Checkbox
                      status={selectedFriends.includes(friend.id) ? 'checked' : 'unchecked'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Split Summary */}
              {selectedFriends.length > 0 && formData.amount && (
                <View style={styles.splitSummary}>
                  <Text style={styles.summaryText}>Split equally among {selectedFriends.length + 1} people</Text>
                  <View style={styles.splitAmount}>
                    <Text style={styles.summaryText}>Each person pays:</Text>
                    <Text style={styles.amountText}>${splitAmount.toFixed(2)}</Text>
                  </View>
                </View>
              )}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Button 
          mode="contained"
          onPress={handleAddExpense}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
          icon={() => <Shield size={16} color="#fff" />}
        >
          Add Secure Expense
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600', color: '#1f2937' },
  spacer: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 100 },
  errorContainer: { padding: 12, backgroundColor: '#fef2f2', borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#dc2626' },
  form: { gap: 16 },
  card: { elevation: 2 },
  cardContent: { padding: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center' },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#fff' },
  icon: { marginLeft: 12 },
  inputWithIconText: { flex: 1, paddingHorizontal: 8, paddingVertical: 12, fontSize: 16 },
  pickerContainer: {},
  textarea: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff', textAlignVertical: 'top' },
  uploadButton: { borderWidth: 2, borderColor: '#d1d5db', borderStyle: 'dashed', borderRadius: 8, padding: 24, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  uploadText: { marginTop: 8, fontSize: 16, color: '#6b7280' },
  uploadSubtext: { marginTop: 4, fontSize: 14, color: '#9ca3af' },
  splitHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  friendsList: { gap: 8 },
  friendItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8 },
  friendItemSelected: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  avatar: { fontSize: 24, marginRight: 12 },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 16, color: '#1f2937' },
  splitSummary: { padding: 12, backgroundColor: '#f3f4f6', borderRadius: 8, marginTop: 16 },
  summaryText: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  splitAmount: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amountText: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  footer: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  primaryButton: { backgroundColor: '#3b82f6' },
  buttonContent: { height: 48 },
});