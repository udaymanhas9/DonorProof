import type { DonorProofState } from '../../../api/src/index.js';
import type { CharityInfo } from '../../../api/src/index.js';

export type MockCharity = CharityInfo & { state: DonorProofState };

export const MOCK_CHARITIES: MockCharity[] = [
  {
    name: 'Hope for Tomorrow',
    category: 'Humanitarian',
    description: 'Emergency food, shelter, and medical care for families displaced by conflict in East Africa. Every pound tracked privately on-chain.',
    contractAddress: 'mock:hope-for-tomorrow',
    state: {
      campaignOwner: 'demo-charity-owner',
      directAidThreshold: 85,
      adminThreshold: 10,
      totalSpend: 45000n,
      directAidSpend: 41000n,
      adminSpend: 2500n,
      expenseSequence: 23,
      isVerified: true,
      directAidPct: 91,
      adminPct: 6,
      potHasCoin: true,
      potValue: 12500n,
    },
  },
  {
    name: 'CleanWater Initiative',
    category: 'Humanitarian',
    description: 'Building clean water infrastructure and sanitation in rural sub-Saharan Africa. Zero overhead hidden from donors.',
    contractAddress: 'mock:cleanwater',
    state: {
      campaignOwner: 'demo-other-1',
      directAidThreshold: 80,
      adminThreshold: 15,
      totalSpend: 128000n,
      directAidSpend: 106000n,
      adminSpend: 14000n,
      expenseSequence: 57,
      isVerified: true,
      directAidPct: 83,
      adminPct: 11,
      potHasCoin: false,
      potValue: 0n,
    },
  },
  {
    name: 'MedReach Africa',
    category: 'Medical',
    description: 'Mobile medical clinics delivering primary healthcare across three countries. Currently accumulating expenses before final proof generation.',
    contractAddress: 'mock:medreach',
    state: {
      campaignOwner: 'demo-other-2',
      directAidThreshold: 85,
      adminThreshold: 10,
      totalSpend: 82000n,
      directAidSpend: 67000n,
      adminSpend: 9800n,
      expenseSequence: 41,
      isVerified: false,
      directAidPct: 82,
      adminPct: 12,
      potHasCoin: true,
      potValue: 8400n,
    },
  },
  {
    name: 'Shelter First UK',
    category: 'Housing',
    description: 'Rapid rehousing for families made homeless by domestic violence. Privacy-preserving beneficiary records.',
    contractAddress: 'mock:shelter-first',
    state: {
      campaignOwner: 'demo-other-3',
      directAidThreshold: 85,
      adminThreshold: 10,
      totalSpend: 31000n,
      directAidSpend: 28000n,
      adminSpend: 2200n,
      expenseSequence: 18,
      isVerified: true,
      directAidPct: 90,
      adminPct: 7,
      potHasCoin: false,
      potValue: 0n,
    },
  },
];

export const DEMO_CHARITY_CONTRACT = 'mock:hope-for-tomorrow';
export const DEMO_OWNER_KEY = 'demo-charity-owner';
