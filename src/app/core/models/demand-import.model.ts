export interface DemandImportStartResponse {
  jobExecutionId: number;
}

export interface DemandImportRowError {
  rowNumber: number;
  companyName: string | null;
  errorMessage: string;
}

export type DemandImportStatus =
  | 'STARTING'
  | 'STARTED'
  | 'STOPPING'
  | 'STOPPED'
  | 'COMPLETED'
  | 'FAILED'
  | 'ABANDONED'
  | 'UNKNOWN';

export interface DemandImportReport {
  jobExecutionId: number;
  status: DemandImportStatus;
  readCount: number;
  writeCount: number;
  skipCount: number;
  startTime: string | null;
  endTime: string | null;
  rowErrors: DemandImportRowError[];
}

export const DEMAND_IMPORT_TERMINAL_STATUSES: readonly DemandImportStatus[] = [
  'COMPLETED', 'FAILED', 'STOPPED', 'ABANDONED',
];
