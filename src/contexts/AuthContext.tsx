import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Role = 'farmer' | 'vet' | 'authority' | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: Role;
  isLoading: boolean;
  setRole: (role: Role) => Promise<void>;
  updateMetadata: (metadata: any) => Promise<void>;
  signOut: () => Promise<void>;
  loginAsDemoUser: (email?: string, name?: string, location?: string, availableCash?: string, isOnboarded?: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  isLoading: true,
  setRole: async () => {},
  updateMetadata: async () => {},
  signOut: async () => {},
  loginAsDemoUser: () => {},
});

const getStorageKey = (email?: string) => {
  const e = email ? email.toLowerCase().trim() : 'demo';
  return `agrisync_profile_${e}`;
};

import { Platform } from 'react-native';

export const savePersistentProfile = (email: string, metadata: any) => {
  if (!email) return;
  const key = getStorageKey(email);
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const existing = getPersistentProfile(email) || {};
      const merged = { ...existing, ...metadata };
      window.localStorage.setItem(key, JSON.stringify(merged));
    }
  } catch (e) {
    console.warn("Could not write persistent profile", e);
  }
};

export const getPersistentProfile = (email: string) => {
  if (!email) return null;
  const key = getStorageKey(email);
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Could not read persistent profile", e);
  }
  return null;
};

export const FACTUAL_DEMO_DATA = {
  name: "Bharunesh P",
  location: "Tanjore, Tamil Nadu",
  availableCash: "148500",
  onboarded: true,
  role: "farmer",
  farmType: "Integrated Wheat, Rice & Sugarcane Farm",
  inventory: {
    farmSize: "15.5",
    cash_balance: 148500,
    cropDetails: [
      { id: "crop_1", name: "Rice", acres: "6.5" },
      { id: "crop_2", name: "Wheat", acres: "5.0" },
      { id: "crop_3", name: "Sugarcane", acres: "4.0" },
    ],
    crops: ["Rice", "Wheat", "Sugarcane"],
    livestock: [
      { id: "live_1", type: "Cattle", count: "12" },
      { id: "live_2", type: "Goats", count: "15" },
      { id: "live_3", type: "Pigs", count: "8" },
    ],
  },
  transactions: [
    {
      id: "tx_factual_101",
      vendor: "Kaveri Co-operative Milk Producers Union (Aavin)",
      amount: 35700,
      type: "in",
      category: "Livestock Sales",
      crop: "Dairy Cattle",
      date: "Sep 24, 2026",
      method: "NEFT Bank Transfer",
      status: "Received",
      description: "Fortnightly milk collection payout (992 Liters @ ₹36/L - 4.1% Fat content)",
    },
    {
      id: "tx_factual_102",
      vendor: "Kanchipuram APMC Wholesale Mandi",
      amount: 18500,
      type: "in",
      category: "Crop Sales",
      crop: "Sugarcane",
      date: "Sep 22, 2026",
      method: "Direct UPI",
      status: "Received",
      description: "Wholesale auction of Sugarcane & Jaggery produce @ MSP",
    },
    {
      id: "tx_factual_103",
      vendor: "Tamil Nadu Agro Service Centre (TNAU Certified)",
      amount: 12400,
      type: "out",
      category: "Fertilizers & Nutrients",
      crop: "Rice",
      date: "Sep 20, 2026",
      method: "Cash",
      status: "Paid",
      description: "8 Bags Neem-Coated Urea (45kg) + 4 Bags MOP Potash (50kg)",
    },
    {
      id: "tx_factual_104",
      vendor: "Southern Feeds & Fodder Pvt Ltd",
      amount: 8200,
      type: "out",
      category: "Feed & Fodder",
      crop: "Cattle & Goats",
      date: "Sep 18, 2026",
      method: "UPI",
      status: "Paid",
      description: "500kg High-Protein Cattle & Goat Feed Mash + Mineral Mixture (10kg)",
    },
    {
      id: "tx_factual_105",
      vendor: "Cauvery Grain Procurement Agency",
      amount: 48000,
      type: "in",
      category: "Advance Crop Harvest",
      crop: "Rice & Wheat",
      date: "Sep 14, 2026",
      method: "Bank Transfer",
      status: "Received",
      description: "Token advance for upcoming Rice & Wheat harvest season (MSP Basis)",
    },
    {
      id: "tx_factual_106",
      vendor: "Jain Drip Irrigation & Solar Pumps",
      amount: 6800,
      type: "out",
      category: "Equipment Maintenance",
      crop: "Farm Infrastructure",
      date: "Sep 10, 2026",
      method: "Bank Transfer",
      status: "Paid",
      description: "Quarterly solar pump servicing, valve replacement & drip disc filter backwash",
    },
    {
      id: "tx_factual_107",
      vendor: "State Bank of India (Agri Credit Branch)",
      amount: 15800,
      type: "out",
      category: "Loan & EMI",
      crop: "Kisan Credit Card",
      date: "Sep 05, 2026",
      method: "Auto Debit",
      status: "Paid",
      description: "Monthly Kisan Credit Card (KCC) Subsidized Agri Loan EMI Repayment",
    },
  ],
};

