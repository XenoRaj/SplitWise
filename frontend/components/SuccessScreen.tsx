import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { CheckCircle, Shield, ArrowRight } from 'lucide-react-native';

type RootStackParamList = {
  success: { message: string };
  dashboard: undefined;
  // Add other screens...
};

type SuccessScreenNavigationProp = StackNavigationProp<RootStackParamList, 'success'>;
type SuccessScreenRouteProp = RouteProp<RootStackParamList, 'success'>;

interface SuccessScreenProps {
  navigation: SuccessScreenNavigationProp;
  route: SuccessScreenRouteProp;
}

export function SuccessScreen({ navigation, route }: SuccessScreenProps) {
  const { message } = route.params;

  return (
    <View style={styles.container}>
      {/* Success Content */}
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <CheckCircle size={64} color="#16a34a" />
        </View>

        {/* Success Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Success!</Text>
          <Text style={styles.message}>{message}</Text>
        </View>

        {/* Security Confirmation */}
        <View style={styles.securityContainer}>
          <Shield size={16} color="#16a34a" />
          <Text style={styles.securityText}>Transaction secured and verified</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button 
          mode="contained"
          onPress={() => navigation.navigate('dashboard')}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
          icon={() => <ArrowRight size={16} color="#fff" />}
        >
          Continue to Dashboard
        </Button>
        
        <TouchableOpacity style={styles.backLink}>
          <Text style={styles.backText}>Return to home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingHorizontal: 24 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconContainer: { marginBottom: 32 },
  messageContainer: { marginBottom: 32, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 16, textAlign: 'center' },
  message: { fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24 },
  securityContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f0fdf4', borderRadius: 8 },
  securityText: { fontSize: 14, color: '#16a34a', marginLeft: 8 },
  actions: { width: '100%', gap: 12 },
  primaryButton: { backgroundColor: '#3b82f6' },
  buttonContent: { height: 48 },
  backLink: { alignItems: 'center', paddingVertical: 12 },
  backText: { color: '#6b7280', fontSize: 14 },
});