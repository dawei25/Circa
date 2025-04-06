import { supabase } from './supabaseClient';

export interface Habit {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  schedule: {
    daily?: boolean;
    sunday?: boolean;
    monday?: boolean;
    tuesday?: boolean;
    wednesday?: boolean;
    thursday?: boolean;
    friday?: boolean;
    saturday?: boolean;
  };
  location_required?: boolean;
  location_data?: any;
  created_at?: string;
  updated_at?: string;
  completed?: boolean;
}

export interface Profile {
  id: string;
  email?: string;
  identity_statement?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HabitLog {
  id: number;
  habit_id: number;
  completed_date: string;
  location_data?: any;
  created_at?: string;
}

/**
 * Authentication functions
 */

export const signIn = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signUp = async (email: string, password: string) => {
  return supabase.auth.signUp({ email, password });
};

export const signOut = async () => {
  return supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  return supabase.auth.getUser();
};

export const getSession = async () => {
  return supabase.auth.getSession();
};

/**
 * Profile functions
 */

export const getProfile = async (userId: string) => {
  return supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
};

export async function updateProfile(profile: any) {
  if (!profile.id) {
    throw new Error('Profile ID is required');
  }

  // Set updated_at if not provided
  if (!profile.updated_at) {
    profile.updated_at = new Date().toISOString();
  }

  // If it's a new profile, set created_at
  if (!profile.created_at) {
    profile.created_at = new Date().toISOString();
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { data: null, error };
  }
}

/**
 * Habit functions
 */

export const createHabit = async (habit: Omit<Habit, 'id'>) => {
  return supabase
    .from('habits')
    .insert([habit]);
};

export const updateHabit = async (id: number, habit: Partial<Habit>) => {
  return supabase
    .from('habits')
    .update(habit)
    .eq('id', id);
};

export const deleteHabit = async (id: number) => {
  return supabase
    .from('habits')
    .delete()
    .eq('id', id);
};

export const getHabit = async (id: number) => {
  return supabase
    .from('habits')
    .select('*')
    .eq('id', id)
    .single();
};

export const getUserHabits = async (userId: string) => {
  return supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
};

export const getTodaysHabits = async (userId: string) => {
  // Get today's day of the week (0-6, where 0 is Sunday)
  const today = new Date().getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayName = dayNames[today];

  // Get habits scheduled for today
  const { data: habitsData, error: habitsError } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .or(`schedule->>'daily'.eq.true,schedule->'${todayName}'.eq.true`);

  if (habitsError) throw habitsError;

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
  const habitsWithCompletion = habitsData?.map(habit => ({
    ...habit,
    completed: completedHabitIds.has(habit.id)
  })) || [];
  
  return { data: habitsWithCompletion, error: null };
};

/**
 * Habit log functions
 */

export const toggleHabitCompletion = async (habitId: number) => {
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
      return supabase
        .from('habit_logs')
        .delete()
        .eq('id', existingLog.id);
    } else {
      // Insert new log if it doesn't exist
      return supabase
        .from('habit_logs')
        .insert([{ 
          habit_id: habitId, 
          completed_date: today, 
        }]);
    }
  } catch (error) {
    console.error('Error toggling habit completion:', error);
    throw error;
  }
};

export const getHabitLogs = async (habitId: number) => {
  return supabase
    .from('habit_logs')
    .select('*')
    .eq('habit_id', habitId)
    .order('completed_date', { ascending: false });
};

export const getUserHabitLogs = async (userId: string) => {
  return supabase
    .from('habit_logs')
    .select(`
      *,
      habits!inner (
        id,
        user_id,
        title
      )
    `)
    .eq('habits.user_id', userId)
    .order('completed_date', { ascending: false });
};

/**
 * Stats functions
 */

export const getHabitStats = async (userId: string) => {
  try {
    // Get total habits count
    const { data: habits, error: habitsError } = await supabase
      .from('habits')
      .select('id')
      .eq('user_id', userId);
    
    if (habitsError) throw habitsError;
    
    const totalHabits = habits?.length || 0;

    // Get habit logs
    const { data: logs, error: logsError } = await supabase
      .from('habit_logs')
      .select(`
        completed_date,
        habits!inner (
          id,
          user_id
        )
      `)
      .eq('habits.user_id', userId)
      .order('completed_date', { ascending: false });
    
    if (logsError) throw logsError;
    
    // Group logs by date
    const logsByDate = (logs || []).reduce((acc, log) => {
      const date = log.completed_date;
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate streaks
    const sortedDates = Object.keys(logsByDate)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let streakCounter = 0;
    
    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      
      if (i === 0) {
        // First date
        streakCounter = 1;
        
        // Check if it's today
        const today = new Date();
        const isToday = currentDate.getDate() === today.getDate() &&
                        currentDate.getMonth() === today.getMonth() &&
                        currentDate.getFullYear() === today.getFullYear();
                        
        if (isToday) {
          currentStreak = 1;
        } else {
          // If first log is not today, no current streak
          currentStreak = 0;
        }
      } else {
        const prevDate = new Date(sortedDates[i-1]);
        const diffTime = Math.abs(prevDate - currentDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day
          streakCounter++;
          if (i === 1 && currentStreak > 0) currentStreak = streakCounter;
        } else {
          // Streak broken
          if (streakCounter > longestStreak) {
            longestStreak = streakCounter;
          }
          streakCounter = 1;
        }
      }
    }
    
    // Update longest streak if current streak is longer
    if (streakCounter > longestStreak) {
      longestStreak = streakCounter;
    }
    
    return {
      totalHabits,
      currentStreak,
      longestStreak,
      totalCompletions: logs?.length || 0
    };
  } catch (error) {
    console.error('Error getting habit stats:', error);
    throw error;
  }
}; 