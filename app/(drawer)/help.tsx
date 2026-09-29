import { View, Text, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { PhoneCall, Stethoscope, Sprout, ShieldAlert, Bug, MapPin, Share2, Volume2, LifeBuoy, HelpCircle, ChevronRight, AlertOctagon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { speakText } from '../../src/lib/speechHelper';
import { supabase } from '../../src/lib/supabase';

export default function HelpScreen() {
  const { i18n, t } = useTranslation();
  const isTa = i18n.language === 'ta';
  const [isLocating, setIsLocating] = useState(false);
  const [locationText, setLocationText] = useState<string | null>(null);
  const [userRegion, setUserRegion] = useState<string>('Tamil Nadu');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.location) {
        setUserRegion(user.user_metadata.location);
      }
    });
  }, []);

  const getGpsLocation = async () => {
    setIsLocating(true);
    const fallbackLat = 11.1271;
    const fallbackLng = 78.6569;

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise<{ lat: number; lng: number }>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setLocationText(`Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`);
            setIsLocating(false);
            resolve(coords);
          },
          () => {
            const coords = { lat: fallbackLat, lng: fallbackLng };
            setLocationText(`Lat: ${fallbackLat}, Lng: ${fallbackLng}`);
            setIsLocating(false);
            resolve(coords);
          },
          { timeout: 5000 }
        );
      });
    }

    const fallback = { lat: fallbackLat, lng: fallbackLng };
    setLocationText(`Lat: ${fallback.lat}, Lng: ${fallback.lng}`);
    setIsLocating(false);
    return fallback;
  };

  const shareEmergencyLocation = async (via: 'whatsapp' | 'sms') => {
    const coords = await getGpsLocation();
    const mapsUrl = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;
    const msg = isTa
      ? `🚨 அவசர உதவி தேவை! என் பண்ணை இருப்பிடம்: ${mapsUrl}. தயவுசெய்து தொடர்பு கொள்ளவும்!`
      : `🚨 KISAAN EMERGENCY SOS! Farm location coordinates: ${mapsUrl}. Please send emergency help!`;

    if (via === 'whatsapp') {
      Linking.openURL(`whatsapp://send?text=${encodeURIComponent(msg)}`).catch(() => {
        Linking.openURL(`sms:?body=${encodeURIComponent(msg)}`);
      });
    } else {
      Linking.openURL(`sms:?body=${encodeURIComponent(msg)}`);
    }
  };

  const emergencyContacts = [
    {
      id: 'vet',
      title: isTa ? '👨‍⚕️ உள்ளூர் கால்நடை மருத்துவர் சேவை' : '👨‍⚕️ Local Veterinary Doctor Hotline',
      desc: isTa ? `கால்நடை அவசர நோய் சிகிச்சை (${userRegion})` : `Direct emergency assistance for livestock (${userRegion} Regional Cell).`,
      phone: '1962',
      displayPhone: '1962 / National Animal SOS',
      bg: '#fee2e2',
      borderColor: '#fca5a5',
      accentColor: '#dc2626',
      icon: Stethoscope
    },
    {
      id: 'kvk',
      title: isTa ? '🌾 கிசான் அழைப்பு மையம் (KVK)' : '🌾 KVK Regional Officer Helpline',
      desc: isTa ? `மாவட்ட அரசு வேளாண் அதிகாரிகள் ஆலோசனை (${userRegion})` : `Talk directly to Krishi Vigyan Kendra agronomic scientists (${userRegion}).`,
      phone: '18001801551',
      displayPhone: '1800-180-1551 (Toll-Free)',
      bg: '#d1fae5',
      borderColor: '#6ee7b7',
      accentColor: '#059669',
      icon: Sprout
    },
    {
      id: 'insurance',
      title: isTa ? '🛡️ பிரதமர் பயிர் காப்பீடு மையம்' : '🛡️ PMFBY Crop Insurance Hotline',
      desc: isTa ? 'இயற்கை சீற்றத்தால் பயிர் சேதம் பதிவு செய்ய' : 'Report emergency crop damage for immediate insurance claims.',
      phone: '18002005142',
      displayPhone: '1800-200-5142',
      bg: '#e0f2fe',
      borderColor: '#7dd3fc',
      accentColor: '#0284c7',
      icon: ShieldAlert
    },
    {
      id: 'pest',
      title: isTa ? '🚨 பூச்சி / வெட்டுக்கிளி கட்டுப்பாடு' : '🚨 Regional Pest Control Emergency Cell',
      desc: isTa ? `திடீர் பூச்சித் தாக்குதல் அவசர உதவி (${userRegion})` : `Emergency advisory for sudden pest outbreaks (${userRegion}).`,
      phone: '18001801551',
      displayPhone: '1800-180-1551',
      bg: '#fef3c7',
      borderColor: '#fde047',
      accentColor: '#d97706',
      icon: Bug
    }
  ];

  return (
    <ScrollView className="flex-1 bg-[#f0ece4] pt-24 px-6 pb-12" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
      
      {/* Page Header */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontFamily: isTa ? 'Inter_700Bold' : 'BebasNeue_400Regular', fontSize: isTa ? 24 : 38, color: '#0f0f0f', letterSpacing: 0.5, lineHeight: isTa ? 30 : 42 }}>
          {isTa ? 'உதவி & அவசர சேவை (Help & SOS)' : 'HELP & EMERGENCY SOS'}
        </Text>
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#555555', marginTop: 4 }}>
          {isTa ? '1-தட்டு அவசர சேவை, இருப்பிட பகிர்வு & உதவி மையங்கள்' : '1-Tap Emergency Hotlines, GPS Location Alert & Helpline Support'}
        </Text>
      </View>

      {/* Voice Read Aloud Card */}
      <TouchableOpacity 
        onPress={() => {
          const info = isTa
            ? 'கிசான் அவசர உதவி பக்கம். கால்நடை அவசரத்திற்கு 1962 அல்லது பயிர் காப்பீட்டுக்கு 1800 200 5142 அழைக்கவும்.'
            : 'Help and Emergency SOS Page. Dial 1962 for Veterinary emergency or 1800 200 5142 for Crop Insurance helpline.';
          speakText(info, isTa);
        }}
        style={{ backgroundColor: '#fee2e2', padding: 16, borderRadius: 20, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#fca5a5' }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View style={{ backgroundColor: '#ffffff', padding: 8, borderRadius: 12, marginRight: 12 }}>
            <Volume2 color="#dc2626" size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#dc2626' }}>
              {isTa ? '🔊 குரல் வழிகாட்டல் (Read Aloud)' : '🔊 Read Aloud Emergency Guide'}
            </Text>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#555555' }}>
              {isTa ? 'அவசர வழிமுறைகளை கேட்க அழுத்தவும்' : 'Tap to hear voice emergency instructions'}
            </Text>
          </View>
        </View>
        <View style={{ backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 }}>
          <Text style={{ color: '#ffffff', fontFamily: 'Inter_700Bold', fontSize: 10, textTransform: 'uppercase' }}>PLAY</Text>
        </View>
      </TouchableOpacity>

      {/* GPS Location Broadcast Card */}
      <View style={{ backgroundColor: '#ffffff', borderRadius: 24, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fee2e2', padding: 8, borderRadius: 12, marginRight: 10 }}>
              <MapPin color="#dc2626" size={20} />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#0f0f0f' }}>
              {isTa ? 'அவசர பண்ணை இருப்பிடம் (GPS)' : 'Emergency Farm GPS Alert'}
            </Text>
          </View>
          <TouchableOpacity onPress={getGpsLocation} style={{ backgroundColor: '#f0ece4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#dc2626' }}>{isTa ? 'புதுப்பி' : 'Refresh'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#555555', marginBottom: 14 }}>
          {locationText || (isTa ? 'உங்கள் பண்ணை இருப்பிடம்: 11.1271° N, 78.6569° E' : 'GPS Coordinates: 11.1271° N, 78.6569° E')}
        </Text>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity 
            onPress={() => shareEmergencyLocation('whatsapp')}
            style={{ backgroundColor: '#25d366', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, flex: 1, marginRight: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
          >
            <Share2 color="#ffffff" size={16} style={{ marginRight: 6 }} />
            <Text style={{ color: '#ffffff', fontFamily: 'Inter_700Bold', fontSize: 13 }}>WhatsApp SOS</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => shareEmergencyLocation('sms')}
            style={{ backgroundColor: '#0284c7', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, flex: 1, marginLeft: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
          >
            <Share2 color="#ffffff" size={16} style={{ marginRight: 6 }} />
            <Text style={{ color: '#ffffff', fontFamily: 'Inter_700Bold', fontSize: 13 }}>SMS Location</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Emergency Hotlines Section */}
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#0f0f0f', marginBottom: 14, letterSpacing: 0.5 }}>
        {isTa ? '1-தட்டு அவசர அழைப்புகள் (Direct Hotlines)' : '1-Tap Emergency Hotlines'}
      </Text>

      {emergencyContacts.map((contact) => (
        <View 
          key={contact.id}
          style={{ backgroundColor: contact.bg, borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: contact.borderColor }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#0f0f0f', marginBottom: 2 }}>{contact.title}</Text>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#555555', lineHeight: 16 }}>{contact.desc}</Text>
            </View>
            <View style={{ backgroundColor: '#ffffff', padding: 10, borderRadius: 14 }}>
              <contact.icon color={contact.accentColor} size={22} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }}>
            <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 22, color: contact.accentColor }}>{contact.displayPhone}</Text>
            
            <TouchableOpacity 
              onPress={() => Linking.openURL(`tel:${contact.phone}`)}
              style={{ backgroundColor: contact.accentColor, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, flexDirection: 'row', alignItems: 'center' }}
            >
              <PhoneCall color="#ffffff" size={16} style={{ marginRight: 6 }} />
              <Text style={{ color: '#ffffff', fontFamily: 'Inter_700Bold', fontSize: 13 }}>
                {isTa ? 'அழைக்க' : 'CALL NOW'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
