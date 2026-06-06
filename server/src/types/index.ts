export type FieldStatus = 'pass' | 'warning' | 'fail' | 'not_found';

export interface FieldResult {
  fieldName: string;
  expectedValue: string | null;
  foundValue: string | null;
  status: FieldStatus;
  notes: string;
}

export type OverallStatus = 'pass' | 'fail' | 'warning';

export interface VerificationResult {
  overallStatus: OverallStatus;
  fields: FieldResult[];
  processingTimeMs?: number;
  labelId?: string;
}

export interface LabelApplication {
  brandName: string;
  productName?: string;
  alcoholContent: string;       // e.g. "12.5% ALC/VOL"
  netContents: string;          // e.g. "750 mL"
  beverageType: 'beer' | 'wine' | 'distilled_spirits';
  producerName: string;
  producerAddress: string;
  countryOfOrigin?: string;
  appellation?: string;         // wine only
  vintageYear?: string;         // wine only
  // governmentWarning is not user-supplied — verifier compares against GOVERNMENT_WARNING constant
}

export type BatchJobStatus = 'pending' | 'processing' | 'complete' | 'failed';

export interface BatchLabelItem {
  labelId: string;
  filename: string;
  status: BatchJobStatus;
  result?: VerificationResult;
  error?: string;
}

export interface BatchJob {
  jobId: string;
  status: BatchJobStatus;
  totalLabels: number;
  completedLabels: number;
  labels: BatchLabelItem[];
  createdAt: number;
}
