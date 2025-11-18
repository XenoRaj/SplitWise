import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { XCircle, Shield, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react-native';

type RootStackParamList = {
  error: { message: string };
  dashboard: undefined;
  success: { message: string };
  // Add other screens...
};

type ErrorScreenNavigationProp = StackNavigationProp<RootStackParamList, 'error'>;
type ErrorScreenRouteProp = RouteProp<RootStackParamList, 'error'>;

interface ErrorScreenProps {
  navigation: ErrorScreenNavigationProp;
  route: ErrorScreenRouteProp;
}

export function ErrorScreen({ navigation, route }: ErrorScreenProps) {
  const { message } = route.params || { message: 'An error occurred. Please try again.' };

  const handleRetry = () => {
    navigation.navigate('dashboard');
  };

  const handleSupport = () => {
    navigation.navigate('success', { 
      message: 'Support request submitted. Our team will contact you within 24 hours.' 
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.scrollView}>
      {/* Error Content */}
      <View style={styles.content}>
        {/* Error Icon */}
        <View style={styles.iconContainer}>
          <XCircle size={64} color="#dc2626" />
        </View>

        {/* Error Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>{message}</Text>
        </View>

        {/* Error Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsText}>
            Don't worry - your data is safe and secure. This appears to be a temporary issue.
          </Text>
        </View>

        {/* Troubleshooting Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Quick fixes to try:</Text>
          <Text style={styles.tipsItem}>• Check your internet connection</Text>
          <Text style={styles.tipsItem}>• Try refreshing the page</Text>
          <Text style={styles.tipsItem}>• Clear your browser cache</Text>
        </View>

        {/* Security Notice */}
        <View style={styles.securityContainer}>
          <Shield size={16} color="#16a34a" />
          <Text style={styles.securityText}>Your account remains secure</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button 
          mode="contained"
          onPress={handleRetry}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
          icon={() => <RefreshCw size={16} color="#fff" />}
        >
          Try Again
        </Button>
        
        <Button 
          mode="outlined"
          onPress={handleSupport}
          style={styles.secondaryButton}
          contentStyle={styles.buttonContent}
          icon={() => <HelpCircle size={16} color="#3b82f6" />}
        >
          Contact Support
        </Button>

        <TouchableOpacity style={styles.backLink} onPress={() => navigation.navigate('dashboard')}>
          <ArrowLeft size={16} color="#6b7280" />
          <Text style={styles.backText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconContainer: { marginBottom: 32 },
  messageContainer: { marginBottom: 32, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 16, textAlign: 'center' },
  message: { fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24 },
  detailsContainer: { padding: 16, backgroundColor: '#fef2f2', borderRadius: 8, marginBottom: 32, width: '100%', maxWidth: 300 },
  detailsText: { color: '#dc2626', textAlign: 'center' },
  tipsContainer: { padding: 16, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, marginBottom: 32, width: '100%', maxWidth: 300 },
  tipsTitle: { fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  tipsItem: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  securityContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f0fdf4', borderRadius: 8, marginBottom: 32 },
  securityText: { marginLeft: 8, fontSize: 14, color: '#16a34a' },
  actions: { gap: 12 },
  primaryButton: { backgroundColor: '#3b82f6' },
  secondaryButton: { borderColor: '#d1d5db' },
  buttonContent: { height: 48 },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  backText: { marginLeft: 8, fontSize: 14, color: '#6b7280' },
});