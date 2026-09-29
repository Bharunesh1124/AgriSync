import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  Leaf,
  Droplet,
  CloudRain,
  Sun,
  Wind,
  CheckSquare,
  Square,
  AlertTriangle,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Plus,
  Droplets,
  Syringe,
  Wallet,
  CheckCircle2,
  ShieldCheck,
  Activity,
  Info,
  Menu,
  Bell,
  MapPin,
  CheckCircle,
} from "lucide-react-native";
import { useFarmEvents, FarmEvent } from "../../src/contexts/FarmEventContext";
import { supabase } from "../../src/lib/supabase";

const { width } = Dimensions.get("window");

const DAY_TA: Record<string, string> = {
  Sun: "ஞாயிறு",
  Mon: "திங்கள்",
  Tue: "செவ்வாய்",
  Wed: "புதன்",
  Thu: "வியாழன்",
  Fri: "வெள்ளி",
  Sat: "சனி",
};

const TASK_TITLE_TA: Record<string, string> = {
  "Morning Feed": "காலை தீவனம்",
  "Health Check": "சுகாதார பரிசோதனை",
  "Irrigation": "பாசனம்",
  "Fertilizer Application": "உரம் இடுதல்",
  "Pest Control": "பூச்சிக்கொல்லி தெளிப்பு",
  "Soil Testing": "மண் பரிசோதனை",
  "Harvesting": "அறுவடை",
  "Weeding": "களை எடுத்தல்",
  "Vaccination": "தடுப்பூசி செலுத்துதல்",
  "Evening Feed": "மாலை தீவனம்",
  "Milk Collection": "பால் சேகரிப்பு",
};

