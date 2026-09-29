export interface FarmData {
  cashBalance: number;
  emergencyReserve: number;
  cropName: string;
  expectedYield: number; // kg
  currentMarketPrice: number; // per kg
  totalProductionCost: number;
  expenses: { category: string; amount: number }[];
  loanOutstanding: number;
  loanInterestRate: number;
  loanEmi: number;
}

export const DEMO_FARM_DATA: FarmData = {
  cashBalance: 82000,
  emergencyReserve: 25000,
  cropName: 'Wheat',
  expectedYield: 37500,
  currentMarketPrice: 29,
  totalProductionCost: 264200,
  expenses: [
    { category: 'Seeds', amount: 32000 },
    { category: 'Fertilizer', amount: 48500 },
    { category: 'Labour', amount: 67000 },
    { category: 'Machinery', amount: 38000 },
    { category: 'Irrigation', amount: 21700 },
    { category: 'Livestock', amount: 25000 },
    { category: 'Other', amount: 32000 }
  ],
  loanOutstanding: 180000,
  loanInterestRate: 9,
  loanEmi: 12000
};

export interface SimulationResult {
  title: string;
  baseRevenue: number;
  baseProfit: number;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
  breakEven: number;
  riskScore: number;
  cashFlowImpact: number;
  confidence: number;
  recommendation: string;
  // added for the table
  yieldDelta: number;
  revenueDelta: number;
  profitDelta: number;
  cashDelta: number;
  marginDelta: number;
}

function calculateBase(data: FarmData) {
  const baseRevenue = data.expectedYield * data.currentMarketPrice;
  const baseProfit = baseRevenue - data.totalProductionCost;
  return { baseRevenue, baseProfit };
}

function calculateRisk(
  data: FarmData, 
  newProfit: number, 
  newCash: number, 
  baseProfit: number
): number {
  let risk = 20; // base risk
  
  // Profit drop penalty
  if (newProfit < baseProfit) {
    const dropPct = (baseProfit - newProfit) / baseProfit;
    risk += (dropPct * 100);
  }
  
  // Cash reserve penalty
  if (newCash < data.emergencyReserve) {
    risk += 40;
  } else if (newCash < data.emergencyReserve * 1.5) {
    risk += 20;
  }

  // Margin penalty (if unprofitable)
  if (newProfit < 0) {
    risk += 50;
  }

  return Math.min(100, Math.max(0, risk));
}

function buildResult(
  title: string, 
  data: FarmData, 
  newRevenue: number, 
  newExpenses: number, 
  newYield: number,
  newCash: number,
  recommendation: string
): SimulationResult {
  const { baseRevenue, baseProfit } = calculateBase(data);
  const newProfit = newRevenue - newExpenses;
  const margin = (newProfit / newRevenue) * 100 || 0;
  const breakEven = newYield > 0 ? (newExpenses / newYield) : 0;
  
  const riskScore = calculateRisk(data, newProfit, newCash, baseProfit);

  return {
    title,
    baseRevenue,
    baseProfit,
    revenue: newRevenue,
    expenses: newExpenses,
    profit: newProfit,
    margin,
    breakEven,
    riskScore,
    cashFlowImpact: newCash,
    confidence: Math.round(75 + Math.random() * 15),
    recommendation,
    yieldDelta: newYield - data.expectedYield,
    revenueDelta: newRevenue - baseRevenue,
    profitDelta: newProfit - baseProfit,
    cashDelta: newCash - data.cashBalance,
    marginDelta: margin - ((baseProfit / baseRevenue) * 100)
  };
}

// ----------------------------------------------------------------------------
// 1. CROP & YIELD RISKS
// ----------------------------------------------------------------------------

export function simulateYieldChange(data: FarmData, changePct: number): SimulationResult {
  const { baseRevenue, baseProfit } = calculateBase(data);
  const newYield = data.expectedYield * (1 + (changePct / 100));
  const newRevenue = newYield * data.currentMarketPrice;
  const newProfit = newRevenue - data.totalProductionCost;
  
  let rec = "";
  if (changePct < 0) {
    rec = `A ${Math.abs(changePct)}% reduction in yield could lower your projected profit by ₹${((baseProfit - newProfit)/100000).toFixed(2)}L. Consider maintaining crop protection measures.`;
  } else {
    rec = `A ${changePct}% increase in yield would boost profit by ₹${((newProfit - baseProfit)/100000).toFixed(2)}L. Make sure harvest and storage capacity can handle the excess.`;
  }

  return buildResult('Yield Risk', data, newRevenue, data.totalProductionCost, newYield, data.cashBalance, rec);
}

