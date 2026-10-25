export type InstallmentStatus = 'PENDING' | 'DECLARED' | 'PAID' | 'LATE' | 'REPAID_EARLY';

export type CreditFileStatus = 'ACTIVE' | 'CLOSED';

export interface InstallmentResponse {
  id: string;
  sequenceNumber: number;
  dueDate: string;
  amount: number;
  status: InstallmentStatus;
  paidAt: string | null;
  declaredAt: string | null;
  declaredBy: string | null;
  declaredSourceRib: string | null;
  latePenalty: number;
  totalDue: number;
}

export interface CreditFileResponse {
  id: string;
  demandId: string;
  demandReference: string;
  companyName: string;
  reference: string;
  disbursedAt: string;
  disbursedAmount: number;
  status: CreditFileStatus;
  installments: InstallmentResponse[];
  beneficiaryName: string;
  beneficiaryRib: string;
  clientRib: string | null;
}
