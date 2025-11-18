import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ArrowLeft, Shield, Mail } from 'lucide-react-native';

type RootStackParamList = {
  passwordReset: undefined;
  login: undefined;
  success: { message: string };
  // Add other screens...
};

type PasswordResetScreenNavigationProp = StackNavigationProp<RootStackParamList, 'passwordReset'>;
type PasswordResetScreenRouteProp = RouteProp<RootStackParamList, 'passwordReset'>;

interface PasswordResetScreenProps {
  navigation: PasswordResetScreenNavigationProp;
  route: PasswordResetScreenRouteProp;
  showLoading: (callback: () => void) => void;
}

export function PasswordResetScreen({ navigation, showLoading }: PasswordResetScreenProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    showLoading(() => {
      navigation.navigate('success', { 
        message: 'Password reset instructions have been sent to your email address.' 
      });
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.scrollView}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('login')} style={styles.backButton}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.logo}>
            <Shield size={20} color="#fff" />
          </View>
          <Text style={styles.appName}>SecureSplit</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <View style={styles.iconContainer}>
            <Mail size={32} color="#3b82f6" />
          </View>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you instructions to reset your password securely.
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="alex.johnson@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <Button 
          mode="contained"
          onPress={handleResetPassword}
          style={styles.resetButton}
          contentStyle={styles.buttonContent}
        >
          Send Reset Instructions
        </Button>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Shield size={16} color="#16a34a" />
          <Text style={styles.securityText}>
            For your security, password reset links expire in 15 minutes
          </Text>
        </View>
      </View>

      {/* Back to Login */}
      <View style={styles.backContainer}>
        <Text style={styles.backText}>Remember your password? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('login')}>
          <Text style={styles.backLink}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  backButton: { padding: 8, marginLeft: -8 },
  headerCenter: { flex: 1, alignItems: 'center', marginRight: 32 },
  logo: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  appName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  content: { flex: 1, justifyContent: 'center' },
  titleContainer: { alignItems: 'center', marginBottom: 32 },
  iconContainer: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24 },
  errorContainer: { padding: 12, backgroundColor: '#fef2f2', borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#dc2626' },
  form: { marginBottom: 32 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' },
  resetButton: { backgroundColor: '#3b82f6', marginBottom: 24 },
  buttonContent: { height: 48 },
  securityNotice: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f0fdf4', borderRadius: 8 },
  securityText: { fontSize: 14, color: '#16a34a', marginLeft: 8 },
  backContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  backText: { color: '#6b7280' },
  backLink: { color: '#3b82f6', fontWeight: '500' },
});