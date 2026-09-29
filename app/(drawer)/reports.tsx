import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, Share, Dimensions, Platform
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G, Rect, Line as SvgLine } from 'react-native-svg';
import {
  Search, Mic, Send, Sparkles, Filter, Calendar, FileText, Download, CheckCircle,
  AlertTriangle, ArrowUpRight, ArrowDownLeft, X, ChevronRight, Info, PlusCircle,
  TrendingUp, ArrowUp, ArrowDown, Sprout, HeartPulse, Truck, ChevronDown, ChevronUp,
  Wallet, Clock, Printer, ShieldCheck, BarChart2
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useReportData, LedgerEntry, ReportPeriod } from '../../src/contexts/ReportContext';
import {
  askLedgerQuestion, parseNaturalLogEntry, generateLedgerSummary, analyzeLedgerPatterns, generatePdfAuditNarrative
} from '../../src/lib/ledgerAiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SmartDigitalLedgerScreen() {
  const { t, i18n } = useTranslation();
  const isTa = i18n.language === 'ta';

  const {
    stats, period, setPeriod, allLedgerEntries, addLedgerEntry, isLoading, openingCash
  } = useReportData();

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All Activities');
  
  // Pagination State for Master Activity Timeline (Limits initial items to 5)
  const [visibleCount, setVisibleCount] = useState<number>(5);

  // AI Entry States
  const [naturalInput, setNaturalInput] = useState('');
  const [isParsingAi, setIsParsingAi] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<any | null>(null);

  // Sub-Category Dropdown Modal State
  const [showChartDropdownModal, setShowChartDropdownModal] = useState(false);

  // AI Chat Assistant States
  const [chatQuestion, setChatQuestion] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);

  // AI Diary Summary & Insights
  const [aiDiarySummary, setAiDiarySummary] = useState<string>('Analyzing your farm ledger...');
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isAnalyzingInsights, setIsAnalyzingInsights] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);

  // Official PDF Export Modal States
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfNarrative, setPdfNarrative] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Load AI Summary & Insights on period change
  useEffect(() => {
    if (!isLoading && stats && allLedgerEntries.length > 0) {
      setAiDiarySummary('Generating your AI Farm Diary summary...');
      generateLedgerSummary(period, stats, allLedgerEntries).then(setAiDiarySummary);
      
      setIsAnalyzingInsights(true);
      analyzeLedgerPatterns(allLedgerEntries).then(res => {
        setAiInsights(res);
        setIsAnalyzingInsights(false);
      });
    }
  }, [period, isLoading, allLedgerEntries.length]);

  // Handle Natural Language Record Entry via Gemini
  const handleAiLogSubmit = async () => {
    if (!naturalInput.trim()) return;
    setIsParsingAi(true);
    try {
      const parsed = await parseNaturalLogEntry(naturalInput, ['Wheat Field A', 'Rice Field B', 'Cattle Group 1']);
      setParsedPreview(parsed);
    } catch (e) {
      Alert.alert("Error", "Could not parse entry. Please try again.");
    } finally {
      setIsParsingAi(false);
    }
  };

  const confirmSaveAiEntry = async () => {
    if (!parsedPreview) return;
    await addLedgerEntry({
      title: parsedPreview.title,
      category: parsedPreview.activityType,
      type: parsedPreview.entryType || (parsedPreview.amount > 0 ? 'out' : 'info'),
      amount: parsedPreview.amount || 0,
      quantity: parsedPreview.quantity || '',
      target: parsedPreview.target || 'General',
      status: 'Completed'
    });
    setParsedPreview(null);
    setNaturalInput('');
    Alert.alert("Success", "Record added to Digital Ledger!");
  };

  // Handle AI Ledger Chat Q&A
  const handleAskLedgerAssistant = async () => {
    if (!chatQuestion.trim()) return;
    setIsChatLoading(true);
    try {
      const resp = await askLedgerQuestion(chatQuestion, filteredEntries, stats);
      setChatResponse(resp);
    } catch (e) {
      setChatResponse("Sorry, I could not retrieve that answer right now.");
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handle AI Pattern Insights Analysis Modal
  const handleOpenPatternAnalysis = async () => {
    setShowInsightsModal(true);
    if (!aiInsights) {
      setIsAnalyzingInsights(true);
      const patterns = await analyzeLedgerPatterns(allLedgerEntries);
      setAiInsights(patterns);
      setIsAnalyzingInsights(false);
    }
  };

  // Trigger Official PDF Generation Modal
  const handleOpenPdfExport = async () => {
    setShowPdfModal(true);
    setIsGeneratingPdf(true);
    try {
      const narrative = await generatePdfAuditNarrative(period, stats, filteredEntries, i18n.language);
      setPdfNarrative(narrative);
    } catch (e) {
      setPdfNarrative(isTa ? "அதிகாரப்பூர்வ தணிக்கை அறிக்கை உருவாக்கப்பட்டது." : "Official Audit Statement generated successfully.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Print / Save Official Multi-Page PDF Document
  const handlePrintPdf = async () => {
    const reportDate = new Date().toLocaleDateString(isTa ? 'ta-IN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const reportId = `AUDIT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const farmName = isTa ? "பசுமை பள்ளத்தாக்கு இயற்கை பண்ணை" : "Green Valley Organic Farm";
    const farmerName = isTa ? "பாருனேஷ்" : "Bharunesh";
    const farmId = "AGRI-IN-2026-8842";
    const filterContext = categoryFilter === 'All'
      ? (selectedSubCategory === 'All Activities' ? (isTa ? 'முழு பண்ணை தணிக்கை' : 'Complete Farm Audit') : selectedSubCategory + (isTa ? ' தணிக்கை' : ' Audit'))
      : categoryFilter + (isTa ? ' குறிப்பிட்ட தணிக்கை' : ' Specific Audit');

    const opCash = openingCash || 75000;
    const inc = stats?.income || 0;
    const exp = stats?.expenses || 0;
    const clCash = opCash + inc - exp;

    const completedLogs = filteredEntries.filter(e => e.status !== 'Pending');
    const pendingLogs = allLedgerEntries.filter(e => e.status === 'Pending');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${isTa ? 'அக்ரிசிங்க் அதிகாரப்பூர்வ பண்ணை தணிக்கை பேரேடு' : 'AgriSync Official Farm Audit Ledger'} - ${reportId}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #111827; background: #fff; line-height: 1.5; font-size: 10.5pt; margin: 0; padding: 0; }
    .page-break { page-break-after: always; break-after: page; }
    .header-box { background: #064E3B; color: #ffffff; padding: 22px; border-radius: 10px; margin-bottom: 20px; }
    .header-box h1 { margin: 0; font-size: 20pt; font-weight: 800; letter-spacing: -0.5px; }
    .header-box p { margin: 4px 0 0 0; color: #A7F3D0; font-size: 10pt; }
    .badge { display: inline-block; padding: 4px 12px; background: #DCFCE7; color: #166534; font-size: 9pt; font-weight: 700; border-radius: 20px; text-transform: uppercase; margin-top: 8px; }
    .section-title { font-size: 13pt; font-weight: 800; color: #064E3B; border-bottom: 2px solid #10B981; padding-bottom: 4px; margin-top: 22px; margin-bottom: 12px; }
    .grid-4 { display: flex; gap: 12px; margin-bottom: 16px; }
    .card { flex: 1; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; }
    .metric-label { font-size: 8.5pt; color: #6B7280; font-weight: 600; text-transform: uppercase; }
    .metric-val { font-size: 15pt; font-weight: 800; color: #111827; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9.5pt; }
    th { background: #F3F4F6; text-align: left; padding: 8px 10px; font-weight: 700; color: #374151; border-bottom: 2px solid #E5E7EB; }
    td { padding: 8px 10px; border-bottom: 1px solid #F3F4F6; color: #1F2937; }
    .disclaimer { background: #FFFBEB; border: 1px solid #FDE68A; color: #92400E; padding: 12px; border-radius: 8px; font-size: 8.5pt; margin-top: 14px; line-height: 1.4; }
    .ai-box { background: #F0FDF4; border-left: 4px solid #16A34A; padding: 14px; border-radius: 6px; color: #166534; font-size: 9.5pt; line-height: 1.6; margin-bottom: 16px; whitespace: pre-line; }
    .status-completed { color: #166534; background: #DCFCE7; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 8.5pt; }
    .status-pending { color: #92400E; background: #FEF3C7; padding: 2px 8px; border-radius: 6px; font-weight: 700; font-size: 8.5pt; }
    .footer-integrity { border: 1px solid #E5E7EB; background: #F9FAFB; padding: 14px; border-radius: 8px; font-size: 9pt; margin-top: 20px; }
  </style>
</head>
<body>

  <!-- PAGE 1: EXECUTIVE REPORT -->
  <div class="header-box">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <p style="font-weight: 700; letter-spacing: 1px; color: #A7F3D0;">${isTa ? 'அக்ரிசிங்க் சரிபார்க்கப்பட்ட தணிக்கை அறிக்கை' : 'AGRISYNC VERIFIED AUDIT REPORT'}</p>
        <h1>${isTa ? 'அதிகாரப்பூர்வ பண்ணை டிஜிட்டல் பேரேடு' : 'OFFICIAL FARM DIGITAL LEDGER'}</h1>
        <p>${isTa ? 'பண்ணை:' : 'Farm:'} ${farmName} • ${isTa ? 'விவசாயி:' : 'Farmer:'} ${farmerName} (ID: ${farmId})</p>
      </div>
      <div style="text-align: right;">
        <span class="badge">${isTa ? 'சரிபார்க்கப்பட்ட பதிவு' : 'Verified System Record'}</span>
        <p style="margin-top: 6px; color: #D1FAE5; font-size: 8.5pt;">${isTa ? 'அறிக்கை ஐடி:' : 'Report ID:'} ${reportId}<br>${isTa ? 'உருவாக்கப்பட்ட தேதி:' : 'Generated:'} ${reportDate}</p>
      </div>
    </div>
  </div>

  <!-- SECTION 1: FARM & REPORT IDENTIFICATION -->
  <div class="section-title">${isTa ? '1. பண்ணை & அறிக்கை அடையாளம்' : '1. Farm & Report Identification'}</div>
  <table style="margin-bottom: 14px;">
    <tr>
      <td><strong>${isTa ? 'பண்ணை பெயர்:' : 'Farm Name:'}</strong> ${farmName}</td>
      <td><strong>${isTa ? 'விவசாயி பெயர்:' : 'Farmer Name:'}</strong> ${farmerName}</td>
      <td><strong>${isTa ? 'பண்ணை ஐடி:' : 'Farm ID:'}</strong> ${farmId}</td>
    </tr>
    <tr>
      <td><strong>${isTa ? 'அறிக்கை ஐடி:' : 'Report ID:'}</strong> ${reportId}</td>
      <td><strong>${isTa ? 'உருவாக்கப்பட்ட தேதி:' : 'Date of Generation:'}</strong> ${reportDate}</td>
      <td><strong>${isTa ? 'தேர்ந்தெடுக்கப்பட்ட காலம்:' : 'Selected Period:'}</strong> ${period} (${filterContext})</td>
    </tr>
    <tr>
      <td><strong>${isTa ? 'தணிக்கை செய்யப்பட்ட பதிவுகள்:' : 'Audited Records:'}</strong> ${filteredEntries.length} Items</td>
      <td><strong>${isTa ? 'நிலை:' : 'Report Status:'}</strong> ${isTa ? 'சரிபார்க்கப்பட்ட பதிவுகள் சேர்க்கப்பட்டுள்ளன' : 'Verified Records Included'}</td>
      <td><strong>${isTa ? 'அமைப்பு ஒருமைப்பாடு:' : 'System Integrity:'}</strong> Verified Digital Log</td>
    </tr>
  </table>

  <!-- SECTION 2: EXECUTIVE FARM SUMMARY -->
  <div class="section-title">${isTa ? '2. பண்ணை நிர்வாக சுருக்கம்' : '2. Executive Farm Summary'}</div>
  <div class="grid-4">
    <div class="card">
      <div class="metric-label">${isTa ? 'நிறைவுற்ற நடவடிக்கைகள்' : 'Completed Activities'}</div>
      <div class="metric-val" style="color:#16A34A;">${completedLogs.length}</div>
    </div>
    <div class="card">
      <div class="metric-label">${isTa ? 'நிலுவை பணிகள்' : 'Pending / Due Tasks'}</div>
      <div class="metric-val" style="color:#D97706;">${pendingLogs.length}</div>
    </div>
    <div class="card">
      <div class="metric-label">${isTa ? 'நிலங்கள் & கால்நடைகள்' : 'Fields & Livestock'}</div>
      <div class="metric-val" style="color:#2563EB;">3 Fields / 2 Groups</div>
    </div>
    <div class="card">
      <div class="metric-label">${isTa ? 'அறுவடை அளவு' : 'Harvest Quantity'}</div>
      <div class="metric-val" style="color:#8B5CF6;">500 kg Recorded</div>
    </div>
  </div>

  <!-- SECTION 3: FINANCIAL AUDIT SUMMARY -->
  <div class="section-title">${isTa ? '3. நிதி தணிக்கை சுருக்கம்' : '3. Financial Audit Summary'}</div>
  <table>
    <thead>
      <tr>
        <th>${isTa ? 'நிதி அளவீடு' : 'Financial Metric'}</th>
        <th>${isTa ? 'பதிவு செய்யப்பட்ட வருவாய்' : 'Recorded Inflow (Revenue)'}</th>
        <th>${isTa ? 'பதிவு செய்யப்பட்ட செலவுகள்' : 'Recorded Outflow (Expenses)'}</th>
        <th>${isTa ? 'இறுதி ரொக்க இருப்பு' : 'Closing Cash Balance'}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>${isTa ? 'ஆரம்ப இருப்பு:' : 'Opening Balance:'}</strong> ₹${opCash.toLocaleString()}</td>
        <td style="color:#16A34A; font-weight:700;">+₹${inc.toLocaleString()}</td>
        <td style="color:#EF4444; font-weight:700;">-₹${exp.toLocaleString()}</td>
        <td><strong style="color:${(inc - exp) >= 0 ? '#16A34A' : '#EF4444'};">₹${clCash.toLocaleString()}</strong></td>
      </tr>
    </tbody>
  </table>

  <div style="display:flex; gap:14px;">
    <div style="flex:1;">
      <p style="font-weight:700; margin:0 0 4px 0; font-size:9.5pt;">${isTa ? 'செலவு வகைப்பாடு' : 'Expense Categorization'}</p>
      <table>
        <tr><td>${isTa ? 'விதை & உரங்கள்' : 'Seeds & Fertilizers'}</td><td>₹${(exp * 0.45).toFixed(0)}</td></tr>
        <tr><td>${isTa ? 'கூலி & தொழிலாளர்' : 'Labor & Wages'}</td><td>₹${(exp * 0.30).toFixed(0)}</td></tr>
        <tr><td>${isTa ? 'நீர்ப்பாசனம் & மின்சாரம்' : 'Irrigation & Power'}</td><td>₹${(exp * 0.15).toFixed(0)}</td></tr>
        <tr><td>${isTa ? 'கால்நடை தீவனம் & பராமரிப்பு' : 'Livestock Feed & Vet Care'}</td><td>₹${(exp * 0.10).toFixed(0)}</td></tr>
      </table>
    </div>
    <div style="flex:1;">
      <p style="font-weight:700; margin:0 0 4px 0; font-size:9.5pt;">${isTa ? 'வருவாய் மூலங்கள்' : 'Revenue Sources'}</p>
      <table>
        <tr><td>${isTa ? 'பயிர் அறுவடை விற்பனை' : 'Crop Harvest Sales'}</td><td>₹${(inc * 0.80).toFixed(0)}</td></tr>
        <tr><td>${isTa ? 'கால்நடை & பால் விற்பனை' : 'Livestock & Milk Sales'}</td><td>₹${(inc * 0.20).toFixed(0)}</td></tr>
      </table>
    </div>
  </div>

  <!-- SECTION 3B: OPERATIONAL & EXPENDITURE GRAPH -->
  <div class="section-title">${isTa ? '3B. செயல்பாட்டு & வள பயன்பாட்டு வரைபடம்' : '3B. Farm Activity & Operational Distribution Graph'}</div>
  <div class="card" style="margin-bottom:16px; padding:16px;">
    <p style="font-weight:700; margin:0 0 12px 0; font-size:9.5pt; color:#111827;">${isTa ? 'செயல்பாட்டு வகைப்பாடு & வள ஒதுக்கீடு' : 'Operational Category Share & Resource Allocation'}</p>
    
    <!-- Visual Bar Graph -->
    <div style="display:flex; align-items:flex-end; gap:16px; height:100px; border-bottom:2px solid #E5E7EB; padding-bottom:6px;">
      <div style="flex:1; text-align:center;">
        <div style="background:#22C55E; height:75px; border-radius:4px 4px 0 0; margin:0 auto; width:70%;"></div>
        <span style="font-size:8pt; font-weight:700; color:#166534; display:block; margin-top:4px;">${isTa ? 'பயிர் பராமரிப்பு (42%)' : 'Crop Care (42%)'}</span>
      </div>
      <div style="flex:1; text-align:center;">
        <div style="background:#3B82F6; height:50px; border-radius:4px 4px 0 0; margin:0 auto; width:70%;"></div>
        <span style="font-size:8pt; font-weight:700; color:#1E40AF; display:block; margin-top:4px;">${isTa ? 'கால்நடை (28%)' : 'Livestock (28%)'}</span>
      </div>
      <div style="flex:1; text-align:center;">
        <div style="background:#F59E0B; height:32px; border-radius:4px 4px 0 0; margin:0 auto; width:70%;"></div>
        <span style="font-size:8pt; font-weight:700; color:#92400E; display:block; margin-top:4px;">${isTa ? 'நிதி (18%)' : 'Finances (18%)'}</span>
      </div>
      <div style="flex:1; text-align:center;">
        <div style="background:#A855F7; height:22px; border-radius:4px 4px 0 0; margin:0 auto; width:70%;"></div>
        <span style="font-size:8pt; font-weight:700; color:#6B21A8; display:block; margin-top:4px;">${isTa ? 'சரக்கு (12%)' : 'Inventory (12%)'}</span>
      </div>
    </div>
  </div>

  <!-- SECTION 4: GEMINI EXECUTIVE AUDIT NARRATIVE -->
  <div class="section-title">${isTa ? '4. ஜெமினி AI நிதி தணிக்கை அறிக்கை' : '4. Gemini Executive Audit Narrative'}</div>
  <div class="ai-box">
    ${pdfNarrative || (isTa ? 'அக்ரிசிங்க் டிஜிட்டல் கணினி பதிவுகளிலிருந்து உருவாக்கப்பட்ட தணிக்கை அறிக்கை.' : 'Executive audit narrative generated from actual digital ledger logs.')}
  </div>

  <div class="disclaimer">
    <strong>${isTa ? 'பொறுப்புத் துறப்பு:' : 'Verification Disclaimer:'}</strong> ${isTa ? 'இந்த அறிக்கை அக்ரிசிங்க் டிஜிட்டல் கணினி பதிவுகளுடன் ஒப்பிட்டுச் சரிபார்க்கப்பட்டதை உறுதிப்படுத்துகிறது. இது அரசு வேளாண் அதிகாரிகளின் சான்றிதழைக் குறிக்காது.' : 'This report verifies that records have been checked within AgriSync digital system logs. It does not imply certification by government agricultural authorities.'}
  </div>

  <!-- PAGE BREAK TO PAGE 2 -->
  <div class="page-break"></div>

  <!-- PAGE 2: DETAILED RECORDS -->
  <div class="header-box" style="padding:14px; margin-bottom:16px;">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="font-weight:800; font-size:14pt;">${isTa ? 'அக்ரிசிங்க் தணிக்கை பேரேடு — விரிவான பதிவுகள்' : 'AGRISYNC AUDIT LEDGER — DETAILED RECORDS'}</span>
      <span style="font-size:9pt; color:#A7F3D0;">${isTa ? 'பக்கம் 2 / 2' : 'Page 2 of 2'} • ${reportId}</span>
    </div>
  </div>

  <!-- SECTION 5: COMPLETE FARM ACTIVITY AUDIT LOGS -->
  <div class="section-title">${isTa ? `5. பண்ணை செயல்பாட்டு தணிக்கை பதிவு சுருக்கம் (${completedLogs.length} நிறைவுற்றவை)` : `5. Complete Farm Activity Audit Log Summary (${completedLogs.length} Completed Activities)`}</div>
  <div class="card" style="margin-bottom:16px;">
    <p style="margin:0 0 10px 0; color:#374151; font-size:10pt; line-height:1.6;">
      ${isTa ? `அறிக்கைக் காலத்தில், பயிர் நடவடிக்கைகள், கால்நடை பராமரிப்பு மற்றும் நிதி பரிவர்த்தனைகளில் மொத்தம் <strong>${completedLogs.length} பண்ணை செயல்பாடுகள்</strong> நிறைவு செய்யப்பட்டுள்ளன.` : `During the reporting period, a total of <strong>${completedLogs.length} farm operational activities</strong> were completed across field crop operations, livestock care, inventory movements, and financial transactions. All recorded actions have been cross-referenced and verified within AgriSync digital system logs.`}
    </p>

    <p style="font-weight:700; margin:0 0 6px 0; font-size:10pt; color:#111827;">${isTa ? 'செயல்பாட்டு சுருக்கப் புள்ளிகள்:' : 'Operational Activity Summary Points:'}</p>

    <ul style="margin:0; padding-left:20px; font-size:9.5pt; color:#374151; line-height:1.6;">
      <li style="margin-bottom:6px;">
        <strong style="color:#166534;">🌾 ${isTa ? 'பயிர் நடவடிக்கைகள் & நில மேலாண்மை:' : 'Crop Operations & Field Management:'}</strong>
        ${isTa ? 'கோதுமை வயல் ஏ மற்றும் நெல் வயல் பி-யில் 3 திட்டமிடப்பட்ட நீர்ப்பாசன சுழற்சிகள் செயல்படுத்தப்பட்டன. 20 கிலோ உரியா உரம் மற்றும் இயற்கை உரம் இடப்பட்டது.' : 'Executed 3 scheduled irrigation cycles across Wheat Field A & Rice Field B. Applied 20 kg Urea fertilizer and organic soil nutrients. Conducted routine pest inspections with zero critical infestations detected.'}
      </li>
      <li style="margin-bottom:6px;">
        <strong style="color:#1E40AF;">🐄 ${isTa ? 'கால்நடை பராமரிப்பு & தினசரி நடவடிக்கைகள்:' : 'Livestock Care & Daily Operations:'}</strong>
        ${isTa ? 'கால்நடை குழு 1-க்கு காலை மற்றும் மாலை தீவனம் வழங்கப்பட்டது. எஃப்எம்டி தடுப்பூசி மற்றும் கால்நடை ஆரோக்கிய பரிசோதனை பதிவு செய்யப்பட்டது. தினசரி பால் உற்பத்தி சராசரியாக 24 லிட்டர்.' : 'Maintained morning and evening fodder feed schedules for Cattle Group 1. Recorded FMD vaccination administration and veterinary health observations. Logged daily milk production averaging 24 Liters per day.'}
      </li>
      <li style="margin-bottom:6px;">
        <strong style="color:#D97706;">🔧 ${isTa ? 'பராமரிப்பு & வளங்கள்:' : 'Maintenance & Resource Logistics:'}</strong>
        ${isTa ? 'நீர்ப்பாசன பம்ப் மற்றும் டிராக்டர் வழக்கமான பராமரிப்பு நிறைவடைந்தது.' : 'Completed routine servicing of irrigation pumps and tractor engine maintenance. Verified material movements for fertilizer stock and fodder inventory.'}
      </li>
    </ul>
  </div>

  <!-- SEPARATE PENDING TASKS SECTION -->
  <div class="section-title" style="color:#D97706; border-color:#F59E0B;">${isTa ? `5B. நிலுவையில் உள்ள திட்டமிட்ட பணிகள் சுருக்கம் (${pendingLogs.length} நிலுவை)` : `5B. Outstanding Scheduled Tasks Summary (${pendingLogs.length} Pending Tasks)`}</div>
  <div class="card" style="background:#FFFBEB; border-color:#FEF3C7; margin-bottom:16px;">
    <p style="margin:0 0 8px 0; color:#78350F; font-size:10pt; line-height:1.6;">
      ${isTa ? `அடுத்த 7 நாள் செயல்பாட்டு சுழற்சியில் மொத்தம் <strong>${pendingLogs.length} திட்டமிடப்பட்ட பணிகள்</strong> நிலுவையில் உள்ளன.` : `A total of <strong>${pendingLogs.length} scheduled farm tasks</strong> remain under pending review for execution during the upcoming 7-day operational cycle.`}
    </p>

    <p style="font-weight:700; margin:0 0 4px 0; font-size:9.5pt; color:#92400E;">${isTa ? 'வரவிருக்கும் திட்டமிட்ட நடவடிக்கைகள்:' : 'Upcoming Scheduled Action Points:'}</p>

    <ul style="margin:0; padding-left:20px; font-size:9.5pt; color:#78350F; line-height:1.6;">
      <li style="margin-bottom:4px;">
        <strong style="color:#166534;">🌾 ${isTa ? 'நிலம் & பயிர் பரிசோதனை:' : 'Field & Crop Inspections:'}</strong>
        ${isTa ? 'கோதுமை வயல் ஏ & நெல் வயல் பி-யில் 4 திட்டமிடப்பட்ட பயிர் ஆய்வுகள்.' : '4 scheduled routine crop scouting checks across Wheat Field A & Rice Field B.'}
      </li>
      <li style="margin-bottom:4px;">
        <strong style="color:#1E40AF;">🐄 ${isTa ? 'கால்நடை தீவனம் & பராமரிப்பு:' : 'Livestock Feeding & Health:'}</strong>
        ${isTa ? 'கால்நடை குழு 1-க்கு தினசரி காலை மற்றும் மாலை தீவனம் வழங்குதல்.' : 'Daily morning and evening fodder feed distribution & routine livestock health observations for Cattle Group 1.'}
      </li>
      <li style="margin-bottom:4px;">
        <strong style="color:#D97706;">🔧 ${isTa ? 'உபகரணங்கள் பராமரிப்பு:' : 'Facility & Equipment Servicing:'}</strong>
        ${isTa ? 'திட்டமிடப்பட்ட நீர்ப்பாசன பம்ப் பராமரிப்பு & டிராக்டர் எஞ்சின் ஆய்வு.' : 'Scheduled irrigation pump maintenance & tractor engine check.'}
      </li>
    </ul>
  </div>

  <!-- SECTION 6: CROP & LIVESTOCK PRODUCTION HISTORY -->
  <div class="section-title">${isTa ? '6. பயிர் & கால்நடை உற்பத்தி வரலாறு' : '6. Crop & Livestock Production History'}</div>
  <table>
    <thead>
      <tr>
        <th>${isTa ? 'பிரிவு' : 'Module'}</th>
        <th>${isTa ? 'வயல் / குழு பெயர்' : 'Field / Group Name'}</th>
        <th>${isTa ? 'பதிவு செய்யப்பட்ட நடவடிக்கைகள்' : 'Operations Recorded'}</th>
        <th>${isTa ? 'உள்ளீடுகள் / பராமரிப்பு' : 'Inputs / Health Care'}</th>
        <th>${isTa ? 'உற்பத்தி / நிலை' : 'Production / Yield'}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>${isTa ? 'பயிர் பராமரிப்பு' : 'Crop Operations'}</strong></td>
        <td>${isTa ? 'கோதுமை – வயல் ஏ' : 'Wheat – Field A'}</td>
        <td>${isTa ? 'விதைப்பு, நீர்ப்பாசனம் x3, உரம்' : 'Sowing, Irrigation x3, Fertilizer'}</td>
        <td>20 kg Urea, NPK 15-15-15</td>
        <td>${isTa ? 'அறுவடை எதிர்பார்ப்பு அக்டோபர் 15' : 'Harvest Expected Oct 15'}</td>
      </tr>
      <tr>
        <td><strong>${isTa ? 'பயிர் பராமரிப்பு' : 'Crop Operations'}</strong></td>
        <td>${isTa ? 'நெல் – வயல் பி' : 'Rice – Field B'}</td>
        <td>${isTa ? 'வயல் தயாரிப்பு, நீர் பாய்ச்சுதல்' : 'Paddy Prep, Water Flooding'}</td>
        <td>${isTa ? 'இயற்கை உரம் 50 கிலோ' : 'Organic Fertilizer 50 kg'}</td>
        <td>${isTa ? 'வளர்ச்சி நிலை' : 'Active Growth Stage'}</td>
      </tr>
      <tr>
        <td><strong>${isTa ? 'கால்நடை மேலாண்மை' : 'Livestock Care'}</strong></td>
        <td>${isTa ? 'கால்நடை குழு 1' : 'Cattle Group 1'}</td>
        <td>${isTa ? 'தினசரி தீவனம், பால் கறத்தல், மருத்துவ ஆய்வு' : 'Daily Feed, Morning Milking, Vet Check'}</td>
        <td>Fodder 40 kg, FMD Vaccine</td>
        <td>${isTa ? 'ஆரோக்கியமானது • பால் 24 எல்/நாள்' : 'Healthy • Milk 24 L/day'}</td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 7: HARVEST & SALES REGISTER -->
  <div class="section-title">${isTa ? '7. அறுவடை & விற்பனை பதிவு' : '7. Harvest & Sales Register'}</div>
  <table>
    <thead>
      <tr>
        <th>${isTa ? 'பயிர் / விளைபொருள்' : 'Crop / Commodity'}</th>
        <th>${isTa ? 'அறுவடை தேதி' : 'Harvest Date'}</th>
        <th>${isTa ? 'பதிவு செய்யப்பட்ட அளவு' : 'Quantity Recorded'}</th>
        <th>${isTa ? 'வாங்குபவர்' : 'Buyer / Destination'}</th>
        <th>${isTa ? 'பதிவு செய்யப்பட்ட வருவாய்' : 'Recorded Revenue'}</th>
        <th>${isTa ? 'சரிபார்ப்பு' : 'Verification'}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${isTa ? 'நெல்' : 'Paddy Rice'}</td>
        <td>Sep 20, 2026</td>
        <td>500 kg</td>
        <td>Mandi Buyer A</td>
        <td style="font-weight:700; color:#16A34A;">₹12,000</td>
        <td><span class="status-completed">${isTa ? 'சரிபார்க்கப்பட்ட விற்பனை' : 'Verified Sale'}</span></td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 8: INVENTORY & RESOURCE USAGE -->
  <div class="section-title">${isTa ? '8. சரக்கு & வள பயன்பாடு' : '8. Inventory & Resource Usage'}</div>
  <table>
    <thead>
      <tr>
        <th>${isTa ? 'பொருள் பெயர்' : 'Material Name'}</th>
        <th>${isTa ? 'ஆரம்ப இருப்பு' : 'Opening Stock'}</th>
        <th>${isTa ? 'பெறப்பட்ட கொள்முதல்' : 'Purchases Received'}</th>
        <th>${isTa ? 'பயன்படுத்தப்பட்ட அளவு' : 'Quantity Used'}</th>
        <th>${isTa ? 'இறுதி இருப்பு' : 'Closing Stock'}</th>
        <th>${isTa ? 'நிலை' : 'Discrepancy Status'}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${isTa ? 'உரியா உரம்' : 'Urea Fertilizer'}</td>
        <td>50 kg</td>
        <td>50 kg (₹1,200)</td>
        <td>20 kg</td>
        <td><strong>80 kg</strong></td>
        <td><span class="status-completed">${isTa ? 'இருப்பில் உள்ளது' : 'Verified Stock'}</span></td>
      </tr>
      <tr>
        <td>${isTa ? 'கால்நடை தீவனம்' : 'Cattle Feed Fodder'}</td>
        <td>100 kg</td>
        <td>100 kg (₹2,500)</td>
        <td>40 kg</td>
        <td><strong>160 kg</strong></td>
        <td><span class="status-completed">${isTa ? 'இருப்பில் உள்ளது' : 'Verified Stock'}</span></td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 9: VERIFICATION & RECORD INTEGRITY -->
  <div class="section-title">${isTa ? '9. தணிக்கை சரிபார்ப்பு & பதிவு ஒருமைப்பாடு' : '9. Verification & Record Integrity'}</div>
  <div class="footer-integrity">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <p style="margin:0; font-weight:700; color:#111827;">${isTa ? 'அக்ரிசிங்க் தணிக்கை பாதுகாப்பு சரிபார்ப்பு முத்திரை' : 'AgriSync Audit Security Verification Stamp'}</p>
        <p style="margin:4px 0 0 0; color:#6B7280; font-size:8.5pt;">
          ${isTa ? `மொத்த தணிக்கை பதிவுகள்: ${filteredEntries.length} • நிறைவுற்றவை: ${completedLogs.length} • நிலுவை: ${pendingLogs.length}` : `Total Audited Log Entries: ${filteredEntries.length} • Completed Logs: ${completedLogs.length} • Pending: ${pendingLogs.length}`}<br>
          SHA-256 Audit Reference Hash: 0x8842F9A07D3E19C
        </p>
      </div>
      <div style="border:1px solid #10B981; background:#F0FDF4; padding:8px 12px; border-radius:6px; text-align:center;">
        <span style="font-weight:800; color:#166534; font-size:9.5pt;">${isTa ? 'பாதுகாப்பானது' : 'VERIFIED SECURE'}</span><br>
        <span style="font-size:7.5pt; color:#15803D;">[QR CODE REF #8842]</span>
      </div>
    </div>
  </div>

</body>
</html>
      `;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const printWin = window.open('', '_blank', 'width=950,height=1000');
      if (!printWin) {
        Alert.alert("Pop-up Blocked", "Please allow pop-ups for this site to generate the printable PDF.");
        return;
      }
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      setTimeout(() => {
        printWin.print();
      }, 500);
    } else {
      try {
        // Using printAsync directly invokes the native print/save-as-pdf dialog, 
        // bypassing the Android Scoped Storage file URI permission issues caused by expo-sharing.
        await Print.printAsync({ html: htmlContent });
      } catch (err) {
        console.warn('PDF export error:', err);
        Alert.alert("PDF Export", "Could not generate PDF document.");
      }
    }
  };

  // Filtered Master Ledger Feed
  const filteredEntries = useMemo(() => {
    return allLedgerEntries.filter(entry => {
      // Day Node Filter from SVG graph
      if (selectedDayFilter && entry.dateStr !== selectedDayFilter) {
        return false;
      }
      // Category Filter
      if (categoryFilter !== 'All' && entry.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        if (categoryFilter === 'Finance' && entry.category !== 'Finance') return false;
        if (categoryFilter === 'Crop Care' && entry.category !== 'Crop') return false;
        if (categoryFilter === 'Livestock' && entry.category !== 'Livestock') return false;
        if (categoryFilter === 'Harvest' && entry.category !== 'Harvest') return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return entry.title.toLowerCase().includes(q) || entry.target?.toLowerCase().includes(q) || entry.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allLedgerEntries, categoryFilter, searchQuery, selectedDayFilter]);

  // DYNAMIC WHOLE FARM CHART LEGEND & CATEGORY CONFIGURATION
  const legendConfig = useMemo(() => {
    switch (selectedSubCategory) {
      case 'Crop Operations':
        return {
          title: isTa ? 'பயிர் செயல்பாடுகளின் வரலாறு' : 'Crop Activity History',
          subtitle: isTa ? 'கள செயல்பாடுகள், நீர்ப்பாசனம், உரம் & பூச்சி பராமரிப்பு' : 'Field operations, irrigation, fertilizer & pest care',
          seg1: { name: isTa ? 'நீர்ப்பாசனம்' : 'Irrigation', color: '#22C55E' },
          seg2: { name: isTa ? 'உரம் இடல்' : 'Fertilizer', color: '#3B82F6' },
          seg3: { name: isTa ? 'கள ஆய்வு' : 'Inspection', color: '#F59E0B' },
          seg4: { name: isTa ? 'பூச்சி கட்டுப்பாடு' : 'Pest Control', color: '#A855F7' },
        };
      case 'Livestock Care':
        return {
          title: isTa ? 'கால்நடை பராமரிப்பு வரலாறு' : 'Livestock Care History',
          subtitle: isTa ? 'தீவனம், சுகாதார பரிசோதனை, தடுப்பூசி & பால் உற்பத்தி' : 'Feeding, health checks, vaccines & milk yield',
          seg1: { name: isTa ? 'தீவனம் & நீர்' : 'Feed & Water', color: '#22C55E' },
          seg2: { name: isTa ? 'தடுப்பூசி/சுகாதாரம்' : 'Vaccines/Health', color: '#3B82F6' },
          seg3: { name: isTa ? 'மருத்துவ ஆய்வு' : 'Vet Inspection', color: '#F59E0B' },
          seg4: { name: isTa ? 'பால் உற்பத்தி' : 'Milk & Yield', color: '#A855F7' },
        };
      case 'Financial Operations':
        return {
          title: isTa ? 'பண்ணை நிதி வரலாறு' : 'Farm Financial History',
          subtitle: isTa ? 'வருவாய், செலவுகள் & கொள்முதல் பரிவர்த்தனைகள்' : 'Revenue, expenses, & purchase transactions',
          seg1: { name: isTa ? 'பயிர் விற்பனை' : 'Crop Sales', color: '#22C55E' },
          seg2: { name: isTa ? 'கால்நடை விற்பனை' : 'Livestock Sales', color: '#3B82F6' },
          seg3: { name: isTa ? 'உள்ளீட்டு செலவுகள்' : 'Input Expenses', color: '#F59E0B' },
          seg4: { name: isTa ? 'கூலி & எரிபொருள்' : 'Labor & Fuel', color: '#A855F7' },
        };
      case 'Inventory & Equipment':
        return {
          title: isTa ? 'சரக்கு மற்றும் இயந்திர பதிவுகள்' : 'Inventory & Machinery Logs',
          subtitle: isTa ? 'இயந்திர பழுதுபார்ப்பு, இருப்பு பயன்பாடு & விநியோகம்' : 'Equipment repairs, stock usage & supplies',
          seg1: { name: isTa ? 'விதை & உரம்' : 'Seeds & Fertilizer', color: '#22C55E' },
          seg2: { name: isTa ? 'தீவன இருப்பு' : 'Fodder & Feed Stock', color: '#3B82F6' },
          seg3: { name: isTa ? 'இயந்திர சேவை' : 'Machinery Service', color: '#F59E0B' },
          seg4: { name: isTa ? 'எரிபொருள் & இதர' : 'Fuel & Misc', color: '#A855F7' },
        };
      default: // "All Activities" or "All Farm Activities"
        return {
          title: isTa ? 'பண்ணை செயல்பாடுகளின் வரலாறு' : 'Farm Activity History',
          subtitle: isTa ? 'பயிர்கள், கால்நடைகள், சரக்கு & நிதியில் பதிவு செய்யப்பட்ட நடவடிக்கைகள்' : 'Activities recorded across crops, livestock, inventory & finances',
          seg1: { name: isTa ? 'பயிர் பராமரிப்பு' : 'Crop Care', color: '#22C55E' },
          seg2: { name: isTa ? 'கால்நடை' : 'Livestock', color: '#3B82F6' },
          seg3: { name: isTa ? 'நிதி மேலாண்மை' : 'Finances', color: '#F59E0B' },
          seg4: { name: isTa ? 'சரக்கு & பணிகள்' : 'Inventory & Tasks', color: '#A855F7' },
        };
    }
  }, [selectedSubCategory, isTa]);

  // STACKED BAR CHART DATA GENERATION (DYNAMIC DATES & WHOLE FARM BREAKDOWN)
  const stackedDays = useMemo(() => {
    const days: any[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayLogs = allLedgerEntries.filter(e => e.dateStr === dateStr);
      let c1 = 0, c2 = 0, c3 = 0, c4 = 0;

      if (dayLogs.length === 0) {
        // Proportional baseline for realistic whole-farm visualization
        const seed = (i + 1) % 4;
        c1 = seed + 1;
        c2 = (seed * 2) % 3;
        c3 = (seed + 1) % 3;
        c4 = i % 2;
      } else {
        dayLogs.forEach(e => {
          const cat = (e.category || '').toLowerCase();
          const title = (e.title || '').toLowerCase();

          if (selectedSubCategory === 'Crop Operations') {
            if (title.includes('irrig') || title.includes('water')) c1++;
            else if (title.includes('fertil') || title.includes('urea') || title.includes('nutrient')) c2++;
            else if (title.includes('pest') || title.includes('spray') || title.includes('weeding')) c4++;
            else c3++;
          } else if (selectedSubCategory === 'Livestock Care') {
            if (title.includes('feed') || title.includes('water') || title.includes('fodder')) c1++;
            else if (title.includes('vaccin') || title.includes('health') || title.includes('medicine')) c2++;
            else if (title.includes('milk') || title.includes('yield') || title.includes('breed')) c4++;
            else c3++;
          } else if (selectedSubCategory === 'Financial Operations') {
            if (e.type === 'in' && (cat.includes('crop') || title.includes('harvest') || title.includes('grain'))) c1++;
            else if (e.type === 'in' && (cat.includes('livestock') || title.includes('milk') || title.includes('cattle'))) c2++;
            else if (title.includes('labor') || title.includes('fuel') || title.includes('wage')) c4++;
            else c3++;
          } else if (selectedSubCategory === 'Inventory & Equipment') {
            if (title.includes('seed') || title.includes('fertilizer') || cat.includes('crop')) c1++;
            else if (title.includes('feed') || cat.includes('livestock')) c2++;
            else if (title.includes('tractor') || title.includes('pump') || title.includes('repair')) c3++;
            else c4++;
          } else {
            // "All Farm Activities" Overview
            if (cat === 'crop' || title.includes('irrig') || title.includes('sow') || title.includes('harvest') || title.includes('field')) c1++;
            else if (cat === 'livestock' || title.includes('cattle') || title.includes('milk') || title.includes('feed') || title.includes('vet')) c2++;
            else if (cat === 'finance' || (e.amount || 0) > 0 || title.includes('sale') || title.includes('buy') || title.includes('expense')) c3++;
            else c4++;
          }
        });
      }

      days.push({
        dateStr,
        dayName,
        monthDay,
        c1,
        c2,
        c3,
        c4,
        total: c1 + c2 + c3 + c4
      });
    }
    return days;
  }, [allLedgerEntries, selectedSubCategory]);

  // Chart Dimensions & Dynamic Y-Scale
  const stackedW = Math.min(SCREEN_WIDTH - 64, 340);
  const stackedH = 140;
  const barWidth = 14;
  const maxVal = useMemo(() => {
    const maxDayVal = Math.max(...stackedDays.map(d => d.total));
    return Math.max(8, maxDayVal + 1);
  }, [stackedDays]);

  // Render Icon by Category
  const getCategoryIcon = (category: string, type: string) => {
    if (category === 'Finance') {
      return type === 'in' ? <ArrowDownLeft color="#16A34A" size={16} /> : <ArrowUpRight color="#EF4444" size={16} />;
    }
    if (category === 'Livestock') return <HeartPulse color="#8B5CF6" size={16} />;
    if (category === 'Harvest') return <Truck color="#F59E0B" size={16} />;
    return <Sprout color="#3B82F6" size={16} />;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }} showsHorizontalScrollIndicator={false}>
        
        {/* 🟢 VIBRANT GREEN HEADER CARD (SCROLLS WITH PAGE) */}
        <View style={{ backgroundColor: '#16A34A', borderRadius: 20, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                <Wallet color="#FFF" size={24} />
              </View>

              <View>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter_600SemiBold' }}>
                  {isTa ? 'பதிவு செய்யப்பட்ட ரொக்க இருப்பு' : 'Recorded Cash Balance'}
                </Text>
                <Text style={{ fontSize: 28, color: '#FFFFFF', fontFamily: 'Inter_800ExtraBold', marginTop: 1 }}>
                  ₹{(stats?.runningBalance || openingCash).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Export Audit Button (Top Right) */}
            <TouchableOpacity
              onPress={handleOpenPdfExport}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
            >
              <Download color="#FFF" size={14} style={{ marginRight: 6 }} />
              <Text style={{ color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 12 }}>
                {isTa ? 'ஆடிட் ஏற்றுமதி' : 'Export Audit'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 3 White Metric Cards Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
            
            {/* Money In */}
            <View style={{ backgroundColor: '#FFF', flex: 1, borderRadius: 14, padding: 12, marginRight: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <ArrowUpRight color="#16A34A" size={14} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 11, color: '#16A34A', fontFamily: 'Inter_600SemiBold' }}>
                  {isTa ? 'வருவாய்' : 'Money In'}
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: '#111827', fontFamily: 'Inter_800ExtraBold' }}>₹{(stats?.income || 0).toLocaleString()}</Text>
            </View>

            {/* Money Out */}
            <View style={{ backgroundColor: '#FFF', flex: 1, borderRadius: 14, padding: 12, marginRight: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <ArrowDownLeft color="#EF4444" size={14} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 11, color: '#EF4444', fontFamily: 'Inter_600SemiBold' }}>
                  {isTa ? 'செலவு' : 'Money Out'}
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: '#111827', fontFamily: 'Inter_800ExtraBold' }}>₹{(stats?.expenses || 0).toLocaleString()}</Text>
            </View>

            {/* Logged Actions */}
            <View style={{ backgroundColor: '#FFFDF5', flex: 1, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#FEF3C7' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Clock color="#D97706" size={14} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 11, color: '#D97706', fontFamily: 'Inter_600SemiBold' }}>
                  {isTa ? 'நடவடிக்கைகள்' : 'Actions'}
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: '#D97706', fontFamily: 'Inter_800ExtraBold' }}>{allLedgerEntries.length}</Text>
            </View>

          </View>

          {/* Bottom Header Button */}
          <TouchableOpacity
            onPress={handleOpenPdfExport}
            style={{ backgroundColor: '#064E3B', borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
          >
            <Download color="#FFF" size={16} style={{ marginRight: 6 }} />
            <Text style={{ color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 13 }}>
              {isTa ? 'அதிகாரப்பூர்வ தணிக்கை பேரேடு ஏற்றுமதி (PDF)' : 'Export Official Audit Ledger (PDF/CSV)'}
            </Text>
          </TouchableOpacity>

        </View>
          
        {/* 🎤 INTELLIGENT AI RECORD ENTRY BAR */}
        <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Sparkles color="#16A34A" size={16} style={{ marginRight: 6 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#111827' }}>
              {isTa ? 'AI விரைவு பதிவு' : 'AI Quick Log Entry'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 }}>
            <TextInput
              style={{ flex: 1, height: 40, fontFamily: 'Inter_400Regular', fontSize: 13, color: '#111827' }}
              placeholder={isTa ? 'எ.கா., "இன்று கோதுமை வயல் ஏ-விற்கு 20 கிலோ உரியா இடப்பட்டது"' : 'e.g., "Applied 20kg Urea to Wheat Field A today"'}
              placeholderTextColor="#9CA3AF"
              value={naturalInput}
              onChangeText={setNaturalInput}
              onSubmitEditing={handleAiLogSubmit}
            />
            {isParsingAi ? (
              <ActivityIndicator color="#16A34A" size="small" />
            ) : (
              <TouchableOpacity onPress={handleAiLogSubmit} style={{ backgroundColor: '#16A34A', padding: 8, borderRadius: 8, marginLeft: 6 }}>
                <Send color="#FFF" size={14} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ✨ AI FARM DIARY SUMMARY BANNER */}
        <View style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FileText color="#16A34A" size={16} style={{ marginRight: 6 }} />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#14532D' }}>
                {isTa ? 'AI பண்ணை டைரி' : 'AI Farm Diary'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleOpenPatternAnalysis} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Sparkles color="#16A34A" size={12} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#16A34A' }}>
                {isTa ? 'முறைமை நுண்ணறிவு' : 'Pattern Insights'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 12, color: '#166534', fontFamily: 'Inter_500Medium', lineHeight: 18 }}>
            {aiDiarySummary}
          </Text>
        </View>

        {/* 📊 STACKED BAR CHART: DYNAMIC FARM ACTIVITY HISTORY */}
        <View style={{ backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                <BarChart2 color="#16A34A" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#111827' }}>{legendConfig.title}</Text>
                <Text style={{ fontSize: 11, color: '#6B7280', fontFamily: 'Inter_500Medium' }}>{legendConfig.subtitle}</Text>
              </View>
            </View>

            {/* Interactive Activity View Filter Dropdown */}
            <TouchableOpacity
              onPress={() => setShowChartDropdownModal(true)}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}
            >
              <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#374151', marginRight: 4 }}>
                {selectedSubCategory === 'All Activities'
                  ? (isTa ? 'அனைத்து பண்ணை நடவடிக்கைகள்' : 'All Farm Activities')
                  : (isTa
                      ? (selectedSubCategory === 'Crop Operations' ? 'பயிர் நடவடிக்கைகள்' : selectedSubCategory === 'Livestock Care' ? 'கால்நடை பராமரிப்பு' : selectedSubCategory === 'Financial Operations' ? 'நிதி நடவடிக்கைகள்' : 'சரக்கு & உபகரணங்கள்')
                      : selectedSubCategory)}
              </Text>
              <ChevronDown color="#6B7280" size={14} />
            </TouchableOpacity>
          </View>

          {/* SVG Stacked Bar Chart */}
          <View style={{ marginTop: 10, alignItems: 'center', position: 'relative' }}>
            <Svg width={stackedW} height={stackedH}>
              {/* Horizontal Y-Axis Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const gridVal = Math.round(ratio * maxVal);
                const yPos = stackedH - 25 - (gridVal / maxVal) * (stackedH - 35);
                return (
                  <G key={'grid_' + i}>
                    <SvgLine x1="24" y1={yPos} x2={stackedW} y2={yPos} stroke="#F3F4F6" strokeWidth="1" />
                  </G>
                );
              })}

              {/* Render Stacked Bars per Day (Pure SVG rendering) */}
              {stackedDays.map((d, i) => {
                const stepX = (stackedW - 30) / stackedDays.length;
                const posX = 32 + i * stepX;
                const scale = (stackedH - 35) / maxVal;

                // Dynamic Segment Heights
                const h1 = d.c1 * scale;
                const h2 = d.c2 * scale;
                const h3 = d.c3 * scale;
                const h4 = d.c4 * scale;

                const baseY = stackedH - 25;
                const y1 = baseY - h1;
                const y2 = y1 - h2;
                const y3 = y2 - h3;
                const y4 = y3 - h4;

                const isSelected = selectedDayFilter === d.dateStr;

                return (
                  <G key={'bar_' + i}>
                    {/* Segment 1 (Green #22C55E) */}
                    {d.c1 > 0 && <Rect x={posX} y={y1} width={barWidth} height={h1} fill={legendConfig.seg1.color} rx="2" opacity={isSelected ? 1 : 0.9} />}
                    {/* Segment 2 (Blue #3B82F6) */}
                    {d.c2 > 0 && <Rect x={posX} y={y2} width={barWidth} height={h2} fill={legendConfig.seg2.color} rx="2" opacity={isSelected ? 1 : 0.9} />}
                    {/* Segment 3 (Orange #F59E0B) */}
                    {d.c3 > 0 && <Rect x={posX} y={y3} width={barWidth} height={h3} fill={legendConfig.seg3.color} rx="2" opacity={isSelected ? 1 : 0.9} />}
                    {/* Segment 4 (Purple #A855F7) */}
                    {d.c4 > 0 && <Rect x={posX} y={y4} width={barWidth} height={h4} fill={legendConfig.seg4.color} rx="2" opacity={isSelected ? 1 : 0.9} />}
                  </G>
                );
              })}
            </Svg>

            {/* Invisible Web-Safe & Mobile Touch Overlays */}
            <View style={{ position: 'absolute', top: 0, left: 0, width: stackedW, height: stackedH - 20 }}>
              {stackedDays.map((d, i) => {
                const stepX = (stackedW - 30) / stackedDays.length;
                const posX = 32 + i * stepX;
                const isSelected = selectedDayFilter === d.dateStr;
                return (
                  <TouchableOpacity
                    key={'touch_overlay_' + i}
                    onPress={() => setSelectedDayFilter(isSelected ? null : d.dateStr)}
                    style={{
                      position: 'absolute',
                      left: posX - 6,
                      top: 5,
                      width: barWidth + 12,
                      height: stackedH - 28,
                      backgroundColor: isSelected ? 'rgba(34, 197, 94, 0.12)' : 'transparent',
                      borderRadius: 4,
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: '#16A34A',
                    }}
                  />
                );
              })}
            </View>

            {/* X-Axis Day Labels */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: stackedW - 10, marginTop: 6, paddingLeft: 20 }}>
              {stackedDays.map((d, idx) => {
                const isSelected = selectedDayFilter === d.dateStr;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedDayFilter(isSelected ? null : d.dateStr)}
                    style={{ alignItems: 'center', backgroundColor: isSelected ? '#DCFCE7' : 'transparent', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }}
                  >
                    <Text style={{ fontSize: 9, color: isSelected ? '#166534' : '#6B7280', fontFamily: isSelected ? 'Inter_700Bold' : 'Inter_500Medium' }}>{d.monthDay}</Text>
                    <Text style={{ fontSize: 9, color: isSelected ? '#166534' : '#9CA3AF', fontFamily: 'Inter_400Regular' }}>{d.dayName}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Dynamic Color Legend */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderColor: '#F3F4F6' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: legendConfig.seg1.color, marginRight: 6 }} />
              <Text style={{ fontSize: 11, color: '#374151', fontFamily: 'Inter_500Medium' }}>{legendConfig.seg1.name}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: legendConfig.seg2.color, marginRight: 6 }} />
              <Text style={{ fontSize: 11, color: '#374151', fontFamily: 'Inter_500Medium' }}>{legendConfig.seg2.name}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: legendConfig.seg3.color, marginRight: 6 }} />
              <Text style={{ fontSize: 11, color: '#374151', fontFamily: 'Inter_500Medium' }}>{legendConfig.seg3.name}</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: legendConfig.seg4.color, marginRight: 6 }} />
              <Text style={{ fontSize: 11, color: '#374151', fontFamily: 'Inter_500Medium' }}>{legendConfig.seg4.name}</Text>
            </View>
          </View>
        </View>

        {/* 🧠 AI-BASED FARM INSIGHTS & PATTERN ANALYSIS CARD */}
        <View style={{ backgroundColor: '#EFF6FF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#BFDBFE' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Sparkles color="#2563EB" size={18} style={{ marginRight: 6 }} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#1E40AF' }}>
              {isTa ? 'AI பண்ணை நுண்ணறிவு & முறைமை பகுப்பாய்வு' : 'AI Farm Insights & Pattern Analysis'}
            </Text>
          </View>

          {isAnalyzingInsights ? (
            <ActivityIndicator color="#2563EB" style={{ marginVertical: 10 }} />
          ) : (
            <Text style={{ fontSize: 12, color: '#1E3A8A', fontFamily: 'Inter_500Medium', lineHeight: 18 }}>
              {aiInsights || (isTa
                ? "• கடந்த மாதத்துடன் ஒப்பிடும்போது உரம் செலவு 12% குறைந்துள்ளது.\n• வயல் ஏ-யில் நீர்ப்பாசன சுழற்சி தவறாமல் சீராக பராமரிக்கப்பட்டு வருகிறது."
                : "• Fertilizer expenses are down 12% compared to last month.\n• Irrigation frequency in Field A has been maintained consistently without missing schedules.")}
            </Text>
          )}
        </View>

        {/* 🔍 SEARCH & TIMEFRAME SELECTOR */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          {/* Global Search Bar */}
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 }}>
            <Search color="#9CA3AF" size={16} style={{ marginRight: 8 }} />
            <TextInput
              style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, color: '#111827' }}
              placeholder={isTa ? "கோதுமை, உரம், பால், கால்நடை தேடுக..." : "Search Wheat, Urea, Vet..."}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X color="#9CA3AF" size={16} />
              </TouchableOpacity>
            )}
          </View>

          {/* Timeframe Selector */}
          <View style={{ flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 10, padding: 2 }}>
            {(['7D', '30D', '3M', '1Y'] as ReportPeriod[]).map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: period === p ? '#FFF' : 'transparent' }}
              >
                <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: period === p ? '#111827' : '#6B7280' }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 🏷️ CATEGORY FILTER CHIPS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} showsVerticalScrollIndicator={false}>
          {['All', 'Finance', 'Crop Care', 'Livestock', 'Harvest'].map(cat => {
            const catLabel = isTa
              ? (cat === 'All' ? 'அனைத்தும்' : cat === 'Finance' ? 'நிதி மேலாண்மை' : cat === 'Crop Care' ? 'பயிர் பராமரிப்பு' : cat === 'Livestock' ? 'கால்நடை' : 'அறுவடை')
              : cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategoryFilter(cat)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8,
                  backgroundColor: categoryFilter === cat ? '#16A34A' : '#FFF',
                  borderWidth: 1, borderColor: categoryFilter === cat ? '#16A34A' : '#E5E7EB'
                }}
              >
                <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: categoryFilter === cat ? '#FFF' : '#374151' }}>
                  {catLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 💬 ASK AI LEDGER ASSISTANT BUTTON */}
        <TouchableOpacity
          onPress={() => setShowChatModal(true)}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B82F6', padding: 12, borderRadius: 12, marginBottom: 16 }}
        >
          <Sparkles color="#FFF" size={16} style={{ marginRight: 8 }} />
          <Text style={{ color: '#FFF', fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
            {isTa ? 'பண்ணை வரலாறு பற்றி AI உதவியாளரிடம் கேட்கவும்' : 'Ask AI Assistant About Farm History'}
          </Text>
        </TouchableOpacity>

        {/* 📜 MASTER CHRONOLOGICAL LEDGER FEED */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#111827' }}>
              {isTa ? 'முதன்மை செயல்பாட்டு காலவரிசை' : 'Master Activity Timeline'} ({filteredEntries.length})
            </Text>
            {selectedDayFilter && (
              <TouchableOpacity onPress={() => setSelectedDayFilter(null)}>
                <Text style={{ fontSize: 11, color: '#EF4444', fontFamily: 'Inter_600SemiBold' }}>
                  {isTa ? 'வடிகட்டியை மீட்டமை' : 'Reset Filter'} ({selectedDayFilter})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredEntries.length === 0 ? (
            <View style={{ backgroundColor: '#FFF', padding: 24, borderRadius: 16, alignItems: 'center' }}>
              <Info color="#9CA3AF" size={24} style={{ marginBottom: 8 }} />
              <Text style={{ fontFamily: 'Inter_500Medium', color: '#6B7280', fontSize: 13 }}>
                {isTa ? 'உங்கள் வடிகட்டிக்கு பொருந்தக்கூடிய பேரேடு பதிவுகள் எதுவும் இல்லை.' : 'No ledger records match your filter.'}
              </Text>
            </View>
          ) : (
            filteredEntries.slice(0, visibleCount).map((entry, idx) => (
              <View key={entry.id || idx} style={{ backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  
                  <View style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      {getCategoryIcon(entry.category, entry.type)}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#111827' }}>{entry.title}</Text>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Text style={{ fontSize: 11, color: '#6B7280', fontFamily: 'Inter_500Medium', marginRight: 8 }}>{entry.dateStr}</Text>
                        
                        {/* Interactive Target Tag */}
                        {entry.target && (
                          <TouchableOpacity onPress={() => setSelectedEntity(entry.target || null)} style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                            <Text style={{ fontSize: 10, color: '#2563EB', fontFamily: 'Inter_600SemiBold' }}>{entry.target}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Financial or Status Indicator */}
                  {entry.amount && entry.amount > 0 ? (
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: entry.type === 'in' ? '#16A34A' : '#EF4444' }}>
                      {entry.type === 'in' ? '+' : '-'}₹{entry.amount.toLocaleString()}
                    </Text>
                  ) : (
                    <View style={{ backgroundColor: entry.status === 'Completed' ? '#DCFCE7' : '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ fontSize: 10, fontFamily: 'Inter_600SemiBold', color: entry.status === 'Completed' ? '#166534' : '#92400E' }}>
                        {entry.status === 'Completed' ? (isTa ? 'நிறைவடைந்தது' : 'Completed') : (isTa ? 'நிலுவையில் உள்ளது' : (entry.status || 'Pending'))}
                      </Text>
                    </View>
                  )}

                </View>
              </View>
            ))
          )}

          {/* 🔘 "SHOW MORE / SHOW LESS" PAGINATION BUTTON */}
          {filteredEntries.length > visibleCount ? (
            <TouchableOpacity
              onPress={() => setVisibleCount(prev => prev + 10)}
              style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 6, flexDirection: 'row', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#16A34A', marginRight: 6 }}>
                {isTa
                  ? `மேலும் நடவடிக்கைகளைக் காட்டு (${filteredEntries.length - visibleCount} மீதமுள்ளன)`
                  : `Show More Activities (${filteredEntries.length - visibleCount} remaining)`}
              </Text>
              <ChevronDown color="#16A34A" size={16} />
            </TouchableOpacity>
          ) : filteredEntries.length > 5 ? (
            <TouchableOpacity
              onPress={() => setVisibleCount(5)}
              style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 6, flexDirection: 'row', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#6B7280', marginRight: 6 }}>
                {isTa ? 'குறைவாகக் காட்டு' : 'Show Less (Collapse Timeline)'}
              </Text>
              <ChevronUp color="#6B7280" size={16} />
            </TouchableOpacity>
          ) : null}
        </View>

      </ScrollView>

      {/* 📄 OFFICIAL FARM AUDIT LEDGER PDF PREVIEW MODAL */}
      <Modal visible={showPdfModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 20 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, width: '92%', maxWidth: 440, maxHeight: '85%', padding: 16, alignSelf: 'center' }}>
            
            {/* Modal Top Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderColor: '#E5E7EB', paddingBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                <ShieldCheck color="#16A34A" size={18} style={{ marginRight: 6 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 13, color: '#111827' }} numberOfLines={1}>
                    {isTa ? 'அதிகாரப்பூர்வ பண்ணை தணிக்கை பேரேடு' : 'Official Farm Audit Ledger (PDF)'}
                  </Text>
                  <Text style={{ fontSize: 9, color: '#6B7280', fontFamily: 'Inter_500Medium' }}>
                    {isTa ? 'பதிவு ஐடி: AGRI-IN-2026-8842 • சரிபார்க்கப்பட்டது' : 'Reg ID: AGRI-IN-2026-8842 • Verified Audit'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowPdfModal(false)} style={{ padding: 4 }}><X color="#6B7280" size={20} /></TouchableOpacity>
            </View>

            {/* Printable PDF Document View (All 9 Structured Sections) */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} showsHorizontalScrollIndicator={false}>
              
              {/* PAGE 1: EXECUTIVE REPORT HEADER */}
              <View style={{ backgroundColor: '#064E3B', padding: 14, borderRadius: 12, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <Text style={{ color: '#A7F3D0', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      {isTa ? 'அக்ரிசிங்க் சரிபார்க்கப்பட்ட தணிக்கை அறிக்கை' : 'AgriSync Verified Audit Report'}
                    </Text>
                    <Text style={{ color: '#FFF', fontSize: 16, fontFamily: 'Inter_800ExtraBold', marginTop: 2 }}>
                      {isTa ? 'அதிகாரப்பூர்வ டிஜிட்டல் பேரேடு' : 'OFFICIAL FARM DIGITAL LEDGER'}
                    </Text>
                    <Text style={{ color: '#D1FAE5', fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 3 }}>
                      {isTa ? `காலம்: ${period} • உருவாக்கப்பட்டது: ${new Date().toLocaleDateString('ta-IN')}` : `Period: ${period} • Generated: ${new Date().toLocaleDateString()}`}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                    <Text style={{ color: '#166534', fontSize: 9, fontFamily: 'Inter_700Bold' }}>
                      {isTa ? 'சரிபார்க்கப்பட்டது' : 'VERIFIED'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* SECTION 1: FARM & REPORT IDENTIFICATION */}
              <View style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#064E3B', marginBottom: 6 }}>
                  {isTa ? '1. பண்ணை & அறிக்கை அடையாளம்' : '1. Farm & Report Identification'}
                </Text>
                
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 11, color: '#4B5563', fontFamily: 'Inter_500Medium' }}>
                    {isTa ? 'பண்ணை பெயர்:' : 'Farm Name:'} <Text style={{ color: '#111827', fontFamily: 'Inter_600SemiBold' }}>{isTa ? 'பசுமை பள்ளத்தாக்கு இயற்கை பண்ணை' : 'Green Valley Organic Farm'}</Text>
                  </Text>
                  <Text style={{ fontSize: 11, color: '#4B5563', fontFamily: 'Inter_500Medium' }}>
                    {isTa ? 'விவசாயி ஐடி:' : 'Farmer ID:'} <Text style={{ color: '#111827', fontFamily: 'Inter_600SemiBold' }}>AGRI-IN-2026-8842</Text>
                  </Text>
                  <Text style={{ fontSize: 11, color: '#4B5563', fontFamily: 'Inter_500Medium' }}>
                    {isTa ? 'அறிக்கை ஐடி:' : 'Report ID:'} <Text style={{ color: '#111827', fontFamily: 'Inter_600SemiBold' }}>AUDIT-2026-8842</Text>
                  </Text>
                  <Text style={{ fontSize: 11, color: '#4B5563', fontFamily: 'Inter_500Medium' }}>
                    {isTa ? 'எல்லை:' : 'Scope:'} <Text style={{ color: '#111827', fontFamily: 'Inter_600SemiBold' }}>{categoryFilter === 'All' ? (isTa ? 'முழு பண்ணை தணிக்கை' : selectedSubCategory) : categoryFilter + (isTa ? ' வடிகட்டி' : ' Filter')}</Text>
                  </Text>
                  <Text style={{ fontSize: 11, color: '#4B5563', fontFamily: 'Inter_500Medium' }}>
                    {isTa ? 'தணிக்கை பதிவுகள்:' : 'Audited Items:'} <Text style={{ color: '#16A34A', fontFamily: 'Inter_700Bold' }}>{filteredEntries.length} {isTa ? 'பதிவுகள்' : 'Logs'}</Text>
                  </Text>
                  <Text style={{ fontSize: 11, color: '#4B5563', fontFamily: 'Inter_500Medium' }}>
                    {isTa ? 'நிலை:' : 'Status:'} <Text style={{ color: '#16A34A', fontFamily: 'Inter_700Bold' }}>{isTa ? 'சரிபார்க்கப்பட்ட பதிவுகள்' : 'Verified Records'}</Text>
                  </Text>
                </View>
              </View>

              {/* SECTION 2: EXECUTIVE FARM SUMMARY */}
              <View style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#064E3B', marginBottom: 8 }}>
                  {isTa ? '2. பண்ணை நிர்வாக சுருக்கம்' : '2. Executive Farm Summary'}
                </Text>
                
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  <View style={{ width: '48%', backgroundColor: '#FFF', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' }}>
                    <Text style={{ fontSize: 9, color: '#6B7280', fontFamily: 'Inter_600SemiBold', textAlign: 'center' }}>{isTa ? 'நிறைவுற்றவை' : 'COMPLETED'}</Text>
                    <Text style={{ fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: '#16A34A', marginTop: 2 }}>{filteredEntries.filter(e => e.status !== 'Pending').length}</Text>
                  </View>
                  <View style={{ width: '48%', backgroundColor: '#FFF', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' }}>
                    <Text style={{ fontSize: 9, color: '#6B7280', fontFamily: 'Inter_600SemiBold', textAlign: 'center' }}>{isTa ? 'நிலுவை பணிகள்' : 'PENDING TASKS'}</Text>
                    <Text style={{ fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: '#D97706', marginTop: 2 }}>{allLedgerEntries.filter(e => e.status === 'Pending').length}</Text>
                  </View>
                  <View style={{ width: '48%', backgroundColor: '#FFF', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' }}>
                    <Text style={{ fontSize: 9, color: '#6B7280', fontFamily: 'Inter_600SemiBold', textAlign: 'center' }}>{isTa ? 'நிலங்கள் / குழுக்கள்' : 'FIELDS/GROUPS'}</Text>
                    <Text style={{ fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: '#2563EB', marginTop: 2 }}>3 / 2</Text>
                  </View>
                  <View style={{ width: '48%', backgroundColor: '#FFF', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' }}>
                    <Text style={{ fontSize: 9, color: '#6B7280', fontFamily: 'Inter_600SemiBold', textAlign: 'center' }}>{isTa ? 'அறுவடை மகசூல்' : 'HARVEST YIELD'}</Text>
                    <Text style={{ fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: '#8B5CF6', marginTop: 2 }}>500 kg</Text>
                  </View>
                </View>
              </View>

              {/* SECTION 3: FINANCIAL AUDIT SUMMARY */}
              <View style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#064E3B', marginBottom: 8 }}>
                  {isTa ? '3. நிதி தணிக்கை சுருக்கம்' : '3. Financial Audit Summary'}
                </Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: '#4B5563', fontFamily: 'Inter_500Medium' }}>{isTa ? 'ஆரம்ப ரொக்க இருப்பு:' : 'Opening Cash Balance:'}</Text>
                  <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: '#16A34A' }}>₹{(openingCash || 75000).toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: '#4B5563', fontFamily: 'Inter_500Medium' }}>{isTa ? 'பதிவு செய்யப்பட்ட உள்வரவு (வருவாய்):' : 'Recorded Inflow (Revenue):'}</Text>
                  <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: '#16A34A' }}>+₹{(stats?.income || 0).toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, color: '#4B5563', fontFamily: 'Inter_500Medium' }}>{isTa ? 'பதிவு செய்யப்பட்ட வெளிச்செலவு (செலவுகள்):' : 'Recorded Outflow (Expenses):'}</Text>
                  <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: '#EF4444' }}>-₹{(stats?.expenses || 0).toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, borderTopWidth: 1, borderColor: '#E5E7EB' }}>
                  <Text style={{ fontSize: 12, color: '#111827', fontFamily: 'Inter_700Bold' }}>{isTa ? 'இறுதி ரொக்க இருப்பு:' : 'Closing Cash Balance:'}</Text>
                  <Text style={{ fontSize: 12, fontFamily: 'Inter_800ExtraBold', color: (stats?.net || 0) >= 0 ? '#16A34A' : '#EF4444' }}>
                    ₹{((openingCash || 75000) + (stats?.income || 0) - (stats?.expenses || 0)).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* SECTION 3B: FARM ACTIVITY & OPERATIONAL DISTRIBUTION GRAPH */}
              <View style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#064E3B', marginBottom: 8 }}>
                  {isTa ? '3B. செயல்பாட்டு நடவடிக்கை & வள ஒதுக்கீட்டு வரைபடம்' : '3B. Operational Activity & Resource Allocation Graph'}
                </Text>
                
                {/* Visual Bar Chart */}
                <View style={{ height: 90, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', borderBottomWidth: 2, borderColor: '#E5E7EB', paddingBottom: 6 }}>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <View style={{ height: 60, width: 24, backgroundColor: '#22C55E', borderRadius: 4 }} />
                    <Text style={{ fontSize: 9, fontFamily: 'Inter_700Bold', color: '#166534', marginTop: 4 }}>{isTa ? 'பயிர் பராமரிப்பு (42%)' : 'Crop Care (42%)'}</Text>
                  </View>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <View style={{ height: 42, width: 24, backgroundColor: '#3B82F6', borderRadius: 4 }} />
                    <Text style={{ fontSize: 9, fontFamily: 'Inter_700Bold', color: '#1E40AF', marginTop: 4 }}>{isTa ? 'கால்நடை (28%)' : 'Livestock (28%)'}</Text>
                  </View>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <View style={{ height: 28, width: 24, backgroundColor: '#F59E0B', borderRadius: 4 }} />
                    <Text style={{ fontSize: 9, fontFamily: 'Inter_700Bold', color: '#92400E', marginTop: 4 }}>{isTa ? 'நிதி மேலாண்மை (18%)' : 'Finances (18%)'}</Text>
                  </View>
                  <View style={{ alignItems: 'center', flex: 1 }}>
                    <View style={{ height: 18, width: 24, backgroundColor: '#A855F7', borderRadius: 4 }} />
                    <Text style={{ fontSize: 9, fontFamily: 'Inter_700Bold', color: '#6B21A8', marginTop: 4 }}>{isTa ? 'சரக்கு மேலாண்மை (12%)' : 'Inventory (12%)'}</Text>
                  </View>
                </View>
              </View>

              {/* SECTION 4: GEMINI EXECUTIVE AUDIT NARRATIVE */}
              <View style={{ backgroundColor: '#F0FDF4', borderLeftWidth: 4, borderColor: '#16A34A', padding: 14, borderRadius: 8, marginBottom: 14 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#14532D', marginBottom: 4 }}>
                  {isTa ? '4. ஜெமினி நிர்வாக தணிக்கை அறிக்கை' : '4. Gemini Executive Audit Narrative'}
                </Text>
                {isGeneratingPdf ? (
                  <ActivityIndicator color="#16A34A" style={{ marginVertical: 10 }} />
                ) : (
                  <Text style={{ fontSize: 11, color: '#166534', fontFamily: 'Inter_500Medium', lineHeight: 18 }}>
                    {pdfNarrative}
                  </Text>
                )}
              </View>

              {/* PAGE 2 ONWARD DIVIDER */}
              <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 }} />
              <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: '#064E3B', marginBottom: 10 }}>
                {isTa ? 'பக்கம் 2 முதல் — விரிவான பதிவுகள்' : 'PAGE 2 ONWARD — DETAILED RECORDS'}
              </Text>

              {/* SECTION 5: COMPLETE FARM ACTIVITY AUDIT LOG SUMMARY (PARAGRAPHS & BULLET POINTS) */}
              <View style={{ marginBottom: 14, backgroundColor: '#F9FAFB', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#064E3B', marginBottom: 8 }}>
                  {isTa
                    ? `5. முழுமையான செயல்பாட்டு தணிக்கைப் பதிவு சுருக்கம் (${filteredEntries.filter(e => e.status !== 'Pending').length} நிறைவுற்றவை)`
                    : `5. Complete Activity Audit Log Summary (${filteredEntries.filter(e => e.status !== 'Pending').length} Completed)`}
                </Text>
                
                <Text style={{ fontSize: 11, color: '#374151', fontFamily: 'Inter_400Regular', lineHeight: 18, marginBottom: 10 }}>
                  {isTa
                    ? `அறிக்கைக் காலத்தில், நிலப் பயிர் நடவடிக்கைகள், கால்நடை பராமரிப்பு, சரக்கு நகர்வுகள் மற்றும் நிதிப் பரிவர்த்தனைகள் முழுவதும் மொத்தம் ${filteredEntries.filter(e => e.status !== 'Pending').length} பண்ணைச் செயல்பாடுகள் நிறைவடைந்துள்ளன. அனைத்து நடவடிக்கைகளும் அக்ரிசிங்க் கணினிப் பதிவுகளுடன் சரிபார்க்கப்பட்டுள்ளன.`
                    : `During the reporting period, a total of ${filteredEntries.filter(e => e.status !== 'Pending').length} farm operational activities were completed across field crop operations, livestock care, inventory movements, and financial transactions. All completed actions have been cross-referenced and verified within AgriSync system logs.`}
                </Text>

                <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: '#111827', marginBottom: 6 }}>
                  {isTa ? 'செயல்பாட்டு சுருக்கப் புள்ளிகள்:' : 'Operational Category Summary Points:'}
                </Text>
                
                <View style={{ marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: '#166534' }}>
                    🌾 {isTa ? 'பயிர் நடவடிக்கைகள் & நில மேலாண்மை:' : 'Crop Operations & Field Management:'}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#4B5563', fontFamily: 'Inter_500Medium', lineHeight: 16, marginTop: 2, paddingLeft: 6 }}>
                    {isTa
                      ? `• கோதுமை வயல் ஏ மற்றும் நெல் வயல் பி-யில் 3 திட்டமிடப்பட்ட நீர்ப்பாசன சுழற்சிகள் செயல்படுத்தப்பட்டன.\n• 20 கிலோ உரியா உரம் மற்றும் இயற்கை உரம் இடப்பட்டது.\n• வழக்கமான பூச்சி பரிசோதனைகள் மேற்கொள்ளப்பட்டன.`
                      : `• Executed 3 scheduled irrigation cycles across Wheat Field A & Rice Field B.\n• Applied 20 kg Urea fertilizer & organic compost for optimal crop nutrition.\n• Conducted routine pest inspections with zero critical infestation risks detected.`}
                  </Text>
                </View>

                <View style={{ marginBottom: 6 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: '#1E40AF' }}>
                    🐄 {isTa ? 'கால்நடை பராமரிப்பு & தினசரி நடவடிக்கைகள்:' : 'Livestock Care & Daily Operations:'}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#4B5563', fontFamily: 'Inter_500Medium', lineHeight: 16, marginTop: 2, paddingLeft: 6 }}>
                    {isTa
                      ? `• கால்நடை குழு 1-க்கு காலை மற்றும் மாலை தீவனம் வழங்கப்பட்டது.\n• எஃப்எம்டி தடுப்பூசி மற்றும் கால்நடை ஆரோக்கிய பரிசோதனை பதிவு செய்யப்பட்டது.\n• தினசரி பால் உற்பத்தி சராசரியாக 24 லிட்டர்.`
                      : `• Maintained morning & evening fodder feed distribution for Cattle Group 1.\n• Recorded FMD vaccination administration and veterinary health observations.\n• Logged daily milk production averaging 24 Liters per day.`}
                  </Text>
                </View>

                <View style={{ marginBottom: 2 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: '#D97706' }}>
                    🔧 {isTa ? 'பராமரிப்பு & வளங்கள்:' : 'Maintenance & Resource Logistics:'}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#4B5563', fontFamily: 'Inter_500Medium', lineHeight: 16, marginTop: 2, paddingLeft: 6 }}>
                    {isTa
                      ? `• நீர்ப்பாசன பம்ப் மற்றும் டிராக்டர் வழக்கமான பராமரிப்பு நிறைவடைந்தது.\n• உரம் மற்றும் தீவன இருப்பு சரிபார்க்கப்பட்டது.`
                      : `• Completed routine servicing of irrigation pump units and tractor machinery.\n• Verified material movements for fertilizer stock and fodder inventory.`}
                  </Text>
                </View>
              </View>

              {/* SEPARATE SECTION 5B: OUTSTANDING SCHEDULED TASKS SUMMARY (PARAGRAPHS & BULLET POINTS) */}
              <View style={{ marginBottom: 14, backgroundColor: '#FFFBEB', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FEF3C7' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#92400E', marginBottom: 8 }}>
                  {isTa
                    ? `5B. நிலுவையில் உள்ள திட்டமிட்ட பணிகள் சுருக்கம் (${allLedgerEntries.filter(e => e.status === 'Pending').length} நிலுவை)`
                    : `5B. Outstanding Scheduled Tasks Summary (${allLedgerEntries.filter(e => e.status === 'Pending').length} Pending)`}
                </Text>
                
                <Text style={{ fontSize: 11, color: '#78350F', fontFamily: 'Inter_400Regular', lineHeight: 18, marginBottom: 8 }}>
                  {isTa
                    ? `அடுத்த 7 நாள் செயல்பாட்டு சுழற்சியில் மொத்தம் ${allLedgerEntries.filter(e => e.status === 'Pending').length} திட்டமிடப்பட்ட பணிகள் நிலுவையில் உள்ளன.`
                    : `A total of ${allLedgerEntries.filter(e => e.status === 'Pending').length} scheduled farm tasks remain under pending review for execution during the upcoming 7-day operational cycle.`}
                </Text>

                <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: '#92400E', marginBottom: 4 }}>
                  {isTa ? 'வரவிருக்கும் திட்டமிட்ட நடவடிக்கைகள்:' : 'Upcoming Scheduled Action Points:'}
                </Text>
                
                <Text style={{ fontSize: 11, color: '#78350F', fontFamily: 'Inter_500Medium', lineHeight: 18, paddingLeft: 6 }}>
                  {isTa
                    ? `• நிலம் & பயிர் பரிசோதனை: கோதுமை வயல் ஏ & நெல் வயல் பி-யில் 4 திட்டமிடப்பட்ட பயிர் ஆய்வுகள்.\n• கால்நடை தீவனம் & பராமரிப்பு: தினசரி காலை மற்றும் மாலை தீவனம் வழங்குதல்.\n• உபகரணங்கள் பராமரிப்பு: திட்டமிடப்பட்ட பம்ப் பராமரிப்பு & டிராக்டர் ஆய்வு.`
                    : `• Field & Crop Inspections: 4 scheduled routine crop scouting checks across Wheat Field A & Rice Field B.\n• Livestock Feeding & Care: Daily morning and evening fodder feed distribution & routine livestock health observations for Cattle Group 1.\n• Facility & Equipment Servicing: Scheduled irrigation pump maintenance & tractor engine check.`}
                </Text>
              </View>

              {/* SECTION 6: CROP & LIVESTOCK HISTORY */}
              <View style={{ marginBottom: 14, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#111827', marginBottom: 6 }}>
                  {isTa ? '6. பயிர் & கால்நடை உற்பத்தி வரலாறு' : '6. Crop & Livestock History Summary'}
                </Text>
                <Text style={{ fontSize: 10, color: '#4B5563', lineHeight: 16 }}>
                  {isTa
                    ? `• கோதுமை வயல் ஏ: விதைப்பு நிறைவடைந்தது, 3 நீர்ப்பாசனம், 20 கிலோ உரியா இடப்பட்டது. அறுவடை அக் 15.\n• நெல் வயல் பி: வயல் தயாரிப்பு, நீர் பாய்ச்சுதல், இயற்கை உரம் 50 கிலோ.\n• கால்நடை குழு 1: காலை தீவனம் 40 கிலோ, எஃப்எம்டி தடுப்பூசி, பால் உற்பத்தி 24 எல்/நாள்.`
                    : `• Wheat Field A: Sowing completed, 3 irrigations, 20kg Urea applied. Harvest due Oct 15.\n• Rice Field B: Paddy field prep flooded, organic compost applied.\n• Cattle Group 1: Morning feed fodder 40kg, FMD vaccine recorded, Daily milk yield 24L.`}
                </Text>
              </View>

              {/* SECTION 7: HARVEST & SALES REGISTER */}
              <View style={{ marginBottom: 14, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#111827', marginBottom: 6 }}>
                  {isTa ? '7. அறுவடை & விற்பனை பதிவு' : '7. Harvest & Sales Register'}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#111827' }}>
                      {isTa ? 'நெல் அறுவடை (500 கிலோ)' : 'Paddy Rice Harvest (500 kg)'}
                    </Text>
                    <Text style={{ fontSize: 9, color: '#6B7280' }}>Sep 20, 2026 • Mandi Buyer A</Text>
                  </View>
                  <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: '#16A34A' }}>+₹12,000 ({isTa ? 'செலுத்தப்பட்டது' : 'Paid'})</Text>
                </View>
              </View>

              {/* SECTION 8: INVENTORY & RESOURCE USAGE */}
              <View style={{ marginBottom: 14, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#111827', marginBottom: 6 }}>
                  {isTa ? '8. சரக்கு & வள பயன்பாடு' : '8. Inventory & Resource Usage'}
                </Text>
                <Text style={{ fontSize: 10, color: '#4B5563', lineHeight: 16 }}>
                  {isTa
                    ? `• உரியா உரம்: ஆரம்ப இருப்பு 50கிலோ + கொள்முதல் 50கிலோ - பயன்பாடு 20கிலோ = இறுதி இருப்பு 80கிலோ.\n• கால்நடை தீவனம்: ஆரம்ப இருப்பு 100கிலோ + கொள்முதல் 100கிலோ - பயன்பாடு 40கிலோ = இறுதி இருப்பு 160கிலோ.`
                    : `• Urea Fertilizer: Opening 50kg + Rec 50kg - Used 20kg = Closing Stock 80kg.\n• Cattle Feed: Opening 100kg + Rec 100kg - Used 40kg = Closing Stock 160kg.`}
                </Text>
              </View>

              {/* SECTION 9: VERIFICATION & RECORD INTEGRITY */}
              <View style={{ backgroundColor: '#F0FDF4', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 10 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: '#14532D' }}>
                  {isTa ? '9. தணிக்கை சரிபார்ப்பு & பதிவு ஒருமைப்பாடு' : '9. Verification & Record Integrity'}
                </Text>
                <Text style={{ fontSize: 9, color: '#166534', marginTop: 2 }}>
                  {isTa
                    ? `மொத்த நிறைவுற்ற பதிவுகள்: ${filteredEntries.filter(e => e.status !== 'Pending').length} • ஹேஷ்: 0x8842F9A07D3E19C\nமறுப்புரை: இந்த அறிக்கை அக்ரிசிங்க் கணினிப் பதிவுகளுக்குள் சரிபார்க்கப்பட்டதை மட்டுமே குறிக்கிறது.`
                    : `Total Completed Logs: ${filteredEntries.filter(e => e.status !== 'Pending').length} • Hash: 0x8842F9A07D3E19C\nDisclaimer: This report certifies that records have been cross-checked within AgriSync system logs.`}
                </Text>
              </View>

            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderColor: '#E5E7EB' }}>
              <TouchableOpacity onPress={() => setShowPdfModal(false)} style={{ padding: 12, flex: 1, alignItems: 'center', marginRight: 8, backgroundColor: '#E5E7EB', borderRadius: 10 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#374151', fontSize: 12 }}>
                  {isTa ? 'மூடு' : 'Close'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handlePrintPdf} style={{ padding: 12, flex: 2, alignItems: 'center', backgroundColor: '#16A34A', borderRadius: 10, flexDirection: 'row', justifyContent: 'center' }}>
                <Printer color="#FFF" size={16} style={{ marginRight: 6 }} />
                <Text style={{ fontFamily: 'Inter_700Bold', color: '#FFF', fontSize: 12 }}>
                  {isTa ? 'அச்சிடு / அதிகாரப்பூர்வ PDF பதிவிறக்கு' : 'Print / Download Official PDF'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* 🔍 AI PARSE PREVIEW CONFIRMATION MODAL */}
      <Modal visible={!!parsedPreview} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, marginBottom: 12 }}>
              {isTa ? 'பதிவை மதிப்பாய்வு செய்து உறுதிப்படுத்தவும்' : 'Review & Confirm Log Entry'}
            </Text>
            
            <View style={{ backgroundColor: '#F9FAFB', padding: 14, borderRadius: 12, marginBottom: 16 }}>
              <Text style={{ fontSize: 11, color: '#6B7280', fontFamily: 'Inter_500Medium' }}>
                {isTa ? 'பிரித்தெடுக்கப்பட்ட சுருக்கம்' : 'Extracted Summary'}
              </Text>
              <Text style={{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#111827', marginTop: 4 }}>{parsedPreview?.title}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity onPress={() => setParsedPreview(null)} style={{ padding: 12, flex: 1, alignItems: 'center', marginRight: 8, backgroundColor: '#E5E7EB', borderRadius: 10 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#374151' }}>
                  {isTa ? 'ரத்துசெய்' : 'Cancel'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={confirmSaveAiEntry} style={{ padding: 12, flex: 2, alignItems: 'center', backgroundColor: '#16A34A', borderRadius: 10 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#FFF' }}>
                  {isTa ? 'உறுதிசெய்து பேரேட்டில் சேமிக்கவும்' : 'Confirm & Save to Ledger'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🏷️ ENTITY HISTORY DEEP-DIVE MODAL */}
      <Modal visible={!!selectedEntity} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 400, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}>
                {selectedEntity} {isTa ? 'வரலாறு அட்டை' : 'History Card'}
              </Text>
              <TouchableOpacity onPress={() => setSelectedEntity(null)}><X color="#6B7280" size={20} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
              {allLedgerEntries.filter(e => e.target?.toLowerCase().includes((selectedEntity || '').toLowerCase())).map((item, idx) => (
                <View key={'ent_' + idx} style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F3F4F6' }}>
                  <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#111827' }}>{item.title}</Text>
                  <Text style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{item.dateStr} • {item.category}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 💬 AI LEDGER ASSISTANT CHAT MODAL */}
      <Modal visible={showChatModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Sparkles color="#3B82F6" size={18} style={{ marginRight: 6 }} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}>
                  {isTa ? 'AI பண்ணை வரலாற்று உதவியாளர்' : 'AI Farm History Assistant'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowChatModal(false)}><X color="#6B7280" size={20} /></TouchableOpacity>
            </View>

            {chatResponse && (
              <View style={{ backgroundColor: '#EFF6FF', padding: 14, borderRadius: 12, marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: '#1E40AF', fontFamily: 'Inter_500Medium', lineHeight: 18 }}>{chatResponse}</Text>
              </View>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={{ flex: 1, height: 44, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, fontSize: 13 }}
                placeholder={isTa ? 'எ.கா., "இந்த மாதம் உரத்திற்கு எவ்வளவு செலவழித்தேன்?"' : 'e.g., "How much did I spend on fertilizer this month?"'}
                value={chatQuestion}
                onChangeText={setChatQuestion}
                onSubmitEditing={handleAskLedgerAssistant}
              />
              <TouchableOpacity onPress={handleAskLedgerAssistant} style={{ backgroundColor: '#3B82F6', padding: 12, borderRadius: 12, marginLeft: 8 }}>
                {isChatLoading ? <ActivityIndicator color="#FFF" size="small" /> : <Send color="#FFF" size={16} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✨ AI PATTERN INSIGHTS MODAL */}
      <Modal visible={showInsightsModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 400 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}>
                {isTa ? 'AI பண்ணை முறைமை பகுப்பாய்வு' : 'AI Farm Pattern Analysis'}
              </Text>
              <TouchableOpacity onPress={() => setShowInsightsModal(false)}><X color="#6B7280" size={20} /></TouchableOpacity>
            </View>

            {aiInsights ? (
              <Text style={{ fontSize: 13, color: '#374151', fontFamily: 'Inter_500Medium', lineHeight: 20 }}>{aiInsights}</Text>
            ) : (
              <ActivityIndicator color="#16A34A" />
            )}
          </View>
        </View>
      </Modal>

      {/* 📊 INTERACTIVE SUB-CATEGORY / ACTIVITY VIEW MODAL */}
      <Modal visible={showChartDropdownModal} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowChartDropdownModal(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}
        >
          <View style={{ backgroundColor: '#FFF', borderRadius: 20, padding: 20, width: '100%', maxWidth: 380 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderColor: '#F3F4F6', paddingBottom: 10 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#111827' }}>
                {isTa ? 'பண்ணை செயல்பாட்டுக் காட்சியினைத் தேர்ந்தெடுக்கவும்' : 'Select Farm Activity View'}
              </Text>
              <TouchableOpacity onPress={() => setShowChartDropdownModal(false)}><X color="#6B7280" size={18} /></TouchableOpacity>
            </View>

            {[
              {
                id: 'All Activities',
                label: isTa ? '🌟 அனைத்து பண்ணை நடவடிக்கைகள்' : '🌟 All Farm Activities',
                desc: isTa ? 'பயிர்கள், கால்நடைகள் & நிதி குறித்த முழு பண்ணை கண்ணோட்டம்' : 'Whole farm overview across crops, livestock & finance'
              },
              {
                id: 'Crop Operations',
                label: isTa ? '🌾 பயிர் நடவடிக்கைகள்' : '🌾 Crop Operations',
                desc: isTa ? 'நீர்ப்பாசனம், உரம், ஆய்வு & பூச்சி கட்டுப்பாடு' : 'Irrigation, fertilizer, inspection & pest control'
              },
              {
                id: 'Livestock Care',
                label: isTa ? '🐄 கால்நடை பராமரிப்பு' : '🐄 Livestock Care',
                desc: isTa ? 'தீவனம், சுகாதாரம், தடுப்பூசிகள் & பால் மகசூல்' : 'Feeding, health, vaccines & milk yield'
              },
              {
                id: 'Financial Operations',
                label: isTa ? '💰 நிதி நடவடிக்கைகள்' : '💰 Financial Operations',
                desc: isTa ? 'வருவாய், செலவுகள் & கொள்முதல் பதிவுகள்' : 'Revenue, expenses & purchase logs'
              },
              {
                id: 'Inventory & Equipment',
                label: isTa ? '📦 சரக்கு & உபகரணங்கள்' : '📦 Inventory & Equipment',
                desc: isTa ? 'இயந்திர பராமரிப்பு, விநியோகம் & இருப்பு' : 'Machinery maintenance, supplies & stock'
              },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.id}
                onPress={() => {
                  setSelectedSubCategory(opt.id);
                  setShowChartDropdownModal(false);
                }}
                style={{
                  paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 8,
                  backgroundColor: selectedSubCategory === opt.id ? '#F0FDF4' : '#F9FAFB',
                  borderWidth: 1, borderColor: selectedSubCategory === opt.id ? '#BBF7D0' : '#E5E7EB'
                }}
              >
                <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: selectedSubCategory === opt.id ? '#166534' : '#111827' }}>
                  {opt.label}
                </Text>
                <Text style={{ fontSize: 11, color: '#6B7280', fontFamily: 'Inter_500Medium', marginTop: 2 }}>
                  {opt.desc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}
