import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Platform, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { GlassCard } from '../src/components/GlassCard';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { Mail, Lock, User as UserIcon, MapPin, ArrowLeft, Eye, EyeOff, Zap, Wallet } from 'lucide-react-native';
import { useAuth, getPersistentProfile } from '../src/contexts/AuthContext';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { loginAsDemoUser } = useAuth();
  const [isRegistering, setIsRegistering] = useState(true); // Default to registration view
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  const performOAuth = async () => {
    try {
      const redirectUrl = Linking.createURL('/');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) throw error;
      if (data?.url && Platform.OS !== 'web') {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === 'success') {
          const { error: sessionError } = await (supabase.auth as any).getSessionFromUrl({ url: result.url });
          if (sessionError) {
            const { params, errorCode } = QueryParams.getQueryParams(result.url);
            if (errorCode) throw new Error(errorCode);
            const { access_token, refresh_token } = params;
            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error during Google Sign In:', error.message);
      loginAsDemoUser('google.user@agrisync.farm', 'Google Farmer User', 'Tanjore, Tamil Nadu', '148500', true);
      router.replace('/onboarding');
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    try {
      const emailToUse = email.trim() || 'bharu1124@gmail.com';
      const saved = getPersistentProfile(emailToUse);

      if (isRegistering) {
        // Log in as new farmer and navigate straight to Farm Details Onboarding
        loginAsDemoUser(
          emailToUse, 
          name || 'Bharunesh', 
          location || 'Tanjore',
          '82000',
          false // onboarded = false
        );
        router.replace('/onboarding');
      } else {
        // Logging in existing user with their exact saved registered profile
        const isOnboarded = saved ? (saved.onboarded ?? true) : true;
        loginAsDemoUser(
          emailToUse, 
          name || saved?.name || 'Bharunesh', 
          location || saved?.location || 'Tanjore',
          saved?.availableCash || '82000',
          isOnboarded
        );
        router.replace(isOnboarded ? '/(drawer)' : '/onboarding');
      }
    } catch (error: any) {
      console.warn("Auth fallback triggered:", error.message);
      loginAsDemoUser(email, name || 'Bharunesh', location || 'Tanjore', '82000', false);
      router.replace('/onboarding');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectFactualDemoLogin = () => {
    loginAsDemoUser(
      email || 'bharuneshp.cse2024@citchennai.net',
      name || 'Bharunesh P',
      location || 'Tanjore, Tamil Nadu',
      '148500',
      true // onboarded = true -> enters dashboard immediately with factual Tanjore agricultural data!
    );
    router.replace('/(drawer)');
  };

  const handleInstantDemoLogin = () => {
    loginAsDemoUser(
      email || 'bharu1124@gmail.com',
      name || 'Bharunesh P',
      location || 'Tanjore, Tamil Nadu',
      '148500',
      false // onboarded = false -> asks for custom farm details
    );
    router.replace('/onboarding');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f0ece4" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 36,
          paddingBottom: 80,
          maxWidth: 480,
          width: "100%",
          alignSelf: "center",
        }}
      >
        
        {!isRegistering && (
          <TouchableOpacity 
            className="self-start mb-2 flex-row items-center p-2 rounded-full bg-white/50 border border-ink/10"
            onPress={() => setIsRegistering(true)}
          >
            <ArrowLeft size={20} color="#0f0f0f" />
            <Text className="ml-2 text-ink font-medium text-sm">Back to Register</Text>
          </TouchableOpacity>
        )}

        <View className={`items-center ${isRegistering ? 'mb-6 mt-4' : 'mb-8 mt-12'}`}>
          <Text className="font-display text-5xl text-farm-green leading-tight text-center">
            AgriSync Farmer Portal
          </Text>
          <Text className="text-ink-muted font-body text-sm mt-2">
            {isRegistering ? 'Register to get started' : 'Login to your account'}
          </Text>
        </View>

        <GlassCard className="p-6">
          
          {isRegistering && (
            <View className="bg-white/50 border border-ink/10 rounded-xl flex-row items-center px-4 mb-4 h-14">
              <UserIcon size={20} color="#0f0f0f" opacity={0.5} />
              <TextInput
                className="flex-1 ml-3 font-body text-ink text-base h-full outline-none"
                placeholder="Full Name"
                placeholderTextColor="rgba(15, 15, 15, 0.4)"
                value={name}
                onChangeText={setName}
              />
            </View>
          )}

          <View className="bg-white/50 border border-ink/10 rounded-xl flex-row items-center px-4 mb-4 h-14">
            <Mail size={20} color="#0f0f0f" opacity={0.5} />
            <TextInput
              className="flex-1 ml-3 font-body text-ink text-base h-full outline-none"
              placeholder="Email Address"
              placeholderTextColor="rgba(15, 15, 15, 0.4)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View className="bg-white/50 border border-ink/10 rounded-xl flex-row items-center px-4 mb-6 h-14">
            <Lock size={20} color="#0f0f0f" opacity={0.5} />
            <TextInput
              className="flex-1 ml-3 font-body text-ink text-base h-full outline-none"
              placeholder="Password"
              placeholderTextColor="rgba(15, 15, 15, 0.4)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-2">
              {showPassword ? (
                <EyeOff size={20} color="#0f0f0f" opacity={0.5} />
              ) : (
                <Eye size={20} color="#0f0f0f" opacity={0.5} />
              )}
            </TouchableOpacity>
          </View>

          {isRegistering && (
            <View className="bg-white/50 border border-ink/10 rounded-xl flex-row items-center px-4 mb-6 h-14">
              <MapPin size={20} color="#0f0f0f" opacity={0.5} />
              <TextInput
                className="flex-1 ml-3 font-body text-ink text-base h-full outline-none"
                placeholder="Location (City, State)"
                placeholderTextColor="rgba(15, 15, 15, 0.4)"
                value={location}
                onChangeText={setLocation}
              />
            </View>
          )}

          <TouchableOpacity 
            className="bg-ink py-4 rounded-full flex-row justify-center items-center mb-6 shadow-sm"
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#f0ece4" />
            ) : (
              <Text className="text-cream font-bold text-sm tracking-wider uppercase">
                {isRegistering ? 'Register & Enter App' : 'Login'}
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center mb-6">
            <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
              <Text className="text-farm-green font-bold text-base">
                {isRegistering ? 'Already registered? Login' : 'Need an account? Register'}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              backgroundColor: "#f0f4f8",
              borderWidth: 1,
              borderColor: "#d1e0f0",
              borderRadius: 20,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
              <Zap size={18} color="#16a34a" style={{ marginRight: 6 }} />
              <Text style={{ fontWeight: "800", color: "#0f0f0f", fontSize: 14 }}>
                Quick Guest Access:
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleDirectFactualDemoLogin}
              style={{
                backgroundColor: "#16a34a",
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                minHeight: 48,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontWeight: "800",
                  fontSize: 12,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  textAlign: "center",
                }}
              >
                🚀 Sign in as Guest (Explore Demo Farm)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleInstantDemoLogin}
              style={{
                backgroundColor: "#ffffff",
                borderWidth: 1.5,
                borderColor: "#16a34a",
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                minHeight: 46,
              }}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: "#16a34a",
                  fontWeight: "800",
                  fontSize: 12,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  textAlign: "center",
                }}
              >
                📝 Setup New Custom Farm
              </Text>
            </TouchableOpacity>
          </View>

          {!isRegistering && (
            <>
              <View className="flex-row items-center mb-6">
                <View className="flex-1 h-[1px] bg-ink/10" />
                <Text className="mx-4 text-ink-muted text-xs font-bold tracking-widest uppercase">OR</Text>
                <View className="flex-1 h-[1px] bg-ink/10" />
              </View>
              
              <TouchableOpacity 
                className="bg-white border border-ink/10 py-4 rounded-full flex-row justify-center items-center"
                onPress={performOAuth}
              >
                <Text className="text-ink font-bold text-sm tracking-wider uppercase">Sign in with Google</Text>
              </TouchableOpacity>
            </>
          )}

        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
