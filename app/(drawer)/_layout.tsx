import { Drawer } from "expo-router/drawer";
import {
  Home,
  Activity,
  Leaf,
  DollarSign,
  AlertTriangle,
  MessageCircle,
  AlertOctagon,
  LogOut,
  User,
  Mic,
  LifeBuoy,
  Newspaper,
  BarChart2,
  Menu,
} from "lucide-react-native";
import { BlurView } from "expo-blur";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { useAuth } from "../../src/contexts/AuthContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NewsModal } from "../../src/components/NewsModal";
import { ChatbotModal } from "../../src/components/ChatbotModal";
import { VoiceAssistantModal } from "../../src/components/VoiceAssistantModal";
import { KisaanSosModal } from "../../src/components/KisaanSosModal";
import "../../src/i18n"; // Initialize i18n
import { useTranslation } from "react-i18next";
import { changeLanguage } from "../../src/i18n";

export default function DrawerLayout() {
  const { signOut } = useAuth();
  const { i18n } = useTranslation();
  const [showNews, setShowNews] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showSos, setShowSos] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ta" : "en";
    changeLanguage(newLang);
  };

  const confirmSignOut = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to log out?")) {
        signOut();
      }
    } else {
      Alert.alert("Sign Out", "Are you sure you want to log out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Yes, Log Out", style: "destructive", onPress: signOut },
      ]);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={({ navigation }) => ({
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerTintColor: "#0f0f0f",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.toggleDrawer()}
              style={{
                marginLeft: 16,
                marginTop: Platform.OS === "web" ? 8 : 4,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: "#ffffff",
                borderWidth: 1,
                borderColor: "rgba(0, 0, 0, 0.08)",
                shadowColor: "#000",
                shadowOpacity: 0.04,
                shadowRadius: 3,
                elevation: 2,
                flexDirection: "row",
                alignItems: "center",
              }}
              activeOpacity={0.7}
            >
              <Menu size={20} color="#0f0f0f" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginRight: 16,
                marginTop: Platform.OS === "web" ? 8 : 4,
                gap: 10,
              }}
            >
              <TouchableOpacity
                onPress={toggleLanguage}
                style={{
                  backgroundColor: "#ffffff",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "rgba(0, 0, 0, 0.08)",
                  shadowColor: "#000",
                  shadowOpacity: 0.04,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <Text style={{ fontWeight: "700", color: "#0f0f0f", fontSize: 13 }}>
                  {i18n.language === "en" ? "A/அ" : "அ/A"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmSignOut}
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.2)",
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.04,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <LogOut color="#ef4444" size={14} />
                <Text
                  style={{
                    fontWeight: "700",
                    color: "#ef4444",
                    marginLeft: 6,
                    fontSize: 11,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          ),
          drawerStyle: {
            backgroundColor: "#f0ece4",
            width: 280,
          },
          drawerActiveTintColor: "#ff6b00",
          drawerInactiveTintColor: "#666",
          drawerLabelStyle: {
            fontFamily: "Inter_500Medium",
            fontSize: 15,
          },
        })}
      >
        <Drawer.Screen
          name="profile"
          options={{
            drawerLabel:
              i18n.language === "ta"
                ? "என் சுயவிவரம் (My Profile)"
                : "My Profile",
            title: "Farm Profile",
            drawerIcon: ({ color }: any) => <User size={22} color={color} />,
          }}
        />
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel:
              i18n.language === "ta" ? "முகப்பு (Dashboard)" : "Dashboard",
            title: "Dashboard",
            drawerIcon: ({ color }: any) => <Home size={22} color={color} />,
          }}
        />
        <Drawer.Screen
          name="livestock"
          options={{
            drawerLabel:
              i18n.language === "ta"
                ? "கால்நடை & தீவனம் (Livestock)"
                : "Livestock & Feed",
            title: "Livestock Management",
            drawerIcon: ({ color }: any) => <Activity size={22} color={color} />,
          }}
        />
        <Drawer.Screen
          name="crops"
          options={{
            drawerLabel:
              i18n.language === "ta"
                ? "பயிர்கள் & நீர்ப்பாசனம் (Crops)"
                : "Crops & Irrigation",
            title: "Crop Management",
            drawerIcon: ({ color }: any) => <Leaf size={22} color={color} />,
          }}
        />
        <Drawer.Screen
          name="finance"
          options={{
            drawerLabel:
              i18n.language === "ta"
                ? "நிதி மேலாண்மை (Finance)"
                : "Finance Tracker",
            title: i18n.language === "ta" ? "நிதி மேலாண்மை" : "Finance",
            drawerIcon: ({ color }: any) => <DollarSign size={22} color={color} />,
          }}
        />
        <Drawer.Screen
          name="reports"
          options={{
            drawerLabel:
              i18n.language === "ta"
                ? "பண்ணை அறிக்கை (Reports)"
                : "Farm Progress Report",
            title: "Reports",
            drawerIcon: ({ color }: any) => <BarChart2 size={22} color={color} />,
          }}
        />
        <Drawer.Screen
          name="what-if"
          options={{
            drawerLabel:
              i18n.language === "ta"
                ? "வாட்-இப் சிமுலேட்டர் (What-If)"
                : "What-If Simulator",
            drawerIcon: ({ color }: any) => <Activity size={22} color={color} />,
          }}
        />
        <Drawer.Screen
          name="news"
          options={{
            drawerLabel:
              i18n.language === "ta"
                ? "வேளாண் செய்திகள் (Agri-News)"
                : "Agri-News",
            title: "Agri-News Broadcast",
            drawerIcon: ({ color }: any) => <Newspaper size={22} color={color} />,
          }}
        />
        <Drawer.Screen
          name="alerts"
          options={{
            drawerLabel:
              i18n.language === "ta"
                ? "நோய் எச்சரிக்கைகள் (Alerts)"
                : "Outbreak Alerts",
            title: "Active Alerts",
            drawerIcon: ({ color }: any) => (
              <AlertTriangle size={22} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="help"
          options={{
            drawerLabel:
              i18n.language === "ta"
                ? "உதவி & அவசர சேவை (Help)"
                : "Help & Emergency SOS",
            title: "Help & Emergency",
            drawerIcon: ({ color }: any) => <LifeBuoy size={22} color={color} />,
          }}
        />
        <Drawer.Screen
          name="benefits"
          options={{ drawerItemStyle: { display: "none" }, title: "Benefits" }}
        />
      </Drawer>

      {/* Global 🆘 Kisaan Emergency SOS Floating Button (Bottom Left) */}
      <TouchableOpacity
        className="absolute bottom-6 left-6 bg-red-600 w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-red-600/50 z-50"
        onPress={() => setShowSos(true)}
      >
        <AlertOctagon color="white" size={32} />
      </TouchableOpacity>

      {/* Text AI Chatbot Button (Bottom Right, secondary) */}
      <TouchableOpacity
        className="absolute bottom-6 right-24 bg-white border border-ink/10 w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-ink/10 z-50"
        onPress={() => setShowChat(true)}
      >
        <MessageCircle color="#333" size={24} />
      </TouchableOpacity>

      {/* Voice Assistant Button (Bottom Right, PRIMARY) */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-[#ff6b00] w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-[#ff6b00]/50 z-50"
        onPress={() => setShowVoice(true)}
      >
        <Mic color="white" size={32} />
      </TouchableOpacity>



      {/* The Modals */}
      <NewsModal visible={showNews} onClose={() => setShowNews(false)} />
      <ChatbotModal visible={showChat} onClose={() => setShowChat(false)} />
      <VoiceAssistantModal
        visible={showVoice}
        onClose={() => setShowVoice(false)}
      />
      <KisaanSosModal visible={showSos} onClose={() => setShowSos(false)} />
    </GestureHandlerRootView>
  );
}
