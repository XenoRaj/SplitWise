import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { Shield } from 'lucide-react-native';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Animated Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Shield size={48} color="#fff" />
          </View>
          <Text style={styles.appName}>SecureSplit</Text>
        </View>

        {/* Loading Animation */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" color="#3b82f6" />
        </View>

        {/* Loading Text */}
        <View style={styles.textContainer}>
          <Text style={styles.loadingText}>Processing securely...</Text>
          <Text style={styles.subText}>This may take a few moments</Text>
        </View>

        {/* Security Indicator */}
        <View style={styles.securityContainer}>
          <Shield size={16} color="#16a34a" />
          <Text style={styles.securityText}>Secured with 256-bit encryption</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingHorizontal: 24 },
  content: { alignItems: 'center', justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  appName: { fontSize: 20, fontWeight: '600', color: '#1f2937' },
  loadingContainer: { marginBottom: 24 },
  textContainer: { alignItems: 'center', marginBottom: 32 },
  loadingText: { fontSize: 16, color: '#1f2937', marginBottom: 8 },
  subText: { fontSize: 14, color: '#6b7280' },
  securityContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f0fdf4', borderRadius: 8 },
  securityText: { fontSize: 14, color: '#16a34a', marginLeft: 8 },
});