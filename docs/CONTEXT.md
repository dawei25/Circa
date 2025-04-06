# Identity-Based Habit Tracker (Hackathon MVP)

This Markdown file outlines the **Phase 1** MVP implementation for a cross-platform habit tracker app using **Expo Router** for navigation and **Supabase** for the backend.

---

## 1. App Vision & Core Concept

- **Identity-Based Habits**  
  The core idea is tying habits to a user’s desired identity. For instance, someone who wants to become a runner would have a personal identity statement like “I am a runner,” and the app reinforces that by helping them run daily.

- **Clean, Engaging UI**  
  The design focuses on clarity and ease of use, ensuring users can quickly view and mark habits each day.

- **Hackathon Scope**  
  We’ll implement enough functionality to demonstrate the core habit-flow (habit creation, daily view, basic verification), leaving advanced features for a future phase.

---

## 2. Core Features (Phase 1)

1. **User Authentication & Identity Setup**
   - Simple sign-up/login via **Supabase Authentication**.
   - During onboarding, user sets an identity statement (e.g., “I am a mindful, active person”).
   - Store profile data in Supabase.

2. **Habit Creation & Management**
   - Ability to create habits with name, description, schedule (daily or specific days).
   - Associate each habit with the user’s identity statement for motivational context.
   - Edit and delete habits as needed.

3. **Basic Verification Methods**
   - **Manual:** Mark habit as complete with a checkbox/toggle.
   - **Location-Based:** Demonstrate with one example, such as verifying gym visits via geofencing.  
     *(Keep the data structure flexible for adding more sensors later.)*

4. **Today View (Home Screen)**
   - Shows today’s scheduled habits.
   - Quick access to mark them complete.
   - Displays the user’s identity statement prominently.

5. **Progress Tracking**
   - Basic streak counting (how many days in a row the user completes a habit).
   - Simple stats on completion rates.
   - Lightweight calendar or timeline view to see daily completions.

6. **Core Navigation**
   - **Expo Router**-based navigation structure:
     1. **Home** (Today’s habits)  
     2. **Habits List** (management)  
     3. **Profile/Settings** (Identity statement, account info)

7. **Technical Implementation**
   - **React Native (Expo)** for cross-platform app development.
   - **Supabase** for authentication and data storage.
   - **Expo Router** for file-based routing.

---

## 3. Features Excluded from Hackathon MVP

- **Pet/Avatar System** – Will be implemented in a future phase.  
- **App Distraction Blocking** – Not critical for initial demo.  
- **Habit Stacking** – Post-hackathon addition.  
- **Complex Verification** – Only one advanced method (location) beyond manual.  
- **AI-Driven Coaching & Social Features** – Deferred for Phase 2.  
- **Wearable Integrations & Advanced Gamification** – Out of scope for MVP.  
- **Detailed Calendar/Analytics** – Keep the calendar minimal for now.

---

## 4. Implementation Priorities

1. **User Authentication**  
   - Ensure sign-up and login flows work with Supabase.
   - Store basic user profile info (identity statement) in a `profiles` table.

2. **Habit Management**  
   - Create a `habits` table in Supabase with necessary fields (userId, title, schedule, location if needed).
   - Provide a screen (or route) where the user can add/edit/delete habits.

3. **Today View**  
   - Fetch habits due **today** (based on schedule).
   - Allow manual check-off or location check.
   - Update streak logic in `habit_logs`.

4. **Streak & Progress**  
   - On completing a habit for the day, insert a row in `habit_logs`.
   - Compare the last completion date to see if it’s consecutive.
   - Show a simple counter or calendar to indicate daily completions.

5. **Minimalist UI**  
   - Keep screens uncluttered.
   - Emphasize the identity statement at the top of the Home screen for motivation.

---

## 5. Recommended Folder & File Structure (Expo Router)

A typical **Expo Router** directory layout might look like this:

.
├── app
│   ├── (main)
│   │   ├── _layout.tsx       // Layout for the "(main)" group
│   │   ├── index.tsx         // Route: "/" (Home Screen)
│   │   ├── habits.tsx        // Route: "/habits"
│   │   └── profile.tsx       // Route: "/profile"
│   ├── _layout.tsx           // Root layout for the entire app
│   └── onboarding.tsx        // Route: "/onboarding"
├── components
│   ├── HabitItem.tsx         // Example component for displaying a habit
│   └── IdentityHeader.tsx     // Example component for displaying user's identity
├── assets
│   ├── images                // Folder for image assets
│   └── icons                 // Folder for icon assets
├── lib
│   ├── supabaseClient.ts     // Supabase instance/config
│   └── api.ts                // Reusable API or fetch functions
├── config
│   └── constants.ts          // Global constants (colors, strings, etc.)
├── translations
│   └── en.json               // i18n resource (if using translations)
├── App.tsx                   // Entry point for Expo
├── app.json                  // Expo configuration
├── package.json
└── tsconfig.json


### Explanation of Key Files

- **app/_layout.tsx**  
  - The root layout for the Expo Router app.
  - Wraps `<Slot />` for child routes.

- **app/(main)/_layout.tsx**  
  - Sub-layout that might define a tab or stack navigator for `index.tsx`, `habits.tsx`, `profile.tsx`.

- **app/(main)/index.tsx** (Home Screen)  
  - Shows today's habits and allows the user to mark them complete.

- **app/(main)/habits.tsx**  
  - List of user habits plus CRUD actions (create, edit, delete).

- **app/(main)/profile.tsx**  
  - Profile and settings (identity statement, possibly user account details).

- **app/onboarding.tsx**  
  - Sign-up or identity setup flow.

---

## 6. Minimal Router Snippet

**Root Layout** (`app/_layout.tsx`):

```tsx
import { Slot } from "expo-router";
import { Stack } from "expo-router/stack";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(main)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ title: "Onboarding" }} />
    </Stack>
  );
}
Main Layout (app/(main)/_layout.tsx):

tsx
Copy
Edit
import { Slot } from "expo-router";
import { Tabs } from "expo-router/tabs";

export default function MainLayout() {
  return (
    <Tabs>
      <Tabs.Screen 
        name="index"
        options={{ title: "Today", tabBarLabel: "Home" }}
      />
      <Tabs.Screen 
        name="habits"
        options={{ title: "Habits", tabBarLabel: "Habits" }}
      />
      <Tabs.Screen 
        name="profile"
        options={{ title: "Profile", tabBarLabel: "Profile" }}
      />
      <Slot />
    </Tabs>
  );
}
7. Getting Started with Phase 1
Set Up Supabase

Create a profiles table (for user identity & basic info).

Create a habits table (title, description, schedule, location if needed).

Create a habit_logs table (references habitId, completion date, etc.).

Implement Auth

In onboarding.tsx, allow new users to sign up & store their identity in profiles.

Use supabase.auth.signUp / supabase.auth.signInWithPassword.

Build Habit CRUD (habits.tsx)

List user’s habits from Supabase.

Provide UI for creating/editing a habit.

Optionally use a small modal or a separate route for the form.

Today Screen (index.tsx)

Query all habits due today.

Allow manual or location-based check-off.

Update streak logic in habit_logs.

Track Streaks

On completion, insert a row into habit_logs.

Compare the last completion date with the current to see if it’s consecutive.

Profile Screen (profile.tsx)

Display and edit the user’s identity statement.

Show basic stats (total habits, longest streak, etc.).