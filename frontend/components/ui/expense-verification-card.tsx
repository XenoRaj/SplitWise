import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { apiService } from '../../services/api';
import VerificationToggle, { VerificationStatus } from '../ui/verification-toggle';

interface VerificationDetail {
  user_id: number;
  user_name: string;
  user_email: string;
  status: VerificationStatus;
}

interface ExpenseVerificationCardProps {
  expenseId: number;
  currentUserId: number;
  verificationDetails: VerificationDetail[];
  isApproved: boolean;
  onStatusUpdate?: (updatedDetails: VerificationDetail[], isApproved: boolean) => void;
}

const ExpenseVerificationCard: React.FC<ExpenseVerificationCardProps> = ({
  expenseId,
  currentUserId,
  verificationDetails,
  isApproved,
  onStatusUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [localDetails, setLocalDetails] = useState(verificationDetails);

  const handleStatusChange = async (newStatus: VerificationStatus) => {
    try {
      setLoading(true);
      
      const response = await apiService.updateExpenseVerificationStatus(expenseId, newStatus);
      
      if (response.success) {
        const updatedDetails = response.data.expense.verification_details;
        const updatedIsApproved = response.data.expense.is_approved;
        
        setLocalDetails(updatedDetails);
        
        if (onStatusUpdate) {
          onStatusUpdate(updatedDetails, updatedIsApproved);
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating verification status:', error);
      Alert.alert('Error', 'Failed to update verification status');
    } finally {
      setLoading(false);
    }
  };

  const currentUserDetail = localDetails.find(detail => detail.user_id === currentUserId);
  
  if (!currentUserDetail) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Your approval:</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <VerificationToggle
            value={currentUserDetail.status}
            onChange={handleStatusChange}
            size="small"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});

export default ExpenseVerificationCard;