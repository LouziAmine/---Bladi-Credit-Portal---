type ScipStatus = 'CLEAR' | 'INCIDENT_DETECTED';
type CentraleRisquesStatus = 'CLEAR' | 'EXPOSURE_DETECTED';
export type SimulatedRecommendation = 'FAVORABLE' | 'TO_REVIEW' | 'UNFAVORABLE';
type RepaymentStatus = 'CURRENT' | 'OVERDUE' | 'IN_LITIGATION';

export const BAM_SCENARIO_OPTIONS = [
  'CLEAR',
  'MINOR_INCIDENT',
  'ACTIVE_INCIDENT',
  'PERSONAL_EXPOSURE_DETECTED',
  'MULTIPLE_EXPOSURES',
  'CONSOLIDATED_GROUP_EXPOSURE',
  'REQUIRES_MANUAL_REVIEW',
] as const;
export type BamScenario = (typeof BAM_SCENARIO_OPTIONS)[number];

export interface BamVerificationRequest {
  enterpriseType: string;
  identifier: string;
  companyName: string;
}

interface ChequeIncidentResponse {
  type: string;
  date: string;
  amount: number;
  resolved: boolean;
}

interface OutstandingLoanResponse {
  institution: string;
  creditType: string;
  amount: number;
  repaymentStatus: RepaymentStatus;
}

export interface ScipResultResponse {
  status: ScipStatus;
  incidents: ChequeIncidentResponse[];
}

export interface CentraleRisquesResultResponse {
  status: CentraleRisquesStatus;
  outstandingLoans: OutstandingLoanResponse[];
}

export interface BamVerificationResponse {
  source: string;
  disclaimer: string;
  verifiedIdentifier: string;
  identifierType: string;
  scipResult: ScipResultResponse;
  centraleRisquesResult: CentraleRisquesResultResponse;
  simulatedRecommendation: SimulatedRecommendation;
  timestamp: string;
}
