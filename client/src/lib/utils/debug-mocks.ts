import type { BatchLabelItem, VerificationResult } from '$shared/index'

const MOCK_IMAGE_URL = 'https://placehold.co/600x800/f3f4f6/1d4ed8?text=Mock+Label'

// ── Application data snapshots ────────────────────────────────────────────────

export interface DemoAppData {
    beverageType: 'distilled_spirits' | 'wine' | 'beer'
    brandName: string
    classType: string
    alcoholContent: string
    netContents: string
    producerName: string
    producerAddress: string
    countryOfOrigin?: string
    appellation?: string
    ageStatement?: string
    colorDisclosures?: string
    commodityStatement?: string
    sulfiteDeclaration?: string
    foreignWinePct?: string
    colorAdditives?: string
    aspartameDeclaration?: string
}

// ── Scenario definitions ──────────────────────────────────────────────────────

export interface DemoScenario {
    id: string
    label: string
    description: string
    status: 'pass' | 'warning' | 'fail'
    appData: DemoAppData
    result: VerificationResult
    imagePreviewUrl: string
}

const GW_FULL =
    'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.'

export const DEMO_SCENARIOS: DemoScenario[] = [
    // ── 1. Spirits — All Pass ─────────────────────────────────────────────────
    {
        id: 'spirits_pass',
        label: 'Spirits — Approved',
        description: 'All fields match. Ready to approve.',
        status: 'pass',
        imagePreviewUrl: MOCK_IMAGE_URL,
        appData: {
            beverageType: 'distilled_spirits',
            brandName: 'Old Tom Distillery',
            classType: 'Kentucky Straight Bourbon Whisky',
            alcoholContent: '45% Alc./Vol.',
            netContents: '750 mL',
            producerName: 'Old Tom Distillery LLC',
            producerAddress: 'Louisville, KY 40201',
            ageStatement: 'Aged 4 Years',
        },
        result: {
            overallStatus: 'pass',
            processingTimeMs: 1890,
            fields: [
                { fieldName: 'brandName', expectedValue: 'Old Tom Distillery', foundValue: 'Old Tom Distillery', status: 'pass', notes: '' },
                { fieldName: 'classType', expectedValue: 'Kentucky Straight Bourbon Whisky', foundValue: 'Kentucky Straight Bourbon Whisky', status: 'pass', notes: '' },
                { fieldName: 'alcoholContent', expectedValue: '45% Alc./Vol.', foundValue: '45% Alc./Vol. (90 Proof)', status: 'pass', notes: 'Proof annotation is informational only.' },
                { fieldName: 'netContents', expectedValue: '750 mL', foundValue: '750 mL', status: 'pass', notes: '' },
                { fieldName: 'producerName', expectedValue: 'Old Tom Distillery LLC', foundValue: 'Old Tom Distillery LLC', status: 'pass', notes: '' },
                { fieldName: 'producerAddress', expectedValue: 'Louisville, KY 40201', foundValue: 'Louisville, KY 40201', status: 'pass', notes: '' },
                { fieldName: 'ageStatement', expectedValue: 'Aged 4 Years', foundValue: 'Aged 4 Years', status: 'pass', notes: '' },
                { fieldName: 'governmentWarning', expectedValue: GW_FULL, foundValue: GW_FULL, status: 'pass', notes: 'Header and statutory text verified (100% word match).' },
            ],
        },
    },

    // ── 2. Spirits — Review Required ─────────────────────────────────────────
    {
        id: 'spirits_warning',
        label: 'Spirits — Review Required',
        description: '3 fields need agent review.',
        status: 'warning',
        imagePreviewUrl: MOCK_IMAGE_URL,
        appData: {
            beverageType: 'distilled_spirits',
            brandName: 'Ridgeline Spirits',
            classType: 'Straight Rye Whisky',
            alcoholContent: '46% Alc./Vol.',
            netContents: '750 mL',
            producerName: 'Ridgeline Distilling Company LLC',
            producerAddress: 'Denver, CO 80203',
        },
        result: {
            overallStatus: 'warning',
            processingTimeMs: 2340,
            fields: [
                { fieldName: 'brandName', expectedValue: 'Ridgeline Spirits', foundValue: 'Ridgeline Spirits Co.', status: 'warning', notes: 'Label appends "Co." — minor variation, review for consistency with COLA.' },
                { fieldName: 'classType', expectedValue: 'Straight Rye Whisky', foundValue: 'Rye Whisky', status: 'warning', notes: 'Label omits "Straight" designation — verify whether age requirements are met per 27 CFR 5.143.' },
                { fieldName: 'alcoholContent', expectedValue: '46% Alc./Vol.', foundValue: '46% Alc./Vol.', status: 'pass', notes: '' },
                { fieldName: 'netContents', expectedValue: '750 mL', foundValue: '750 mL', status: 'pass', notes: '' },
                { fieldName: 'producerName', expectedValue: 'Ridgeline Distilling Company LLC', foundValue: 'Ridgeline Distilling Co. LLC', status: 'warning', notes: '"Company" abbreviated as "Co." — minor variation, agent should confirm acceptability.' },
                { fieldName: 'producerAddress', expectedValue: 'Denver, CO 80203', foundValue: 'Denver, CO 80203', status: 'pass', notes: '' },
                { fieldName: 'governmentWarning', expectedValue: GW_FULL, foundValue: GW_FULL, status: 'pass', notes: 'Header and statutory text verified (100% word match).' },
            ],
        },
    },

    // ── 3. Spirits — Rejected ────────────────────────────────────────────────
    {
        id: 'spirits_fail',
        label: 'Spirits — Rejected',
        description: 'Critical failures: missing class/type and gov. warning.',
        status: 'fail',
        imagePreviewUrl: MOCK_IMAGE_URL,
        appData: {
            beverageType: 'distilled_spirits',
            brandName: 'Canyon Creek',
            classType: 'Vodka',
            alcoholContent: '40% Alc./Vol.',
            netContents: '1 L',
            producerName: 'Canyon Creek Spirits Inc.',
            producerAddress: 'Phoenix, AZ 85001',
        },
        result: {
            overallStatus: 'fail',
            processingTimeMs: 3100,
            fields: [
                { fieldName: 'brandName', expectedValue: 'Canyon Creek', foundValue: 'Canyon Creek Distillery', status: 'warning', notes: 'Label includes "Distillery" which is not on the COLA application — review for consistency.' },
                { fieldName: 'classType', expectedValue: 'Vodka', foundValue: null, status: 'fail', notes: 'Class/type designation is absent from the label face. Required per 27 CFR 5.63.' },
                { fieldName: 'alcoholContent', expectedValue: '40% Alc./Vol.', foundValue: '40% Alc./Vol.', status: 'pass', notes: '' },
                { fieldName: 'netContents', expectedValue: '1 L', foundValue: '1 L', status: 'pass', notes: '' },
                { fieldName: 'producerName', expectedValue: 'Canyon Creek Spirits Inc.', foundValue: 'Canyon Creek Spirits', status: 'warning', notes: 'Label omits "Inc." — legal entity suffix may be required per permit.' },
                { fieldName: 'producerAddress', expectedValue: 'Phoenix, AZ 85001', foundValue: 'Phoenix, AZ 85001', status: 'pass', notes: '' },
                { fieldName: 'governmentWarning', expectedValue: GW_FULL, foundValue: 'Government Warning: (1) According to the Surgeon General…', status: 'fail', notes: 'Header must appear as "GOVERNMENT WARNING:" in all caps per 27 CFR 16.21.' },
            ],
        },
    },

    // ── 4. Wine — Warnings ───────────────────────────────────────────────────
    {
        id: 'wine_warning',
        label: 'Wine — Review Required',
        description: 'Appellation and sulfite issues.',
        status: 'warning',
        imagePreviewUrl: MOCK_IMAGE_URL,
        appData: {
            beverageType: 'wine',
            brandName: 'Hillside Cellars',
            classType: 'Red Table Wine',
            alcoholContent: '13.5% Alc./Vol.',
            netContents: '750 mL',
            producerName: 'Hillside Cellars LLC',
            producerAddress: 'Napa, CA 94558',
            appellation: 'Napa Valley',
            sulfiteDeclaration: 'Contains Sulfites',
        },
        result: {
            overallStatus: 'warning',
            processingTimeMs: 2710,
            fields: [
                { fieldName: 'brandName', expectedValue: 'Hillside Cellars', foundValue: 'Hillside Cellars', status: 'pass', notes: '' },
                { fieldName: 'classType', expectedValue: 'Red Table Wine', foundValue: 'Red Wine', status: 'warning', notes: '"Table Wine" omitted — verify whether the full designation is required on this label type.' },
                { fieldName: 'alcoholContent', expectedValue: '13.5% Alc./Vol.', foundValue: '13.5% Alc./Vol.', status: 'pass', notes: '' },
                { fieldName: 'netContents', expectedValue: '750 mL', foundValue: '750 mL', status: 'pass', notes: '' },
                { fieldName: 'producerName', expectedValue: 'Hillside Cellars LLC', foundValue: 'Hillside Cellars LLC', status: 'pass', notes: '' },
                { fieldName: 'producerAddress', expectedValue: 'Napa, CA 94558', foundValue: 'Napa, CA 94558', status: 'pass', notes: '' },
                { fieldName: 'appellation', expectedValue: 'Napa Valley', foundValue: 'California', status: 'warning', notes: 'Label shows "California" but COLA application specifies "Napa Valley" — appellation upgrade requires at least 85% Napa Valley fruit per 27 CFR 4.25.' },
                { fieldName: 'sulfiteDeclaration', expectedValue: 'Contains Sulfites', foundValue: null, status: 'fail', notes: 'Sulfite declaration absent from label. Required when SO₂ exceeds 10 ppm per 27 CFR 4.32(e).' },
                { fieldName: 'governmentWarning', expectedValue: GW_FULL, foundValue: GW_FULL, status: 'pass', notes: 'Header and statutory text verified (100% word match).' },
            ],
        },
    },

    // ── 5. Beer — All Pass ───────────────────────────────────────────────────
    {
        id: 'beer_pass',
        label: 'Beer — Approved',
        description: 'All fields verified. Ready to approve.',
        status: 'pass',
        imagePreviewUrl: MOCK_IMAGE_URL,
        appData: {
            beverageType: 'beer',
            brandName: 'Ironforge Brewing',
            classType: 'India Pale Ale (IPA)',
            alcoholContent: '6.8% Alc./Vol.',
            netContents: '355 mL',
            producerName: 'Ironforge Brewing Company',
            producerAddress: 'Portland, OR 97201',
        },
        result: {
            overallStatus: 'pass',
            processingTimeMs: 1640,
            fields: [
                { fieldName: 'brandName', expectedValue: 'Ironforge Brewing', foundValue: 'Ironforge Brewing', status: 'pass', notes: '' },
                { fieldName: 'classType', expectedValue: 'India Pale Ale (IPA)', foundValue: 'India Pale Ale', status: 'pass', notes: 'IPA abbreviation omitted but designation is semantically equivalent.' },
                { fieldName: 'netContents', expectedValue: '355 mL', foundValue: '355 mL (12 fl. oz.)', status: 'pass', notes: 'Dual-measure format is acceptable.' },
                { fieldName: 'producerName', expectedValue: 'Ironforge Brewing Company', foundValue: 'Ironforge Brewing Company', status: 'pass', notes: '' },
                { fieldName: 'producerAddress', expectedValue: 'Portland, OR 97201', foundValue: 'Portland, OR 97201', status: 'pass', notes: '' },
                { fieldName: 'governmentWarning', expectedValue: GW_FULL, foundValue: GW_FULL, status: 'pass', notes: 'Header and statutory text verified (100% word match).' },
                { fieldName: 'alcoholContent', expectedValue: '6.8% Alc./Vol.', foundValue: '6.8% Alc./Vol.', status: 'pass', notes: '' },
            ],
        },
    },
]

