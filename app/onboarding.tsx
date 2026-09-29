import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { Check, Plus, Trash2, ArrowRight, ArrowLeft, Wallet } from 'lucide-react-native';
import { GlassCard } from '../src/components/GlassCard';

type AnimalGroup = { id: string; type: string; count: string };
type CropGroup = { id: string; name: string; acres: string };

const ANIMAL_TYPES = ['Cattle', 'Poultry', 'Goats', 'Sheep', 'Pigs', 'Horses', 'Buffalo'];
const CROP_TYPES = ['Wheat', 'Corn', 'Rice', 'Sugarcane', 'Cotton', 'Soybeans', 'Vegetables', 'Mango', 'Coconut', 'Onion', 'Tomato', 'Spices'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, updateMetadata, signOut } = useAuth();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 State - Livestock
  const [livestock, setLivestock] = useState<AnimalGroup[]>([
    { id: Date.now().toString(), type: 'Cattle', count: '' }
  ]);

  // Step 2 State - Specific Crops & Acres Planted + Available Cash
  const [cropGroups, setCropGroups] = useState<CropGroup[]>([
    { id: Date.now().toString(), name: 'Wheat', acres: '' }
  ]);
  const [availableCash, setAvailableCash] = useState<string>(
    user?.user_metadata?.availableCash || user?.user_metadata?.inventory?.cash_balance?.toString() || '82000'
  );

  const addAnimalGroup = () => {
    setLivestock([...livestock, { id: Date.now().toString(), type: 'Poultry', count: '' }]);
  };

  const removeAnimalGroup = (id: string) => {
    setLivestock(livestock.filter(l => l.id !== id));
  };

  const updateAnimalGroup = (id: string, field: 'type' | 'count', value: string) => {
    setLivestock(livestock.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const addCropGroup = () => {
    setCropGroups([...cropGroups, { id: Date.now().toString(), name: 'Rice', acres: '' }]);
  };

  const removeCropGroup = (id: string) => {
    setCropGroups(cropGroups.filter(c => c.id !== id));
  };

  const updateCropGroup = (id: string, field: 'name' | 'acres', value: string) => {
    setCropGroups(cropGroups.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleBack = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const totalFarmAcres = cropGroups.reduce((acc, c) => acc + (parseFloat(c.acres) || 0), 0);
      const cashNum = parseFloat(availableCash) || 82000;
      
      await updateMetadata({
        onboarded: true,
        availableCash: availableCash || '82000',
        inventory: {
          livestock,
          farmSize: totalFarmAcres.toString(),
          cropDetails: cropGroups,
          crops: cropGroups.map(c => c.name),
          cash_balance: cashNum
        }
      });
      router.replace('/(drawer)');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#f0ece4]"
    >
      <ScrollView className="flex-1 px-6 pt-16 pb-12" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
        
        {/* Top Navigation Bar with Back Button */}
        <TouchableOpacity 
          onPress={handleBack}
          className="self-start mb-6 flex-row items-center px-4 py-2.5 rounded-full bg-white border border-ink/10 shadow-sm"
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#0f0f0f" />
          <Text className="ml-2 font-bold text-ink text-sm">Back to Register</Text>
        </TouchableOpacity>

        {/* Header */}
        <View className="mb-8">
          <Text className="font-bebas text-5xl text-ink">Farm Setup</Text>
          <Text className="font-inter text-ink-muted text-lg mt-2">
            {step === 1 ? 'Let\'s inventory your animals.' : 'Tell us about your crops & acres planted.'}
          </Text>
          
          {/* Progress Indicator */}
          <View className="flex-row items-center mt-6 space-x-2">
            <View className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-farm-green' : 'bg-ink/10'}`} />
            <View className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-farm-green' : 'bg-ink/10'}`} />
          </View>
        </View>

        {/* STEP 1: ANIMALS INVENTORY */}
        {step === 1 && (
          <View className="mb-12">
            {livestock.map((group, index) => (
              <GlassCard key={group.id} className="p-4 mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="font-bold text-ink">Animal Group {index + 1}</Text>
                  {livestock.length > 1 && (
                    <TouchableOpacity onPress={() => removeAnimalGroup(group.id)}>
                      <Trash2 color="#ef4444" size={20} />
                    </TouchableOpacity>
                  )}
                </View>

                <View className="flex-row space-x-2">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 mb-4" showsVerticalScrollIndicator={false}>
                    {ANIMAL_TYPES.map(type => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => updateAnimalGroup(group.id, 'type', type)}
                        className={`mr-2 px-4 py-2 rounded-xl border ${group.type === type ? 'bg-farm-green border-farm-green' : 'bg-white border-ink/10'}`}
                      >
                        <Text className={`font-bold ${group.type === type ? 'text-white' : 'text-ink'}`}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <TextInput
                  className="bg-white h-12 rounded-xl px-4 border border-ink/5"
                  placeholder={`How many ${group.type}s?`}
                  keyboardType="numeric"
                  value={group.count}
                  onChangeText={(val) => updateAnimalGroup(group.id, 'count', val)}
                />
              </GlassCard>
            ))}

            <TouchableOpacity 
              onPress={addAnimalGroup}
              className="flex-row items-center justify-center py-4 border-2 border-dashed border-ink/20 rounded-2xl bg-white/40"
            >
              <Plus color="#333" size={20} />
              <Text className="font-bold text-ink ml-2">Add Another Animal Group</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setStep(2)}
              className="bg-ink h-14 rounded-2xl items-center justify-center mt-8 flex-row"
            >
              <Text className="text-cream font-bold text-lg mr-2">Next Step: Crop Setup</Text>
              <ArrowRight color="#f0ece4" size={20} />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: SPECIFIC CROPS & ACRES PLANTED */}
        {step === 2 && (
          <View className="mb-12">
            
            {cropGroups.map((group, index) => (
              <GlassCard key={group.id} className="p-4 mb-4">
                <View className="flex-row justify-between mb-2 items-center">
                  <Text className="font-bold text-ink text-base">Crop #{index + 1}</Text>
                  {cropGroups.length > 1 && (
                    <TouchableOpacity onPress={() => removeCropGroup(group.id)}>
                      <Trash2 color="#ef4444" size={20} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Horizontal Crop Selection */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" showsVerticalScrollIndicator={false}>
                  {CROP_TYPES.map(crop => (
                    <TouchableOpacity
                      key={crop}
                      onPress={() => updateCropGroup(group.id, 'name', crop)}
                      className={`mr-2 px-4 py-2 rounded-xl border ${group.name === crop ? 'bg-farm-green border-farm-green' : 'bg-white border-ink/10'}`}
                    >
                      <Text className={`font-bold ${group.name === crop ? 'text-white' : 'text-ink'}`}>{crop}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Acres Input for specific crop */}
                <View className="flex-row items-center bg-white h-12 rounded-xl px-4 border border-ink/5">
                  <TextInput
                    className="flex-1 font-inter text-base text-ink"
                    placeholder={`Acres planted for ${group.name}`}
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={group.acres}
                    onChangeText={(val) => updateCropGroup(group.id, 'acres', val)}
                  />
                  <Text className="text-ink-muted font-bold ml-2">Acres</Text>
                </View>
              </GlassCard>
            ))}

            {/* Add Another Crop Button */}
            <TouchableOpacity 
              onPress={addCropGroup}
              className="flex-row items-center justify-center py-4 border-2 border-dashed border-ink/20 rounded-2xl mb-6 bg-white/40"
            >
              <Plus color="#333" size={20} />
              <Text className="font-bold text-ink ml-2">Add Another Crop</Text>
            </TouchableOpacity>

            {/* Calculated Total Summary */}
            <View className="bg-farm-green/10 p-4 rounded-2xl border border-farm-green/20 mb-6 flex-row justify-between items-center">
              <Text className="font-bold text-farm-green text-sm uppercase tracking-wider">Total Cultivated Area</Text>
              <Text className="font-extrabold text-farm-green text-xl">
                {cropGroups.reduce((acc, c) => acc + (parseFloat(c.acres) || 0), 0)} Acres
              </Text>
            </View>

            {/* Available Working Cash (₹) Input */}
            <GlassCard className="p-4 mb-8">
              <Text className="font-bold text-ink text-base mb-2">Available Cash (₹)</Text>
              <View className="flex-row items-center bg-white h-12 rounded-xl px-4 border border-ink/5">
                <Wallet color="#16a34a" size={20} />
                <TextInput
                  className="flex-1 font-inter text-base text-ink ml-3"
                  placeholder="Available cash amount (e.g. 82000)"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={availableCash}
                  onChangeText={setAvailableCash}
                />
                <Text className="text-ink-muted font-bold ml-2">₹</Text>
              </View>
            </GlassCard>

            <View className="flex-row space-x-4">
              <TouchableOpacity 
                onPress={() => setStep(1)}
                className="bg-white flex-1 h-14 rounded-2xl items-center justify-center border border-ink/10"
              >
                <Text className="text-ink font-bold text-lg">Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={handleComplete}
                disabled={isSubmitting}
                className={`flex-[2] h-14 rounded-2xl items-center justify-center flex-row ${isSubmitting ? 'bg-ink/50' : 'bg-farm-green'}`}
              >
                <Text className="text-white font-bold text-lg mr-2">
                  {isSubmitting ? 'Saving...' : 'Complete Setup'}
                </Text>
                {!isSubmitting && <Check color="white" size={20} />}
              </TouchableOpacity>
            </View>

          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
