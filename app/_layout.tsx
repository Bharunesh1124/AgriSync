import 'react-native-gesture-handler';
import '../global.css';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import '../src/i18n';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { FarmEventProvider } from '../src/contexts/FarmEventContext';
import { ReportProvider } from '../src/contexts/ReportContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootLayoutNav() {
  const { session, role, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (isLoading || !rootNavigationState?.key) return;

    // ENABLING STRICT AUTH ROUTING
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!session) {
      if (!inAuthGroup) {
         router.replace('/login');
      }
    } else if (session) {
      // User is logged in (either via email or Google OAuth)
      const onboarded = session.user?.user_metadata?.onboarded;
      
      if (!onboarded && segments[0] !== 'onboarding') {
        // Force onboarding for new/non-onboarded users
        router.replace('/onboarding');
      } else if (onboarded && (inAuthGroup || segments[0] === 'onboarding')) {
        // If onboarded, send them to dashboard
        router.replace('/(drawer)');
      }
    }
  }, [session, role, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f0ece4' } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(drawer)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BebasNeue_400Regular,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  const [forceRender, setForceRender] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => setForceRender(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError || forceRender) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, forceRender]);

  if (!fontsLoaded && !fontError && !forceRender) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <FarmEventProvider>
          <ReportProvider>
            <View style={{ flex: 1, backgroundColor: '#f0ece4', alignItems: 'center' }}>
              <View style={{ flex: 1, width: '100%', maxWidth: 480, overflow: 'hidden', backgroundColor: '#f0ece4', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 }}>
                <RootLayoutNav />
              </View>
            </View>
          </ReportProvider>
        </FarmEventProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
