const fs = require('fs');
const content = \import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, Platform, ActivityIndicator } from 'react-native';
import { Sparkles, Activity, Play, RefreshCcw, AlertTriangle, Calculator } from 'lucide-react-native';
import { DEMO_FARM_DATA, runSimulation } from '../../src/lib/simulationEngine';

export default function WhatIfSimulator() {
  const [scenarioType, setScenarioType] = useState('cropPrice');
  
  const [priceInput, setPriceInput] = useState(DEMO_FARM_DATA.currentMarketPrice.toString());
  const [yieldMod, setYieldMod] = useState('0'); // percentage
  const [addExpense, setAddExpense] = useState('0');
  const [storageDays, setStorageDays] = useState('0');
  const [expectedFuturePrice, setExpectedFuturePrice] = useState(DEMO_FARM_DATA.currentMarketPrice.toString());
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  
  const [results, setResults] = useState<any>(null);

  const getScenarioParams = () => {
    let params: any = {};
    if (scenarioType === 'cropPrice') {
      params.priceOverride = parseFloat(priceInput) || DEMO_FARM_DATA.currentMarketPrice;
    } else if (scenarioType === 'yieldChange') {
      const modifier = (parseFloat(yieldMod) || 0) / 100;
      params.yieldMultiplier = 1 + modifier;
    } else if (scenarioType === 'inputCost') {
      params.additionalExpenses = parseFloat(addExpense) || 0;
    } else if (scenarioType === 'sellStore') {
      const days = parseFloat(storageDays) || 0;
      const futurePrice = parseFloat(expectedFuturePrice) || DEMO_FARM_DATA.currentMarketPrice;
      const storageCost = DEMO_FARM_DATA.expectedYield * 0.80 * (days / 30);
      
      params.priceOverride = futurePrice;
      params.storageCost = storageCost;
    }
    return params;
  };

  const executeSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const params = getScenarioParams();
      const res = runSimulation(DEMO_FARM_DATA, params);
      setResults(res);
      setIsSimulating(false);
    }, 600);
  };

  useEffect(() => {
    if (liveMode) {
      const params = getScenarioParams();
      setResults(runSimulation(DEMO_FARM_DATA, params));
    }
  }, [priceInput, yieldMod, addExpense, storageDays, expectedFuturePrice, scenarioType, liveMode]);

  useEffect(() => {
    if (!results) {
      setResults(runSimulation(DEMO_FARM_DATA, {}));
    }
  }, []);

  const formatCurrency = (val: number) => '?' + Math.round(val).toLocaleString();

  return (
    <ScrollView className="flex-1 bg-[#f0ece4] pt-24 px-6 pb-10">
      <View className="mb-8">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-bebas text-4xl text-ink">AI What-If Decision Simulator</Text>
            <Text className="font-inter-medium text-sm text-ink-muted mt-2 max-w-xl">
              Test farm decisions, compare financial outcomes, and understand the risks before you commit.
            </Text>
          </View>
          <View className="bg-purple-100 px-3 py-1.5 rounded-full flex-row items-center border border-purple-200">
            <Sparkles size={14} color="#9333ea" />
            <Text className="text-purple-700 font-bold text-xs ml-1.5 uppercase">Live Decision Model</Text>
          </View>
        </View>
      </View>

      <View className="flex-col md:flex-row gap-6">
        {/* LEFT COLUMN: SCENARIO BUILDER */}
        <View className="flex-1 max-w-md bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <Text className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-1">Scenario Builder</Text>
          <Text className="font-bebas text-2xl text-ink mb-6">What Do You Want to Test?</Text>
          
          {/* Quick Presets */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            <TouchableOpacity onPress={() => {setScenarioType('cropPrice'); setPriceInput('25');}} className="bg-gray-100 px-4 py-2 rounded-xl mr-2">
              <Text className="font-bold text-xs text-ink">Price Drops 15%</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {setScenarioType('yieldChange'); setYieldMod('-15');}} className="bg-gray-100 px-4 py-2 rounded-xl mr-2">
              <Text className="font-bold text-xs text-ink">Yield Drops 15%</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {setScenarioType('sellStore'); setStorageDays('20'); setExpectedFuturePrice('31');}} className="bg-gray-100 px-4 py-2 rounded-xl">
              <Text className="font-bold text-xs text-ink">Store for 20 Days</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Scenario Selection */}
          <View className="mb-6 flex-row flex-wrap gap-2">
            {['cropPrice', 'yieldChange', 'inputCost', 'sellStore'].map((type) => (
              <TouchableOpacity key={type} onPress={() => setScenarioType(type)} className={\px-4 py-2 rounded-xl border \\}>
                <Text className={\ont-bold text-xs \\}>
                  {type === 'cropPrice' ? 'Price Change' : type === 'yieldChange' ? 'Yield Change' : type === 'inputCost' ? 'Input Cost' : 'Sell vs Store'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Scenario Specific Controls */}
          <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
            {scenarioType === 'cropPrice' && (
              <View>
                <Text className="font-bold text-ink mb-1">Market Price Override (?/kg)</Text>
                <Text className="text-xs text-ink-muted mb-3">Current Market Price: ?{DEMO_FARM_DATA.currentMarketPrice}/kg</Text>
                <TextInput 
                  value={priceInput}
                  onChangeText={setPriceInput}
                  keyboardType="numeric"
                  className="bg-white border border-gray-200 p-3 rounded-xl font-bold text-ink"
                />
              </View>
            )}
            
            {scenarioType === 'yieldChange' && (
              <View>
                <Text className="font-bold text-ink mb-1">Yield Adjustment (%)</Text>
                <Text className="text-xs text-ink-muted mb-3">Expected: {DEMO_FARM_DATA.expectedYield.toLocaleString()} kg</Text>
                <TextInput 
                  value={yieldMod}
                  onChangeText={setYieldMod}
                  keyboardType="numeric"
                  className="bg-white border border-gray-200 p-3 rounded-xl font-bold text-ink"
                />
              </View>
            )}

            {scenarioType === 'inputCost' && (
              <View>
                <Text className="font-bold text-ink mb-1">Additional Expense (?)</Text>
                <Text className="text-xs text-ink-muted mb-3">Add a sudden cost to the ledger.</Text>
                <TextInput 
                  value={addExpense}
                  onChangeText={setAddExpense}
                  keyboardType="numeric"
                  className="bg-white border border-gray-200 p-3 rounded-xl font-bold text-ink"
                />
              </View>
            )}

            {scenarioType === 'sellStore' && (
              <View>
                <Text className="font-bold text-ink mb-1">Storage Duration (Days)</Text>
                <Text className="text-xs text-ink-muted mb-3">Cost: ?0.80 / kg / month</Text>
                <TextInput 
                  value={storageDays}
                  onChangeText={setStorageDays}
                  keyboardType="numeric"
                  className="bg-white border border-gray-200 p-3 rounded-xl font-bold text-ink mb-4"
                />
                <Text className="font-bold text-ink mb-1">Expected Future Price (?/kg)</Text>
                <TextInput 
                  value={expectedFuturePrice}
                  onChangeText={setExpectedFuturePrice}
                  keyboardType="numeric"
                  className="bg-white border border-gray-200 p-3 rounded-xl font-bold text-ink"
                />
              </View>
            )}
          </View>

          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <Switch value={liveMode} onValueChange={setLiveMode} trackColor={{ true: '#16a34a' }} />
              <Text className="font-bold text-xs text-ink ml-2">Live Mode</Text>
            </View>
            <TouchableOpacity onPress={() => { setPriceInput(DEMO_FARM_DATA.currentMarketPrice.toString()); setYieldMod('0'); setAddExpense('0'); setStorageDays('0'); setExpectedFuturePrice(DEMO_FARM_DATA.currentMarketPrice.toString()); executeSimulation(); }} className="flex-row items-center">
              <RefreshCcw size={14} color="#666" />
              <Text className="font-bold text-xs text-ink-muted ml-1">Reset</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={executeSimulation}
            disabled={isSimulating}
            className={\w-full h-14 rounded-xl flex-row items-center justify-center \\}
          >
            {isSimulating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Play size={18} color="#fff" fill="#fff" className="mr-2" />
                <Text className="font-bebas text-xl text-white tracking-widest">RUN SIMULATION</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* RIGHT COLUMN: OUTCOMES */}
        <View className="flex-[2] max-w-4xl">
          {results ? (
            <View>
              {/* Top Outcome Card */}
              <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6 relative overflow-hidden">
                <View className="flex-row justify-between items-start mb-6">
                  <View>
                    <Text className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-1">Simulated Outcome</Text>
                    <Text className="font-bebas text-3xl text-ink">Projected Profit</Text>
                  </View>
                  <View className="bg-blue-50 px-3 py-1.5 rounded-full flex-row items-center border border-blue-100">
                    <Activity size={14} color="#2563eb" />
                    <Text className="text-blue-600 font-bold text-xs ml-1.5 uppercase">Status: Simulated</Text>
                  </View>
                </View>

                <View className="flex-row items-end gap-4 mb-2">
                  <Text className="font-bebas text-6xl text-ink">{formatCurrency(results.profit)}</Text>
                  {results.profit !== results.baseProfit && (
                    <View className={\px-2 py-1 mb-2 rounded-lg \\}>
                      <Text className={\ont-bold text-sm \\}>
                        {results.profit > results.baseProfit ? '+' : ''}{formatCurrency(results.profit - results.baseProfit)} 
                        ({((results.profit - results.baseProfit) / results.baseProfit * 100).toFixed(1)}%)
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="font-bold text-ink-muted mb-6">Current projected profit: {formatCurrency(results.baseProfit)}</Text>

                {/* Grid Metrics */}
                <View className="flex-row flex-wrap gap-4">
                  <View className="flex-1 min-w-[140px] bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <Text className="text-xs font-bold text-ink-muted uppercase mb-1">Revenue</Text>
                    <Text className="font-bebas text-2xl text-ink">{formatCurrency(results.revenue)}</Text>
                  </View>
                  <View className="flex-1 min-w-[140px] bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <Text className="text-xs font-bold text-ink-muted uppercase mb-1">Expenses</Text>
                    <Text className="font-bebas text-2xl text-ink">{formatCurrency(results.expenses)}</Text>
                  </View>
                  <View className="flex-1 min-w-[140px] bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <Text className="text-xs font-bold text-ink-muted uppercase mb-1">Margin</Text>
                    <Text className="font-bebas text-2xl text-ink">{results.margin.toFixed(1)}%</Text>
                  </View>
                  <View className="flex-1 min-w-[140px] bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <Text className="text-xs font-bold text-ink-muted uppercase mb-1">Break-Even</Text>
                    <Text className="font-bebas text-2xl text-ink">?{results.breakEven.toFixed(2)}/kg</Text>
                  </View>
                </View>
              </View>

              <View className="flex-col md:flex-row gap-6 mb-6">
                {/* Risk Card */}
                <View className="flex-1 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <Text className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">Financial Risk</Text>
                  <View className="flex-row items-end gap-2 mb-4">
                    <Text className="font-bebas text-5xl text-ink">{Math.round(results.riskScore)}</Text>
                    <Text className="font-bold text-ink-muted mb-2">/ 100</Text>
                  </View>
                  <View className="h-3 bg-gray-100 rounded-full mb-2 overflow-hidden flex-row">
                    <View className="h-full bg-green-500" style={{ width: '30%' }} />
                    <View className="h-full bg-yellow-400" style={{ width: '30%' }} />
                    <View className="h-full bg-orange-500" style={{ width: '20%' }} />
                    <View className="h-full bg-red-500" style={{ width: '20%' }} />
                    <View className="absolute top-0 bottom-0 w-1 bg-ink shadow-md" style={{ left: \\%\ }} />
                  </View>
                  <Text className="text-xs font-bold text-ink mt-2">
                    {results.riskScore < 30 ? '?? Low Risk' : results.riskScore < 60 ? '?? Moderate Risk' : results.riskScore < 80 ? '?? High Risk' : '?? Critical Risk'}
                  </Text>
                </View>

                {/* Cash Flow */}
                <View className="flex-1 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <Text className="text-xs font-bold text-ink-muted uppercase tracking-widest mb-4">90-Day Cash Impact</Text>
                  <Text className="font-bebas text-3xl text-ink mb-1">{formatCurrency(results.cashBalance)}</Text>
                  <Text className="text-xs text-ink-muted mb-4">Emergency Reserve: {formatCurrency(DEMO_FARM_DATA.emergencyReserve)}</Text>
                  
                  {results.cashBalance < DEMO_FARM_DATA.emergencyReserve ? (
                    <View className="bg-red-50 p-3 rounded-xl border border-red-100 flex-row items-center">
                      <AlertTriangle color="#dc2626" size={16} />
                      <Text className="text-xs font-bold text-red-700 ml-2 flex-1">WARNING: Cash reserve falls below safety threshold.</Text>
                    </View>
                  ) : (
                    <View className="bg-green-50 p-3 rounded-xl border border-green-100 flex-row items-center">
                      <Text className="text-xs font-bold text-green-700 ml-2">Cash reserves are secure.</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* AI Insight */}
              <View className="bg-purple-50 rounded-3xl p-6 shadow-sm border border-purple-100">
                <View className="flex-row items-center mb-4">
                  <Sparkles size={18} color="#9333ea" className="mr-2" />
                  <Text className="text-xs font-bold text-purple-700 uppercase tracking-widest">AI Decision Insight</Text>
                </View>
                <Text className="font-inter-medium text-ink leading-relaxed mb-4">
                  {results.recommendation}
                </Text>
                <View className="bg-white/60 p-4 rounded-2xl border border-purple-200/50">
                  <Text className="text-xs font-bold text-purple-900 mb-2 uppercase">Assumptions Engine</Text>
                  <Text className="text-xs text-purple-800">• Expected Yield: {DEMO_FARM_DATA.expectedYield.toLocaleString()} kg</Text>
                  <Text className="text-xs text-purple-800">• Production Cost: {formatCurrency(DEMO_FARM_DATA.totalProductionCost)}</Text>
                  {scenarioType === 'sellStore' && <Text className="text-xs text-purple-800">• Storage Cost: ?0.80/kg/mo</Text>}
                </View>
              </View>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
              <Calculator size={48} color="#cbd5e1" className="mb-4" />
              <Text className="font-bold text-ink text-lg">No Scenario Selected</Text>
              <Text className="text-ink-muted text-sm mt-2 text-center max-w-xs">Run a simulation from the left panel to see projected financial outcomes.</Text>
            </View>
          )}
        </View>
      </View>
      
      <View className="h-12" />
    </ScrollView>
  );
}
\;
fs.writeFileSync('app/(drawer)/what-if.tsx', content);
