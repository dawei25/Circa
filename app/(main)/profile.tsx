import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as API from '../../lib/api';
import { useAuth } from '../../context/auth';

export default function ProfileScreen() {
  const { signOut, session } = useAuth();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [identityStatement, setIdentityStatement] = useState('');
  const [editingIdentity, setEditingIdentity] = useState(false);
  const [totalHabits, setTotalHabits] = useState(0);
  const [streakStats, setStreakStats] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalCompletions: 0,
  });

  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
      fetchUserProfile(session.user.id);
      fetchHabitStats(session.user.id);
    }
  }, [session]);

  const fetchUserProfile = async (userId) => {
    try {
      setLoading(true);
      
      if (!userId) return;
      
      // Get user profile data using API utility
      const { data, error } = await API.getProfile(userId);
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setIdentityStatement(data.identity_statement || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHabitStats = async (userId) => {
    try {
      if (!userId) return;

      // Use the API utility to get habit stats
      const stats = await API.getHabitStats(userId);
      setTotalHabits(stats.totalHabits);
      setStreakStats({
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        totalCompletions: stats.totalCompletions || 0,
      });
    } catch (error) {
      console.error('Error fetching habit stats:', error);
    }
  };

  const saveIdentityStatement = async () => {
    try {
      if (!user) return;
      
      if (!identityStatement.trim()) {
        Alert.alert('Error', 'Please enter an identity statement');
        return;
      }
      
      // Use API utility to update profile
      const { error } = await API.updateProfile({ 
        id: user.id, 
        identity_statement: identityStatement,
      });
      
      if (error) throw error;
      
      setEditingIdentity(false);
      Alert.alert('Success', 'Your identity statement has been updated.');
    } catch (error) {
      console.error('Error saving identity statement:', error);
      Alert.alert('Error', 'Failed to update identity statement. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Sign Out', 
            style: 'destructive',
            onPress: async () => {
              await signOut();
              // Navigation will be handled by the AuthContext
            }
          },
        ]
      );
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4a69bd" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        
        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Identity</Text>
              {!editingIdentity && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setEditingIdentity(true)}
                >
                  <Ionicons name="create-outline" size={22} color="#4a69bd" />
                </TouchableOpacity>
              )}
            </View>
            
            {editingIdentity ? (
              <View style={styles.identityEditContainer}>
                <TextInput
                  style={styles.identityInput}
                  value={identityStatement}
                  onChangeText={setIdentityStatement}
                  placeholder="I am a person who..."
                  multiline
                />
                <View style={styles.identityEditActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => setEditingIdentity(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={saveIdentityStatement}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.identityContainer}>
                <Text style={styles.identityText}>
                  {identityStatement || "You haven't set your identity statement yet. Tap the edit button to define who you want to become."}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stats</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalHabits}</Text>
                <Text style={styles.statLabel}>Total Habits</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{streakStats.currentStreak}</Text>
                <Text style={styles.statLabel}>Current Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{streakStats.longestStreak}</Text>
                <Text style={styles.statLabel}>Longest Streak</Text>
              </View>
            </View>

            <View style={styles.completionsContainer}>
              <View style={styles.completionBar}>
                <View 
                  style={[
                    styles.completionFill, 
                    { width: `${Math.min(100, (streakStats.totalCompletions / (totalHabits * 7)) * 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.completionText}>
                {streakStats.totalCompletions} total habit completions
              </Text>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.accountInfo}>
              <View style={styles.accountRow}>
                <Ionicons name="mail-outline" size={18} color="#6c757d" />
                <Text style={styles.emailText}>{user?.email}</Text>
              </View>
              {user?.user_metadata?.name && (
                <View style={styles.accountRow}>
                  <Ionicons name="person-outline" size={18} color="#6c757d" />
                  <Text style={styles.emailText}>{user.user_metadata.name}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color="white" style={styles.signOutIcon} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
  },
  identityContainer: {
    backgroundColor: '#f1f3f5',
    padding: 16,
    borderRadius: 8,
  },
  identityText: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
  },
  identityEditContainer: {
    marginBottom: 12,
  },
  identityInput: {
    backgroundColor: '#f1f3f5',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  identityEditActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#f1f3f5',
  },
  cancelButtonText: {
    color: '#495057',
  },
  saveButton: {
    backgroundColor: '#4a69bd',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a69bd',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  completionsContainer: {
    marginTop: 8,
  },
  completionBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  completionFill: {
    height: '100%',
    backgroundColor: '#4a69bd',
    borderRadius: 4,
  },
  completionText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  accountInfo: {
    backgroundColor: '#f1f3f5',
    padding: 16,
    borderRadius: 8,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    color: '#495057',
    marginLeft: 8,
  },
  signOutButton: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#e74c3c',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutIcon: {
    marginRight: 8,
  },
  signOutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 