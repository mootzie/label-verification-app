import type { BatchLabelItem, VerificationResult } from '$shared/index'

const MOCK_IMAGE_URL = 'https://placehold.co/600x800/f3f4f6/1d4ed8?text=Mock+Label'

export const MOCK_EXTRACTION: { imagePreviewUrl: string; result: VerificationResult } = {
    imagePreviewUrl: MOCK_IMAGE_URL,
    result: {
        overallStatus: 'pass',
        fields: [
            { fieldName: 'brandName', expectedValue: null, foundValue: 'Old Tom Distillery', status: 'pass', notes: '' },
            { fieldName: 'producerName', expectedValue: null, foundValue: 'Old Tom Distillery LLC', status: 'pass', notes: '' },
            { fieldName: 'classType', expectedValue: null, foundValue: 'Kentucky Straight Bourbon Whiskey', status: 'pass', notes: '' },
            { fieldName: 'alcoholContent', expectedValue: null, foundValue: '45% Alc./Vol. (90 Proof)', status: 'pass', notes: '' },
            { fieldName: 'netContents', expectedValue: null, foundValue: '750 mL', status: 'pass', notes: '' },
            { fieldName: 'producerAddress', expectedValue: null, foundValue: 'Louisville, KY 40201', status: 'pass', notes: '' },
            { fieldName: 'governmentWarning', expectedValue: null, foundValue: 'GOVERNMENT WARNING: (1) According to the Surgeon General…', status: 'pass', notes: '' },
        ],
        processingTimeMs: 1890,
    },
}

export const MOCK_COMPARISON: { imagePreviewUrl: string; result: VerificationResult } = {
    imagePreviewUrl: MOCK_IMAGE_URL,
    result: {
        overallStatus: 'warning',
        fields: [
            { fieldName: 'brandName', expectedValue: 'Old Tom Distillery', foundValue: 'Old Tom Distillery', status: 'pass', notes: '' },
            { fieldName: 'producerName', expectedValue: 'Old Tom Distillery LLC', foundValue: 'Old Tom Distillery', status: 'warning', notes: 'Label omits "LLC" — minor variation, flag for review.' },
            { fieldName: 'classType', expectedValue: 'Bourbon Whiskey', foundValue: 'Kentucky Straight Bourbon Whiskey', status: 'warning', notes: 'More specific designation than application — review for consistency.' },
            { fieldName: 'alcoholContent', expectedValue: '45% Alc./Vol.', foundValue: '45% Alc./Vol. (90 Proof)', status: 'pass', notes: '' },
            { fieldName: 'netContents', expectedValue: '750 mL', foundValue: '750 mL', status: 'pass', notes: '' },
            { fieldName: 'producerAddress', expectedValue: 'Louisville, KY 40201', foundValue: 'Louisville, KY 40201', status: 'pass', notes: '' },
            { fieldName: 'governmentWarning', expectedValue: 'GOVERNMENT WARNING: …', foundValue: 'GOVERNMENT WARNING: (1) According to the Surgeon General…', status: 'pass', notes: '' },
            { fieldName: 'stateOfDistillation', expectedValue: null, foundValue: 'Kentucky', status: 'warning', notes: 'Label implies Kentucky distillation — verify address matches 27 CFR 5.212.' },
        ],
        processingTimeMs: 2340,
    },
}

export function applyMockBatch(
    onInit: (jobId: string, labels: BatchLabelItem[]) => void,
    onComplete: (labels: BatchLabelItem[]) => void
): void {
    const jobId = 'debug-' + Math.random().toString(36).slice(2, 7)
    const labels: BatchLabelItem[] = [
        { labelId: '1', filename: 'l1.png', status: 'complete', result: { overallStatus: 'pass', fields: [] } },
        { labelId: '2', filename: 'l2.png', status: 'processing' },
    ]
    onInit(jobId, labels)
    setTimeout(() => {
        onComplete(labels.map((l) => ({ ...l, status: 'complete', result: { overallStatus: 'pass', fields: [] } })))
    }, 2000)
}