export const seedFactualDemoDataToSupabase = async (userId: string) => {
  try {
    const txRows = FACTUAL_DEMO_DATA.transactions.map((tx) => ({
      user_id: userId,
      vendor: tx.vendor,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      crop: tx.crop,
      date: tx.date,
      method: tx.method,
      status: tx.status,
      description: tx.description,
      is_pending: false,
    }));

    await supabase.from("farm_transactions").insert(txRows);

    const taskRows = [
      {
        user_id: userId,
        title: "Morning Milk Collection & Fat Test",
        subtitle: "12 Head Cattle - Target 140L",
        category: "Livestock",
        time: "06:30 AM",
        priority: "High",
        status: "Completed",
        date: new Date().toISOString().split("T")[0],
      },
      {
        user_id: userId,
        title: "Delta Canal Irrigation Check",
        subtitle: "6.5 Acres Rice & 5.0 Acres Wheat - Tanjore Plot",
        category: "Water",
        time: "08:00 AM",
        priority: "High",
        status: "Pending",
        date: new Date().toISOString().split("T")[0],
      },
      {
        user_id: userId,
        title: "Neem Oil 10,000 PPM Foliar Spray",
        subtitle: "Rice & Wheat Stem Borer Prevention",
        category: "Crop",
        time: "10:30 AM",
        priority: "Medium",
        status: "Pending",
        date: new Date().toISOString().split("T")[0],
      },
    ];

    await supabase.from("daily_tasks").insert(taskRows);

    const livestockRows = [
      { user_id: userId, animal_type: "Cattle", count: 12, health_score: 97, location: "Tanjore, Tamil Nadu" },
      { user_id: userId, animal_type: "Goats", count: 15, health_score: 95, location: "Tanjore, Tamil Nadu" },
      { user_id: userId, animal_type: "Pigs", count: 8, health_score: 98, location: "Tanjore, Tamil Nadu" },
    ];

    await supabase.from("livestock_records").insert(livestockRows);
  } catch (e) {
    console.warn("Supabase demo data seed notice:", e);
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRoleState] = useState<Role>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const saved = getPersistentProfile(session.user.email || '');
        if (saved) {
          const mergedUser: User = {
            ...session.user,
            user_metadata: { ...session.user.user_metadata, ...saved }
          };
          setUser(mergedUser);
        } else {
          setUser(session.user);
        }
      } else {
        setUser(null);
      }
      setRoleState(session?.user?.user_metadata?.role ?? 'farmer');
      setIsLoading(false);
    }).catch(err => {
      console.error("Supabase auth error:", err);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        const saved = getPersistentProfile(session.user.email || '');
        if (saved) {
          const mergedUser: User = {
            ...session.user,
            user_metadata: { ...session.user.user_metadata, ...saved }
          };
          setUser(mergedUser);
        } else {
          setUser(session.user);
        }
      } else {
        setUser(null);
      }
      setRoleState(session?.user?.user_metadata?.role ?? 'farmer');
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginAsDemoUser = (userEmail?: string, userName?: string, userLocation?: string, cash?: string, isOnboarded: boolean = false) => {
    const emailToUse = userEmail || 'bharu1124@gmail.com';
    const savedProfile = getPersistentProfile(emailToUse) || {};

    const nameToUse = userName || savedProfile.name || (isOnboarded ? FACTUAL_DEMO_DATA.name : 'Bharunesh P');
    const locationToUse = userLocation || savedProfile.location || (isOnboarded ? FACTUAL_DEMO_DATA.location : 'Tanjore, Tamil Nadu');
    const cashToUse = cash || savedProfile.availableCash || (isOnboarded ? FACTUAL_DEMO_DATA.availableCash : '148500');
    const onboardedToUse = isOnboarded || savedProfile.onboarded || false;

    const factualInventory = {
      farmSize: "15.5",
      cash_balance: 148500,
      cropDetails: [
        { id: "crop_1", name: "Wheat", acres: "5.0" },
        { id: "crop_2", name: "Rice", acres: "6.5" },
        { id: "crop_3", name: "Sugarcane", acres: "4.0" },
      ],
      crops: ["Wheat", "Rice", "Sugarcane"],
      livestock: [
        { id: "live_1", type: "Cattle", count: "12" },
        { id: "live_2", type: "Goats", count: "15" },
        { id: "live_3", type: "Pigs", count: "8" },
      ],
    };

    const mergedMetadata = {
      ...savedProfile,
      name: nameToUse,
      role: 'farmer',
      location: 'Tanjore, Tamil Nadu',
      availableCash: cashToUse,
      farmType: 'Integrated Wheat, Rice & Sugarcane Farm',
      onboarded: onboardedToUse,
      inventory: factualInventory,
      transactions: FACTUAL_DEMO_DATA.transactions,
    };

    const mockUser: User = {
      id: savedProfile.id || 'demo-farmer-id-12345',
      app_metadata: { provider: 'email' },
      user_metadata: mergedMetadata,
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: emailToUse,
      phone: '',
      role: 'authenticated',
      updated_at: new Date().toISOString()
    };

    const mockSession: Session = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser
    };

    savePersistentProfile(emailToUse, mergedMetadata);
    seedFactualDemoDataToSupabase(mockUser.id);

    setUser(mockUser);
    setSession(mockSession);
    setRoleState('farmer');
    setIsLoading(false);
  };

  const setRole = async (newRole: Role) => {
    if (user) {
      const emailToUse = user.email || 'bharu1124@gmail.com';
      const updatedMetadata = { ...user.user_metadata, role: newRole };
      savePersistentProfile(emailToUse, updatedMetadata);
      setRoleState(newRole);

      if (user.id !== 'demo-farmer-id-12345') {
        const { data, error } = await supabase.auth.updateUser({
          data: { role: newRole }
        });
        if (!error && data.user) {
          setUser(data.user);
          setSession((prev) => prev ? { ...prev, user: data.user } : null);
          return;
        }
      }

      const updatedUser: User = { ...user, user_metadata: updatedMetadata };
      setUser(updatedUser);
      setSession((prev) => prev ? { ...prev, user: updatedUser } : null);
    }
  };

  const updateMetadata = async (metadata: any) => {
    if (user) {
      const emailToUse = user.email || 'bharu1124@gmail.com';
      const existingMetadata = user.user_metadata || {};
      const mergedMetadata = { ...existingMetadata, ...metadata };

      savePersistentProfile(emailToUse, mergedMetadata);

      const updatedUser: User = {
        ...user,
        user_metadata: mergedMetadata
      };
      setUser(updatedUser);
      setSession((prev) => prev ? { ...prev, user: updatedUser } : null);

      if (user.id !== 'demo-farmer-id-12345') {
        try {
          const { data, error } = await supabase.auth.updateUser({
            data: mergedMetadata
          });
          if (!error && data.user) {
            setUser(data.user);
            setSession((prev) => prev ? { ...prev, user: data.user } : null);
          }
        } catch (e) {
          console.warn("Supabase updateUser sync error:", e);
        }
      }
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoleState(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, isLoading, setRole, updateMetadata, signOut, loginAsDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
