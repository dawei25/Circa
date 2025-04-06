import { Slot } from "expo-router";
import { Tabs } from "expo-router/tabs";
import { Ionicons } from '@expo/vector-icons';

export default function MainLayout() {
  return (
    <Tabs>
      <Tabs.Screen 
        name="index"
        options={{ 
          title: "Today", 
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="today-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="habits"
        options={{ 
          title: "Habits", 
          tabBarLabel: "Habits",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name="profile"
        options={{ 
          title: "Profile", 
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
} 