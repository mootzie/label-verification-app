import type { VerificationResult } from '$shared/index'

// Demo scenario data.
// Each scenario has:
//   - imagePath: real static image served from client/static/demo/
//   - appData: pre-filled COLA application data (may intentionally mismatch the label)
//   - previewResult: realistic pre-baked result for instant preview (no API call)
// The "Load Demo" path in +page.svelte fetches the real image and submits to Claude.
// The "Preview" path sets previewResult directly without an API call.

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

export interface DemoScenario {
    id: string
    label: string
    description: string
    /** Expected outcome - used for the dot color in the demo panel. */
    status: 'pass' | 'warning' | 'fail'
    /** URL path served from client/static/demo/ */
    imagePath: string
    appData: DemoAppData
    /** Pre-baked result for instant preview - based on what's actually on the label image. */
    previewResult: VerificationResult
}

export interface DemoBulkScenario {
    label: string
    description: string
    imagePaths: string[]
    filenames: string[]
    appData: DemoAppData
    /** One pre-baked result per image, for instant batch preview. */
    previewResults: VerificationResult[]
}

// ── Shared constants ──────────────────────────────────────────────────────────

const GW_FULL =
    'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.'

const GW_PASS = {
    fieldName: 'governmentWarning',
    expectedValue: GW_FULL,
    foundValue: GW_FULL,
    status: 'pass' as const,
    notes: 'Header and statutory text verified (100% word match).',
}

// ── Single-label scenarios ────────────────────────────────────────────────────

