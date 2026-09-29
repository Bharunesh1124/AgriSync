import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Linking, Alert, ActivityIndicator } from 'react-native';
import { X, PhoneCall, Stethoscope, Sprout, ShieldAlert, Bug, MapPin, Share2, Volume2, AlertOctagon, HeartHandshake } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { speakText } from '../lib/speechHelper';
import { supabase } from '../lib/supabase';

interface KisaanSosModalProps {
  visible: boolean;
  onClose: () => void;
}

export const KisaanSosModal: React.FC<KisaanSosModalProps> = ({ visible, onClose }) => {
  const { i18n, t } = useTranslation();
  const isTa = i18n.language === 'ta';
  const [isLocating, setIsLocating] = useState(false);
  const [locationText, setLocationText] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const getGpsLocation = async () => {
    setIsLocating(true);
    const fallbackLat = 11.1271;
    const fallbackLng = 78.6569;

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return new Promise<{ lat: number; lng: number }>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const currentCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCoords(currentCoords);
            setLocationText(`Lat: ${currentCoords.lat.toFixed(4)}, Lng: ${currentCoords.lng.toFixed(4)}`);
            setIsLocating(false);
            resolve(currentCoords);
          },
          () => {
            const currentCoords = { lat: fallbackLat, lng: fallbackLng };
            setCoords(currentCoords);
            setLocationText(`Lat: ${fallbackLat}, Lng: ${fallbackLng}`);
            setIsLocating(false);
            resolve(currentCoords);
          },
          { timeout: 5000 }
        );
      });
    }

    const currentCoords = { lat: fallbackLat, lng: fallbackLng };
    setCoords(currentCoords);
    setLocationText(`Lat: ${fallbackLat}, Lng: ${fallbackLng}`);
    setIsLocating(false);
    return currentCoords;
  };

  const triggerCall = (phone: string, title: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call Failed', `Could not dial ${phone} directly. Please dial ${phone} on your phone.`);
    });
  };

  const shareEmergencyLocation = async (via: 'whatsapp' | 'sms') => {
    let currentCoords = coords;
    if (!currentCoords) {
      currentCoords = await getGpsLocation();
    }

    const mapsUrl = `https://maps.google.com/?q=${currentCoords.lat},${currentCoords.lng}`;
    const msg = isTa
      ? `🚨 அவசர உதவி தேவை! என் பண்ணை இடம்: ${mapsUrl}. தயவுசெய்து உடனடியாக தொடர்பு கொள்ளவும்!`
      : `🚨 KISAAN EMERGENCY SOS! Emergency at my farm! Location coordinates: ${mapsUrl}. Please send help immediately!`;

    if (via === 'whatsapp') {
      const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
      Linking.openURL(url).catch(() => {
        // Fallback to SMS if WhatsApp isn't available
        Linking.openURL(`sms:?body=${encodeURIComponent(msg)}`);
      });
    } else {
      Linking.openURL(`sms:?body=${encodeURIComponent(msg)}`);
    }
  };

  const [userRegion, setUserRegion] = useState<string>('Tamil Nadu');

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.location) {
        setUserRegion(user.user_metadata.location);
      }
    });
  }, []);

  const emergencyContacts = [
    {
      id: 'vet',
      title: isTa ? '👨‍⚕️ உள்ளூர் கால்நடை மருத்துவர் சேவை' : '👨‍⚕️ Local Veterinary Doctor',
      subtitle: isTa ? `கால்நடை அவசர மையம் (${userRegion})` : `Immediate Livestock Emergency (${userRegion} Regional Cell)`,
      phone: '1962',
      displayPhone: '1962 / National Animal SOS',
      icon: Stethoscope,
      bg: '#fee2e2',
      borderColor: '#fca5a5',
      accentColor: '#dc2626'
    },
    {
      id: 'kvk',
      title: isTa ? '🌾 மாவட்ட கிசான் சேவை மையம் (KVK)' : '🌾 Regional KVK Agri Officer Hotline',
      subtitle: isTa ? `மாவட்ட வேளாண் அதிகாரி நேரடி உதவி (${userRegion})` : `Krishi Vigyan Kendra Regional Officer (${userRegion})`,
      phone: '18001801551',
      displayPhone: '1800-180-1551 (Toll-Free)',
      icon: Sprout,
      bg: '#d1fae5',
      borderColor: '#6ee7b7',
      accentColor: '#059669'
    },
    {
      id: 'insurance',
      title: isTa ? '🛡️ பயிர் காப்பீடு அவசர மையம்' : '🛡️ Fasal Bima Crop Insurance Helpline',
      subtitle: isTa ? 'பயிர் இழப்பு அவசர அறிவிப்பு மையம்' : 'PMFBY Regional Loss Assessment Helpline',
      phone: '18002005142',
      displayPhone: '1800-200-5142 (Toll-Free)',
      icon: ShieldAlert,
      bg: '#e0f2fe',
      borderColor: '#7dd3fc',
      accentColor: '#0284c7'
    },
    {
      id: 'pest',
      title: isTa ? '🚨 பூச்சி / வெட்டுக்கிளி தடுப்பு பிரிவு' : '🚨 Regional Pest Control Emergency Cell',
      subtitle: isTa ? `திடீர் பூச்சி தாக்குதல் அவசர உதவி (${userRegion})` : `Epidemic Outbreak Support (${userRegion} District)`,
      phone: '18001801551',
      displayPhone: '1800-180-1551',
      icon: Bug,
      bg: '#fef3c7',
      borderColor: '#fde047',
      accentColor: '#d97706'
    }
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth: 480, backgroundColor: '#f0ece4', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' }}>
          
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#dc2626', padding: 10, borderRadius: 16, marginRight: 12 }}>
                <AlertOctagon color="#ffffff" size={24} />
              </View>
              <View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#dc2626' }}>
                  {isTa ? '🆘 கிசான் அவசர உதவி (SOS)' : '🆘 Kisaan Emergency SOS'}
                </Text>
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#555555' }}>
                  {isTa ? '1-தட்டு அவசர சேவை & இருப்பிட பகிர்வு' : '1-Tap Emergency Response & GPS Alert'}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity onPress={onClose} style={{ backgroundColor: '#ffffff', padding: 8, borderRadius: 9999 }}>
              <X color="#555555" size={20} />
            </TouchableOpacity>
          </View>

          {/* Voice Narration Button */}
          <TouchableOpacity 
            onPress={() => {
              const infoText = isTa 
                ? 'கிசான் அவசர உதவி மையம். கால்நடை அவசரத்திற்கு 1962 அல்லது பயிர் உதவிக்கு 1800 180 1551 அழைக்கவும்.'
                : 'Kisaan Emergency Helpline. Call 1962 for Livestock emergency or 1800 180 1551 for Agriculture officer.';
              speakText(infoText, isTa);
            }}
            style={{ backgroundColor: '#fee2e2', padding: 12, borderRadius: 16, marginBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#fca5a5' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Volume2 color="#dc2626" size={18} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#dc2626', marginLeft: 8 }}>
                {isTa ? '🔊 குரல் வழிகாட்டுதல் (Read Aloud)' : '🔊 Read Aloud Emergency Guide'}
              </Text>
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#dc2626', textTransform: 'uppercase' }}>
              {isTa ? 'அழுத்தவும்' : 'PLAY'}
            </Text>
          </TouchableOpacity>

          {/* GPS Location Alert Bar */}
          <View style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MapPin color="#dc2626" size={18} style={{ marginRight: 6 }} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#0f0f0f' }}>
                  {isTa ? 'பண்ணை இருப்பிடம் (GPS Coordinates)' : 'Farm GPS Coordinates'}
                </Text>
              </View>
              <TouchableOpacity onPress={getGpsLocation} disabled={isLocating} style={{ backgroundColor: '#f0ece4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 }}>
                {isLocating ? <ActivityIndicator size="small" color="#dc2626" /> : <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, color: '#dc2626' }}>{isTa ? 'புதுப்பி' : 'Refresh GPS'}</Text>}
              </TouchableOpacity>
            </View>

            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#555555', marginBottom: 12 }}>
              {locationText || (isTa ? 'இருப்பிடம் பெறப்படவில்லை (11.1271° N, 78.6569° E)' : 'GPS Ready: 11.1271° N, 78.6569° E')}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity 
                onPress={() => shareEmergencyLocation('whatsapp')}
                style={{ backgroundColor: '#25d366', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, flex: 1, marginRight: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                <Share2 color="#ffffff" size={16} style={{ marginRight: 6 }} />
                <Text style={{ color: '#ffffff', fontFamily: 'Inter_700Bold', fontSize: 12 }}>WhatsApp SOS</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => shareEmergencyLocation('sms')}
                style={{ backgroundColor: '#0284c7', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, flex: 1, marginLeft: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                <Share2 color="#ffffff" size={16} style={{ marginRight: 6 }} />
                <Text style={{ color: '#ffffff', fontFamily: 'Inter_700Bold', fontSize: 12 }}>SMS Location</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Emergency Hotline Buttons */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }} showsHorizontalScrollIndicator={false}>
            {emergencyContacts.map((contact) => (
              <View 
                key={contact.id}
                style={{ backgroundColor: contact.bg, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: contact.borderColor }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
                    <View style={{ backgroundColor: '#ffffff', padding: 10, borderRadius: 14, marginRight: 12 }}>
                      <contact.icon color={contact.accentColor} size={22} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#0f0f0f', marginBottom: 2 }}>{contact.title}</Text>
                      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: '#555555', marginBottom: 4 }}>{contact.subtitle}</Text>
                      <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 18, color: contact.accentColor }}>{contact.displayPhone}</Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    onPress={() => triggerCall(contact.phone, contact.title)}
                    style={{ backgroundColor: contact.accentColor, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, flexDirection: 'row', alignItems: 'center' }}
                  >
                    <PhoneCall color="#ffffff" size={16} style={{ marginRight: 6 }} />
                    <Text style={{ color: '#ffffff', fontFamily: 'Inter_700Bold', fontSize: 12 }}>
                      {isTa ? 'அழைக்க' : 'CALL'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
};
