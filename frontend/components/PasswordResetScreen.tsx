import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ArrowLeft, Shield, Mail, Eye, EyeOff } from 'lucide-react-native';
import { apiService } from '../services/api';

type RootStackParamList = {
  'password-reset': undefined;
  login: undefined;
  success: { message: string };
  // Add other screens...
};

type PasswordResetScreenNavigationProp = StackNavigationProp<RootStackParamList, 'password-reset'>;
type PasswordResetScreenRouteProp = RouteProp<RootStackParamList, 'password-reset'>;

interface PasswordResetScreenProps {
  navigation: PasswordResetScreenNavigationProp;
  route: PasswordResetScreenRouteProp;
  showLoading: (callback: () => void) => void;
}

export function PasswordResetScreen({ navigation, showLoading }: PasswordResetScreenProps) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOTP = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setLoading(true);
    
    const result = await apiService.requestPasswordReset(email);
    setLoading(false);
    
    if (result.success) {
      setStep(2);
      setError('');
    } else {
      setError(result.error);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    setError('');
    setLoading(true);
    
    const result = await apiService.verifyPasswordResetOTP(email, otp);
    setLoading(false);
    
    if (result.success) {
      setStep(3);
      setError('');
    } else {
      setError(result.error);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setError('');
    setLoading(true);
    
    const result = await apiService.resetPassword(email, otp, newPassword, confirmPassword);
    setLoading(false);
    
    if (result.success) {
      navigation.navigate('login');
      // You could also show a success message here if needed
      // Alert.alert('Success', 'Password reset successfully! You can now login with your new password.');
    } else {
      setError(result.error);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderEmailStep();
      case 2:
        return renderOTPStep();
      case 3:
        return renderPasswordStep();
      default:
        return renderEmailStep();
    }
  };

  const renderEmailStep = () => (
    <>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a verification code.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputContainer}>
            <Mail color="#9ca3af" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <Button
          mode="contained"
          onPress={handleRequestOTP}
          style={styles.submitButton}
          contentStyle={styles.buttonContent}
          loading={loading}
          disabled={loading}
        >
          Send Verification Code
        </Button>
      </View>
    </>
  );

  const renderOTPStep = () => (
    <>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit code to {email}. Please enter it below.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={setOtp}
            placeholder="Enter 6-digit code"
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>

        <Button
          mode="contained"
          onPress={handleVerifyOTP}
          style={styles.submitButton}
          contentStyle={styles.buttonContent}
          loading={loading}
          disabled={loading}
        >
          Verify Code
        </Button>

        <TouchableOpacity onPress={() => setStep(1)} style={styles.backToEmailButton}>
          <Text style={styles.backToEmailText}>Change email address</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderPasswordStep = () => (
    <>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Create New Password</Text>
        <Text style={styles.subtitle}>
          Please enter your new password below.
        </Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              secureTextEntry={!showNewPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <EyeOff color="#9ca3af" size={20} />
              ) : (
                <Eye color="#9ca3af" size={20} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff color="#9ca3af" size={20} />
              ) : (
                <Eye color="#9ca3af" size={20} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Button
          mode="contained"
          onPress={handleResetPassword}
          style={styles.submitButton}
          contentStyle={styles.buttonContent}
          loading={loading}
          disabled={loading}
        >
          Reset Password
        </Button>
      </View>
    </>
  );

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.scrollView}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color="#1f2937" size={24} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.logo}>
            <Shield color="#fff" size={16} />
          </View>
          <Text style={styles.appName}>SplitWise</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderStepContent()}

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Shield color="#16a34a" size={20} />
          <Text style={styles.securityText}>
            We'll send you secure instructions to reset your password
          </Text>
        </View>

        {/* Back to Login */}
        <View style={styles.backToLogin}>
          <Text style={styles.backText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('login')}>
            <Text style={styles.backLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
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
  content: { flex: 1 },
  titleContainer: { marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24 },
  errorContainer: { padding: 12, backgroundColor: '#fef2f2', borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#dc2626' },
  form: { marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#fff' },
  inputIcon: { marginLeft: 12 },
  otpInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 18, backgroundColor: '#fff', textAlign: 'center', letterSpacing: 4 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#fff' },
  passwordInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },
  eyeButton: { padding: 12 },
  submitButton: { backgroundColor: '#3b82f6', marginBottom: 16 },
  buttonContent: { height: 48 },
  backToEmailButton: { alignSelf: 'center', marginTop: 8 },
  backToEmailText: { color: '#3b82f6', fontSize: 14 },
  securityNotice: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f0fdf4', borderRadius: 8, marginBottom: 24 },
  securityText: { fontSize: 14, color: '#16a34a', marginLeft: 8 },
  backToLogin: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  backText: { color: '#6b7280' },
  backLink: { color: '#3b82f6', fontWeight: '500' },
});