import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Create secure storage for Supabase
// Using SecureStore on native platforms and AsyncStorage as fallback for web
class ExpoSecureStorageAdapter {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      return AsyncStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      return AsyncStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  }
}

// Initialize Supabase with your project details
// Hardcoded for this demo, but should be provided via environment variables in a real app
const supabaseUrl = 'https://bdoohrsexwvvbxetrxtw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkb29ocnNleHd2dmJ4ZXRyeHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5MDQ5ODQsImV4cCI6MjA1OTQ4MDk4NH0.j4toeoWr9YDY3EyQYNVBPsz6D0N7oyMoi1_HdszUj_w';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new ExpoSecureStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 