import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Radio, Newspaper, TrendingUp, Landmark, MapPin, Volume2, Globe, ExternalLink } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { GlassCard } from '../../src/components/GlassCard';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { callAiJson } from '../../src/lib/aiProvider';

type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
};

const REGIONS = ['My Region', 'Tamil Nadu', 'National (India)', 'Karnataka', 'Andhra Pradesh', 'Maharashtra', 'Punjab'];

const REGION_LABELS: Record<string, { en: string; ta: string }> = {
  'My Region': { en: 'My Region', ta: 'என் மண்டலம்' },
  'Tamil Nadu': { en: 'Tamil Nadu', ta: 'தமிழ்நாடு' },
  'National (India)': { en: 'National (India)', ta: 'தேசியம் (இந்தியா)' },
  'Karnataka': { en: 'Karnataka', ta: 'கர்நாடகா' },
  'Andhra Pradesh': { en: 'Andhra Pradesh', ta: 'ஆந்திரப் பிரதேசம்' },
  'Maharashtra': { en: 'Maharashtra', ta: 'மகாராஷ்டிரா' },
  'Punjab': { en: 'Punjab', ta: 'பஞ்சாப்' },
};

const DISTRICT_TRANSLATIONS: Record<string, string> = {
  'Dindigul': 'திண்டுக்கல்',
  'Madurai': 'மதுரை',
  'Coimbatore': 'கோயம்புத்தூர்',
  'Chennai': 'சென்னை',
  'Tiruchirappalli': 'திருச்சிராப்பள்ளி',
  'Trichy': 'திருச்சி',
  'Salem': 'சேலம்',
  'Tirunelveli': 'திருநெல்வேலி',
  'Erode': 'ஈரோடு',
  'Vellore': 'வேலூர்',
  'Thanjavur': 'தஞ்சாவூர்',
  'Thoothukudi': 'தூத்துக்குடி',
  'Nagercoil': 'நாகர்கோவில்',
  'Kanyakumari': 'கன்னியாகுமரி',
  'Cuddalore': 'கடலூர்',
  'Kanchipuram': 'காஞ்சிபுரம்',
  'Dharmapuri': 'தர்மபுரி',
  'Krishnagiri': 'கிருஷ்ணகிரி',
  'Namakkal': 'நாமக்கல்',
  'Perambalur': 'பெரம்பலூர்',
  'Pudukkottai': 'புதுக்கோட்டை',
  'Ramanathapuram': 'இராமநாதபுரம்',
  'Sivaganga': 'சிவகங்கை',
  'Tenkasi': 'தென்காசி',
  'Theni': 'தேனி',
  'Thiruvallur': 'திருவள்ளூர்',
  'Thiruvarur': 'திருவாரூர்',
  'Tiruppur': 'திருப்பூர்',
  'Tirupattur': 'திருப்பத்தூர்',
  'Tiruvannamalai': 'திருவண்ணாமலை',
  'Nilgiris': 'நீலகிரி',
  'Viluppuram': 'விழுப்புரம்',
  'Virudhunagar': 'விருதுநகர்',
  'Tamil Nadu': 'தமிழ்நாடு',
};

function formatLocationText(loc: string, isTa: boolean): string {
  if (!isTa || !loc) return loc;
  let res = loc;
  Object.keys(DISTRICT_TRANSLATIONS).forEach((key) => {
    const reg = new RegExp(`\\b${key}\\b`, 'gi');
    res = res.replace(reg, DISTRICT_TRANSLATIONS[key]);
  });
  return res;
}

