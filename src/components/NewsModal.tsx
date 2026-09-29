import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { X, AlertTriangle, CloudRain, DollarSign, Bug, Volume2 } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { GlassCard } from './GlassCard';
import { useTranslation } from 'react-i18next';
import { callAiJson } from '../lib/aiProvider';

interface NewsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NewsModal = ({ visible, onClose }: NewsModalProps) => {
  const { i18n } = useTranslation();
  const isTamil = i18n.language === 'ta';
  const [broadcastNews, setBroadcastNews] = useState<any[]>([]);
  const [isFetchingNews, setIsFetchingNews] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      fetchBroadcast();
    }
  }, [visible, i18n.language]);

  const fetchBroadcast = async () => {
    setIsFetchingNews(true);
    setNewsError(null);

    const targetLanguage = isTamil ? 'Tamil' : 'English';
    const today = new Date().toLocaleDateString(isTamil ? 'ta-IN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const prompt = `Act as an agricultural news aggregator. Today's date is ${today}. Generate a daily farm broadcast with exactly 3 news items. One must be a Weather anomaly, one a Regional Disease Alert, and one a Market Price update. 
    MANDATORY: Generate all text values (title, description) strictly in ${targetLanguage}.
    Return strictly JSON data matching exactly this schema (an array of objects): [{"id": "1", "type": "Weather" | "Disease" | "Market", "title": "string", "description": "string (2 sentences)", "severity": "High" | "Medium" | "Low"}]. Do not use markdown blocks, return only raw JSON array.`;

    const fallbackNews = isTamil ? [
      {
        id: '1',
        type: 'Weather',
        title: 'பருவகால மழை மற்றும் வெப்பநிலை எச்சரிக்கை',
        description: 'தென்மேற்கு பருவமழை தீவிரமடைந்துள்ளது. பயிர்களுக்கு தகுந்த நீர் வடிகால் வசதி செய்ய வேளாண் துறை அறிவுறுத்தியுள்ளது.',
        severity: 'High'
      },
      {
        id: '2',
        type: 'Disease',
        title: 'கால்நடை தோல் கழலை நோய் தடுப்பு முகாம்',
        description: 'அருகிலுள்ள கிராமங்களில் தடுப்பூசி முகாம் நடைபெறுகிறது. கால்நடைகளை பாதுகாப்பாக வைத்திருக்கவும்.',
        severity: 'Medium'
      },
      {
        id: '3',
        type: 'Market',
        title: 'நெல் மற்றும் தானியங்கள் சந்தை விலை உயர்வு',
        description: 'சந்தைகளில் தானியங்களின் தேவை அதிகரித்துள்ளதால் நேர்மறையான விலை வர்த்தகம் பதிவாகியுள்ளது.',
        severity: 'Low'
      }
    ] : [
      {
        id: '1',
        type: 'Weather',
        title: 'Unseasonal Regional Weather Front Alert',
        description: 'Monsoon weather variation detected across agricultural zones. Ensure proper field drainage for standing crops.',
        severity: 'High'
      },
      {
        id: '2',
        type: 'Disease',
        title: 'Regional Bio-Security Advisory',
        description: 'Preventative health measures advised for livestock and poultry in neighbouring mandals.',
        severity: 'Medium'
      },
      {
        id: '3',
        type: 'Market',
        title: 'Mandi Grain & Pulse Trading Uptick',
        description: 'Strong demand in regional wholesale markets leading to favorable commodity price trends.',
        severity: 'Low'
      }
    ];

    try {
      const data = await callAiJson<any[]>(prompt, fallbackNews, true);
      setBroadcastNews(data);
    } catch (err: any) {
      setBroadcastNews(fallbackNews);
    } finally {
      setIsFetchingNews(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60 items-center">
        <View className="bg-[#f0ece4] h-[85%] rounded-t-[32px] shadow-2xl w-full max-w-[480px]">
          
          {/* Header */}
          <View className="flex-row justify-between items-center p-6 border-b border-ink/5">
            <View className="flex-row items-center">
              <AlertTriangle color="#ef4444" size={24} />
              <Text className="font-inter font-bold text-2xl text-[#1a1a24] ml-3">
                {isTamil ? 'தினசரி பண்ணை ஒலிபரப்பு' : 'Daily Farm Broadcast'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="bg-[#e2dfd8] p-2 rounded-full shadow-sm">
              <X color="#666" size={20} />
            </TouchableOpacity>
          </View>

          {/* News Feed */}
          <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
            <Text className="text-ink-muted font-bold uppercase tracking-widest text-xs mb-6 text-center">
              {isTamil ? 'நேரடி AI வேளாண் செய்தித் தொகுப்பு' : 'Live AI Agronomy Feed'} • {new Date().toLocaleDateString(isTamil ? 'ta-IN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>

            {isFetchingNews ? (
              <View className="items-center justify-center py-20">
                <ActivityIndicator size="large" color="#1a1a24" />
                <Text className="font-bold text-ink mt-4">
                  {isTamil ? 'பிராந்திய ஒலிபரப்பில் இணைகிறது...' : 'Tuning into regional broadcast...'}
                </Text>
                <Text className="text-ink-muted text-xs mt-1">
                  {isTamil ? 'AI மூலம் நேரடி வேளாண் அறிக்கையை உருவாக்குகிறது' : 'Generating live agronomy report via AI'}
                </Text>
              </View>
            ) : newsError ? (
              <View className="bg-red-100 p-5 rounded-2xl border border-red-300">
                <Text className="text-red-700 font-bold">
                  {isTamil ? 'சிக்னல் துண்டிக்கப்பட்டது:' : 'Signal Lost:'} {newsError}
                </Text>
                <TouchableOpacity onPress={fetchBroadcast} className="mt-4 bg-red-600 py-2 px-4 rounded-xl self-start">
                  <Text className="text-white font-bold">
                    {isTamil ? 'மீண்டும் முயல்க' : 'Retry Connection'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="pb-10">
                {broadcastNews.map((news, index) => {
                  const isHigh = news.severity === 'High';
                  const isMedium = news.severity === 'Medium';
                  const Icon = news.type === 'Weather' ? CloudRain : news.type === 'Market' ? DollarSign : Bug;
                  const color = news.type === 'Weather' ? '#3b82f6' : news.type === 'Market' ? '#10b981' : '#ef4444';
                  const bgColorClass = news.type === 'Weather' ? 'bg-blue-500/10 border-blue-500/20' : news.type === 'Market' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20';
                  const badgeClass = isHigh ? 'bg-red-500' : isMedium ? 'bg-orange-500' : 'bg-blue-500';

                  const typeLabel = isTamil
                    ? (news.type === 'Weather' ? 'வானிலை புதுப்பிப்பு' : news.type === 'Market' ? 'சந்தை புதுப்பிப்பு' : 'நோய் எச்சரிக்கை')
                    : `${news.type} Update`;

                  const severityLabel = isTamil
                    ? (isHigh ? 'உயர் முன்னுரிமை' : isMedium ? 'நடுத்தர முன்னுரிமை' : 'குறைந்த முன்னுரிமை')
                    : `${news.severity} Priority`;

                  return (
                    <GlassCard key={news.id || index.toString()} delay={index * 150} className={`p-5 mb-4 ${bgColorClass}`}>
                      <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-row items-center bg-white/50 px-3 py-1.5 rounded-full border border-white">
                          <Icon color={color} size={16} />
                          <Text className="font-bold text-[11px] ml-2 uppercase tracking-widest text-ink">{typeLabel}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <View className={`${badgeClass} px-2 py-1 rounded-md mr-2`}>
                            <Text className="text-white text-[10px] font-bold uppercase tracking-widest">{severityLabel}</Text>
                          </View>
                          <TouchableOpacity 
                            onPress={() => {
                              Speech.stop();
                              Speech.speak(`${news.title}. ${news.description}`, { language: i18n.language === 'ta' ? 'ta-IN' : 'en-US', pitch: 1.0, rate: 0.9 });
                            }}
                            style={{ backgroundColor: '#ffffff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999, flexDirection: 'row', alignItems: 'center' }}
                          >
                            <Volume2 color="#0f0f0f" size={12} />
                            <Text style={{ color: '#0f0f0f', fontSize: 10, fontFamily: 'Inter_700Bold', marginLeft: 4 }}>
                              {isTamil ? 'வாசித்துக் கேள்' : 'Read Aloud'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text className="font-bebas text-2xl text-ink leading-tight mb-2">{news.title}</Text>
                      <Text className="text-ink-muted text-sm leading-relaxed font-medium">{news.description}</Text>
                    </GlassCard>
                  );
                })}
              </View>
            )}
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
};
