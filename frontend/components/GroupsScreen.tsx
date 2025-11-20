import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Button, Card, Avatar } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { Plus, Users, Search, Home, UserPlus, DollarSign } from 'lucide-react-native';
import { apiService } from '../services/api';
import type { User } from '../App';

type RootStackParamList = {
  groups: undefined;
  dashboard: undefined;
  profile: undefined;
  'group-details': { group: any };
  createGroup: undefined;
  success: { 
    message: string;
    nextScreen?: string;
  };
  // Add other screens...
};

type GroupsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'groups'>;
type GroupsScreenRouteProp = RouteProp<RootStackParamList, 'groups'>;

interface GroupsScreenProps {
  navigation: GroupsScreenNavigationProp;
  route: GroupsScreenRouteProp;
  user: User | null;
  showLoading: (callback: () => void) => void;
}

export function GroupsScreen({ navigation, user, showLoading }: GroupsScreenProps) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  // Refresh groups when screen comes into focus (e.g., returning from CreateGroup)
  useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [])
  );

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const result = await apiService.getGroups();
      
      if (result.success) {
        console.log('Groups fetched:', result.data);
        setGroups(result.data);
        setError('');
      } else {
        console.error('Failed to fetch groups:', result.error);
        setError(result.error);
      }
    } catch (error) {
      console.error('Groups fetch exception:', error);
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = () => {
    navigation.navigate('createGroup');
  };

  const handleInviteMember = (groupId: string) => {
    showLoading(() => {
      navigation.navigate('success', { message: 'Invitation sent successfully!' });
    });
  };

  const filteredGroups = (groups || []).filter((group: any) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Groups & Friends</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your groups...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groups & Friends</Text>
        <Button
          mode="contained"
          onPress={handleCreateGroup}
          style={styles.createButton}
          contentStyle={styles.createButtonContent}
          icon={() => <Plus size={16} color="#fff" />}
        >
          Create Group
        </Button>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={16} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups and friends..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="outlined" onPress={fetchGroups} style={styles.retryButton}>
              Retry
            </Button>
          </View>
        ) : (
          <>
            {/* Quick Actions */}
            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={handleCreateGroup}>
                  <View style={styles.actionIcon}>
                    <Users size={24} color="#3b82f6" />
                  </View>
                  <Text style={styles.actionText}>Create Group</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleInviteMember('new')}>
                  <View style={styles.actionIcon}>
                    <UserPlus size={24} color="#3b82f6" />
                  </View>
                  <Text style={styles.actionText}>Add Friend</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Active Groups */}
            <View style={styles.groupsSection}>
              <Text style={styles.sectionTitle}>Your Groups ({filteredGroups.length})</Text>
              <View style={styles.groupsList}>
                {filteredGroups.map((group: any) => (
                  <TouchableOpacity
                    key={group.id}
                    style={styles.groupCard}
                    onPress={() => navigation.navigate('group-details', { group })}
                  >
                    <Card.Content style={styles.groupContent}>
                      <View style={styles.groupHeader}>
                        <Avatar.Text 
                          size={48} 
                          label={group.name.charAt(0).toUpperCase()}
                          style={styles.groupAvatar}
                        />
                        <View style={styles.groupInfo}>
                          <View style={styles.groupMain}>
                            <Text style={styles.groupName}>{group.name}</Text>
                            <Text style={styles.groupDescription}>
                              {group.description || 'No description'}
                            </Text>
                          </View>
                          <View style={styles.groupDetails}>
                            <View style={styles.detailItem}>
                              <Users size={14} color="#6b7280" />
                              <Text style={styles.detailText}>{group.member_count || 0} members</Text>
                            </View>
                            <View style={styles.detailItem}>
                              <DollarSign size={14} color="#6b7280" />
                              <Text style={styles.detailText}>${(group.total_expenses || 0).toFixed(2)} total</Text>
                            </View>
                          </View>
                          
                          {/* Group Actions */}
                          <View style={styles.groupActions}>
                            <TouchableOpacity 
                              style={styles.addMemberButton}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleInviteMember(group.id);
                              }}
                            >
                              <Plus size={12} color="#3b82f6" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </Card.Content>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {filteredGroups.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Users size={32} color="#6b7280" />
                </View>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No groups found' : 'No groups yet'}
                </Text>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Try adjusting your search' : 'Create your first group to start splitting expenses'}
                </Text>
                {!searchQuery && (
                  <Button
                    mode="contained"
                    onPress={handleCreateGroup}
                    style={styles.emptyButton}
                    icon={() => <Plus size={16} color="#fff" />}
                  >
                    Create Group
                  </Button>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('dashboard')}>
          <Home size={24} color="#6b7280" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemActive}>
          <Users size={24} color="#3b82f6" />
          <Text style={styles.navTextActive}>Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('profile')}>
          <Users size={24} color="#6b7280" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  createButton: { backgroundColor: '#3b82f6', borderRadius: 24 },
  createButtonContent: { width: 36, height: 36 },
  searchSection: { paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f9fafb', borderRadius: 8 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#1f2937' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  loadingText: { fontSize: 16, color: '#6b7280', marginTop: 16 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  errorText: { fontSize: 16, color: '#dc2626', marginBottom: 16, textAlign: 'center' },
  retryButton: { borderColor: '#dc2626' },
  actionsSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 16 },
  actionButtons: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, alignItems: 'center', paddingVertical: 16, backgroundColor: '#fff', borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  actionIcon: { marginBottom: 8 },
  actionText: { fontSize: 14, color: '#3b82f6', fontWeight: '500' },
  groupsSection: { marginBottom: 24 },
  groupsList: { gap: 12 },
  groupCard: { elevation: 2, borderRadius: 8 },
  groupContent: { padding: 16 },
  groupHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  groupAvatar: { backgroundColor: '#3b82f6', marginRight: 12 },
  groupInfo: { flex: 1 },
  groupMain: { marginBottom: 8 },
  groupName: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 2 },
  groupDescription: { fontSize: 14, color: '#6b7280' },
  groupDetails: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 14, color: '#6b7280', marginLeft: 4 },
  groupActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addMemberButton: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6b7280', marginBottom: 16, textAlign: 'center' },
  emptyButton: { backgroundColor: '#3b82f6' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingHorizontal: 24, paddingVertical: 12 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navItemActive: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navText: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  navTextActive: { fontSize: 12, color: '#3b82f6', marginTop: 4 },
});