export const DEMO_SCENARIOS: DemoScenario[] = [
    // ── 1. Spirits - All Pass ─────────────────────────────────────────────────
    // Image: clean digital render of Old Tom Distillery bourbon.
    // App data matches the label exactly → all fields pass.
    {
        id: 'spirits_pass',
        label: 'Spirits - Approved',
        description: 'All fields match. Ready to approve.',
        status: 'pass',
        imagePath: '/demo/single-1.png',
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
        previewResult: {
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
                GW_PASS,
            ],
        },
    },

    // ── 2. Spirits - Review Required ─────────────────────────────────────────
    // Image: Ridgeline Spirits Co. label.
    // Label shows "Rye Whisky" (omits "Straight") and "Ridgeline Distilling Co. LLC"
    // (abbreviates "Company"). App data uses full COLA designations → 3 warnings.
    {
        id: 'spirits_warning',
        label: 'Spirits - Review Required',
        description: '3 fields differ from COLA filing.',
        status: 'warning',
        imagePath: '/demo/single-2.png',
        appData: {
            beverageType: 'distilled_spirits',
            brandName: 'Ridgeline Spirits',
            classType: 'Straight Rye Whisky',
            alcoholContent: '46% Alc./Vol.',
            netContents: '750 mL',
            producerName: 'Ridgeline Distilling Company LLC',
            producerAddress: 'Denver, CO 80203',
        },
        previewResult: {
            overallStatus: 'warning',
            processingTimeMs: 2340,
            fields: [
                { fieldName: 'brandName', expectedValue: 'Ridgeline Spirits', foundValue: 'Ridgeline Spirits Co.', status: 'warning', notes: 'Label appends "Co." - minor variation, review for consistency with COLA.' },
                { fieldName: 'classType', expectedValue: 'Straight Rye Whisky', foundValue: 'Rye Whisky', status: 'warning', notes: 'Label omits "Straight" designation - verify whether age requirements are met per 27 CFR 5.143.' },
                { fieldName: 'alcoholContent', expectedValue: '46% Alc./Vol.', foundValue: '46% Alc./Vol.', status: 'pass', notes: '' },
                { fieldName: 'netContents', expectedValue: '750 mL', foundValue: '750 mL', status: 'pass', notes: '' },
                { fieldName: 'producerName', expectedValue: 'Ridgeline Distilling Company LLC', foundValue: 'Ridgeline Distilling Co. LLC', status: 'warning', notes: '"Company" abbreviated as "Co." - minor variation, agent should confirm acceptability.' },
                { fieldName: 'producerAddress', expectedValue: 'Denver, CO 80203', foundValue: 'Denver, CO 80203', status: 'pass', notes: '' },
                GW_PASS,
            ],
        },
    },

    // ── 3. Spirits - Rejected ────────────────────────────────────────────────
    // Image: Canyon Creek label. No class/type visible on label; no government warning.
    // App data says "Vodka" and expects a gov warning → two hard fails.
    {
        id: 'spirits_fail',
        label: 'Spirits - Rejected',
        description: 'Missing class/type and government warning.',
        status: 'fail',
        imagePath: '/demo/single-3.png',
        appData: {
            beverageType: 'distilled_spirits',
            brandName: 'Canyon Creek',
            classType: 'Vodka',
            alcoholContent: '40% Alc./Vol.',
            netContents: '1 L',
            producerName: 'Canyon Creek Spirits Inc.',
            producerAddress: 'Phoenix, AZ 85001',
        },
        previewResult: {
            overallStatus: 'fail',
            processingTimeMs: 3100,
            fields: [
                { fieldName: 'brandName', expectedValue: 'Canyon Creek', foundValue: 'Canyon Creek Distillery', status: 'warning', notes: 'Label includes "Distillery" - not on COLA application, review for consistency.' },
                { fieldName: 'classType', expectedValue: 'Vodka', foundValue: null, status: 'fail', notes: 'Class/type designation absent from label. Required per 27 CFR 5.63.' },
                { fieldName: 'alcoholContent', expectedValue: '40% Alc./Vol.', foundValue: '40% Alc./Vol.', status: 'pass', notes: '' },
                { fieldName: 'netContents', expectedValue: '1 L', foundValue: '1 L', status: 'pass', notes: '' },
                { fieldName: 'producerName', expectedValue: 'Canyon Creek Spirits Inc.', foundValue: 'Canyon Creek Spirits', status: 'warning', notes: 'Label omits "Inc." - legal entity suffix may be required per permit.' },
                { fieldName: 'producerAddress', expectedValue: 'Phoenix, AZ 85001', foundValue: 'Phoenix, AZ 85001', status: 'pass', notes: '' },
                { fieldName: 'governmentWarning', expectedValue: GW_FULL, foundValue: null, status: 'fail', notes: 'Government warning statement not found on label.' },
            ],
        },
    },

    // ── 4. Wine - Review Required ────────────────────────────────────────────
    // Image: Hillside Cellars. Label shows "Red Wine" and "California" as appellation.
    // COLA says "Red Table Wine", "Napa Valley" appellation, and sulfite declaration.
    {
        id: 'wine_warning',
        label: 'Wine - Review Required',
        description: 'Appellation, class, and sulfite issues.',
        status: 'warning',
        imagePath: '/demo/single-4.png',
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
        previewResult: {
            overallStatus: 'fail',
            processingTimeMs: 2710,
            fields: [
                { fieldName: 'brandName', expectedValue: 'Hillside Cellars', foundValue: 'Hillside Cellars', status: 'pass', notes: '' },
                { fieldName: 'classType', expectedValue: 'Red Table Wine', foundValue: 'Red Wine', status: 'warning', notes: '"Table Wine" omitted - verify whether the full designation is required on this label type.' },
                { fieldName: 'alcoholContent', expectedValue: '13.5% Alc./Vol.', foundValue: '13.5% Alc./Vol.', status: 'pass', notes: '' },
                { fieldName: 'netContents', expectedValue: '750 mL', foundValue: '750 mL', status: 'pass', notes: '' },
                { fieldName: 'producerName', expectedValue: 'Hillside Cellars LLC', foundValue: 'Hillside Cellars LLC', status: 'pass', notes: '' },
                { fieldName: 'producerAddress', expectedValue: 'Napa, CA 94558', foundValue: 'Napa, CA 94558', status: 'pass', notes: '' },
                { fieldName: 'appellation', expectedValue: 'Napa Valley', foundValue: 'California', status: 'fail', notes: 'Label shows "California" but COLA specifies "Napa Valley" - upgrade requires ≥85% Napa Valley fruit per 27 CFR 4.25.' },
                { fieldName: 'sulfiteDeclaration', expectedValue: 'Contains Sulfites', foundValue: null, status: 'fail', notes: 'Sulfite declaration absent. Required when SO₂ exceeds 10 ppm per 27 CFR 4.32(e).' },
                GW_PASS,
            ],
        },
    },

    // ── 5. Beer - Approved ───────────────────────────────────────────────────
    // Image: Ironforge Brewing IPA. All fields present and correctly rendered.
    {
        id: 'beer_pass',
        label: 'Beer - Approved',
        description: 'All fields verified. Ready to approve.',
        status: 'pass',
        imagePath: '/demo/single-5.png',
        appData: {
            beverageType: 'beer',
            brandName: 'Ironforge Brewing',
            classType: 'India Pale Ale (IPA)',
            alcoholContent: '6.8% Alc./Vol.',
            netContents: '355 mL',
            producerName: 'Ironforge Brewing Company',
            producerAddress: 'Portland, OR 97201',
        },
        previewResult: {
            overallStatus: 'pass',
            processingTimeMs: 1640,
            fields: [
                { fieldName: 'brandName', expectedValue: 'Ironforge Brewing', foundValue: 'Ironforge Brewing', status: 'pass', notes: '' },
                { fieldName: 'classType', expectedValue: 'India Pale Ale (IPA)', foundValue: 'India Pale Ale', status: 'pass', notes: '"IPA" abbreviation not shown separately - designation is semantically equivalent.' },
                { fieldName: 'netContents', expectedValue: '355 mL', foundValue: '355 mL (12 fl. oz.)', status: 'pass', notes: 'Dual-measure format is acceptable.' },
                { fieldName: 'producerName', expectedValue: 'Ironforge Brewing Company', foundValue: 'Ironforge Brewing Company', status: 'pass', notes: '' },
                { fieldName: 'producerAddress', expectedValue: 'Portland, OR 97201', foundValue: 'Portland, OR 97201', status: 'pass', notes: '' },
                { fieldName: 'alcoholContent', expectedValue: '6.8% Alc./Vol.', foundValue: '6.8% Alc./Vol.', status: 'pass', notes: '' },
                GW_PASS,
            ],
        },
    },
]

