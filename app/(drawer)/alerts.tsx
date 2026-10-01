import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from "react-native";
import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Bug,
  Plus,
  ShieldCheck,
  Zap,
  AlertTriangle,
  CloudLightning,
  Volume2,
  Download,
  X,
} from "lucide-react-native";
import * as Speech from "expo-speech";
import * as Print from "expo-print";
import { useAuth } from "../../src/contexts/AuthContext";
import { supabase } from "../../src/lib/supabase";
import { useTranslation } from "react-i18next";
import { callAiJson, getGeminiKeysPool } from "../../src/lib/aiProvider";

type AlertData = {
  id: string;
  title: string;
  severity: "CRITICAL" | "WARNING" | "ADVISORY";
  type: "Pest" | "Disease" | "Weather" | "Livestock";
  description: string;
  spreadVector: string;
  prevention: string;
  emergencyProtocol: string;
  source: string;
};

export default function AlertsScreen() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [radarStatus, setRadarStatus] = useState("ANALYZING...");
  const [radarColor, setRadarColor] = useState("text-ink-muted");
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [farmLocation, setFarmLocation] = useState("Tanjore, Tamil Nadu");
  const [addedTasks, setAddedTasks] = useState<Record<string, boolean>>({});
  const [delegatingId, setDelegatingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchThreats = async () => {
      try {
        setIsAnalyzing(true);
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        let loc = "Tanjore, Tamil Nadu";
        if (currentUser?.user_metadata?.location) {
          loc = currentUser.user_metadata.location;
          setFarmLocation(loc);
        } else {
          setFarmLocation(loc);
        }

        // 1. Get Coordinates
        let lat = 10.7870;
        let lon = 79.1378;
        try {
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1`,
          );
          const geoData = await geoRes.json();
          if (geoData.results && geoData.results.length > 0) {
            lat = geoData.results[0].latitude;
            lon = geoData.results[0].longitude;
          }
        } catch (e) {
          console.warn("Geocoding notice: Using default coordinates.");
        }

        // 2. Fetch Live Weather
        let temp = 31, humidity = 75, wind = 12, rain = 0;
        try {
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation`,
          );
          const wData = await weatherRes.json();
          if (wData?.current) {
            temp = wData.current.temperature_2m ?? 31;
            humidity = wData.current.relative_humidity_2m ?? 75;
            wind = wData.current.wind_speed_10m ?? 12;
            rain = wData.current.precipitation ?? 0;
          }
        } catch (e) {
          console.warn("Weather API notice: Using default metrics.");
        }

        // 3. AI Threat Synthesis via Robust Multi-Key AI Provider
        const targetLanguage = i18n.language === "ta" ? "Tamil" : "English";

        const prompt = `Act as an AgTech Intelligence Engine. The current live weather for a farm in ${loc} is: Temp: ${temp}°C, Humidity: ${humidity}%, Wind: ${wind}km/h, Rain: ${rain}mm.
        Analyze this regional data and generate realistic outbreak alerts. 
        CRITICAL: Focus HEAVILY on cross-state and regional spreading patterns (how diseases are physically moving from one state to another). Do NOT just focus on weather. Include severe infectious biological diseases (viral, bacterial, fungal) that are actively spreading across borders via vectors or animal-to-animal contact. Include threats for BOTH crops AND livestock.
        CRITICAL CONSTRAINT: You are designing for a mobile UI. ALL TEXT MUST BE ULTRA-CONCISE. Use bullet points or short fragments.
        MANDATORY: Generate ALL text values (title, description, spreadVector, prevention, emergencyProtocol, source) strictly in ${targetLanguage}.
        Return ONLY valid JSON matching this schema exactly:
        {
          "radarStatus": "HIGH RISK" | "ELEVATED" | "STABLE",
          "radarColor": "text-red-500" | "text-orange-500" | "text-farm-green",
          "alerts": [
            {
              "id": "unique_string",
              "title": "Short threat title",
              "severity": "CRITICAL" | "WARNING" | "ADVISORY",
              "type": "Pest" | "Disease" | "Weather" | "Livestock",
              "description": "MAX 12 WORDS. Bullet-point summary.",
              "spreadVector": "MAX 8 WORDS. e.g. 'Karnataka ➔ Tamil Nadu'",
              "prevention": "MAX 12 WORDS. Exact step.",
              "emergencyProtocol": "MAX 15 WORDS. Exact chemical & dose.",
              "source": "State Bio-Surveillance"
            }
          ]
        }`;

        const fallbackAlertsData = {
          radarStatus: i18n.language === "ta" ? "உயர் அபாயம்" : "HIGH RISK",
          radarColor: "text-red-500",
          alerts:
            i18n.language === "ta"
              ? [
                  {
                    id: "fallback-1",
                    title: "தோல் கழலை நோய் (Lumpy Skin Disease)",
                    severity: "CRITICAL" as const,
                    type: "Livestock" as const,
                    description:
                      "அண்டை மாநிலங்களில் இருந்து பரவும் கால்நடை வைரஸ் தொற்று.",
                    spreadVector: "கர்நாடகா ➔ தமிழ்நாடு",
                    prevention:
                      "கால்நடைகளை தனிமைப்படுத்தி தடுப்பூசி செலுத்தவும்.",
                    emergencyProtocol:
                      "தடுப்பூசி செலுத்தி கொசுக்களை கட்டுப்படுத்தவும்.",
                    source: "மாநில கால்நடை பராமரிப்பு துறை",
                  },
                  {
                    id: "fallback-2",
                    title: "படைப்புழு தாக்குதல் (Fall Armyworm)",
                    severity: "WARNING" as const,
                    type: "Pest" as const,
                    description:
                      "சோளம் மற்றும் தானிய பயிர்களில் பரவும் படைப்புழுக்கள்.",
                    spreadVector: "பிராந்திய காற்று வழி பரவல்",
                    prevention: "இனிய பொறிகளை வயல்வெளிகளில் வைக்கவும்.",
                    emergencyProtocol: "வேப்ப எண்ணெய் தெளிக்கவும்.",
                    source: "வேளாண் கண்காணிப்பு மையம்",
                  },
                ]
              : [
                  {
                    id: "fallback-1",
                    title: "Lumpy Skin Disease Outbreak",
                    severity: "CRITICAL" as const,
                    type: "Livestock" as const,
                    description:
                      "Infectious viral outbreak spreading across regional borders.",
                    spreadVector: "Karnataka ➔ Tamil Nadu",
                    prevention: "Isolate affected cattle and restrict movement.",
                    emergencyProtocol:
                      "Administer goatpox vaccine and control vector flies.",
                    source: "State Veterinary Dept",
                  },
                  {
                    id: "fallback-2",
                    title: "Fall Armyworm Infestation",
                    severity: "WARNING" as const,
                    type: "Pest" as const,
                    description: "Spreading in maize and sorghum grain crops.",
                    spreadVector: "Regional Wind Vector",
                    prevention: "Deploy pheromone traps at field margins.",
                    emergencyProtocol: "Apply Azadirachtin 1500 ppm spray.",
                    source: "Agri Bio-Surveillance",
                  },
                ],
        };

        const aiResult = await callAiJson<any>(prompt, fallbackAlertsData, false);
        setRadarStatus(aiResult?.radarStatus || fallbackAlertsData.radarStatus);
        setRadarColor(aiResult?.radarColor || fallbackAlertsData.radarColor);
        setAlerts(aiResult?.alerts || fallbackAlertsData.alerts);
      } catch (err) {
        console.warn("Alerts Engine Notice: Fallback used.", err);
      } finally {
        setIsAnalyzing(false);
      }
    };

    fetchThreats();
  }, [i18n.language]);

  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const generateLocalPDFHtml = (alert: AlertData, isTamil: boolean) => {
    const isLivestock =
      alert.type === "Livestock" ||
      alert.title.toLowerCase().includes("disease") ||
      alert.title.toLowerCase().includes("lumpy") ||
      alert.title.toLowerCase().includes("mouth") ||
      alert.title.toLowerCase().includes("flu");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${alert.title} Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Mukta Malar', 'Segoe UI', Roboto, sans-serif; padding: 16px 14px; color: #0f172a; background: #ffffff; line-height: 1.5; margin: 0; width: 100%; box-sizing: border-box; }
          .header { border-bottom: 4px solid #dc2626; padding-bottom: 20px; margin-bottom: 26px; }
          .title { color: #dc2626; font-size: 22px; font-weight: 800; margin: 0 0 6px 0; text-transform: uppercase; letter-spacing: 0.5px; }
          .subtitle { color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .badge-row { margin-top: 12px; display: flex; gap: 10px; }
          .badge { display: inline-block; background: #fee2e2; color: #991b1b; font-weight: 700; font-size: 11px; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; }
          .badge-green { background: #d1fae5; color: #065f46; }
          
          .card { margin-bottom: 22px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; }
          .card-title { color: #0f172a; font-size: 15px; font-weight: 800; margin-bottom: 12px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; }
          .text { font-size: 14px; color: #334155; }
          
          .steps-list { margin: 0; padding-left: 20px; }
          .steps-list li { margin-bottom: 8px; font-size: 14px; color: #1e293b; }

          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          th { background: #1e293b; color: #ffffff; text-align: left; padding: 10px 12px; font-weight: 700; border-radius: 4px; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
          tr:nth-child(even) { background: #f1f5f9; }

          .green-card { border-left: 6px solid #16a34a; background: #f0fdf4; }
          .red-card { border-left: 6px solid #dc2626; background: #fef2f2; }
          .amber-card { border-left: 6px solid #d97706; background: #fffbeb; }

          .footer { margin-top: 40px; border-top: 2px solid #e2e8f0; padding-top: 18px; font-size: 12px; color: #64748b; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="title">${alert.title}</h1>
          <div class="subtitle">${isTamil ? "வேளாண்மை மற்றும் கால்நடை அவசர சிகிச்சை மருத்துவ அறிக்கை" : "EMERGENCY AGRONOMY & VETERINARY CLINICAL PROTOCOL"}</div>
          <div class="badge-row">
            <span class="badge">${isTamil ? "அவசர நிலை:" : "SEVERITY:"} ${alert.severity}</span>
            <span class="badge badge-green">${isTamil ? "பரவல்:" : "TRAJECTORY:"} ${alert.spreadVector}</span>
          </div>
        </div>

        <!-- 1. CLINICAL DIAGNOSIS -->
        <div class="card red-card">
          <div class="card-title" style="color: #991b1b;">${isTamil ? "1. நோய் கண்டறிதல் மற்றும் பரவல் பாதை" : "1. Clinical Diagnosis & Trajectory"}</div>
          <div class="text" style="color: #7f1d1d;">
            <strong>${alert.description}</strong>
            <p style="margin-top: 8px; margin-bottom: 0;"><strong>${isTamil ? "மண்டல பரவல் பாதை:" : "Active Trajectory:"}</strong> ${alert.spreadVector}</p>
          </div>
        </div>

        <!-- 2. IMMEDIATE CONTAINMENT STEPS -->
        <div class="card">
          <div class="card-title">${isTamil ? "2. அவசர 24 மணி நேர கட்டுப்பாடு மற்றும் தடுப்பு நடவடிக்கைகள்" : "2. Immediate 24-Hour Containment Steps"}</div>
          <ol class="steps-list">
            <li><strong>${isTamil ? "கடுமையான தனிமைப்படுத்தல்:" : "Strict Quarantine:"}</strong> ${isTamil ? (isLivestock ? "பாதிக்கப்பட்ட விலங்குகளை குறைந்தது 50 மீட்டர் தொலைவில் உலர்ந்த, காற்றோட்டமான நிழலில் தனிமைப்படுத்தவும்." : "பாதிக்கப்பட்ட பயிர் பகுதிகளை தனிமைப்படுத்தி, ஆரோக்கியமான நிலங்களுக்கு நீர்ப்பாசனத்தை நிறுத்தவும்.") : isLivestock ? "Isolate affected animals at least 50 meters away in dry, ventilated shade." : "Isolate infected crop blocks and stop irrigation flow to healthy plots."}</li>
            <li><strong>${isTamil ? "கிருமி நீக்கம் மற்றும் பூச்சி கட்டுப்பாடு:" : "Disinfection & Vector Control:"}</strong> ${isTamil ? "சுற்றளவை சுற்றி 1% பொட்டாசியம் பெர்மாங்கனேட் அல்லது வேப்ப எண்ணெய் (1500 ppm) கரைசலை தெளிக்கவும்." : "Spray 1% Potassium Permanganate or Neem oil (1500 ppm) solution around perimeters."}</li>
            <li><strong>${isTamil ? "உபகரணங்கள் கிருமி நீக்கம்:" : "Tool Sterilization:"}</strong> ${isTamil ? "சுத்தமான பகுதிக்குள் நுழைவதற்கு முன் அனைத்து காலணிகள், பால் கறக்கும் கருவிகள் மற்றும் விவசாய உபகரணங்களை பிளீச்சிங் பவுடர் கொண்டு சுத்தம் செய்யவும்." : "Clean all footwear, milking gear, and farming implements with bleaching powder before entering clean zones."}</li>
          </ol>
        </div>

        <!-- 3. MEDICAL & DOSAGE TABLE -->
        <div class="card green-card">
          <div class="card-title" style="color: #166534;">${isTamil ? "3. பரிந்துரைக்கப்பட்ட மருத்துவ சிகிச்சை மற்றும் மருந்து அளவு அட்டவணை" : "3. Recommended Medical & Dosage Protocol"}</div>
          <table>
            <thead>
              <tr>
                <th>${isTamil ? "மருந்து / சிகிச்சை" : "Treatment / Chemical"}</th>
                <th>${isTamil ? "பரிந்துரைக்கப்பட்ட அளவு" : "Recommended Dosage"}</th>
                <th>${isTamil ? "நிர்வாக முறை" : "Administration Method"}</th>
                <th>${isTamil ? "அதிர்வெண்" : "Frequency"}</th>
              </tr>
            </thead>
            <tbody>
              ${
                isTamil
                  ? isLivestock
                    ? `
              <tr>
                <td><strong>ஆட்டுக்கம்மை தடுப்பூசி (Goatpox Vaccine)</strong></td>
                <td>1 மி.லி (விலங்குக்கு)</td>
                <td>தோலடி ஊசி (Subcutaneous SC)</td>
                <td>ஒற்றை தடுப்பு டோஸ் (ஆரோக்கியமான மந்தைக்கு)</td>
              </tr>
              <tr>
                <td><strong>மெலோக்சிகாம் + பாராசிட்டமால்</strong></td>
                <td>15 - 20 மி.லி</td>
                <td>தசையூடான ஊசி (Intramuscular IM)</td>
                <td>நாளைக்கு ஒரு முறை (3 நாட்களுக்கு - காய்ச்சல் நிவாரணம்)</td>
              </tr>
              <tr>
                <td><strong>ஆக்ஸிடெட்ராசைக்ளின் LA</strong></td>
                <td>10 கிலோ உடல் எடைகளுக்கு 1 மி.லி</td>
                <td>ஆழ்ந்த தசையூடான ஊசி (Deep IM)</td>
                <td>ஒற்றை டோஸ் (இரண்டாம் நிலை தொற்றை தடுக்க)</td>
              </tr>
              <tr>
                <td><strong>பூச்சி விரட்டி / கிருமி நாசினி தெளிப்பு</strong></td>
                <td>புண்களில் தாராளமாக தெளிக்கவும்</td>
                <td>நேரடி தெளிப்பு (Topical Spray)</td>
                <td>குணமாகும் வரை தினமும் இருமுறை</td>
              </tr>
              `
                    : `
              <tr>
                <td><strong>வேப்ப எண்ணெய் 1500 ppm</strong></td>
                <td>1 லிட்டர் தண்ணீருக்கு 5 மி.லி</td>
                <td>இலைத் தெளிப்பு (Foliar Spray)</td>
                <td>ஒவ்வொரு 5-7 நாட்களுக்கு</td>
              </tr>
              <tr>
                <td><strong>டிரைசைக்ளசோல் 75% WP / எமாமெக்டின்</strong></td>
                <td>ஏக்கருக்கு 120g - 150g</td>
                <td>கை தெளிப்பான் மூலம் தெளித்தல்</td>
                <td>ஒற்றை அவசர பயன்பாடு</td>
              </tr>
              <tr>
                <td><strong>ஒட்டும் முகவர் (Sticker Agent)</strong></td>
                <td>1 லிட்டர் தண்ணீருக்கு 1 மி.லி</td>
                <td>மருந்துடன் கலந்து தெளிக்கவும்</td>
                <td>ஒவ்வொரு தெளிப்பின் போதும்</td>
              </tr>
              `
                  : isLivestock
                    ? `
              <tr>
                <td><strong>Goatpox Vaccine / Booster</strong></td>
                <td>1 ml per animal</td>
                <td>Subcutaneous (SC) injection</td>
                <td>Single preventive dose (Healthy herds)</td>
              </tr>
              <tr>
                <td><strong>Meloxicam + Paracetamol</strong></td>
                <td>15 - 20 ml</td>
                <td>Intramuscular (IM) injection</td>
                <td>Once daily for 3 days (Fever & pain relief)</td>
              </tr>
              <tr>
                <td><strong>Oxytetracycline LA</strong></td>
                <td>1 ml per 10 kg body weight</td>
                <td>Deep IM injection</td>
                <td>Single dose (Prevents secondary infection)</td>
              </tr>
              <tr>
                <td><strong>Fly Repellent / Antiseptic Spray</strong></td>
                <td>Topical spray on lesions</td>
                <td>Direct spray on nodules/wounds</td>
                <td>Twice daily until healed</td>
              </tr>
              `
                    : `
              <tr>
                <td><strong>Azadirachtin / Neem Oil 1500 ppm</strong></td>
                <td>5 ml per liter of water</td>
                <td>Foliar spray on leaves</td>
                <td>Every 5-7 days</td>
              </tr>
              <tr>
                <td><strong>Tricyclazole 75% WP / Emamectin</strong></td>
                <td>120g - 150g per acre</td>
                <td>High-volume knapsack spray</td>
                <td>Single emergency application</td>
              </tr>
              <tr>
                <td><strong>Wetting Agent / Sticker</strong></td>
                <td>1 ml per liter spray solution</td>
                <td>Mix thoroughly with pesticide</td>
                <td>With every chemical spray</td>
              </tr>
              `
              }
            </tbody>
          </table>
        </div>

        <!-- 4. BIOSECURITY & FEED MANAGEMENT -->
        <div class="card amber-card">
          <div class="card-title" style="color: #92400e;">${isTamil ? "4. உயிரியல் பாதுகாப்பு மற்றும் தீவன பராமரிப்பு வழிகாட்டுதல்கள்" : "4. Biosecurity & Feed Care Guidelines"}</div>
          <ul class="steps-list" style="color: #78350f;">
            <li><strong>${isTamil ? "பசுந்தீவன உணவு:" : "Soft Fodder Diet:"}</strong> ${isTamil ? (isLivestock ? "வலிமையை பராமரிக்க புதிய பசுந்தீவனத்துடன் (Co-4 / Co-5) வெல்லம் மற்றும் தாது கலவை (50g/நாள்) கலந்து கொடுக்கவும்." : "நோய்ப்பரவலின் போது அதிக நைட்ரஜன் உரங்களை தவிர்க்கவும்; பொட்டாஷ் உரங்களை இடவும்.") : isLivestock ? "Provide fresh green fodder (Co-4 / Co-5) mixed with jaggery and mineral mixture (50g/day) to maintain strength." : "Avoid high nitrogen fertilizers during outbreak; apply potash to strengthen cell walls."}</li>
            <li><strong>${isTamil ? "நீர் மேலாண்மை & எலக்ட்ரோலைட்:" : "Hydration & Electrolytes:"}</strong> ${isTamil ? (isLivestock ? "நீர்ச்சத்து குறைபாட்டைத் தடுக்க எலக்ட்ரால் பொடி கலந்த சுத்தமான குடிநீரை வழங்கவும்." : "வயல் வாய்க்கால்களில் தேங்கி நிற்கும் தண்ணீரை தவிர்க்கவும்.") : isLivestock ? "Provide clean drinking water with electral powder to prevent dehydration." : "Maintain optimal drainage and avoid standing water in field channels."}</li>
          </ul>
        </div>

        <!-- 5. HELPLINE & SOURCE -->
        <div class="footer">
          <span><strong>${isTamil ? "அதிகாரப்பூர்வ மூலம்:" : "Source:"}</strong> ${alert.source}</span>
          <span><strong>${isTamil ? "கால்நடை அவசர உதவி எண்:" : "Vet Helpline:"}</strong> 1962 / 1800-425-5880</span>
          <span><strong>${isTamil ? "உருவாக்கப்பட்ட தேதி:" : "Generated:"}</strong> ${new Date().toLocaleDateString()}</span>
        </div>
      </body>
      </html>
    `;
  };

  const generateDetailedPDF = async (alert: AlertData) => {
    setGeneratingPdfId(alert.id);
    const isTamil = i18n.language === "ta";

    try {
      const finalHtml = generateLocalPDFHtml(alert, isTamil);
      setPreviewHtml(finalHtml);

      if (Platform.OS === "web" && typeof window !== "undefined") {
        try {
          const printWindow = window.open("", "_blank");
          if (printWindow) {
            printWindow.document.write(finalHtml);
            printWindow.document.close();
            setTimeout(() => {
              printWindow.focus();
              printWindow.print();
            }, 250);
          } else {
            const blob = new Blob([finalHtml], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${alert.title.replace(/[^a-zA-Z0-9]/g, "_")}_Emergency_Report.html`;
            a.click();
          }
        } catch (e) {
          console.warn("Direct print notice:", e);
        }
      } else {
        try {
          await Print.printAsync({ html: finalHtml });
        } catch (e) {
          console.log("Silent print attempt on launch", e);
        }
      }
    } catch (e) {
      console.warn("Generating local fallback PDF report", e);
      const fallbackHtml = generateLocalPDFHtml(alert, isTamil);
      setPreviewHtml(fallbackHtml);
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const handlePrintPdf = async () => {
    if (!previewHtml) return;
    if (Platform.OS === "web") {
      try {
        if (typeof window !== "undefined") {
          const printWindow = window.open("", "_blank");
          if (printWindow) {
            printWindow.document.write(previewHtml);
            printWindow.document.close();
            setTimeout(() => {
              printWindow.focus();
              printWindow.print();
            }, 300);
          } else {
            const blob = new Blob([previewHtml], { type: "text/html" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Outbreak_Emergency_Protocol_Report.html`;
            a.click();
          }
        }
      } catch (e) {
        console.error("Web print error:", e);
      }
    } else {
      try {
        await Print.printAsync({ html: previewHtml });
      } catch (e) {
        console.error("Mobile print error:", e);
      }
    }
  };

  const addToAgenda = async (alert: AlertData) => {
    if (addedTasks[alert.id] || delegatingId === alert.id) return;
    setDelegatingId(alert.id);
    generateDetailedPDF(alert);

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser?.user_metadata) {
        setDelegatingId(null);
        return;
      }

      let workers = currentUser.user_metadata.team_numbers || [];
      if (typeof workers === "string") {
        workers = workers
          .split(",")
          .map((n: string) => ({ name: "Team Member", phone: n.trim() }))
          .filter((w: any) => w.phone);
      }
      if (!Array.isArray(workers)) workers = [];

      let assignedTasks = [];
      if (workers.length > 0) {
        const workerNames = workers
          .map((w: any) => w.name || "Team Member")
          .join(", ");
        const targetLanguage = i18n.language === "ta" ? "Tamil" : "English";

        const prompt = `Break down the following emergency agricultural protocol into 2-3 specific, actionable tasks. Assign each task logically to one of the following available workers: ${workerNames}.
        Protocol: "${alert.prevention}".
        MANDATORY: Generate the task_name strictly in ${targetLanguage}.
        Return ONLY valid JSON matching this schema exactly:
        {
          "tasks": [
            { "task_name": "Short specific task description", "assignee": "Worker Name" }
          ]
        }`;

        const fallbackData = {
          tasks: [
            {
              task_name: alert.prevention,
              assignee: workers[0]?.name || "Team Member",
            },
          ],
        };

        const result = await callAiJson<any>(prompt, fallbackData, false);
        const taskArray = result?.tasks || fallbackData.tasks;

        assignedTasks = taskArray.map((t: any, idx: number) => ({
          id: `alert-${alert.id}-${idx}`,
          name: `[${t.assignee}] ${t.task_name}`,
          type: "EMERGENCY PROTOCOL",
          status: "Upcoming",
          intervalDays: 1,
          dateStr: "URGENT: Due Today",
          resources: "Follow Protocol",
        }));
      } else {
        assignedTasks = [
          {
            id: `alert-${alert.id}`,
            name: `EMERGENCY: ${alert.title}`,
            type: "EMERGENCY PROTOCOL",
            status: "Upcoming",
            intervalDays: 1,
            dateStr: "URGENT: Due Today",
            resources: "Follow Protocol",
          },
        ];
      }

      const isLivestock = alert.type === "Livestock";
      const targetKey = isLivestock ? "vaccines_Cow" : "crops_Wheat";

      const existingTasks = currentUser.user_metadata[targetKey] || [];
      await supabase.auth.updateUser({
        data: { [targetKey]: [...assignedTasks, ...existingTasks] },
      });

      setAddedTasks((prev) => ({ ...prev, [alert.id]: true }));

      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          window.alert(
            "Smart Agenda Updated! AI has delegated emergency tasks to your team.",
          );
        }
      } else {
        Alert.alert(
          "Protocol Initiated",
          "AI has delegated emergency tasks to your team.",
        );
      }
    } catch (e) {
      console.error(e);
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.alert("Failed to initiate protocol.");
      } else {
        Alert.alert("Error", "Failed to initiate protocol.");
      }
    } finally {
      setDelegatingId(null);
    }
  };

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return {
          cardBg: "#dc2626",
          badgeBg: "#991b1b",
          text: "#ffffff",
          iconBg: "#ffffff",
          iconColor: "#dc2626",
        };
      case "WARNING":
        return {
          cardBg: "#ea580c",
          badgeBg: "#9a3412",
          text: "#ffffff",
          iconBg: "#ffffff",
          iconColor: "#ea580c",
        };
      case "ADVISORY":
        return {
          cardBg: "#d97706",
          badgeBg: "#78350f",
          text: "#ffffff",
          iconBg: "#ffffff",
          iconColor: "#d97706",
        };
      default:
        return {
          cardBg: "#0f0f0f",
          badgeBg: "#333333",
          text: "#ffffff",
          iconBg: "#ffffff",
          iconColor: "#0f0f0f",
        };
    }
  };

  const getTypeIcon = (type: string, color: string) => {
    switch (type) {
      case "Pest":
        return <Bug color={color} size={22} />;
      case "Disease":
        return <ShieldAlert color={color} size={22} />;
      case "Weather":
        return <CloudLightning color={color} size={22} />;
      case "Livestock":
        return <Zap color={color} size={22} />;
      default:
        return <AlertTriangle color={color} size={22} />;
    }
  };

  const renderAlertCard = (alert: AlertData) => {
    const colors = getSeverityColors(alert.severity);
    const cardPastelBg =
      alert.severity === "CRITICAL"
        ? "#fee2e2"
        : alert.severity === "WARNING"
          ? "#f8ead6"
          : "#d1e7dd";

    return (
      <View
        key={alert.id}
        style={{
          backgroundColor: cardPastelBg,
          borderRadius: 24,
          padding: 22,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.9)",
          shadowColor: "#000",
          shadowOpacity: 0.03,
          shadowRadius: 8,
          elevation: 1,
        }}
      >
        {/* Alert Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flex: 1,
              paddingRight: 8,
            }}
          >
            <View
              style={{
                backgroundColor: "#ffffff",
                padding: 8,
                borderRadius: 14,
                marginRight: 12,
              }}
            >
              {getTypeIcon(alert.type, colors.iconColor)}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 18,
                  color: "#0f0f0f",
                  lineHeight: 22,
                }}
              >
                {alert.title}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 9999,
                backgroundColor:
                  alert.severity === "CRITICAL"
                    ? "#dc2626"
                    : alert.severity === "WARNING"
                      ? "#ea580c"
                      : "#10b981",
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 10,
                  color: "#ffffff",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {alert.severity}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                try {
                  Speech.stop();
                  const textToRead = `${alert.title}. ${alert.description}. Prevention protocol: ${alert.prevention}. Emergency protocol: ${alert.emergencyProtocol}`;
                  Speech.speak(textToRead, {
                    language: i18n.language === "ta" ? "ta-IN" : "en-US",
                    pitch: 1.0,
                    rate: 0.9,
                  });
                } catch (e) {
                  console.warn("Speech notice:", e);
                }
              }}
              style={{
                backgroundColor: "#ffffff",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 9999,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Volume2 color="#0f0f0f" size={12} />
              <Text
                style={{
                  color: "#0f0f0f",
                  fontSize: 10,
                  fontFamily: "Inter_700Bold",
                  marginLeft: 4,
                }}
              >
                Read Aloud
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Context */}
        <Text
          style={{
            fontFamily: "Inter_500Medium",
            fontSize: 13,
            color: "#555555",
            lineHeight: 18,
            marginBottom: 14,
          }}
        >
          {alert.description}
        </Text>

        {/* Spread Vector */}
        <View
          style={{
            backgroundColor: "#ffffff",
            padding: 12,
            borderRadius: 14,
            marginBottom: 14,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.05)",
          }}
        >
          <ShieldAlert color="#ea580c" size={18} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 10,
                color: "#555555",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {t("spread_trajectory")}
            </Text>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 13,
                color: "#0f0f0f",
                marginTop: 1,
              }}
            >
              {alert.spreadVector}
            </Text>
          </View>
        </View>

        {/* Actionable Remediation Workflow */}
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 16,
            padding: 16,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.05)",
          }}
        >
          <Text
            style={{
              color: "#10b981",
              fontSize: 10,
              fontFamily: "Inter_700Bold",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 2,
            }}
          >
            {t("prevention")}
          </Text>
          <Text
            style={{
              color: "#0f0f0f",
              fontFamily: "Inter_700Bold",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            {alert.prevention}
          </Text>

          <Text
            style={{
              color: "#ea580c",
              fontSize: 10,
              fontFamily: "Inter_700Bold",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 2,
            }}
          >
            {t("emergency_protocol")}
          </Text>
          <Text
            style={{
              color: "#0f0f0f",
              fontFamily: "Inter_700Bold",
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {alert.emergencyProtocol}
          </Text>

          <TouchableOpacity
            onPress={() => addToAgenda(alert)}
            disabled={addedTasks[alert.id] || delegatingId === alert.id}
            style={{
              height: 48,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: addedTasks[alert.id] ? "#10b981" : "#0f0f0f",
              opacity: delegatingId === alert.id ? 0.8 : 1,
            }}
          >
            {delegatingId === alert.id ? (
              <>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text
                  style={{
                    color: "#ffffff",
                    fontFamily: "Inter_700Bold",
                    fontSize: 13,
                    marginLeft: 8,
                    textTransform: "uppercase",
                  }}
                >
                  {t("delegating_tasks")}
                </Text>
              </>
            ) : addedTasks[alert.id] ? (
              <>
                <ShieldCheck color="#ffffff" size={18} />
                <Text
                  style={{
                    color: "#ffffff",
                    fontFamily: "Inter_700Bold",
                    fontSize: 13,
                    marginLeft: 8,
                    textTransform: "uppercase",
                  }}
                >
                  {t("protocol_initiated")}
                </Text>
              </>
            ) : (
              <>
                <Plus color="#10b981" size={18} />
                <Text
                  style={{
                    color: "#10b981",
                    fontFamily: "Inter_700Bold",
                    fontSize: 13,
                    marginLeft: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {t("initiate_protocol")}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => generateDetailedPDF(alert)}
            disabled={generatingPdfId === alert.id}
            style={{
              height: 48,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
              borderWidth: 1,
              borderColor: "#0f0f0f",
              marginTop: 10,
              opacity: generatingPdfId === alert.id ? 0.5 : 1,
            }}
          >
            {generatingPdfId === alert.id ? (
              <>
                <ActivityIndicator color="#0f0f0f" size="small" />
                <Text
                  style={{
                    color: "#0f0f0f",
                    fontFamily: "Inter_700Bold",
                    fontSize: 13,
                    marginLeft: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {i18n.language === "ta" ? "அறிக்கை உருவாக்கப்படுகிறது..." : "GENERATING DETAILED REPORT..."}
                </Text>
              </>
            ) : (
              <>
                <Download color="#0f0f0f" size={18} />
                <Text
                  style={{
                    color: "#0f0f0f",
                    fontFamily: "Inter_700Bold",
                    fontSize: 13,
                    marginLeft: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {i18n.language === "ta" ? "அவசர PDF அறிக்கை பதிவிறக்கு" : "Export PDF Report"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingTop: 6,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontFamily: "Inter_700Bold",
              color: "#888888",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {t("source")}: {alert.source}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f0ece4", paddingTop: 80, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontFamily:
              i18n.language === "ta" ? "Inter_700Bold" : "BebasNeue_400Regular",
            fontSize: i18n.language === "ta" ? 22 : 38,
            color: "#0f0f0f",
            letterSpacing: 0.5,
            lineHeight: i18n.language === "ta" ? 28 : 42,
          }}
        >
          {t("outbreak_alerts")}
        </Text>
        <Text
          style={{
            fontFamily: "Inter_500Medium",
            fontSize: 13,
            color: "#555555",
            marginTop: 2,
          }}
        >
          {farmLocation} • {t("early_warning_system")}
        </Text>
      </View>

      {/* 1. Outbreak Radar (Pastel Sky Blue Panel) */}
      <View
        style={{
          backgroundColor: "#e0f2fe",
          borderRadius: 24,
          padding: 22,
          marginBottom: 24,
          alignItems: "center",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.9)",
          shadowColor: "#000",
          shadowOpacity: 0.03,
          shadowRadius: 8,
          elevation: 1,
        }}
      >
        <View style={{ marginBottom: 8 }}>
          {isAnalyzing ? (
            <ActivityIndicator size="large" color="#0284c7" />
          ) : (
            <Zap
              color={
                radarStatus === "HIGH RISK" || radarStatus.includes("அபாயம்")
                  ? "#ef4444"
                  : radarStatus === "STABLE"
                    ? "#10b981"
                    : "#ea580c"
              }
              size={44}
            />
          )}
        </View>
        <Text
          style={{
            color: "#555555",
            fontSize: 11,
            fontFamily: "Inter_700Bold",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginTop: 4,
          }}
        >
          {t("regional_threat_level")}
        </Text>
        <Text
          style={{
            fontFamily: i18n.language === "ta" ? "Inter_700Bold" : "BebasNeue_400Regular",
            fontSize: i18n.language === "ta" ? 32 : 44,
            color:
              radarStatus === "HIGH RISK" || radarStatus.includes("அபாயம்")
                ? "#dc2626"
                : radarStatus === "STABLE"
                  ? "#10b981"
                  : "#ea580c",
            lineHeight: 46,
          }}
        >
          {radarStatus}
        </Text>
        <Text
          style={{
            color: "#555555",
            textAlign: "center",
            fontSize: 12,
            fontFamily: "Inter_500Medium",
            marginTop: 6,
            paddingHorizontal: 12,
          }}
        >
          {t("ai_powered_radar")}
        </Text>
      </View>

      {/* 2. Severity Board (Alert Feed) */}
      <Text style={{ fontFamily: i18n.language === "ta" ? "Inter_700Bold" : "BebasNeue_400Regular", fontSize: 26, color: "#0f0f0f", marginBottom: 16 }}>
        {t("threat_breakdown")}
      </Text>

      {isAnalyzing ? (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <ActivityIndicator size="large" color="#0f0f0f" />
          <Text style={{ color: "#555555", fontWeight: "700", marginTop: 12 }}>
            {t("scanning_data")}
          </Text>
        </View>
      ) : (
        <>
          {/* CRITICAL SECTION */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: "#dc2626", fontWeight: "700", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(220, 38, 38, 0.2)", paddingBottom: 4 }}>
              {t("critical_threats")}
            </Text>
            {alerts.filter((a) => a.severity === "CRITICAL").length === 0 ? (
              <Text style={{ color: "#555555", fontSize: 12, fontStyle: "italic" }}>
                {t("no_critical_threats")}
              </Text>
            ) : (
              alerts
                .filter((a) => a.severity === "CRITICAL")
                .map((alert) => renderAlertCard(alert))
            )}
          </View>

          {/* WARNING SECTION */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: "#ea580c", fontWeight: "700", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(234, 88, 12, 0.2)", paddingBottom: 4 }}>
              {t("warning_threats")}
            </Text>
            {alerts.filter((a) => a.severity === "WARNING").length === 0 ? (
              <Text style={{ color: "#555555", fontSize: 12, fontStyle: "italic" }}>
                {t("no_warning_threats")}
              </Text>
            ) : (
              alerts
                .filter((a) => a.severity === "WARNING")
                .map((alert) => renderAlertCard(alert))
            )}
          </View>

          {/* ADVISORY SECTION */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: "#ca8a04", fontWeight: "700", fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(202, 138, 4, 0.2)", paddingBottom: 4 }}>
              {t("advisory_threats")}
            </Text>
            {alerts.filter((a) => a.severity === "ADVISORY").length === 0 ? (
              <Text style={{ color: "#555555", fontSize: 12, fontStyle: "italic" }}>
                {t("no_advisory_threats")}
              </Text>
            ) : (
              alerts
                .filter((a) => a.severity === "ADVISORY")
                .map((alert) => renderAlertCard(alert))
            )}
          </View>
        </>
      )}

      <Modal
        visible={!!previewHtml}
        animationType="slide"
        transparent
        onRequestClose={() => setPreviewHtml(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
            }}
            activeOpacity={1}
            onPress={() => setPreviewHtml(null)}
          />
          <View
            style={{
              width: "100%",
              maxWidth: 480,
              height: "92%",
              backgroundColor: "#ffffff",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            {/* Drag Handle Indicator */}
            <View
              style={{
                alignItems: "center",
                paddingTop: 10,
                paddingBottom: 4,
                backgroundColor: "#ffffff",
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#cbd5e1",
                }}
              />
            </View>

            {/* Header */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingBottom: 14,
                paddingTop: 6,
                borderBottomWidth: 1,
                borderBottomColor: "#f1f5f9",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 17,
                    color: "#0f172a",
                  }}
                >
                  {i18n.language === "ta"
                    ? "அறிக்கை முன்னோட்டம்"
                    : "Report Preview"}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 12,
                    color: "#64748b",
                    marginTop: 2,
                  }}
                >
                  {i18n.language === "ta"
                    ? "பதிவிறக்கம் செய்ய அல்லது அச்சிடலாம்"
                    : "Ready to print or download PDF"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPreviewHtml(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#f1f5f9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X color="#475569" size={18} />
              </TouchableOpacity>
            </View>

            {/* Content Body */}
            <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
              {Platform.OS === "web" ? (
                <iframe
                  srcDoc={previewHtml || ""}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title="Emergency Report Preview"
                />
              ) : (
                <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      color: "#64748b",
                      textAlign: "center",
                      marginBottom: 12,
                    }}
                  >
                    {i18n.language === "ta"
                      ? "அறிக்கை தயாராக உள்ளது. அச்சிட அல்லது பதிவிறக்க கீழே உள்ள பொத்தானை கிளிக் செய்யவும்."
                      : "Report generated successfully. Click below to print or download as PDF."}
                  </Text>
                </ScrollView>
              )}
            </View>

            {/* Bottom Action Bar */}
            <View
              style={{
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: "#e2e8f0",
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                backgroundColor: "#ffffff",
              }}
            >
              <TouchableOpacity
                onPress={() => setPreviewHtml(null)}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#cbd5e1",
                  backgroundColor: "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 14,
                    color: "#475569",
                  }}
                >
                  {i18n.language === "ta" ? "மூடுக" : "Cancel"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePrintPdf}
                style={{
                  flex: 2,
                  backgroundColor: "#dc2626",
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#dc2626",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Download
                  color="#ffffff"
                  size={18}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: "#ffffff",
                    fontFamily: "Inter_700Bold",
                    fontSize: 14,
                  }}
                >
                  {i18n.language === "ta"
                    ? "அச்சிடுக & பதிவிறக்குக"
                    : "Print & Download PDF"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 48 }} />
    </ScrollView>
  );
}
