import React, { useEffect, useState } from "react";
import { Slot, Stack, useRouter, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { supabase } from "../lib/supabaseClient";
import * as API from "../lib/api";
import { Session } from "@supabase/supabase-js";
import { AuthProvider, useAuth } from '../context/auth';

// Root layout with auth protection
export default function RootLayout() {
  return (
    <AuthProvider>
      <ProtectedRouteProvider />
    </AuthProvider>
  );
}

// Component to handle protected routes
function ProtectedRouteProvider() {
  const segments = useSegments();
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const [hasCheckedIdentity, setHasCheckedIdentity] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // Mark that we've checked the identity after loading completes
    setHasCheckedIdentity(true);
  }, [isLoading, session]);

  useEffect(() => {
    if (isLoading || !hasCheckedIdentity) return;

    const inAuthGroup = segments[0] === "onboarding";
    
    // Get the current URL to check for parameters
    const url = segments.join('/');
    const isIdentitySetup = url.includes('step=identity');

    if (!session && !inAuthGroup) {
      // Redirect to onboarding if not authenticated
      router.replace("/onboarding");
    } else if (session && inAuthGroup && !isIdentitySetup) {
      // Only redirect away from onboarding if not in identity setup
      router.replace("/");
    }
  }, [session, segments, isLoading, hasCheckedIdentity]);

  return <Slot />;
} 