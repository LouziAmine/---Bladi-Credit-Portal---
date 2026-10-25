import { EnterpriseType } from './entities';

export interface ProcessEntity {
  id: number;
  code: string;
  name: string;
}

export interface StepEntity {
  id: number;
  code: string;
  name: string;
  typicalRole: string | null;
  requiredGradeId: number | null;
  requiresClassification: boolean;
  requiresInsuranceConfirmation: boolean;
  requiresFourEyes: boolean;
  notifyContactOnEnterType: string | null;
}

export interface WorkflowEntity {
  id: number;
  code: string;
  name: string;
  active: boolean;
}

export interface WorkflowProcessEntity {
  id: number;
  workflowId: number;
  processId: number;
  sequenceOrder: number;
}

export interface WorkflowProcessStepEntity {
  id: number;
  workflowProcessId: number;
  stepId: number;
  sequenceOrder: number;
  requiredTeamId: number | null;
}

export type DemandTypeInternal = 'ENTERPRISE' | 'MORTGAGE';
export type ProductType = 'CONVENTIONAL' | 'MOURABAHA';

export interface EnterpriseDemandDetail {
  enterpriseType: EnterpriseType;
  annualRevenue: number | null;
  existingAnnualDebtService: number | null;
  netAnnualResult: number | null;
  guaranteesValue: number | null;
  enterpriseId: number | null;
  sector: string | null;
  companyAgeYears: number | null;
}

export interface MortgageDemandDetail {
  productType: ProductType;
  cspCode: string | null;
  nationalityCode: string | null;
  moroccanResident: boolean | null;
  propertyValue: number | null;
  monthlyIncome: number | null;
  age: number | null;
  coBorrower: boolean | null;
  coBorrowerMonthlyIncome: number | null;
}

export interface DemandEntity {
  id: number;
  publicId: string;
  reference: string;
  workflowId: number;
  demandType: DemandTypeInternal;
  contactName: string;
  amount: number;
  duration: number;
  createdAt: string;
  completedAt: string | null;
  applicableRate: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactLanguage: string | null;
  rejectedAt: string | null;
  enterpriseDetail: EnterpriseDemandDetail | null;
  mortgageDetail: MortgageDemandDetail | null;
}

export interface StepInstanceEntity {
  id: number;
  publicId: string;
  demandId: number;
  workflowProcessStepId: number;
  assignedUsername: string | null;
  assignedBy: string | null;
  enteredAt: string;
  exitedAt: string | null;
  decisionNote: string | null;
  decisionOutcome: string | null;
  returnReasonCode: string | null;
  recommendations: string | null;
  reserves: string | null;
  committeeType: string | null;
  rateOption: string | null;
  previousRate: number | null;
  appliedRate: number | null;
  rateChangedBy: string | null;
  closedBy: string | null;
  amountOption: string | null;
  previousAmount: number | null;
  appliedAmount: number | null;
  durationOption: string | null;
  previousDuration: number | null;
  appliedDuration: number | null;
  classificationOutcome: string | null;
  insuranceAdiSubscribed: boolean | null;
  insuranceCoverageType: string | null;
  insuranceDamageSubscribed: boolean | null;
}

export interface DemandCommentEntity {
  id: number;
  publicId: string;
  demandId: number;
  stepCode: string;
  stepName: string;
  username: string;
  comment: string;
  createdAt: string;
}

export interface DemandAssignmentEntity {
  id: number;
  publicId: string;
  demandId: number;
  stepCode: string;
  stepName: string;
  previousUsername: string | null;
  newUsername: string;
  assignedBy: string;
  assignedAt: string;
}

export interface DemandDocumentEntity {
  id: number;
  publicId: string;
  demandId: number;
  stepCode: string;
  stepName: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256: string;
  documentType: string | null;
  status: 'ACTIVE' | 'SUPERSEDED';
  scanStatus: 'PENDING' | 'CLEAN' | 'SKIPPED';
  supersededByDocumentId: number | null;
  uploadedBy: string;
  uploadedAt: string;

  contentBase64: string;
}

export interface DocumentRequestEntity {
  id: number;
  publicId: string;
  demandId: number;
  documentType: string;
  status: 'PENDING' | 'FULFILLED';
  requestedByUsername: string;
  createdAt: string;
  fulfilledDocumentId: number | null;
  fulfilledAt: string | null;
}

export interface AuditLogEntity {
  id: number;
  publicId: string;
  username: string | null;
  action: string;
  ipAddress: string | null;
  details: string | null;
  performedAt: string;
  entityType: 'DEMAND' | 'ENTERPRISE' | 'USER' | null;
  entityId: string | null;
}

export interface NotificationEntity {
  id: number;
  publicId: string;
  username: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export type InstallmentStatus = 'PENDING' | 'DECLARED' | 'PAID' | 'LATE' | 'REPAID_EARLY';

export interface CreditFileEntity {
  id: number;
  publicId: string;
  demandId: number;
  reference: string;
  disbursedAt: string;
  disbursedAmount: number;
  status: 'ACTIVE' | 'CLOSED';
  managedByUsername: string | null;
}

export interface InstallmentEntity {
  id: number;
  publicId: string;
  creditFileId: number;
  sequenceNumber: number;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
  paidAt: string | null;
  declaredAt: string | null;
  declaredBy: string | null;
  declaredSourceRib: string | null;
  latePenalty: number;
}

export interface PaymentEntity {
  id: number;
  installmentId: number;
  amount: number;
  paidAt: string;
}

export interface EarlyRepaymentEntity {
  id: number;
  publicId: string;
  creditFileId: number;
  fullRepayment: boolean;
  outstandingBefore: number;
  repaidPrincipal: number;
  accruedInterest: number;
  indemnity: number;
  totalPaid: number;
  outstandingAfter: number;
  performedBy: string;
  performedAt: string;
}

export interface StepInfo {
  workflowProcessStepId: number;
  workflowId: number;
  processCode: string;
  processName: string;
  stepCode: string;
  stepName: string;
  typicalRole: string | null;
  globalOrder: number;
  requiredGradeId: number | null;
  requiredGradeCode: string | null;
  requiredGradeName: string | null;
  requiredTeamId: number | null;
  requiredTeamCode: string | null;
  requiredTeamName: string | null;
  requiresClassification: boolean;
  requiresInsuranceConfirmation: boolean;
  requiresFourEyes: boolean;
  notifyContactOnEnterType: string | null;
}
