import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../src/contexts/AuthContext";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Image as RNImage,
  Dimensions,
  Linking,
} from "react-native";
import React, { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../src/lib/supabase";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Camera,
  Mic,
  Plus,
  Clock,
  Bell,
  Landmark,
  Briefcase,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Truck,
  MapPin,
  Send,
  Target,
  Calendar,
  CheckCircle,
  FileText,
  Download,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  X,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowDownRight,
  Menu,
  PenTool,
  BarChart2,
  Check,
  ChevronUp,
  RefreshCw,
  Banknote,
  User,
  Leaf,
} from "lucide-react-native";

const { width, height } = Dimensions.get("window");

const DEFAULT_CROP_MARKETS: Record<string, any> = {
  Wheat: {
    mandis: [
      {
        name: "Dindigul Gandhi Market",
        price: "₹29/kg",
        transp: "-₹0.5",
        net: "₹28.50/kg",
      },
      {
        name: "Oddanchatram Vegetable Market",
        price: "₹28.5/kg",
        transp: "-₹1.5",
        net: "₹27.00/kg",
      },
      {
        name: "Palani APMC",
        price: "₹31/kg",
        transp: "-₹2.0",
        net: "₹29.00/kg",
      },
    ],
    currentPrice: "₹29/kg",
    storageCost: "₹0.80/kg/month",
    sellNowValue: "₹1.74L",
    store30DaysValue: "₹2.10L",
    storePriceText: "Store 30 days (at ₹35/kg)",
    aiInterpretation: "Tap here to get a deep AI market analysis and recommendation.",
  },
  Rice: {
    mandis: [
      {
        name: "Dindigul Gandhi Market",
        price: "₹34/kg",
        transp: "-₹0.5",
        net: "₹33.50/kg",
      },
      {
        name: "Madurai Mattuthavani",
        price: "₹36/kg",
        transp: "-₹1.5",
        net: "₹34.50/kg",
      },
      {
        name: "Local Rice Mill",
        price: "₹35.5/kg",
        transp: "-₹0.2",
        net: "₹35.30/kg",
      },
    ],
    currentPrice: "₹34/kg",
    storageCost: "₹0.90/kg/month",
    sellNowValue: "₹2.04L",
    store30DaysValue: "₹2.40L",
    storePriceText: "Store 30 days (at ₹40/kg)",
    aiInterpretation: "Tap here to get a deep AI market analysis and recommendation.",
  },
  Cotton: {
    mandis: [
      {
        name: "Dindigul Cotton Market",
        price: "₹62/kg",
        transp: "-₹0.5",
        net: "₹61.50/kg",
      },
      {
        name: "Rajapalayam",
        price: "₹60/kg",
        transp: "-₹2.0",
        net: "₹58.00/kg",
      },
      {
        name: "Theni Mandi",
        price: "₹61.5/kg",
        transp: "-₹1.5",
        net: "₹60.00/kg",
      },
    ],
    currentPrice: "₹62/kg",
    storageCost: "₹1.20/kg/month",
    sellNowValue: "₹3.72L",
    store30DaysValue: "₹4.20L",
    storePriceText: "Store 30 days (at ₹70/kg)",
    aiInterpretation: "Tap here to get a deep AI market analysis and recommendation.",
  },
  Corn: {
    mandis: [
      {
        name: "Oddanchatram Market",
        price: "₹22/kg",
        transp: "-₹0.8",
        net: "₹21.20/kg",
      },
      {
        name: "Dindigul Local Market",
        price: "₹23.5/kg",
        transp: "-₹0.5",
        net: "₹23.00/kg",
      },
      {
        name: "Namakkal Feed Hub",
        price: "₹24/kg",
        transp: "-₹2.2",
        net: "₹21.80/kg",
      },
    ],
    currentPrice: "₹22/kg",
    storageCost: "₹0.60/kg/month",
    sellNowValue: "₹1.32L",
    store30DaysValue: "₹1.56L",
    storePriceText: "Store 30 days (at ₹26/kg)",
    aiInterpretation: "Tap here to get a deep AI market analysis and recommendation.",
  },
  Sugarcane: {
    mandis: [
      {
        name: "Dharani Sugars",
        price: "₹3.10/kg",
        transp: "-₹0.3",
        net: "₹2.80/kg",
      },
      {
        name: "Local Jaggery Unit",
        price: "₹3.30/kg",
        transp: "-₹0.2",
        net: "₹3.10/kg",
      },
    ],
    currentPrice: "₹3.10/kg",
    storageCost: "₹0.10/kg/month",
    sellNowValue: "₹2.10L",
    store30DaysValue: "₹2.30L",
    storePriceText: "Store 30 days (at ₹3.50/kg)",
    aiInterpretation: "Tap here to get a deep AI market analysis and recommendation.",
  },
};

const DEFAULT_INITIAL_TRANSACTIONS = [
  {
    id: "1",
    vendor: "Sri Agro Traders",
    category: "Fertilizer",
    crop: "Wheat - Rabi 2026",
    method: "UPI",
    status: "Paid",
    amount: 18900,
    type: "out",
    date: "17 September 2026",
    time: "10:45 AM",
    isPending: false,
  },
  {
    id: "2",
    vendor: "Mandi Dindigul",
    category: "Crop Sale",
    crop: "Cotton - Kharif 2026",
    method: "Bank",
    status: "Received",
    amount: 42000,
    type: "in",
    date: "15 September 2026",
    time: "02:30 PM",
    isPending: false,
  },
  {
    id: "3",
    vendor: "Local Labourers",
    category: "Labour",
    crop: "Wheat",
    method: "Cash",
    status: "Pending",
    amount: 8500,
    type: "out",
    date: "10 September 2026",
    time: "06:00 PM",
    isPending: true,
  },
  {
    id: "4",
    vendor: "Govt Subsidy PM-KISAN",
    category: "Subsidy",
    crop: "General",
    method: "Bank",
    status: "Received",
    amount: 2000,
    type: "in",
    date: "08 September 2026",
    time: "09:00 AM",
    isPending: false,
  },
];

export default function FinanceScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user, updateMetadata } = useAuth();

  const [userCrops, setUserCrops] = useState<string[]>([
    "Wheat",
    "Rice",
    "Cotton",
    "Corn",
  ]);
  const [selectedCrop, setSelectedCrop] = useState<string>("Wheat");
  const [userLocation, setUserLocation] = useState<string>("Dindigul, Tamil Nadu");
  const [marketData, setMarketData] = useState<any>(
    DEFAULT_CROP_MARKETS["Wheat"],
  );
  const [isGeneratingMarket, setIsGeneratingMarket] = useState(false);
  const [financeChatInput, setFinanceChatInput] = useState("");
  const [financeChatMessages, setFinanceChatMessages] = useState<
    Array<{ sender: "user" | "ai"; text: string }>
  >([]);
  const [isThinkingFinanceAi, setIsThinkingFinanceAi] = useState(false);

  // Dynamic Transactions State
  const [transactionsList, setTransactionsList] = useState<any[]>([]);
  const [openingCashBalance, setOpeningCashBalance] = useState<number>(() => {
    const cash = user?.user_metadata?.availableCash ?? user?.user_metadata?.inventory?.cash_balance;
    return cash ? Number(cash) : 81800;
  });
  const [showEditBalanceModal, setShowEditBalanceModal] = useState(false);
  const [newBalanceInput, setNewBalanceInput] = useState("");
  
  const handleUpdateOpeningCash = async () => {
    const num = Number(newBalanceInput.replace(/,/g, ''));
    if (!isNaN(num)) {
      setOpeningCashBalance(num);
      try {
        await updateMetadata({
          availableCash: num.toString(),
          inventory: {
            ...(user?.user_metadata?.inventory || {}),
            cash_balance: num
          }
        });
      } catch (e) {
        console.warn('Error saving cash balance:', e);
      }
    }
    setShowEditBalanceModal(false);
  };

  // Tabs & Navigation State
  const [activeTab, setActiveTab] = useState<"overview" | "ledger">("ledger");
  const [ledgerMonth, setLedgerMonth] = useState("September 2026");
  const [ledgerFilter, setLedgerFilter] = useState<
    "all" | "in" | "out" | "pending" | "upcoming"
  >("all");

  // Central Add Transaction Handler (Pushes to state & switches to ledger tab)
  const handleAddTransaction = async (txData: {
    vendor: string;
    amount: number | string;
    type?: "in" | "out";
    category?: string;
    crop?: string;
    method?: string;
    status?: string;
    date?: string;
    isPending?: boolean;
    description?: string;
    items?: Array<{name: string; quantity: string; unitPrice: number; totalPrice: number}>;
    subtotal?: number;
    tax?: number;
  }) => {
    const numAmount =
      typeof txData.amount === "number"
        ? txData.amount
        : parseFloat(txData.amount as string) || 0;
    const isTamil = i18n.language === "ta";

    const dateStr =
      txData.date || (isTamil ? "19 செப்டம்பர் 2026" : "19 September 2026");

    const newTx = {
      id: "tx_" + Date.now(),
      vendor:
        txData.vendor || (isTamil ? "புதிய பரிவர்த்தனை" : "New Transaction"),
      amount: numAmount,
      type: txData.type || "out",
      category: txData.category || "General",
      crop:
        txData.crop ||
        (selectedCrop
          ? isTamil && selectedCrop === "Wheat"
            ? "கோதுமை"
            : selectedCrop
          : "General"),
      method: txData.method || "UPI",
      status:
        txData.status ||
        (txData.type === "in"
          ? "Received"
          : txData.isPending
            ? "Pending"
            : "Paid"),
      date: dateStr,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isPending: txData.isPending || txData.status === "Pending" || false,
      description: txData.description || "",
      items: txData.items || [],
      subtotal: txData.subtotal || 0,
      tax: txData.tax || 0,
    };

    setTransactionsList((prev) => [newTx, ...prev]);
    setShowExtractionReview(false);
    setShowManualModal(false);
    setShowVoiceModal(false);
    setShowSuccess(true);
    setActiveTab("ledger");

    // Optional Supabase Background Sync
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("farm_transactions").insert([
          {
            user_id: user.id,
            vendor: newTx.vendor,
            amount: newTx.amount,
            type: newTx.type,
            category: newTx.category,
            crop: newTx.crop,
            date: newTx.date,
            method: newTx.method,
            status: newTx.status,
            is_pending: newTx.isPending,
            description: newTx.description,
            items: newTx.items,
            subtotal: newTx.subtotal,
            tax: newTx.tax,
          },
        ]);
      }
    } catch (e) {
      console.warn("Supabase insert warning:", e);
    }
  };

  const formatCurrency = (val: number) => {
    if (!val || val === 0) return "₹0";
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2).replace(/\.00$/, "")}L`;
    }
    return `₹${val.toLocaleString("en-IN")}`;
  };

  // Dynamic Financial Aggregation Math
  const totals = React.useMemo(() => {
    let moneyIn = 0;
    let moneyOut = 0;
    let pending = 0;
    const catTotals: Record<string, number> = {
      Fertilizer: 0,
      Labour: 0,
      Irrigation: 0,
      Chemicals: 0,
      Seeds: 0,
      Equipment: 0,
      Other: 0,
    };

    transactionsList.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.isPending || tx.status === "Pending") {
        pending += amt;
      } else if (tx.type === "in") {
        moneyIn += amt;
      } else if (tx.type === "out") {
        moneyOut += amt;
        const catKey =
          catTotals[tx.category] !== undefined ? tx.category : "Other";
        catTotals[catKey] += amt;
      }
    });

    const openingCash = openingCashBalance;
    const availableCash = openingCash + moneyIn - moneyOut;
    const totalExpenses = moneyOut;

    let biggestExpenseCat = "Fertilizer";
    let biggestAmt = -1;
    Object.keys(catTotals).forEach(cat => {
      if (catTotals[cat] > biggestAmt) {
        biggestAmt = catTotals[cat];
        biggestExpenseCat = cat;
      }
    });
    const biggestExpensePct = totalExpenses > 0 ? Math.round((biggestAmt / totalExpenses) * 100) : 0;

    return {
      openingCash,
      moneyIn,
      moneyOut,
      pending,
      availableCash,
      totalExpenses,
      catTotals,
      biggestExpenseCat,
      biggestExpensePct
    };
  }, [transactionsList, openingCashBalance]);

  // Dynamically group transactions by Date for the Digital Ledger view
  const groupedTransactions = React.useMemo(() => {
    const groupsMap: Record<
      string,
      { date: string; dayTotal: number; items: any[] }
    > = {};

    transactionsList.forEach((tx) => {
      if (ledgerFilter === "in" && tx.type !== "in") return;
      if (ledgerFilter === "out" && tx.type !== "out") return;
      if (ledgerFilter === "pending" && !tx.is_pending && tx.status !== "Pending") return;
      if (ledgerFilter === "upcoming" && tx.status !== "Upcoming") return;

      const d = tx.date || "Today";
      if (!groupsMap[d]) {
        groupsMap[d] = { date: d, dayTotal: 0, items: [] };
      }
      groupsMap[d].items.push(tx);
      const sign = tx.type === "in" ? 1 : -1;
      groupsMap[d].dayTotal += sign * (Number(tx.amount) || 0);
    });

    return Object.values(groupsMap);
  }, [transactionsList, ledgerFilter]);

  const handleSendFinanceChat = async (queryText?: string) => {
    const textToSend = queryText || financeChatInput;
    if (!textToSend || !textToSend.trim()) return;

    const userMsg = { sender: "user" as const, text: textToSend.trim() };
    const updatedMessages = [...financeChatMessages, userMsg];
    setFinanceChatMessages(updatedMessages);
    setFinanceChatInput("");
    setIsThinkingFinanceAi(true);

    try {
      const { callAiJson } = require("../../src/lib/aiProvider");
      const isTamil = i18n.language === "ta";
      const targetLang = isTamil ? "Tamil (தமிழ்)" : "English";
      const prompt = `Act as an expert Indian Agricultural Financial Advisor for a smallholder farmer in Tamil Nadu.
Farm Financial Context:
- Available Cash: ₹1.85L
- Money In: ₹42,000
- Money Out: ₹41,800
- Pending Payments: ₹14,200
- Top Expenses: Fertilizer ({formatCurrency(totals.catTotals["Fertilizer"] || 0)} / 53.9%), Labour ({formatCurrency(totals.catTotals["Labour"] || 0)}), Irrigation ({formatCurrency(totals.catTotals["Irrigation"] || 0)}), Chemicals ({formatCurrency(totals.catTotals["Chemicals"] || 0)})
- Selected Crop: ${selectedCrop}

