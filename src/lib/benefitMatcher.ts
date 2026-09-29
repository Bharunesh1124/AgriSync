export interface GovernmentScheme {
  id: string;
  name: string;
  category: string;
  description: string;
  potentialBenefit: string;
  eligibilityRules: Record<string, any>;
  requiredDocuments: string[];
  deadline: string;
  officialUrl: string;
  status: 'active' | 'inactive';
}

export interface FarmerBenefitMatch {
  schemeId: string;
  matchStatus: '🟢 Potential Match' | '🟡 Needs Verification' | '🔴 Missing Requirements' | '✓ Application in Progress' | '✓ Completed';
  matchedCriteria: string[];
  missingDocuments: string[];
  applicationStatus: string;
  lastChecked: string;
  notes: string;
}

export interface ProtectionRecord {
  type: string;
  status: 'Active' | 'Inactive' | 'Unknown' | '⚠ Needs Review' | 'Not recorded';
  coverageAmount: number;
  lastReviewed: string;
}

export interface FinancialEvent {
  id: string;
  type: 'payment' | 'income' | 'deadline' | 'loan' | 'insurance';
  title: string;
  amount?: number;
  date: string;
  status: '🔴 Urgent' | '🟠 Upcoming' | '🟢 Expected income' | '🔵 Information';
  source: string;
  priority: number;
  daysRemaining?: number;
}

const SCHEMES: GovernmentScheme[] = [
  {
    id: 'pm-kisan',
    name: 'PM-KISAN Samman Nidhi',
    category: 'Income Support',
    description: 'Minimum income support to all farmer families.',
    potentialBenefit: '₹6,000/year',
    eligibilityRules: { maxLandSize: 5 }, // just mockup
    requiredDocuments: ['Aadhaar', 'Bank details', 'Land record'],
    deadline: '2026-10-15',
    officialUrl: 'https://pmkisan.gov.in/',
    status: 'active'
  },
  {
    id: 'pmfby',
    name: 'PMFBY Crop Insurance',
    category: 'Insurance',
    description: 'Crop insurance for yield losses.',
    potentialBenefit: 'Varies by crop',
    eligibilityRules: { requiredDoc: 'Sowing Certificate' },
    requiredDocuments: ['Aadhaar', 'Bank details', 'Land record', 'Sowing Certificate'],
    deadline: '2026-09-30',
    officialUrl: 'https://pmfby.gov.in/',
    status: 'active'
  },
  {
    id: 'nabard',
    name: 'NABARD Agri-Machinery Subsidy',
    category: 'Capital',
    description: 'Subsidy for purchasing farm equipment.',
    potentialBenefit: 'Up to 40% subsidy',
    eligibilityRules: { equipmentType: 'Tractor' },
    requiredDocuments: ['Aadhaar', 'Quotation', 'Bank details'],
    deadline: '2026-12-31',
    officialUrl: 'https://www.nabard.org/',
    status: 'active'
  }
];

export const matchGovernmentSchemes = (farmerProfile: any): FarmerBenefitMatch[] => {
  const matches: FarmerBenefitMatch[] = [];
  
  for (const scheme of SCHEMES) {
    let matchStatus: FarmerBenefitMatch['matchStatus'] = '🟡 Needs Verification';
    const missingDocs: string[] = [];
    const matchedCriteria: string[] = [];
    
    // Simulate matching logic based on farmerProfile
    if (scheme.id === 'pm-kisan') {
      matchedCriteria.push('Farm information available');
      matchedCriteria.push('Bank information available');
      if (!farmerProfile.hasLandRecord) {
        missingDocs.push('Land record');
        matchStatus = '🔴 Missing Requirements';
      } else {
        matchStatus = '🟢 Potential Match';
      }
    } else if (scheme.id === 'nabard') {
      matchedCriteria.push('Farm size: 2.5 acres');
      matchedCriteria.push('Crop: Wheat');
      matchStatus = '🟢 Potential Match';
    } else if (scheme.id === 'pmfby') {
      matchedCriteria.push('Location: Tamil Nadu');
      missingDocs.push('Sowing Certificate');
      matchStatus = '🔴 Missing Requirements';
    }

    matches.push({
      schemeId: scheme.id,
      matchStatus,
      matchedCriteria,
      missingDocuments: missingDocs,
      applicationStatus: 'Not Started',
      lastChecked: new Date().toISOString(),
      notes: ''
    });
  }
  
  return matches;
};

export const getSchemeDetails = (id: string) => {
  return SCHEMES.find(s => s.id === id);
};

export const getUpcomingDeadlines = (): FinancialEvent[] => {
  return [
    {
      id: 'e1',
      type: 'payment',
      title: 'Fertilizer Payment',
      amount: 18000,
      date: 'SEP 20',
      status: '🔴 Urgent',
      source: 'Ledger',
      priority: 1
    },
    {
      id: 'e2',
      type: 'payment',
      title: 'Labour Payment',
      amount: 12500,
      date: 'SEP 25',
      status: '🟠 Upcoming',
      source: 'Ledger',
      priority: 2
    },
    {
      id: 'e3',
      type: 'loan',
      title: 'Loan EMI',
      amount: 14200,
      date: 'OCT 02',
      status: '🔴 Urgent',
      source: 'Bank',
      priority: 1,
      daysRemaining: 5
    },
    {
      id: 'e4',
      type: 'insurance',
      title: 'Crop Insurance Document deadline',
      date: 'OCT 05',
      status: '🔴 Urgent',
      source: 'PMFBY',
      priority: 1,
      daysRemaining: 12
    },
    {
      id: 'e6',
      type: 'deadline',
      title: 'Subsidy Application NABARD machinery scheme',
      date: 'OCT 10',
      status: '🟠 Upcoming',
      source: 'Govt',
      priority: 2
    },
    {
      id: 'e5',
      type: 'income',
      title: 'Expected Harvest Income',
      amount: 174000,
      date: 'OCT 20',
      status: '🟢 Expected income',
      source: 'Forecast',
      priority: 3
    }
  ];
};

export const calculateProtectionExposure = (simulationResult: any, existingCoverage: number) => {
  const potentialExposure = simulationResult ? Math.abs(simulationResult.baseProfit - simulationResult.profit) : 0;
  const validExposure = potentialExposure > 0 ? potentialExposure : 0;
  const uncoveredExposure = validExposure > existingCoverage ? validExposure - existingCoverage : 0;
  
  return {
    potentialExposure: validExposure,
    existingCoverage,
    uncoveredExposure
  };
};

export const getProtectionRecords = (): ProtectionRecord[] => {
  return [
    { type: 'Crop Insurance', status: '⚠ Needs Review', coverageAmount: 80000, lastReviewed: '2026-08-01' },
    { type: 'Livestock Insurance', status: 'Not recorded', coverageAmount: 0, lastReviewed: '' },
    { type: 'Emergency Reserve', status: 'Active', coverageAmount: 25000, lastReviewed: '2026-09-01' }
  ];
};
