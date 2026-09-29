import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, Activity, Leaf, CheckSquare, Sparkles, Wind, User, Phone, MapPin, Wheat, Save } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const { user, updateMetadata, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [farmSize, setFarmSize] = useState('');
  
  type Crop = { id: string; name: string; acres: string };
  const [crops, setCrops] = useState<Crop[]>([]);
  
  type Worker = { id: string; name: string; workerId: string; phone: string };
  const [workers, setWorkers] = useState<Worker[]>([]);
  
  const [livestock, setLivestock] = useState<{id: string, type: string, count: string}[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (user?.user_metadata) {
      const meta = user.user_metadata;
      setName(meta.name || meta.full_name || '');
      setPhone(meta.phone_number || '');
      setLocation(meta.location || '');
      
      // Handle legacy string format or new array format for team
      if (meta.team_numbers) {
        if (typeof meta.team_numbers === 'string') {
          setWorkers(meta.team_numbers.split(',').map((n: string, i: number) => ({ id: i.toString(), name: '', workerId: '', phone: n.trim() })).filter((w: Worker) => w.phone));
        } else if (Array.isArray(meta.team_numbers)) {
          setWorkers(meta.team_numbers);
        }
      } else {
        setWorkers([]);
      }
      
      const inventory = meta.inventory;
      if (inventory) {
        setFarmSize(inventory.farmSize || '');
        if (inventory.crops_array) {
          setCrops(inventory.crops_array);
        } else if (inventory.crops) {
          if (Array.isArray(inventory.crops)) {
            setCrops(inventory.crops.map((c: string, i: number) => ({ id: i.toString(), name: c, acres: '' })));
          } else if (typeof inventory.crops === 'string') {
            setCrops(inventory.crops.split(',').map((c: string, i: number) => ({ id: i.toString(), name: c.trim(), acres: '' })).filter((c: any) => c.name));
          }
        }
        
        if (inventory.livestock) {
          setLivestock(inventory.livestock);
        }
      }
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const existingInventory = user?.user_metadata?.inventory || {};
      
      const metadata = {
        name: name,
        full_name: name,
        phone_number: phone,
        location: location,
        team_numbers: workers,
        inventory: {
          ...existingInventory,
          farmSize: farmSize,
          crops_array: crops,
          livestock: livestock
        }
      };

      await updateMetadata(metadata);
      
      if (Platform.OS === 'web') {
        setMessage({ type: 'success', text: 'Profile successfully updated in database!' });
      } else {
        Alert.alert('Success', 'Profile and inventory successfully synced to database!');
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      if (Platform.OS !== 'web') Alert.alert('Error', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    const executeDeletion = async () => {
      setIsSaving(true);
      try {
        await updateMetadata({
          onboarded: false,
          inventory: null,
          role: null,
          name: 'Deleted User'
        });
        await signOut();
      } catch (e) {
        console.error(e);
      } finally {
        setIsSaving(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('WARNING: Are you sure you want to completely erase your farm data and delete this account?')) {
        executeDeletion();
      }
    } else {
      Alert.alert(
        'Delete Account',
        'WARNING: Are you sure you want to completely erase your farm data and delete this account?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Yes, Delete My Account', style: 'destructive', onPress: executeDeletion }
        ]
      );
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#f0ece4] pt-24 px-6" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
      
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontFamily: i18n.language === 'ta' ? 'Inter_700Bold' : 'BebasNeue_400Regular', fontSize: i18n.language === 'ta' ? 22 : 38, color: '#0f0f0f', letterSpacing: 0.5, lineHeight: i18n.language === 'ta' ? 28 : 42 }}>
          {t('farm_profile')}
        </Text>
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#555555', marginTop: 2 }}>
          {t('manage_details')}
        </Text>
      </View>

      {message && Platform.OS === 'web' && (
        <View className={`p-4 rounded-xl mb-4 ${message.type === 'success' ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
          <Text className={`font-bold ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{message.text}</Text>
        </View>
      )}

      {/* Personal Details Hero Panel (Rich Farm Green) */}
      <View style={{ backgroundColor: '#10b981', borderRadius: 24, padding: 22, marginBottom: 24, shadowColor: '#10b981', shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <User color="#ffffff" size={24} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#ffffff', marginLeft: 10 }}>{t('personal_details')}</Text>
        </View>

        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{t('full_name')}</Text>
          <TextInput
            style={{ backgroundColor: '#ffffff', height: 48, borderRadius: 14, paddingHorizontal: 16, fontFamily: 'Inter_500Medium', color: '#0f0f0f' }}
            placeholder="e.g. John Doe"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#888"
          />
        </View>

        <View style={{ marginBottom: 14 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{t('phone_number')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 14, paddingHorizontal: 16, height: 48 }}>
            <Phone color="#64748b" size={16} style={{ marginRight: 8 }} />
            <TextInput
              style={{ flex: 1, fontFamily: 'Inter_500Medium', color: '#0f0f0f' }}
              placeholder="+91 9876543210"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              placeholderTextColor="#888"
            />
          </View>
        </View>

        <View style={{ marginBottom: 4 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{t('region')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 14, paddingHorizontal: 16, height: 48 }}>
            <MapPin color="#ef4444" size={16} style={{ marginRight: 8 }} />
            <TextInput
              className="flex-1 font-inter text-ink"
              placeholder="e.g. Punjab, India"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>
      </View>

      {/* Farm Details */}
      <View className="p-5 mb-6 bg-[#f59e0b]/10 rounded-[24px]">
        <View className="flex-row items-center mb-4">
          <Wheat color="#f59e0b" size={24} />
          <Text className="font-bold text-ink text-lg ml-2">{t('farm_details')}</Text>
        </View>

        <View className="mb-4">
          <Text className="text-xs text-ink-muted font-bold uppercase tracking-widest mb-1 ml-1">{t('total_farm_size')}</Text>
          <TextInput
            className="bg-white h-12 rounded-xl px-4 border border-ink/5 font-inter text-ink"
            placeholder="e.g. 50"
            keyboardType="numeric"
            value={farmSize}
            onChangeText={setFarmSize}
          />
        </View>

        <View className="flex-row justify-between items-center mb-4 mt-6">
          <Text className="text-xs text-ink-muted font-bold uppercase tracking-widest ml-1">{t('active_crops')}</Text>
          <TouchableOpacity 
            onPress={() => setCrops([...crops, { id: Date.now().toString(), name: '', acres: '' }])}
            className="bg-[#f59e0b]/10 px-3 py-1.5 rounded-lg border border-[#f59e0b]/20"
          >
            <Text className="text-[#f59e0b] font-bold text-xs">{t('add_crop')}</Text>
          </TouchableOpacity>
        </View>

        {crops.length === 0 && (
          <View className="bg-ink/5 p-4 rounded-xl items-center border border-ink/5 mb-2">
            <Text className="text-ink-muted font-bold text-sm">{t('no_active_crops')}</Text>
          </View>
        )}

        {crops.map((crop, index) => (
          <View key={crop.id} className="flex-row items-center space-x-3 mb-3 bg-white p-3 rounded-xl border border-ink/5">
            <View className="flex-[2] mr-2">
              <Text className="text-[10px] text-ink-muted font-bold uppercase tracking-widest mb-1 ml-1">{t('crop_name')}</Text>
              <TextInput
                className="bg-[#f0ece4] h-10 rounded-lg px-3 font-inter text-ink"
                placeholder="e.g. Wheat"
                value={crop.name}
                onChangeText={(val) => {
                  const newC = [...crops];
                  newC[index].name = val;
                  setCrops(newC);
                }}
              />
            </View>
            <View className="flex-1 mr-2">
              <Text className="text-[10px] text-ink-muted font-bold uppercase tracking-widest mb-1 ml-1">{t('acres')}</Text>
              <TextInput
                className="bg-[#f0ece4] h-10 rounded-lg px-3 font-inter text-ink text-center"
                placeholder="e.g. 20"
                keyboardType="numeric"
                value={crop.acres}
                onChangeText={(val) => {
                  const newC = [...crops];
                  newC[index].acres = val;
                  setCrops(newC);
                }}
              />
            </View>
            <TouchableOpacity onPress={() => setCrops(crops.filter(c => c.id !== crop.id))} className="mt-4 p-3 bg-red-50 rounded-lg items-center justify-center border border-red-100">
              <Text className="text-red-500 font-bold text-xs">X</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Farm Team */}
      <View className="p-5 mb-6 bg-[#8b5cf6]/10 rounded-[24px]">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <User color="#8b5cf6" size={24} />
            <Text className="font-bold text-ink text-lg ml-2">{t('farm_team')}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setWorkers([...workers, { id: Date.now().toString(), name: '', workerId: '', phone: '' }])}
            className="bg-[#8b5cf6]/10 px-3 py-1.5 rounded-lg border border-[#8b5cf6]/20"
          >
            <Text className="text-[#8b5cf6] font-bold text-xs">{t('add_worker')}</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-xs text-ink-muted mb-4">Add your team members to receive emergency SMS alerts.</Text>
        
        {workers.length === 0 && (
          <View className="bg-ink/5 p-4 rounded-xl items-center border border-ink/5 mb-2">
            <Text className="text-ink-muted font-bold text-sm">No team members added.</Text>
          </View>
        )}

        {workers.map((worker, index) => (
          <View key={worker.id} className="bg-white p-4 rounded-xl border border-ink/5 mb-3 shadow-sm shadow-ink/5">
            <View className="flex-row justify-between mb-3">
              <Text className="font-bold text-ink-muted text-xs uppercase tracking-widest">Worker #{index + 1}</Text>
              <TouchableOpacity onPress={() => setWorkers(workers.filter(w => w.id !== worker.id))}>
                <Text className="text-red-500 font-bold text-xs">Remove</Text>
              </TouchableOpacity>
            </View>
            
            <View className="flex-row space-x-3 mb-3">
              <View className="flex-1">
                <Text className="text-[10px] text-ink-muted font-bold uppercase tracking-widest mb-1 ml-1">Name</Text>
                <TextInput
                  className="bg-[#f0ece4] h-10 rounded-lg px-3 font-inter text-ink"
                  placeholder="e.g. John Doe"
                  value={worker.name}
                  onChangeText={(val) => {
                    const newW = [...workers];
                    newW[index].name = val;
                    setWorkers(newW);
                  }}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] text-ink-muted font-bold uppercase tracking-widest mb-1 ml-1">{t('worker_id')}</Text>
                <TextInput
                  className="bg-[#f0ece4] h-10 rounded-lg px-3 font-inter text-ink"
                  placeholder="e.g. EMP-01"
                  value={worker.workerId}
                  onChangeText={(val) => {
                    const newW = [...workers];
                    newW[index].workerId = val;
                    setWorkers(newW);
                  }}
                />
              </View>
            </View>
            
            <View>
              <Text className="text-[10px] text-ink-muted font-bold uppercase tracking-widest mb-1 ml-1">Phone Number (With Country Code)</Text>
              <TextInput
                className="bg-[#f0ece4] h-10 rounded-lg px-3 font-inter text-ink"
                placeholder="e.g. +1234567890"
                keyboardType="phone-pad"
                value={worker.phone}
                onChangeText={(val) => {
                  const newW = [...workers];
                  newW[index].phone = val;
                  setWorkers(newW);
                }}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Livestock Inventory */}
      <View className="p-5 mb-8 bg-[#3b82f6]/10 rounded-[24px]">
        <View className="flex-row items-center mb-4">
          <Activity color="#3b82f6" size={24} />
          <Text className="font-bold text-ink text-lg ml-2">{t('livestock_inventory')}</Text>
        </View>
        <Text className="text-xs text-ink-muted mb-4">Updating counts here will automatically reflect on your Dashboard.</Text>

        {livestock.length === 0 && (
          <View className="bg-ink/5 p-4 rounded-xl items-center border border-ink/5 mb-4">
            <Text className="text-ink-muted font-bold text-sm">No livestock inventory found.</Text>
          </View>
        )}

        {livestock.map((item, index) => (
          <View key={item.id} className="flex-row items-center justify-between bg-white p-3 rounded-xl border border-ink/5 mb-3">
            <Text className="font-bold text-ink ml-2">{item.type}</Text>
            <TextInput
              className="bg-ink/5 h-10 w-20 rounded-lg px-3 font-bold text-center border border-ink/10"
              keyboardType="numeric"
              value={item.count}
              onChangeText={(val) => {
                const newLs = [...livestock];
                newLs[index].count = val;
                setLivestock(newLs);
              }}
            />
          </View>
        ))}
      </View>

      <TouchableOpacity 
        onPress={handleSave}
        disabled={isSaving}
        className={`flex-row justify-center items-center h-14 rounded-2xl mb-4 shadow-lg ${isSaving ? 'bg-ink/50' : 'bg-farm-green shadow-farm-green/30'}`}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Save color="#fff" size={20} className="mr-2" />
            <Text className="text-white font-bold uppercase tracking-widest text-lg">{t('sync_profile')}</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={handleDeleteAccount}
        disabled={isSaving}
        className="flex-row justify-center items-center h-14 rounded-2xl mb-12 border border-red-500/30 bg-red-50"
      >
        <Text className="text-red-500 font-bold uppercase tracking-widest text-sm">Delete Account & Data</Text>
      </TouchableOpacity>
      
      <View className="h-10" />

    </ScrollView>
  );
}
