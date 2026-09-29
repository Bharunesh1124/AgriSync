import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Easing, ScrollView } from 'react-native';
import { Mic, X, Volume2, MicOff } from 'lucide-react-native';

let Speech: any = null;
try {
  Speech = require('expo-speech');
} catch (e) {}

export function VoiceAssistantModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking' | 'error'>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 700, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [status]);

  useEffect(() => {
    if (!visible) {
      stopRecording();
      if (Speech) try { Speech.stop(); } catch (e) {}
      setStatus('idle');
      setTranscript('');
      setResponse('');
    }
  }, [visible]);

  function startRecording() {
    if (Speech) try { Speech.stop(); } catch (e) {}
    setStatus('listening');
    setTranscript('');
    setResponse('');
    audioChunksRef.current = [];

    const SpeechRecognition = typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (SpeechRecognition) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch (e) {}
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = true;
        
        const userLang = typeof navigator !== 'undefined' ? (navigator.language || 'en-US') : 'en-US';
        recognition.lang = userLang.includes('ta') ? 'ta-IN' : 'en-US';

        let finalTranscriptText = '';

        recognition.onresult = (event: any) => {
          let currentText = '';
          for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          if (currentText) {
            finalTranscriptText = currentText;
            setTranscript(currentText);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('[Voice Assistant Web] Speech recognition warning:', event.error);
          if (!finalTranscriptText) {
            fallbackToMediaRecorder();
          }
        };

        recognition.onend = () => {
          if (finalTranscriptText && finalTranscriptText.trim().length > 0) {
            handleTextQuery(finalTranscriptText);
          } else {
            fallbackToMediaRecorder();
          }
        };

        recognition.start();
        return;
      } catch (err) {
        console.warn('[Voice Assistant Web] SpeechRecognition start failed, falling back:', err);
      }
    }

    fallbackToMediaRecorder();
  }

  async function fallbackToMediaRecorder() {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        setStatus('error');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result?.toString().split(',')[1];
          if (base64data) {
            await processAudioBlob(base64data);
          } else if (transcript) {
            await handleTextQuery(transcript);
          } else {
            setStatus('idle');
          }
        };
      };

      mediaRecorder.start();
    } catch (err) {
      console.error('[Voice Assistant Web] Mic error:', err);
      setStatus('error');
    }
  }

  function stopRecording() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track: any) => track.stop());
      } catch (e) {}
    }
  }

  async function processAudioBlob(base64Audio: string) {
    setStatus('processing');
    const prompt = 'Listen to the user voice message. Answer precisely for a Tanjore farm (Crops: Wheat, Rice, Sugarcane | Livestock: Cattle, Goats, Pigs). If in Tamil, respond in Tamil. Prefix with [LANG:TA] or [LANG:EN].';

    const keysPool = [
      process.env.EXPO_PUBLIC_GEMINI_API_KEY,
      process.env.EXPO_PUBLIC_GEMINI_API_KEY_2,
    ].filter(Boolean) as string[];

    const models = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-lite-latest'];
    let aiText = '';

    for (const apiKey of keysPool) {
      for (const model of models) {
        try {
          const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: 'audio/webm', data: base64Audio } }
                ]
              }]
            })
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

    if (aiText) {
      speakResponse(aiText);
    } else {
      await handleTextQuery(transcript || 'What should I feed my goats and cattle in Tanjore?');
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
4. Keep medicine and chemical names in English.
5. Keep answer short and direct (2 to 3 sentences max), highly practical for farmers. Do NOT use markdown formatting or bullet points.
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

      const geminiModels = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-lite-latest'];

      for (const apiKey of keysPool) {
        for (const model of geminiModels) {
          try {
            const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey, {
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
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View className="bg-[#f0ece4] rounded-3xl p-6 min-h-[380px] w-[95%] max-w-md shadow-2xl relative overflow-hidden border border-white/30 flex-col justify-between">
          
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="font-bebas text-3xl text-ink leading-none">AgriSync Voice</Text>
              <Text className="text-ink-muted font-bold text-[10px] uppercase tracking-widest mt-1">Live Multi-Lingual Assistant</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="bg-ink/10 p-2 rounded-full hover:bg-ink/20">
              <X color="#333" size={22} />
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
                className={`w-24 h-24 rounded-full items-center justify-center shadow-lg z-10 transition-all ${status === 'listening' ? 'bg-[#ff6b00]' : status === 'speaking' ? 'bg-farm-green' : 'bg-white border-4 border-[#ff6b00]'}`}
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

            <Text className={`font-bebas text-3xl text-center mb-4 ${status === 'listening' ? 'text-[#ff6b00]' : status === 'speaking' ? 'text-farm-green' : status === 'error' ? 'text-red-500' : 'text-ink'}`}>
              {status === 'idle' ? 'Tap Mic to Speak' : status === 'listening' ? 'Listening...' : status === 'processing' ? 'Thinking...' : status === 'speaking' ? 'Speaking...' : 'Mic Error! Try Again'}
            </Text>

            {transcript ? (
              <View className="bg-amber-100/70 border border-amber-300 rounded-xl p-3 w-full mb-3 shadow-sm">
                <Text className="text-xs font-bold text-amber-900 leading-snug">🎤 Heard: "{transcript}"</Text>
              </View>
            ) : null}

            {response ? (
              <ScrollView className="w-full bg-white/95 p-4.5 rounded-2xl border border-white shadow-md max-h-[180px]" showsVerticalScrollIndicator={false}>
                <Text className="text-ink text-sm font-bold leading-relaxed">{response}</Text>
              </ScrollView>
            ) : null}
          </View>

        </View>
      </View>
    </Modal>
  );
}
