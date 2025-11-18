import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Button, Card, Avatar } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Plus, Users, Search, Home, UserPlus, DollarSign } from 'lucide-react-native';
import type { Group, User } from '../App';

type RootStackParamList = {
  groups: undefined;
  dashboard: undefined;
  profile: undefined;
  groupDetails: { group: Group };
  success: { message: string };
  // Add other screens...
};

type GroupsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'groups'>;
type GroupsScreenRouteProp = RouteProp<RootStackParamList, 'groups'>;

interface GroupsScreenProps {
  navigation: GroupsScreenNavigationProp;
  route: GroupsScreenRouteProp;
  user: User | null;
  groups: Group[];
  showLoading: (callback: () => void) => void;
}

export function GroupsScreen({ navigation, groups, showLoading }: GroupsScreenProps) {
  const handleCreateGroup = () => {
    showLoading(() => {
      navigation.navigate('success', { message: 'Group created successfully! You can now add members.' });
    });
  };

  const handleInviteMember = (groupId: string) => {
    showLoading(() => {
      navigation.navigate('success', { message: 'Invitation sent successfully!' });
    });
  };

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
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
          <Text style={styles.sectionTitle}>Your Groups ({groups.length})</Text>
          <View style={styles.groupsList}>
            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupCard}
                onPress={() => navigation.navigate('groupDetails', { group })}
              >
                <Card.Content style={styles.groupContent}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupAvatar}>{group.avatar}</Text>
                    <View style={styles.groupInfo}>
                      <View style={styles.groupMain}>
                        <Text style={styles.groupName}>{group.name}</Text>
                        <Text style={[styles.groupBalance, { color: group.balance >= 0 ? '#16a34a' : '#dc2626' }]}>
                          ${Math.abs(group.balance).toFixed(2)} {group.balance >= 0 ? 'owed' : 'owing'}
                        </Text>
                      </View>
                      <View style={styles.groupDetails}>
                        <View style={styles.detailItem}>
                          <Users size={14} color="#6b7280" />
                          <Text style={styles.detailText}>{group.members.length} members</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <DollarSign size={14} color="#6b7280" />
                          <Text style={styles.detailText}>${group.totalExpenses.toFixed(2)} total</Text>
                        </View>
                      </View>
                      
                      {/* Member Avatars */}
                      <View style={styles.memberAvatars}>
                        {group.members.slice(0, 4).map((member, index) => (
                          <Avatar.Text
                            key={index}
                            size={24}
                            label={member.split(' ').map(n => n[0]).join('')}
                            style={styles.memberAvatar}
                          />
                        ))}
                        {group.members.length > 4 && (
                          <View style={styles.moreMembers}>
                            <Text style={styles.moreMembersText}>+{group.members.length - 4}</Text>
                          </View>
                        )}
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

        {/* Recent Friends */}
        <View style={styles.friendsSection}>
          <Text style={styles.sectionTitle}>Recent Friends</Text>
          <View style={styles.friendsList}>
            {[
              { name: 'Sarah Chen', email: 'sarah@email.com', balance: 15.50 },
              { name: 'Mike Wilson', email: 'mike@email.com', balance: -8.25 },
              { name: 'Emily Davis', email: 'emily@email.com', balance: 0 },
              { name: 'John Smith', email: 'john@email.com', balance: 12.75 },
            ].map((friend, index) => (
              <TouchableOpacity key={index} style={styles.friendCard}>
                <Card.Content style={styles.friendContent}>
                  <View style={styles.friendHeader}>
                    <Avatar.Text size={40} label={friend.name.split(' ').map(n => n[0]).join('')} />
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{friend.name}</Text>
                      <Text style={styles.friendEmail}>{friend.email}</Text>
                    </View>
                    <View style={styles.friendBalance}>
                      {friend.balance === 0 ? (
                        <Text style={styles.settledText}>Settled up</Text>
                      ) : (
                        <Text style={[styles.balanceText, { color: friend.balance > 0 ? '#16a34a' : '#dc2626' }]}>
                          ${Math.abs(friend.balance).toFixed(2)} {friend.balance > 0 ? 'owes you' : 'you owe'}
                        </Text>
                      )}
                    </View>
                  </View>
                </Card.Content>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {groups.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Users size={32} color="#6b7280" />
            </View>
            <Text style={styles.emptyTitle}>No groups yet</Text>
            <Text style={styles.emptyText}>Create your first group to start splitting expenses</Text>
            <Button
              mode="contained"
              onPress={handleCreateGroup}
              style={styles.emptyButton}
              icon={() => <Plus size={16} color="#fff" />}
            >
              Create Group
            </Button>
          </View>
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
  groupAvatar: { fontSize: 36, marginRight: 12 },
  groupInfo: { flex: 1 },
  groupMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  groupName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  groupBalance: { fontSize: 14, fontWeight: '500' },
  groupDetails: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 14, color: '#6b7280', marginLeft: 4 },
  memberAvatars: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memberAvatar: { backgroundColor: '#e5e7eb' },
  moreMembers: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  moreMembersText: { fontSize: 12, color: '#6b7280' },
  addMemberButton: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' },
  friendsSection: { marginBottom: 24 },
  friendsList: { gap: 12 },
  friendCard: { elevation: 2, borderRadius: 8 },
  friendContent: { padding: 16 },
  friendHeader: { flexDirection: 'row', alignItems: 'center' },
  friendInfo: { flex: 1, marginLeft: 12 },
  friendName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  friendEmail: { fontSize: 14, color: '#6b7280' },
  friendBalance: { alignItems: 'flex-end' },
  settledText: { fontSize: 14, color: '#6b7280' },
  balanceText: { fontSize: 14, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  emptyButton: { backgroundColor: '#3b82f6' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingHorizontal: 24, paddingVertical: 12 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navItemActive: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navText: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  navTextActive: { fontSize: 12, color: '#3b82f6', marginTop: 4 },
});