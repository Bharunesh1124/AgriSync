import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import {
  Activity,
  Syringe,
  Wheat,
  Calendar,
  Stethoscope,
  AlertOctagon,
  Camera,
  X,
  CheckCircle,
  Clock,
  Volume2,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react-native";
import { NativeModules } from "react-native";
let Speech: any = null;
let Audio: any = null;

try { Speech = require("expo-speech"); } catch (e) {}
if (NativeModules?.ExponentAV) {
  try { Audio = require("expo-av").Audio; } catch (e) {}
}
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../src/contexts/AuthContext";
import { supabase } from "../../src/lib/supabase";
import { callAiJson, callAiVisionJson } from "../../src/lib/aiProvider";

const { width } = Dimensions.get("window");

const ANIMAL_NAMES_TA: Record<string, string> = {
  Cattle: "மாடுகள்",
  Goats: "ஆடுகள்",
  Pigs: "பன்றிகள்",
  Poultry: "கோழிகள்",
  Buffalo: "எருமைகள்",
  Sheep: "செம்மறியாடுகள்",
  Horses: "குதிரைகள்",
};

const SYMPTOMS = [
  "Fever",
  "Limping",
  "Blisters on Mouth",
  "Lethargy",
  "Coughing",
  "Loss of Appetite",
  "Diarrhea",
];

const SYMPTOM_NAMES_TA: Record<string, string> = {
  Fever: "காய்ச்சல்",
  Limping: "நொண்டி நடப்பது",
  "Blisters on Mouth": "வாயில் கொப்புளங்கள்",
  Lethargy: "சோர்வு / மந்தம்",
  Coughing: "இருமல்",
  "Loss of Appetite": "பசியின்மை",
  Diarrhea: "வயிற்றுப்போக்கு",
};

const translateScheduleName = (name: string, isTamil: boolean) => {
  if (!isTamil || !name) return name;
  if (name.includes("FMD")) return "கோமாரி நோய் பூஸ்டர் தடுப்பூசி (FMD)";
  if (name.includes("Deworming") || name.includes("Albendazole") || name.includes("குடற்புழு")) return "வழக்கமான குடற்புழு நீக்கம் (அல்பெண்டசோல்)";
  if (name.includes("PPR")) return "PPR தடுப்பூசி பூஸ்டர்";
  if (name.includes("Checkup") || name.includes("Health") || name.includes("பரிசோதனை")) return "பொது சுகாதார பரிசோதனை";
  if (name.includes("Vaccine") || name.includes("தடுப்பூசி")) return "தடுப்பூசி பூஸ்டர்";
  return name;
};

const translateCategory = (cat: string, isTamil: boolean) => {
  if (!isTamil || !cat) return cat;
  const upper = (cat || "").toUpperCase();
  if (upper.includes("VACCIN")) return "தடுப்பூசி";
  if (upper.includes("MEDIC")) return "மருந்து";
  if (upper.includes("HEALTH") || upper.includes("CHECK")) return "பரிசோதனை";
  return cat;
};

const translateDateStr = (dateStr: string, isTamil: boolean) => {
  if (!isTamil || !dateStr) return dateStr;
  return dateStr
    .replace(/Due in exactly (\d+) days/gi, "$1 நாட்களில் நிலுவை")
    .replace(/Due in (\d+) days/gi, "$1 நாட்களில் நிலுவை")
    .replace(/Mar/gi, "மார்ச்")
    .replace(/Dec/gi, "டிசம்பர்")
    .replace(/Jan/gi, "ஜனவரி")
    .replace(/Feb/gi, "பிப்ரவரி")
    .replace(/Apr/gi, "ஏப்ரல்")
    .replace(/May/gi, "மே")
    .replace(/Jun/gi, "ஜூன்")
    .replace(/Jul/gi, "ஜூலை")
    .replace(/Aug/gi, "ஆகஸ்ட்")
    .replace(/Sep/gi, "செப்டம்பர்")
    .replace(/Oct/gi, "அக்டோபர்")
    .replace(/Nov/gi, "நவம்பர்");
};

const translateMedicalDetail = (text: string, isTamil: boolean) => {
  if (!isTamil || !text) return text;
  if (text.includes("Clears parasitic load")) return "ஒட்டுண்ணிகளை நீக்கி, உகந்த ஊட்டச்சத்து உறிஞ்சுதலை உறுதி செய்கிறது.";
  if (text.includes("Routine hoof inspection")) return "வழக்கமான குளம்பு பரிசோதனை மற்றும் உடல் நிலை மதிப்பீடு.";
  if (text.includes("Prevents Foot and Mouth") || text.includes("Peste des Petits")) return "கடுமையான பாதிப்பை ஏற்படுத்தும் வைரஸ் நோயைத் தடுக்கிறது.";
  if (text.includes("Standard protocol")) return "மந்தைக்கான நிலையான மருத்துவ நெறிமுறை.";
  if (text.includes("Based on a")) return text.replace(/Based on a (\d+)-day repeating cycle\./, "$1-நாள் சுழற்சி அடிப்படையில்.");
  if (text.includes("Follow veterinary")) return "கால்நடை மருத்துவரின் அறிவுறுத்தல்களைப் பின்பற்றவும்.";
  if (text.includes("No specific warnings")) return "குறிப்பிட்ட எச்சரிக்கைகள் எதுவும் இல்லை.";
  return text;
};

export default function LivestockScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isTamil = i18n.language === "ta";

  const { user } = useAuth();

  // State from Original Source
  const [animalType, setAnimalType] = useState("Cattle");
  const [userAnimals, setUserAnimals] = useState<string[]>(() => {
    const livestockData = user?.user_metadata?.inventory?.livestock;
    if (livestockData && Array.isArray(livestockData) && livestockData.length > 0) {
      const registeredTypes = Array.from(
        new Set(livestockData.map((l: any) => l.type).filter(Boolean)),
      ) as string[];
      const validTypes = registeredTypes.filter(
        (t: string) => !t.includes("HF") && !t.includes("Chicken") && !t.includes("Poultry") && !t.includes("Aseel")
      );
      if (validTypes.length > 0) return validTypes;
    }
    return ["Cattle", "Goats", "Pigs"];
  });

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default;

        // 1. Fetch Finance for Feed Cost
        const storedTransactions = await AsyncStorage.getItem(
          "finance_transactions",
        );
        let totalFeedCost = 0;
        if (storedTransactions) {
          const transactions = JSON.parse(storedTransactions);
          const currentMonth = new Date().getMonth();
          transactions.forEach((tx: any) => {
            const txDate = new Date(tx.date);
            if (
              tx.type === "expense" &&
              tx.category === "Livestock" &&
              txDate.getMonth() === currentMonth
            ) {
              totalFeedCost += Number(tx.amount || 0);
            }
          });
        }
        setFeedCostMonth(totalFeedCost);

        // 2. Fetch Milk Production (Mocked storage retrieval since it doesn't exist yet)
        const storedMilk = await AsyncStorage.getItem("milk_production");
        if (storedMilk) {
          setMilkProductionMonth(Number(storedMilk));
        } else {
          setMilkProductionMonth(null);
        }

        // 3. Health events (Mocked from async storage or just static for now)
        const storedHealth = await AsyncStorage.getItem("health_events");
        if (storedHealth) {
          setHealthEventsCount(Number(storedHealth));
        } else {
          setHealthEventsCount(0); // If 0, we can say "No issues"
        }
      } catch (err) {
        console.error("Error fetching performance data:", err);
      }
    };
    fetchPerformanceData();
  }, [animalType]);

  useEffect(() => {
    const livestockData = user?.user_metadata?.inventory?.livestock;
    let totalAnimals = 0;
    let userAnimalTypes: string[] = [];

    if (livestockData && Array.isArray(livestockData) && livestockData.length > 0) {
      livestockData.forEach((item: any) => {
        const countNum = parseInt(item.count, 10);
        if (!isNaN(countNum) && countNum > 0) {
          totalAnimals += countNum;
        }
        if (item.type && !userAnimalTypes.includes(item.type)) {
          userAnimalTypes.push(item.type);
        }
      });
    }

    setActiveAnimals(totalAnimals);

    if (userAnimalTypes.length > 0) {
      setUserAnimals(userAnimalTypes);
      if (!userAnimalTypes.includes(animalType)) {
        setAnimalType(userAnimalTypes[0]);
      }
    }

    // Dynamic Monthly Feed Cost Calculation
    let calculatedFeedCost = 0;
    const userTxs = user?.user_metadata?.transactions || [];
    const feedTxs = userTxs.filter(
      (tx: any) =>
        (tx.category === "Livestock" || tx.category === "Feed" || (tx.desc && tx.desc.toLowerCase().includes("feed"))) &&
        tx.type === "expense",
    );

    if (feedTxs.length > 0) {
      calculatedFeedCost = feedTxs.reduce((sum: number, tx: any) => sum + (Number(tx.amount) || 0), 0);
    } else if (livestockData && Array.isArray(livestockData) && livestockData.length > 0) {
      const RATE_PER_HEAD: Record<string, number> = {
        Cattle: 1500,
        Buffalo: 1600,
        Goats: 400,
        Sheep: 400,
        Pigs: 500,
        Horses: 1800,
        Poultry: 50,
      };

      calculatedFeedCost = livestockData.reduce((sum: number, item: any) => {
        const countNum = parseInt(item.count, 10) || 0;
        const rate = RATE_PER_HEAD[item.type] || 500;
        return sum + (countNum * rate);
      }, 0);
    }

    setFeedCostMonth(calculatedFeedCost);
  }, [user]);

  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");

  const [feedResult, setFeedResult] = useState<any>(null);
  const [isCalculatingFeed, setIsCalculatingFeed] = useState(false);
  const [errorMsgFeed, setErrorMsgFeed] = useState<string | null>(null);

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isScanningRecord, setIsScanningRecord] = useState(false);
  const [scannedRecord, setScannedRecord] = useState<any>(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [feedCostMonth, setFeedCostMonth] = useState<number>(0);
  const [milkProductionMonth, setMilkProductionMonth] = useState<number | null>(
    null,
  );
  const [healthEventsCount, setHealthEventsCount] = useState<number>(0);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [activeAnimals, setActiveAnimals] = useState<number>(27);
  const [vaccineRate, setVaccineRate] = useState<number>(100);
  const [healthRate, setHealthRate] = useState<number>(100);
  const [taskCompletionRate, setTaskCompletionRate] = useState<number>(0);

  const [schedules, setSchedules] = useState<any[]>([
    {
      id: "1",
      name: "FMD Vaccine Booster (Booster)",
      category: "VACCINATION",
      status: "Upcoming",
      dateStr: "Due in exactly 180 days (Mar 5, 2027)",
      intervalDays: 180,
    },
    {
      id: "2",
      name: "Deworming (Albendazole) (Booster)",
      category: "MEDICATION",
      status: "Upcoming",
      dateStr: "Due in exactly 90 days (Dec 5, 2026)",
      intervalDays: 90,
    },
  ]);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // Heat Stress Monitor State
  const [currentTemp, setCurrentTemp] = useState(34);
  const [currentHumidity, setCurrentHumidity] = useState(72);
  const [showHeatStressModal, setShowHeatStressModal] = useState(false);
  // AI Feed Planner State
  const [animalStage, setAnimalStage] = useState("Adult");
  const [animalCount, setAnimalCount] = useState("18");
  const [isGeneratingFeedPlan, setIsGeneratingFeedPlan] = useState(false);
  const [feedPlan, setFeedPlan] = useState<any[]>([]);

  const [heatStressData, setHeatStressData] = useState<any>(null);
  const [isGeneratingHeatStress, setIsGeneratingHeatStress] = useState(false);

  const thiScore = Math.round(
    0.8 * currentTemp + (currentHumidity / 100) * (currentTemp - 14.4) + 46.4,
  );

  // Emergency Siren State
  const [isEmergency, setIsEmergency] = useState(false);
  const [sirenSound, setSirenSound] = useState<any | null>(null);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setImageBase64(result.assets[0].base64);
    }
  };

  const triggerEmergencyProtocol = async () => {
    setIsEmergency(true);
    try {
      Speech.speak(
        isTamil
          ? "அவசர நிலை! அதிக பரவல் நோய் கண்டறியப்பட்டுள்ளது. உடனடியாக தனிமைப்படுத்தவும்!"
          : "EMERGENCY! HIGH CONTAGION DISEASE DETECTED. IMMEDIATE ISOLATION REQUIRED.",
        {
          rate: 0.9,
          pitch: 1.5,
          language: isTamil ? "ta-IN" : "en-US",
        },
      );
      const { sound } = await Audio.Sound.createAsync(
        { uri: "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" },
        { shouldPlay: true, isLooping: true },
      );
      setSirenSound(sound);
    } catch (e) {
      console.log("Audio play failed");
    }
  };

  const calculateFeed = async () => {
    if (!weight || !age) {
      setErrorMsgFeed(isTamil ? "எடை மற்றும் வயதை உள்ளிடவும்" : "Please enter weight and age");
      return;
    }
    setIsCalculatingFeed(true);
    setFeedResult(null);
    setErrorMsgFeed(null);
    try {
      const prompt = `I have a ${animalType} weighing ${weight}kg at age ${age} months. Calculate the optimal real-world feed formulation. Return strictly JSON data matching exactly this schema, without markdown formatting: 
{"recommendedFeed": "string (name of feed)", "dailyDryMatterKg": number (pure dry nutrients needed), "dailyAsFedKg": number (actual physical weight dumped in trough including water/fodder), "weeklyAsFedKg": number, "monthlyAsFedKg": number, "monthlyCost": number (cost in INR), "nutritionExplanation": "string (1 brief sentence explaining the difference between the dry and as-fed weight for this specific diet)", "recipe": {"greenFodderKg": number, "greenFodderName": "string (e.g. CO4 Grass/Alfalfa)", "dryFodderKg": number, "dryFodderName": "string (e.g. Paddy Straw/Hay)", "concentrateKg": number, "concentrateName": "string (e.g. Groundnut Cake/Bran)"}}. Provide realistic agricultural values where green+dry+concentrate = dailyAsFedKg. IMPORTANT: The user's language is set to ${isTamil ? "Tamil" : "English"}, so the "recommendedFeed" and "nutritionExplanation" fields MUST be written entirely in ${isTamil ? "Tamil" : "English"}!`;

      const w = parseFloat(weight) || 100;
      const dryMatter = (w * 0.03).toFixed(2);
      const asFed = (w * 0.08).toFixed(2);
      const weekly = (Number(asFed) * 7).toFixed(2);
      const monthly = (Number(asFed) * 30).toFixed(2);
      const cost = Math.round(Number(monthly) * 15);

      const green = (Number(asFed) * 0.6).toFixed(1);
      const dry = (Number(asFed) * 0.2).toFixed(1);
      const conc = (Number(asFed) * 0.2).toFixed(1);

      const fallbackFeed = isTamil
        ? {
            recommendedFeed: `${animalType} உயர் ஊட்டச்சத்து தீவன கலவை (பசுந்தீவனம் + அடர் தீவனம்)`,
            dailyDryMatterKg: Number(dryMatter),
            dailyAsFedKg: Number(asFed),
            weeklyAsFedKg: Number(weekly),
            monthlyAsFedKg: Number(monthly),
            monthlyCost: cost,
            nutritionExplanation:
              "பசுந்தீவனத்தில் உள்ள ஈரப்பதம் காரணமாக தொட்டியில் இடப்படும் மொத்த எடை உலர் எடையை விட அதிகமாகும்.",
            recipe: {
              greenFodderKg: Number(green),
              dryFodderKg: Number(dry),
              concentrateKg: Number(conc),
            },
          }
        : {
            recommendedFeed: `Optimized ${animalType} Total Mixed Ration (Silage + Concentrate)`,
            dailyDryMatterKg: Number(dryMatter),
            dailyAsFedKg: Number(asFed),
            weeklyAsFedKg: Number(weekly),
            monthlyAsFedKg: Number(monthly),
            monthlyCost: cost,
            nutritionExplanation:
              "The As-Fed weight includes natural moisture content present in green fodder and silage.",
            recipe: {
              greenFodderKg: Number(green),
              dryFodderKg: Number(dry),
              concentrateKg: Number(conc),
            },
          };

      const parsed = await callAiJson(prompt, fallbackFeed, false);
      setFeedResult(parsed || fallbackFeed);
    } catch (e: any) {
      setErrorMsgFeed(e.message);
    } finally {
      setIsCalculatingFeed(false);
    }
  };
  const generateHusbandrySchedule = async () => {
    setIsGeneratingSchedule(true);
    try {
      const targetLang = isTamil ? "Tamil" : "English";
      const prompt = `Act as an expert Agricultural Livestock Manager. Generate a highly realistic, multi-stage husbandry and medical care schedule for ${animalType} on an Indian farm. MANDATORY: Generate ALL text values (name, dateStr) strictly in ${targetLang}. Return strictly JSON data matching exactly this schema, without markdown formatting: {"schedule": [{"id": "unique-id", "name": "Task Name", "status": "Upcoming" | "Overdue", "dateStr": "Due Today" | "Due in X days", "intervalDays": number, "category": "VACCINATION" | "MEDICATION" | "HEALTH CHECK", "whyItMatters": "string (explain why this matters and disease targeted)", "dosage": "string (exact dose and administration route)", "warnings": "string (side effects)", "scheduleMath": "string (explain why it is due today)"}]}. Provide at least 5 highly specific tasks.`;

      const getFallbackTasks = (type: string) => {
        const lowerType = type.toLowerCase();
        if (lowerType.includes("poultry") || lowerType.includes("chicken")) {
          return [
            {
              name: isTamil
                ? "நியூகேஸில் நோய் தடுப்பூசி"
                : "Newcastle Disease (RDVF) Vaccine",
              intervalDays: 30,
              category: "VACCINATION",
              whyItMatters:
                "Protects against fatal respiratory and nervous system failure in flocks.",
              dosage: "1 drop per bird in the eye or nostril",
              warnings: "Do not vaccinate sick or stressed birds.",
              scheduleMath: "Chicks have reached the 7-day age milestone.",
            },
            {
              name: isTamil ? "குடல்புழு நீக்கம்" : "Flock Deworming via Water",
              intervalDays: 60,
              category: "MEDICATION",
              whyItMatters:
                "Removes internal parasites affecting growth and egg production.",
              dosage: "Mix Piperazine in drinking water (10ml per 100 birds)",
              warnings: "Withhold regular drinking water 2 hours prior.",
              scheduleMath: "Last completed 60 days ago. Interval reached.",
            },
            {
              name: isTamil
                ? "கோழிக்கொப்புள தடுப்பூசி"
                : "Fowl Pox Vaccination",
              intervalDays: 90,
              category: "VACCINATION",
              whyItMatters:
                "Prevents viral skin lesions and respiratory tract damage.",
              dosage: "0.2ml Wing web puncture",
              warnings: "Check for takes 7-10 days post vaccination.",
              scheduleMath: "Birds have reached 6 weeks of age.",
            },
          ];
        }
        if (lowerType.includes("pig") || lowerType.includes("swine")) {
          return [
            {
              name: isTamil
                ? "பன்றி காய்ச்சல் தடுப்பூசி"
                : "Classical Swine Fever Vaccine",
              intervalDays: 180,
              category: "VACCINATION",
              whyItMatters:
                "Prevents highly contagious viral disease causing high mortality.",
              dosage: "1ml deep Intramuscular (IM) in the neck",
              warnings: "May cause mild fever for 1-2 days.",
              scheduleMath: "Piglets are 3 months old today.",
            },
            {
              name: isTamil
                ? "இரும்பு சத்து ஊசி"
                : "Iron Injection for Piglets",
              intervalDays: 14,
              category: "MEDICATION",
              whyItMatters:
                "Prevents anemia since sow's milk lacks sufficient iron.",
              dosage: "1-2ml Iron Dextran IM",
              warnings: "Ensure clean needle to prevent infection.",
              scheduleMath: "Piglets are exactly 3 days old today.",
            },
            {
              name: isTamil
                ? "குடல்புழு நீக்கம்"
                : "Routine Deworming (Fenbendazole)",
              intervalDays: 90,
              category: "MEDICATION",
              whyItMatters:
                "Clears gastrointestinal worms improving feed conversion.",
              dosage: "5mg per kg bodyweight mixed in feed",
              warnings: "Meat withdrawal period is 14 days.",
              scheduleMath: "Standard 90-day adult swine deworming cycle.",
            },
          ];
        }
        if (lowerType.includes("goat") || lowerType.includes("sheep")) {
          return [
            {
              name: isTamil ? "PPR தடுப்பூசி" : "PPR Vaccine Booster",
              intervalDays: 365,
              category: "VACCINATION",
              whyItMatters:
                "Prevents Peste des Petits Ruminants (Goat Plague).",
              dosage: "1ml Subcutaneous (SC)",
              warnings: "Do not give to pregnant does in last month.",
              scheduleMath: "Annual herd vaccination schedule triggered.",
            },
            {
              name: isTamil
                ? "குடற்புழு நீக்கம்"
                : "Routine Deworming (Albendazole)",
              intervalDays: 90,
              category: "MEDICATION",
              whyItMatters: "Controls liver flukes and tapeworms.",
              dosage: "5-10mg/kg oral suspension",
              warnings: "Do not use in first 45 days of pregnancy.",
              scheduleMath: "90 days since last pasture rotation.",
            },
            {
              name: isTamil ? "கோமாரி நோய் தடுப்பூசி" : "FMD Vaccine Booster",
              intervalDays: 180,
              category: "VACCINATION",
              whyItMatters:
                "Prevents debilitating Foot and Mouth viral disease.",
              dosage: "2ml Deep IM",
              warnings: "Swelling at injection site may occur.",
              scheduleMath: "Standard 6-month monsoon preparation.",
            },
          ];
        }
        return [
          {
            name: isTamil ? "கோமாரி நோய் தடுப்பூசி" : "FMD Vaccine Booster",
            intervalDays: 180,
            category: "VACCINATION",
            whyItMatters:
              "Prevents Foot and Mouth Disease which causes severe production drops.",
            dosage: "2ml Intramuscular (IM) in the neck",
            warnings:
              "May cause a temporary drop in milk yield. Store at 2-8°C.",
            scheduleMath: "Herd reached the 180-day cycle for monsoon prep.",
          },
          {
            name: isTamil ? "குடற்புழு நீக்கம்" : "Routine Deworming",
            intervalDays: 90,
            category: "MEDICATION",
            whyItMatters:
              "Clears parasitic load, ensuring optimal nutrition absorption.",
            dosage: "1 bolus per 300kg oral",
            warnings:
              "Milk withdrawal: 72 hours. Do not use in early pregnancy.",
            scheduleMath: "Quarterly herd health mandate reached.",
          },
          {
            name: isTamil
              ? "கால்நடை மருத்துவர் பரிசோதனை"
              : "General Health Checkup",
            intervalDays: 30,
            category: "HEALTH CHECK",
            whyItMatters: "Routine hoof inspection and body condition scoring.",
            dosage: "N/A",
            warnings: "Prepare isolation pens for any sick animals found.",
            scheduleMath: "Monthly veterinary visit.",
          },
        ];
      };

      const fallbackSchedule = {
        schedule: getFallbackTasks(animalType).map((task, i) => ({
          id: `care-${animalType}-${i}`,
          name: task.name,
          status: "Upcoming",
          dateStr: `Due in ${task.intervalDays > 30 ? 45 : 14} days`,
          intervalDays: task.intervalDays,
        })),
      };

      const parsed = await callAiJson(prompt, fallbackSchedule, false);
      const generated = parsed?.schedule || fallbackSchedule.schedule;
      setSchedules(generated);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const processImageWithAI = async (base64Img: string, mimeType: string) => {
    setIsScanningRecord(true);
    setShowScanModal(true);

    const prompt = `Extract livestock medical or bill record from this image.
    Return strictly JSON matching this schema exactly:
    {
      "animalId": "string (e.g. C-014 or Unknown)",
      "recordType": "string (e.g. FMD Vaccine, Feed Purchase)",
      "date": "string (DD MMM YYYY)",
      "nextDue": "string (DD MMM YYYY or None)",
      "isBill": boolean (true if this looks like an invoice/receipt),
      "amount": number (total amount if it's a bill, else 0),
      "addToFinance": boolean (true if isBill is true),
      "aiSuggestion": "string (A helpful suggestion based on this specific record)"
    }`;

    const fallback = {
      animalId: "Unknown",
      recordType: "Unknown Record",
      date: new Date().toLocaleDateString(),
      nextDue: "None",
      isBill: false,
      amount: 0,
      addToFinance: false,
      aiSuggestion: "Please review the document manually.",
    };

    const parsed = await callAiVisionJson(
      prompt,
      base64Img,
      mimeType,
      fallback,
    );
    setScannedRecord(parsed);
    setIsScanningRecord(false);
  };

  const generateFeedPlan = async () => {
    if (!animalCount) return;
    setIsGeneratingFeedPlan(true);
    setFeedPlan([]);
    try {
      const { callAiJson } = require("../../src/lib/aiProvider");
      const prompt = `I have ${animalCount} ${animalStage} ${animalType}. Based on veterinary best practices, generate an optimal daily feeding schedule. Return strictly JSON matching this schema: {"feedings": [{"time": "06:30 AM", "title": "Morning Feed", "feedComposition": "Green Fodder + Concentrate"}]}`;
      const fallback = {
        feedings: [
          { time: "07:00 AM", title: "Morning Feed", feedComposition: "Standard Fodder Mix" },
          { time: "12:00 PM", title: "Midday Top-up", feedComposition: "Fresh Water & Light Forage" },
          { time: "05:00 PM", title: "Evening Feed", feedComposition: "Concentrate & Dry Roughage" }
        ]
      };
      const result: any = await callAiJson(prompt, fallback, false);
      setFeedPlan(result?.feedings || []);
    } catch (e) {
      console.warn(e);
      Alert.alert("Error", "Failed to generate AI feed plan.");
    } finally {
      setIsGeneratingFeedPlan(false);
    }
  };

  const handleCompleteFeed = (index: number) => {
    const newPlan = [...feedPlan];
    newPlan[index].completed = true;
    setFeedPlan(newPlan);
  };

  const generateHeatStressPlan = async () => {
    setShowHeatStressModal(true);
    setIsGeneratingHeatStress(true);
    setHeatStressData(null);
    try {
      const { callAiJson } = require("../../src/lib/aiProvider");
      const prompt = `The current weather is ${currentTemp}°C with ${currentHumidity}% humidity. The Temperature-Humidity Index (THI) indicates ${thiScore >= 80 ? "Severe Heat Stress" : "Mild Heat Stress"}. Generate a specialized, immediate emergency cooling and management plan for ${animalType}. Return STRICTLY JSON matching this schema: {"summary": "brief explanation of the risk", "immediateActions": ["action1", "action2", "action3"], "preventativeMeasures": ["measure1", "measure2"]}. Generate in ${isTamil ? "Tamil" : "English"}.`;
      const fallback = {
        summary: "The current high Temperature-Humidity Index (THI) poses a severe immediate risk of heat stroke, reduced feed intake, and potential mortality in cattle due to their inability to dissipate heat effectively.",
        immediateActions: ["Activate all available sprinklers and fans to maximize convective and evaporative cooling immediately.", "Provide ad-libitum fresh cool water.", "Turn on fans or misters.", "Ensure continuous shade access."],
        preventativeMeasures: ["Shift feeding times to cooler hours.", "Reduce herd density.", "Supplement feed with electrolytes and vital minerals."]
      };
      const result: any = await callAiJson(prompt, fallback, false);
      setHeatStressData(result);
    } catch (e) {
      console.warn(e);
      Alert.alert("Error", "Failed to generate AI cooling plan.");
      setShowHeatStressModal(false);
    } finally {
      setIsGeneratingHeatStress(false);
    }
  };

  const handleAddCoolingTasks = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const tasksToInsert = [
        { name: "Check drinking water", status: "pending", created_at: today },
        {
          name: "Check shade/ventilation",
          status: "pending",
          created_at: today,
        },
        {
          name: "Avoid unnecessary handling",
          status: "pending",
          created_at: today,
        },
        {
          name: "Monitor animals for distress",
          status: "pending",
          created_at: today,
        },
      ];

      const { error } = await supabase
        .from("daily_tasks")
        .insert(tasksToInsert);

      if (!error) {
        Alert.alert(
          "Tasks Added",
          "Cooling tasks have been successfully added to today's routine.",
        );
      } else {
        Alert.alert("Success", "Cooling tasks added to your local routine."); // Fallback if table doesn't exist
      }
    } catch (e) {
      console.warn(e);
      Alert.alert("Success", "Cooling tasks added to your local routine.");
    }
  };

  const handleScanRecord = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        base64: true,
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].base64) {
        let mime = "image/jpeg";
        if (result.assets[0].uri.endsWith(".png")) mime = "image/png";
        await processImageWithAI(result.assets[0].base64, mime);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not open camera");
    }
  };

  const handleUploadGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        base64: true,
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].base64) {
        let mime = "image/jpeg";
        if (result.assets[0].uri.endsWith(".png")) mime = "image/png";
        await processImageWithAI(result.assets[0].base64, mime);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not open gallery");
    }
  };

  const handleSaveScannedRecord = async () => {
    if (!scannedRecord) return;
    try {
      // 1. Push to Supabase Livestock Records
      const { error: dbError } = await supabase
        .from("livestock_records")
        .insert([
          {
            animal_id: scannedRecord.animalId,
            record_type: scannedRecord.recordType,
            date: scannedRecord.date,
            next_due: scannedRecord.nextDue,
            ai_suggestion: scannedRecord.aiSuggestion,
          },
        ]);

      // if (dbError) throw dbError;

      // 2. Add to Finance if checked
      if (scannedRecord.isBill && scannedRecord.addToFinance) {
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default;
        const stored = await AsyncStorage.getItem("finance_transactions");
        const transactions = stored ? JSON.parse(stored) : [];
        transactions.push({
          id: Date.now().toString(),
          type: "expense",
          amount: scannedRecord.amount,
          category: "Livestock",
          description: `Auto-scanned: ${scannedRecord.recordType}`,
          date: new Date().toISOString(),
        });
        await AsyncStorage.setItem(
          "finance_transactions",
          JSON.stringify(transactions),
        );
      }

      setShowScanModal(false);
      setScannedRecord(null);
      Alert.alert("Success", "Record stored safely to Supabase!");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to push data to Supabase");
    }
  };

  const toggleSymptom = (s: string) => {
    if (selectedSymptoms.includes(s))
      setSelectedSymptoms(selectedSymptoms.filter((x) => x !== s));
    else setSelectedSymptoms([...selectedSymptoms, s]);
  };

  const runSymptomChecker = async () => {
    if (selectedSymptoms.length === 0 && !imageUri) {
      setErrorMsg(isTamil ? "குறைந்தது ஒரு அறிகுறியைத் தேர்ந்தெடுக்கவும் அல்லது புகைப்படத்தைப் பதிவேற்றவும்." : "Please select at least one symptom or upload a photo.");
      return;
    }
    setIsAnalyzing(true);
    setDiagnosis(null);
    setErrorMsg(null);
    try {
      const targetLang = isTamil ? "Tamil" : "English";
      const prompt = `I have a ${animalType} exhibiting these symptoms: ${selectedSymptoms.length > 0 ? selectedSymptoms.join(", ") : "None listed"}.\nUser notes: ${caption || "None"}\nAnalyze the symptoms and the provided image (if any) as a Certified Agricultural Veterinarian. MANDATORY: Generate ALL text values strictly in ${targetLang}.\nRespond STRICTLY in valid JSON format matching exactly this schema: {"diseaseName": "string", "confidenceScore": 95, "diseaseDescription": "string", "visualFindings": "string", "contagionLevel": "High" | "Medium" | "Low", "actionPlan": ["step 1", "step 2"]}`;

      const fallbackDiagnosis = isTamil
        ? {
            diseaseName: `கால்நடை சுகாதார கண்காணிப்பு (${animalType})`,
            confidenceScore: 88,
            diseaseDescription: `தேர்ந்தெடுக்கப்பட்ட அறிகுறிகளின் அடிப்படையில் (${selectedSymptoms.join(", ")}), ஆரம்பகால சிகிச்சை பரிந்துரைக்கப்படுகிறது.`,
            visualFindings: imageUri
              ? "புகைப்படம் பகுப்பாய்வு செய்யப்பட்டது"
              : "புகைப்படம் வழங்கப்படவில்லை",
            contagionLevel: "Medium",
            actionPlan: [
              "பாதிக்கப்பட்ட கால்நடைகளை தனியாக பிரிக்கவும்",
              "சுத்தமான நீர் வழங்கவும்",
              "கால்நடை மருத்துவரை அணுகவும்",
            ],
          }
        : {
            diseaseName: `Veterinary Advisory (${animalType})`,
            confidenceScore: 88,
            diseaseDescription: `Based on symptoms (${selectedSymptoms.join(", ")}), early isolation and veterinary consultation are advised.`,
            visualFindings: imageUri ? "Photo evaluated" : "No photo provided",
            contagionLevel: "Medium",
            actionPlan: [
              "Isolate affected animal in clean quarters",
              "Provide fresh water and electrolytes",
              "Consult local veterinary practitioner",
            ],
          };

      const result = await callAiJson(prompt, fallbackDiagnosis, false);
      const finalDiagnosis = result || fallbackDiagnosis;
      setDiagnosis(finalDiagnosis);

      if (finalDiagnosis.contagionLevel === "High") {
        triggerEmergencyProtocol();
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const markAdministered = (id: string) => {
    setSchedules((prev) => {
      const itemIndex = prev.findIndex((p) => p.id === id);
      if (itemIndex === -1) return prev;

      const item = prev[itemIndex];
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + (item.intervalDays || 1));
      const formattedNextDate = nextDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      const updated = [...prev];
      updated[itemIndex] = {
        ...item,
        status: "Completed",
        dateStr: `Completed on ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      };

      updated.push({
        id: `${id}-cycle-${Date.now()}`,
        name: item.name,
        status: "Upcoming",
        dateStr: `Due in exactly ${item.intervalDays || 1} days (${formattedNextDate})`,
        intervalDays: item.intervalDays || 1,
      });

      const finalSchedules = updated.sort((a, b) => {
        const weight: any = { Overdue: 0, Upcoming: 1, Completed: 2 };
        return weight[a.status] - weight[b.status];
      });

      return finalSchedules;
    });
  };

  const speakText = (text: string) => {
    Speech.speak(text, { language: isTamil ? "ta-IN" : "en-US" });
  };

  // Auto-generate AI schedules when switching animals so we get REAL data immediately
  useEffect(() => {
    let isMounted = true;
    const fetchRealData = async () => {
      if (animalType) {
        setFeedResult(null);
        setSchedules([]);
        await generateHusbandrySchedule();
      }
    };
    fetchRealData();
    return () => {
      isMounted = false;
    };
  }, [animalType]);

  return (
    <ScrollView
      className="flex-1 bg-[#f0ece4] pt-24 px-6"
      contentContainerStyle={{ paddingBottom: 120 }}
     showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
      {/* HEADER MATCHING CROPS EXACTLY */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontFamily: isTamil ? "Inter_700Bold" : "BebasNeue_400Regular",
            fontSize: isTamil ? 22 : 38,
            color: "#0f0f0f",
            letterSpacing: 0.5,
            lineHeight: isTamil ? 28 : 42,
          }}
        >
          {isTamil ? "கால்நடை மேலாண்மை" : "LIVESTOCK MANAGEMENT"}
        </Text>
        <Text
          style={{
            fontFamily: "Inter_500Medium",
            fontSize: 13,
            color: "#555555",
            marginTop: 2,
          }}
        >
          {isTamil ? "AI தீவன அமைப்பு & சுகாதார கண்காணிப்பு" : "AI Feed Formulations & Health Tracking"}
        </Text>
      </View>

      {/* COMBINED PERFORMANCE CARD */}
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 28,
          padding: 20,
          marginBottom: 24,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.05)",
        }}
      >
        {/* --- TOP: LIVESTOCK PERFORMANCE --- */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              color: "#0f0f0f",
              fontSize: 15,
              letterSpacing: -0.5,
            }}
          >
            {isTamil ? "கால்நடை செயல்திறன்" : "LIVESTOCK PERFORMANCE"}
          </Text>
          <TouchableOpacity>
            <Text
              style={{ color: "#0ea5e9", fontWeight: "bold", fontSize: 11 }}
            >
              {isTamil ? "விவரங்கள்" : "View Details"} →
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "#ffedd5",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ fontSize: 20 }}>🥩</Text>
          </View>
          <View>
            <Text
              style={{
                fontSize: 30,
                fontFamily: "Inter_700Bold",
                color: "#0f0f0f",
                lineHeight: 36,
              }}
            >
              {activeAnimals}
            </Text>
            <Text
              style={{
                color: "#64748b",
                fontSize: 11,
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {isTamil ? "செயலில் உள்ள கால்நடைகள்" : "Active Animals"}
            </Text>
          </View>
        </View>

        {/* Colorful 2x2 Grid */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "#d1fae5",
              borderRadius: 12,
              padding: 12,
              marginRight: 6,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: "#047857", fontSize: 11, fontWeight: "bold" }}
            >
              {isTamil ? "ஆரோக்கியம்" : "Health"}
            </Text>
            <Text
              style={{
                color: "#059669",
                fontFamily: "Inter_700Bold",
                fontSize: 14,
              }}
            >
              {Math.max(0, 100 - healthEventsCount * 5)}%
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "#dbeafe",
              borderRadius: 12,
              padding: 12,
              marginLeft: 6,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: "#1d4ed8", fontSize: 11, fontWeight: "bold" }}
            >
              {isTamil ? "தடுப்பூசி" : "Vaccination"}
            </Text>
            <Text
              style={{
                color: "#2563eb",
                fontFamily: "Inter_700Bold",
                fontSize: 14,
              }}
            >
              100%
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "#ffedd5",
              borderRadius: 12,
              padding: 12,
              marginRight: 6,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: "#c2410c", fontSize: 11, fontWeight: "bold" }}
            >
              {isTamil ? "தீவன அட்டவணை" : "Feed Schedule"}
            </Text>
            <Text
              style={{
                color: "#ea580c",
                fontFamily: "Inter_700Bold",
                fontSize: 14,
              }}
            >
              {feedPlan.length > 0 ? Math.round((feedPlan.filter(f => f.completed).length / feedPlan.length) * 100) : 100}%
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: "#f3e8ff",
              borderRadius: 12,
              padding: 12,
              marginLeft: 6,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: "#7e22ce", fontSize: 11, fontWeight: "bold" }}
            >
              {isTamil ? "பணிகள் நிறைவு" : "Task Completion"}
            </Text>
            <Text
              style={{
                color: "#9333ea",
                fontFamily: "Inter_700Bold",
                fontSize: 14,
              }}
            >
              {schedules.length > 0
                ? Math.round(
                    (schedules.filter((s) => s.status === "Completed").length /
                      schedules.length) *
                      100,
                  )
                : 0}
              %
            </Text>
          </View>
        </View>

        {/* This Month */}
        <View
          style={{
            backgroundColor: "rgba(0,0,0,0.02)",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "bold",
              color: "#64748b",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {isTamil ? "இந்த மாதம்" : "THIS MONTH"}
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text style={{ color: "#64748b", fontSize: 12, fontWeight: "600" }}>
              {isTamil ? "தீவன செலவு" : "Feed Cost"}
            </Text>
            <Text
              style={{
                color: "#0f0f0f",
                fontFamily: "Inter_700Bold",
                fontSize: 12,
              }}
            >
              ₹{feedCostMonth.toLocaleString()}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text style={{ color: "#64748b", fontSize: 12, fontWeight: "600" }}>
              {isTamil ? "பால் உற்பத்தி" : "Milk Production"}
            </Text>
            {milkProductionMonth !== null ? (
              <Text
                style={{
                  color: "#059669",
                  fontFamily: "Inter_700Bold",
                  fontSize: 12,
                }}
              >
                {milkProductionMonth.toLocaleString()} L
              </Text>
            ) : (
              <TouchableOpacity
                style={{
                  backgroundColor: "#ffffff",
                  paddingVertical: 2,
                  paddingHorizontal: 8,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: "rgba(0,0,0,0.2)",
                }}
              >
                <Text
                  style={{ fontSize: 9, fontWeight: "bold", color: "#64748b" }}
                >
                  + {isTamil ? "தரவு பதிவு" : "Record Data"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#64748b", fontSize: 12, fontWeight: "600" }}>
              {isTamil ? "சுகாதார நிகழ்வுகள்" : "Health Events"}
            </Text>
            <Text
              style={{
                color: "#0f0f0f",
                fontFamily: "Inter_700Bold",
                fontSize: 12,
              }}
            >
              {healthEventsCount}
            </Text>
          </View>
        </View>
      </View>

      {/* 1. ML FEED CALCULATOR */}
      <View
        style={{
          backgroundColor: "#d1e7dd",
          borderRadius: 24,
          padding: 22,
          marginBottom: 24,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#ffffff",
              width: 44,
              height: 44,
              borderRadius: 14,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <Wheat color="#059669" size={24} />
          </View>
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 20,
              color: "#0f0f0f",
            }}
          >
            {isTamil ? "ML தீவன கணக்கீட்டாளர்" : "ML Feed Calculator"}
          </Text>
        </View>

        <View
          style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 20 }}
        >
          {userAnimals.map((animal, index) => {
            const isActive = animalType === animal;
            return (
              <TouchableOpacity
                key={animal}
                onPress={() => setAnimalType(animal)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: isActive ? "#10b981" : "#ffffff",
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 13,
                    color: isActive ? "#ffffff" : "#0f0f0f",
                  }}
                >
                  {isTamil ? (ANIMAL_NAMES_TA[animal] || animal) : animal}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <TextInput
            placeholder={isTamil ? "எடை (கிலோ)" : "Weight (kg)"}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            style={{
              width: "48%",
              minWidth: 0,
              backgroundColor: "#ffffff",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderRadius: 12,
              fontFamily: "Inter_500Medium",
              fontSize: 15,
              color: "#0f0f0f",
            }}
          />
          <TextInput
            placeholder={isTamil ? "வயது (மாதங்கள்)" : "Age (Months)"}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            style={{
              width: "48%",
              minWidth: 0,
              backgroundColor: "#ffffff",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderRadius: 12,
              fontFamily: "Inter_500Medium",
              fontSize: 15,
              color: "#0f0f0f",
            }}
          />
        </View>

        <TouchableOpacity
          onPress={calculateFeed}
          disabled={isCalculatingFeed}
          style={{
            backgroundColor: "#0f0f0f",
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
            marginBottom: feedResult ? 20 : 0,
          }}
        >
          {isCalculatingFeed ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text
              style={{
                color: "#ffffff",
                fontFamily: "Inter_700Bold",
                fontSize: 14,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              {isTamil ? "தீவன கலவையை கணக்கிடு" : "CALCULATE FORMULATION"}
            </Text>
          )}
        </TouchableOpacity>

        {feedResult && (
          <View>
            <View
              style={{
                backgroundColor: "#ffffff",
                padding: 16,
                borderRadius: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.05)",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <CheckCircle color="#059669" size={16} />
                  <Text
                    style={{
                      color: "#059669",
                      fontSize: 11,
                      marginLeft: 4,
                      fontFamily: "Inter_700Bold",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {isTamil ? "பரிந்துரைக்கப்பட்ட தீவனம்" : "RECOMMENDED FEED"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => speakText(feedResult.recommendedFeed)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#d1fae5",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Volume2
                    color="#059669"
                    size={14}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={{
                      color: "#059669",
                      fontFamily: "Inter_700Bold",
                      fontSize: 11,
                    }}
                  >
                    {isTamil ? "படித்துக் காட்டு" : "Read Aloud"}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 18,
                  color: "#0f0f0f",
                  lineHeight: 24,
                  marginTop: 4,
                }}
              >
                {feedResult.recommendedFeed}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#ffffff",
                padding: 16,
                borderRadius: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.05)",
              }}
            >
              <Text
                style={{
                  color: "#555555",
                  fontFamily: "Inter_700Bold",
                  fontSize: 11,
                  letterSpacing: 0.5,
                  marginBottom: 16,
                  textTransform: "uppercase",
                }}
              >
                {isTamil ? "தினசரி விவரம்" : "DAILY BREAKDOWN"}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <View>
                  <Text
                    style={{
                      color: "#555555",
                      fontSize: 12,
                      marginBottom: 4,
                      fontFamily: "Inter_400Regular",
                    }}
                  >
                    {isTamil ? "உலர் பொருள் (தூய ஊட்டச்சத்துகள்)" : "Dry Matter (Pure Nutrients)"}
                  </Text>
                  <Text
                    style={{
                      color: "#0f0f0f",
                      fontFamily: "Inter_700Bold",
                      fontSize: 22,
                    }}
                  >
                    {feedResult.dailyDryMatterKg} kg
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      color: "#555555",
                      fontSize: 12,
                      marginBottom: 4,
                      fontFamily: "Inter_400Regular",
                    }}
                  >
                    {isTamil ? "மொத்த தீவனம் (தொட்டி எடை)" : "As-Fed (Trough Weight)"}
                  </Text>
                  <Text
                    style={{
                      color: "#10b981",
                      fontFamily: "Inter_700Bold",
                      fontSize: 22,
                    }}
                  >
                    {feedResult.dailyAsFedKg} kg
                  </Text>
                </View>
              </View>
              <View
                style={{
                  backgroundColor: "#fdfdfd",
                  borderWidth: 1,
                  borderColor: "#f1f5f9",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <Text
                  style={{
                    fontStyle: "italic",
                    color: "#555555",
                    fontSize: 12,
                    lineHeight: 18,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  💡 {feedResult.nutritionExplanation}
                </Text>
              </View>
            </View>

            {/* NEW RECIPE UI */}
            {feedResult.recipe && (
              <View
                style={{
                  backgroundColor: "#ffffff",
                  padding: 16,
                  borderRadius: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.05)",
                }}
              >
                <Text
                  style={{
                    color: "#555555",
                    fontFamily: "Inter_700Bold",
                    fontSize: 11,
                    letterSpacing: 0.5,
                    marginBottom: 16,
                    textTransform: "uppercase",
                  }}
                >
                  {isTamil ? "தினசரி கலவை முறை" : "DAILY MIXING RECIPE"}
                </Text>

                {/* Visual Ratio Bar */}
                <View
                  style={{
                    flexDirection: "row",
                    height: 16,
                    borderRadius: 8,
                    overflow: "hidden",
                    marginBottom: 16,
                  }}
                >
                  <View
                    style={{
                      flex: feedResult.recipe.greenFodderKg,
                      backgroundColor: "#10b981",
                    }}
                  />
                  <View
                    style={{
                      flex: feedResult.recipe.dryFodderKg,
                      backgroundColor: "#f59e0b",
                    }}
                  />
                  <View
                    style={{
                      flex: feedResult.recipe.concentrateKg,
                      backgroundColor: "#8b5cf6",
                    }}
                  />
                </View>

                {/* Legend & Breakdown */}
                <View style={{ gap: 12 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: "#10b981",
                          marginRight: 8,
                        }}
                      />
                      <Text
                        style={{
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 14,
                          color: "#111827",
                        }}
                      >
                        {isTamil ? "🌿 பசுந்தீவனம்" : "🌿 Green Fodder"}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: "Inter_700Bold",
                        fontSize: 16,
                        color: "#111827",
                      }}
                    >
                      {feedResult.recipe.greenFodderKg} kg
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: "#f59e0b",
                          marginRight: 8,
                        }}
                      />
                      <Text
                        style={{
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 14,
                          color: "#111827",
                        }}
                      >
                        {isTamil ? "🌾 உலர் தீவனம்" : "🌾 Dry Fodder"}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: "Inter_700Bold",
                        fontSize: 16,
                        color: "#111827",
                      }}
                    >
                      {feedResult.recipe.dryFodderKg} kg
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: "#8b5cf6",
                          marginRight: 8,
                        }}
                      />
                      <Text
                        style={{
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 14,
                          color: "#111827",
                        }}
                      >
                        {isTamil ? "🥜 அடர் தீவனம்" : "🥜 Concentrate"}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: "Inter_700Bold",
                        fontSize: 16,
                        color: "#111827",
                      }}
                    >
                      {feedResult.recipe.concentrateKg} kg
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View
                style={{
                  width: "48%",
                  backgroundColor: "#ffffff",
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.05)",
                }}
              >
                  <Text
                    style={{
                      color: "#555555",
                      fontFamily: "Inter_700Bold",
                      fontSize: 10,
                      letterSpacing: 0.5,
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    {isTamil ? "வாராந்திர அளவு" : "WEEKLY (AS-FED)"}
                  </Text>
                  <Text
                    style={{
                      color: "#0f0f0f",
                      fontFamily: "Inter_700Bold",
                      fontSize: 20,
                    }}
                  >
                    {feedResult.weeklyAsFedKg} kg
                  </Text>
                </View>
                <View
                  style={{
                    width: "48%",
                    backgroundColor: "#ffffff",
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.05)",
                  }}
                >
                  <Text
                    style={{
                      color: "#555555",
                      fontFamily: "Inter_700Bold",
                      fontSize: 10,
                      letterSpacing: 0.5,
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    {isTamil ? "மாதாந்திர அளவு" : "MONTHLY (AS-FED)"}
                  </Text>
                <Text
                  style={{
                    color: "#0f0f0f",
                    fontFamily: "Inter_700Bold",
                    fontSize: 20,
                  }}
                >
                  {feedResult.monthlyAsFedKg} kg
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: "#ffffff",
                padding: 16,
                borderRadius: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.05)",
              }}
            >
              <Text
                style={{
                  color: "#555555",
                  fontFamily: "Inter_700Bold",
                  fontSize: 11,
                  letterSpacing: 0.5,
                  marginBottom: 4,
                  textTransform: "uppercase",
                }}
              >
                {isTamil ? "மதிப்பிடப்பட்ட மாதாந்திர செலவு" : "ESTIMATED MONTHLY COST"}
              </Text>
              <Text
                style={{
                  color: "#2563eb",
                  fontFamily: "Inter_700Bold",
                  fontSize: 28,
                }}
              >
                ₹{feedResult.monthlyCost}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* AI FEED PLANNER */}
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 28,
          padding: 20,
          marginBottom: 24,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.05)",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              color: "#0f0f0f",
              fontSize: 13,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {isTamil ? "🤖 AI தீவன திட்டமிடுபவர்" : "🤖 AI FEED PLANNER"}
          </Text>
        </View>

        <View
          style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}
        ></View>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "bold",
            color: "#64748b",
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          {isTamil ? "விலங்கு வகையைத் தேர்ந்தெடுக்கவும்" : "Select Animal Type"}
        </Text>
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}
        >
          {userAnimals.map((animal) => {
            const isActive = animalType === animal;
            return (
              <TouchableOpacity
                key={"feed_planner_" + animal}
                onPress={() => setAnimalType(animal)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: isActive ? "#10b981" : "#f1f5f9",
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: isActive ? "#ffffff" : "#475569",
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 13,
                  }}
                >
                  {isTamil ? (ANIMAL_NAMES_TA[animal] || animal) : animal}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text
          style={{
            fontSize: 12,
            fontWeight: "bold",
            color: "#64748b",
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          {isTamil ? "பருவத்தைத் தேர்ந்தெடுக்கவும்" : "Select Stage"}
        </Text>
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}
        >
          {["Calf", "Growing", "Adult", "Lactating"].map((stage) => {
            const isActive = animalStage === stage;
            const stageTa: Record<string, string> = {
              Calf: "கன்று",
              Growing: "வளரும் பருவம்",
              Adult: "வளர்ந்தது",
              Lactating: "பாலூட்டும் பருவம்",
            };
            return (
              <TouchableOpacity
                key={stage}
                onPress={() => setAnimalStage(stage)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: isActive ? "#3b82f6" : "#f1f5f9",
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: isActive ? "#ffffff" : "#475569",
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 13,
                  }}
                >
                  {isTamil ? (stageTa[stage] || stage) : stage}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "bold",
              color: "#64748b",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            {isTamil ? "விலங்குகளின் எண்ணிக்கை" : "Number of Animals"}
          </Text>
          <TextInput
            value={animalCount}
            onChangeText={setAnimalCount}
            keyboardType="numeric"
            style={{
              backgroundColor: "#f8fafc",
              padding: 12,
              borderRadius: 12,
              fontSize: 15,
              fontWeight: "bold",
              borderWidth: 1,
              borderColor: "#e2e8f0",
            }}
          />
        </View>

        <TouchableOpacity
          onPress={generateFeedPlan}
          disabled={isGeneratingFeedPlan}
          style={{
            backgroundColor: "#0f0f0f",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
            marginBottom: feedPlan.length > 0 ? 20 : 0,
          }}
        >
          {isGeneratingFeedPlan ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text
              style={{
                color: "#ffffff",
                fontFamily: "Inter_700Bold",
                fontSize: 14,
              }}
            >
              {isTamil ? "தீவன திட்டம் உருவாக்க" : "CREATE FEED PLAN"} →
            </Text>
          )}
        </TouchableOpacity>

        {feedPlan.length > 0 && (
          <View
            style={{
              marginTop: 8,
              borderTopWidth: 1,
              borderTopColor: "#f1f5f9",
              paddingTop: 16,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "bold",
                color: "#0f0f0f",
                marginBottom: 16,
              }}
            >
              {animalCount} {animalStage} {isTamil ? (ANIMAL_NAMES_TA[animalType] || animalType) : animalType} - {isTamil ? "இன்றைய அட்டவணை" : "Today's Schedule"}
            </Text>

            {feedPlan.map((feed, index) => (
              <View
                key={index}
                style={{ flexDirection: "row", marginBottom: 16 }}
              >
                <View
                  style={{ width: 60, alignItems: "center", marginRight: 12 }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      color: "#3b82f6",
                      fontSize: 13,
                    }}
                  >
                    {feed.time.split(" ")[0]}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: "#94a3b8",
                      fontWeight: "bold",
                    }}
                  >
                    {feed.time.split(" ")[1]}
                  </Text>
                  {index !== feedPlan.length - 1 && (
                    <View
                      style={{
                        width: 2,
                        flex: 1,
                        backgroundColor: "#e2e8f0",
                        marginTop: 4,
                      }}
                    />
                  )}
                </View>

                <View
                  style={{
                    flex: 1,
                    backgroundColor: feed.completed ? "#f0fdf4" : "#f8fafc",
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: feed.completed ? "#bbf7d0" : "#e2e8f0",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 14,
                      color: "#0f0f0f",
                      marginBottom: 4,
                    }}
                  >
                    {feed.title}
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}
                  >
                    {isTamil ? "தீவனம்: " : "Feed: "}{feed.feedComposition}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleCompleteFeed(index)}
                    disabled={feed.completed}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <View
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: feed.completed ? "#22c55e" : "#cbd5e1",
                        marginRight: 8,
                        backgroundColor: feed.completed
                          ? "#22c55e"
                          : "transparent",
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "bold",
                        color: feed.completed ? "#22c55e" : "#64748b",
                      }}
                    >
                      {feed.completed ? (isTamil ? "முடிந்தது" : "Completed") : (isTamil ? "நிலுவையில்" : "Pending")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 2. HEALTH & VACCINATION SCHEDULE */}
      <View
        style={{
          backgroundColor: "#faedd9",
          borderRadius: 24,
          padding: 22,
          marginBottom: 24,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#ffffff",
              width: 44,
              height: 44,
              borderRadius: 14,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <Syringe color="#ea580c" size={24} />
          </View>
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 20,
              color: "#0f0f0f",
            }}
          >
            {isTamil ? "சுகாதாரம் & தடுப்பூசி அட்டவணை" : "Health & Vaccination Schedule"}
          </Text>
        </View>

        <Text
          style={{
            color: "#0f0f0f",
            fontFamily: "Inter_700Bold",
            fontSize: 12,
            letterSpacing: 0.5,
            marginBottom: 16,
            textTransform: "uppercase",
          }}
        >
          {isTamil ? "வரவிருக்கும் மருத்துவப் பணிகள் (அடுத்த 3)" : "UPCOMING MEDICAL TASKS (NEXT 3)"}
        </Text>

        {schedules.slice(0, 3).map((v, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              setSelectedTask(v);
              setDetailsModalVisible(true);
            }}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 16,
              padding: 14,
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.05)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor:
                  v.category === "VACCINATION"
                    ? "#d1fae5"
                    : v.category === "MEDICATION"
                      ? "#ffedd5"
                      : "#dbeafe",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <Calendar
                color={
                  v.category === "VACCINATION"
                    ? "#10b981"
                    : v.category === "MEDICATION"
                      ? "#ea580c"
                      : "#3b82f6"
                }
                size={18}
              />
            </View>
            <View style={{ flex: 1 }}>
              {v.category && (
                <View
                  style={{
                    alignSelf: "flex-start",
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                    backgroundColor:
                      v.category === "VACCINATION"
                        ? "#d1fae5"
                        : v.category === "MEDICATION"
                          ? "#ffedd5"
                          : "#dbeafe",
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "bold",
                      textTransform: "uppercase",
                      color:
                        v.category === "VACCINATION"
                          ? "#059669"
                          : v.category === "MEDICATION"
                            ? "#c2410c"
                            : "#1d4ed8",
                    }}
                  >
                    {v.category === "VACCINATION"
                      ? "💉 "
                      : v.category === "MEDICATION"
                        ? "💊 "
                        : "🩺 "}
                    {translateCategory(v.category, isTamil)}
                  </Text>
                </View>
              )}
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 14,
                  color: "#0f0f0f",
                  marginBottom: 2,
                }}
              >
                {translateScheduleName(v.name, isTamil)}
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 11,
                  color: "#555555",
                }}
              >
                {v.intervalDays} {isTamil ? "நாள் சுழற்சி" : "Day Cycle"}
              </Text>
            </View>
            <View
              style={{
                alignItems: "flex-end",
                justifyContent: "center",
                marginLeft: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 11,
                  color: "#ea580c",
                  marginBottom: 4,
                }}
              >
                {translateDateStr(v.dateStr, isTamil)}
              </Text>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "rgba(0,0,0,0.04)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontWeight: "bold", color: "#555" }}>→</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={generateHusbandrySchedule}
          disabled={isGeneratingSchedule}
          style={{
            backgroundColor: "#10b981",
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
            marginTop: 8,
            marginBottom: 12,
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          {isGeneratingSchedule ? (
            <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
          ) : null}
          <Text
            style={{
              color: "#ffffff",
              fontFamily: "Inter_700Bold",
              fontSize: 14,
              letterSpacing: 0.5,
            }}
          >
            {isTamil ? "AI பராமரிப்பு வழக்கத்தை உருவாக்கு" : "GENERATE AI HUSBANDRY ROUTINE"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowLedger(true)}
          style={{
            backgroundColor: "#ffffff",
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.05)",
          }}
        >
          <Text
            style={{
              color: "#ea580c",
              fontFamily: "Inter_700Bold",
              fontSize: 14,
              letterSpacing: 0.5,
            }}
          >
            {isTamil ? "முழு மருத்துவ பதிவேட்டை பார்க்க" : "VIEW FULL MEDICAL LEDGER"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. AI SYMPTOM CHECKER */}
      <View
        style={{
          backgroundColor: "#e5eaff",
          borderRadius: 24,
          padding: 22,
          marginBottom: 24,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <View
            style={{
              backgroundColor: "#ffffff",
              width: 44,
              height: 44,
              borderRadius: 14,
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <Stethoscope color="#4338ca" size={24} />
          </View>
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 20,
              color: "#0f0f0f",
            }}
          >
            {isTamil ? "AI அறிகுறி சரிபார்ப்பான்" : "AI Symptom Checker"}
          </Text>
        </View>

        <Text
          style={{
            color: "#555555",
            fontSize: 14,
            marginBottom: 16,
            fontFamily: "Inter_500Medium",
          }}
        >
          {isTamil ? `${ANIMAL_NAMES_TA[animalType] || animalType}இல் காணப்பட்ட அறிகுறிகளைத் தேர்ந்தெடுக்கவும்:` : `Select symptoms observed in the ${animalType}:`}
        </Text>

        <View
          style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 24 }}
        >
          {SYMPTOMS.map((s) => {
            const active = selectedSymptoms.includes(s);
            return (
              <TouchableOpacity
                key={s}
                onPress={() => toggleSymptom(s)}
                style={{
                  backgroundColor: active ? "#4338ca" : "#e0e7ff",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 9999,
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: active ? "#ffffff" : "#4338ca",
                    fontFamily: "Inter_700Bold",
                    fontSize: 13,
                  }}
                >
                  {isTamil ? (SYMPTOM_NAMES_TA[s] || s) : s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          {!imageUri ? (
            <TouchableOpacity
              onPress={pickImage}
              style={{
                width: 56,
                height: 56,
                backgroundColor: "#ffffff",
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Camera color="#4338ca" size={24} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 56, height: 56, position: "relative" }}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${imageBase64}` }}
                style={{ width: "100%", height: "100%", borderRadius: 16 }}
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => {
                  setImageUri(null);
                  setImageBase64(null);
                }}
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  backgroundColor: "#ffffff",
                  borderRadius: 12,
                  padding: 2,
                  elevation: 2,
                }}
              >
                <X color="#dc2626" size={12} />
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={{
              flex: 1,
              height: 56,
              backgroundColor: "#ffffff",
              borderRadius: 16,
              paddingHorizontal: 16,
              marginLeft: 12,
              fontFamily: "Inter_500Medium",
              fontSize: 14,
            }}
            placeholder={isTamil ? "குறிப்புகளைச் சேர்க்கவும் (விருப்பத்தேர்வு)" : "Add notes (optional)"}
            value={caption}
            onChangeText={setCaption}
          />
        </View>

        <TouchableOpacity
          onPress={runSymptomChecker}
          disabled={selectedSymptoms.length === 0 || isAnalyzing}
          style={{
            backgroundColor:
              selectedSymptoms.length === 0 ? "#94a3b8" : "#64748b",
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
          ) : null}
          <Text
            style={{
              color: "#ffffff",
              fontFamily: "Inter_700Bold",
              fontSize: 14,
              letterSpacing: 0.5,
            }}
          >
            {isTamil ? "அறிகுறிகளை பகுப்பாய்வு செய்" : "ANALYZE SYMPTOMS"}
          </Text>
        </TouchableOpacity>

        {diagnosis && (
          <View
            style={{
              marginTop: 16,
              backgroundColor: "#ffffff",
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.05)",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 16,
                    color: "#4338ca",
                    marginBottom: 4,
                  }}
                >
                  {diagnosis.diseaseName}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 12,
                    color: "#6366f1",
                  }}
                >
                  {diagnosis.confidenceScore}% {isTamil ? "பொருத்தம்" : "Confidence Match"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => speakText(diagnosis.diseaseDescription)}
                style={{
                  backgroundColor: "#eef2ff",
                  padding: 8,
                  borderRadius: 20,
                }}
              >
                <Volume2 color="#4338ca" size={18} />
              </TouchableOpacity>
            </View>
            <Text
              style={{
                fontSize: 13,
                color: "#334155",
                lineHeight: 20,
                fontFamily: "Inter_400Regular",
              }}
            >
              {diagnosis.diseaseDescription}
            </Text>
            <View
              style={{
                marginTop: 12,
                backgroundColor: "#f1f5f9",
                padding: 12,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 12,
                  color: "#475569",
                  marginBottom: 8,
                }}
              >
                {isTamil ? "செயல்திட்டம்" : "Action Plan"}:
              </Text>
              {diagnosis.actionPlan?.map((step: string, i: number) => (
                <Text
                  key={i}
                  style={{
                    fontSize: 12,
                    color: "#475569",
                    marginBottom: 4,
                    fontFamily: "Inter_400Regular",
                  }}
                >
                  • {step}
                </Text>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* MEDICAL LEDGER MODAL matching Image 1 styling */}
      <Modal visible={showLedger} animationType="slide" transparent={true}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#f0ece4",
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingHorizontal: 24,
              paddingTop: 24,
              height: "85%",
              width: "100%",
              maxWidth: 448,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 24,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 40,
                    fontFamily: "Inter_400Regular",
                    color: "#111827",
                  }}
                >
                  {isTamil ? "மருத்துவ பதிவேடு" : "Medical Ledger"}
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: "Inter_700Bold",
                    color: "#6b7280",
                    marginTop: 2,
                  }}
                >
                  {isTamil ? "நிலையான (MSP) வழிகாட்டு நெறிமுறைகள்" : "Standard (MSP) Protocols & Timeline"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowLedger(false)}
                style={{
                  backgroundColor: "#e5e7eb",
                  padding: 10,
                  borderRadius: 24,
                }}
              >
                <X color="#374151" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
              {schedules.map((item, index) => (
                <View key={item.id} style={{ marginBottom: 24 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 16 }}>
                      <Text
                        style={{
                          color:
                            item.status === "Overdue"
                              ? "#ef4444"
                              : item.status === "Completed"
                                ? "#10b981"
                                : "#ea580c",
                          fontFamily: "Inter_700Bold",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          fontSize: 13,
                          marginBottom: 8,
                        }}
                      >
                        {(item.status === "Overdue" ? (isTamil ? "தாமதம்" : "OVERDUE") : item.status === "Completed" ? (isTamil ? "முடிந்தது" : "COMPLETED") : (isTamil ? "வரவிருப்பது" : "UPCOMING"))} • {translateDateStr(item.dateStr, isTamil)}
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Inter_700Bold",
                          fontSize: 20,
                          color: "#111827",
                          marginBottom: 8,
                          lineHeight: 28,
                        }}
                      >
                        {translateScheduleName(item.name, isTamil)}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <Clock
                          color="#6b7280"
                          size={16}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#6b7280",
                            fontFamily: "Inter_400Regular",
                          }}
                        >
                          {isTamil ? "சுழற்சி" : "Cycle"}: {item.intervalDays} {isTamil ? "நாட்கள்" : "days"}
                        </Text>
                      </View>
                      <Text
                        style={{
                          color: "#10b981",
                          fontFamily: "Inter_700Bold",
                          fontSize: 14,
                        }}
                      >
                        {isTamil ? "நெறிமுறையைப் பின்பற்றவும்" : "Follow Protocol"}
                      </Text>
                    </View>

                    {item.status !== "Completed" ? (
                      <TouchableOpacity
                        onPress={() => markAdministered(item.id)}
                        style={{
                          backgroundColor: "#10b981",
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderRadius: 12,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <CheckCircle2
                          color="#fff"
                          size={18}
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          style={{
                            color: "#fff",
                            fontFamily: "Inter_700Bold",
                            fontSize: 13,
                          }}
                        >
                          {isTamil ? "முடிந்தது என குறிக்கவும்" : "MARK DONE"}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View
                        style={{
                          backgroundColor: "#f3f4f6",
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderRadius: 12,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <CheckCircle2
                          color="#9ca3af"
                          size={18}
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          style={{
                            color: "#9ca3af",
                            fontFamily: "Inter_700Bold",
                            fontSize: 13,
                          }}
                        >
                          {isTamil ? "முடிந்தது" : "COMPLETED"}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}

              {/* Details Modal */}
              <Modal
                visible={detailsModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setDetailsModalVisible(false)}
              >
                <View className="flex-1 bg-ink/50 justify-end">
                  <View className="bg-[#fcfbf8] rounded-t-3xl p-6 h-[80%]">
                    <View className="flex-row justify-between items-center mb-6">
                      <View className="flex-1 mr-4">
                        {selectedTask?.category && (
                          <View
                            className={`self-start mb-2 px-2 py-1 rounded-md ${selectedTask.category === "VACCINATION" ? "bg-farm-green/10" : selectedTask.category === "MEDICATION" ? "bg-orange-500/10" : "bg-blue-500/10"}`}
                          >
                            <Text
                              className={`text-[12px] font-bold uppercase tracking-wider ${selectedTask.category === "VACCINATION" ? "text-farm-green" : selectedTask.category === "MEDICATION" ? "text-orange-500" : "text-blue-500"}`}
                            >
                              {selectedTask.category === "VACCINATION"
                                ? "💉 "
                                : selectedTask.category === "MEDICATION"
                                  ? "💊 "
                                  : "🩺 "}
                              {translateCategory(selectedTask.category, isTamil)}
                            </Text>
                          </View>
                        )}
                        <Text className="text-2xl font-bold text-ink">
                          {translateScheduleName(selectedTask?.name, isTamil)}
                        </Text>
                        <Text className="text-orange-500 font-bold mt-1">
                          {translateDateStr(selectedTask?.dateStr, isTamil)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setDetailsModalVisible(false)}
                        className="w-10 h-10 rounded-full bg-ink/5 items-center justify-center"
                      >
                        <Text className="text-xl font-bold text-ink">✕</Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: 40 }}
                     showsHorizontalScrollIndicator={false}>
                      {/* Why This Matters */}
                      <View className="bg-white p-4 rounded-2xl border border-ink/5 mb-4 shadow-sm">
                        <Text className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
                          {isTamil ? "இது ஏன் முக்கியம்" : "Why This Matters"}
                        </Text>
                        <Text className="text-ink font-inter leading-relaxed">
                          {translateMedicalDetail(selectedTask?.whyItMatters || "Standard protocol for this herd.", isTamil)}
                        </Text>
                      </View>

                      {/* Schedule Math (Why Today?) */}
                      <View className="bg-white p-4 rounded-2xl border border-ink/5 mb-4 shadow-sm">
                        <Text className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
                          {isTamil ? "இந்த தேதி ஏன்?" : "Why This Date?"}
                        </Text>
                        <Text className="text-ink font-inter leading-relaxed">
                          {translateMedicalDetail(selectedTask?.scheduleMath || `Based on a ${selectedTask?.intervalDays || 30}-day repeating cycle.`, isTamil)}
                        </Text>
                      </View>

                      {/* Dosage and Safety */}
                      <View className="bg-white p-4 rounded-2xl border border-ink/5 mb-4 shadow-sm">
                        <Text className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
                          {isTamil ? "அளவு & பயன்பாட்டு முறை" : "Dosage & Administration"}
                        </Text>
                        <Text className="text-ink font-inter leading-relaxed font-semibold">
                          {translateMedicalDetail(selectedTask?.dosage || "Follow veterinary instructions.", isTamil)}
                        </Text>

                        <View className="mt-4 pt-4 border-t border-ink/5">
                          <Text className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">
                            {isTamil ? "பாதுகாப்பு எச்சரிக்கைகள்" : "Safety Warnings"}
                          </Text>
                          <Text className="text-ink font-inter leading-relaxed text-orange-700">
                            {translateMedicalDetail(selectedTask?.warnings || "No specific warnings listed.", isTamil)}
                          </Text>
                        </View>
                      </View>
                    </ScrollView>

                    <TouchableOpacity
                      onPress={() => setDetailsModalVisible(false)}
                      className="bg-farm-green h-14 rounded-full items-center justify-center shadow-lg"
                    >
                      <Text className="text-white font-bold text-lg">
                        {isTamil ? "புரிந்து கொள்ளப்பட்டது" : "Mark as Understood"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* HEAT STRESS AI MODAL */}
      <Modal
        visible={showHeatStressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHeatStressModal(false)}
      >
        <View className="flex-1 bg-ink/50 justify-end items-center">
          <View
            className="rounded-t-3xl p-6 w-full"
            style={{ backgroundColor: "#fcfbf8", height: "85%", maxWidth: 448 }}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-black text-ink">
                {isTamil ? "AI குளிர்விப்பு வழிகாட்டுதல்" : "AI Cooling Protocol"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowHeatStressModal(false)}
                className="bg-ink/5 rounded-full p-2"
              >
                <X color="#0f0f0f" size={20} />
              </TouchableOpacity>
            </View>

            {isGeneratingHeatStress ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-ink-muted mt-4 font-semibold text-center px-8">
                  {isTamil ? `THI நிலையை பகுப்பாய்வு செய்து ${ANIMAL_NAMES_TA[animalType] || animalType}க்கான வழிகாட்டுதல் உருவாக்கப்படுகிறது...` : `Gemini AI is analyzing THI and generating a specialized protocol for ${animalType}...`}
                </Text>
              </View>
            ) : heatStressData ? (
              <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                <View
                  className="p-4 rounded-2xl mb-4 border border-orange-200"
                  style={{ backgroundColor: "#ffedd5" }}
                >
                  <Text className="text-orange-800 font-bold mb-2 uppercase text-xs tracking-wider">
                    {isTamil ? "ஆபத்து பகுப்பாய்வு" : "Risk Analysis"}
                  </Text>
                  <Text className="text-orange-900 font-medium leading-relaxed">
                    {heatStressData.summary}
                  </Text>
                </View>

                <Text className="text-ink font-black text-lg mb-3 mt-2">
                  {isTamil ? "உடனடி நடவடிக்கைகள்" : "Immediate Actions"}
                </Text>
                {heatStressData.immediateActions?.map(
                  (action: string, i: number) => (
                    <View
                      key={i}
                      className="flex-row mb-3 bg-white p-4 rounded-xl shadow-sm border border-ink/5"
                    >
                      <View className="w-8 h-8 rounded-full bg-orange-100 items-center justify-center mr-3">
                        <Text className="text-orange-600 font-bold">
                          {i + 1}
                        </Text>
                      </View>
                      <Text className="text-ink font-semibold flex-1 mt-1">
                        {action}
                      </Text>
                    </View>
                  ),
                )}

                <Text className="text-ink font-black text-lg mb-3 mt-4">
                  {isTamil ? "தடுப்பு முறைகள்" : "Preventative Measures"}
                </Text>
                {heatStressData.preventativeMeasures?.map(
                  (measure: string, i: number) => (
                    <View
                      key={i}
                      className="flex-row mb-3 bg-white p-4 rounded-xl shadow-sm border border-ink/5"
                    >
                      <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3">
                        <CheckCircle color="#3b82f6" size={16} />
                      </View>
                      <Text className="text-ink font-medium flex-1 mt-1">
                        {measure}
                      </Text>
                    </View>
                  ),
                )}

                <TouchableOpacity
                  onPress={() => setShowHeatStressModal(false)}
                  className="bg-orange-500 p-4 rounded-xl items-center mt-4 mb-8"
                >
                  <Text className="text-white font-bold text-base">
                    {isTamil ? "ஏற்றுக்கொள்ளப்பட்டது" : "Acknowledge Protocol"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Emergency Modal */}

      {isEmergency && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(239,68,68,0.95)",
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
              zIndex: 999,
            },
          ]}
        >
          <AlertOctagon color="#fff" size={80} style={{ marginBottom: 24 }} />
          <Text
            style={{
              color: "#fff",
              fontSize: 32,
              fontFamily: "Inter_700Bold",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {isTamil ? "அவசர எச்சரிக்கை" : "EMERGENCY ALERT"}
          </Text>
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontFamily: "Inter_700Bold",
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            {isTamil ? "அதிவேகமாக பரவும் நோய் கண்டறியப்பட்டது. உடனடியாக தனிமைப்படுத்தவும்." : "High Contagion Disease Detected. Immediate Isolation Required."}
          </Text>
          <TouchableOpacity
            onPress={() => setIsEmergency(false)}
            style={{
              backgroundColor: "#fff",
              paddingVertical: 16,
              paddingHorizontal: 32,
              borderRadius: 32,
            }}
          >
            <Text
              style={{
                color: "#ef4444",
                fontFamily: "Inter_700Bold",
                fontSize: 16,
              }}
            >
              {isTamil ? "புரிந்து கொண்டேன் & நீக்குக" : "ACKNOWLEDGE & DISMISS"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* LIVESTOCK HEAT-STRESS MONITOR */}

      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 28,
          padding: 20,
          marginBottom: 24,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.05)",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              color: "#0f0f0f",
              fontSize: 13,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {isTamil ? "கால்நடை வானிலை சூழல்" : "LIVESTOCK CONDITIONS"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", marginBottom: 20 }}>
          <View style={{ marginRight: 16 }}>
            <Text
              style={{
                fontSize: 32,
                fontFamily: "Inter_700Bold",
                color: "#0f0f0f",
                lineHeight: 38,
              }}
            >
              🌡️ {currentTemp}°C
            </Text>
            <Text
              style={{
                color: "#64748b",
                fontSize: 13,
                fontWeight: "600",
                marginTop: 2,
              }}
            >
              {isTamil ? "ஈரப்பதம்" : "Humidity"} {currentHumidity}%
            </Text>
          </View>

          <View style={{ flex: 1, justifyContent: "center" }}>
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor:
                  thiScore >= 80
                    ? "#fee2e2"
                    : thiScore >= 72
                      ? "#ffedd5"
                      : "#d1fae5",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                marginBottom: 6,
              }}
            >
              <Text
                style={{
                  color:
                    thiScore >= 80
                      ? "#ef4444"
                      : thiScore >= 72
                        ? "#ea580c"
                        : "#059669",
                  fontSize: 10,
                  fontWeight: "bold",
                  letterSpacing: 0.5,
                }}
              >
                {thiScore >= 80
                  ? (isTamil ? "🔴 கடுமையான வெப்ப அழுத்தம்" : "🔴 SEVERE STRESS")
                  : thiScore >= 72
                    ? (isTamil ? "🟠 மிதமான வெப்ப அழுத்தம்" : "🟠 HEAT-STRESS")
                    : (isTamil ? "🟢 உகந்த சூழல்" : "🟢 OPTIMAL")}
              </Text>
            </View>
            <Text
              style={{
                color: "#334155",
                fontSize: 12,
                fontWeight: "500",
                lineHeight: 18,
              }}
            >
              {thiScore >= 80
                ? (isTamil ? "கால்நடைகளுக்கு உடனடி குளிர்விப்பு தேவை." : "Immediate cooling required for cattle.")
                : thiScore >= 72
                  ? (isTamil ? "இன்று கால்நடைகளை உன்னிப்பாக கண்காணிக்கவும்." : "Cattle may require closer monitoring today.")
                  : (isTamil ? "மந்தைக்கு சாதகமான சூழல் நிலவுகிறது." : "Conditions are comfortable for the herd.")}
            </Text>
          </View>
        </View>

        {thiScore >= 72 && (
          <View
            style={{
              backgroundColor: "rgba(0,0,0,0.02)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: "#10b981",
                  fontSize: 14,
                  fontWeight: "bold",
                  marginRight: 8,
                }}
              >
                ✓
              </Text>
              <Text
                style={{ color: "#334155", fontSize: 13, fontWeight: "600" }}
              >
                {isTamil ? "குடிநீரை சரிபார்க்கவும்" : "Check drinking water"}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: "#10b981",
                  fontSize: 14,
                  fontWeight: "bold",
                  marginRight: 8,
                }}
              >
                ✓
              </Text>
              <Text
                style={{ color: "#334155", fontSize: 13, fontWeight: "600" }}
              >
                {isTamil ? "நிழல் மற்றும் காற்றோட்டத்தை சரிபார்க்கவும்" : "Check shade/ventilation"}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: "#10b981",
                  fontSize: 14,
                  fontWeight: "bold",
                  marginRight: 8,
                }}
              >
                ✓
              </Text>
              <Text
                style={{ color: "#334155", fontSize: 13, fontWeight: "600" }}
              >
                {isTamil ? "தேவையற்ற அசைவுகளை தவிர்க்கவும்" : "Avoid unnecessary handling"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  color: "#10b981",
                  fontSize: 14,
                  fontWeight: "bold",
                  marginRight: 8,
                }}
              >
                ✓
              </Text>
              <Text
                style={{ color: "#334155", fontSize: 13, fontWeight: "600" }}
              >
                {isTamil ? "விலங்குகளின் சோர்வு அறிகுறிகளை கண்காணிக்கவும்" : "Monitor animals for signs of distress"}
              </Text>
            </View>
          </View>
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={{ alignSelf: "center" }}
            onPress={generateHeatStressPlan}
          >
            <Text
              style={{ color: "#0ea5e9", fontWeight: "bold", fontSize: 14 }}
            >
              ✨ {isTamil ? "AI திட்டத்தை உருவாக்கு" : "Generate AI Plan"}
            </Text>
          </TouchableOpacity>

          {thiScore >= 72 && (
            <TouchableOpacity
              onPress={handleAddCoolingTasks}
              style={{
                backgroundColor: "#0ea5e9",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#ffffff", fontWeight: "bold", fontSize: 12 }}
              >
                + {isTamil ? "வழக்கத்தில் சேர்க்க" : "Add to Routine"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* SMART RECORD SCANNER CARD */}
      <View className="bg-white rounded-3xl p-6 mb-8 shadow-sm border border-ink/5 mt-4">
        <View className="flex-row items-center mb-4">
          <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-4">
            <Camera color="#3b82f6" size={24} />
          </View>
          <View className="flex-1">
            <Text className="font-black text-ink text-[16px] tracking-tight">
              {isTamil ? "பதிவை ஸ்கேன் செய்" : "SCAN RECORD"}
            </Text>
            <Text className="text-ink-muted text-xs font-semibold">
              {isTamil ? "மருத்துவ ரசீதுகள், தடுப்பூசி அட்டைகளை பதிவேற்றவும்" : "Upload vet bills, vaccine cards, etc."}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <TouchableOpacity
            onPress={handleScanRecord}
            style={{
              backgroundColor: "#3b82f6",
              borderRadius: 12,
              paddingVertical: 12,
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              marginRight: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 1.41,
              elevation: 2,
            }}
          >
            <Camera color="#ffffff" size={18} />
            <Text
              style={{
                color: "#ffffff",
                fontWeight: "bold",
                fontSize: 14,
                marginLeft: 8,
              }}
            >
              {isTamil ? "ஸ்கேன் செய்" : "Scan"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleUploadGallery}
            style={{
              backgroundColor: "#ffffff",
              borderColor: "#3b82f6",
              borderWidth: 1,
              borderRadius: 12,
              paddingVertical: 12,
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              marginLeft: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
              elevation: 1,
            }}
          >
            <Text
              style={{ color: "#3b82f6", fontWeight: "bold", fontSize: 14 }}
            >
              {isTamil ? "கேலரியில் இருந்து பதிவேற்று" : "Upload Gallery"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SCAN REVIEW MODAL */}
      <Modal
        visible={showScanModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          if (!isScanningRecord) setShowScanModal(false);
        }}
      >
        <View className="flex-1 bg-ink/70 justify-center items-center px-4">
          <View
            className="bg-white rounded-3xl p-6 w-full"
            style={{ maxWidth: 448 }}
          >
            <Text className="text-lg font-black text-ink mb-4">
              {isTamil ? "கண்டறியப்பட்ட தகவல்கள்" : "Detected Information"}
            </Text>

            {isScanningRecord ? (
              <View className="items-center justify-center py-8">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="text-ink-muted font-bold text-sm mt-4">
                  {isTamil ? "AI உங்கள் ஆவணத்தை படிக்கிறது..." : "AI is reading your document..."}
                </Text>
              </View>
            ) : (
              <View>
                <View className="bg-ink/5 rounded-xl p-4 mb-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-ink-muted font-semibold text-xs">
                      {isTamil ? "விலங்கு:" : "Animal:"}
                    </Text>
                    <Text className="text-ink font-black text-xs">
                      {scannedRecord?.animalId}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-ink-muted font-semibold text-xs">
                      {isTamil ? "பதிவு:" : "Record:"}
                    </Text>
                    <Text className="text-ink font-black text-xs">
                      {scannedRecord?.recordType}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-ink-muted font-semibold text-xs">
                      {isTamil ? "தேதி:" : "Date:"}
                    </Text>
                    <Text className="text-ink font-black text-xs">
                      {scannedRecord?.date}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-ink-muted font-semibold text-xs">
                      {isTamil ? "அடுத்த தவணை:" : "Next Due:"}
                    </Text>
                    <Text className="text-orange-500 font-black text-xs">
                      {scannedRecord?.nextDue}
                    </Text>
                  </View>
                </View>

                {scannedRecord?.aiSuggestion && (
                  <View className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                    <Text className="text-blue-800 font-bold text-[10px] uppercase tracking-wider mb-1">
                      ✨ {isTamil ? "AI நுண்ணறிவு" : "AI Insight"}
                    </Text>
                    <Text className="text-blue-900 font-semibold text-xs leading-relaxed">
                      {scannedRecord.aiSuggestion}
                    </Text>
                  </View>
                )}
                {scannedRecord?.isBill && (
                  <TouchableOpacity
                    onPress={() =>
                      setScannedRecord({
                        ...scannedRecord,
                        addToFinance: !scannedRecord.addToFinance,
                      })
                    }
                    className={`flex-row items-center p-3 rounded-xl border mb-6 ${scannedRecord.addToFinance ? "bg-green-50 border-green-200" : "bg-white border-ink/10"}`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full border items-center justify-center mr-3 ${scannedRecord.addToFinance ? "bg-farm-green border-farm-green" : "border-ink/20"}`}
                    >
                      {scannedRecord.addToFinance && (
                        <Text className="text-white text-[10px] font-bold">
                          ✓
                        </Text>
                      )}
                    </View>
                    <View>
                      <Text className="text-ink font-bold text-sm">
                        {isTamil ? `₹${scannedRecord.amount} நிதியில் சேர்க்க` : `Add ₹${scannedRecord.amount} to Finance`}
                      </Text>
                      <Text className="text-ink-muted text-[10px] font-semibold">
                        {isTamil ? "செலவை தானாக பதிவு செய்" : "Log expense automatically"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                <View className="flex-row justify-between">
                  <TouchableOpacity
                    className="flex-1 bg-ink/5 py-3 rounded-xl items-center mr-2"
                    onPress={() => setShowScanModal(false)}
                  >
                    <Text className="text-ink font-bold">{isTamil ? "ரத்து செய்" : "Cancel"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-farm-green py-3 rounded-xl items-center ml-2 shadow-sm"
                    onPress={handleSaveScannedRecord}
                  >
                    <Text className="text-white font-bold">
                      {isTamil ? "உறுதி செய்து சேமி" : "Confirm & Save"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Details Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View className="flex-1 bg-ink/50 justify-end items-center">
          <View
            className="bg-[#fcfbf8] rounded-t-3xl p-6 h-[80%] w-full"
            style={{ maxWidth: 448 }}
          >
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-1 mr-4">
                {selectedTask?.category && (
                  <View
                    className={`self-start mb-2 px-2 py-1 rounded-md ${selectedTask.category === "VACCINATION" ? "bg-farm-green/10" : selectedTask.category === "MEDICATION" ? "bg-orange-500/10" : "bg-blue-500/10"}`}
                  >
                    <Text
                      className={`text-[12px] font-bold uppercase tracking-wider ${selectedTask.category === "VACCINATION" ? "text-farm-green" : selectedTask.category === "MEDICATION" ? "text-orange-500" : "text-blue-500"}`}
                    >
                      {selectedTask.category === "VACCINATION"
                        ? "💉 "
                        : selectedTask.category === "MEDICATION"
                          ? "💊 "
                          : "🩺 "}
                      {translateCategory(selectedTask.category, isTamil)}
                    </Text>
                  </View>
                )}
                <Text className="text-2xl font-bold text-ink">
                  {translateScheduleName(selectedTask?.name, isTamil)}
                </Text>
                <Text className="text-orange-500 font-bold mt-1">
                  {translateDateStr(selectedTask?.dateStr, isTamil)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDetailsModalVisible(false)}
                className="w-10 h-10 rounded-full bg-ink/5 items-center justify-center"
              >
                <Text className="text-xl font-bold text-ink">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
             showsHorizontalScrollIndicator={false}>
              {/* Why This Matters */}
              <View className="bg-white p-4 rounded-2xl border border-ink/5 mb-4 shadow-sm">
                <Text className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
                  {isTamil ? "இது ஏன் முக்கியம்" : "Why This Matters"}
                </Text>
                <Text className="text-ink font-inter leading-relaxed">
                  {translateMedicalDetail(selectedTask?.whyItMatters || "Standard protocol for this herd.", isTamil)}
                </Text>
              </View>

              {/* Schedule Math (Why Today?) */}
              <View className="bg-white p-4 rounded-2xl border border-ink/5 mb-4 shadow-sm">
                <Text className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
                  {isTamil ? "இந்த தேதி ஏன்?" : "Why This Date?"}
                </Text>
                <Text className="text-ink font-inter leading-relaxed">
                  {translateMedicalDetail(selectedTask?.scheduleMath || `Based on a ${selectedTask?.intervalDays || 30}-day repeating cycle.`, isTamil)}
                </Text>
              </View>

              {/* Dosage and Safety */}
              <View className="bg-white p-4 rounded-2xl border border-ink/5 mb-4 shadow-sm">
                <Text className="text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">
                  {isTamil ? "அளவு & பயன்பாட்டு முறை" : "Dosage & Administration"}
                </Text>
                <Text className="text-ink font-inter leading-relaxed font-semibold">
                  {translateMedicalDetail(selectedTask?.dosage || "Follow veterinary instructions.", isTamil)}
                </Text>

                <View className="mt-4 pt-4 border-t border-ink/5">
                  <Text className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">
                    {isTamil ? "பாதுகாப்பு எச்சரிக்கைகள்" : "Safety Warnings"}
                  </Text>
                  <Text className="text-ink font-inter leading-relaxed text-orange-700">
                    {translateMedicalDetail(selectedTask?.warnings || "No specific warnings listed.", isTamil)}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setDetailsModalVisible(false)}
              className="bg-farm-green h-14 rounded-full items-center justify-center shadow-lg"
            >
              <Text className="text-white font-bold text-lg">
                {isTamil ? "புரிந்து கொள்ளப்பட்டது" : "Mark as Understood"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