// ── Legacy exports (still used by existing debug wiring) ──────────────────────

export const MOCK_EXTRACTION = {
    imagePreviewUrl: MOCK_IMAGE_URL,
    result: DEMO_SCENARIOS[0].result,
}

export const MOCK_COMPARISON = {
    imagePreviewUrl: MOCK_IMAGE_URL,
    result: DEMO_SCENARIOS[1].result,
}

export function applyMockBatch(
    onInit: (jobId: string, labels: BatchLabelItem[]) => void,
    onComplete: (labels: BatchLabelItem[]) => void
): void {
    const jobId = 'debug-' + Math.random().toString(36).slice(2, 7)
    const labels: BatchLabelItem[] = [
        { labelId: '1', filename: 'spirits-pass.png', status: 'complete', result: DEMO_SCENARIOS[0].result },
        { labelId: '2', filename: 'wine-review.png', status: 'complete', result: DEMO_SCENARIOS[3].result },
        { labelId: '3', filename: 'spirits-fail.png', status: 'processing' },
    ]
    onInit(jobId, labels)
    setTimeout(() => {
        onComplete(
            labels.map((l) =>
                l.labelId === '3'
                    ? { ...l, status: 'complete', result: DEMO_SCENARIOS[2].result }
                    : l
            )
        )
    }, 2000)
}
