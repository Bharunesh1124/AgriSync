import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import React, { useState } from 'react';
import { Landmark, ShieldCheck, Calendar, AlertTriangle, CheckCircle, X, ArrowLeft, ExternalLink } from 'lucide-react-native';
import { matchGovernmentSchemes, getUpcomingDeadlines, getProtectionRecords, calculateProtectionExposure } from '../../src/lib/benefitMatcher';
import { useRouter } from 'expo-router';

export default function BenefitsScreen() {
  const router = useRouter();
  const farmerProfile = { hasLandRecord: false, name: 'Kisan', farmSize: 2.5, crop: 'Wheat', state: 'Tamil Nadu' };
  const benefits = matchGovernmentSchemes(farmerProfile);
  const deadlines = getUpcomingDeadlines();
  const protections = getProtectionRecords();
  const protectionExposure = calculateProtectionExposure({ baseProfit: 250000, profit: 130000 }, 80000);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
      <View style={{ padding: 20, paddingTop: 40, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <ArrowLeft color="#0f0f0f" size={24} />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: '#0f0f0f', marginBottom: 4 }}>Farm Financial Protection</Text>
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: '#555555' }}>Find potential benefits, stay protected, and never miss an important deadline.</Text>
      </View>

      <View style={{ padding: 20 }}>
        {/* 1. Government Benefit Radar */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 24, padding: 22, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Landmark color="#16a34a" size={24} style={{ marginRight: 12 }} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#0f0f0f' }}>Government Benefit Radar</Text>
          </View>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#555555', marginBottom: 16 }}>Potential benefits based on your farm profile</Text>
          
          {benefits.map(b => (
            <View key={b.schemeId} style={{ backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#0f0f0f', marginBottom: 4 }}>{b.schemeId === 'pm-kisan' ? 'PM-KISAN Samman Nidhi' : b.schemeId === 'nabard' ? 'NABARD Agri-Machinery' : 'PMFBY Crop Insurance'}</Text>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#16a34a' }}>{b.schemeId === 'pm-kisan' ? '₹6,000/year' : b.schemeId === 'nabard' ? 'Up to 40% subsidy' : 'Varies by crop'}</Text>
                </View>
                <View style={{ backgroundColor: b.matchStatus.includes('Missing') ? '#fee2e2' : b.matchStatus.includes('Potential') ? '#dcfce3' : '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: b.matchStatus.includes('Missing') ? '#b91c1c' : b.matchStatus.includes('Potential') ? '#15803d' : '#b45309' }}>{b.matchStatus}</Text>
                </View>
              </View>
              
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#555555', marginBottom: 8 }}>Why matched: {b.matchedCriteria.join(', ')}</Text>
              
                            {b.missingDocuments.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <AlertTriangle color="#ea580c" size={14} style={{ marginRight: 6 }} />
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#ea580c' }}>Missing: {b.missingDocuments.join(', ')}</Text>
                </View>
              )}
              
              <TouchableOpacity 
                onPress={() => Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent((b.schemeId === 'pm-kisan' ? 'PM-KISAN Samman Nidhi' : b.schemeId === 'nabard' ? 'NABARD Agri-Machinery' : 'PMFBY Crop Insurance') + ' official government scheme application India')}`)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4', paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0', marginTop: 'auto' }}
              >
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#16a34a', marginRight: 8 }}>SEARCH ON GOOGLE</Text>
                <ExternalLink color="#16a34a" size={14} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* 2. Protection Analyzer */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 24, padding: 22, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <ShieldCheck color="#3b82f6" size={24} style={{ marginRight: 12 }} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#0f0f0f' }}>Crop Risk & Protection Analyzer</Text>
          </View>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#555555', marginBottom: 16 }}>Estimated exposure based on simulation assumptions.</Text>

          <View style={{ backgroundColor: '#f0f9ff', padding: 16, borderRadius: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#0f0f0f' }}>Current crop investment</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#0f0f0f' }}>₹2,50,000</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#dc2626' }}>Potential severe-weather exposure</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#dc2626' }}>₹{protectionExposure.potentialExposure.toLocaleString('en-IN')}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#16a34a' }}>Current protection</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#16a34a' }}>₹{protectionExposure.existingCoverage.toLocaleString('en-IN')}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: '#bfdbfe', marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#ea580c' }}>Potential uncovered exposure</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#ea580c' }}>₹{protectionExposure.uncoveredExposure.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#0f0f0f', marginBottom: 12 }}>Protection Types</Text>
          {protections.map((p, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#0f0f0f' }}>{p.type}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {p.status.includes('Active') && <CheckCircle color="#16a34a" size={14} style={{ marginRight: 6 }} />}
                {p.status.includes('Needs') && <AlertTriangle color="#ea580c" size={14} style={{ marginRight: 6 }} />}
                {p.status.includes('Not') && <X color="#dc2626" size={14} style={{ marginRight: 6 }} />}
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: p.status.includes('Active') ? '#16a34a' : p.status.includes('Needs') ? '#ea580c' : '#dc2626' }}>{p.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* 3. Farm Money Calendar */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 24, padding: 22, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Calendar color="#0f0f0f" size={24} style={{ marginRight: 12 }} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#0f0f0f' }}>Farm Money Calendar</Text>
          </View>
          
          {deadlines.map(d => (
            <View key={d.id} style={{ flexDirection: 'row', marginBottom: 16 }}>
              <View style={{ width: 60, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#555555', textTransform: 'uppercase' }}>{d.date.split(' ')[0]}</Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#0f0f0f' }}>{d.date.split(' ')[1]}</Text>
              </View>
              <View style={{ width: 2, backgroundColor: d.status.includes('Urgent') ? '#e11d48' : d.status.includes('Upcoming') ? '#ea580c' : '#16a34a', marginHorizontal: 12, borderRadius: 1 }} />
              <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#0f0f0f', marginBottom: 2 }}>{d.title}</Text>
                {d.amount && <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#555555' }}>₹{d.amount.toLocaleString('en-IN')}</Text>}
                {d.daysRemaining && <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#e11d48', marginTop: 2 }}>{d.daysRemaining} days remaining</Text>}
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
