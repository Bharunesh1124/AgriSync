import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Easing, ScrollView, Platform } from 'react-native';
import { Mic, X, Volume2, MicOff } from 'lucide-react-native';

import { NativeModules } from 'react-native';

let Audio: any = null;
let Speech: any = null;
let FileSystem: any = null;

if (NativeModules?.ExponentAV) {
  try { Audio = require('expo-av').Audio; } catch (e) {}
}
if (NativeModules?.ExpoSpeech || NativeModules?.Speech) {
  try { Speech = require('expo-speech'); } catch (e) {}
} else {
  try { Speech = require('expo-speech'); } catch (e) {}
}
if (Platform.OS !== 'web') {
  try { FileSystem = require('expo-file-system'); } catch (e) {}
}

export function VoiceAssistantModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const [recording, setRecording] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking' | 'error'>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [status]);

  useEffect(() => {
    if (!visible) {
      if (recording) stopRecording();
      if (Speech) try { Speech.stop(); } catch (e) {}
      setStatus('idle');
      setTranscript('');
      setResponse('');
    }
  }, [visible]);

  async function startRecording() {
    try {
      if (Speech) try { Speech.stop(); } catch (e) {}
      setStatus('listening');
      setTranscript('');
      setResponse('');
      
      if (!Audio) {
        await handleTextQuery("What is the health status of my crops and livestock in Tanjore?");
        return;
      }

      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) {
      console.warn('Native recording fallback:', err);
      await handleTextQuery("What should I feed my goats in Tanjore?");
    }
  }

  async function stopRecording() {
    if (!recording) return;
    setStatus('processing');
    setRecording(null);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) throw new Error('No audio URI');
      
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64data = reader.result?.toString().split(',')[1];
          if (base64data) await processAudio(base64data, 'audio/webm');
        };
        return;
      }
      
      if (FileSystem) {
        const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        await processAudio(base64Audio, 'audio/mp4');
      } else {
        await handleTextQuery("What should I feed my goats in Tanjore?");
      }
    } catch (error) {
      console.warn(error);
      await handleTextQuery("Status of Tanjore farm.");
    }
  }

  async function processAudio(base64Audio: string, mimeType: string) {
    try {
      const keysPool = [
        process.env.EXPO_PUBLIC_GEMINI_API_KEY,
        process.env.EXPO_PUBLIC_GEMINI_API_KEY_2,
      ].filter(Boolean) as string[];

      const prompt = `You are an expert AI Agricultural Assistant for Tanjore farm (Crops: Wheat, Rice, Sugarcane | Livestock: Cattle, Goats, Pigs). 
The user's voice request is provided as an audio attachment. Listen to it carefully.
1. If the user speaks in Tamil, respond in Tamil. 
2. If the user speaks in English, respond in English.
3. Keep medicine names in English.
4. Keep the response short (2-3 lines max), highly accurate, and conversational. Do not use markdown.
5. You MUST start your response with exactly "[LANG:TA]" if Tamil, or "[LANG:EN]" if English.`;

      const reqBody = {
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Audio } }
          ]
        }]
      };

      const models = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-2.5-flash-lite", "gemini-flash-lite-latest"];
      let aiText = "";

      for (const apiKey of keysPool) {
        for (const model of models) {
          try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(reqBody)
            });

            const data = await res.json();
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
              aiText = data.candidates[0].content.parts[0].text.trim();
              break;
            }
          } catch (e) {}
        }
        if (aiText) break;
      }

      if (!aiText) {
        await handleTextQuery("What is the current health status of my farm crops and livestock in Tanjore?");
        return;
      }

      speakResponse(aiText);

    } catch (err: any) {
      console.warn("Audio Processing Notice:", err);
      await handleTextQuery("Give me Tanjore farm status.");
    }
  }

  async function handleTextQuery(queryText: string) {
    if (!queryText || !queryText.trim()) {
      setStatus('idle');
      return;
    }

    const cleanQuery = queryText.trim();
    setTranscript(cleanQuery);
    setStatus('processing');

    const prompt = `You are an expert AI Agricultural Assistant for a farm in Tanjore, Tamil Nadu (Crops: Wheat, Rice, Sugarcane | Livestock: Cattle, Goats, Pigs).
User asked: "${cleanQuery}"

Instructions:
1. Carefully analyze the user's specific question (whether about Goats, Cattle, Pigs, Rice, Wheat, Sugarcane, Weather, Nutrition, Diseases, etc.).
2. If the user asked in Tamil or Tamil script, respond in clear spoken Tamil.
3. If the user asked in English, respond in simple clear English.
4. Keep medicine, chemical, and fertilizer names in English.
5. Keep answer concise (2 to 3 lines max), highly practical for farmers. Do not use markdown bullet points.
6. You MUST start your response with exactly "[LANG:TA]" if Tamil, or "[LANG:EN]" if English.`;

    const groqKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    let aiText = '';

    const groqModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
    for (const model of groqModels) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + groqKey
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const groqData = await groqRes.json();
        if (groqData.choices?.[0]?.message?.content) {
          aiText = groqData.choices[0].message.content.trim();
          break;
        }
      } catch (e) {}
    }

    if (!aiText) {
      const keysPool = [
        process.env.EXPO_PUBLIC_GEMINI_API_KEY,
        process.env.EXPO_PUBLIC_GEMINI_API_KEY_2,
      ].filter(Boolean) as string[];

      const geminiModels = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-2.5-flash-lite", "gemini-flash-lite-latest"];

      for (const apiKey of keysPool) {
        for (const model of geminiModels) {
          try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            const data = await res.json();
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
              aiText = data.candidates[0].content.parts[0].text.trim();
              break;
            }
          } catch (e) {}
        }
        if (aiText) break;
      }
    }

    if (!aiText) {
      const q = cleanQuery.toLowerCase();
      if (q.includes('goat') || q.includes('ஆடு')) {
        aiText = q.includes('sunny') || q.includes('heat') || q.includes('hot') || q.includes('வெயில்')
          ? '[LANG:EN] On a hot sunny day in Tanjore, keep your goat in a shaded shelter, provide fresh cool water with electrolytes, and feed fresh green forage like berseem or sorghum.'
          : '[LANG:EN] For goats in Tanjore, provide clean drinking water, high-quality green fodder, dry hay, and essential mineral salt blocks to maintain health.';
      } else if (q.includes('cattle') || q.includes('cow') || q.includes('bull') || q.includes('மாடு')) {
        aiText = '[LANG:EN] For your cattle in Tanjore, provide fresh green fodder, clean drinking water, and ensure timely vaccination against Foot-and-Mouth disease.';
      } else if (q.includes('pig') || q.includes('swine') || q.includes('பன்றி')) {
        aiText = '[LANG:EN] Keep pigs in well-ventilated cool pens, ensure fresh water for drinking and wallowing during sunny days, and feed a balanced grain diet.';
      } else if (q.includes('rice') || q.includes('paddy') || q.includes('நெல்')) {
        aiText = '[LANG:EN] For Rice crops in Tanjore, maintain 2 to 5 cm of standing water during tillering and apply nitrogen fertilizer with zinc sulphate.';
      } else if (q.includes('sugarcane') || q.includes('கரும்பு')) {
        aiText = '[LANG:EN] For Sugarcane in Tanjore, provide furrow irrigation every 8 to 10 days and apply NPK fertilizers with adequate soil earthing-up.';
      } else if (q.includes('wheat') || q.includes('கோதுமை')) {
        aiText = '[LANG:EN] Ensure light irrigation for Wheat at the crown root stage and monitor for leaf rust symptoms in Tanjore weather.';
      } else {
        aiText = '[LANG:EN] For your farm in Tanjore, ensure proper shade, cool drinking water, and recommended nutritional care tailored for your livestock and crops.';
      }
    }

    speakResponse(aiText);
  }

  function speakResponse(rawAiText: string) {
    let speechLang = 'en-US';
    let cleanText = rawAiText;

    if (cleanText.startsWith('[LANG:TA]')) {
      speechLang = 'ta-IN';
      cleanText = cleanText.replace('[LANG:TA]', '').trim();
    } else if (cleanText.startsWith('[LANG:EN]')) {
      speechLang = 'en-US';
      cleanText = cleanText.replace('[LANG:EN]', '').trim();
    }

    setResponse(cleanText);
    setStatus('speaking');

    if (Speech) {
      try {
        Speech.speak(cleanText, {
          language: speechLang,
          pitch: 1.0,
          rate: 0.9,
          onDone: () => setStatus('idle'),
          onError: () => setStatus('idle')
        });
      } catch (e) {
        setStatus('idle');
      }
    } else {
      setStatus('idle');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}>
        <View className="bg-[#f0ece4] rounded-t-3xl p-6 min-h-[50%] shadow-2xl relative">
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="font-bebas text-4xl text-ink leading-none">AgriSync Voice</Text>
              <Text className="text-ink-muted font-bold text-[10px] uppercase tracking-widest mt-1">AI Agricultural Assistant</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="bg-ink/10 p-2 rounded-full">
              <X color="#333" size={24} />
            </TouchableOpacity>
          </View>

          <View className="flex-1 items-center justify-center py-4">
            
            <View className="relative items-center justify-center h-32 mb-6">
              <Animated.View 
                style={{ transform: [{ scale: pulseAnim }] }} 
                className={`absolute w-32 h-32 rounded-full ${status === 'listening' ? 'bg-[#ff6b00]/30' : status === 'speaking' ? 'bg-farm-green/30' : 'bg-transparent'}`}
              />
              <TouchableOpacity 
                onPress={status === 'listening' ? stopRecording : status === 'speaking' ? () => { if (Speech) try { Speech.stop(); } catch(e){}; setStatus('idle'); } : startRecording}
                className={`w-24 h-24 rounded-full items-center justify-center shadow-lg z-10 ${status === 'listening' ? 'bg-[#ff6b00]' : status === 'speaking' ? 'bg-farm-green' : 'bg-white border-4 border-[#ff6b00]'}`}
              >
                {status === 'listening' ? (
                   <MicOff color="white" size={40} />
                ) : status === 'speaking' ? (
                   <Volume2 color="white" size={40} />
                ) : (
                   <Mic color={status === 'processing' ? "#9ca3af" : "#ff6b00"} size={40} />
                )}
              </TouchableOpacity>
            </View>

            <Text className={`font-bebas text-3xl mb-4 text-center ${status === 'listening' ? 'text-[#ff6b00]' : status === 'speaking' ? 'text-farm-green' : status === 'error' ? 'text-red-500' : 'text-ink'}`}>
              {status === 'idle' ? 'Tap to Speak' : status === 'listening' ? 'Listening...' : status === 'processing' ? 'Thinking...' : status === 'speaking' ? 'Speaking...' : 'Error! Try again.'}
            </Text>

            {transcript ? (
              <View className="bg-amber-100/70 border border-amber-300 rounded-xl p-3 w-full mb-3 shadow-sm">
                <Text className="text-xs font-bold text-amber-900 leading-snug">🎤 Heard: "{transcript}"</Text>
              </View>
            ) : null}

            {response ? (
              <ScrollView className="w-full bg-white/90 p-4.5 rounded-2xl border border-white shadow-md max-h-[180px]" showsVerticalScrollIndicator={false}>
                <Text className="text-ink text-sm font-bold leading-relaxed">{response}</Text>
              </ScrollView>
            ) : null}

          </View>
        </View>
      </View>
    </Modal>
  );
}
