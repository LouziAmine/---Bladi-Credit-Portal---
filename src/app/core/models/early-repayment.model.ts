export interface RescheduledInstallmentResponse {
  sequenceNumber: number;
  dueDate: string;
  amount: number;
}

export interface EarlyRepaymentQuoteResponse {
  fullRepayment: boolean;
  valueDate: string;
  outstandingBefore: number;
  repaidPrincipal: number;
  accruedInterest: number;
  indemnity: number;
  totalToPay: number;
  outstandingAfter: number;
  newMonthlyPayment: number | null;
  newSchedule: RescheduledInstallmentResponse[];
}

export interface EarlyRepaymentResponse {
  id: string;
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

export interface EarlyRepaymentRequest {
  amount?: number;
}
