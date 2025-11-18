import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Button, Card } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Shield, Users, DollarSign, Lock } from 'lucide-react-native';
import { ImageWithFallback } from './figma/ImageWithFallback';

type RootStackParamList = {
  welcome: undefined;
  login: undefined;
  signup: undefined;
  // Add other screens...
};

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'welcome'>;
type WelcomeScreenRouteProp = RouteProp<RootStackParamList, 'welcome'>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
  route: WelcomeScreenRouteProp;
}

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.scrollView}>
      {/* Logo and Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Shield size={32} color="#fff" />
          </View>
        </View>
        <Text style={styles.title}>SecureSplit</Text>
        <Text style={styles.subtitle}>Safe. Simple. Secure expense sharing.</Text>
      </View>

      {/* Hero Image */}
      <View style={styles.heroContainer}>
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1696013910376-c56f76dd8178?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMGF2YXRhciUyMHBvcnRyYWl0fGVufDF8fHx8MTc1OTEyNjA1OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          style={styles.heroImage}
        />
      </View>

      {/* Features */}
      <View style={styles.features}>
        <Card style={styles.featureCard}>
          <Card.Content style={styles.featureContent}>
            <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
              <Lock size={20} color="#16a34a" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Bank-level Security</Text>
              <Text style={styles.featureSubtitle}>End-to-end encryption & 2FA protection</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.featureCard}>
          <Card.Content style={styles.featureContent}>
            <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
              <Users size={20} color="#2563eb" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Easy Group Splitting</Text>
              <Text style={styles.featureSubtitle}>Split bills with friends instantly</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.featureCard}>
          <Card.Content style={styles.featureContent}>
            <View style={[styles.iconContainer, { backgroundColor: '#ede9fe' }]}>
              <DollarSign size={20} color="#9333ea" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Secure Payments</Text>
              <Text style={styles.featureSubtitle}>Settle up with integrated secure payments</Text>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* CTA Button */}
      <View style={styles.cta}>
        <Button 
          mode="contained"
          onPress={() => navigation.navigate('signup')}
          style={styles.primaryButton}
          contentStyle={styles.buttonContent}
        >
          Get Started
        </Button>
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('login')}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32 },
  header: { alignItems: 'center', marginBottom: 48, paddingTop: 64 },
  logoContainer: { marginBottom: 16 },
  logo: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
  heroContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 48 },
  heroImage: { width: 320, height: 256, borderRadius: 12 },
  features: { gap: 16, marginBottom: 48 },
  featureCard: { elevation: 2 },
  featureContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  featureSubtitle: { fontSize: 14, color: '#6b7280' },
  cta: { gap: 12 },
  primaryButton: { backgroundColor: '#2563eb' },
  buttonContent: { height: 48 },
  signInContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signInText: { color: '#6b7280' },
  signInLink: { color: '#2563eb', fontWeight: '500' },
});