async function translateTitlesToTamil(titles: string[]): Promise<string[]> {
  if (titles.length === 0) return [];

  // 1. Attempt AI Translation via callAiJson
  try {
    const prompt = `Translate these agricultural news headlines perfectly into Tamil. MANDATORY: Output ONLY a JSON object with a single key "translatedNews" containing an array of strings. Headlines: ${JSON.stringify(titles)}`;
    const fallback = { translatedNews: [] };
    const aiResponse = await callAiJson<{ translatedNews: string[] }>(prompt, fallback, false);
    if (aiResponse.translatedNews && aiResponse.translatedNews.length === titles.length) {
      const hasTamil = aiResponse.translatedNews.some(t => /[\u0B80-\u0BFF]/.test(t));
      if (hasTamil) {
        return aiResponse.translatedNews;
      }
    }
  } catch (e) {
    console.warn("AI translation failed, using MyMemory fallback", e);
  }

  // 2. Guaranteed MyMemory API Fallback
  try {
    const translated = await Promise.all(
      titles.map(async (t) => {
        try {
          const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=en|ta`);
          const data = await res.json();
          if (data?.responseData?.translatedText) {
            return data.responseData.translatedText;
          }
        } catch (err) {}
        return t;
      })
    );
    return translated;
  } catch (err) {
    console.warn("MyMemory translation failed", err);
    return titles;
  }
}

export default function NewsScreen() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';
  
  const [activeRegion, setActiveRegion] = useState('My Region');
  const [userState, setUserState] = useState('Tamil Nadu'); // Default fallback
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    if (user?.user_metadata?.location) {
      setUserState(user.user_metadata.location);
    }
  }, [user]);

  useEffect(() => {
    fetchNews(activeRegion);
  }, [activeRegion, userState, i18n.language]);

  const fetchNews = async (regionTab: string) => {
    setIsLoading(true);
    try {
      let searchQuery = 'agriculture OR farmers OR market price OR weather';
      if (regionTab === 'My Region') {
        searchQuery = `${userState} ${searchQuery}`;
      } else if (regionTab === 'National (India)') {
        searchQuery = `India ${searchQuery}`;
      } else {
        searchQuery = `${regionTab} ${searchQuery}`;
      }

      const encodedSearch = encodeURIComponent(searchQuery);
      const rssUrl = `https://news.google.com/rss/search?q=${encodedSearch}&hl=en-IN&gl=IN&ceid=IN:en`;
      const encodedRssUrl = encodeURIComponent(rssUrl);
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodedRssUrl}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status === 'ok' && data.items) {
        let formattedNews: NewsItem[] = data.items.slice(0, 15).map((item: any) => {
          const titleParts = item.title.split(' - ');
          const source = titleParts.length > 1 ? titleParts.pop() : 'News Source';
          const cleanTitle = titleParts.join(' - ');
          
          return {
            title: cleanTitle,
            link: item.link,
            pubDate: new Date(item.pubDate).toLocaleDateString(isTa ? 'ta-IN' : 'en-US'),
            source: source
          };
        });

        // Translate headlines into Tamil if Tamil is selected
        if (i18n.language === 'ta') {
          const titles = formattedNews.map((n) => n.title);
          const translatedTitles = await translateTitlesToTamil(titles);
          
          if (translatedTitles && translatedTitles.length === formattedNews.length) {
            formattedNews = formattedNews.map((item, index) => ({
              ...item,
              title: translatedTitles[index]
            }));
          }
        }

        setNews(formattedNews);
      }
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const playBroadcast = async () => {
    if (isBroadcasting) {
      Speech.stop();
      setIsBroadcasting(false);
      return;
    }

    if (news.length === 0) return;
    setIsBroadcasting(true);

    try {
      const topHeadlines = news.slice(0, 4).map(n => n.title).join(". ");
      const targetLang = isTa ? 'Tamil' : 'English';
      
      const prompt = `Act as an agricultural radio broadcaster. Summarize these real news headlines into a smooth, 3-sentence radio broadcast script. 
      Headlines: ${topHeadlines}. 
      MANDATORY: Output ONLY a JSON object with a single key "script" containing the broadcast text translated perfectly into ${targetLang}.`;

      let broadcastScript = isTa 
        ? `இன்றைய முக்கிய வேளாண் செய்திகள்: ${topHeadlines}`
        : `Here are the top headlines. ${topHeadlines}`;

      try {
        const aiResponse = await callAiJson<{ script: string }>(prompt, { script: '' }, false);
        if (aiResponse.script && (isTa ? /[\u0B80-\u0BFF]/.test(aiResponse.script) : true)) {
          broadcastScript = aiResponse.script;
        } else if (isTa) {
          const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(topHeadlines.substring(0, 300))}&langpair=en|ta`);
          const data = await res.json();
          if (data?.responseData?.translatedText) {
            broadcastScript = `இன்றைய முக்கிய செய்திகள்: ${data.responseData.translatedText}`;
          }
        }
      } catch (e) {
        console.warn("AI Broadcast failed:", e);
      }

      const langCode = isTa ? 'ta-IN' : 'en-IN';
      
      Speech.speak(broadcastScript, {
        language: langCode,
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsBroadcasting(false),
        onStopped: () => setIsBroadcasting(false),
        onError: () => setIsBroadcasting(false)
      });
    } catch (e) {
      console.error("Broadcast failed:", e);
      setIsBroadcasting(false);
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const displayLocation = formatLocationText(userState, isTa);

  return (
    <View className="flex-1 bg-farm-sand">
      {/* Header */}
      <View className="px-6 pt-12 pb-4 bg-white rounded-b-3xl shadow-sm z-10">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className={`${isTa ? 'font-bold text-2xl' : 'font-bebas text-4xl'} text-ink`}>
              {isTa ? 'வேளாண் செய்திகள்' : 'Agri-News'}
            </Text>
            <Text className="text-ink-muted font-bold text-sm">
              {isTa ? 'நேரடி சந்தை & மண்டல செய்திகள்' : 'Live Market & Regional Updates'}
            </Text>
          </View>
          <View className="bg-farm-green/10 p-3 rounded-full">
            <Radio color="#10b981" size={28} />
          </View>
        </View>

        {/* AI Radio Button */}
        <TouchableOpacity 
          onPress={playBroadcast}
          className={`flex-row items-center justify-center py-3 px-4 rounded-xl mb-2 ${isBroadcasting ? 'bg-red-500' : 'bg-farm-green'}`}
        >
          <Volume2 color="#fff" size={20} className="mr-2" />
          <Text className="text-white font-bold text-sm">
            {isBroadcasting 
              ? (isTa ? 'ஒலிபரப்பை நிறுத்து' : 'Stop Broadcast')
              : (isTa 
                  ? `AI வானொலி ஒலிபரப்பு (${activeRegion === 'My Region' ? displayLocation : (REGION_LABELS[activeRegion]?.ta || activeRegion)})`
                  : `Play AI Broadcast (${activeRegion === 'My Region' ? userState : activeRegion})`)}
          </Text>
        </TouchableOpacity>

        {/* Region Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2" showsVerticalScrollIndicator={false}>
          {REGIONS.map(region => {
            const isActive = activeRegion === region;
            const regionName = region === 'My Region' 
              ? (isTa ? displayLocation : userState) 
              : (isTa ? (REGION_LABELS[region]?.ta || region) : region);

            return (
              <TouchableOpacity
                key={region}
                onPress={() => setActiveRegion(region)}
                className={`px-4 py-2 rounded-full mr-2 border ${isActive ? 'bg-ink border-ink' : 'bg-white border-gray-200'}`}
              >
                <View className="flex-row items-center">
                  {region === 'My Region' ? (
                    <MapPin color={isActive ? '#fff' : '#64748b'} size={14} style={{marginRight: 4}} />
                  ) : region === 'National (India)' ? (
                    <Globe color={isActive ? '#fff' : '#64748b'} size={14} style={{marginRight: 4}} />
                  ) : null}
                  <Text className={`font-bold text-xs ${isActive ? 'text-white' : 'text-ink-muted'}`}>
                    {regionName}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* News Feed */}
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#10b981" />
            <Text className="text-ink-muted font-bold mt-4">
              {isTa ? 'நேரடி செய்திகளைப் பெறுகிறது...' : 'Fetching live news...'}
            </Text>
          </View>
        ) : news.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <Newspaper color="#94a3b8" size={48} />
            <Text className="text-ink-muted font-bold mt-4">
              {isTa ? 'இந்த மண்டலத்திற்கு சமீபத்திய செய்திகள் எதுவும் இல்லை.' : 'No recent news found for this region.'}
            </Text>
          </View>
        ) : (
          <View className="pb-12">
            {news.map((item, index) => (
              <GlassCard key={index} className="p-4 mb-4 border-l-4 border-farm-green">
                <TouchableOpacity onPress={() => openLink(item.link)}>
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-[10px] font-bold text-farm-green uppercase bg-farm-green/10 px-2 py-1 rounded-md">
                      {item.source}
                    </Text>
                    <Text className="text-[10px] font-bold text-ink-muted">{item.pubDate}</Text>
                  </View>
                  <Text className="font-bold text-ink text-sm leading-5 mb-3">
                    {item.title}
                  </Text>
                  <View className="flex-row items-center">
                    <ExternalLink color="#64748b" size={12} />
                    <Text className="text-xs font-bold text-ink-muted ml-1">
                      {isTa ? 'முழு கட்டுரையைப் படிக்கவும்' : 'Read full article'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </GlassCard>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
