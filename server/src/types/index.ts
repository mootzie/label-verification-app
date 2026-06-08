export type ImageMediaType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif";

export type FieldStatus = "pass" | "warning" | "fail" | "not_found";

export interface FieldResult {
  fieldName: string;
  expectedValue: string | null;
  foundValue: string | null;
  status: FieldStatus;
  notes?: string;
}

export type OverallStatus = "pass" | "fail" | "warning";

export interface VerificationResult {
  overallStatus: OverallStatus;
  fields: FieldResult[];
  processingTimeMs?: number;
  labelId?: string;
  imageQuality?: "good" | "angled" | "degraded" | "angled_degraded";
  imageNotes?: string;
}

export interface LabelApplication {
  brandName: string;
  productName?: string;
  classType: string; // TTB class/type designation, e.g. "Bourbon Whiskey", "American Lager"
  alcoholContent: string; // e.g. "12.5% ALC/VOL"
  netContents: string; // e.g. "750 mL"
  beverageType: "beer" | "wine" | "distilled_spirits";
  producerName: string;
  producerAddress: string;
  countryOfOrigin?: string;
  appellation?: string;
  vintageYear?: string;
  ageStatement?: string;
  colorDisclosures?: string;
  commodityStatement?: string;
  sulfiteDeclaration?: string;
  foreignWinePct?: string;
  colorAdditives?: string;
  aspartameDeclaration?: string;
  // governmentWarning is not user-supplied — verifier compares against GOVERNMENT_WARNING constant
}

export type LabelApplicationInput = Partial<LabelApplication>;

export type BatchJobStatus = "pending" | "processing" | "complete" | "failed";

export interface LabelInput {
  labelId: string;
  filename: string;
  imageBase64: string;
  mediaType: ImageMediaType;
  application: LabelApplicationInput;
}

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