// ── Batch scenario ────────────────────────────────────────────────────────────
// Five Old Tom Distillery labels in varying photo conditions.
// App data uses "Whiskey" (vs the labels' "Whisky") to trigger a classType review
// on each label - illustrates how a subtle spelling difference surfaces in batch.
// Photo-quality variation across the 5 images produces differing confidence levels.

const OT_BASE_PASS_FIELDS = (classTypeExpected: string) => [
    { fieldName: 'brandName', expectedValue: 'Old Tom Distillery', foundValue: 'Old Tom Distillery', status: 'pass' as const, notes: '' },
    { fieldName: 'classType', expectedValue: classTypeExpected, foundValue: 'Kentucky Straight Bourbon Whisky', status: 'warning' as const, notes: '"Whisky" on label vs "Whiskey" in COLA filing - spelling variants; agent should confirm which is intended.' },
    { fieldName: 'alcoholContent', expectedValue: '45% Alc./Vol.', foundValue: '45% Alc./Vol. (90 Proof)', status: 'pass' as const, notes: 'Proof annotation is informational only.' },
    { fieldName: 'netContents', expectedValue: '750 mL', foundValue: '750 mL', status: 'pass' as const, notes: '' },
    { fieldName: 'producerName', expectedValue: 'Old Tom Distillery LLC', foundValue: 'Old Tom Distillery LLC', status: 'pass' as const, notes: '' },
    { fieldName: 'producerAddress', expectedValue: 'Louisville, KY 40201', foundValue: 'Louisville, KY 40201', status: 'pass' as const, notes: '' },
    { fieldName: 'ageStatement', expectedValue: 'Aged 4 Years', foundValue: 'Aged 4 Years', status: 'pass' as const, notes: '' },
    GW_PASS,
]

export const DEMO_BULK: DemoBulkScenario = {
    label: 'Batch - Old Tom Distillery (5 Labels)',
    description: 'Mixed photo quality: digital render → aged photos.',
    imagePaths: [
        '/demo/bulk-1.png',
        '/demo/bulk-2.png',
        '/demo/bulk-3.png',
        '/demo/bulk-4.png',
        '/demo/bulk-5.png',
    ],
    filenames: [
        'old-tom-bulk-1.png',
        'old-tom-bulk-2.png',
        'old-tom-bulk-3.png',
        'old-tom-bulk-4.png',
        'old-tom-bulk-5.png',
    ],
    appData: {
        beverageType: 'distilled_spirits',
        brandName: 'Old Tom Distillery',
        classType: 'Kentucky Straight Bourbon Whiskey',
        alcoholContent: '45% Alc./Vol.',
        netContents: '750 mL',
        producerName: 'Old Tom Distillery LLC',
        producerAddress: 'Louisville, KY 40201',
        ageStatement: 'Aged 4 Years',
    },
    previewResults: [
        // bulk-1: clean digital render - high confidence, only classType warning
        { overallStatus: 'warning', processingTimeMs: 1920, fields: OT_BASE_PASS_FIELDS('Kentucky Straight Bourbon Whiskey') },
        // bulk-2: aged/yellowed photo - all pass except classType, slightly slower
        { overallStatus: 'warning', processingTimeMs: 2480, imageQuality: 'degraded', imageNotes: 'Label appears aged or printed on textured stock; text is legible.', fields: OT_BASE_PASS_FIELDS('Kentucky Straight Bourbon Whiskey') },
        // bulk-3: cleaner photo
        { overallStatus: 'warning', processingTimeMs: 2150, fields: OT_BASE_PASS_FIELDS('Kentucky Straight Bourbon Whiskey') },
        // bulk-4: photo, good quality
        { overallStatus: 'warning', processingTimeMs: 2290, fields: OT_BASE_PASS_FIELDS('Kentucky Straight Bourbon Whiskey') },
        // bulk-5: photo, good quality
        { overallStatus: 'warning', processingTimeMs: 2060, fields: OT_BASE_PASS_FIELDS('Kentucky Straight Bourbon Whiskey') },
    ],
}
