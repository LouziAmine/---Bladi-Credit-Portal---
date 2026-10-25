import { EnterpriseType } from './investment-credit.model';
import { AmortizationRow, CspCode, ProductType } from './mortgage-credit.model';

export const DECISION_OUTCOME_OPTIONS = ['APPROVED', 'DEFERRED', 'REJECTED'] as const;
export type DecisionOutcome = (typeof DECISION_OUTCOME_OPTIONS)[number];

export const COMMITTEE_TYPE_OPTIONS = ['ROTATING', 'STANDING_SESSION'] as const;
export type CommitteeType = (typeof COMMITTEE_TYPE_OPTIONS)[number];

export const INSURANCE_COVERAGE_TYPE_OPTIONS = ['BANK_GROUP_POLICY', 'EXTERNAL_DELEGATION'] as const;
export type InsuranceCoverageType = (typeof INSURANCE_COVERAGE_TYPE_OPTIONS)[number];

export const KEEP_OR_MANUAL_OPTIONS = ['KEEP', 'MANUAL'] as const;
export type KeepOrManualOption = (typeof KEEP_OR_MANUAL_OPTIONS)[number];
export type RateOption = KeepOrManualOption;
export const RATE_OPTION_CHOICES = KEEP_OR_MANUAL_OPTIONS;
export const AMOUNT_OPTION_CHOICES = KEEP_OR_MANUAL_OPTIONS;
export const DURATION_OPTION_CHOICES = KEEP_OR_MANUAL_OPTIONS;

export const CLASSIFICATION_OUTCOME_CHOICES = ['REAL', 'FAKE', 'SIMULATION_ONLY'] as const;
export type ClassificationOutcome = (typeof CLASSIFICATION_OUTCOME_CHOICES)[number];

export type DemandStatus = 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

export interface DemandSearchFilters {
  enterpriseId?: string;
  companyName?: string;
  status?: DemandStatus;
  minAmount?: number;
  maxAmount?: number;
}

export type DemandType = 'ENTERPRISE' | 'MORTGAGE';

export interface EnterpriseDemandDetailResponse {
  enterpriseType: EnterpriseType;
  enterpriseId: string | null;
  sector: string | null;
  companyAgeYears: number | null;
  annualRevenue: number | null;
  netAnnualResult: number | null;
  existingAnnualDebtService: number | null;
  guaranteesValue: number | null;
}

export interface MortgageDemandDetailResponse {
  productType: ProductType;
  cspCode: CspCode | null;
  propertyValue: number | null;
  monthlyIncome: number | null;
}

export interface DemandResponse {
  id: string;
  reference: string;
  demandType: DemandType;
  contactName: string;
  amount: number;
  duration: number;
  createdAt: string;
  completedAt: string | null;
  completed: boolean;
  applicableRate: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  currentProcessName: string | null;
  currentStepName: string | null;
  rejected: boolean;
  rejectedAt: string | null;
  enterprise: EnterpriseDemandDetailResponse | null;
  mortgage: MortgageDemandDetailResponse | null;
}

export interface DemandStepResponse {
  processCode: string;
  processName: string;
  stepCode: string;
  stepName: string;
  typicalRole: string | null;
  requiredGradeCode: string | null;
  requiredGradeName: string | null;
  requiredTeamCode: string | null;
  requiredTeamName: string | null;
  assignedUsername: string | null;
  assignedBy: string | null;
  enteredAt: string;
}

export interface DemandHistoryEntryResponse {
  processCode: string;
  processName: string;
  stepCode: string;
  stepName: string;
  typicalRole: string | null;
  requiredGradeCode: string | null;
  requiredGradeName: string | null;
  requiredTeamCode: string | null;
  requiredTeamName: string | null;
  assignedUsername: string | null;
  assignedBy: string | null;
  enteredAt: string;
  exitedAt: string | null;
  decisionNote: string | null;
  decisionOutcome: DecisionOutcome | null;
  returnReasonCode: string | null;
  recommendations: string | null;
  reserves: string | null;
  committeeType: CommitteeType | null;
  insuranceAdiSubscribed: boolean | null;
  insuranceCoverageType: InsuranceCoverageType | null;
  insuranceDamageSubscribed: boolean | null;
  rateOption: RateOption | null;
  previousRate: number | null;
  appliedRate: number | null;
  rateChangedBy: string | null;
  amountOption: KeepOrManualOption | null;
  previousAmount: number | null;
  appliedAmount: number | null;
  durationOption: KeepOrManualOption | null;
  previousDuration: number | null;
  appliedDuration: number | null;
  classificationOutcome: ClassificationOutcome | null;
}

export type PipelineStepStatus = 'DONE' | 'CURRENT' | 'UPCOMING';

export interface DemandPipelineStepResponse {
  processCode: string;
  processName: string;
  stepCode: string;
  stepName: string;
  typicalRole: string | null;
  requiredGradeCode: string | null;
  requiredGradeName: string | null;
  requiredTeamCode: string | null;
  requiredTeamName: string | null;
  globalOrder: number;
  status: PipelineStepStatus;
  enteredAt: string | null;
  exitedAt: string | null;
}

export interface AdvanceDemandRequest {
  note?: string;
  decisionOutcome?: DecisionOutcome;
  returnReasonCode?: string;
  recommendations?: string;
  reserves?: string;
  committeeType?: CommitteeType;
  insuranceAdiSubscribed?: boolean;
  insuranceCoverageType?: InsuranceCoverageType;
  insuranceDamageSubscribed?: boolean;
  assigneeUsername?: string;
  rateOption: RateOption;
  manualRate?: number;
  amountOption: KeepOrManualOption;
  manualAmount?: number;
  durationOption: KeepOrManualOption;
  manualDuration?: number;
}

export interface ClassifyDemandRequest {
  classificationOutcome: ClassificationOutcome;
  enterpriseId?: string;
  assigneeUsername?: string;
  note?: string;
  clientRib?: string;
}

export interface EnterpriseAmortizationDetailResponse {
  monthlyPayment: number;
  annualDebtService: number;
  totalInterest: number;
  totalCost: number;
}

export interface ConventionalAmortizationDetailResponse {
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
}

export interface MourabahaAmortizationDetailResponse {
  marginHt: number;
  vatOnMargin: number;
  marginTtc: number;
  monthlyPaymentTtc: number;
}

export interface DemandAmortizationResponse {
  demandId: string;
  reference: string;
  amount: number;
  duration: number;
  applicableRate: number;
  processingFees: number;
  taeg: number;
  amortizationSchedule: AmortizationRow[];
  insurancePremium: number;
  allInMonthlyPayment: number;
  totalInsuranceCost: number;
  enterprise: EnterpriseAmortizationDetailResponse | null;
  conventional: ConventionalAmortizationDetailResponse | null;
  mourabaha: MourabahaAmortizationDetailResponse | null;
}

export interface AssignDemandRequest {
  username: string;
}

export type EligibleAssigneeDirection = 'CURRENT' | 'NEXT' | 'PREVIOUS';

export interface DemandCommentResponse {
  id: string;
  stepCode: string;
  stepName: string;
  username: string;
  comment: string;
  createdAt: string;
}

export interface DemandAssignmentHistoryEntryResponse {
  id: string;
  stepCode: string;
  stepName: string;
  previousUsername: string | null;
  newUsername: string;
  assignedBy: string;
  assignedAt: string;
}

export interface AddDemandCommentRequest {
  comment: string;
}