export function simulateHeavyRain(data: FarmData, damagePct: number, recoveryCost: number): SimulationResult {
  const newYield = data.expectedYield * (1 - (damagePct / 100));
  const newRevenue = newYield * data.currentMarketPrice;
  const newExpenses = data.totalProductionCost + recoveryCost;
  const newCash = data.cashBalance - recoveryCost;

  const rec = `Heavy rain causing ${damagePct}% damage plus ₹${recoveryCost.toLocaleString('en-IN')} in recovery costs reduces harvest to ${newYield.toLocaleString('en-IN')} kg. Monitor drainage actively.`;
  return buildResult('Heavy Rain', data, newRevenue, newExpenses, newYield, newCash, rec);
}

export function simulateFlood(data: FarmData, areaPct: number, damagePct: number, recoveryCost: number): SimulationResult {
  const totalDamage = (areaPct / 100) * (damagePct / 100);
  const newYield = data.expectedYield * (1 - totalDamage);
  const newRevenue = newYield * data.currentMarketPrice;
  const newExpenses = data.totalProductionCost + recoveryCost;
  const newCash = data.cashBalance - recoveryCost;

  const rec = `Flooding over ${areaPct}% of the area with ${damagePct}% damage severity wipes out ${(data.expectedYield * totalDamage).toLocaleString('en-IN')} kg of crop. Recovery costs hit cash reserves immediately.`;
  return buildResult('Flood', data, newRevenue, newExpenses, newYield, newCash, rec);
}

export function simulateDrought(data: FarmData, yieldReductionPct: number, irrigationCost: number): SimulationResult {
  const newYield = data.expectedYield * (1 - (yieldReductionPct / 100));
  const newRevenue = newYield * data.currentMarketPrice;
  const newExpenses = data.totalProductionCost + irrigationCost;
  const newCash = data.cashBalance - irrigationCost;

  const rec = `Water shortage dropping yield by ${yieldReductionPct}% and adding ₹${irrigationCost.toLocaleString('en-IN')} in emergency irrigation severely impacts margins.`;
  return buildResult('Drought', data, newRevenue, newExpenses, newYield, newCash, rec);
}

export function simulateExtremeHeat(data: FarmData, yieldLossPct: number, coolingCost: number): SimulationResult {
  const newYield = data.expectedYield * (1 - (yieldLossPct / 100));
  const newRevenue = newYield * data.currentMarketPrice;
  const newExpenses = data.totalProductionCost + coolingCost;
  const newCash = data.cashBalance - coolingCost;

  const rec = `Extreme heat causing a ${yieldLossPct}% yield penalty and extra cooling/water costs of ₹${coolingCost.toLocaleString('en-IN')}.`;
  return buildResult('Extreme Heat', data, newRevenue, newExpenses, newYield, newCash, rec);
}

export function simulatePestAttack(data: FarmData, yieldLossPct: number, treatmentCost: number): SimulationResult {
  const newYield = data.expectedYield * (1 - (yieldLossPct / 100));
  const newRevenue = newYield * data.currentMarketPrice;
  const newExpenses = data.totalProductionCost + treatmentCost;
  const newCash = data.cashBalance - treatmentCost;

  const rec = `A pest outbreak wiping ${yieldLossPct}% of yield requires a ₹${treatmentCost.toLocaleString('en-IN')} immediate pesticide treatment, hitting short-term cash flow.`;
  return buildResult('Pest Attack', data, newRevenue, newExpenses, newYield, newCash, rec);
}

// ----------------------------------------------------------------------------
// 2. MARKET SHOCKS
// ----------------------------------------------------------------------------

export function simulatePriceDrop(data: FarmData, newPrice: number): SimulationResult {
  const newRevenue = data.expectedYield * newPrice;
  const rec = `If market prices fall to ₹${newPrice}/kg, your revenue drops instantly without changing costs. Your break-even is ₹${(data.totalProductionCost/data.expectedYield).toFixed(2)}/kg.`;
  return buildResult('Market Price Drop', data, newRevenue, data.totalProductionCost, data.expectedYield, data.cashBalance, rec);
}

