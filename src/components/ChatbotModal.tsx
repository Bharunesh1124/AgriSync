import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { X, Send, Bot, User } from "lucide-react-native";
import { GlassCard } from "./GlassCard";
import { useTranslation } from "react-i18next";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
}

interface ChatbotModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ChatbotModal = ({ visible, onClose }: ChatbotModalProps) => {
  const { i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text:
        i18n.language === "ta"
          ? "வணக்கம்! நான் உங்கள் விவசாய உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?"
          : "Hello! I am your AI Farm Assistant. How can I help you today?",
      sender: "bot",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputText("");
    setLoading(true);

    try {
      const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

      if (!apiKey) {
        throw new Error(
          "API Key missing! Please add EXPO_PUBLIC_GROQ_API_KEY to your .env file.",
        );
      }

      const targetLanguage = i18n.language === "ta" ? "Tamil" : "English";

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "qwen/qwen3.8-27b", // Updated to a currently supported, extremely fast model
            messages: [
              {
                role: "system",
                content: `You are a helpful, expert agricultural assistant answering a farmer's questions. Keep answers short and concise. MANDATORY: ALWAYS reply strictly in ${targetLanguage}.`,
              },
              ...messages.map((m) => ({
                role: m.sender === "user" ? "user" : "assistant",
                content: m.text,
              })),
              { role: "user", content: newUserMsg.text },
            ],
          }),
        },
      );

      const data = await response.json();

      if (data.error) throw new Error(data.error.message);

      const botReply = data.choices[0].message.content;
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), text: botReply, sender: "bot" },
      ]);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text: `Error: ${error.message}. (Did you add the API Key to your .env file?)`,
          sender: "bot",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50 items-center">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="bg-[#f0ece4] h-[85%] rounded-t-3xl shadow-lg w-full max-w-[480px]"
        >
          {/* Header */}
          <View className="flex-row justify-between items-center p-6 border-b border-ink/5">
            <View className="flex-row items-center">
              <Bot color="#10b981" size={28} />
              <Text className="font-bebas text-3xl text-ink ml-3 mt-1">
                AI Assistant
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="bg-ink/10 p-2 rounded-full"
            >
              <X color="#333" size={24} />
            </TouchableOpacity>
          </View>

          {/* Chat History */}
          <ScrollView
            className="flex-1 p-6"
            showsVerticalScrollIndicator={false}
           showsHorizontalScrollIndicator={false}>
            {messages.map((msg) => (
              <View
                key={msg.id}
                className={`flex-row mb-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "bot" && (
                  <View className="bg-farm-green/10 w-8 h-8 rounded-full items-center justify-center mr-2">
                    <Bot size={16} color="#10b981" />
                  </View>
                )}

                <View
                  className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === "user" ? "bg-[#ff6b00] rounded-tr-sm" : "bg-white border border-ink/10 rounded-tl-sm"}`}
                >
                  <Text
                    className={`${msg.sender === "user" ? "text-white" : "text-ink"} font-inter text-sm`}
                  >
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}
            {loading && (
              <View className="flex-row items-center ml-10 mb-4">
                <ActivityIndicator size="small" color="#10b981" />
                <Text className="text-ink-muted text-xs ml-2 italic">
                  AI is thinking...
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Quick Prompts Ribbon */}
          <View className="bg-white border-t border-ink/5 flex-row items-center px-4 py-2">
            <Text className="text-[10px] font-bold text-ink-muted tracking-wider mr-3">
              QUICK QUERIES:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, alignItems: "center" }}
             showsVerticalScrollIndicator={false}>
              {[
                "Suggest a high-yield feed recipe",
                "How to treat FMD?",
                "Best fertilizer for Paddy?",
                "How much water does Maize need?",
              ].map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setInputText(prompt);
                  }}
                  className="bg-white px-3 py-1.5 rounded-full border border-ink/10 flex-row items-center"
                >
                  <Text className="text-ink text-xs font-inter">{prompt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Input Area */}
          <View className="p-4 bg-white border-t border-ink/5 flex-row items-center">
            <TextInput
              className="flex-1 bg-[#f0ece4] h-12 rounded-full px-4 font-inter text-ink"
              placeholder="Ask me about crops, diseases..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              onPress={sendMessage}
              className={`ml-2 w-12 h-12 rounded-full items-center justify-center ${inputText.trim() ? "bg-farm-green" : "bg-farm-green/50"}`}
              disabled={!inputText.trim() || loading}
            >
              <Send color="white" size={20} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