function formatTaskTitle(title: string, isTa: boolean): string {
  if (!isTa || !title) return title;
  return TASK_TITLE_TA[title] || title;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isTa = i18n.language === "ta";

  const [activeTab, setActiveTab] = useState("overview");
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isGeneratingWeather, setIsGeneratingWeather] = useState(false);

  const { events, toggleCompletion, generateAiPlanForDay, generateWeatherRecommendations } = useFarmEvents();

  const todayObj = new Date();
  const today =
    todayObj.getFullYear() +
    "-" +
    String(todayObj.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(todayObj.getDate()).padStart(2, "0");

  const tomorrowObj = new Date(Date.now() + 86400000);
  const tomorrow =
    tomorrowObj.getFullYear() +
    "-" +
    String(tomorrowObj.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(tomorrowObj.getDate()).padStart(2, "0");

  const [selectedDate, setSelectedDate] = useState(today);

  const todayEvents = events
    .filter((e) => e.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));
  const highPriorityEvents = events.filter(
    (e) => e.date === today && e.priority === "High",
  );
  const needsAttention = events
    .filter(
      (e) =>
        e.date <= today &&
        (e.status === "Overdue" ||
          (e.priority === "High" && e.status === "Pending"))
    )
    .slice(0, 3);

  // Registered User Data Extraction
  const userMetadata = user?.user_metadata || {};
  const farmerLocation = (!userMetadata.location || userMetadata.location.includes("Kundrathur") || userMetadata.location.includes("Chennai"))
    ? "Tanjore, Tamil Nadu"
    : userMetadata.location;

  // Dynamic Cash Balance
  const rawCash = userMetadata.availableCash || userMetadata.inventory?.cash_balance;
  const availableCashNum = rawCash ? parseFloat(rawCash) : 148500;

  // Registered Crops from Registration / Onboarding
  const registeredCropGroups: Array<{ id: string; name: string; acres: string }> =
    userMetadata.inventory?.cropDetails && userMetadata.inventory.cropDetails.length > 0
      ? userMetadata.inventory.cropDetails
      : userMetadata.inventory?.crops && userMetadata.inventory.crops.length > 0
      ? userMetadata.inventory.crops.map((c: string, idx: number) => ({
          id: `crop_${idx}`,
          name: c,
          acres: "5",
        }))
      : [
          { id: "1", name: "Rice", acres: "6.5" },
          { id: "2", name: "Wheat", acres: "5.0" },
          { id: "3", name: "Sugarcane", acres: "4.0" },
        ];

  const totalRegisteredAcres = registeredCropGroups.reduce(
    (sum, c) => sum + (parseFloat(c.acres) || 0),
    0
  ) || 15.5;

  // Registered Livestock from Registration / Onboarding
  const registeredLivestock: Array<{ id: string; type: string; count: string }> =
    userMetadata.inventory?.livestock && userMetadata.inventory.livestock.length > 0
      ? userMetadata.inventory.livestock
      : [
          { id: "1", type: "Cattle", count: "12" },
          { id: "2", type: "Goats", count: "15" },
          { id: "3", type: "Pigs", count: "8" },
        ];

  const totalRegisteredAnimals = registeredLivestock.reduce(
    (sum, l) => sum + (parseInt(l.count) || 0),
    0
  ) || 35;

  // Fetch Live DB Transactions
  const [dbTransactions, setDbTransactions] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchTransactions = async () => {
      if (!user) return;
      try {
        let metaTxs = userMetadata.transactions || userMetadata.farm_transactions || [];
        if (user.id) {
          const { data, error } = await supabase
            .from("farm_transactions")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (data && data.length > 0) {
            metaTxs = [...data, ...metaTxs];
          }
        }

        if (isMounted && metaTxs.length > 0) {
          const unique = Array.from(
            new Map(metaTxs.map((item: any) => [item.id || Math.random(), item])).values()
          );
          setDbTransactions(unique);
        }
      } catch (e) {
        console.warn("Dashboard transaction fetch error:", e);
      }
    };

    fetchTransactions();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Calculate live income & expenses from transactions
  let liveIncome = 0;
  let liveExpenses = 0;
  if (dbTransactions.length > 0) {
    dbTransactions.forEach((tx) => {
      const amt = Number(tx.amount || 0);
      if (tx.type === "in" || tx.type === "income" || tx.type === "credit") {
        liveIncome += amt;
      } else {
        liveExpenses += amt;
      }
    });
  }

  const monthlyIncome = liveIncome > 0 ? liveIncome : 42000;
  const monthlyExpenses = liveExpenses > 0 ? liveExpenses : 41800;

  // Dynamic Scores
  const cropHealthScore = 92;
  const livestockHealthScore = 97;
  const waterHealthScore = 88;
  const financeHealthScore = Math.min(
    95,
    Math.max(60, Math.round(75 + (monthlyIncome / (monthlyExpenses || 1)) * 10))
  ) || 85;

  const overallHealthScore = Math.round(
    (cropHealthScore + livestockHealthScore + waterHealthScore + financeHealthScore) / 4
  );

  const SectionHeader = ({ title, rightText, subtitle }: any) => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
      }}
    >
      <View>
        <Text style={{ fontWeight: "800", fontSize: 18, color: "#101828" }}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontWeight: "500",
              fontSize: 12,
              color: "#64748b",
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {rightText && (
        <TouchableOpacity>
          <Text style={{ fontWeight: "600", fontSize: 13, color: "#0284c7" }}>
            {rightText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const getCategoryIcon = (cat: string, color: string, size = 16) => {
    switch (cat) {
      case "Crop":
        return <Leaf color={color} size={size} />;
      case "Water":
        return <Droplet color={color} size={size} />;
      case "Livestock":
        return <Syringe color={color} size={size} />;
      case "Finance":
        return <Wallet color={color} size={size} />;
      case "General":
        return <CheckSquare color={color} size={size} />;
      case "Weather":
        return <CloudRain color={color} size={size} />;
      default:
        return <AlertTriangle color={color} size={size} />;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Crop":
        return "#16a34a";
      case "Water":
        return "#3b82f6";
      case "Livestock":
        return "#f97316";
      case "Finance":
        return "#8b5cf6";
      case "Weather":
        return "#64748b";
      case "Urgent":
        return "#ef4444";
      default:
        return "#cbd5e1";
    }
  };

  const NAV_TABS = [
    { key: "overview", en: "OVERVIEW", ta: "மேலோட்டம்" },
    { key: "crops", en: "CROPS", ta: "பயிர்கள்" },
    { key: "livestock", en: "LIVESTOCK", ta: "கால்நடை" },
    { key: "water", en: "WATER", ta: "நீர்" },
    { key: "finance", en: "FINANCE", ta: "நிதி" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fdfbf7" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 100,
          paddingBottom: 120,
          width: "100%",
          alignSelf: "center",
          maxWidth: 600,
        }}
       showsHorizontalScrollIndicator={false}>
        {/* Title Area */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 24,
          }}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text
              style={{
                fontFamily: isTa ? undefined : "BebasNeue_400Regular",
                fontWeight: isTa ? "800" : "400",
                fontSize: isTa ? 28 : 42,
                color: "#101828",
                letterSpacing: isTa ? 0 : 1,
              }}
            >
              {isTa ? "பண்ணை மேலோட்டம்" : "FARM OVERVIEW"}
            </Text>
            <Text
              style={{
                fontWeight: "500",
                fontSize: 14,
                color: "#64748b",
                marginTop: 4,
              }}
            >
              {user?.user_metadata?.location ? `${user.user_metadata.location} • ` : ''}{isTa ? "உங்கள் பண்ணை ஒரு பார்வையில்" : "Your farm at a glance"}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontWeight: "700", fontSize: 13, color: "#101828" }}>
              {new Date().toLocaleDateString(isTa ? "ta-IN" : "en-US", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <Sun color="#f59e0b" size={16} style={{ marginRight: 6 }} />
              <View>
                <Text
                  style={{ fontWeight: "700", fontSize: 13, color: "#101828" }}
                >
                  {isTa ? "காலை வணக்கம்!" : `Good Day, ${user?.user_metadata?.name || 'Farmer'}!`}
                </Text>
                <Text
                  style={{ fontWeight: "500", fontSize: 10, color: "#64748b" }}
                >
                  {isTa ? "இனிய நாள் தொடரட்டும்." : "A productive day ahead."}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
            shadowColor: "#000",
            shadowOpacity: 0.03,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          {NAV_TABS.map((tabObj) => (
            <TouchableOpacity
              key={tabObj.key}
              onPress={() => setActiveTab(tabObj.key)}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 2,
                alignItems: "center",
                backgroundColor:
                  activeTab === tabObj.key ? "#101828" : "transparent",
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 10,
                  color: activeTab === tabObj.key ? "#fff" : "#64748b",
                }}
              >
                {isTa ? tabObj.ta : tabObj.en}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 1. Farm Health Hero */}
        <View
          style={{
            backgroundColor: "#16a34a",
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
            shadowColor: "#16a34a",
            shadowOpacity: 0.2,
            shadowRadius: 15,
            elevation: 4,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 12,
                  color: "#fff",
                  opacity: 0.9,
                  letterSpacing: 1,
                }}
              >
                {isTa ? "பண்ணை ஆரோக்கிய மதிப்பெண்" : "FARM HEALTH SCORE"}
              </Text>
              <Info
                color="#fff"
                size={14}
                style={{ marginLeft: 6, opacity: 0.8 }}
              />
            </View>
            <View
              style={{
                backgroundColor: "#101828",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
              }}
            >
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 10,
                  color: "#fff",
                  letterSpacing: 0.5,
                }}
              >
                {isTa ? "சிறப்பானது" : "OPTIMAL"}
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontFamily: "BebasNeue_400Regular",
              fontSize: 84,
              color: "#fff",
              marginBottom: 4,
              lineHeight: 84,
            }}
          >
            {overallHealthScore}%
          </Text>
          <Text
            style={{
              fontWeight: "500",
              fontSize: 14,
              color: "#fff",
              opacity: 0.9,
              marginBottom: 20,
            }}
          >
            {isTa ? "உங்கள் பண்ணை சிறப்பாக செயல்படுகிறது!" : "Your farm is performing well!"}
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 4,
            }}
          >
            <TouchableOpacity
              onPress={() => setActiveTab("crops")}
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: "center",
                backgroundColor:
                  activeTab === "crops" ? "#dcfce7" : "transparent",
                borderRadius: 12,
              }}
            >
              <Leaf
                color={activeTab === "crops" ? "#15803d" : "#16a34a"}
                size={20}
                style={{ marginBottom: 8 }}
              />
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 12,
                  color: activeTab === "crops" ? "#15803d" : "#101828",
                }}
              >
                {isTa ? "பயிர்கள்" : "Crops"}
              </Text>
              <Text
                style={{
                  fontWeight: "800",
                  fontSize: 14,
                  color: activeTab === "crops" ? "#15803d" : "#101828",
                }}
              >
                {cropHealthScore}%
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("livestock")}
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: "center",
                backgroundColor:
                  activeTab === "livestock" ? "#ffedd5" : "transparent",
                borderRadius: 12,
              }}
            >
              <ShieldCheck
                color={activeTab === "livestock" ? "#c2410c" : "#101828"}
                size={20}
                style={{ marginBottom: 8 }}
              />
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 12,
                  color: activeTab === "livestock" ? "#c2410c" : "#101828",
                }}
              >
                {isTa ? "கால்நடை" : "Livestock"}
              </Text>
              <Text
                style={{
                  fontWeight: "800",
                  fontSize: 14,
                  color: activeTab === "livestock" ? "#c2410c" : "#101828",
                }}
              >
                {livestockHealthScore}%
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("water")}
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: "center",
                backgroundColor:
                  activeTab === "water" ? "#dbeafe" : "transparent",
                borderRadius: 12,
              }}
            >
              <Droplet
                color={activeTab === "water" ? "#1d4ed8" : "#2563eb"}
                size={20}
                style={{ marginBottom: 8 }}
              />
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 12,
                  color: activeTab === "water" ? "#1d4ed8" : "#101828",
                }}
              >
                {isTa ? "நீர்" : "Water"}
              </Text>
              <Text
                style={{
                  fontWeight: "800",
                  fontSize: 14,
                  color: activeTab === "water" ? "#1d4ed8" : "#101828",
                }}
              >
                {waterHealthScore}%
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("finance")}
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: "center",
                backgroundColor:
                  activeTab === "finance" ? "#f3e8ff" : "transparent",
                borderRadius: 12,
              }}
            >
              <Activity
                color={activeTab === "finance" ? "#7e22ce" : "#9333ea"}
                size={20}
                style={{ marginBottom: 8 }}
              />
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 12,
                  color: activeTab === "finance" ? "#7e22ce" : "#101828",
                }}
              >
                {isTa ? "நிதி" : "Finance"}
              </Text>
              <Text
                style={{
                  fontWeight: "800",
                  fontSize: 14,
                  color: activeTab === "finance" ? "#7e22ce" : "#101828",
                }}
              >
                {financeHealthScore}%
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Detail Panel */}
        {activeTab === "crops" && (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: 20,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOpacity: 0.03,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <SectionHeader
              title={isTa ? `🌱 பயிர் ஆரோக்கியம் — ${cropHealthScore}%` : `🌱 CROP HEALTH — ${cropHealthScore}%`}
              subtitle={isTa ? "இந்த மதிப்பெண் ஏன்?" : "Why this score?"}
              rightText={isTa ? "அனைத்தையும் காண்க →" : "View All →"}
            />
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, color: "#16a34a", fontWeight: "500", marginBottom: 4 }}>
                {isTa ? `✓ ${registeredCropGroups.length} பயிர்கள் பதிவு செய்யப்பட்டுள்ளன (${totalRegisteredAcres} ஏக்கர்)` : `✓ ${registeredCropGroups.length} registered crops (${totalRegisteredAcres} acres total)`}
              </Text>
              <Text style={{ fontSize: 13, color: "#16a34a", fontWeight: "500", marginBottom: 4 }}>
                {isTa ? "✓ NPK மற்றும் மண் வளம் சரிபார்க்கப்பட்டது" : "✓ NPK and soil nutrients verified"}
              </Text>
              <Text style={{ fontSize: 13, color: "#16a34a", fontWeight: "500", marginBottom: 12 }}>
                {isTa ? "✓ நேரடி வானிலை கண்காணிப்பு செயலில் உள்ளது" : "✓ Active real-time weather monitoring"}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: "#f1f5f9", marginBottom: 16 }} />

            {/* Dynamic Registered Crops List */}
            {registeredCropGroups.map((crop, idx) => (
              <View key={crop.id || idx} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ fontWeight: "800", fontSize: 16, color: "#101828" }}>
                    🌱 {crop.name}
                  </Text>
                  <Text style={{ fontWeight: "700", fontSize: 14, color: "#16a34a" }}>
                    {isTa ? "ஆரோக்கியமானது" : "Healthy"}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
                  {isTa ? `புலம் ${String.fromCharCode(65 + idx)} • ${crop.acres} ஏக்கர்` : `Field ${String.fromCharCode(65 + idx)} • ${crop.acres} acre(s)`}
                </Text>
                <View style={{ height: 6, backgroundColor: "#f1f5f9", borderRadius: 3, marginBottom: 12 }}>
                  <View style={{ width: "90%", height: "100%", backgroundColor: "#16a34a", borderRadius: 3 }} />
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: "#64748b" }}>{isTa ? "மண் ஈரம்" : "Soil Moisture"}</Text>
                  <Text style={{ fontSize: 12, color: "#16a34a", fontWeight: "600" }}>Optimal (55%)</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: "#64748b" }}>NPK</Text>
                  <Text style={{ fontSize: 12, color: "#101828", fontWeight: "600" }}>{isTa ? "சிறப்பானது" : "Optimal"}</Text>
                </View>
                {idx < registeredCropGroups.length - 1 && (
                  <View style={{ height: 1, backgroundColor: "#f1f5f9", marginTop: 12, marginBottom: 12 }} />
                )}
              </View>
            ))}

            <TouchableOpacity
              onPress={() => router.push("/crops")}
              style={{ backgroundColor: "#f8fafc", paddingVertical: 12, borderRadius: 12, alignItems: "center" }}
            >
              <Text style={{ color: "#0f172a", fontWeight: "600", fontSize: 13 }}>
                {isTa ? "பயிர் மேலாண்மையைக் காண்க →" : "View Crop Management →"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "livestock" && (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: 20,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOpacity: 0.03,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <SectionHeader
              title={isTa ? `🐄 கால்நடை ஆரோக்கியம் — ${livestockHealthScore}%` : `🐄 LIVESTOCK HEALTH — ${livestockHealthScore}%`}
              subtitle={isTa ? "இந்த மதிப்பெண் ஏன்?" : "Why this score?"}
              rightText={isTa ? "அனைத்தையும் காண்க →" : "View All →"}
            />
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, color: "#16a34a", fontWeight: "500", marginBottom: 4 }}>
                {isTa ? `✓ ${registeredLivestock.length} வகைகள் பதிவு செய்யப்பட்டுள்ளன (${totalRegisteredAnimals} விலங்குகள்)` : `✓ ${registeredLivestock.length} group(s) registered (${totalRegisteredAnimals} animals total)`}
              </Text>
              <Text style={{ fontSize: 13, color: "#16a34a", fontWeight: "500", marginBottom: 4 }}>
                {isTa ? "✓ தீவன அட்டவணை சீராக உள்ளது" : "✓ Regular feeding & health routine"}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: "#f1f5f9", marginBottom: 16 }} />

            {/* Dynamic Registered Livestock List */}
            {registeredLivestock.map((item, idx) => (
              <View key={item.id || idx} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ fontWeight: "800", fontSize: 16, color: "#101828" }}>
                    🐄 {item.type}
                  </Text>
                  <Text style={{ fontWeight: "700", fontSize: 14, color: "#f97316" }}>
                    {item.count} {isTa ? "விலங்குகள்" : "Head"}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: "#64748b" }}>{isTa ? "ஆரோக்கியம்" : "Health Status"}</Text>
                  <Text style={{ fontSize: 12, color: "#16a34a", fontWeight: "600" }}>97% Prime</Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, color: "#64748b" }}>{isTa ? "தடுப்பூசி" : "Vaccinated"}</Text>
                  <Text style={{ fontSize: 12, color: "#101828", fontWeight: "600" }}>100%</Text>
                </View>
                {idx < registeredLivestock.length - 1 && (
                  <View style={{ height: 1, backgroundColor: "#f1f5f9", marginTop: 12, marginBottom: 12 }} />
                )}
              </View>
            ))}

            <TouchableOpacity
              onPress={() => router.push("/livestock")}
              style={{ backgroundColor: "#f8fafc", paddingVertical: 12, borderRadius: 12, alignItems: "center" }}
            >
              <Text style={{ color: "#0f172a", fontWeight: "600", fontSize: 13 }}>
                {isTa ? "கால்நடை மேலாண்மையைக் காண்க →" : "View Livestock Management →"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "water" && (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: 20,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOpacity: 0.03,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <SectionHeader
              title={isTa ? "💧 நீர் நிலை — 88%" : "💧 WATER STATUS — 88%"}
              subtitle={isTa ? "ஒட்டுமொத்தமாக நன்று" : "Overall Good"}
              rightText={isTa ? "அனைத்தையும் காண்க →" : "View All →"}
            />

            <View
              style={{
                marginBottom: 16,
                backgroundColor: "#f0f9ff",
                padding: 12,
                borderRadius: 12,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "700", fontSize: 14, color: "#0369a1" }}>
                {isTa ? "நீர் தொட்டி" : "Water Tank"}
              </Text>
              <Text style={{ fontWeight: "800", fontSize: 14, color: "#0369a1" }}>
                {isTa ? "72% நிரம்பியுள்ளது" : "72% Full"}
              </Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", fontSize: 13, color: "#101828", marginBottom: 4 }}>
                  {isTa ? "புலம் A" : "Field A"}
                </Text>
                <Text style={{ fontSize: 12, color: "#64748b" }}>{isTa ? "மண் ஈரம்" : "Soil Moisture"}</Text>
                <Text style={{ fontWeight: "800", fontSize: 16, color: "#ef4444" }}>31%</Text>
                <Text style={{ fontSize: 11, color: "#ef4444", fontWeight: "600" }}>
                  {isTa ? "⚠ இலக்குக்கு கீழ்" : "⚠ Below Target"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", fontSize: 13, color: "#101828", marginBottom: 4 }}>
                  {isTa ? "புலம் B" : "Field B"}
                </Text>
                <Text style={{ fontSize: 12, color: "#64748b" }}>{isTa ? "மண் ஈரம்" : "Soil Moisture"}</Text>
                <Text style={{ fontWeight: "800", fontSize: 16, color: "#16a34a" }}>58%</Text>
                <Text style={{ fontSize: 11, color: "#16a34a", fontWeight: "600" }}>
                  {isTa ? "✓ நன்று" : "✓ Good"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700", fontSize: 13, color: "#101828", marginBottom: 4 }}>
                  {isTa ? "புலம் C" : "Field C"}
                </Text>
                <Text style={{ fontSize: 12, color: "#64748b" }}>{isTa ? "மண் ஈரம்" : "Soil Moisture"}</Text>
                <Text style={{ fontWeight: "800", fontSize: 16, color: "#16a34a" }}>64%</Text>
                <Text style={{ fontSize: 11, color: "#16a34a", fontWeight: "600" }}>
                  {isTa ? "✓ நன்று" : "✓ Good"}
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: "#fff1f2", padding: 12, borderRadius: 12, marginBottom: 16 }}>
              <Text style={{ fontWeight: "600", fontSize: 12, color: "#be123c" }}>
                {isTa ? "அடுத்த பாசனம்: புலம் A (இன்று • காலை 8:00)" : "Next Irrigation: Field A (Today • 8:00 AM)"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/crops")}
              style={{ backgroundColor: "#f8fafc", paddingVertical: 12, borderRadius: 12, alignItems: "center" }}
            >
              <Text style={{ color: "#0f172a", fontWeight: "600", fontSize: 13 }}>
                {isTa ? "புலம் நீர் விவரங்களைக் காண்க →" : "View Field Water Details →"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "finance" && (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: 20,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOpacity: 0.03,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <SectionHeader
              title={isTa ? `💰 நிதி ஆரோக்கியம் — ${financeHealthScore}%` : `💰 FINANCIAL HEALTH — ${financeHealthScore}%`}
              subtitle={isTa ? "இந்த மதிப்பெண் ஏன்?" : "Why this score?"}
              rightText={isTa ? "பேரேட்டைக் காண்க →" : "View Ledger →"}
            />
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, color: "#16a34a", fontWeight: "500", marginBottom: 4 }}>
                {isTa ? "✓ பேரேடு புதுப்பிக்கப்பட்டது" : "✓ Ledger updated with live entries"}
              </Text>
              <Text style={{ fontSize: 13, color: "#16a34a", fontWeight: "500", marginBottom: 4 }}>
                {isTa ? "✓ செலவுகள் மற்றும் வருமானம் பதிவிடப்பட்டன" : "✓ Income and expenses recorded"}
              </Text>
            </View>

            <View style={{ height: 1, backgroundColor: "#f1f5f9", marginBottom: 16 }} />

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: "600", fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                {isTa ? "கிடைக்கக்கூடிய ரொக்கம்" : "Available Cash"}
              </Text>
              <Text style={{ fontWeight: "800", fontSize: 24, color: "#101828" }}>
                ₹{availableCashNum.toLocaleString("en-IN")}
              </Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "600", fontSize: 12, color: "#64748b" }}>
                  {isTa ? "வருமானம் (இந்த மாதம்)" : "Income (This Month)"}
                </Text>
                <Text style={{ fontWeight: "700", fontSize: 16, color: "#16a34a" }}>
                  + ₹{monthlyIncome.toLocaleString("en-IN")}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "600", fontSize: 12, color: "#64748b" }}>
                  {isTa ? "செலவுகள் (இந்த மாதம்)" : "Expenses (This Month)"}
                </Text>
                <Text style={{ fontWeight: "700", fontSize: 16, color: "#ef4444" }}>
                  - ₹{monthlyExpenses.toLocaleString("en-IN")}
                </Text>
              </View>
            </View>

            <Text style={{ fontWeight: "700", fontSize: 12, color: "#64748b", letterSpacing: 1, marginBottom: 12 }}>
              {isTa ? "வரவிருப்பவை" : "UPCOMING"}
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <View>
                <Text style={{ fontWeight: "700", fontSize: 13, color: "#101828" }}>
                  {isTa ? "கடன் EMI" : "Loan EMI"}
                </Text>
                <Text style={{ fontSize: 11, color: "#64748b" }}>Due soon</Text>
              </View>
              <Text style={{ fontWeight: "700", fontSize: 14, color: "#ef4444" }}>
                - ₹14,200
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <View>
                <Text style={{ fontWeight: "700", fontSize: 13, color: "#101828" }}>
                  {isTa ? "எதிர்பார்க்கப்படும் பயிர் வருமானம்" : "Expected Crop Income"}
                </Text>
                <Text style={{ fontSize: 11, color: "#64748b" }}>Next week</Text>
              </View>
              <Text style={{ fontWeight: "700", fontSize: 14, color: "#16a34a" }}>
                + ₹{monthlyIncome.toLocaleString("en-IN")}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/finance")}
              style={{ backgroundColor: "#f8fafc", paddingVertical: 12, borderRadius: 12, alignItems: "center" }}
            >
              <Text style={{ color: "#0f172a", fontWeight: "600", fontSize: 13 }}>
                {isTa ? "டிஜிட்டல் பேரேட்டைத் திறக்க →" : "Open Digital Ledger →"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Overview Layout Details */}
        {/* 2. Today's Weather */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 24,
            padding: 20,
            marginBottom: 24,
            shadowColor: "#000",
            shadowOpacity: 0.03,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <SectionHeader
            title={isTa ? "இன்றைய வானிலை" : "Today's Weather"}
            rightText={isTa ? "10 நிமிடங்களுக்கு முன் புதுப்பிக்கப்பட்டது" : "Updated 10 min ago"}
          />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <MapPin color="#64748b" size={14} style={{ marginRight: 6 }} />
            <Text style={{ fontWeight: "500", fontSize: 13, color: "#64748b" }}>
              {farmerLocation}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Sun color="#f59e0b" size={48} />
              <View style={{ marginLeft: 16 }}>
                <Text
                  style={{
                    fontFamily: "BebasNeue_400Regular",
                    fontSize: 48,
                    color: "#101828",
                    lineHeight: 48,
                  }}
                >
                  27°C
                </Text>
                <Text
                  style={{
                    fontWeight: "500",
                    fontSize: 14,
                    color: "#64748b",
                  }}
                >
                  {isTa ? "பகுதி மேகமூட்டம்" : "Partly cloudy"}
                </Text>
              </View>
            </View>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Droplet color="#64748b" size={14} style={{ width: 20 }} />
                <Text style={{ fontWeight: "500", fontSize: 12, color: "#64748b", width: isTa ? 75 : 60 }}>
                  {isTa ? "ஈரப்பதம்" : "Humidity"}
                </Text>
                <Text style={{ fontWeight: "700", fontSize: 12, color: "#101828" }}>
                  68%
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Wind color="#64748b" size={14} style={{ width: 20 }} />
                <Text style={{ fontWeight: "500", fontSize: 12, color: "#64748b", width: isTa ? 75 : 60 }}>
                  {isTa ? "காற்று" : "Wind"}
                </Text>
                <Text style={{ fontWeight: "700", fontSize: 12, color: "#101828" }}>
                  2 km/h
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <CloudRain color="#64748b" size={14} style={{ width: 20 }} />
                <Text style={{ fontWeight: "500", fontSize: 12, color: "#64748b", width: isTa ? 75 : 60 }}>
                  {isTa ? "மழை வாய்ப்பு" : "Rain Chance"}
                </Text>
                <Text style={{ fontWeight: "700", fontSize: 12, color: "#101828" }}>
                  20%
                </Text>
              </View>
            </View>
          </View>
          <View
            style={{
              backgroundColor: "#f0fdf4",
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Leaf color="#16a34a" size={24} style={{ marginRight: 12 }} />
              <View>
                <Text style={{ fontWeight: "700", fontSize: 14, color: "#16a34a" }}>
                  {isTa ? "தெளிப்பதற்கு ஏற்றது" : "Good to Spray"}
                </Text>
                <Text style={{ fontWeight: "500", fontSize: 12, color: "#15803d" }}>
                  {isTa ? "சிறந்த நேரம்: காலை 6:00 – காலை 10:00" : "Optimal window: 6:00 AM – 10:00 AM"}
                </Text>
              </View>
            </View>
            <ChevronRight color="#16a34a" size={20} />
          </View>
        </View>

        {/* 3. Today's Priorities (Dynamic) */}
        {highPriorityEvents.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <SectionHeader
              title={isTa ? "இன்றைய முக்கிய பணிகள்" : "Today's Priorities"}
              subtitle={`${highPriorityEvents.length} ${isTa ? "முக்கிய பணிகள்" : "important tasks"}`}
              rightText={isTa ? "அனைத்தையும் காண்க >" : "View All >"}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20, gap: 12 }}
             showsVerticalScrollIndicator={false}>
                {highPriorityEvents.map((ev) => {
                  const isDone = ev.status === 'Completed';
                  return (
                  <TouchableOpacity
                    key={ev.id}
                    onPress={() => {
                      if (ev.category === "Crop") router.push('/crops');
                      else if (ev.category === "Livestock") router.push('/livestock');
                      else router.push('/finance');
                    }}
                    style={{
                      backgroundColor: isDone ? "#f0fdf4" : "#fff",
                      borderRadius: 20,
                      padding: 16,
                      width: 160,
                      shadowColor: "#000",
                      shadowOpacity: 0.03,
                      shadowRadius: 10,
                      elevation: 2,
                      opacity: isDone ? 0.7 : 1
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: isDone ? "#dcfce7" : "#fee2e2",
                          justifyContent: "center",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        {getCategoryIcon(ev.category, isDone ? "#16a34a" : "#ef4444", 16)}
                      </View>
                      
                      <TouchableOpacity 
                        onPress={() => toggleCompletion(ev.id)}
                        style={{ padding: 4 }}
                      >
                        {isDone ? (
                          <CheckCircle color="#16a34a" size={20} />
                        ) : (
                          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#cbd5e1" }} />
                        )}
                      </TouchableOpacity>
                    </View>
                    
                    <Text
                      style={{
                        fontWeight: "800",
                        fontSize: 14,
                        color: isDone ? "#166534" : "#101828",
                        marginBottom: 4,
                        textDecorationLine: "none"
                      }}
                      numberOfLines={1}
                    >
                      {formatTaskTitle(ev.title, isTa)}
                    </Text>
                    <Text
                      style={{
                        fontWeight: "500",
                        fontSize: 12,
                        color: isDone ? "#4ade80" : "#64748b",
                        marginBottom: 16,
                        textDecorationLine: "none"
                      }}
                      numberOfLines={1}
                    >
                      {ev.subtitle}
                    </Text>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ backgroundColor: isDone ? '#bbf7d0' : '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ color: isDone ? '#166534' : '#fff', fontSize: 10, fontWeight: '700' }}>
                          {isDone ? (isTa ? 'முடிந்தது' : 'Done') : ev.priority}
                        </Text>
                      </View>
                      <Text style={{ color: isDone ? '#166534' : '#ef4444', fontSize: 11, fontWeight: '700' }}>{ev.time}</Text>
                    </View>
                  </TouchableOpacity>
                )})}
            </ScrollView>
          </View>
        )}

        {/* 5. This Week & Calendar (Dynamic) */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 24,
            padding: 20,
            marginBottom: 24,
            shadowColor: "#000",
            shadowOpacity: 0.03,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <SectionHeader
            title={isTa ? "இந்த வாரம்" : "This Week"}
            rightText={isTa ? "திட்டமிடுபவரைப் பார்க்க" : "View Planner"}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 32,
            }}
          >
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(todayObj);
              const currentDay = d.getDay() === 0 ? 7 : d.getDay();
              d.setDate(d.getDate() - currentDay + 1 + i);
              
              const day = d.toLocaleDateString('en-US', { weekday: 'short' });
              const dayLabel = isTa ? (DAY_TA[day] || day) : day;
              const dNum = d.getDate();
              const dateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
              const active = dateStr === selectedDate;

              const dayEvs = events.filter((e) => e.date === dateStr);

              return (
                <TouchableOpacity
                  key={dateStr}
                  onPress={() => setSelectedDate(dateStr)}
                  style={{
                    alignItems: "center",
                    backgroundColor: active ? "#16a34a" : "#f8fafc",
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "600",
                      fontSize: 11,
                      color: active ? "#fff" : "#64748b",
                      marginBottom: 4,
                    }}
                  >
                    {dayLabel}
                  </Text>
                  <Text
                    style={{
                      fontWeight: "800",
                      fontSize: 16,
                      color: active ? "#fff" : "#101828",
                      marginBottom: 12,
                    }}
                  >
                    {dNum}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 2, height: 6 }}>
                    {dayEvs.slice(0, 3).map((e, idx) => (
                      <View
                        key={idx}
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: active
                            ? "#fff"
                            : getCategoryColor(e.category),
                        }}
                      />
                    ))}
                  </View>
                  <Text
                    style={{
                      fontWeight: "600",
                      fontSize: 9,
                      color: active ? "#fff" : "#64748b",
                      marginTop: 8,
                    }}
                  >
                    {dayEvs.length} {isTa ? "பணிகள்" : "tasks"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 6. Selected Day's Timetable (Dynamic) */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 24,
            padding: 20,
            marginBottom: 24,
            shadowColor: "#000",
            shadowOpacity: 0.03,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <SectionHeader
            title={`${new Date(selectedDate).getDate()} ${new Date(selectedDate).toLocaleDateString(isTa ? 'ta-IN' : 'en-US', { month: 'short' })} ${isTa ? 'அட்டவணை' : 'Timetable'}`}
            subtitle={`${todayEvents.length} ${isTa ? 'நடவடிக்கைகள்' : 'activities'}`}
            rightText={isTa ? "+ சேர்" : "+ Add"}
          />
          <View style={{ marginTop: 8 }}>
            {todayEvents.map((t, i) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => toggleCompletion(t.id)}
                style={{
                  flexDirection: "row",
                  marginBottom: 24,
                  position: "relative",
                  opacity: t.status === "Completed" ? 0.6 : 1,
                }}
              >
                <View style={{ width: 60, flexShrink: 0 }}>
                  <Text
                    style={{
                      fontWeight: "700",
                      fontSize: 12,
                      color: "#64748b",
                      marginTop: 2,
                    }}
                  >
                    {t.time}
                  </Text>
                </View>
                <View
                  style={{
                    alignItems: "center",
                    marginRight: 16,
                    flexShrink: 0,
                  }}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor:
                        t.status === "Completed"
                          ? "#cbd5e1"
                          : getCategoryColor(t.category),
                      zIndex: 2,
                    }}
                  />
                  {i < todayEvents.length - 1 && (
                    <View
                      style={{
                        width: 2,
                        height: 60,
                        backgroundColor: "#f1f5f9",
                        position: "absolute",
                        top: 12,
                      }}
                    />
                  )}
                </View>
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "flex-start",
                    minWidth: 0,
                  }}
                >
                  {t.status === "Completed" ? (
                    <CheckCircle2
                      color="#cbd5e1"
                      size={20}
                      style={{ marginRight: 12 }}
                    />
                  ) : (
                    <View style={{ marginRight: 12 }}>
                      {getCategoryIcon(
                        t.category,
                        getCategoryColor(t.category),
                        20,
                      )}
                    </View>
                  )}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{
                        fontWeight: "800",
                        fontSize: 14,
                        color: "#101828",
                        textDecorationLine: "none",
                      }}
                    >
                      {formatTaskTitle(t.title, isTa)}
                    </Text>
                    <Text
                      style={{
                        fontWeight: "500",
                        fontSize: 12,
                        color: "#64748b",
                      }}
                    >
                      {t.subtitle}
                    </Text>
                    {t.status === "Overdue" && (
                      <Text
                        style={{
                          color: "#ef4444",
                          fontSize: 10,
                          fontWeight: "700",
                          marginTop: 4,
                        }}
                      >
                        {isTa ? "காலாவதியானது" : "OVERDUE"}
                      </Text>
                    )}
                    {t.preparation && t.preparation.length > 0 && (
                      <View
                        style={{
                          backgroundColor: "#f8fafc",
                          padding: 8,
                          borderRadius: 8,
                          marginTop: 8,
                        }}
                      >
                        {t.preparation.map((p, idx) => (
                          <Text
                            key={idx}
                            style={{ fontSize: 11, color: "#64748b" }}
                          >
                            • {p}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {todayEvents.length === 0 && (
              <Text
                style={{
                  textAlign: "center",
                  color: "#64748b",
                  marginVertical: 20,
                }}
              >
                {isTa ? "இந்த நாளில் எந்தப் பணியும் திட்டமிடப்படவில்லை." : "No tasks scheduled for this day."}
              </Text>
            )}
          </View>
        </View>

        {/* 7. Needs Attention (Dynamic) */}
        {needsAttention.length > 0 && (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: 20,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOpacity: 0.03,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <AlertTriangle
                  color="#ef4444"
                  size={24}
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text
                    style={{
                      fontWeight: "800",
                      fontSize: 18,
                      color: "#101828",
                    }}
                  >
                    {isTa ? "கவனம் தேவைப்படுபவை" : "Needs Attention"}
                  </Text>
                  <Text
                    style={{
                      fontWeight: "500",
                      fontSize: 12,
                      color: "#64748b",
                    }}
                  >
                    {needsAttention.length} {isTa ? "பொருட்களுக்கு நடவடிக்கை தேவை" : "items require action"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity>
                <Text
                  style={{
                    fontWeight: "600",
                    fontSize: 13,
                    color: "#0284c7",
                  }}
                >
                  {isTa ? "அனைத்தையும் காண்க" : "View All"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ gap: 16 }}>
              {needsAttention.map((na, i) => (
                <View key={na.id}>
                  <TouchableOpacity 
                    onPress={() => {
                      if (na.category === "Crop") router.push('/crops');
                      else if (na.category === "Livestock") router.push('/livestock');
                      else router.push('/finance');
                    }}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <View style={{ marginRight: 12 }}>
                      {getCategoryIcon(na.category, "#ef4444", 20)}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontWeight: "800",
                          fontSize: 15,
                          color: "#101828",
                          marginBottom: 2,
                        }}
                      >
                        {formatTaskTitle(na.title, isTa)}
                      </Text>
                      <Text
                        style={{
                          fontWeight: "500",
                          fontSize: 12,
                          color: "#64748b",
                        }}
                      >
                        {na.subtitle}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => toggleCompletion(na.id)}
                      style={{
                        backgroundColor:
                          na.status === "Overdue" ? "#fee2e2" : "#fce7f3",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: "700",
                          fontSize: 11,
                          color: na.status === "Overdue" ? "#ef4444" : "#f43f5e",
                        }}
                      >
                        {na.status === "Pending" 
                          ? (isTa ? "முடிக்கவும்" : "Complete It") 
                          : (isTa ? "சரிசெய்யவும்" : "Fix Overdue")}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                  {i < needsAttention.length - 1 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: "#f1f5f9",
                        marginTop: 16,
                      }}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 8. Bottom 2 Cards */}
        <View style={{ flexDirection: "row", gap: 16, marginBottom: 24 }}>
          {/* Tomorrow Preview */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: 20,
              flex: 1,
              shadowColor: "#000",
              shadowOpacity: 0.03,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <CalendarIcon
                color="#101828"
                size={16}
                style={{ marginRight: 8 }}
              />
              <Text
                style={{
                  fontWeight: "800",
                  fontSize: 14,
                  color: "#101828",
                }}
              >
                {isTa ? "நாளை" : "Tomorrow"}
              </Text>
            </View>
            <Text
              style={{
                fontWeight: "500",
                fontSize: 11,
                color: "#64748b",
                marginBottom: 16,
              }}
            >
              {tomorrow}
            </Text>
            <View style={{ gap: 12 }}>
              {events
                .filter((e) => e.date === tomorrow)
                .slice(0, 4)
                .map((e) => (
                  <View
                    key={e.id}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    {getCategoryIcon(
                      e.category,
                      getCategoryColor(e.category),
                      14,
                    )}
                    <Text
                      style={{
                        fontWeight: "600",
                        fontSize: 11,
                        color: "#101828",
                        marginLeft: 8,
                      }}
                      numberOfLines={1}
                    >
                      {formatTaskTitle(e.title, isTa)}
                    </Text>
                  </View>
                ))}
            </View>
          </View>

          {/* Farm Intelligence */}
          <View
            style={{
              backgroundColor: "#f5f3ff",
              borderRadius: 24,
              padding: 20,
              flex: 1,
              shadowColor: "#000",
              shadowOpacity: 0.03,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Sparkles color="#8b5cf6" size={16} style={{ marginRight: 8 }} />
              <Text
                style={{
                  fontWeight: "800",
                  fontSize: 14,
                  color: "#101828",
                }}
              >
                {isTa ? "AI பண்ணை நுண்ணறிவு" : "Intelligence"}
              </Text>
            </View>
            <Text
              style={{
                fontWeight: "500",
                fontSize: 11,
                color: "#4c1d95",
                lineHeight: 18,
                marginBottom: 16,
              }}
            >
              {isTa 
                ? '"நாளை மழை எதிர்பார்க்கப்படுகிறது. புலம் A இன் மண் ஈரம் குறைவாக உள்ளது, எனவே இன்று பாசனத்தை தவிர்க்கலாம்."' 
                : '"Rain is expected tomorrow. Field A\'s soil moisture is low, so you may skip irrigation today."'}
            </Text>
            <TouchableOpacity
              onPress={async () => {
                setIsGeneratingWeather(true);
                await generateWeatherRecommendations(selectedDate, "Rain is expected tomorrow. Field A's soil moisture is low, so you may skip irrigation today.");
                setIsGeneratingWeather(false);
              }}
              disabled={isGeneratingWeather}
              style={{
                backgroundColor: isGeneratingWeather ? "#c4b5fd" : "#8b5cf6",
                paddingVertical: 10,
                borderRadius: 12,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontWeight: "700",
                  fontSize: 12,
                  color: isGeneratingWeather ? "#4c1d95" : "#fff",
                  marginRight: 4,
                }}
              >
                {isGeneratingWeather 
                  ? (isTa ? "பகுப்பாய்வு செய்கிறது..." : "Analyzing...") 
                  : (isTa ? "விவரங்களைக் காண்க" : "View Details")}
              </Text>
              {!isGeneratingWeather && <ChevronRight color="#fff" size={14} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* 9. Plan My Day */}
        <TouchableOpacity
          onPress={async () => {
            setIsGeneratingPlan(true);
            await generateAiPlanForDay(selectedDate);
            setIsGeneratingPlan(false);
          }}
          disabled={isGeneratingPlan}
          style={{
            backgroundColor: isGeneratingPlan ? "#86efac" : "#14532d",
            borderRadius: 24,
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            shadowColor: "#14532d",
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Sparkles color={isGeneratingPlan ? "#14532d" : "#fff"} size={24} style={{ marginRight: 16 }} />
            <View>
              <Text
                style={{
                  fontWeight: "800",
                  fontSize: 18,
                  color: isGeneratingPlan ? "#14532d" : "#fff",
                  marginBottom: 2,
                }}
              >
                {isGeneratingPlan 
                  ? (isTa ? "பண்ணையை பகுப்பாய்வு செய்கிறது..." : "Analyzing Farm...") 
                  : (isTa ? "எனது நாளைத் திட்டமிடு" : "Plan My Day")}
              </Text>
              <Text
                style={{
                  fontWeight: "500",
                  fontSize: 12,
                  color: isGeneratingPlan ? "#14532d" : "rgba(255,255,255,0.8)",
                }}
              >
                {isGeneratingPlan 
                  ? (isTa ? "தனிப்பயன் அட்டவணையை உருவாக்குகிறது" : "Generating custom schedule") 
                  : (isTa ? `${selectedDate}-ற்கான AI-இயக்கப்படும் அட்டவணையைப் பெறுக` : `Get an AI-powered schedule for ${selectedDate}`)}
              </Text>
            </View>
          </View>
          <ChevronRight color={isGeneratingPlan ? "#14532d" : "#fff"} size={24} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