export function simulatePriceSpike(data: FarmData, spikePct: number): SimulationResult {
  const newPrice = data.currentMarketPrice * (1 + (spikePct / 100));
  const newRevenue = data.expectedYield * newPrice;
  const rec = `A ${spikePct}% price spike to ₹${newPrice.toFixed(2)}/kg creates massive upside. Consider locking in contracts or holding harvest for this target.`;
  return buildResult('Market Price Spike', data, newRevenue, data.totalProductionCost, data.expectedYield, data.cashBalance, rec);
}

export function simulatePriceVolatility(data: FarmData, bearPrice: number, bullPrice: number): SimulationResult {
  const avgPrice = (bearPrice + bullPrice) / 2;
  const newRevenue = data.expectedYield * avgPrice;
  const rec = `Volatility between ₹${bearPrice}/kg and ₹${bullPrice}/kg gives an average projected price of ₹${avgPrice.toFixed(2)}/kg. High uncertainty increases financial risk.`;
  return buildResult('Price Volatility', data, newRevenue, data.totalProductionCost, data.expectedYield, data.cashBalance, rec);
}

export function simulateMandiDisruption(data: FarmData, altPrice: number, extraTransportCost: number): SimulationResult {
  const newRevenue = data.expectedYield * altPrice;
  const newExpenses = data.totalProductionCost + extraTransportCost;
  const newCash = data.cashBalance - extraTransportCost;
  const rec = `Diverting to an alternative mandi (₹${altPrice}/kg) with ₹${extraTransportCost.toLocaleString('en-IN')} in extra transport costs significantly alters your final margin.`;
  return buildResult('Mandi Disruption', data, newRevenue, newExpenses, data.expectedYield, newCash, rec);
}

export function simulateSellVsStore(data: FarmData, percentStore: number, days: number, futurePrice: number, storageCostPerKgPerMonth: number): SimulationResult {
  const amtStored = data.expectedYield * (percentStore / 100);
  const amtSoldNow = data.expectedYield - amtStored;
  
  const storageMonths = days / 30;
  const totalStorageCost = amtStored * storageCostPerKgPerMonth * storageMonths;
  
  const revenueNow = amtSoldNow * data.currentMarketPrice;
  const revenueFuture = amtStored * futurePrice;
  const newRevenue = revenueNow + revenueFuture;
  
  const newExpenses = data.totalProductionCost + totalStorageCost;
  
  const cashAtStorageStart = data.cashBalance + revenueNow - totalStorageCost;
  
  const { baseProfit } = calculateBase(data);
  const newProfit = newRevenue - newExpenses;
  
  const rec = `Storing ${percentStore}% of harvest for ${days} days targets ₹${futurePrice}/kg. Immediate cash drops to ₹${cashAtStorageStart.toLocaleString('en-IN')}. Target profit shift: ₹${(newProfit - baseProfit).toLocaleString('en-IN')}.`;
  
  return buildResult('Sell vs Store', data, newRevenue, newExpenses, data.expectedYield, cashAtStorageStart, rec);
}

// ----------------------------------------------------------------------------
// 3. FARM COSTS
// ----------------------------------------------------------------------------

export function simulateInputCost(data: FarmData, category: string, increasePct: number): SimulationResult {
  let extraExpense = 0;
  const targetExp = data.expenses.find(e => e.category.toLowerCase() === category.toLowerCase());
  if (targetExp) {
    extraExpense = targetExp.amount * (increasePct / 100);
  } else {
    extraExpense = (data.totalProductionCost * 0.15) * (increasePct / 100);
  }
  
  const newExpenses = data.totalProductionCost + extraExpense;
  const newCash = data.cashBalance - extraExpense;
  
  const rec = `A ${increasePct}% spike in ${category} costs adds ₹${extraExpense.toLocaleString('en-IN')} to expenses. You must increase your selling price to maintain current margins.`;
  return buildResult('Input Cost', data, data.expectedYield * data.currentMarketPrice, newExpenses, data.expectedYield, newCash, rec);
}

export function simulateFuelSpike(data: FarmData, increasePct: number): SimulationResult {
  return simulateInputCost(data, 'Machinery', increasePct);
}