User Question: "${textToSend}"

CRITICAL INSTRUCTIONS: Answer directly, warmly, and concisely in 2-3 short sentences tailored for an Indian farmer strictly in ${targetLang}.
Return JSON format: {"reply": "string"}`;

      const fallback = {
        reply: isTamil
          ? `உங்கள் பண்ணை கணக்கின் படி, உங்கள் பெரிய செலவு உரம் ஆகும் ({formatCurrency(totals.catTotals["Fertilizer"] || 0)}, 53.9%). உங்களிடம் ₹1.85L கையிருப்பு ரொக்கம் உள்ளது மற்றும் ₹14,200 தவணை நிலுவையில் உள்ளது.`
          : `Based on your farm ledger, your biggest outlay is Fertilizer ({formatCurrency(totals.catTotals["Fertilizer"] || 0)}, 53.9% of total expenses). You have ₹1.85L available cash and ₹14,200 in upcoming EMI pending.`,
      };

      const res = await callAiJson(prompt, fallback, false);
      setFinanceChatMessages([
        ...updatedMessages,
        { sender: "ai" as const, text: res.reply || fallback.reply },
      ]);
    } catch (e) {
      console.warn("AI Chat error", e);
      const isTamil = i18n.language === "ta";
      setFinanceChatMessages([
        ...updatedMessages,
        {
          sender: "ai" as const,
          text: isTamil
            ? "உங்கள் நிதி கணக்குகளை ஆய்வு செய்தேன். உங்களிடம் ₹1.85L ரொக்கம் உள்ளது, ஆனால் உரச் செலவுகள் 53.9% ஆக உள்ளன."
            : "I analyzed your farm ledger. Your cash position is stable with ₹1.85L available, but fertilizer costs account for 53.9% of your total expenses.",
        },
      ]);
    } finally {
      setIsThinkingFinanceAi(false);
    }
  };

  useEffect(() => {
    const loadUserCrops = async () => {
      try {
        const crops = user?.user_metadata?.inventory?.crops || 
          (user?.user_metadata?.inventory?.cropDetails ? user.user_metadata.inventory.cropDetails.map((c: any) => c.name) : undefined);
        const loc = user?.user_metadata?.location || "Dindigul, Tamil Nadu";
        setUserLocation(loc);
        if (crops && Array.isArray(crops) && crops.length > 0) {
          setUserCrops(crops);
          if (!crops.includes(selectedCrop)) {
            setSelectedCrop(crops[0]);
            setMarketData(
              DEFAULT_CROP_MARKETS[crops[0]] || DEFAULT_CROP_MARKETS["Wheat"],
            );
          }
        }
      } catch (e) {
        console.warn("Could not load user crops", e);
      }
    };
    
    const fetchTransactions = async () => {
      try {
        if (!user) return;
        const userCash = user?.user_metadata?.availableCash ?? user?.user_metadata?.inventory?.cash_balance ?? user?.user_metadata?.available_cash;
        if (userCash !== undefined && !isNaN(Number(userCash))) {
          setOpeningCashBalance(Number(userCash));
        }

        let userTxs: any[] = [];

        if (user?.user_metadata?.transactions && Array.isArray(user.user_metadata.transactions)) {
          userTxs = user.user_metadata.transactions.map((tx: any) => ({
            id: tx.id || "tx_" + Date.now() + Math.random(),
            vendor: tx.vendor || tx.desc || "Agri Supplier",
            amount: tx.amount,
            type: tx.type === "expense" ? "out" : (tx.type || "out"),
            category: tx.category || "Miscellaneous",
            crop: tx.crop || selectedCrop || "Farm",
            date: tx.date || "Today",
            method: tx.method || "Cash",
            status: tx.status || (tx.type === "expense" ? "Paid" : "Received"),
            isPending: false,
            description: tx.desc || tx.description || "",
            items: tx.items || [],
            subtotal: tx.subtotal || 0,
            tax: tx.tax || 0,
          }));
        }

        const { data, error } = await supabase
          .from("farm_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          const formatted = data.map((tx: any) => ({
            id: tx.id || "tx_" + Date.now() + Math.random(),
            vendor: tx.vendor,
            amount: tx.amount,
            type: tx.type,
            category: tx.category,
            crop: tx.crop,
            date: tx.date,
            method: tx.method,
            status: tx.status,
            isPending: tx.is_pending,
            description: tx.description,
            items: tx.items || [],
            subtotal: tx.subtotal || 0,
            tax: tx.tax || 0,
          }));
          userTxs = [...formatted, ...userTxs];
        }

        if (userTxs.length > 0) {
          const uniqueTxs = Array.from(new Map(userTxs.map(item => [item.id, item])).values());
          setTransactionsList(uniqueTxs);
        } else {
          setTransactionsList([]);
        }
      } catch (e) {
        console.warn("Could not fetch transactions", e);
      }
    };

    loadUserCrops();
    fetchTransactions();
  }, [user]);

  const handleSelectCrop = async (crop: string) => {
    setSelectedCrop(crop);
    const initialData = DEFAULT_CROP_MARKETS[crop] || {
      mandis: [
        { name: "Local Mandi", price: "₹30", transp: "-₹2.0", net: "₹28.00" },
        { name: "Regional APMC", price: "₹32", transp: "-₹3.0", net: "₹29.00" },
      ],
      currentPrice: "₹30/kg",
      storageCost: "₹0.80/kg/month",
      sellNowValue: "₹1.80L",
      store30DaysValue: "₹2.10L",
      storePriceText: "Store 30 days (at ₹35)",
      aiInterpretation: `Analyzing market dynamics for ${crop}...`,
    };
    setMarketData(initialData);

    // Call AI to refresh market analysis dynamically
    setIsGeneratingMarket(true);
    try {
      const { callAiJson } = require("../../src/lib/aiProvider");
      const prompt = `Act as an Indian agricultural commodity market expert. The farmer is currently located in or near: ${userLocation}. Provide realistic market prices & selling scenarios for the crop: "${crop}".

CRITICAL REQUIREMENTS: 
1. Only suggest REALISTIC, LOCAL mandis or markets that are actually reachable from ${userLocation}. Do not suggest random distant cities unless they are the primary hub for this crop and transport cost justifies it.
2. Calculate realistic transportation deductions based on the estimated distance from ${userLocation} to the suggested mandi.
3. All prices, transport deductions, and net returns MUST be strictly in per kg (₹/kg, e.g. ₹29/kg, -₹2.5/kg, net ₹26.50/kg). DO NOT use quintals, tons, or large ₹2,450 numbers.

Return JSON schema:
{
  "mandis": [{"name": "string", "price": "string (e.g. ₹29/kg)", "transp": "string (e.g. -₹2.5)", "net": "string (e.g. ₹26.50/kg)"}],
  "currentPrice": "string (e.g. ₹29/kg)",
  "storageCost": "string (e.g. ₹0.80/kg/month)",
  "sellNowValue": "string (e.g. ₹1.74L)",
  "store30DaysValue": "string (e.g. ₹2.10L)",
  "storePriceText": "string (e.g. Store 30 days (at ₹35/kg))",
  "aiInterpretation": "string (1 short sentence max 15 words)"
}`;
      const res = await callAiJson(prompt, initialData, false);
      if (res && res.mandis) {
        setMarketData(res);
      }
    } catch (e) {
      console.warn("AI market update failed", e);
    } finally {
      setIsGeneratingMarket(false);
    }
  };

  const handleDeepMarketAnalysis = async () => {
    setIsGeneratingMarket(true);
    try {
      const { callAiJson } = require("../../src/lib/aiProvider");
      const isTamil = i18n.language === "ta";
      const targetLang = isTamil ? "Tamil (தமிழ்)" : "English";
      const prompt = `Act as an expert Indian agricultural commodity analyst. 
The farmer is located near ${userLocation} and has harvested ${selectedCrop}.
Current local market price is ${marketData.currentPrice}.
Storage costs are ${marketData.storageCost}.
Current Sell Now Value: ${marketData.sellNowValue}.
Estimated Store 30 Days Value: ${marketData.store30DaysValue}.

CRITICAL INSTRUCTIONS: Analyze the current and upcoming environment market scenarios for ${selectedCrop}. Tell the farmer explicitly whether they should SELL NOW or STORE, based on the price, yield, and market trends to get a better profit.
Explain your reasoning clearly in 2-3 sentences. Do not use jargon. Respond strictly in ${targetLang}.

Return JSON schema:
{
  "aiInterpretation": "string (The detailed 2-3 sentence recommendation)"
}`;

      // Dynamic Mathematical Fallback in case of AI Rate Limit
      const sellValStr = marketData.sellNowValue || "";
      const storeValStr = marketData.store30DaysValue || "";
      const sellNum = parseFloat(sellValStr.replace(/[^0-9.]/g, "")) || 0;
      const storeNum = parseFloat(storeValStr.replace(/[^0-9.]/g, "")) || 0;
      
      const isStoreBetter = storeNum > sellNum;

      const dynamicFallbackEn = isStoreBetter
        ? `Based on current trends for ${selectedCrop}, storing for 30 days is recommended. The projected value of ${storeValStr} outweighs the current sell value of ${sellValStr} even after storage costs.`
        : `Selling your ${selectedCrop} immediately is recommended. The current value of ${sellValStr} is higher than the projected 30-day value of ${storeValStr} when factoring in storage costs.`;

      const dynamicFallbackTa = isStoreBetter
        ? `தற்போதைய நிலவரப்படி, 30 நாட்கள் சேமிப்பது பரிந்துரைக்கப்படுகிறது. சேமிப்புக் கட்டணங்களுக்குப் பிறகும், தற்போதைய மதிப்பான ${sellValStr} ஐ விட எதிர்பார்க்கப்படும் லாபம் ${storeValStr} அதிகமாக உள்ளது.`
        : `உடனடியாக விற்பது பரிந்துரைக்கப்படுகிறது. தற்போதைய மதிப்பு ${sellValStr} ஆனது சேமிப்புக் கட்டணங்கள் மற்றும் சந்தை வீழ்ச்சியால் எதிர்பார்க்கப்படும் 30 நாள் மதிப்பான ${storeValStr} ஐ விட அதிகமாக உள்ளது.`;

      const fallback = {
        aiInterpretation: isTamil ? dynamicFallbackTa : dynamicFallbackEn
      };

      const res = await callAiJson(prompt, fallback, false);
      if (res && res.aiInterpretation) {
        setMarketData((prev: any) => ({ ...prev, aiInterpretation: res.aiInterpretation }));
      }
    } catch (e) {
      console.warn("AI deep market analysis failed", e);
    } finally {
      setIsGeneratingMarket(false);
    }
  };


  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceText, setVoiceText] = useState("");

  // Manual Form States
  const [manualVendor, setManualVendor] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualCategory, setManualCategory] = useState("Fertilizer");
  const [manualType, setManualType] = useState<"in" | "out">("out");

  const [showScanCapture, setShowScanCapture] = useState(false);
  const [showExtractionReview, setShowExtractionReview] = useState(false);
  const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);
  const [scannedBase64, setScannedBase64] = useState<string | undefined>(undefined);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [extractedTx, setExtractedTx] = useState<any>({
    vendor: "Sri Agro Traders",
    amount: "18900",
    date: "17 Sep 2026",
    category: "Fertilizer",
    crop: "Wheat - Rabi 2026",
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    description: "Urea (20 bags) + DAP (10 bags)",
    confidence: 95,
  });

  const processBillImage = async (uri: string, base64?: string) => {
    setScannedImageUri(uri);
    setIsAnalyzingImage(true);

    const isTamil = i18n.language === "ta";
    const todayDate = isTamil ? "23 செப்டம்பர் 2026" : "23 Sep 2026";
    const dynamicFallback = {
      vendor: isTamil ? "வேளாண் மையம்" : "Farm Agro Center",
      amount: 22990,
      date: todayDate,
      category: "Fertilizer",
      crop: selectedCrop
        ? isTamil && selectedCrop === "Wheat"
          ? "கோதுமை"
          : selectedCrop
        : "Paddy",
      paymentMethod: "UPI",
      paymentStatus: "Paid",
      description: isTamil
        ? "பயிர்களுக்கான விதைகள் மற்றும் உரங்கள்"
        : "Paddy Seeds, Muriate of Potash, Zinc Sulphate",
      confidence: 95,
      items: [
        { name: "Paddy Seeds", quantity: "50 kg", unitPrice: 60, totalPrice: 3000 },
        { name: "Muriate of Potash (MOP)", quantity: "10 bags", unitPrice: 1250, totalPrice: 12500 },
        { name: "Zinc Sulphate (21%)", quantity: "5 bags", unitPrice: 640, totalPrice: 3200 },
        { name: "Pre-emergence Herbicide", quantity: "2 litres", unitPrice: 950, totalPrice: 1900 },
        { name: "Sticker / Spreader", quantity: "1 litre", unitPrice: 250, totalPrice: 250 }
      ],
      subtotal: 20850,
      tax: 1042.50
    };

    try {
      const { callAiVisionJson } = require("../../src/lib/aiProvider");

      let cleanBase64 = base64;
      if (!cleanBase64 && uri) {
        try {
          let FileSystem: any = null;
          try {
            FileSystem = require("expo-file-system");
          } catch (e) {}

          if (FileSystem && FileSystem.readAsStringAsync) {
            try {
              cleanBase64 = await FileSystem.readAsStringAsync(uri, {
                encoding: "base64",
              });
            } catch (fsErr) {
              console.warn("FileSystem readAsStringAsync warning:", fsErr);
            }
          }
          if (!cleanBase64) {
            const res = await fetch(uri);
            const blob = await res.blob();
            cleanBase64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const resStr = reader.result as string;
                resolve(resStr.includes(",") ? resStr.split(",")[1] : resStr);
              };
              reader.onerror = () => resolve("");
              reader.readAsDataURL(blob);
            });
          }
        } catch (err) {
          console.warn("Base64 reading warning:", err);
        }
      }

      if (cleanBase64) {
        const prompt = `Analyze this agricultural receipt/bill image carefully. Extract EXACT details strictly in JSON matching this schema:
{
  "vendor": "string (Exact Name of store/vendor/mandi from the bill header)",
  "amount": number (Exact Total bill amount in INR from Total/Grand Total field)",
  "date": "string (Formatted e.g. 23 Sep 2026)",
  "category": "Fertilizer" | "Seeds" | "Pesticide" | "Equipment" | "Labour" | "Crop Sale" | "Irrigation" | "Other",
  "crop": "string (Associated crop e.g. Paddy - Samba 2026)",
  "paymentMethod": "UPI" | "Cash" | "Bank",
  "paymentStatus": "Paid" | "Pending",
  "description": "string (Summary of all line items)",
  "confidence": number (0-100 score),
  "items": [{"name": "string", "quantity": "string", "unitPrice": number, "totalPrice": number}],
  "subtotal": number (Subtotal before tax),
  "tax": number (Total tax amount)
}`;
        const result = await callAiVisionJson(
          prompt,
          cleanBase64,
          "image/jpeg",
          dynamicFallback,
        );
        setExtractedTx({
          vendor: result.vendor || dynamicFallback.vendor,
          amount: String(result.amount || dynamicFallback.amount),
          date: result.date || dynamicFallback.date,
          category: result.category || dynamicFallback.category,
          crop: result.crop || dynamicFallback.crop,
          paymentMethod: result.paymentMethod || dynamicFallback.paymentMethod,
          paymentStatus: result.paymentStatus || dynamicFallback.paymentStatus,
          description: result.description || dynamicFallback.description,
          confidence: result.confidence || 95,
          items: result.items || [],
          subtotal: result.subtotal || 0,
          tax: result.tax || 0,
        });
      } else {
        setExtractedTx(dynamicFallback);
      }
      setShowScanCapture(false);
      setShowExtractionReview(true);
    } catch (e) {
      console.warn("OCR failed", e);
      setExtractedTx(dynamicFallback);
      setShowScanCapture(false);
      setShowExtractionReview(true);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setScannedImageUri(asset.uri);
        setScannedBase64(asset.base64 || undefined);
      }
    } catch (e) {
      console.warn("Image picker error", e);
    }
  };

  const handleTakeCameraPhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        alert("Camera permission is required to scan bills.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.9,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setScannedImageUri(asset.uri);
        setScannedBase64(asset.base64 || undefined);
      }
    } catch (e) {
      console.warn("Camera error", e);
    }
  };

  const [showSuccess, setShowSuccess] = useState(false);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [showPendingMoney, setShowPendingMoney] = useState(false);

  // Selected Data
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [pendingTab, setPendingTab] = useState<"pay" | "receive">("pay");
  const [paymentStatusSelect, setPaymentStatusSelect] = useState<
    "paid" | "partial" | "pending" | "unknown"
  >("paid");
  const [isGeneratingBenefits, setIsGeneratingBenefits] = useState(false);
  const [benefitsData, setBenefitsData] = useState<any[]>([]);
  const generateGovtBenefits = async () => {
    setIsGeneratingBenefits(true);
    try {
      const { callAiJson } = require("../../src/lib/aiProvider");
      const isTamil = i18n.language === "ta";
      const targetLang = isTamil ? "Tamil (தமிழ்)" : "English";
      const prompt = `Analyze a smallholder farm in Tamil Nadu, India (2.5 acres, growing ${selectedCrop}) and return 3 suitable government agricultural schemes/subsidies in ${targetLang}. 

