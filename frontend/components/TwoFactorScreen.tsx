import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet ,TextInput} from 'react-native';
import { Button } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ArrowLeft, Shield, Smartphone } from 'lucide-react-native';

type RootStackParamList = {
  'two-factor': undefined;
  login: undefined;
  dashboard: undefined;
  success: { message: string };
  // Add other screens...
};

type TwoFactorScreenNavigationProp = StackNavigationProp<RootStackParamList, 'two-factor'>;
type TwoFactorScreenRouteProp = RouteProp<RootStackParamList, 'two-factor'>;

interface TwoFactorScreenProps {
  navigation: TwoFactorScreenNavigationProp;
  route: TwoFactorScreenRouteProp;
  login: () => void;
  showLoading: (callback: () => void) => void;
}

export function TwoFactorScreen({ navigation, login, showLoading }: TwoFactorScreenProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleVerifyCode = () => {
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    if (code !== '123456') { // Mock verification
      setError('Invalid verification code. Please try again.');
      return;
    }

    setError('');
    // On successful verification, log in the user and navigate to dashboard
    showLoading(() => {
      login();
      navigation.navigate('dashboard');
    });
  };

  const handleResendCode = () => {
    showLoading(() => {
      navigation.navigate('success', { 
        message: 'A new verification code has been sent to your device.' 
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
            <Smartphone size={32} color="#3b82f6" />
          </View>
          <Text style={styles.title}>Two-Factor Authentication</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit verification code from your authenticator app to complete sign in.
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.codeContainer}>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={setCode}
            placeholder="000000"
            keyboardType="numeric"
            maxLength={6}
            textAlign="center"
          />
        </View>

        <Button 
          mode="contained"
          onPress={handleVerifyCode}
          disabled={code.length !== 6}
          style={[styles.verifyButton, code.length !== 6 && styles.buttonDisabled]}
          contentStyle={styles.buttonContent}
        >
          Verify & Sign In
        </Button>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive a code? </Text>
          <TouchableOpacity onPress={handleResendCode}>
            <Text style={styles.resendLink}>Resend Code</Text>
          </TouchableOpacity>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Shield size={16} color="#16a34a" />
          <Text style={styles.securityText}>
            Two-factor authentication adds an extra layer of security to your account
          </Text>
        </View>

        {/* Demo Code Notice */}
        <View style={styles.demoNotice}>
          <Text style={styles.demoText}>
            Demo: Use code <Text style={styles.demoCode}>123456</Text> to continue
          </Text>
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
  content: { flex: 1, justifyContent: 'center' },
  titleContainer: { alignItems: 'center', marginBottom: 32 },
  iconContainer: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24 },
  errorContainer: { padding: 12, backgroundColor: '#fef2f2', borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#dc2626', textAlign: 'center' },
  codeContainer: { alignItems: 'center', marginBottom: 32 },
  codeInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 16, fontSize: 24, letterSpacing: 8, width: 200, textAlign: 'center', backgroundColor: '#fff' },
  verifyButton: { backgroundColor: '#3b82f6', marginBottom: 16 },
  buttonDisabled: { backgroundColor: '#9ca3af' },
  buttonContent: { height: 48 },
  resendContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  resendText: { color: '#6b7280' },
  resendLink: { color: '#3b82f6', fontWeight: '500' },
  securityNotice: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f0fdf4', borderRadius: 8, marginBottom: 16 },
  securityText: { fontSize: 14, color: '#16a34a', marginLeft: 8 },
  demoNotice: { alignItems: 'center', padding: 12, backgroundColor: '#eff6ff', borderRadius: 8 },
  demoText: { fontSize: 14, color: '#3b82f6' },
  demoCode: { fontWeight: 'bold' },
});