export function simulateLoanPrepayment(data: FarmData, prepaymentAmt: number): SimulationResult {
  const newCash = data.cashBalance - prepaymentAmt;
  const interestSaved = prepaymentAmt * (data.loanInterestRate / 100) * 2; 
  const newProfit = (data.expectedYield * data.currentMarketPrice) - data.totalProductionCost + interestSaved;
  
  const rec = `Paying ₹${prepaymentAmt.toLocaleString('en-IN')} early reduces your cash on hand dangerously close to emergency reserves, but saves long-term interest.`;
  
  return buildResult('Loan Prepayment', data, (data.expectedYield * data.currentMarketPrice) + interestSaved, data.totalProductionCost, data.expectedYield, newCash, rec);
}

export function simulateBuyVsRent(data: FarmData, purchaseCost: number, rentPerHour: number, usageHours: number, annualMaintenance: number): SimulationResult {
  const totalRentCost = rentPerHour * usageHours;
  const ownershipCostPerYear = (purchaseCost / 5) + annualMaintenance; 
  
  const newExpenses = data.totalProductionCost + ownershipCostPerYear;
  const newCash = data.cashBalance - purchaseCost; 
  
  const rec = `Buying equipment costs ₹${purchaseCost.toLocaleString('en-IN')} upfront. Amortized over 5 years (₹${ownershipCostPerYear.toLocaleString('en-IN')}/yr), compared to renting at ₹${totalRentCost.toLocaleString('en-IN')}/yr. Break-even usage is ${Math.round(ownershipCostPerYear/rentPerHour)} hours/year.`;
  
  return buildResult('Buy vs Rent', data, data.expectedYield * data.currentMarketPrice, newExpenses, data.expectedYield, newCash, rec);
}

// ----------------------------------------------------------------------------
// 4. LIVESTOCK
// ----------------------------------------------------------------------------

export function simulateLivestockFeedSpike(data: FarmData, increasePct: number): SimulationResult {
  return simulateInputCost(data, 'Livestock', increasePct);
}

export function simulateHerdExpansion(data: FarmData, additionalAnimals: number, costPerAnimal: number, expectedRevenuePerAnimal: number): SimulationResult {
  const expansionCost = additionalAnimals * costPerAnimal;
  const addedRevenue = additionalAnimals * expectedRevenuePerAnimal;
  
  const newExpenses = data.totalProductionCost + expansionCost;
  const newRevenue = (data.expectedYield * data.currentMarketPrice) + addedRevenue;
  const newCash = data.cashBalance - expansionCost;
  
  const rec = `Adding ${additionalAnimals} animals costs ₹${expansionCost.toLocaleString('en-IN')} upfront, putting massive strain on cash reserves, but projects ₹${addedRevenue.toLocaleString('en-IN')} in new revenue.`;
  return buildResult('Herd Expansion', data, newRevenue, newExpenses, data.expectedYield, newCash, rec);
}

// ----------------------------------------------------------------------------
// 5. COMBINED STRESS TESTS
// ----------------------------------------------------------------------------

export function simulateStressTest(
  data: FarmData, 
  severity: 'mild' | 'moderate' | 'severe',
  customYieldDrop?: number,
  customPriceDrop?: number,
  customCostSpike?: number
): SimulationResult {
  
  let yDrop = 0;
  let pDrop = 0;
  let cSpike = 0;

  if (severity === 'mild') {
    yDrop = 5; pDrop = 5; cSpike = 5;
  } else if (severity === 'moderate') {
    yDrop = 15; pDrop = 10; cSpike = 10;
  } else {
    yDrop = 30; pDrop = 20; cSpike = 25;
  }
  
  if (customYieldDrop !== undefined) yDrop = customYieldDrop;
  if (customPriceDrop !== undefined) pDrop = customPriceDrop;
  if (customCostSpike !== undefined) cSpike = customCostSpike;

  const newYield = data.expectedYield * (1 - (yDrop / 100));
  const newPrice = data.currentMarketPrice * (1 - (pDrop / 100));
  const newRevenue = newYield * newPrice;
  const extraCosts = data.totalProductionCost * (cSpike / 100);
  const newExpenses = data.totalProductionCost + extraCosts;
  const newCash = data.cashBalance - extraCosts;

  const rec = `STRESS TEST (${severity.toUpperCase()}): A combined ${yDrop}% yield loss, ${pDrop}% price drop, and ${cSpike}% expense spike compounds to wipe out margins. Extreme financial mitigation required.`;
  return buildResult('Combined Stress Test', data, newRevenue, newExpenses, newYield, newCash, rec);
}