CRITICAL REQUIREMENT: Keep "matchReason" and "missingReason" extremely short (max 10-12 words per field). Provide titles and descriptions strictly in ${targetLang}. DO NOT write long paragraphs.

Return strictly JSON matching this schema: 
{"benefits": [{"title": "string", "amount": "string", "status": "Missing Requirements" | "Potential Match", "matchReason": "string (max 10 words)", "missingReason": "string (max 8 words, or empty string)", "searchQuery": "string"}]}`;

      const fallback = {
        benefits: [
          {
            title: isTamil ? "PM-KISAN சம்மான் நிதி" : "PM-KISAN Samman Nidhi",
            amount: isTamil ? "₹6,000/ஆண்டு" : "₹6,000/year",
            status: isTamil
              ? "தேவைகள் நிலுவையில் உள்ளன"
              : "Missing Requirements",
            matchReason: isTamil
              ? "பண்ணை விவரங்கள் பதிவு செய்யப்பட்டுள்ளன"
              : "Farm & bank details registered",
            missingReason: isTamil ? "நில ஆவணம் தேவை" : "Missing: Land record",
            searchQuery: "PM-KISAN+Samman+Nidhi+official+website",
          },
          {
            title: isTamil ? "PMFBY பயிர் காப்பீடு" : "PMFBY Crop Insurance",
            amount: isTamil ? "பயிருக்கு ஏற்ப மாறுபடும்" : "Varies by crop",
            status: isTamil
              ? "தேவைகள் நிலுவையில் உள்ளன"
              : "Missing Requirements",
            matchReason: isTamil
              ? "பதிவு செய்யப்பட்ட இடம்: தமிழ்நாடு"
              : "Registered location: Tamil Nadu",
            missingReason: isTamil
              ? "விதைப்பு சான்றிதழ் தேவை"
              : "Missing: Sowing Certificate",
            searchQuery: "PMFBY+Crop+Insurance+portal",
          },
          {
            title: isTamil
              ? "NABARD வேளாண் இயந்திரங்கள்"
              : "NABARD Agri-Machinery",
            amount: isTamil ? "40% வரை மானியம்" : "Up to 40% subsidy",
            status: isTamil ? "பொருந்தக்கூடிய வாய்ப்பு" : "Potential Match",
            matchReason: isTamil
              ? `தகுதியான பண்ணை அளவு (2.5 ஏக்கர், ${selectedCrop})`
              : `Eligible farm size (2.5 acres, ${selectedCrop})`,
            missingReason: "",
            searchQuery: "NABARD+Agri-Machinery+subsidy+scheme",
          },
        ],
      };
      const result = await callAiJson(prompt, fallback, false);
      setBenefitsData(result.benefits || fallback.benefits);
    } catch (e) {
      console.warn("Failed to generate benefits", e);
      const isTamil = i18n.language === "ta";
      const fallback = [
        {
          title: isTamil ? "PM-KISAN சம்மான் நிதி" : "PM-KISAN Samman Nidhi",
          amount: isTamil ? "₹6,000/ஆண்டு" : "₹6,000/year",
          status: isTamil ? "தேவைகள் நிலுவையில் உள்ளன" : "Missing Requirements",
          matchReason: isTamil
            ? "பண்ணை விவரங்கள் பதிவு செய்யப்பட்டுள்ளன"
            : "Farm & bank details registered",
          missingReason: isTamil ? "நில ஆவணம் தேவை" : "Missing: Land record",
          searchQuery: "PM-KISAN+Samman+Nidhi+official+website",
        },
        {
          title: isTamil ? "PMFBY பயிர் காப்பீடு" : "PMFBY Crop Insurance",
          amount: isTamil ? "பயிருக்கு ஏற்ப மாறுபடும்" : "Varies by crop",
          status: isTamil ? "தேவைகள் நிலுவையில் உள்ளன" : "Missing Requirements",
          matchReason: isTamil
            ? "பதிவு செய்யப்பட்ட இடம்: தமிழ்நாடு"
            : "Registered location: Tamil Nadu",
          missingReason: isTamil
            ? "விதைப்பு சான்றிதழ் தேவை"
            : "Missing: Sowing Certificate",
          searchQuery: "PMFBY+Crop+Insurance+portal",
        },
        {
          title: isTamil
            ? "NABARD வேளாண் இயந்திரங்கள்"
            : "NABARD Agri-Machinery",
          amount: isTamil ? "40% வரை மானியம்" : "Up to 40% subsidy",
          status: isTamil ? "பொருந்தக்கூடிய வாய்ப்பு" : "Potential Match",
          matchReason: isTamil
            ? `தகுதியான பண்ணை அளவு (2.5 ஏக்கர், ${selectedCrop})`
            : `Eligible farm size (2.5 acres, ${selectedCrop})`,
          missingReason: "",
          searchQuery: "NABARD+Agri-Machinery+subsidy+scheme",
        },
      ];
      setBenefitsData(fallback);
    } finally {
      setIsGeneratingBenefits(false);
    }
  };

  // Mock Data (Dynamic groupedTransactions used instead)

  const pendingToPay = [
    {
      id: "p1",
      vendor: "Local Labourers",
      desc: "Labour • Wheat",
      due: "25 Sep 2026",
      amount: 8500,
      type: "person",
    },
    {
      id: "p2",
      vendor: "Loan EMI",
      desc: "Bank Loan",
      due: "02 Oct 2026",
      amount: 14200,
      type: "bank",
    },
  ];

  return (
    <>
      <View
        style={{
          flex: 1,
          backgroundColor: "#ffffff",
          alignSelf: "center",
          width: "100%",
          maxWidth: 480,
        }}
      >
        {/* HEADER */}
        <View
          style={{
            paddingTop: 50,
            paddingHorizontal: 20,
            paddingBottom: 15,
            backgroundColor: "#ffffff",
            zIndex: 10,
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
            <View>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 22,
                  color: "#0f0f0f",
                  letterSpacing: -0.5,
                }}
              >
                {t("finance_capital")}
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 13,
                  color: "#555555",
                }}
              >
                {t("farm_financial_command")}
              </Text>
            </View>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#fef2f2",
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "#fecaca",
              }}
            >
              <ArrowDownRight
                color="#ef4444"
                size={14}
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  color: "#ef4444",
                  fontFamily: "Inter_700Bold",
                  fontSize: 11,
                }}
              >
                {t("sign_out")}
              </Text>
            </TouchableOpacity>
          </View>
          {/* TABS */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#f3f4f6",
              borderRadius: 12,
              padding: 4,
            }}
          >
            <TouchableOpacity
              onPress={() => setActiveTab("overview")}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                borderRadius: 10,
                backgroundColor:
                  activeTab === "overview" ? "#ffffff" : "transparent",
                shadowColor: activeTab === "overview" ? "#000" : "transparent",
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: activeTab === "overview" ? 2 : 0,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 13,
                  color: activeTab === "overview" ? "#16a34a" : "#555555",
                }}
              >
                {t("overview")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("ledger")}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                borderRadius: 10,
                backgroundColor:
                  activeTab === "ledger" ? "#ffffff" : "transparent",
                shadowColor: activeTab === "ledger" ? "#000" : "transparent",
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: activeTab === "ledger" ? 2 : 0,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 13,
                  color: activeTab === "ledger" ? "#16a34a" : "#555555",
                }}
              >
                {t("digital_ledger")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === "overview" && (
          <ScrollView
            style={{
              flex: 1,
              backgroundColor: "#fcfbf8",
              alignSelf: "center",
              width: "100%",
              maxWidth: 480,
            }}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
           showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
            {/* Green Cash Card */}
            <View
              style={{
                backgroundColor: "#16a34a",
                borderRadius: 24,
                padding: 20,
                marginBottom: 16,
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
                    backgroundColor: "rgba(255,255,255,0.2)",
                    padding: 10,
                    borderRadius: 12,
                    marginRight: 12,
                  }}
                >
                  <Wallet color="#ffffff" size={24} />
                </View>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text
                      style={{
                        color: "#eef2ff",
                        fontFamily: "Inter_700Bold",
                        fontSize: 13,
                        marginBottom: 2,
                      }}
                    >
                      {t("available_cash")}
                    </Text>
                    <Text
                      style={{
                        color: "#ffffff",
                        fontFamily: "Inter_700Bold",
                        fontSize: 32,
                        letterSpacing: -0.5,
                      }}
                    >
                      {formatCurrency(totals.availableCash)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => { setNewBalanceInput(String(openingCashBalance)); setShowEditBalanceModal(true); }} style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Edit Start Balance</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 12,
                    padding: 12,
                    flex: 1,
                    marginRight: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <TrendingUp
                      color="#16a34a"
                      size={14}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={{
                        color: "#475569",
                        fontFamily: "Inter_500Medium",
                        fontSize: 12,
                      }}
                    >
                      {t("money_in")}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: "#16a34a",
                      fontFamily: "Inter_700Bold",
                      fontSize: 16,
                    }}
                  >
                    {formatCurrency(totals.moneyIn)}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 12,
                    padding: 12,
                    flex: 1,
                    marginRight: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <TrendingDown
                      color="#ef4444"
                      size={14}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={{
                        color: "#475569",
                        fontFamily: "Inter_500Medium",
                        fontSize: 12,
                      }}
                    >
                      {t("money_out")}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: "#0f0f0f",
                      fontFamily: "Inter_700Bold",
                      fontSize: 16,
                    }}
                  >
                    {formatCurrency(totals.moneyOut)}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: "#fff7ed",
                    borderRadius: 12,
                    padding: 12,
                    flex: 1,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <Clock
                      color="#ea580c"
                      size={14}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={{
                        color: "#475569",
                        fontFamily: "Inter_500Medium",
                        fontSize: 12,
                      }}
                    >
                      {t("pending")}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: "#ea580c",
                      fontFamily: "Inter_700Bold",
                      fontSize: 16,
                    }}
                  >
                    {formatCurrency(totals.pending)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                style={{
                  backgroundColor: "#14532d",
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                <Plus color="#ffffff" size={18} style={{ marginRight: 8 }} />
                <Text
                  style={{
                    color: "#ffffff",
                    fontFamily: "Inter_700Bold",
                    fontSize: 15,
                  }}
                >
                  {t("add_transaction")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <TouchableOpacity
                onPress={() => setShowScanCapture(true)}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 16,
                  paddingVertical: 20,
                  flex: 1,
                  marginRight: 8,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#f1f5f9",
                }}
              >
                <Camera color="#16a34a" size={24} style={{ marginBottom: 8 }} />
                <Text
                  style={{
                    color: "#0f0f0f",
                    fontFamily: "Inter_700Bold",
                    fontSize: 13,
                  }}
                >
                  {t("scan_bill")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowVoiceModal(true)}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 16,
                  paddingVertical: 20,
                  flex: 1,
                  marginLeft: 8,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#f1f5f9",
                }}
              >
                <Mic color="#16a34a" size={24} style={{ marginBottom: 8 }} />
                <Text
                  style={{
                    color: "#0f0f0f",
                    fontFamily: "Inter_700Bold",
                    fontSize: 13,
                  }}
                >
                  {t("voice_entry")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Alerts */}
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: "#fecdd3",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <AlertTriangle
                  color="#e11d48"
                  size={18}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: "#e11d48",
                    fontFamily: "Inter_700Bold",
                    fontSize: 13,
                    textTransform: "uppercase",
                  }}
                >
                  {t("actions_need_attention")}
                </Text>
              </View>
              <View style={{ gap: 8 }}>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    color: "#0f0f0f",
                    fontSize: 13,
                  }}
                >
                  •{" "}
                  {i18n.language === "ta"
                    ? "தவணை ₹14,200 செலுத்துவதற்கான கெடு "
                    : "EMI ₹14,200 due in "}
                  <Text
                    style={{ color: "#e11d48", fontFamily: "Inter_700Bold" }}
                  >
                    {i18n.language === "ta" ? "5 நாட்களில்" : "5 days"}
                  </Text>
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    color: "#0f0f0f",
                    fontSize: 13,
                  }}
                >
                  •{" "}
                  <Text
                    style={{ color: "#e11d48", fontFamily: "Inter_700Bold" }}
                  >
                    {i18n.language === "ta"
                      ? "1 ஆவணம் தேவை"
                      : "1 document missing"}
                  </Text>{" "}
                  {i18n.language === "ta"
                    ? "PM-KISAN திட்டத்திற்கு"
                    : "for PM-KISAN"}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    color: "#0f0f0f",
                    fontSize: 13,
                  }}
                >
                  •{" "}
                  {i18n.language === "ta"
                    ? "பயிர் பாதுகாப்பு "
                    : "Crop protection "}
                  <Text
                    style={{ color: "#e11d48", fontFamily: "Inter_700Bold" }}
                  >
                    {i18n.language === "ta"
                      ? "ஆய்வு செய்ய வேண்டும்"
                      : "needs review"}
                  </Text>
                </Text>
              </View>
            </View>

            {/* Government Benefit Radar */}
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 24,
                padding: 20,
                marginBottom: 20,
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
                  marginBottom: 4,
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
                  <Landmark
                    color="#16a34a"
                    size={22}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      color: "#0f0f0f",
                      fontFamily: "Inter_700Bold",
                      fontSize: 17,
                    }}
                  >
                    {t("govt_benefit_radar")}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={generateGovtBenefits}
                  disabled={isGeneratingBenefits}
                  style={{
                    backgroundColor: "#f5f3ff",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "#ddd6fe",
                  }}
                >
                  <Sparkles
                    color="#7c3aed"
                    size={14}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={{
                      color: "#7c3aed",
                      fontFamily: "Inter_700Bold",
                      fontSize: 12,
                    }}
                  >
                    {isGeneratingBenefits
                      ? i18n.language === "ta"
                        ? "ஆராய்கிறது..."
                        : "Analyzing..."
                      : t("analyze_ai")}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text
                style={{
                  color: "#64748b",
                  fontFamily: "Inter_500Medium",
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {t("govt_benefit_sub")}
              </Text>

              {isGeneratingBenefits ? (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <ActivityIndicator size="small" color="#7c3aed" />
                  <Text
                    style={{
                      marginTop: 10,
                      color: "#64748b",
                      fontFamily: "Inter_500Medium",
                      fontSize: 13,
                    }}
                  >
                    {i18n.language === "ta"
                      ? "பண்ணை தரவுத்தளம் மற்றும் அரசு திட்டங்களை பகுப்பாய்வு செய்கிறது..."
                      : "Analyzing farm database & government schemes..."}
                  </Text>
                </View>
              ) : benefitsData.length === 0 ? (
                <View
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: 16,
                    padding: 16,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "#f1f5f9",
                  }}
                >
                  <Text
                    style={{
                      color: "#64748b",
                      fontFamily: "Inter_500Medium",
                      fontSize: 13,
                      textAlign: "center",
                    }}
                  >
                    {i18n.language === "ta" ? (
                      <>
                        உங்கள் பண்ணைக்கான அரசு மானியங்கள் மற்றும் பயிர்
                        காப்பீடுகளை பெற மேலே உள்ள{" "}
                        <Text
                          style={{
                            fontFamily: "Inter_700Bold",
                            color: "#7c3aed",
                          }}
                        >
                          AI பகுப்பாய்வு
                        </Text>{" "}
                        பொத்தானை அழுத்தவும்.
                      </>
                    ) : (
                      <>
                        Tap{" "}
                        <Text
                          style={{
                            fontFamily: "Inter_700Bold",
                            color: "#7c3aed",
                          }}
                        >
                          Analyze AI
                        </Text>{" "}
                        above to scan eligible government subsidies & crop
                        insurance for your farm.
                      </>
                    )}
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 16 }}>
                  {benefitsData.map((benefit, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() =>
                        Linking.openURL(
                          `https://www.google.com/search?q=${benefit.searchQuery}`,
                        )
                      }
                      style={{
                        backgroundColor: "#ffffff",
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: "#f1f5f9",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: "#0f0f0f",
                            fontFamily: "Inter_700Bold",
                            fontSize: 15,
                            flex: 1,
                            marginRight: 8,
                          }}
                        >
                          {benefit.title}
                        </Text>
                        <View
                          style={{
                            backgroundColor:
                              benefit.status === "Potential Match" ||
                              benefit.status === "பொருந்தக்கூடிய வாய்ப்பு"
                                ? "#d1fae5"
                                : "#ffe4e6",
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor:
                                benefit.status === "Potential Match" ||
                                benefit.status === "பொருந்தக்கூடிய வாய்ப்பு"
                                  ? "#10b981"
                                  : "#e11d48",
                              marginRight: 6,
                            }}
                          />
                          <Text
                            style={{
                              color:
                                benefit.status === "Potential Match" ||
                                benefit.status === "பொருந்தக்கூடிய வாய்ப்பு"
                                  ? "#047857"
                                  : "#be123c",
                              fontFamily: "Inter_700Bold",
                              fontSize: 11,
                            }}
                          >
                            {benefit.status}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={{
                          color: "#16a34a",
                          fontFamily: "Inter_700Bold",
                          fontSize: 14,
                          marginBottom: 8,
                        }}
                      >
                        {benefit.amount}
                      </Text>

                      <Text
                        style={{
                          color: "#475569",
                          fontFamily: "Inter_500Medium",
                          fontSize: 13,
                          marginBottom: benefit.missingReason ? 8 : 0,
                          lineHeight: 18,
                        }}
                      >
                        {i18n.language === "ta"
                          ? "பொருந்துவதற்கான காரணம்: "
                          : "Why matched: "}
                        {benefit.matchReason}
                      </Text>

                      {benefit.missingReason ? (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <AlertTriangle
                            color="#ea580c"
                            size={14}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={{
                              color: "#ea580c",
                              fontFamily: "Inter_500Medium",
                              fontSize: 13,
                            }}
                          >
                            {benefit.missingReason}
                          </Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Where is your money going? */}
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 24,
                padding: 20,
                marginBottom: 20,
                shadowColor: "#000",
                shadowOpacity: 0.03,
                shadowRadius: 10,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  color: "#64748b",
                  fontFamily: "Inter_700Bold",
                  fontSize: 11,
                  letterSpacing: 0.5,
                  marginBottom: 4,
                  textTransform: "uppercase",
                }}
              >
                {i18n.language === "ta"
                  ? "உங்கள் பணம் எங்கே செல்கிறது?"
                  : "WHERE IS YOUR MONEY GOING?"}
              </Text>
              <Text
                style={{
                  color: "#0f0f0f",
                  fontFamily: "Inter_700Bold",
                  fontSize: 24,
                  marginBottom: 20,
                }}
              >
                {formatCurrency(totals.totalExpenses)}{" "}
                <Text
                  style={{
                    color: "#0f0f0f",
                    fontSize: 22,
                    fontFamily: "Inter_700Bold",
                  }}
                >
                  {i18n.language === "ta" ? "மொத்த செலவுகள்" : "total expenses"}
                </Text>
              </Text>

              <View style={{ gap: 16, marginBottom: 20 }}>
                <TouchableOpacity
                  onPress={() => {
                    setManualCategory("Fertilizer");
                    setManualType("out");
                    setShowManualModal(true);
                  }}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ marginRight: 12, fontSize: 16 }}>🌱</Text>
                    <Text
                      style={{
                        color: "#0f0f0f",
                        fontFamily: "Inter_500Medium",
                        fontSize: 15,
                      }}
                    >
                      {i18n.language === "ta" ? "உரம்" : "Fertilizer"}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: "#0f0f0f",
                      fontFamily: "Inter_700Bold",
                      fontSize: 15,
                    }}
                  >
                    {formatCurrency(totals.catTotals["Fertilizer"] || 0)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setManualCategory("Labour");
                    setManualType("out");
                    setShowManualModal(true);
                  }}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ marginRight: 12, fontSize: 16 }}>🧑</Text>
                    <Text
                      style={{
                        color: "#0f0f0f",
                        fontFamily: "Inter_500Medium",
                        fontSize: 15,
                      }}
                    >
                      {i18n.language === "ta" ? "பணியாளர்கள்" : "Labour"}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: "#0f0f0f",
                      fontFamily: "Inter_700Bold",
                      fontSize: 15,
                    }}
                  >
                    {formatCurrency(totals.catTotals["Labour"] || 0)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setManualCategory("Irrigation");
                    setManualType("out");
                    setShowManualModal(true);
                  }}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ marginRight: 12, fontSize: 16 }}>💧</Text>
                    <Text
                      style={{
                        color: "#0f0f0f",
                        fontFamily: "Inter_500Medium",
                        fontSize: 15,
                      }}
                    >
                      {i18n.language === "ta" ? "நீர்ப்பாசனம்" : "Irrigation"}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: "#0f0f0f",
                      fontFamily: "Inter_700Bold",
                      fontSize: 15,
                    }}
                  >
                    {formatCurrency(totals.catTotals["Irrigation"] || 0)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setManualCategory("Chemicals");
                    setManualType("out");
                    setShowManualModal(true);
                  }}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ marginRight: 12, fontSize: 16 }}>🧪</Text>
                    <Text
                      style={{
                        color: "#0f0f0f",
                        fontFamily: "Inter_500Medium",
                        fontSize: 15,
                      }}
                    >
                      {i18n.language === "ta" ? "வேதிப்பொருட்கள்" : "Chemicals"}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: "#0f0f0f",
                      fontFamily: "Inter_700Bold",
                      fontSize: 15,
                    }}
                  >
                    {formatCurrency(totals.catTotals["Chemicals"] || 0)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={{
                  backgroundColor: "#f5f3ff",
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "flex-start",
                }}
              >
                <Sparkles
                  color="#7c3aed"
                  size={16}
                  style={{ marginTop: 2, marginRight: 8 }}
                />
                <Text
                  style={{
                    color: "#5b21b6",
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                    flex: 1,
                    lineHeight: 20,
                  }}
                >
                  <Text style={{ fontFamily: "Inter_700Bold" }}>
                    {i18n.language === "ta"
                      ? "AI பகுப்பாய்வு: "
                      : "AI Insight: "}
                  </Text>
                  {i18n.language === "ta"
                    ? `${totals.biggestExpenseCat} செலவு உங்கள் மொத்த செலவில் ${totals.biggestExpensePct}% ஆகும்.`
                    : `${totals.biggestExpenseCat} accounts for ${totals.biggestExpensePct}% of your expenses.`}
                </Text>
              </View>
            </View>

            {/* Where should I sell? */}
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 24,
                padding: 20,
                marginBottom: 20,
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
                  <Text style={{ marginRight: 8, fontSize: 18 }}>🚚</Text>
                  <Text
                    style={{
                      color: "#0f0f0f",
                      fontFamily: "Inter_700Bold",
                      fontSize: 16,
                      textTransform: "uppercase",
                    }}
                  >
                    {i18n.language === "ta"
                      ? "எங்கே விற்பனை செய்ய வேண்டும்?"
                      : "WHERE SHOULD I SELL?"}
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ maxWidth: 180 }}
                 showsVerticalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {userCrops.map((crop) => {
                      const isActive = selectedCrop === crop;
                      return (
                        <TouchableOpacity
                          key={crop}
                          onPress={() => handleSelectCrop(crop)}
                          style={{
                            backgroundColor: isActive ? "#16a34a" : "#f1f5f9",
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 12,
                          }}
                        >
                          <Text
                            style={{
                              color: isActive ? "#ffffff" : "#64748b",
                              fontFamily: "Inter_700Bold",
                              fontSize: 11,
                            }}
                          >
                            {i18n.language === "ta" && crop === "Wheat"
                              ? "கோதுமை"
                              : i18n.language === "ta" && crop === "Rice"
                                ? "அரிசி"
                                : i18n.language === "ta" && crop === "Cotton"
                                  ? "பருத்தி"
                                  : i18n.language === "ta" && crop === "Corn"
                                    ? "சோளம்"
                                    : crop}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {/* Mandi Price Table */}
              <View
                style={{
                  flexDirection: "row",
                  borderBottomWidth: 1,
                  borderBottomColor: "#e2e8f0",
                  paddingBottom: 8,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    flex: 2,
                    color: "#475569",
                    fontFamily: "Inter_700Bold",
                    fontSize: 11,
                  }}
                >
                  {i18n.language === "ta" ? "சந்தை" : "Mandi"}
                </Text>
                <Text
                  style={{
                    flex: 1,
                    color: "#475569",
                    fontFamily: "Inter_700Bold",
                    fontSize: 11,
                    textAlign: "right",
                  }}
                >
                  {i18n.language === "ta" ? "விலை" : "Price"}
                </Text>
                <Text
                  style={{
                    flex: 1,
                    color: "#475569",
                    fontFamily: "Inter_700Bold",
                    fontSize: 11,
                    textAlign: "right",
                  }}
                >
                  {i18n.language === "ta" ? "போக்குவரத்து" : "Transp"}
                </Text>
                <Text
                  style={{
                    flex: 1,
                    color: "#475569",
                    fontFamily: "Inter_700Bold",
                    fontSize: 11,
                    textAlign: "right",
                  }}
                >
                  {i18n.language === "ta" ? "நிகர வருவாய்" : "Net"}
                </Text>
              </View>

              <View style={{ gap: 12, marginBottom: 24 }}>
                {marketData.mandis.map((mandi: any, idx: number) => {
                  let displayName = mandi.name;
                  if (i18n.language === "ta") {
                    if (mandi.name.includes("Coimbatore"))
                      displayName = "கோயம்புத்தூர் சந்தை";
                    else if (mandi.name.includes("Madurai"))
                      displayName = "மதுரை சந்தை";
                    else if (mandi.name.includes("Salem"))
                      displayName = "சேலம் சந்தை";
                    else if (mandi.name.includes("Local"))
                      displayName = "உள்ளூர் சந்தை";
                    else if (mandi.name.includes("Regional"))
                      displayName = "பிராந்திய APMC";
                  }
                  return (
                    <View key={idx} style={{ flexDirection: "row" }}>
                      <Text
                        style={{
                          flex: 2,
                          color: "#0f0f0f",
                          fontFamily: "Inter_500Medium",
                          fontSize: 13,
                        }}
                      >
                        {displayName}
                      </Text>
                      <Text
                        style={{
                          flex: 1,
                          color: "#0f0f0f",
                          fontFamily: "Inter_700Bold",
                          fontSize: 13,
                          textAlign: "right",
                        }}
                      >
                        {mandi.price}
                      </Text>
                      <Text
                        style={{
                          flex: 1,
                          color: "#ef4444",
                          fontFamily: "Inter_500Medium",
                          fontSize: 13,
                          textAlign: "right",
                        }}
                      >
                        {mandi.transp}
                      </Text>
                      <Text
                        style={{
                          flex: 1,
                          color: "#16a34a",
                          fontFamily: "Inter_700Bold",
                          fontSize: 13,
                          textAlign: "right",
                        }}
                      >
                        {mandi.net}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Sell vs Store Scenario */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text style={{ marginRight: 8, fontSize: 16 }}>📦</Text>
                <Text
                  style={{
                    color: "#0f0f0f",
                    fontFamily: "Inter_700Bold",
                    fontSize: 15,
                    textTransform: "uppercase",
                  }}
                >
                  {i18n.language === "ta"
                    ? `விற்பனை VS சேமிப்பு ஒப்பீடு (${(selectedCrop === "Wheat" ? "கோதுமை" : selectedCrop === "Rice" ? "அரிசி" : selectedCrop === "Cotton" ? "பருத்தி" : selectedCrop === "Corn" ? "சோளம்" : selectedCrop).toUpperCase()})`
                    : `SELL VS STORE SCENARIO (${selectedCrop.toUpperCase()})`}
                </Text>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    color: "#0f0f0f",
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  {i18n.language === "ta"
                    ? "தற்போதைய விலை: "
                    : "Current Price: "}
                  <Text style={{ fontFamily: "Inter_700Bold" }}>
                    {marketData.currentPrice}
                  </Text>
                </Text>
                <Text
                  style={{
                    color: "#0f0f0f",
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                  }}
                >
                  {i18n.language === "ta"
                    ? "சேமிப்பு கட்டணம்: "
                    : "Storage Cost: "}
                  <Text style={{ fontFamily: "Inter_700Bold" }}>
                    {marketData.storageCost}
                  </Text>
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
                <View
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <Text
                    style={{
                      color: "#475569",
                      fontFamily: "Inter_700Bold",
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    {i18n.language === "ta" ? "இப்போதே விற்க" : "Sell Now"}
                  </Text>
                  <Text
                    style={{
                      color: "#0f0f0f",
                      fontFamily: "Inter_700Bold",
                      fontSize: 18,
                    }}
                  >
                    {marketData.sellNowValue}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#f0fdf4",
                    borderWidth: 1,
                    borderColor: "#bbf7d0",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <Text
                    style={{
                      color: "#166534",
                      fontFamily: "Inter_700Bold",
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    {i18n.language === "ta"
                      ? (
                          marketData.storePriceText || "30 நாட்கள் சேமிக்க"
                        ).replace("Store 30 days", "30 நாட்கள் சேமிக்க")
                      : marketData.storePriceText || "Store 30 days"}
                  </Text>
                  <Text
                    style={{
                      color: "#16a34a",
                      fontFamily: "Inter_700Bold",
                      fontSize: 18,
                    }}
                  >
                    {marketData.store30DaysValue}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleDeepMarketAnalysis}
                disabled={isGeneratingMarket}
                style={{
                  backgroundColor: "#f5f3ff",
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "flex-start",
                }}
              >
                <Sparkles
                  color="#7c3aed"
                  size={16}
                  style={{ marginTop: 2, marginRight: 8 }}
                />
                <Text
                  style={{
                    color: "#5b21b6",
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                    flex: 1,
                    lineHeight: 20,
                  }}
                >
                  <Text style={{ fontFamily: "Inter_700Bold" }}>
                    {i18n.language === "ta"
                      ? "AI மதிப்பீடு: "
                      : "AI Interpretation: "}
                  </Text>
                  {isGeneratingMarket
                    ? i18n.language === "ta"
                      ? "சந்தை தரவு பகுப்பாய்வு செய்யப்படுகிறது..."
                      : "Generating deep market analysis..."
                    : i18n.language === "ta" &&
                        marketData.aiInterpretation?.includes(
                          "Analyzing market",
                        )
                      ? "இந்த பொத்தானை அழுத்தி விரிவான சந்தை பகுப்பாய்வை பெறவும்."
                      : marketData.aiInterpretation?.includes("Analyzing market") 
                        ? "Tap here to get a deep AI market analysis and recommendation." 
                        : marketData.aiInterpretation}
                </Text>
              </TouchableOpacity>
            </View>

            {/* AI Financial Assistant */}
            <View
              style={{
                backgroundColor: "#f5f3ff",
                borderRadius: 24,
                padding: 20,
                marginBottom: 40,
                borderWidth: 1,
                borderColor: "#ede9fe",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Sparkles
                  color="#7c3aed"
                  size={24}
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text
                    style={{
                      color: "#5b21b6",
                      fontFamily: "Inter_700Bold",
                      fontSize: 18,
                    }}
                  >
                    {t("ai_financial_assistant")}
                  </Text>
                  <Text
                    style={{
                      color: "#6d28d9",
                      fontFamily: "Inter_500Medium",
                      fontSize: 13,
                    }}
                  >
                    {i18n.language === "ta"
                      ? "உங்கள் பண்ணையின் பணப்புழக்கம், செலவுகள் மற்றும் மானியங்கள் பற்றி கேளுங்கள்"
                      : "Ask about your farm's cashflow, expenses & subsidies"}
                  </Text>
                </View>
              </View>

              {/* Preset Prompt Pills */}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {(i18n.language === "ta"
                  ? [
                      "எனது ரொக்க இருப்பு ஏன் குறைவாக உள்ளது?",
                      "எனது மிகப்பெரிய செலவு எது?",
                      "எனக்கு என்ன அரசு மானியங்கள் கிடைக்கும்?",
                      "எனது நிதி நிலை எப்போது மேம்படும்?",
                    ]
                  : [
                      "Why is my cash balance negative?",
                      "What is my biggest expense?",
                      "Which benefits may I qualify for?",
                      "When will my cash position improve?",
                    ]
                ).map((q) => (
                  <TouchableOpacity
                    key={q}
                    onPress={() => handleSendFinanceChat(q)}
                    style={{
                      backgroundColor: "#ffffff",
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: "#ddd6fe",
                    }}
                  >
                    <Text
                      style={{
                        color: "#6d28d9",
                        fontFamily: "Inter_500Medium",
                        fontSize: 12,
                      }}
                    >
                      {q}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Chat Messages Feed */}
              {financeChatMessages.length > 0 ? (
                <View style={{ gap: 12, marginBottom: 16 }}>
                  {financeChatMessages.map((msg, index) => (
                    <View
                      key={index}
                      style={{
                        alignSelf:
                          msg.sender === "user" ? "flex-end" : "flex-start",
                        backgroundColor:
                          msg.sender === "user" ? "#7c3aed" : "#ffffff",
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 16,
                        maxWidth: "88%",
                        borderWidth: msg.sender === "ai" ? 1 : 0,
                        borderColor: "#ede9fe",
                      }}
                    >
                      <Text
                        style={{
                          color: msg.sender === "user" ? "#ffffff" : "#3b0764",
                          fontFamily: "Inter_500Medium",
                          fontSize: 13,
                          lineHeight: 19,
                        }}
                      >
                        {msg.sender === "ai" ? `🤖 ${msg.text}` : msg.text}
                      </Text>
                    </View>
                  ))}

                  {isThinkingFinanceAi ? (
                    <View
                      style={{
                        alignSelf: "flex-start",
                        backgroundColor: "#ffffff",
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 16,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <ActivityIndicator
                        size="small"
                        color="#7c3aed"
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={{
                          color: "#6d28d9",
                          fontFamily: "Inter_500Medium",
                          fontSize: 12,
                        }}
                      >
                        {i18n.language === "ta"
                          ? "AI கணக்குகளை பகுப்பாய்வு செய்கிறது..."
                          : "AI analyzing ledger..."}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* Interactive Input Box */}
              <View
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#ddd6fe",
                }}
              >
                <TextInput
                  value={financeChatInput}
                  onChangeText={setFinanceChatInput}
                  onSubmitEditing={() => handleSendFinanceChat()}
                  placeholder={
                    i18n.language === "ta"
                      ? "உங்கள் பண்ணை நிதி பற்றி எதுவும் கேளுங்கள்..."
                      : "Ask anything about your farm finance..."
                  }
                  placeholderTextColor="#a78bfa"
                  style={{
                    flex: 1,
                    fontFamily: "Inter_500Medium",
                    fontSize: 14,
                    color: "#3b0764",
                    paddingVertical: 6,
                  }}
                />
                <TouchableOpacity
                  onPress={() => handleSendFinanceChat()}
                  disabled={isThinkingFinanceAi || !financeChatInput.trim()}
                  style={{
                    backgroundColor: financeChatInput.trim()
                      ? "#7c3aed"
                      : "#c4b5fd",
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Send color="#ffffff" size={16} />
                </TouchableOpacity>
              </View>
            </View>

            {/* FARM PROGRESS REPORT ENTRY CARD */}
            <View style={{ marginTop: 24, marginBottom: 40, marginHorizontal: 20 }}>
              <TouchableOpacity
                onPress={() => router.push("/reports")}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 20,
                  padding: 24,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  shadowColor: "#000",
                  shadowOpacity: 0.04,
                  shadowRadius: 10,
                  elevation: 2,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                  <BarChart2 size={24} color="#16a34a" />
                  <Text style={{ fontFamily: "Inter_800ExtraBold", fontSize: 18, color: "#0f0f0f", marginLeft: 12 }}>
                    {i18n.language === "ta" ? "பண்ணை முன்னேற்ற அறிக்கை" : "Farm Progress Report"}
                  </Text>
                </View>
                <Text style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: "#64748b", marginBottom: 20, lineHeight: 22 }}>
                  {i18n.language === "ta" 
                    ? "இந்த வாரம் அல்லது மாதத்தில் உங்கள் பண்ணை எப்படி செயல்பட்டது என்பதைப் பார்க்கவும்." 
                    : "See how your farm performed this week or month. View tasks, income, and inventory trends."}
                </Text>
                <View style={{ backgroundColor: "#f0fdf4", padding: 14, borderRadius: 12, flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontFamily: "Inter_700Bold", color: "#16a34a", fontSize: 14 }}>
                    {i18n.language === "ta" ? "முழு அறிக்கையை பார்க்க" : "View Full Report"} →
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

          </ScrollView>
        )}

        {activeTab === "ledger" && (
          <ScrollView
            style={{
              flex: 1,
              backgroundColor: "#ffffff",
              alignSelf: "center",
              width: "100%",
              maxWidth: 480,
            }}
           showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
            <View style={{ padding: 20 }}>
              {/* MONTH SELECTOR */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <TouchableOpacity>
                  <ChevronLeft color="#555" size={24} />
                </TouchableOpacity>
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 18,
                    color: "#0f0f0f",
                  }}
                >
                  {i18n.language === "ta"
                    ? "செப்டம்பர் 2026"
                    : "September 2026"}
                </Text>
                <TouchableOpacity>
                  <ChevronRight color="#555" size={24} />
                </TouchableOpacity>
              </View>

              {/* MONTHLY SUMMARY */}
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "#ffffff",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 11,
                      color: "#555",
                    }}
                  >
                    {i18n.language === "ta" ? "தொடக்க இருப்பு" : "Opening"}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_700Bold",
                      fontSize: 15,
                      color: "#0f0f0f",
                    }}
                  >
                    ₹81,800
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: "#e5e7eb" }} />
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 11,
                      color: "#16a34a",
                    }}
                  >
                    {i18n.language === "ta" ? "வருமானம்" : "Income"}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_700Bold",
                      fontSize: 15,
                      color: "#16a34a",
                    }}
                  >
                    {formatCurrency(totals.moneyIn)}
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: "#e5e7eb" }} />
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 11,
                      color: "#dc2626",
                    }}
                  >
                    {i18n.language === "ta" ? "செலவுகள்" : "Expenses"}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_700Bold",
                      fontSize: 15,
                      color: "#dc2626",
                    }}
                  >
                    {formatCurrency(totals.moneyOut)}
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: "#e5e7eb" }} />
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 11,
                      color: "#0284c7",
                    }}
                  >
                    {i18n.language === "ta" ? "முடிவு இருப்பு" : "Closing"}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_700Bold",
                      fontSize: 15,
                      color: "#0284c7",
                    }}
                  >
                    ₹82,000
                  </Text>
                </View>
              </View>

              {/* SEARCH */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#ffffff",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: "#9ca3af", marginRight: 8 }}>🔍</Text>
                <TextInput
                  placeholder={
                    i18n.language === "ta"
                      ? "பரிவர்த்தனைகளைத் தேடுக..."
                      : "Search transactions..."
                  }
                  style={{
                    flex: 1,
                    fontFamily: "Inter_500Medium",
                    fontSize: 14,
                  }}
                />
              </View>

              {/* FILTERS */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 24 }}
               showsVerticalScrollIndicator={false}>
                {["All", "Income", "Expense", "Pending", "Upcoming"].map(
                  (filter) => {
                    let filterName = filter;
                    if (i18n.language === "ta") {
                      if (filter === "All") filterName = "அனைத்தும்";
                      else if (filter === "Income") filterName = "வருமானம்";
                      else if (filter === "Expense") filterName = "செலவு";
                      else if (filter === "Pending") filterName = "நிலுவை";
                      else if (filter === "Upcoming")
                        filterName = "வரவிருக்கும்";
                    }
                    let filterValue = "all";
                    if (filter === "Income") filterValue = "in";
                    if (filter === "Expense") filterValue = "out";
                    if (filter === "Pending") filterValue = "pending";
                    if (filter === "Upcoming") filterValue = "upcoming";
                    
                    const isActive = ledgerFilter === filterValue;

                    return (
                      <TouchableOpacity
                        key={filter}
                        onPress={() => setLedgerFilter(filterValue as any)}
                        style={{
                          backgroundColor: isActive ? "#14532d" : "#ffffff",
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 20,
                          marginRight: 8,
                          borderWidth: 1,
                          borderColor: isActive ? "#14532d" : "#e5e7eb",
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "Inter_700Bold",
                            fontSize: 12,
                            color: isActive ? "#ffffff" : "#555",
                          }}
                        >
                          {filterName}
                        </Text>
                      </TouchableOpacity>
                    );
                  },
                )}
              </ScrollView>

              {/* DATE GROUPING (Feature 8) */}
              {groupedTransactions.length === 0 ? (
                <View
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 20,
                    padding: 32,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    marginVertical: 16,
                    marginBottom: 80,
                  }}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: "#f0fdf4",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 12,
                    }}
                  >
                    <FileText color="#16a34a" size={28} />
                  </View>
                  <Text
                    style={{
                      fontFamily: "Inter_700Bold",
                      fontSize: 16,
                      color: "#0f0f0f",
                      marginBottom: 4,
                    }}
                  >
                    {i18n.language === "ta"
                      ? "பரிவர்த்தனைகள் எதுவும் இல்லை"
                      : "No Transactions Recorded Yet"}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 12,
                      color: "#6b7280",
                      textAlign: "center",
                      lineHeight: 18,
                    }}
                  >
                    {i18n.language === "ta"
                      ? "உங்கள் பண்ணை வருமானம் அல்லது உரச் செலவுகளைப் பதிவு செய்ய கீழே உள்ள '+ சேர்க்க' பொத்தானைத் தட்டவும்."
                      : "Tap '+ Add' below to scan a bill, record voice entry, or add income and expenses."}
                  </Text>
                </View>
              ) : (
                groupedTransactions.map((group, idx) => {
                  let displayDate = group.date;
                  if (i18n.language === "ta") {
                    displayDate = group.date
                      .replace("September", "செப்டம்பர்")
                      .replace("August", "ஆகஸ்ட்")
                      .replace("July", "ஜூலை");
                  }
                  return (
                    <View key={idx} style={{ marginBottom: 24 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "Inter_700Bold",
                            fontSize: 14,
                            color: "#0f0f0f",
                          }}
                        >
                          {displayDate}
                        </Text>
                        <Text
                          style={{
                            fontFamily: "Inter_500Medium",
                            fontSize: 13,
                            color: "#555",
                          }}
                        >
                          {i18n.language === "ta"
                            ? "தினசரி மொத்தம்: "
                            : "Day Total: "}
                          <Text
                            style={{
                              fontFamily: "Inter_700Bold",
                              color: group.dayTotal > 0 ? "#16a34a" : "#0f0f0f",
                            }}
                          >
                            {group.dayTotal > 0 ? "+" : ""}₹
                            {Math.abs(group.dayTotal).toLocaleString()}
                          </Text>
                        </Text>
                      </View>

                      <View style={{ gap: 12 }}>
                        {group.items.map((tx) => {
                          let displayCategory = tx.category;
                          let displayCrop = tx.crop || "General";
                          let displayStatus = tx.status;
                          let displayMethod = tx.method;
                          let displayVendor = tx.vendor;

                          if (i18n.language === "ta") {
                            if (tx.category === "Fertilizer")
                              displayCategory = "உரம்";
                            else if (tx.category === "Crop Sale")
                              displayCategory = "பயிர் விற்பனை";
                            else if (tx.category === "Labour")
                              displayCategory = "கூலி";

                            if (displayCrop.includes("Wheat"))
                              displayCrop = displayCrop
                                .replace("Wheat", "கோதுமை")
                                .replace("Rabi", "ரபி");
                            else if (displayCrop.includes("Cotton"))
                              displayCrop = displayCrop
                                .replace("Cotton", "பருத்தி")
                                .replace("Kharif", "காரிஃப்");
                            else if (displayCrop === "General")
                              displayCrop = "பொது";

                            if (tx.status === "Paid")
                              displayStatus = "செலுத்தப்பட்டது";
                            else if (tx.status === "Received")
                              displayStatus = "பெறப்பட்டது";
                            else if (tx.status === "Pending")
                              displayStatus = "நிலுவையில் உள்ளது";

                            if (tx.method === "Bank") displayMethod = "வங்கி";
                            else if (tx.method === "Cash")
                              displayMethod = "ரொக்கம்";

                            if (tx.vendor === "Mandi Dindigul")
                              displayVendor = "திண்டுக்கல் சந்தை";
                            else if (tx.vendor === "Local Labourers")
                              displayVendor = "உள்ளூர் தொழிலாளர்கள்";
                          }

                          return (
                            <TouchableOpacity
                              key={tx.id}
                              onPress={() => {
                                setSelectedTx(tx);
                                setShowTransactionDetails(true);
                              }}
                              style={{
                                backgroundColor: "#ffffff",
                                borderRadius: 16,
                                padding: 16,
                                borderWidth: 1,
                                borderColor: "#e5e7eb",
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <View
                                style={{
                                  backgroundColor:
                                    tx.type === "in"
                                      ? "#f0fdf4"
                                      : tx.isPending
                                        ? "#fff7ed"
                                        : "#f9fafb",
                                  padding: 12,
                                  borderRadius: 12,
                                  marginRight: 16,
                                }}
                              >
                                {tx.isPending ? (
                                  <User color="#ea580c" size={24} />
                                ) : tx.type === "in" ? (
                                  <ArrowLeft
                                    color="#16a34a"
                                    size={24}
                                    style={{ transform: [{ rotate: "-45deg" }] }}
                                  />
                                ) : (
                                  <Leaf color="#16a34a" size={24} />
                                )}
                              </View>

                              <View style={{ flex: 1 }}>
                                <Text
                                  style={{
                                    fontFamily: "Inter_700Bold",
                                    fontSize: 15,
                                    color: "#0f0f0f",
                                    marginBottom: 2,
                                  }}
                                >
                                  {displayVendor}
                                </Text>
                                <Text
                                  style={{
                                    fontFamily: "Inter_500Medium",
                                    fontSize: 12,
                                    color: "#555555",
                                  }}
                                >
                                  {displayCategory} • {displayCrop}
                                </Text>
                                <Text
                                  style={{
                                    fontFamily: "Inter_500Medium",
                                    fontSize: 11,
                                    color: "#9ca3af",
                                    marginTop: 4,
                                  }}
                                >
                                  {displayMethod} •{" "}
                                  <Text
                                    style={{
                                      color: tx.isPending ? "#ea580c" : "#16a34a",
                                    }}
                                  >
                                    {displayStatus}
                                  </Text>
                                </Text>
                              </View>

                              <Text
                                style={{
                                  fontFamily: "Inter_700Bold",
                                  fontSize: 16,
                                  color: tx.type === "in" ? "#16a34a" : "#dc2626",
                                }}
                              >
                                {tx.type === "in" ? "+" : "-"}₹
                                {tx.amount.toLocaleString()}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })
              )}

              {/* PENDING MONEY SHORTCUT */}
              <TouchableOpacity
                onPress={() => setShowPendingMoney(true)}
                style={{
                  backgroundColor: "#fff7ed",
                  borderRadius: 16,
                  padding: 16,
                  marginTop: 8,
                  marginBottom: 100,
                  borderWidth: 1,
                  borderColor: "#ffedd5",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Clock
                    color="#ea580c"
                    size={24}
                    style={{ marginRight: 12 }}
                  />
                  <View>
                    <Text
                      style={{
                        fontFamily: "Inter_700Bold",
                        fontSize: 15,
                        color: "#9a3412",
                      }}
                    >
                      {i18n.language === "ta"
                        ? "2 நிலுவை தொகைகள்"
                        : "2 Pending Payments"}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "Inter_500Medium",
                        fontSize: 12,
                        color: "#c2410c",
                      }}
                    >
                      {i18n.language === "ta"
                        ? "நிலுவை தொகைகளைக் காண தட்டவும்"
                        : "Tap to view outstanding balances"}
                    </Text>
                  </View>
                </View>
                <ChevronRight color="#ea580c" size={20} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* FLOATING ACTION BUTTON */}
        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={{
            position: "absolute",
            bottom: 100,
            right: 24,
            backgroundColor: "#14532d",
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderRadius: 30,
            flexDirection: "row",
            alignItems: "center",
            shadowColor: "#14532d",
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Plus color="#ffffff" size={20} style={{ marginRight: 8 }} />
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 16,
              color: "#ffffff",
            }}
          >
            {i18n.language === "ta" ? "சேர்க்க" : "Add"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 1. ADD TRANSACTION MODAL */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#f9fafb",
            paddingTop: 20,
            alignSelf: "center",
            width: "100%",
            maxWidth: 480,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              marginBottom: 24,
              alignItems: "center",
            }}
          >
            <View>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 24,
                  color: "#0f0f0f",
                }}
              >
                {i18n.language === "ta"
                  ? "பரிவர்த்தனை சேர்க்க"
                  : "Add Transaction"}
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 14,
                  color: "#555",
                }}
              >
                {i18n.language === "ta"
                  ? "எவ்வாறு சேர்க்க வேண்டும் என்பதைத் தேர்ந்தெடுக்கவும்"
                  : "Choose how you want to add"}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X color="#0f0f0f" size={24} />
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                setShowScanCapture(true);
              }}
              style={{
                backgroundColor: "#f0fdf4",
                borderRadius: 20,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#bbf7d0",
              }}
            >
              <View
                style={{
                  backgroundColor: "#16a34a",
                  padding: 12,
                  borderRadius: 16,
                  marginRight: 16,
                }}
              >
                <Camera color="#ffffff" size={28} />
              </View>
              <View>
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 18,
                    color: "#14532d",
                  }}
                >
                  {i18n.language === "ta" ? "ரசீது ஸ்கேன்" : "Scan Bill"}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                    color: "#16a34a",
                  }}
                >
                  {i18n.language === "ta"
                    ? "உங்கள் ரசீதை புகைப்படம் எடுக்கவும்"
                    : "Take a photo of your bill"}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                    color: "#16a34a",
                  }}
                >
                  {i18n.language === "ta"
                    ? "விவரங்களை AI பிரித்தெடுக்கும்"
                    : "We'll extract the details"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                setShowVoiceModal(true);
              }}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <View
                style={{
                  backgroundColor: "#f3f4f6",
                  padding: 12,
                  borderRadius: 16,
                  marginRight: 16,
                }}
              >
                <Mic color="#16a34a" size={28} />
              </View>
              <View>
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 18,
                    color: "#0f0f0f",
                  }}
                >
                  {i18n.language === "ta" ? "குரல் பதிவு" : "Voice Entry"}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                    color: "#555",
                  }}
                >
                  {i18n.language === "ta"
                    ? "உங்கள் பரிவர்த்தனையை பேசுங்கள்"
                    : "Speak your transaction"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                setShowManualModal(true);
              }}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20,
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <View
                style={{
                  backgroundColor: "#f3f4f6",
                  padding: 12,
                  borderRadius: 16,
                  marginRight: 16,
                }}
              >
                <PenTool color="#16a34a" size={28} />
              </View>
              <View>
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 18,
                    color: "#0f0f0f",
                  }}
                >
                  {i18n.language === "ta" ? "நேரடி பதிவு" : "Manual Entry"}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                    color: "#555",
                  }}
                >
                  {i18n.language === "ta"
                    ? "விவரங்களை கைமுறையாக நிரப்பவும்"
                    : "Fill details manually"}
                </Text>
              </View>
            </TouchableOpacity>

            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 16,
                color: "#0f0f0f",
                marginTop: 20,
                marginBottom: 8,
              }}
            >
              {i18n.language === "ta" ? "சமீபத்திய ஸ்கேன்கள்" : "Recent Scans"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                setSelectedTx({
                  vendor: "Sri Agro Traders",
                  category: "Fertilizer",
                  amount: 13500,
                  type: "out",
                  date: "17 Sep 2026",
                  method: "UPI",
                  crop: "Wheat - Rabi 2026",
                  status: "Paid",
                });
                setShowTransactionDetails(true);
              }}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 50,
                  backgroundColor: "#e5e7eb",
                  borderRadius: 6,
                  marginRight: 12,
                }}
              />
              <View>
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 14,
                    color: "#0f0f0f",
                  }}
                >
                  Sri Agro Traders
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 12,
                    color: "#555",
                  }}
                >
                  17 Sep 2026 • ₹13,500
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. SCAN CAPTURE (REAL OCR & CAMERA) */}
      <Modal visible={showScanCapture} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "#000000",
            alignSelf: "center",
            width: "100%",
            maxWidth: 480,
          }}
        >
          {/* Top Control Bar */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingTop: 50,
              paddingBottom: 15,
              zIndex: 20,
              backgroundColor: "rgba(0,0,0,0.8)",
            }}
          >
            <TouchableOpacity
              onPress={() => setShowScanCapture(false)}
              style={{ padding: 4 }}
            >
              <X color="#ffffff" size={28} />
            </TouchableOpacity>
            <Text
              style={{
                color: "#ffffff",
                fontFamily: "Inter_700Bold",
                fontSize: 16,
              }}
            >
              AI Bill & Receipt Scanner
            </Text>
            <TouchableOpacity onPress={handlePickImage} style={{ padding: 4 }}>
              <ImageIcon color="#ffffff" size={26} />
            </TouchableOpacity>
          </View>

          {/* Viewfinder Frame */}
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              backgroundColor: "#090d16",
            }}
          >
            {isAnalyzingImage ? (
              <View style={{ alignItems: "center", justifyContent: "center", width: "85%", height: "70%", borderRadius: 16, overflow: "hidden" }}>
                {scannedImageUri && (
                  <RNImage
                    source={{ uri: scannedImageUri }}
                    style={{ position: "absolute", width: "100%", height: "100%", opacity: 0.5 }}
                    resizeMode="cover"
                  />
                )}
                <View style={{ alignItems: "center", padding: 30, backgroundColor: "rgba(0,0,0,0.65)", borderRadius: 16 }}>
                  <ActivityIndicator size="large" color="#16a34a" />
                  <Text
                    style={{
                      color: "#ffffff",
                      fontFamily: "Inter_700Bold",
                      fontSize: 16,
                      marginTop: 16,
                      textAlign: "center",
                    }}
                  >
                    Gemini AI Extracting Bill Details...
                  </Text>
                  <Text
                    style={{
                      color: "#94a3b8",
                      fontFamily: "Inter_500Medium",
                      fontSize: 13,
                      marginTop: 4,
                      textAlign: "center",
                    }}
                  >
                    Parsing line items, tax, and totals
                  </Text>
                </View>
              </View>
            ) : scannedImageUri ? (
              <View style={{ width: "85%", height: "70%", borderRadius: 16, overflow: "hidden" }}>
                <RNImage
                  source={{ uri: scannedImageUri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View
                style={{
                  width: "85%",
                  height: "70%",
                  borderRadius: 16,
                  borderStyle: "dashed",
                  borderWidth: 2,
                  borderColor: "rgba(255,255,255,0.3)",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: 20,
                }}
              >
                <Camera
                  color="#16a34a"
                  size={56}
                  style={{ marginBottom: 16 }}
                />
                <Text
                  style={{
                    color: "#ffffff",
                    fontFamily: "Inter_700Bold",
                    fontSize: 16,
                    textAlign: "center",
                    marginBottom: 6,
                  }}
                >
                  Position Bill Inside Frame
                </Text>
                <Text
                  style={{
                    color: "#94a3b8",
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                    textAlign: "center",
                    marginBottom: 24,
                  }}
                >
                  Align invoice or receipt to automatically extract vendor, date
                  & total
                </Text>

                <TouchableOpacity
                  onPress={handlePickImage}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.3)",
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontFamily: "Inter_700Bold",
                      fontSize: 13,
                    }}
                  >
                    📁 Select from Gallery
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Green Reticle Corner Indicators */}
            <View
              style={{
                position: "absolute",
                top: "12%",
                left: "5%",
                width: 36,
                height: 36,
                borderTopWidth: 4,
                borderLeftWidth: 4,
                borderColor: "#16a34a",
              }}
            />
            <View
              style={{
                position: "absolute",
                top: "12%",
                right: "5%",
                width: 36,
                height: 36,
                borderTopWidth: 4,
                borderRightWidth: 4,
                borderColor: "#16a34a",
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: "12%",
                left: "5%",
                width: 36,
                height: 36,
                borderBottomWidth: 4,
                borderLeftWidth: 4,
                borderColor: "#16a34a",
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: "12%",
                right: "5%",
                width: 36,
                height: 36,
                borderBottomWidth: 4,
                borderRightWidth: 4,
                borderColor: "#16a34a",
              }}
            />
          </View>

          {/* Bottom Shutter Capture Bar or Preview Actions */}
          <View
            style={{
              paddingBottom: 40,
              paddingTop: 20,
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.8)",
            }}
          >
            {isAnalyzingImage ? (
               <View style={{ height: 106 }} />
            ) : scannedImageUri ? (
              <View style={{ flexDirection: "row", gap: 16, width: "100%", paddingHorizontal: 30 }}>
                <TouchableOpacity
                  onPress={() => {
                    setScannedImageUri(null);
                    setScannedBase64(undefined);
                  }}
                  style={{ flex: 1, padding: 16, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center" }}
                >
                  <Text style={{ color: "#ffffff", fontFamily: "Inter_700Bold", fontSize: 16 }}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (scannedImageUri) {
                      setIsAnalyzingImage(true);
                      processBillImage(scannedImageUri, scannedBase64);
                    }
                  }}
                  style={{ flex: 2, padding: 16, borderRadius: 16, backgroundColor: "#16a34a", alignItems: "center" }}
                >
                  <Text style={{ color: "#ffffff", fontFamily: "Inter_700Bold", fontSize: 16 }}>Analyze Bill</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ alignItems: "center" }}>
                <TouchableOpacity
                  onPress={handleTakeCameraPhoto}
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 38,
                    backgroundColor: "transparent",
                    borderWidth: 4,
                    borderColor: "#ffffff",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: "#16a34a",
                    }}
                  />
                </TouchableOpacity>
                <Text
                  style={{
                    color: "#ffffff",
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                    marginTop: 10,
                  }}
                >
                  Tap Shutter to Snap Receipt
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 3. AI EXTRACTION & REVIEW */}
      <Modal visible={showExtractionReview} animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "#ffffff",
            paddingTop: 50,
            alignSelf: "center",
            width: "100%",
            maxWidth: 480,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              marginBottom: 20,
              alignItems: "center",
            }}
          >
            <TouchableOpacity onPress={() => setShowExtractionReview(false)}>
              <X color="#0f0f0f" size={24} />
            </TouchableOpacity>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 18,
                color: "#0f0f0f",
              }}
            >
              Extracted Details
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 40,
              gap: 16,
            }}
           showsHorizontalScrollIndicator={false}>
            {/* Header card with extracted vendor */}
            <View
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: "#e2e8f0",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 18,
                    color: "#0f0f0f",
                  }}
                >
                  {extractedTx.vendor || "Scanned Receipt"}
                </Text>
                <View
                  style={{
                    backgroundColor: "#f3e8ff",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text
                    style={{
                      color: "#7c3aed",
                      fontFamily: "Inter_700Bold",
                      fontSize: 11,
                    }}
                  >
                    ✨ AI Extracted
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  color: "#64748b",
                  fontFamily: "Inter_500Medium",
                  fontSize: 13,
                }}
              >
                {extractedTx.description || "Items extracted from receipt"}
              </Text>
            </View>

            {/* Editable Amount */}
            <View>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 13,
                  color: "#475569",
                  marginBottom: 6,
                }}
              >
                Total Amount (₹)
              </Text>
              <TextInput
                value={extractedTx.amount}
                onChangeText={(val) =>
                  setExtractedTx({ ...extractedTx, amount: val })
                }
                keyboardType="numeric"
                style={{
                  borderWidth: 1,
                  borderColor: "#cbd5e1",
                  borderRadius: 12,
                  padding: 14,
                  fontFamily: "Inter_700Bold",
                  fontSize: 20,
                  color: "#16a34a",
                }}
              />
            </View>

            {/* Editable Vendor */}
            <View>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 13,
                  color: "#475569",
                  marginBottom: 6,
                }}
              >
                Vendor / Store Name
              </Text>
              <TextInput
                value={extractedTx.vendor}
                onChangeText={(val) =>
                  setExtractedTx({ ...extractedTx, vendor: val })
                }
                style={{
                  borderWidth: 1,
                  borderColor: "#cbd5e1",
                  borderRadius: 12,
                  padding: 14,
                  fontFamily: "Inter_500Medium",
                  fontSize: 15,
                }}
              />
            </View>

            {/* Date */}
            <View>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 13,
                  color: "#475569",
                  marginBottom: 6,
                }}
              >
                Date
              </Text>
              <TextInput
                value={extractedTx.date}
                onChangeText={(val) =>
                  setExtractedTx({ ...extractedTx, date: val })
                }
                style={{
                  borderWidth: 1,
                  borderColor: "#cbd5e1",
                  borderRadius: 12,
                  padding: 14,
                  fontFamily: "Inter_500Medium",
                  fontSize: 15,
                }}
              />
            </View>

            {/* Category */}
            <View>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 13,
                  color: "#475569",
                  marginBottom: 6,
                }}
              >
                Category
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
               showsVerticalScrollIndicator={false}>
                {[
                  "Fertilizer",
                  "Seeds",
                  "Pesticide",
                  "Equipment",
                  "Labour",
                  "Crop Sale",
                  "Other",
                ].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() =>
                      setExtractedTx({ ...extractedTx, category: cat })
                    }
                    style={{
                      backgroundColor:
                        extractedTx.category === cat ? "#16a34a" : "#f1f5f9",
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          extractedTx.category === cat ? "#ffffff" : "#475569",
                        fontFamily: "Inter_700Bold",
                        fontSize: 13,
                      }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Confidence Bar */}
            <View
              style={{
                backgroundColor: "#f0fdf4",
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: "#bbf7d0",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{
                    color: "#166534",
                    fontFamily: "Inter_700Bold",
                    fontSize: 12,
                  }}
                >
                  AI Extraction Confidence
                </Text>
                <Text
                  style={{
                    color: "#16a34a",
                    fontFamily: "Inter_700Bold",
                    fontSize: 12,
                  }}
                >
                  {extractedTx.confidence || 95}%
                </Text>
              </View>
              <View
                style={{
                  height: 6,
                  backgroundColor: "#dcfce7",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${extractedTx.confidence || 95}%`,
                    height: "100%",
                    backgroundColor: "#16a34a",
                  }}
                />
              </View>
            </View>

            {/* Confirm & Save to Ledger Button */}
            <TouchableOpacity
              onPress={() => {
                handleAddTransaction({
                  vendor:
                    extractedTx.vendor ||
                    (i18n.language === "ta"
                      ? "ஸ்கேன் செய்த ரசீது"
                      : "Scanned Receipt"),
                  amount: extractedTx.amount || 0,
                  type: extractedTx.type || "out",
                  category: extractedTx.category || "General",
                  crop: extractedTx.crop || "Wheat",
                  date: extractedTx.date,
                  description:
                    extractedTx.description ||
                    (i18n.language === "ta"
                      ? "AI ஸ்கேனர் மூலமாக பெறப்பட்டது"
                      : "Extracted via AI Scanner"),
                  items: extractedTx.items,
                  subtotal: extractedTx.subtotal,
                  tax: extractedTx.tax,
                });
              }}
              style={{
                backgroundColor: "#16a34a",
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 16,
                  color: "#ffffff",
                }}
              >
                Confirm & Add to Digital Ledger
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* 4. SUCCESS SCREEN */}
      <Modal visible={showSuccess} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "#f9fafb",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
            alignSelf: "center",
            width: "100%",
            maxWidth: 480,
          }}
        >
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: "#dcfce7",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 30,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: "#16a34a",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Check color="#ffffff" size={40} strokeWidth={3} />
            </View>
          </View>

          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 28,
              color: "#0f0f0f",
              marginBottom: 12,
            }}
          >
            Transaction Added!
          </Text>
          <Text
            style={{
              fontFamily: "Inter_500Medium",
              fontSize: 15,
              color: "#555",
              textAlign: "center",
              marginBottom: 40,
              paddingHorizontal: 20,
            }}
          >
            The transaction has been saved to your financial ledger.
          </Text>

          <TouchableOpacity
            onPress={() => setShowSuccess(false)}
            style={{
              backgroundColor: "#14532d",
              width: "100%",
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 16,
                color: "#ffffff",
              }}
            >
              View in Ledger
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: "#ffffff",
              width: "100%",
              paddingVertical: 16,
              borderRadius: 16,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#14532d",
              marginBottom: 40,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 16,
                color: "#14532d",
              }}
            >
              Add Another
            </Text>
          </TouchableOpacity>

          <View
            style={{
              backgroundColor: "#f5f3ff",
              width: "100%",
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "flex-start",
            }}
          >
            <Sparkles
              color="#7c3aed"
              size={20}
              style={{ marginRight: 12, marginTop: 2 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 14,
                  color: "#6d28d9",
                  marginBottom: 4,
                }}
              >
                AI Summary
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 13,
                  color: "#5b21b6",
                }}
              >
                Fertilizer expense of ₹18,900 added for Wheat - Rabi 2026.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* 6. EXPANDABLE TRANSACTION DETAILS */}
      <Modal
        visible={showTransactionDetails}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "#f9fafb",
            paddingTop: 20,
            alignSelf: "center",
            width: "100%",
            maxWidth: 480,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 20,
              marginBottom: 24,
            }}
          >
            <TouchableOpacity
              onPress={() => setShowTransactionDetails(false)}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <ChevronLeft color="#0f0f0f" size={24} />
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 18,
                  color: "#0f0f0f",
                  marginLeft: 8,
                }}
              >
                Transaction Details
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Edit color="#16a34a" size={16} />
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 14,
                  color: "#16a34a",
                  marginLeft: 4,
                }}
              >
                Edit
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20,
                padding: 20,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 24,
                  borderBottomWidth: 1,
                  borderBottomColor: "#f3f4f6",
                  paddingBottom: 20,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      backgroundColor: "#f0fdf4",
                      padding: 12,
                      borderRadius: 12,
                      marginRight: 12,
                    }}
                  >
                    <Leaf color="#16a34a" size={24} />
                  </View>
                  <View>
                    <Text
                      style={{
                        fontFamily: "Inter_700Bold",
                        fontSize: 16,
                        color: "#0f0f0f",
                      }}
                    >
                      {selectedTx?.vendor || "Vendor Name"}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "Inter_500Medium",
                        fontSize: 12,
                        color: "#555",
                      }}
                    >
                      {selectedTx?.category || "Category"} • {selectedTx?.type === "in" ? "Income" : "Expense"}
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 20,
                    color: selectedTx?.type === "in" ? "#16a34a" : "#dc2626",
                  }}
                >
                  {selectedTx?.type === "in" ? "+ " : "- "}₹{(selectedTx?.amount || 0).toLocaleString("en-IN")}
                </Text>
              </View>

              <View style={{ gap: 16, marginBottom: 24 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: "#555",
                    }}
                  >
                    Date
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: "#0f0f0f",
                    }}
                  >
                    {selectedTx?.date || "Date"}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: "#555",
                    }}
                  >
                    Category
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: "#0f0f0f",
                    }}
                  >
                    {selectedTx?.category || "Category"}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: "#555",
                    }}
                  >
                    Crop
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: "#0f0f0f",
                    }}
                  >
                    {selectedTx?.crop || "General"}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: "#555",
                    }}
                  >
                    Field
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: "#0f0f0f",
                    }}
                  >
                    Field A
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: "#555",
                    }}
                  >
                    Vendor
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: "#0f0f0f",
                    }}
                  >
                    {selectedTx?.vendor || "Vendor"}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: "#555",
                    }}
                  >
                    Payment Method
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: "#0f0f0f",
                    }}
                  >
                    {selectedTx?.method || "UPI"}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: "#555",
                    }}
                  >
                    Status
                  </Text>
                  <View
                    style={{
                      backgroundColor: "#dcfce7",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Inter_700Bold",
                        fontSize: 12,
                        color: selectedTx?.isPending ? "#b45309" : "#16a34a",
                      }}
                    >
                      {selectedTx?.status || "Paid"}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: "#555",
                    }}
                  >
                    Description
                  </Text>
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: "#0f0f0f",
                      flex: 1,
                      textAlign: "right",
                      marginLeft: 16,
                    }}
                  >
                    {selectedTx?.description || "-"}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 14,
                      color: "#555",
                    }}
                  >
                    Receipt
                  </Text>
                  <TouchableOpacity
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 32,
                        backgroundColor: "#e5e7eb",
                        borderRadius: 4,
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={{
                        fontFamily: "Inter_700Bold",
                        fontSize: 14,
                        color: "#0284c7",
                      }}
                    >
                      View Receipt
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {selectedTx?.items && selectedTx.items.length > 0 && (
                <>
                  <Text
                    style={{
                      fontFamily: "Inter_700Bold",
                      fontSize: 16,
                      color: "#0f0f0f",
                      marginBottom: 16,
                    }}
                  >
                    Items (from bill)
                  </Text>
                  <View style={{ gap: 12 }}>
                    {selectedTx.items.map((item: any, index: number) => (
                      <View
                        key={index}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <View style={{ flex: 2 }}>
                          <Text
                            style={{
                              fontFamily: "Inter_700Bold",
                              fontSize: 13,
                              color: "#0f0f0f",
                            }}
                          >
                            {item.name}
                          </Text>
                          {item.unitPrice ? (
                            <Text
                              style={{
                                fontFamily: "Inter_500Medium",
                                fontSize: 11,
                                color: "#6b7280",
                                marginTop: 2,
                              }}
                            >
                              @ ₹{item.unitPrice.toLocaleString("en-IN")}/unit
                            </Text>
                          ) : null}
                        </View>
                        <Text
                          style={{
                            flex: 1,
                            fontFamily: "Inter_500Medium",
                            fontSize: 13,
                            color: "#555",
                          }}
                        >
                          {item.quantity}
                        </Text>
                        <Text
                          style={{
                            flex: 1,
                            fontFamily: "Inter_700Bold",
                            fontSize: 13,
                            color: "#0f0f0f",
                            textAlign: "right",
                          }}
                        >
                          ₹{(item.totalPrice || item.price || 0).toLocaleString("en-IN")}
                        </Text>
                      </View>
                    ))}
                    
                    {(selectedTx.subtotal || selectedTx.tax) && (
                      <>
                        <View
                          style={{
                            height: 1,
                            backgroundColor: "#e5e7eb",
                            marginVertical: 4,
                          }}
                        />
                        {selectedTx.subtotal > 0 && (
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                            }}
                          >
                            <Text
                              style={{
                                fontFamily: "Inter_700Bold",
                                fontSize: 13,
                                color: "#0f0f0f",
                              }}
                            >
                              Subtotal
                            </Text>
                            <Text
                              style={{
                                fontFamily: "Inter_700Bold",
                                fontSize: 13,
                                color: "#0f0f0f",
                              }}
                            >
                              ₹{selectedTx.subtotal.toLocaleString("en-IN")}
                            </Text>
                          </View>
                        )}
                        {selectedTx.tax > 0 && (
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                            }}
                          >
                            <Text
                              style={{
                                fontFamily: "Inter_500Medium",
                                fontSize: 13,
                                color: "#555",
                              }}
                            >
                              Tax (GST)
                            </Text>
                            <Text
                              style={{
                                fontFamily: "Inter_700Bold",
                                fontSize: 13,
                                color: "#0f0f0f",
                              }}
                            >
                              ₹{selectedTx.tax.toLocaleString("en-IN")}
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                    
                    <View
                      style={{
                        height: 1,
                        backgroundColor: "#e5e7eb",
                        marginVertical: 4,
                      }}
                    />
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Inter_700Bold",
                          fontSize: 18,
                          color: "#0f0f0f",
                        }}
                      >
                        Total
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Inter_700Bold",
                          fontSize: 18,
                          color: "#0f0f0f",
                        }}
                      >
                        ₹{(selectedTx.amount || 0).toLocaleString("en-IN")}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            <View style={{ flexDirection: "row", gap: 16, marginBottom: 40 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#fef2f2",
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#fecdd3",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 16,
                    color: "#dc2626",
                  }}
                >
                  Delete
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowTransactionDetails(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#f3f4f6",
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 16,
                    color: "#0f0f0f",
                  }}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* 7. PENDING MONEY DASHBOARD */}
      <Modal visible={showPendingMoney} animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "#f9fafb",
            paddingTop: 50,
            alignSelf: "center",
            width: "100%",
            maxWidth: 480,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              marginBottom: 20,
            }}
          >
            <TouchableOpacity onPress={() => setShowPendingMoney(false)}>
              <ChevronLeft color="#0f0f0f" size={28} />
            </TouchableOpacity>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 20,
                color: "#0f0f0f",
                marginLeft: 8,
              }}
            >
              Pending Money
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 20,
              gap: 12,
              marginBottom: 24,
            }}
          >
            <TouchableOpacity
              onPress={() => setPendingTab("pay")}
              style={{
                flex: 1,
                backgroundColor: pendingTab === "pay" ? "#14532d" : "#ffffff",
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: pendingTab === "pay" ? "#14532d" : "#e5e7eb",
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 14,
                  color: pendingTab === "pay" ? "#ffffff" : "#555",
                }}
              >
                To Pay (2)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPendingTab("receive")}
              style={{
                flex: 1,
                backgroundColor:
                  pendingTab === "receive" ? "#14532d" : "#ffffff",
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: pendingTab === "receive" ? "#14532d" : "#e5e7eb",
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 14,
                  color: pendingTab === "receive" ? "#ffffff" : "#555",
                }}
              >
                To Receive (1)
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
            <View
              style={{
                backgroundColor: "#fff7ed",
                borderRadius: 20,
                padding: 20,
                marginBottom: 24,
                borderWidth: 1,
                borderColor: "#ffedd5",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  backgroundColor: "#ffedd5",
                  padding: 12,
                  borderRadius: 12,
                  marginRight: 16,
                }}
              >
                <ShieldCheck color="#ea580c" size={28} />
              </View>
              <View>
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 14,
                    color: "#9a3412",
                    marginBottom: 4,
                  }}
                >
                  Total To Pay
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 28,
                    color: "#ea580c",
                  }}
                >
                  ₹22,700
                </Text>
              </View>
            </View>

            <View style={{ gap: 16 }}>
              {pendingToPay.map((p) => (
                <View
                  key={p.id}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 16,
                    }}
                  >
                    <View style={{ flexDirection: "row" }}>
                      <View
                        style={{
                          backgroundColor: "#f3f4f6",
                          padding: 12,
                          borderRadius: 12,
                          marginRight: 12,
                        }}
                      >
                        {p.type === "person" ? (
                          <User color="#ea580c" size={20} />
                        ) : (
                          <Landmark color="#ea580c" size={20} />
                        )}
                      </View>
                      <View>
                        <Text
                          style={{
                            fontFamily: "Inter_700Bold",
                            fontSize: 16,
                            color: "#0f0f0f",
                          }}
                        >
                          {p.vendor}
                        </Text>
                        <Text
                          style={{
                            fontFamily: "Inter_500Medium",
                            fontSize: 13,
                            color: "#555",
                          }}
                        >
                          {p.desc}
                        </Text>
                        <Text
                          style={{
                            fontFamily: "Inter_700Bold",
                            fontSize: 12,
                            color: "#ea580c",
                            marginTop: 4,
                          }}
                        >
                          Due: {p.due}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        fontFamily: "Inter_700Bold",
                        fontSize: 18,
                        color: "#dc2626",
                      }}
                    >
                      ₹{p.amount.toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#f9fafb",
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      paddingVertical: 12,
                      borderRadius: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Inter_700Bold",
                        fontSize: 14,
                        color: "#16a34a",
                      }}
                    >
                      {p.type === "person" ? "Mark as Paid" : "Pay Now"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MANUAL ENTRY MODAL */}
      <Modal visible={showManualModal} animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "#ffffff",
            paddingTop: 50,
            paddingHorizontal: 20,
            alignSelf: "center",
            width: "100%",
            maxWidth: 480,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 22,
                color: "#0f0f0f",
              }}
            >
              Manual Entry
            </Text>
            <TouchableOpacity onPress={() => setShowManualModal(false)}>
              <X color="#0f0f0f" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 16, paddingBottom: 40 }}
           showsHorizontalScrollIndicator={false}>
            {/* Type Toggle */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: "#f1f5f9",
                borderRadius: 12,
                padding: 4,
              }}
            >
              <TouchableOpacity
                onPress={() => setManualType("out")}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor:
                    manualType === "out" ? "#ef4444" : "transparent",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    color: manualType === "out" ? "#ffffff" : "#64748b",
                  }}
                >
                  Expense (Money Out)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setManualType("in")}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: "center",
                  borderRadius: 8,
                  backgroundColor:
                    manualType === "in" ? "#16a34a" : "transparent",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    color: manualType === "in" ? "#ffffff" : "#64748b",
                  }}
                >
                  Income (Money In)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Vendor / Payee */}
            <View>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 13,
                  color: "#475569",
                  marginBottom: 6,
                }}
              >
                Vendor / Party Name
              </Text>
              <TextInput
                value={manualVendor}
                onChangeText={setManualVendor}
                placeholder="e.g. Sri Agro Traders / Local Mandi"
                style={{
                  borderWidth: 1,
                  borderColor: "#cbd5e1",
                  borderRadius: 12,
                  padding: 14,
                  fontFamily: "Inter_500Medium",
                  fontSize: 15,
                }}
              />
            </View>

            {/* Amount */}
            <View>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 13,
                  color: "#475569",
                  marginBottom: 6,
                }}
              >
                Amount (₹)
              </Text>
              <TextInput
                value={manualAmount}
                onChangeText={setManualAmount}
                keyboardType="numeric"
                placeholder="e.g. 5000"
                style={{
                  borderWidth: 1,
                  borderColor: "#cbd5e1",
                  borderRadius: 12,
                  padding: 14,
                  fontFamily: "Inter_700Bold",
                  fontSize: 18,
                  color: manualType === "out" ? "#ef4444" : "#16a34a",
                }}
              />
            </View>

            {/* Category selector */}
            <View>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 13,
                  color: "#475569",
                  marginBottom: 6,
                }}
              >
                Category
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
               showsVerticalScrollIndicator={false}>
                {[
                  "Fertilizer",
                  "Labour",
                  "Seeds",
                  "Equipment",
                  "Crop Sale",
                  "Pesticide",
                  "Irrigation",
                ].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setManualCategory(cat)}
                    style={{
                      backgroundColor:
                        manualCategory === cat ? "#16a34a" : "#f1f5f9",
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                    }}
                  >
                    <Text
                      style={{
                        color: manualCategory === cat ? "#ffffff" : "#475569",
                        fontFamily: "Inter_700Bold",
                        fontSize: 13,
                      }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={() => {
                if (!manualVendor || !manualAmount) {
                  alert(
                    i18n.language === "ta"
                      ? "தயவுசெய்து விற்பனையாளர் பெயர் மற்றும் தொகையை உள்ளிடவும்."
                      : "Please enter vendor name and amount.",
                  );
                  return;
                }
                handleAddTransaction({
                  vendor: manualVendor,
                  amount: manualAmount,
                  type: manualType,
                  category: manualCategory,
                  crop: selectedCrop || "General",
                });
                setManualVendor("");
                setManualAmount("");
              }}
              style={{
                backgroundColor: "#16a34a",
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
                marginTop: 20,
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontFamily: "Inter_700Bold",
                  fontSize: 16,
                }}
              >
                Save Transaction
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* VOICE ENTRY MODAL */}
      <Modal visible={showVoiceModal} animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "#ffffff",
            paddingTop: 50,
            paddingHorizontal: 20,
            alignSelf: "center",
            width: "100%",
            maxWidth: 480,
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 20,
                color: "#0f0f0f",
              }}
            >
              AI Voice Transaction
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowVoiceModal(false);
                setIsListeningVoice(false);
              }}
            >
              <X color="#0f0f0f" size={24} />
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: "center", paddingHorizontal: 20 }}>
            <TouchableOpacity
              onPress={() => {
                setIsListeningVoice(true);
                setTimeout(() => {
                  setIsListeningVoice(false);
                  setVoiceText(
                    "Bought 2 bags of Urea fertilizer for ₹2,400 from Sri Agro Traders",
                  );
                }, 2000);
              }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: isListeningVoice ? "#ef4444" : "#16a34a",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 24,
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 5,
              }}
            >
              <Mic color="#ffffff" size={44} />
            </TouchableOpacity>

            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 16,
                color: "#0f0f0f",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              {isListeningVoice
                ? "Listening..."
                : "Tap Mic & Speak Transaction"}
            </Text>
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 13,
                color: "#64748b",
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              Say something like: "Spent 4000 rupees on Labour today"
            </Text>

            {voiceText ? (
              <View
                style={{
                  backgroundColor: "#f0fdf4",
                  borderWidth: 1,
                  borderColor: "#bbf7d0",
                  padding: 16,
                  borderRadius: 16,
                  width: "100%",
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    color: "#166534",
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  AI Extracted Result:
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    color: "#0f0f0f",
                    fontSize: 14,
                  }}
                >
                  "{voiceText}"
                </Text>
              </View>
            ) : null}
          </View>

          {voiceText ? (
            <TouchableOpacity
              onPress={() => {
                let vendor = "Sri Agro Traders";
                let amount = 2400;
                let category = "Fertilizers";
                let description = voiceText;
                if (
                  voiceText.includes("Labour") ||
                  voiceText.includes("தொழிலாளர்")
                ) {
                  vendor = "Farm Labour";
                  amount = 4000;
                  category = "Labour";
                }
                handleAddTransaction({
                  vendor,
                  amount,
                  type: "out",
                  category,
                  description,
                });
                setVoiceText("");
              }}
              style={{
                backgroundColor: "#16a34a",
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: "center",
                width: "100%",
              }}
            >
              <Text
                style={{
                  color: "#ffffff",
                  fontFamily: "Inter_700Bold",
                  fontSize: 16,
                }}
              >
                Confirm & Add to Ledger
              </Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
        </View>
      </Modal>
      
      {/* Edit Balance Modal */}
      <Modal
        visible={showEditBalanceModal}
        transparent
        animationType="fade"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '90%', maxWidth: 360, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, marginBottom: 16 }}>Set Starting Balance</Text>
            <Text style={{ color: '#64748b', marginBottom: 16, fontSize: 13 }}>Enter the actual cash/bank balance you currently have. We will save this securely and calculate your real-time available cash moving forward.</Text>
            
            <TextInput
              style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 20, fontWeight: '700', marginBottom: 24, textAlign: 'center', color: '#0f172a' }}
              keyboardType="numeric"
              value={newBalanceInput}
              onChangeText={setNewBalanceInput}
              placeholder="e.g. 85000"
            />
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowEditBalanceModal(false)} style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', color: '#64748b' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateOpeningCash} style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#16a34a', alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', color: '#fff' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
