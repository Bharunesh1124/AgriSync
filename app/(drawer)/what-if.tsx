import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Sparkles, Activity, Play, RefreshCcw, AlertTriangle, Calculator, ChevronLeft, Save, Target, Sprout, TrendingDown, Tractor, Landmark, FlaskConical, CloudRain, Sun, Wind, Bug } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { 
  DEMO_FARM_DATA, FarmData, SimulationResult,
  simulateSellVsStore, simulatePriceDrop, simulateBuyVsRent, 
  simulateLoanPrepayment, simulateYieldChange, simulateInputCost,
  simulateHeavyRain, simulateFlood, simulateDrought, simulateExtremeHeat, simulatePestAttack,
  simulatePriceSpike, simulatePriceVolatility, simulateMandiDisruption, simulateFuelSpike,
  simulateLivestockFeedSpike, simulateHerdExpansion, simulateStressTest
} from '../../src/lib/simulationEngine';

// Compact Slider with Quick Presets
const CompactSlider = ({ label, value, min, max, step, suffix, onChange, prefix = '', secondaryLabel = '', presets = [] }: any) => (
  <View className="mb-5">
    <View className="flex-row justify-between mb-1">
      <Text className="font-bold text-ink text-sm">{label}</Text>
      <Text className="font-bold text-ink text-sm">{prefix}{value}{suffix} {secondaryLabel}</Text>
    </View>
    <Slider
      style={{ width: '100%', height: 40 }}
      minimumValue={min}
      maximumValue={max}
      step={step}
      value={value}
      onValueChange={onChange}
      minimumTrackTintColor="#16a34a"
      maximumTrackTintColor="#e5e7eb"
      thumbTintColor="#16a34a"
    />
    <View className="flex-row justify-between -mt-2 px-1 mb-2">
      <Text className="text-xs text-gray-400">{prefix}{min}{suffix}</Text>
      <Text className="text-xs text-gray-400">{prefix}{max}{suffix}</Text>
    </View>
    {presets.length > 0 && (
      <View className="flex-row gap-2 mt-1">
        <Text className="text-[10px] text-ink-muted mr-1 self-center">Presets:</Text>
        {presets.map((p: number, i: number) => (
          <TouchableOpacity key={i} onPress={() => onChange(p)} className="bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
            <Text className="text-xs font-bold text-ink">{prefix}{p}{suffix}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

export default function WhatIfSimulator() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isTa = i18n.language === 'ta';

  const CATEGORIES = [
    { id: 'cropMarket', title: isTa ? 'பயிர் & சந்தை' : 'Crop & Market', icon: <TrendingDown color="#16a34a" size={28} />, desc: isTa ? 'உற்பத்தி மற்றும் விலை அபாயங்கள்' : 'Production and price risks' },
    { id: 'weather', title: isTa ? 'வானிலை & பேரிடர்' : 'Weather & Disaster', icon: <CloudRain color="#0284c7" size={28} />, desc: isTa ? 'இயற்கை அபாயங்கள்' : 'Natural risks' },
    { id: 'costs', title: isTa ? 'பண்ணை செலவுகள்' : 'Farm Costs', icon: <Landmark color="#d97706" size={28} />, desc: isTa ? 'செலவு அதிர்ச்சிகள்' : 'Expense shocks' },
    { id: 'livestock', title: isTa ? 'கால்நடை வாய்ப்புகள்' : 'Livestock Scenarios', icon: <Tractor color="#4f46e5" size={28} />, desc: isTa ? 'கால்நடை பொருளாதாரம்' : 'Animal economics' },
    { id: 'stress', title: isTa ? 'அழுத்தச் சோதனை' : 'Stress Test', icon: <AlertTriangle color="#e11d48" size={28} />, desc: isTa ? 'ஒருங்கிணைந்த தீவிர அதிர்ச்சிகள்' : 'Combined extreme shocks' },
  ];

  const SCENARIOS = {
    cropMarket: [
      { id: 'yield', title: isTa ? 'மகசூல் மாற்றம்' : 'Yield Change', icon: <Sprout color="#16a34a" /> },
      { id: 'priceDrop', title: isTa ? 'விலை வீழ்ச்சி' : 'Price Crash', icon: <TrendingDown color="#dc2626" /> },
      { id: 'priceSpike', title: isTa ? 'விலை உயர்வு' : 'Price Spike', icon: <Activity color="#16a34a" /> },
      { id: 'priceVol', title: isTa ? 'சந்தை ஏற்ற இறக்கம்' : 'Market Volatility', icon: <Activity color="#d97706" /> },
      { id: 'mandi', title: isTa ? 'சந்தை இடையூறு' : 'Mandi Disruption', icon: <AlertTriangle color="#f59e0b" /> },
      { id: 'sellStore', title: isTa ? 'விற்பனை vs இருப்பு' : 'Sell vs Store', icon: <Sprout color="#16a34a" /> },
    ],
    weather: [
      { id: 'heavyRain', title: isTa ? 'கனமழை' : 'Heavy Rain', icon: <CloudRain color="#0284c7" /> },
      { id: 'flood', title: isTa ? 'வெள்ளம் / நீர் தேங்குதல்' : 'Flood / Waterlogging', icon: <CloudRain color="#0369a1" /> },
      { id: 'drought', title: isTa ? 'வறட்சி / நீர் பற்றாக்குறை' : 'Drought / Shortage', icon: <Sun color="#f59e0b" /> },
      { id: 'heat', title: isTa ? 'கடும் வெப்பம்' : 'Extreme Heat', icon: <Sun color="#dc2626" /> },
      { id: 'pest', title: isTa ? 'பூச்சி / நோய் தாக்குதல்' : 'Pest / Disease', icon: <Bug color="#84cc16" /> },
    ],
    costs: [
      { id: 'input', title: isTa ? 'உள்ளீட்டு செலவு உயர்வு' : 'Input Cost Spike', icon: <FlaskConical color="#9333ea" /> },
      { id: 'fuel', title: isTa ? 'எரிபொருள் செலவு உயர்வு' : 'Fuel Cost Increase', icon: <Tractor color="#4b5563" /> },
      { id: 'loan', title: isTa ? 'கடன் முன்செலுத்துதல்' : 'Loan Prepayment', icon: <Landmark color="#d97706" /> },
      { id: 'buyRent', title: isTa ? 'வாங்குதல் vs வாடகை' : 'Buy vs Rent', icon: <Tractor color="#2563eb" /> },
    ],
    livestock: [
      { id: 'feedSpike', title: isTa ? 'தீவன விலை உயர்வு' : 'Feed Price Spike', icon: <FlaskConical color="#eab308" /> },
    ],
    stress: [
      { id: 'stressTest', title: isTa ? 'பண்ணை அழுத்தச் சோதனை' : 'Farm Stress Test', icon: <AlertTriangle color="#e11d48" /> }
    ]
  };

  const [mode, setMode] = useState<'CATEGORIES' | 'SCENARIOS' | 'SIMULATION'>('CATEGORIES');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const [farmData, setFarmData] = useState<FarmData>(DEMO_FARM_DATA);
  const [loadingData, setLoadingData] = useState(true);
  const [scenarioType, setScenarioType] = useState('sellStore');
  
  const [availableCrops, setAvailableCrops] = useState<any[]>([]);
  const [activeCropIndex, setActiveCropIndex] = useState(0);

  // States
  const [percentStore, setPercentStore] = useState(60);
  const [storageDays, setStorageDays] = useState(20);
  const [expectedFuturePrice, setExpectedFuturePrice] = useState(31);
  const [simulatedPrice, setSimulatedPrice] = useState(22);
  const [usageHours, setUsageHours] = useState(400);
  const [loanPrepayment, setLoanPrepayment] = useState(40000);
  const [yieldChangePct, setYieldChangePct] = useState(-15);
  const [inputIncreasePct, setInputIncreasePct] = useState(20);
  
  const [damagePct, setDamagePct] = useState(25);
  const [recoveryCost, setRecoveryCost] = useState(15000);
  const [areaPct, setAreaPct] = useState(40);
  
  const [bearPrice, setBearPrice] = useState(25);
  const [bullPrice, setBullPrice] = useState(35);
  const [altPrice, setAltPrice] = useState(27);
  const [transportCost, setTransportCost] = useState(5000);

  const [stressSeverity, setStressSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');

  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const applyCropToFarmData = (cropObj: any) => {
    setFarmData(prev => ({
      ...prev,
      cropName: cropObj.name,
      expectedYield: cropObj.yield,
      currentMarketPrice: cropObj.price,
      totalProductionCost: cropObj.cost
    }));
    setExpectedFuturePrice(cropObj.price + 2);
    setSimulatedPrice(Math.max(2, cropObj.price - 5));
    setBearPrice(Math.max(2, cropObj.price - 4));
    setBullPrice(cropObj.price + 5);
    setAltPrice(Math.max(2, cropObj.price - 2));
  };

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        const defaultCrops = [
          { name: 'Wheat', yield: 37500, price: 29, cost: 264200 },
          { name: 'Rice (Paddy)', yield: 45000, price: 22, cost: 310000 },
          { name: 'Cotton', yield: 12000, price: 75, cost: 180000 },
          { name: 'Sugarcane', yield: 150000, price: 3.5, cost: 120000 }
        ];

        if (user?.user_metadata) {
          const md = user.user_metadata;
          const userCash = md.availableCash ?? md.inventory?.cash_balance ?? md.available_cash;
          if (userCash !== undefined && !isNaN(Number(userCash))) {
            setFarmData(prev => ({ ...prev, cashBalance: Number(userCash) }));
          }

          const totalExpenses = (md.transactions || []).filter((t: any) => t.type === 'expense').reduce((acc: number, t: any) => acc + t.amount, 0);

          const registeredDetails = md.inventory?.cropDetails || [];
          const registeredCropsList = md.inventory?.crops || (registeredDetails.map((c: any) => c.name));

          if (registeredCropsList && registeredCropsList.length > 0) {
            const BENCHMARKS: Record<string, { price: number; yieldPerAcre: number; costPerAcre: number }> = {
              Wheat: { price: 29, yieldPerAcre: 1500, costPerAcre: 12000 },
              Corn: { price: 21, yieldPerAcre: 4000, costPerAcre: 25000 },
              "Rice (Paddy)": { price: 29, yieldPerAcre: 2500, costPerAcre: 30000 },
              Rice: { price: 29, yieldPerAcre: 2500, costPerAcre: 30000 },
              Paddy: { price: 29, yieldPerAcre: 2500, costPerAcre: 30000 },
              Cotton: { price: 60, yieldPerAcre: 1000, costPerAcre: 20000 },
              Sugarcane: { price: 3.2, yieldPerAcre: 40000, costPerAcre: 45000 },
              Soybeans: { price: 40, yieldPerAcre: 12000, costPerAcre: 15000 },
              Vegetables: { price: 20, yieldPerAcre: 8000, costPerAcre: 30000 },
            };

            const userBuiltCrops = registeredCropsList.map((cropName: string) => {
              const detail = registeredDetails.find((d: any) => d.name === cropName);
              const acres = detail && detail.acres ? parseFloat(detail.acres) || 1 : 1;
              const bm = BENCHMARKS[cropName] || { price: 25, yieldPerAcre: 2500, costPerAcre: 20000 };
              
              let cropYield = acres * bm.yieldPerAcre;
              let cropPrice = bm.price;
              let cropCost = acres * bm.costPerAcre;

              if (md.yield_estimate && md.yield_estimate.estYieldKg && md.yield_estimate.name === cropName) {
                cropYield = md.yield_estimate.estYieldKg;
              }
              if (md.yield_estimate && md.yield_estimate.marketPrice && md.yield_estimate.name === cropName) {
                cropPrice = md.yield_estimate.marketPrice;
              }
              if (totalExpenses > 0) {
                cropCost = totalExpenses;
              }

              return {
                name: cropName,
                yield: cropYield,
                price: cropPrice,
                cost: cropCost
              };
            });

            setAvailableCrops(userBuiltCrops);
            applyCropToFarmData(userBuiltCrops[0]);
            return;
          }
        }
        setAvailableCrops(defaultCrops);
        applyCropToFarmData(defaultCrops[0]);
      } catch (err) {
        console.error("Error loading real data", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchRealData();
  }, [user]);

  const executeSimulation = () => {
    setIsSimulating(true);
    setShowSolution(false);
    setTimeout(() => {
      let res: SimulationResult;
      switch (scenarioType) {
        case 'yield': res = simulateYieldChange(farmData, yieldChangePct); break;
        case 'heavyRain': res = simulateHeavyRain(farmData, damagePct, recoveryCost); break;
        case 'flood': res = simulateFlood(farmData, areaPct, damagePct, recoveryCost); break;
        case 'drought': res = simulateDrought(farmData, damagePct, recoveryCost); break;
        case 'heat': res = simulateExtremeHeat(farmData, damagePct, recoveryCost); break;
        case 'pest': res = simulatePestAttack(farmData, damagePct, recoveryCost); break;
        
        case 'priceDrop': res = simulatePriceDrop(farmData, simulatedPrice); break;
        case 'priceSpike': res = simulatePriceSpike(farmData, yieldChangePct); break; // hijacking variable for %
        case 'priceVol': res = simulatePriceVolatility(farmData, bearPrice, bullPrice); break;
        case 'mandi': res = simulateMandiDisruption(farmData, altPrice, transportCost); break;
        case 'sellStore': res = simulateSellVsStore(farmData, percentStore, storageDays, expectedFuturePrice, 0.80); break;
        
        case 'input': res = simulateInputCost(farmData, 'Fertilizer', inputIncreasePct); break;
        case 'fuel': res = simulateFuelSpike(farmData, inputIncreasePct); break;
        case 'loan': res = simulateLoanPrepayment(farmData, loanPrepayment); break;
        case 'buyRent': res = simulateBuyVsRent(farmData, 650000, 850, usageHours, 35000); break;
        
        case 'feedSpike': res = simulateLivestockFeedSpike(farmData, inputIncreasePct); break;
        case 'herdExp': res = simulateHerdExpansion(farmData, 5, 45000, 150000); break;
        
        case 'stressTest': res = simulateStressTest(farmData, stressSeverity); break;
        default: res = simulateYieldChange(farmData, yieldChangePct);
      }
      setResults(res);
      setIsSimulating(false);
    }, 400);
  };

  useEffect(() => {
    if (!loadingData && mode === 'SIMULATION') executeSimulation();
  }, [loadingData, farmData, mode]);

  const formatCur = (val: number) => {
    if (Math.abs(val) >= 100000) return '₹' + (val / 100000).toFixed(2) + 'L';
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };
  const formatLakh = (val: number) => '₹' + (val / 100000).toFixed(2) + 'L';
  let primaryTitle = 'Projected Profit';
  let primaryValue = 0;
  let primaryBase = 0;
  let delta = 0;
  let deltaPct = 0;
  let isGood = true;

  if (results) {
    const isCostFocus = ['input', 'fuel', 'feedSpike', 'buyRent', 'loan'].includes(scenarioType);
    const isRevenueFocus = ['priceDrop', 'priceSpike', 'priceVol', 'mandi', 'sellStore', 'yield'].includes(scenarioType);

    primaryValue = results.profit;
    primaryBase = results.baseProfit;
    
    if (isCostFocus) {
      primaryTitle = 'Estimated Total Cost';
      primaryValue = results.expenses;
      primaryBase = farmData.totalProductionCost;
    } else if (isRevenueFocus) {
      primaryTitle = 'Estimated Revenue';
      primaryValue = results.revenue;
      primaryBase = results.baseRevenue;
    }
    
    delta = primaryValue - primaryBase;
    deltaPct = primaryBase !== 0 ? (delta / primaryBase) * 100 : 0;
    isGood = isCostFocus ? delta <= 0 : delta >= 0;
  }

  const generateAiSolution = () => {
    if (!results) return "";
    const loss = results.baseProfit - results.profit;
    const isLoss = loss > 0;
    
    switch (scenarioType) {
      case 'heavyRain':
      case 'flood':
        return isLoss 
          ? `With a projected loss of ${formatCur(loss)}, immediately prioritize field drainage. Consider investing ${formatCur(loss * 0.15)} in deeper trenches or water pumps to prevent root rot.`
          : `Your field structure is holding up, but continue monitoring moisture levels closely.`;
      case 'drought':
      case 'heat':
        return `Secure alternative water sources. Implementing targeted drip irrigation could reduce your water usage by 40% and save your remaining harvest.`;
      case 'pest':
        return `Apply localized pesticides immediately. The ${formatCur(results.expenses - farmData.totalProductionCost)} treatment cost is necessary to protect your remaining ${formatCur(results.profit)} profit margin.`;
      case 'priceDrop':
      case 'priceVol':
        return `Do not sell immediately. Your break-even is ${formatCur(results.breakEven)}/kg. Consider storing your crop for 30-60 days until the mandi price recovers above this threshold.`;
      case 'sellStore':
        return `Storing your crop adds risk. Ensure your storage facility is pest-free. If you can guarantee a future price of ₹${expectedFuturePrice}/kg, the extra profit justifies the holding cost.`;
      case 'input':
      case 'fuel':
      case 'feedSpike':
        return `Your costs have inflated. To maintain your ${results.margin.toFixed(1)}% margin, you must negotiate bulk rates or increase your final selling price by at least ${formatCur((results.expenses - farmData.totalProductionCost) / farmData.expectedYield)} per kg.`;
      case 'mandi':
        return `The alternative mandi offers a lower margin due to transport costs. Check local network groups to see if buyers are willing to pick up directly from your farm to save the ${formatCur(transportCost)} transport fee.`;
      case 'buyRent':
        return `If you plan to use the equipment for more than ${usageHours} hours next year, buying is mathematically superior. Otherwise, stick to renting to preserve your ${formatCur(farmData.cashBalance)} cash reserve.`;
      case 'loan':
        return `Prepaying your loan saves long-term interest but drops your cash to ${formatCur(results.cashFlowImpact)}. Only proceed if you are certain you won't need emergency cash for the next 6 months.`;
      case 'stressTest':
        return `This is a severe compound risk scenario. Your cash flow drops to ${formatCur(results.cashFlowImpact)}. You must halt all non-essential expenses and consider liquidating stored inventory immediately to build a cash buffer.`;
      default:
        return `Consider locking in forward contracts for a portion of your yield and maintaining an emergency cash reserve of at least ${formatCur(farmData.emergencyReserve)} to buffer against further volatility.`;
    }
  };


  if (loadingData) {
    return (
      <View className="flex-1 bg-[#f9fafb] items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-[#f9fafb]" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
      <View style={{ height: 100 }} />

      {/* GLOBAL HEADER (Shown in all modes) */}
      <View className="mb-6">
        {mode !== 'CATEGORIES' && (
           <TouchableOpacity 
             onPress={() => {
                if (mode === 'SIMULATION') setMode('SCENARIOS');
                else if (mode === 'SCENARIOS') setMode('CATEGORIES');
             }} 
             className="flex-row items-center mb-4"
           >
             <ChevronLeft size={20} color="#666" />
             <Text className="font-bold text-ink-muted ml-1">{isTa ? 'பின்செல்' : 'Back'}</Text>
           </TouchableOpacity>
        )}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="font-bebas text-4xl text-ink">{isTa ? 'AI "What-If" சிமுலேட்டர்' : 'AI What-If Simulator'}</Text>
          <View className="bg-purple-100 px-3 py-1.5 rounded-full flex-row items-center border border-purple-200">
            <Sparkles size={14} color="#9333ea" />
            <Text className="text-purple-700 font-bold text-xs ml-1 uppercase">{isTa ? 'நேரடி மாதிரி' : 'Live Model'}</Text>
          </View>
        </View>
      </View>

      <View className="bg-white rounded-2xl p-4 shadow-sm border border-farm-green/30 mb-8">
        <View className="flex-row items-center justify-between mb-3 border-b border-gray-100 pb-3">
          <View className="flex-row items-center">
            <Sprout size={16} color="#16a34a" className="mr-2" />
            <Text className="text-xs font-bold text-farm-green uppercase">{isTa ? 'தற்போதைய பண்ணை நிலவரம்' : 'Current Farm Snapshot'}</Text>
          </View>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" showsVerticalScrollIndicator={false}>
          {availableCrops.map((c, idx) => {
             const cropDisplayName = isTa
               ? (c.name === 'Wheat' ? 'கோதுமை' : c.name === 'Rice (Paddy)' ? 'நெல்' : c.name === 'Cotton' ? 'பருத்தி' : c.name === 'Sugarcane' ? 'கரும்பு' : c.name)
               : c.name;
             return (
               <TouchableOpacity 
                  key={idx} 
                  onPress={() => {
                     setActiveCropIndex(idx);
                     applyCropToFarmData(c);
                     setResults(null);
                  }}
                  className={`px-4 py-1.5 rounded-full mr-2 border ${activeCropIndex === idx ? 'bg-farm-green border-farm-green' : 'bg-gray-50 border-gray-200'}`}
               >
                 <Text className={`text-xs font-bold ${activeCropIndex === idx ? 'text-white' : 'text-ink-muted'}`}>{cropDisplayName}</Text>
               </TouchableOpacity>
             );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row" showsVerticalScrollIndicator={false}>
          <View className="mr-6"><Text className="text-[10px] text-ink-muted mb-1">{isTa ? 'ரொக்கம்' : 'Cash'}</Text><Text className="font-bold text-ink">{formatCur(farmData.cashBalance)}</Text></View>
          <View className="mr-6"><Text className="text-[10px] text-ink-muted mb-1">{isTa ? 'அறுவடை (எதிர்பார்ப்பு)' : 'Harvest (Expected)'}</Text><Text className="font-bold text-ink">{farmData.expectedYield.toLocaleString('en-IN')} kg</Text></View>
          <View className="mr-6"><Text className="text-[10px] text-ink-muted mb-1">{isTa ? 'சந்தை விலை' : 'Market Price'}</Text><Text className="font-bold text-ink">₹{farmData.currentMarketPrice}/kg</Text></View>
          <View className="mr-4"><Text className="text-[10px] text-ink-muted mb-1">{isTa ? 'மதிப்பிடப்பட்ட லாபம்' : 'Est. Profit'}</Text><Text className="font-bold text-ink">{formatLakh((farmData.expectedYield * farmData.currentMarketPrice) - farmData.totalProductionCost)}</Text></View>
        </ScrollView>
      </View>

      {/* MODE 1: CATEGORIES */}
      {mode === 'CATEGORIES' && (
        <View>
          <Text className="font-bebas text-2xl text-ink mb-4">{isTa ? 'நீங்கள் எதை சோதிக்க விரும்புகிறீர்கள்?' : 'What do you want to test?'}</Text>
          <View className="flex-row flex-wrap justify-between">
            {CATEGORIES.map(c => (
              <TouchableOpacity 
                key={c.id} 
                onPress={() => { setActiveCategory(c.id); setMode('SCENARIOS'); }}
                className="bg-white border border-gray-100 rounded-3xl p-5 mb-4 shadow-sm"
                style={{ width: '48%' }}
              >
                <View className="mb-4">{c.icon}</View>
                <Text className="font-bold text-ink text-base mb-1">{c.title}</Text>
                <Text className="text-[10px] text-ink-muted leading-tight">{c.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* MODE 2: SCENARIOS */}
      {mode === 'SCENARIOS' && activeCategory && (
        <View>
          <Text className="font-bebas text-2xl text-ink mb-4 uppercase">{CATEGORIES.find(c=>c.id===activeCategory)?.title} {isTa ? 'வாய்ப்புகள்' : 'SCENARIOS'}</Text>
          {SCENARIOS[activeCategory as keyof typeof SCENARIOS].map(s => (
            <TouchableOpacity 
              key={s.id} 
              onPress={() => { setScenarioType(s.id); setResults(null); setMode('SIMULATION'); }}
              className="bg-white border border-gray-100 rounded-2xl p-4 mb-3 shadow-sm flex-row items-center"
            >
              <View className="bg-gray-50 p-3 rounded-xl mr-4 border border-gray-100">{s.icon}</View>
              <Text className="font-bold text-ink text-base flex-1">{s.title}</Text>
              <ChevronLeft size={20} color="#ccc" style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* MODE 3: SIMULATION (Split screen layout) */}
      {mode === 'SIMULATION' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
          {/* LEFT: BUILDER */}
          <View style={{ flex: 1, minWidth: 320, flexBasis: 380 }}>
            <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
              <View className="flex-row justify-between items-center border-b border-gray-100 pb-4 mb-6">
                <View>
                  <Text className="font-bebas text-2xl text-ink">{
                    Object.values(SCENARIOS).flat().find((s: any) => s.id === scenarioType)?.title || (isTa ? 'காரணிகளை மாற்றவும்' : 'Adjust Inputs')
                  }</Text>
                  <Text className="text-[10px] text-ink-muted mt-1 uppercase tracking-wider font-bold">{isTa ? 'சோதனை காரணிகளை மாற்றியமைக்கவும்' : 'Adjust Scenario Inputs'}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => alert(`AI Suggestion for ${scenarioType}:\n\nBased on your farm's data and current market trends, we recommend adjusting your inputs cautiously to find the optimal break-even point.`)}
                  className="bg-purple-50 p-2 rounded-full border border-purple-100"
                >
                  <Sparkles size={18} color="#9333ea" />
                </TouchableOpacity>
              </View>
              
              {scenarioType === 'yield' && <CompactSlider label={isTa ? "மகசூல் மாற்றம்" : "Yield Change"} value={yieldChangePct} min={-50} max={25} step={1} suffix="%" presets={[-10, -15, -20, -30]} onChange={setYieldChangePct} />}
              {scenarioType === 'heavyRain' && <><CompactSlider label={isTa ? "பயிர் சேதம்" : "Crop Damage"} value={damagePct} min={5} max={80} step={1} suffix="%" presets={[10, 25, 50]} onChange={setDamagePct} /><CompactSlider label={isTa ? "மீட்பு செலவு" : "Recovery Cost"} value={recoveryCost} min={0} max={100000} step={5000} prefix="₹" onChange={setRecoveryCost} /></>}
              {scenarioType === 'flood' && <><CompactSlider label={isTa ? "பாதிக்கப்பட்ட பரப்பளவு" : "Affected Area"} value={areaPct} min={10} max={100} step={1} suffix="%" presets={[20, 50, 100]} onChange={setAreaPct} /><CompactSlider label={isTa ? "சேதத்தின் அளவு" : "Damage Severity"} value={damagePct} min={10} max={100} step={1} suffix="%" onChange={setDamagePct} /></>}
              {scenarioType === 'drought' && <><CompactSlider label={isTa ? "மகசூல் குறைவு" : "Yield Reduction"} value={damagePct} min={5} max={80} step={1} suffix="%" presets={[15, 30, 50]} onChange={setDamagePct} /><CompactSlider label={isTa ? "நீர்ப்பாசன செலவு" : "Irrigation Cost"} value={recoveryCost} min={0} max={100000} step={5000} prefix="₹" onChange={setRecoveryCost} /></>}
              {scenarioType === 'heat' && <><CompactSlider label={isTa ? "மகசூல் இழப்பு" : "Yield Loss"} value={damagePct} min={5} max={80} step={1} suffix="%" presets={[10, 25]} onChange={setDamagePct} /><CompactSlider label={isTa ? "குளிரூட்டும் செலவு" : "Cooling Cost"} value={recoveryCost} min={0} max={100000} step={5000} prefix="₹" onChange={setRecoveryCost} /></>}
              {scenarioType === 'pest' && <><CompactSlider label={isTa ? "மகசூல் இழப்பு" : "Yield Loss"} value={damagePct} min={5} max={80} step={1} suffix="%" presets={[15, 30, 50]} onChange={setDamagePct} /><CompactSlider label={isTa ? "சிகிச்சை செலவு" : "Treatment Cost"} value={recoveryCost} min={0} max={100000} step={5000} prefix="₹" onChange={setRecoveryCost} /></>}
              
              {scenarioType === 'priceDrop' && <CompactSlider label={isTa ? "சோதனை சந்தை விலை" : "Simulated Market Price"} value={simulatedPrice} min={2} max={farmData.currentMarketPrice} step={1} prefix="₹" suffix="/kg" presets={[farmData.currentMarketPrice-2, farmData.currentMarketPrice-5]} onChange={setSimulatedPrice} />}
              {scenarioType === 'priceSpike' && <CompactSlider label={isTa ? "விலை உயர்வு" : "Price Spike"} value={yieldChangePct} min={0} max={100} step={1} suffix="%" presets={[10, 25, 50]} onChange={setYieldChangePct} />}
              {scenarioType === 'priceVol' && <><CompactSlider label={isTa ? "குறைந்தபட்ச விலை (மோசமானது)" : "Bear Price (Worst)"} value={bearPrice} min={2} max={farmData.currentMarketPrice} step={1} prefix="₹" suffix="/kg" onChange={setBearPrice} /><CompactSlider label={isTa ? "அதிகபட்ச விலை (சிறந்தது)" : "Bull Price (Best)"} value={bullPrice} min={farmData.currentMarketPrice} max={150} step={1} prefix="₹" suffix="/kg" onChange={setBullPrice} /></>}
              {scenarioType === 'mandi' && <><CompactSlider label={isTa ? "மாற்று சந்தை விலை" : "Alternative Price"} value={altPrice} min={2} max={farmData.currentMarketPrice} step={1} prefix="₹" suffix="/kg" onChange={setAltPrice} /><CompactSlider label={isTa ? "கூடுதல் போக்குவரத்து செலவு" : "Extra Transport Cost"} value={transportCost} min={0} max={50000} step={1000} prefix="₹" onChange={setTransportCost} /></>}
              {scenarioType === 'sellStore' && <><CompactSlider label={isTa ? "இருப்பு வைக்கும் சதவீதம்" : "Percentage to store"} value={percentStore} min={0} max={100} step={1} suffix="%" presets={[40, 60, 80]} onChange={setPercentStore} /><CompactSlider label={isTa ? "இருப்பு காலம்" : "Storage duration"} value={storageDays} min={0} max={90} step={1} suffix={isTa ? " நாட்கள்" : " days"} onChange={setStorageDays} /><CompactSlider label={isTa ? "எதிர்பார்க்கப்படும் எதிர்கால விலை" : "Expected future price"} value={expectedFuturePrice} min={15} max={150} step={1} prefix="₹" onChange={setExpectedFuturePrice} /></>}
              
              {scenarioType === 'input' && <CompactSlider label={isTa ? "உள்ளீட்டு செலவு உயர்வு (உரம்/விதை)" : "Input Cost Increase (Fertilizer/Seeds)"} value={inputIncreasePct} min={0} max={100} step={1} suffix="%" presets={[10, 20, 30]} onChange={setInputIncreasePct} />}
              {scenarioType === 'fuel' && <CompactSlider label={isTa ? "எரிபொருள்/போக்குவரத்து செலவு உயர்வு" : "Fuel/Transport Cost Spike"} value={inputIncreasePct} min={0} max={100} step={1} suffix="%" presets={[10, 20, 30]} onChange={setInputIncreasePct} />}
              {scenarioType === 'loan' && <CompactSlider label={isTa ? "கூடுதல் அசல் செலுத்துதல்" : "Additional Principal Payment"} value={loanPrepayment} min={0} max={100000} step={5000} prefix="₹" presets={[10000, 25000, 50000]} onChange={setLoanPrepayment} />}
              {scenarioType === 'buyRent' && <CompactSlider label={isTa ? "எதிர்பார்க்கப்படும் டிராக்டர் பயன்பாடு" : "Expected Tractor Usage"} value={usageHours} min={0} max={1500} step={50} suffix={isTa ? " மணி/ஆண்டு" : " hrs/yr"} presets={[200, 500, 800]} onChange={setUsageHours} />}
              
              {scenarioType === 'feedSpike' && <CompactSlider label={isTa ? "தீவன விலை உயர்வு" : "Feed Price Spike"} value={inputIncreasePct} min={0} max={100} step={1} suffix="%" presets={[10, 15, 25]} onChange={setInputIncreasePct} />}
              {scenarioType === 'herdExp' && <View className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200"><Text className="text-sm text-ink-muted">{isTa ? '₹45k செலவில் 5 கால்நடைகள் சேர்ப்பது மற்றும் ₹1.5L எதிர்பார்க்கப்படும் வருவாய் திரும்பக் கிடைப்பது குறித்த சோதனை.' : 'Simulating standard addition of 5 cattle with ₹45k cost and ₹1.5L expected revenue return.'}</Text></View>}
              
              {scenarioType === 'stressTest' && (
                <View className="mb-6">
                  <Text className="font-bold text-ink text-sm mb-3">{isTa ? 'தீவிரத்தின் நிலை' : 'Severity Level'}</Text>
                  <View className="flex-row justify-between gap-2">
                    {['mild', 'moderate', 'severe'].map(lvl => (
                       <TouchableOpacity key={lvl} onPress={()=>setStressSeverity(lvl as any)} className={`flex-1 py-3 rounded-xl border items-center ${stressSeverity === lvl ? 'bg-red-50 border-red-500' : 'bg-white border-gray-200'}`}>
                         <Text className={`text-xs font-bold uppercase ${stressSeverity === lvl ? 'text-red-700' : 'text-ink-muted'}`}>
                           {isTa ? (lvl === 'mild' ? 'லேசானது' : lvl === 'moderate' ? 'நடுத்தர' : 'கடுமையானது') : lvl}
                         </Text>
                       </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity onPress={executeSimulation} disabled={isSimulating} className={`w-full h-12 rounded-xl flex-row items-center justify-center mt-6 ${isSimulating ? 'bg-farm-green/70' : 'bg-farm-green'}`}>
                {isSimulating ? <ActivityIndicator color="#fff" /> : <><Play size={16} color="#fff" fill="#fff" className="mr-2" /><Text className="font-bold text-white tracking-wide">{isTa ? 'சோதனையைத் தொடங்கு' : 'Run Simulation'}</Text></>}
              </TouchableOpacity>
            </View>
          </View>

          {/* RIGHT: RESULTS (Data Table + Risk Gradient) */}
          <View style={{ flex: 1, minWidth: 320, flexBasis: 500 }}>
            {results && (
              <View>
                <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                  <View className="flex-row items-center justify-between mb-4">
                     <Text className="font-bold text-ink text-lg">{primaryTitle}</Text>
                     <View className="bg-green-100 px-3 py-1 rounded-full"><Text className="text-[10px] font-bold text-green-700 uppercase tracking-widest">{isTa ? 'சோதனை நிறைவடைந்தது' : 'Simulation Complete'}</Text></View>
                  </View>
                  <View className="flex-row items-end gap-2 mb-1">
                    <Text className="font-bebas text-5xl text-ink leading-none">{formatCur(primaryValue)}</Text>
                  </View>
                  {delta !== 0 && (
                    <View className={`px-2 py-1 mt-1 rounded-lg self-start ${isGood ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Text className={`font-bold text-xs ${isGood ? 'text-green-700' : 'text-red-700'}`}>
                        {delta >= 0 ? '↑ +' : '↓ '}{formatCur(Math.abs(delta))} ({deltaPct > 0 ? '+' : ''}{deltaPct.toFixed(1)}%)
                      </Text>
                    </View>
                  )}
                  <Text className="text-[10px] font-bold text-ink-muted mt-3">{isTa ? `தற்போதைய நிலை: ${formatCur(primaryBase)}` : `Current ${primaryTitle.toLowerCase().replace('estimated ', '').replace('projected ', '')}: ${formatCur(primaryBase)}`}</Text>
                </View>

                {/* CURRENT VS WHAT-IF DATA TABLE */}
                <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                  <Text className="font-bold text-ink text-base mb-4">{isTa ? 'தற்போதைய vs சோதனையின் முடிவுகள்' : 'Current vs What-If'}</Text>
                  <View className="flex-row border-b border-gray-200 pb-2 mb-2">
                    <Text className="flex-1 text-[10px] font-bold text-ink-muted uppercase">{isTa ? 'அளவீடு' : 'Metric'}</Text>
                    <Text className="flex-1 text-[10px] font-bold text-ink-muted uppercase">{isTa ? 'தற்போதைய' : 'Current'}</Text>
                    <Text className="flex-1 text-[10px] font-bold text-ink-muted uppercase">{isTa ? 'சோதனை' : 'What-If'}</Text>
                    <Text className="flex-1 text-[10px] font-bold text-ink-muted uppercase text-right">{isTa ? 'மாற்றம்' : 'Change'}</Text>
                  </View>
                  
                  <View className="flex-row py-2 border-b border-gray-50">
                    <Text className="flex-1 text-xs font-bold text-ink">{isTa ? 'மகசூல்' : 'Yield'}</Text>
                    <Text className="flex-1 text-xs text-ink">{farmData.expectedYield.toLocaleString('en-IN')}</Text>
                    <Text className="flex-1 text-xs text-ink">{(farmData.expectedYield + results.yieldDelta).toLocaleString('en-IN')}</Text>
                    <Text className={`flex-1 text-xs font-bold text-right ${results.yieldDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>{results.yieldDelta >= 0 ? '+' : ''}{results.yieldDelta.toLocaleString('en-IN')}</Text>
                  </View>
                  <View className="flex-row py-2 border-b border-gray-50">
                    <Text className="flex-1 text-xs font-bold text-ink">{isTa ? 'வருவாய்' : 'Revenue'}</Text>
                    <Text className="flex-1 text-xs text-ink">{formatLakh(results.baseRevenue)}</Text>
                    <Text className="flex-1 text-xs text-ink">{formatLakh(results.revenue)}</Text>
                    <Text className={`flex-1 text-xs font-bold text-right ${results.revenueDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>{results.revenueDelta >= 0 ? '+' : ''}{formatLakh(results.revenueDelta)}</Text>
                  </View>
                  <View className="flex-row py-2 border-b border-gray-50">
                    <Text className="flex-1 text-xs font-bold text-ink">{isTa ? 'செலவுகள்' : 'Expenses'}</Text>
                    <Text className="flex-1 text-xs text-ink">{formatLakh(farmData.totalProductionCost)}</Text>
                    <Text className="flex-1 text-xs text-ink">{formatLakh(results.expenses)}</Text>
                    <Text className={`flex-1 text-xs font-bold text-right ${results.expenses - farmData.totalProductionCost > 0 ? 'text-red-600' : 'text-ink-muted'}`}>+{formatLakh(results.expenses - farmData.totalProductionCost)}</Text>
                  </View>
                  <View className="flex-row py-2 border-b border-gray-50">
                    <Text className="flex-1 text-xs font-bold text-ink">{isTa ? 'லாப வரம்பு' : 'Margin'}</Text>
                    <Text className="flex-1 text-xs text-ink">{((results.baseProfit/results.baseRevenue)*100).toFixed(1)}%</Text>
                    <Text className="flex-1 text-xs text-ink">{results.margin.toFixed(1)}%</Text>
                    <Text className={`flex-1 text-xs font-bold text-right ${results.marginDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>{results.marginDelta >= 0 ? '+' : ''}{results.marginDelta.toFixed(1)} pts</Text>
                  </View>
                </View>

                {/* GRADIENT RISK BAR */}
                <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                  <Text className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">{isTa ? 'நிதி ஆபத்து நிலை' : 'Financial Risk'}</Text>
                  <View className="flex-row items-end gap-2 mb-4">
                    <Text className="font-bebas text-5xl text-ink">{Math.round(results.riskScore)}</Text>
                    <Text className="font-bold text-ink-muted mb-2">/ 100</Text>
                  </View>
                  <View className="h-4 bg-gray-100 rounded-full mb-1 relative flex-row overflow-hidden">
                    {/* Fake gradient using multiple divs */}
                    <View style={{ flex: 1, backgroundColor: '#22c55e' }} />
                    <View style={{ flex: 1, backgroundColor: '#eab308' }} />
                    <View style={{ flex: 1, backgroundColor: '#f97316' }} />
                    <View style={{ flex: 1, backgroundColor: '#ef4444' }} />
                    {/* Marker Needle */}
                    <View style={{ position: 'absolute', left: `${Math.min(98, Math.max(2, results.riskScore))}%`, top: -2, width: 4, height: 20, backgroundColor: '#000', borderRadius: 2 }} />
                  </View>
                </View>

                {/* AI Insight */}
                <View className="bg-blue-50/50 rounded-3xl p-5 shadow-sm border border-blue-100 mb-6">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Sparkles size={16} color="#2563eb" className="mr-2" />
                      <Text className="text-xs font-bold text-blue-800">{isTa ? 'AI பண்ணை நுண்ணறிவு' : 'AI Insight'}</Text>
                    </View>
                    {!showSolution && (
                      <TouchableOpacity onPress={() => setShowSolution(true)} className="bg-white px-3 py-1 rounded-full border border-blue-200">
                        <Text className="text-[10px] font-bold text-blue-700">{isTa ? 'AI கேட்கவும்' : 'Ask AI'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text className="font-inter-medium text-xs text-ink leading-relaxed mb-4">
                    {results.recommendation}
                  </Text>
                  
                  {showSolution && (
                    <View className="mt-2 p-3 bg-white rounded-xl border border-blue-100">
                      <Text className="text-[10px] font-bold text-blue-800 mb-1">{isTa ? 'AI தீர்வு:' : 'AI Solution:'}</Text>
                      <Text className="text-xs text-ink">{generateAiSolution()}</Text>
                    </View>
                  )}
                </View>

              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

