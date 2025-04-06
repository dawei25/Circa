import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../lib/supabaseClient';
import HabitItem from '../../components/HabitItem';
import IdentityHeader from '../../components/IdentityHeader';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Import these components once created
// import HabitItem from '../../components/HabitItem';
// import IdentityHeader from '../../components/IdentityHeader';

export default function TodayScreen() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState('');

  // Use useFocusEffect to refresh data when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchTodaysHabits();
      fetchUserIdentity();
      return () => {}; // cleanup function
    }, [])
  );

  // Initial load
  useEffect(() => {
    fetchTodaysHabits();
    fetchUserIdentity();
  }, []);

  const fetchTodaysHabits = async () => {
    try {
      setLoading(true);
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get today's day of the week (0-6, where 0 is Sunday)
      const today = new Date().getDay();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayName = dayNames[today];

      console.log(`Fetching habits for ${todayName} (day ${today})`);

      // Get all habits for the user - we'll filter for today's habits client-side
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      if (habitsError) {
        console.error('Habits query error:', habitsError);
        throw habitsError;
      }

      // Filter habits for today client-side
      const todaysHabits = habitsData?.filter(habit => {
        // Check if habit has a schedule
        if (!habit.schedule) return false;
        
        // Check if the habit is daily
        if (habit.schedule.daily === true) return true;
        
        // Check if the habit is scheduled for today
        return habit.schedule[todayName] === true;
      });

      console.log(`Found ${todaysHabits?.length || 0} habits for today out of ${habitsData?.length || 0} total habits`);

      // Get today's date in YYYY-MM-DD format
      const todayDate = new Date().toISOString().split('T')[0];
      
      // Get completed habits for today
      const { data: completedData, error: completedError } = await supabase
        .from('habit_logs')
        .select('habit_id')
        .eq('completed_date', todayDate);
        
      if (completedError) throw completedError;
      
      // Create a set of completed habit IDs for faster lookups
      const completedHabitIds = new Set(completedData?.map(log => log.habit_id) || []);
      
      // Merge habit data with completion status
      const habitsWithCompletion = todaysHabits?.map(habit => ({
        ...habit,
        completed: completedHabitIds.has(habit.id)
      })) || [];
      
      setHabits(habitsWithCompletion);
    } catch (error) {
      console.error('Error fetching habits:', error);
      Alert.alert('Error', 'Failed to fetch today\'s habits: ' + JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  };

  const fetchUserIdentity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('identity_statement')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setIdentity(data?.identity_statement || '');
    } catch (error) {
      console.error('Error fetching user identity:', error);
    }
  };

  const toggleHabitCompletion = async (habitId, verificationData) => {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // Check if habit is already logged for today
      const { data: existingLog, error: checkError } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('habit_id', habitId)
        .eq('completed_date', today)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      if (existingLog) {
        // Delete the log if it exists
        const { error: deleteError } = await supabase
          .from('habit_logs')
          .delete()
          .eq('id', existingLog.id);
          
        if (deleteError) throw deleteError;
      } else {
        // Create an extra data field to store verification info
        const extraData = verificationData 
          ? { verification_data: JSON.stringify(verificationData) }
          : {};
          
        // Insert new log if it doesn't exist
        const { error: insertError } = await supabase
          .from('habit_logs')
          .insert([
            { 
              habit_id: habitId, 
              completed_date: today,
              ...extraData
            }
          ]);
          
        if (insertError) throw insertError;
      }
      
      // Update local state for immediate UI feedback
      setHabits(habits.map(habit => 
        habit.id === habitId 
          ? { ...habit, completed: !habit.completed } 
          : habit
      ));
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      Alert.alert('Error', 'Failed to save habit completion: ' + JSON.stringify(error));
    }
  };

  return (
    <View style={styles.container}>
      {/* Identity Statement Header */}
      <IdentityHeader identityStatement={identity} />
      
      {/* Today's Date */}
      <Text style={styles.dateText}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </Text>
      
      {/* Habits List */}
      {loading ? (
        <Text style={styles.loadingText}>Loading habits...</Text>
      ) : habits.length > 0 ? (
        <FlatList
          data={habits}
          renderItem={({ item }) => (
            <HabitItem habit={item} onToggle={toggleHabitCompletion} />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.habitsList}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No habits scheduled for today</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/habits')}
          >
            <Text style={styles.addButtonText}>Add a Habit</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Floating Action Button for adding habits */}
      {habits.length > 0 && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => router.push('/habits')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  dateText: {
    fontSize: 18,
    marginBottom: 16,
    color: '#495057',
  },
  habitsList: {
    paddingBottom: 20,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#6c757d',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#4a69bd',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 20,
    backgroundColor: '#4a69bd',
    borderRadius: 28,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
}); 