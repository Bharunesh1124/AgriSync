import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const { loginAsDemoUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      // Automatically establish farmer session and enter dashboard immediately
      loginAsDemoUser('bharuneshp.cse2024@citchennai.net', 'Bharunesh (Farmer)', 'Tanjore, Tamil Nadu', '148500', true);
      router.replace('/(drawer)');
    };
    init();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#f0ece4', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#10b981" />
      <Text style={{ marginTop: 16, color: '#64748b', fontWeight: 'bold' }}>Entering AgriSync Farmer Portal...</Text>
    </View>
  );
}
