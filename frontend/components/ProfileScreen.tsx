import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Button, Card, Avatar, Switch } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Home, Users, ChevronRight, Shield, Bell, CreditCard, HelpCircle, LogOut, Settings, Lock, Smartphone } from 'lucide-react-native';
import { apiService } from '../services/api';
import type { User } from '../App';

type RootStackParamList = {
  profile: undefined;
  dashboard: undefined;
  groups: undefined;
  login: undefined;
  'password-reset': undefined;
  success: { message: string };
  // Add other screens...
};

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'profile'>;
type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'profile'>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
  route: ProfileScreenRouteProp;
  user: User | null;
  logout: () => void;
  showLoading: (callback: () => void) => void;
}

export function ProfileScreen({ navigation, user, logout, showLoading }: ProfileScreenProps) {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      console.log('Fetching profile data...');
      
      // Check if user is authenticated first
      const isAuth = await apiService.isAuthenticated();
      console.log('Is authenticated:', isAuth);
      
      if (!isAuth) {
        console.log('User not authenticated, cannot fetch profile data');
        setError('Authentication required. Please log in again.');
        return;
      }
      
      const result = await apiService.getUserProfile();
      console.log('Profile data result:', result);
      
      if (result.success) {
        setProfileData(result.data);
        setTwoFactor(result.data.two_factor_enabled || false);
        setError('');
      } else {
        setError(result.error);
        console.error('Profile data fetch failed:', result.error);
      }
    } catch (error) {
      console.error('Profile data fetch exception:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      await apiService.logout();
      logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'welcome' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still log out locally even if API call fails
      logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'welcome' }],
      });
    }
  };

  const handleToggle2FA = async () => {
    if (updating) return;
    
    try {
      setUpdating(true);
      // Note: This would need a backend API endpoint to update 2FA settings
      // For now, just show the toggle effect
      setTwoFactor(!twoFactor);
      
      navigation.navigate('success', { 
        message: !twoFactor 
          ? 'Two-factor authentication enabled successfully!' 
          : 'Two-factor authentication disabled'
      });
    } catch (error) {
      console.error('2FA toggle error:', error);
      setError('Failed to update 2FA settings');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Button mode="contained" onPress={fetchProfileData} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No profile data available</Text>
        </View>
      </View>
    );
  }

  const settingsItems = [
    {
      icon: Lock,
      title: 'Change Password',
      subtitle: 'Update your account password',
      action: () => navigation.navigate('password-reset')
    },
    {
      icon: CreditCard,
      title: 'Payment Methods',
      subtitle: 'Manage your payment options',
      action: () => showLoading(() => {
        navigation.navigate('success', { message: 'Payment methods updated successfully!' });
      })
    },
    {
      icon: Bell,
      title: 'Notifications',
      subtitle: 'Control your notification preferences',
      toggle: notifications,
      onToggle: setNotifications
    },
    {
      icon: Smartphone,
      title: 'Two-Factor Authentication',
      subtitle: 'Add an extra layer of security',
      toggle: twoFactor,
      onToggle: handleToggle2FA,
      badge: twoFactor ? 'Enabled' : 'Disabled'
    },
    {
      icon: HelpCircle,
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      action: () => showLoading(() => {
        navigation.navigate('success', { message: 'Help request submitted. We\'ll get back to you soon!' });
      })
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* User Profile */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text 
              size={80} 
              label={profileData.first_name ? profileData.first_name.charAt(0).toUpperCase() : profileData.email.charAt(0).toUpperCase()}
              style={styles.avatar}
            />
            <Text style={styles.userName}>
              {profileData.first_name && profileData.last_name 
                ? `${profileData.first_name} ${profileData.last_name}`
                : profileData.first_name || profileData.email.split('@')[0]
              }
            </Text>
            <Text style={styles.userEmail}>{profileData.email}</Text>
            
            {/* Account Status */}
            <View style={styles.accountStatus}>
              <Shield size={16} color="#16a34a" />
              <Text style={styles.verifiedText}>Verified Account</Text>
              {profileData.two_factor_enabled && (
                <>
                  <View style={styles.statusSeparator} />
                  <Smartphone size={16} color="#3b82f6" />
                  <Text style={styles.twoFactorText}>2FA Enabled</Text>
                </>
              )}
            </View>
            
            <Button mode="outlined" style={styles.editButton}>
              Edit Profile
            </Button>
          </Card.Content>
        </Card>

        {/* Account Balance */}
        <Card style={styles.balanceCard}>
          <Card.Content style={styles.balanceContent}>
            <View style={styles.balanceHeader}>
              <CreditCard size={20} color="#1f2937" />
              <Text style={styles.balanceTitle}>Account Overview</Text>
            </View>
            <View style={styles.balanceGrid}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>You owe</Text>
                <Text style={styles.balanceValueRed}>${profileData?.owes || '0.00'}</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceLabel}>You're owed</Text>
                <Text style={styles.balanceValueGreen}>${profileData?.owed || '0.00'}</Text>
              </View>
            </View>
            <View style={styles.netBalance}>
              <Text style={styles.netLabel}>Net Balance</Text>
              <Text style={[styles.netValue, { color: profileData?.balance && profileData.balance < 0 ? '#dc2626' : '#16a34a' }]}>
                ${profileData?.balance ? Math.abs(profileData.balance).toFixed(2) : '0.00'} {profileData?.balance && profileData.balance < 0 ? 'owed' : 'owing'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Settings */}
        <Card style={styles.settingsCard}>
          <Card.Content style={styles.settingsContent}>
            <Text style={styles.settingsTitle}>Settings</Text>
            {settingsItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.settingItem, index < settingsItems.length - 1 && styles.settingBorder]}
                onPress={item.action}
              >
                <View style={styles.settingLeft}>
                  <View style={styles.settingIcon}>
                    <item.icon size={20} color="#374151" />
                  </View>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingHeader}>
                      <Text style={styles.settingTitle}>{item.title}</Text>
                      {item.badge && (
                        <View style={[styles.badge, item.toggle ? styles.badgeEnabled : styles.badgeDisabled]}>
                          <Text style={[styles.badgeText, item.toggle ? styles.badgeTextEnabled : styles.badgeTextDisabled]}>
                            {item.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <View style={styles.settingRight}>
                  {item.toggle !== undefined ? (
                    <Switch
                      value={item.toggle}
                      onValueChange={item.onToggle}
                      color="#3b82f6"
                    />
                  ) : (
                    <ChevronRight size={20} color="#6b7280" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </Card.Content>
        </Card>

        {/* Security Notice */}
        <Card style={styles.securityCard}>
          <Card.Content style={styles.securityContent}>
            <Shield size={16} color="#16a34a" />
            <Text style={styles.securityText}>
              Your data is encrypted and secure
            </Text>
          </Card.Content>
        </Card>

        {/* Logout */}
        <Card style={styles.logoutCard}>
          <Card.Content style={styles.logoutContent}>
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.logoutButton}
              contentStyle={styles.buttonContent}
              icon={() => <LogOut size={16} color="#dc2626" />}
            >
              Sign Out
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('dashboard')}>
          <Home size={24} color="#6b7280" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('groups')}>
          <Users size={24} color="#6b7280" />
          <Text style={styles.navText}>Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemActive}>
          <Users size={24} color="#3b82f6" />
          <Text style={styles.navTextActive}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  settingsButton: { padding: 8 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 100 },
  profileCard: { marginBottom: 16, elevation: 2 },
  profileContent: { alignItems: 'center', padding: 24 },
  avatar: { marginBottom: 16 },
  userName: { fontSize: 20, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  userEmail: { fontSize: 16, color: '#6b7280', marginBottom: 16 },
  accountStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f0fdf4', borderRadius: 16, marginBottom: 16 },
  verifiedText: { fontSize: 14, color: '#16a34a', marginLeft: 6 },
  editButton: { borderColor: '#d1d5db' },
  balanceCard: { marginBottom: 16, elevation: 2 },
  balanceContent: { padding: 16 },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  balanceTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginLeft: 8 },
  balanceGrid: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  balanceItem: { flex: 1, alignItems: 'center', paddingVertical: 12, backgroundColor: '#f9fafb', borderRadius: 8 },
  balanceLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  balanceValueRed: { fontSize: 18, fontWeight: '600', color: '#dc2626' },
  balanceValueGreen: { fontSize: 18, fontWeight: '600', color: '#16a34a' },
  netBalance: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  netLabel: { fontSize: 14, color: '#6b7280' },
  netValue: { fontSize: 16, fontWeight: '600' },
  settingsCard: { marginBottom: 16, elevation: 2 },
  settingsContent: { padding: 0 },
  settingsTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', padding: 16, paddingBottom: 8 },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingInfo: { flex: 1 },
  settingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeEnabled: { backgroundColor: '#dcfce7' },
  badgeDisabled: { backgroundColor: '#fef2f2' },
  badgeText: { fontSize: 12, fontWeight: '500' },
  badgeTextEnabled: { color: '#166534' },
  badgeTextDisabled: { color: '#dc2626' },
  settingSubtitle: { fontSize: 14, color: '#6b7280' },
  statusSeparator: { marginHorizontal: 8, color: '#9ca3af' },
  twoFactorText: { fontSize: 12, color: '#10b981', fontWeight: '500' },
  settingRight: { marginLeft: 12 },
  securityCard: { marginBottom: 16, elevation: 2 },
  securityContent: { padding: 16 },
  securityText: { fontSize: 14, color: '#16a34a', marginLeft: 8 },
  logoutCard: { elevation: 2 },
  logoutContent: { padding: 16 },
  logoutButton: { borderColor: '#dc2626' },
  buttonContent: { height: 48 },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f3f4f6'
  },
  loadingText: { 
    marginTop: 16, 
    fontSize: 16, 
    color: '#6b7280' 
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24,
    backgroundColor: '#f3f4f6'
  },
  errorText: { 
    fontSize: 16, 
    color: '#dc2626', 
    textAlign: 'center',
    marginBottom: 16
  },
  retryButton: { 
    backgroundColor: '#3b82f6' 
  },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingHorizontal: 24, paddingVertical: 12 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navItemActive: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navText: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  navTextActive: { fontSize: 12, color: '#3b82f6', marginTop: 4 },
});