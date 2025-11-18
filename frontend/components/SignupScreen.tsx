import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Button, ProgressBar } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ArrowLeft, Shield, Eye, EyeOff, Check, X } from 'lucide-react-native';

type RootStackParamList = {
  signup: undefined;
  welcome: undefined;
  login: undefined;
  success: { message: string };
  // Add other screens...
};

type SignupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'signup'>;
type SignupScreenRouteProp = RouteProp<RootStackParamList, 'signup'>;

interface SignupScreenProps {
  navigation: SignupScreenNavigationProp;
  route: SignupScreenRouteProp;
  showLoading: (callback: () => void) => void;
}

export function SignupScreen({ navigation, showLoading }: SignupScreenProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return Math.min(strength, 100);
  };

  const passwordStrength = calculatePasswordStrength(formData.password);
  const getStrengthColor = (strength: number) => {
    if (strength < 25) return '#dc2626';
    if (strength < 50) return '#d97706';
    if (strength < 75) return '#ca8a04';
    return '#16a34a';
  };

  const getStrengthText = (strength: number) => {
    if (strength < 25) return 'Weak';
    if (strength < 50) return 'Fair';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  const handleSignup = () => {
    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (passwordStrength < 50) {
      setError('Please choose a stronger password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    showLoading(() => {
      navigation.navigate('success', { message: 'Account created successfully! Please check your email to verify your account.' });
    });
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.scrollView}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('welcome')} style={styles.backButton}>
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join SecureSplit for safe expense sharing</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.nameRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(value) => updateFormData('firstName', value)}
                placeholder="Alex"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(value) => updateFormData('lastName', value)}
                placeholder="Johnson"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              placeholder="alex.johnson@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                placeholder="Create a strong password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
              </TouchableOpacity>
            </View>
            
            {formData.password && (
              <View style={styles.passwordStrength}>
                <View style={styles.strengthBar}>
                  <View style={[styles.strengthFill, { width: `${passwordStrength}%`, backgroundColor: getStrengthColor(passwordStrength) }]} />
                </View>
                <View style={styles.strengthText}>
                  <Text style={[styles.strengthLabel, { color: getStrengthColor(passwordStrength) }]}>{getStrengthText(passwordStrength)}</Text>
                </View>
                
                <View style={styles.requirements}>
                  <View style={styles.requirement}>
                    {formData.password.length >= 8 ? <Check size={14} color="#16a34a" /> : <X size={14} color="#6b7280" />}
                    <Text style={[styles.requirementText, formData.password.length >= 8 ? styles.requirementMet : styles.requirementNotMet]}>
                      At least 8 characters
                    </Text>
                  </View>
                  <View style={styles.requirement}>
                    {/[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) ? <Check size={14} color="#16a34a" /> : <X size={14} color="#6b7280" />}
                    <Text style={[styles.requirementText, /[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) ? styles.requirementMet : styles.requirementNotMet]}>
                      Upper and lowercase letters
                    </Text>
                  </View>
                  <View style={styles.requirement}>
                    {/[0-9]/.test(formData.password) ? <Check size={14} color="#16a34a" /> : <X size={14} color="#6b7280" />}
                    <Text style={[styles.requirementText, /[0-9]/.test(formData.password) ? styles.requirementMet : styles.requirementNotMet]}>
                      At least one number
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                placeholder="Confirm your password"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
              </TouchableOpacity>
            </View>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <Text style={styles.passwordMismatch}>Passwords do not match</Text>
            )}
          </View>
        </View>

        <Button 
          mode="contained"
          onPress={handleSignup}
          style={styles.signupButton}
          contentStyle={styles.buttonContent}
        >
          Create Secure Account
        </Button>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Shield size={16} color="#16a34a" />
          <Text style={styles.securityText}>Your data is encrypted and secure</Text>
        </View>
      </View>

      {/* Sign In Link */}
      <View style={styles.signinContainer}>
        <Text style={styles.signinText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('login')}>
          <Text style={styles.signinLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { padding: 8, marginLeft: -8 },
  headerCenter: { flex: 1, alignItems: 'center', marginRight: 32 },
  logo: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  appName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  content: { flex: 1 },
  titleContainer: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
  errorContainer: { padding: 12, backgroundColor: '#fef2f2', borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#dc2626' },
  form: { marginBottom: 24 },
  nameRow: { flexDirection: 'row', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#fff' },
  passwordInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16 },
  eyeButton: { padding: 12 },
  passwordStrength: { marginTop: 8 },
  strengthBar: { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginBottom: 8 },
  strengthFill: { height: 4, borderRadius: 2 },
  strengthText: { alignItems: 'flex-end', marginBottom: 8 },
  strengthLabel: { fontSize: 12, fontWeight: '500' },
  requirements: { gap: 4 },
  requirement: { flexDirection: 'row', alignItems: 'center' },
  requirementText: { fontSize: 12, marginLeft: 6 },
  requirementMet: { color: '#16a34a' },
  requirementNotMet: { color: '#6b7280' },
  passwordMismatch: { color: '#dc2626', fontSize: 12, marginTop: 4 },
  signupButton: { backgroundColor: '#3b82f6', marginBottom: 16 },
  buttonContent: { height: 48 },
  securityNotice: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f0fdf4', borderRadius: 8 },
  securityText: { fontSize: 14, color: '#16a34a', marginLeft: 8 },
  signinContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  signinText: { color: '#6b7280' },
  signinLink: { color: '#3b82f6', fontWeight: '500' },
});