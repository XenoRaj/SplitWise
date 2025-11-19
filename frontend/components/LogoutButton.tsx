import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface LogoutButtonProps {
  user: any;
  logout: () => void;
}

export const LogoutButton = ({ user, logout }: LogoutButtonProps) => {
  const handleLogout = async () => {
    logout();
    console.log('User logged out successfully');
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome, {user.first_name || user.email}!</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default LogoutButton;