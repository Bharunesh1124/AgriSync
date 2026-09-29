import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { Platform } from 'react-native';

export default function Index() {
  const { session, isLoading } = useAuth();
  
  if (isLoading) return null;

  // Prevent eager redirect if the URL contains an OAuth hash fragment or PKCE code (Web only)
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    if (window.location.hash?.includes('access_token') || window.location.search?.includes('code=')) {
      return null; // Wait for AuthContext to process the token
    }
  }
  
  if (session) {
    return <Redirect href="/(drawer)" />;
  } else {
    return <Redirect href="/login" />;
  }
}
