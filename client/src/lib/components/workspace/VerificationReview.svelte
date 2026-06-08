<script lang="ts">
    import { Badge } from '$lib/components/ui/badge'
    import { Button } from '$lib/components/ui/button'
    import { formatFieldName, STATUS_LABEL } from '$lib/utils/compliance-logic'
    import type {
        ReviewDecision,
        ReviewDecisions,
    } from '$lib/utils/review-types'
    import type {
        FieldResult,
        FieldStatus,
        VerificationResult,
    } from '$shared/index'
    import { BEVERAGE_FIELD_SETS } from '$lib/utils/beverage-fields'
    import type {
        BeverageFieldDef,
        BeverageType,
    } from '$lib/utils/beverage-fields'
    import ApplicationDataSummaryDrawer from './ApplicationDataSummaryDrawer.svelte'

    let {
        result,
        loading,
        comparing = false,
        error,
        mode = 'body',
        beverageType = 'distilled_spirits' as BeverageType,
        brandName = '',
        producerName = '',
        classType = '',
        producerAddress = '',
        countryOfOrigin = '',
        alcoholContent = '',
        netContents = '',
        appellation = '',
        ageStatement = '',
        colorDisclosures = '',
        commodityStatement = '',
        sulfiteDeclaration = '',
        foreignWinePct = '',
        colorAdditives = '',
        aspartameDeclaration = '',
        onSelectedFieldChange,
        onExport,
        onMarkAllReviewed,
    }: {
        result: VerificationResult | null
        loading: boolean
        comparing?: boolean
        error: string | null
        mode?: 'banner' | 'body'
        beverageType?: BeverageType
        brandName?: string
        producerName?: string
        classType?: string
        producerAddress?: string
        countryOfOrigin?: string
        alcoholContent?: string
        netContents?: string
        appellation?: string
        ageStatement?: string
        colorDisclosures?: string
        commodityStatement?: string
        sulfiteDeclaration?: string
        foreignWinePct?: string
        colorAdditives?: string
        aspartameDeclaration?: string
        onSelectedFieldChange?: (fieldName: string | null) => void
        onExport?: (decisions: ReviewDecisions) => void
        onMarkAllReviewed?: (decisions: ReviewDecisions) => void
    } = $props()

    const GOVERNMENT_WARNING_REQUIRED =
        'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.'
    const LOADING_STEPS = [
        'Reading label...',
        'Extracting fields...',
        'Checking rules...',
        'Preparing review table...',
    ]

    // const INSPECTOR_TONE: Record<FieldStatus, string> = {
    //     pass: 'border-green-500 bg-green-50/60',
    //     warning: 'border-amber-500 bg-amber-50/75',
    //     fail: 'border-red-500 bg-red-50/75',
    //     not_found: 'border-gray-500 bg-gray-50',
    // }

    let selectedFieldName = $state<string | null>(null)
    let expandedFields = $state<Record<string, boolean>>({})
    let agentComments = $state<Record<string, string>>({})
    let decisions = $state<ReviewDecisions>({})
    let markAllMessage = $state<string | null>(null)
    let columnWidths = $state([20, 34, 31, 15])
    const minColumnWidths = [14, 22, 22, 8]

    // fieldDefMap: resultKey (camelCase) → BeverageFieldDef for the active type
    // name_address splits into producerName + producerAddress — both map to the same def
    let fieldDefMap = $derived.by(() => {
        const map = new Map<string, BeverageFieldDef>()
        for (const f of BEVERAGE_FIELD_SETS[beverageType]) {
            map.set(f.resultKey, f)
            if (f.formKey === 'name_address') map.set('producerAddress', f)
        }
        return map
    })

    let validResultKeys = $derived.by(() => {
        const keys = new Set<string>()
        for (const f of BEVERAGE_FIELD_SETS[beverageType]) {
            keys.add(f.resultKey)
            if (f.formKey === 'name_address') keys.add('producerAddress')
        }
        return keys
    })

    let visibleFields = $derived(
        result?.fields.filter((f) => validResultKeys.has(f.fieldName)) ?? []
    )

    let skeletonRowCount = $derived(
        result && (loading || comparing)
            ? Math.max(0, validResultKeys.size - visibleFields.length)
            : 0
    )

    // Reset decisions when result reference changes (new label loaded)
    let _lastResultRef = $state<VerificationResult | null>(null)
    $effect(() => {
        if (result !== _lastResultRef) {
            decisions = {}
            agentComments = {}
            expandedFields = visibleFields.reduce<Record<string, boolean>>(
                (acc, field) => {
                    if (field.status === 'warning' || field.status === 'fail') {
                        acc[field.fieldName] = true
                    }
                    return acc
                },
                {}
            )
            markAllMessage = null
            _lastResultRef = result
        }
    })

    let issueFields = $derived(visibleFields.filter((f) => f.status !== 'pass'))
    let statusCounts = $derived.by(() => ({
        pass: visibleFields.filter((f) => f.status === 'pass').length,
        warning: visibleFields.filter((f) => f.status === 'warning').length,
        fail: visibleFields.filter((f) => f.status === 'fail').length,
        notFound: visibleFields.filter((f) => f.status === 'not_found').length,
    }))

    let isExtractionOnly = $derived(
        result !== null &&
            visibleFields.length > 0 &&
            visibleFields.every((f) => f.expectedValue == null)
    )

    let selectedField = $derived.by(() => {
        if (!result) return null
        const preferred = selectedFieldName
            ? visibleFields.find((f) => f.fieldName === selectedFieldName)
            : null
        return preferred ?? issueFields[0] ?? visibleFields[0] ?? null
    })

    let governmentWarning = $derived(
        result?.fields.find((f) => f.fieldName === 'governmentWarning') ?? null
    )

    $effect(() => {
        if (mode !== 'body') return
        if (!result || visibleFields.length === 0) {
            selectedFieldName = null
            onSelectedFieldChange?.(null)
            return
        }
        if (
            !selectedFieldName ||
            !visibleFields.some((f) => f.fieldName === selectedFieldName)
        ) {
            const next =
                issueFields[0]?.fieldName ?? visibleFields[0]?.fieldName ?? null
            selectedFieldName = next
            onSelectedFieldChange?.(next)
        }
    })

    function selectField(field: FieldResult) {
        selectedFieldName = field.fieldName
        onSelectedFieldChange?.(field.fieldName)
    }

    function toggleExpanded(field: FieldResult) {
        selectField(field)
        expandedFields = {
            ...expandedFields,
            [field.fieldName]: !expandedFields[field.fieldName],
        }
    }

    function setAgentComment(fieldName: string, value: string) {
        agentComments = { ...agentComments, [fieldName]: value }
    }

    function resizeColumns(
        boundaryIndex: number,
        deltaPercent: number,
        commit = true
    ) {
        const next = [...columnWidths]
        const left = next[boundaryIndex]
        const right = next[boundaryIndex + 1]
        const minLeft = minColumnWidths[boundaryIndex]
        const minRight = minColumnWidths[boundaryIndex + 1]
        const allowedDelta = Math.max(
            minLeft - left,
            Math.min(deltaPercent, right - minRight)
        )
        next[boundaryIndex] = Number((left + allowedDelta).toFixed(2))
        next[boundaryIndex + 1] = Number((right - allowedDelta).toFixed(2))
        if (commit) columnWidths = next
        return next
    }

    function startColumnResize(boundaryIndex: number, event: PointerEvent) {
        event.preventDefault()
        event.stopPropagation()
        const table = (event.currentTarget as HTMLElement).closest('table')
        const tableWidth = table?.getBoundingClientRect().width ?? 0
        if (tableWidth <= 0) return

        const startX = event.clientX
        const startWidths = [...columnWidths]

        function handleMove(moveEvent: PointerEvent) {
            const deltaPercent =
                ((moveEvent.clientX - startX) / tableWidth) * 100
            columnWidths = startWidths
            resizeColumns(boundaryIndex, deltaPercent)
        }

        function handleUp() {
            window.removeEventListener('pointermove', handleMove)
            window.removeEventListener('pointerup', handleUp)
        }

        window.addEventListener('pointermove', handleMove)
        window.addEventListener('pointerup', handleUp, { once: true })
    }

    function handleColumnResizeKeydown(
        boundaryIndex: number,
        event: KeyboardEvent
    ) {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        event.stopPropagation()
        resizeColumns(boundaryIndex, event.key === 'ArrowRight' ? 2 : -2)
    }

    function decisionFor(fieldName: string): ReviewDecision {
        return decisions[fieldName] ?? 'unreviewed'
    }

    function setDecision(fieldName: string, decision: ReviewDecision) {
        decisions = { ...decisions, [fieldName]: decision }
    }

    function handleMarkAllReviewed() {
        const unresolved = issueFields.filter(
            (f) =>
                !decisions[f.fieldName] ||
                decisions[f.fieldName] === 'unreviewed'
        )
        if (unresolved.length > 0) {
            markAllMessage = `${unresolved.length} field${unresolved.length === 1 ? '' : 's'} still need a decision`
            setTimeout(() => {
                markAllMessage = null
            }, 3000)
            return
        }
        onMarkAllReviewed?.(decisions)
    }

    function statusTitle() {
        if (loading) return 'Reading Label…'
        if (comparing && result) return 'Comparing…'
        if (error) return 'Error'
        if (!result) return 'Ready'
        if (isExtractionOnly) return 'Label Extracted'
        if (result.overallStatus === 'pass') return 'Approved'
        if (result.overallStatus === 'warning') return 'Review Required'
        return 'Rejected'
    }

    function statusSummary() {
        if (loading) return 'Please wait while we ready the label image.'
        if (comparing && result)
            return 'Comparing label against application data…'
        if (error) return error
        if (!result)
            return 'Upload a label image to extract fields automatically'
        if (isExtractionOnly)
            return 'Fields extracted from label. Add application data below to compare.'
        if (issueFields.length === 0) return 'All checked fields passed'
        return `${issueFields.length} potential ${issueFields.length === 1 ? 'issue' : 'issues'} found`
    }

    function statusClass() {
        if (loading) return 'border-blue-200 bg-blue-50 text-blue-950'
        if (comparing && result)
            return 'border-blue-200 bg-blue-50 text-blue-950'
        if (error) return 'border-red-200 bg-red-50 text-red-950'
        if (!result) return 'border-gray-200 bg-white text-gray-900'
        if (isExtractionOnly) return 'border-blue-200 bg-blue-50 text-blue-950'
        if (result.overallStatus === 'pass')
            return 'border-green-200 bg-green-50 text-green-950'
        if (result.overallStatus === 'warning')
            return 'border-amber-200 bg-amber-50 text-amber-950'
        return 'border-red-200 bg-red-50 text-red-950'
    }

    function statusGlyph(status: FieldStatus) {
        if (isExtractionOnly) return '—'
        if (status === 'pass') return '✓'
        if (status === 'warning') return '!'
        if (status === 'fail') return '×'
        return '—'
    }

    function statusAccentClass(field: FieldResult) {
        if (isExtractionOnly) return 'bg-gray-400'
        if (isOptionalNotFound(field)) return 'bg-gray-400'
        if (field.status === 'pass') return 'bg-green-500'
        if (field.status === 'warning') return 'bg-amber-500'
        if (field.status === 'fail') return 'bg-red-500'
        return 'bg-gray-400'
    }

    function statusAccentColor(field: FieldResult) {
        if (isExtractionOnly) return '#9ca3af'
        if (isOptionalNotFound(field)) return '#9ca3af'
        if (field.status === 'pass') return '#22c55e'
        if (field.status === 'warning') return '#f59e0b'
        if (field.status === 'fail') return '#ef4444'
        return '#9ca3af'
    }

    function displayValue(value: string | null | undefined) {
        const trimmed = value?.trim()
        return trimmed ? trimmed : 'Not found'
    }

    function tableSummary() {
        if (isExtractionOnly)
            return `${visibleFields.length} extracted fields · not compared`
        const parts = [
            `${statusCounts.warning} warning${statusCounts.warning === 1 ? '' : 's'}`,
            `${statusCounts.fail} failure${statusCounts.fail === 1 ? '' : 's'}`,
            `${statusCounts.pass} pass${statusCounts.pass === 1 ? '' : 'es'}`,
        ]
        if (statusCounts.notFound > 0) {
            parts.push(
                `${statusCounts.notFound} not found`
            )
        }
        return parts.join(' · ')
    }

    function rowStatusLabel(field: FieldResult) {
        if (isExtractionOnly) return 'Not compared'
        if (isOptionalNotFound(field)) return 'N/A'
        return STATUS_LABEL[field.status]
    }

    function rowStatusVariant(field: FieldResult) {
        if (isExtractionOnly || isOptionalNotFound(field)) return 'not_found'
        return field.status
    }

    function compactValue(value: string | null | undefined) {
        const text = displayValue(value)
        return text.length > 160 ? `${text.slice(0, 160).trimEnd()}…` : text
    }

    function processingTimeText() {
        if (!result?.processingTimeMs) return '—'
        return `${(result.processingTimeMs / 1000).toFixed(1)}s`
    }

    function reviewNote(field: FieldResult) {
        if (field.notes) return field.notes
        if (field.status === 'pass') return 'Exact match. No action needed.'
        if (field.status === 'warning')
            return 'Minor variation detected. Review before approval.'
        if (field.status === 'fail')
            return 'Application value does not match the label value.'
        return 'Text was not found on the label.'
    }

    // function issueReason(field: FieldResult) {
    //     if (field.notes) return field.notes
    //     if (field.status === 'not_found')
    //         return 'Text was not found on the label.'
    //     if (field.status === 'fail')
    //         return 'Application value does not match the label value.'
    //     if (field.status === 'warning')
    //         return 'Minor variation detected. Review before approval.'
    //     return 'Exact match.'
    // }

    // function suggestedAction(field: FieldResult) {
    //     if (field.status === 'pass') return 'No action needed.'
    //     if (field.status === 'warning')
    //         return 'Accept the variation if it is allowed, or escalate for review.'
    //     return 'Escalate or request a corrected label/application.'
    // }

    function normalizedWarning(value: string | null | undefined) {
        return (value ?? '').replace(/\s+/g, ' ').trim()
    }

    function governmentWarningHeaderLabel(value: string | null | undefined) {
        const normalized = normalizedWarning(value)
        if (!normalized) return 'Not found'
        if (normalized.startsWith('GOVERNMENT WARNING:')) return 'Exact header'
        if (normalized.toLowerCase().startsWith('government warning:'))
            return 'Header case issue'
        return 'Header not found'
    }

    function governmentWarningHeaderClass(value: string | null | undefined) {
        const label = governmentWarningHeaderLabel(value)
        if (label === 'Exact header') return 'bg-green-100 text-green-800'
        if (label === 'Header case issue') return 'bg-amber-100 text-amber-800'
        return 'bg-red-100 text-red-800'
    }

    function governmentWarningTextLabel(value: string | null | undefined) {
        if (!normalizedWarning(value)) return 'Text not found'
        return normalizedWarning(value) ===
            normalizedWarning(GOVERNMENT_WARNING_REQUIRED)
            ? 'Exact wording'
            : 'Wording differs'
    }

    function governmentWarningTextClass(value: string | null | undefined) {
        return governmentWarningTextLabel(value) === 'Exact wording'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
    }

    // True when a field is optional (if_applicable / imports_only) and absent —
    // should show "N/A" rather than a fail/not_found badge.
    function isOptionalNotFound(field: FieldResult): boolean {
        const def = fieldDefMap.get(field.fieldName)
        return (
            !!def &&
            (def.requirement === 'if_applicable' ||
                def.requirement === 'imports_only') &&
            !field.foundValue &&
            (field.status === 'not_found' || field.status === 'pass')
        )
    }

    function showGovernmentDetails(field: FieldResult) {
        return (
            field.fieldName === 'governmentWarning' ||
            (governmentWarning !== null &&
                governmentWarning.status !== 'pass' &&
                selectedField?.fieldName === field.fieldName)
        )
    }
</script>

{#if mode === 'banner'}
    <section class={`rounded-md border px-4 py-3 ${statusClass()}`}>
        <div
            class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
        >
            <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-3">
                    <p class="text-sm font-bold uppercase tracking-wide">
                        {statusTitle()}
                    </p>
                    <span class="text-sm font-semibold text-current/80">
                        {statusSummary()}
                    </span>
                </div>
                <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {#if result}
                        {#each issueFields.slice(0, 6) as issue}
                            <Badge
                                variant={issue.status}
                                class="border-0 px-2 py-0.5 text-[11px]"
                            >
                                {formatFieldName(issue.fieldName)}
                            </Badge>
                        {/each}
                        {#if isExtractionOnly}
                            <Badge
                                variant="not_found"
                                class="border-0 px-2 py-0.5 text-[11px]"
                            >
                                Not compared
                            </Badge>
                        {:else if issueFields.length === 0}
                            <Badge
                                variant="pass"
                                class="border-0 px-2 py-0.5 text-[11px]"
                            >
                                All required checks passed
                            </Badge>
                        {/if}
                    {:else if loading}
                        <span class="text-xs font-medium"
                            >Verification is running. This may take a few
                            seconds.</span
                        >
                    {:else if error}
                        <span class="text-xs font-medium"
                            >Retry after checking the API response or network
                            connection.</span
                        >
                    {:else}
                        <span class="text-xs font-medium"
                            >Results will appear here after verification.</span
                        >
                    {/if}
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-2 lg:justify-end">
                <span
                    class="rounded border border-current/15 bg-white/55 px-2.5 py-1 text-xs font-bold"
                >
                    Time: {processingTimeText()}
                </span>
                {#if markAllMessage}
                    <span class="text-xs font-semibold text-amber-700">
                        {markAllMessage}
                    </span>
                {/if}
                {#if result && !isExtractionOnly}
                    <Button
                        size="sm"
                        class="bg-blue-900 hover:bg-blue-800"
                        onclick={handleMarkAllReviewed}
                    >
                        Mark as Reviewed
                    </Button>
                {/if}
            </div>
        </div>
    </section>
{:else}
    <section
        class="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm"
    >
        <div
            class="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 p-3"
        >
            <div class="min-w-0">
                <h2 class="text-sm font-bold text-gray-950">
                    Verification Results
                </h2>

                <p class="text-[11px] font-medium text-gray-500">
                    {#if result}
                        {tableSummary()}
                    {:else}
                        Results appear after verification
                    {/if}
                </p>
            </div>
            <Button
                variant="outline"
                size="sm"
                class="h-8"
                disabled={!result}
                onclick={() => result && onExport?.(decisions)}>Export</Button
            >
        </div>

        {#if result}
            <ApplicationDataSummaryDrawer
                {brandName}
                {producerName}
                {beverageType}
                {classType}
                {producerAddress}
                {countryOfOrigin}
                {alcoholContent}
                {netContents}
                {appellation}
                {ageStatement}
                {colorDisclosures}
                {commodityStatement}
                {sulfiteDeclaration}
                {foreignWinePct}
                {colorAdditives}
                {aspartameDeclaration}
                fields={visibleFields}
                extractionOnly={isExtractionOnly}
            />
            {#if comparing}
                <div
                    class="flex shrink-0 items-center gap-2 border-b border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                >
                    <span
                        class="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500"
                    ></span>
                    Comparing with application data…
                </div>
            {/if}
            {#if result.fields.length === 0 && !loading && !comparing}
                <div
                    class="flex min-h-0 flex-1 items-center justify-center p-5 text-sm font-medium text-gray-600"
                >
                    The verifier returned no field checks. Try another label or
                    review the API response.
                </div>
            {:else}
                <div class="min-h-0 flex-1 overflow-auto bg-white">
                    <table
                        class="h-full w-full min-w-[760px] table-fixed text-left text-sm"
                    >
                        <colgroup>
                            {#each columnWidths as width}
                                <col style={`width: ${width}%`} />
                            {/each}
                        </colgroup>
                        <thead
                            class="sticky top-0 z-10 border-b border-gray-300 bg-gray-100 text-[11px] font-bold text-gray-600 shadow-sm"
                        >
                            <tr>
                                <th class="relative px-3 py-2">
                                    Field
                                    <button
                                        type="button"
                                        aria-label="Resize Field column"
                                        class="group absolute bottom-0 right-0 top-0 z-20 flex w-3 cursor-col-resize items-center justify-center border-0 border-r border-gray-300 bg-transparent p-0 hover:border-blue-500 focus:border-blue-600 focus:outline-none"
                                        onpointerdown={(event) =>
                                            startColumnResize(0, event)}
                                        onkeydown={(event) =>
                                            handleColumnResizeKeydown(0, event)}
                                    >
                                        <span
                                            class="flex flex-col gap-[3px]"
                                            aria-hidden="true"
                                        >
                                            <span
                                                class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600"
                                            ></span>
                                            <span
                                                class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600"
                                            ></span>
                                            <span
                                                class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600"
                                            ></span>
                                        </span>
                                    </button>
                                </th>
                                <th class="relative px-3 py-2">
                                    Label (extracted)
                                    <button
                                        type="button"
                                        aria-label="Resize Label extracted column"
                                        class="group absolute bottom-0 right-0 top-0 z-20 flex w-3 cursor-col-resize items-center justify-center border-0 border-r border-gray-300 bg-transparent p-0 hover:border-blue-500 focus:border-blue-600 focus:outline-none"
                                        onpointerdown={(event) =>
                                            startColumnResize(1, event)}
                                        onkeydown={(event) =>
                                            handleColumnResizeKeydown(1, event)}
                                    >
                                        <span
                                            class="flex flex-col gap-[3px]"
                                            aria-hidden="true"
                                        >
                                            <span
                                                class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600"
                                            ></span>
                                            <span
                                                class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600"
                                            ></span>
                                            <span
                                                class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600"
                                            ></span>
                                        </span>
                                    </button>
                                </th>
                                <th class="relative px-3 py-2">
                                    <span>Application (provided)</span>
                                    {#if isExtractionOnly}
                                        <span
                                            class="mt-0.5 block text-[11px] font-medium italic text-gray-400"
                                        >
                                            No application data — extraction
                                            only
                                        </span>
                                    {/if}
                                    <button
                                        type="button"
                                        aria-label="Resize Application provided column"
                                        class="group absolute bottom-0 right-0 top-0 z-20 flex w-3 cursor-col-resize items-center justify-center border-0 border-r border-gray-300 bg-transparent p-0 hover:border-blue-500 focus:border-blue-600 focus:outline-none"
                                        onpointerdown={(event) =>
                                            startColumnResize(2, event)}
                                        onkeydown={(event) =>
                                            handleColumnResizeKeydown(2, event)}
                                    >
                                        <span
                                            class="flex flex-col gap-[3px]"
                                            aria-hidden="true"
                                        >
                                            <span
                                                class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600"
                                            ></span>
                                            <span
                                                class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600"
                                            ></span>
                                            <span
                                                class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600"
                                            ></span>
                                        </span>
                                    </button>
                                </th>
                                <th class="px-3 py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            {#each visibleFields as field}
                                {@const selected =
                                    selectedField?.fieldName ===
                                    field.fieldName}
                                {@const expanded =
                                    expandedFields[field.fieldName] === true}
                                <tr
                                    class="hover:cursor-pointer {selected
                                        ? expanded
                                            ? 'bg-blue-100'
                                            : 'bg-blue-50'
                                        : 'bg-white hover:bg-slate-50'} align-middle transition-colors focus-within:bg-blue-50"
                                    style="box-shadow: inset 3px 0 0 {selected
                                        ? statusAccentColor(field)
                                        : 'transparent'};"
                                    onclick={() => toggleExpanded(field)}
                                >
                                    <td class="px-3 py-1.5 align-middle">
                                        <button
                                            type="button"
                                            class="flex h-full w-full items-center gap-2 text-left focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                            onclick={() => selectField(field)}
                                            title={formatFieldName(
                                                field.fieldName
                                            )}
                                        >
                                            <span
                                                class="h-2.5 w-2.5 shrink-0 rounded-sm {statusAccentClass(
                                                    field
                                                )}"
                                                aria-hidden="true"
                                            ></span>
                                            <span class="min-w-0">
                                                <span
                                                    class="block truncate text-sm font-semibold text-gray-950"
                                                    >{formatFieldName(
                                                        field.fieldName
                                                    )}</span
                                                >
                                            </span>
                                        </button>
                                    </td>
                                    <td
                                        class="px-3 py-1.5 align-middle text-xs leading-5 text-gray-800"
                                    >
                                        <span class="line-clamp-2 break-words"
                                            >{displayValue(
                                                field.foundValue
                                            )}</span
                                        >
                                    </td>
                                    <td
                                        class="px-3 py-1.5 align-middle text-xs leading-5"
                                    >
                                        {#if isExtractionOnly}
                                            <span class="sr-only">
                                                No application data provided
                                            </span>
                                        {:else if field.expectedValue}
                                            <span
                                                class="line-clamp-2 break-words text-gray-800"
                                                >{field.expectedValue}</span
                                            >
                                        {:else}
                                            <span class="italic text-gray-400"
                                                >Not provided</span
                                            >
                                        {/if}
                                    </td>
                                    <td class="px-3 py-1.5 align-middle">
                                        <div class="flex items-center">
                                            {#if !isExtractionOnly && isOptionalNotFound(field)}
                                                <span
                                                    class="inline-flex h-6 w-20 items-center justify-center rounded-full border border-gray-200 bg-gray-100 px-2 text-[11px] font-medium text-gray-500"
                                                >
                                                    N/A
                                                </span>
                                            {:else}
                                                <Badge
                                                    variant={rowStatusVariant(
                                                        field
                                                    )}
                                                    class="h-6 w-24 justify-center gap-1 border-0 px-2 text-[11px]"
                                                >
                                                    <span aria-hidden="true"
                                                        >{statusGlyph(
                                                            field.status
                                                        )}</span
                                                    >
                                                    {rowStatusLabel(field)}
                                                </Badge>
                                            {/if}
                                            {#if decisionFor(field.fieldName) !== 'unreviewed'}
                                                <div class="mt-1">
                                                    <span
                                                        class="rounded px-1.5 py-0.5 text-[10px] font-semibold {decisionFor(
                                                            field.fieldName
                                                        ) === 'escalated'
                                                            ? 'bg-red-100 text-red-700'
                                                            : decisionFor(
                                                                    field.fieldName
                                                                ) ===
                                                                'accepted_variation'
                                                              ? 'bg-amber-100 text-amber-700'
                                                              : 'bg-green-100 text-green-700'}"
                                                    >
                                                        {decisionFor(
                                                            field.fieldName
                                                        ) ===
                                                        'accepted_variation'
                                                            ? 'Accepted'
                                                            : decisionFor(
                                                                    field.fieldName
                                                                ) ===
                                                                'escalated'
                                                              ? 'Escalated'
                                                              : 'Reviewed'}
                                                    </span>
                                                </div>
                                            {/if}
                                        </div>
                                    </td>
                                </tr>
                                {#if expanded}
                                    <tr
                                        class="bg-blue-50/60"
                                        style="box-shadow: inset 3px 0 0 {statusAccentColor(
                                            field
                                        )};"
                                    >
                                        <td
                                            colspan="4"
                                            class="border-t px-4 py-3"
                                        >
                                            <div
                                                class="rounded-md border border-gray-300 bg-white p-3 shadow-sm ring-1 ring-blue-100"
                                            >
                                                <div
                                                    class="mb-3 flex items-center justify-between gap-3 border-b border-gray-100 pb-2"
                                                >
                                                    <div
                                                        class="flex items-center gap-2"
                                                    >
                                                        <span
                                                            class="h-2.5 w-2.5 rounded-sm {statusAccentClass(
                                                                field
                                                            )}"
                                                            aria-hidden="true"
                                                        ></span>
                                                        <span
                                                            class="truncate text-xs font-semibold text-gray-700"
                                                        >
                                                            {formatFieldName(
                                                                field.fieldName
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span
                                                        class="mb-1.5 block text-[10px] font-bold uppercase text-gray-500"
                                                        >Review notes</span
                                                    >
                                                    <div
                                                        class="flex gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-950 items-center"
                                                    >
                                                        <span
                                                            class="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"
                                                            aria-hidden="true"
                                                        ></span>
                                                        <p>
                                                            {reviewNote(field)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div class="mt-3">
                                                    <label
                                                        class="block min-w-0"
                                                    >
                                                        <span
                                                            class="mb-1.5 block text-[10px] font-bold uppercase text-gray-500"
                                                            >Agent comment
                                                            (optional)</span
                                                        >
                                                        <textarea
                                                            class="min-h-[4.5rem] w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-xs leading-5 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                                            placeholder="Add a comment..."
                                                            value={agentComments[
                                                                field.fieldName
                                                            ] ?? ''}
                                                            oninput={(e) =>
                                                                setAgentComment(
                                                                    field.fieldName,
                                                                    e
                                                                        .currentTarget
                                                                        .value
                                                                )}
                                                        ></textarea>
                                                    </label>
                                                </div>
                                                <div
                                                    class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        class="h-9 w-full border-gray-300 bg-white text-gray-800 hover:bg-gray-50 {decisionFor(
                                                            field.fieldName
                                                        ) ===
                                                        'accepted_variation'
                                                            ? 'ring-2 ring-amber-400'
                                                            : ''}"
                                                        onclick={() =>
                                                            setDecision(
                                                                field.fieldName,
                                                                'accepted_variation'
                                                            )}
                                                        >Accept variation</Button
                                                    >
                                                    <Button
                                                        size="sm"
                                                        class="h-9 w-full bg-amber-600 text-white hover:bg-amber-700 {decisionFor(
                                                            field.fieldName
                                                        ) === 'escalated'
                                                            ? 'ring-2 ring-amber-400'
                                                            : ''}"
                                                        onclick={() =>
                                                            setDecision(
                                                                field.fieldName,
                                                                'escalated'
                                                            )}>Escalate</Button
                                                    >
                                                </div>
                                            </div>
                                            {#if showGovernmentDetails(field)}
                                                <div
                                                    class="mt-3 rounded-md border border-gray-300 bg-white p-3 shadow-sm"
                                                >
                                                    <div
                                                        class="mb-3 flex flex-col gap-2 border-b border-gray-100 pb-3 lg:flex-row lg:items-center lg:justify-between"
                                                    >
                                                        <div class="min-w-0">
                                                            <h3
                                                                class="text-xs font-bold text-gray-950"
                                                            >
                                                                Government
                                                                warning check
                                                            </h3>
                                                            <p
                                                                class="mt-0.5 text-[11px] font-medium text-gray-600"
                                                            >
                                                                Required header
                                                                and statutory
                                                                wording per 27
                                                                CFR Part 16.
                                                            </p>
                                                        </div>
                                                        <div
                                                            class="flex shrink-0 flex-wrap gap-1.5"
                                                        >
                                                            <span
                                                                class="rounded px-2 py-1 text-[11px] font-bold {governmentWarningHeaderClass(
                                                                    governmentWarning?.foundValue
                                                                )}"
                                                            >
                                                                {governmentWarningHeaderLabel(
                                                                    governmentWarning?.foundValue
                                                                )}
                                                            </span>
                                                            <span
                                                                class="rounded px-2 py-1 text-[11px] font-bold {governmentWarningTextClass(
                                                                    governmentWarning?.foundValue
                                                                )}"
                                                            >
                                                                {governmentWarningTextLabel(
                                                                    governmentWarning?.foundValue
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div
                                                        class="grid gap-3 lg:grid-cols-2"
                                                    >
                                                        <div
                                                            class="min-w-0 rounded border border-gray-200 bg-gray-50 p-3"
                                                        >
                                                            <p
                                                                class="mb-1.5 text-[10px] font-bold uppercase text-gray-500"
                                                            >
                                                                Detected on
                                                                label
                                                            </p>
                                                            <p
                                                                class="max-h-28 overflow-auto text-xs leading-5 text-gray-900"
                                                            >
                                                                {normalizedWarning(
                                                                    governmentWarning?.foundValue
                                                                ) ||
                                                                    'Not found on label'}
                                                            </p>
                                                        </div>
                                                        <div
                                                            class="min-w-0 rounded border border-gray-200 bg-gray-50 p-3"
                                                        >
                                                            <p
                                                                class="mb-1.5 text-[10px] font-bold uppercase text-gray-500"
                                                            >
                                                                Required text
                                                            </p>
                                                            <p
                                                                class="max-h-28 overflow-auto text-xs leading-5 text-gray-900"
                                                            >
                                                                {GOVERNMENT_WARNING_REQUIRED}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            {/if}
                                        </td>
                                    </tr>
                                {/if}
                            {/each}
                            {#each Array(skeletonRowCount) as _, index}
                                <tr
                                    class="h-[4.25rem] bg-white"
                                    aria-hidden="true"
                                >
                                    <td class="px-3 py-2 align-middle">
                                        <div
                                            class="flex items-center gap-2"
                                        >
                                            <span
                                                class="h-2.5 w-2.5 shrink-0 animate-pulse rounded-sm bg-gray-200"
                                            ></span>
                                            <span
                                                class="h-3 animate-pulse rounded bg-gray-200 {index %
                                                    3 ===
                                                0
                                                    ? 'w-24'
                                                    : 'w-32'}"
                                            ></span>
                                        </div>
                                    </td>
                                    <td class="px-3 py-2 align-middle">
                                        <div class="space-y-2">
                                            <div
                                                class="h-3 animate-pulse rounded bg-gray-100 {index %
                                                    2 ===
                                                0
                                                    ? 'w-40'
                                                    : 'w-56'}"
                                            ></div>
                                            <div
                                                class="h-3 w-28 animate-pulse rounded bg-gray-100"
                                            ></div>
                                        </div>
                                    </td>
                                    <td class="px-3 py-2 align-middle">
                                        <div class="space-y-2">
                                            <div
                                                class="h-3 w-44 animate-pulse rounded bg-gray-100"
                                            ></div>
                                            <div
                                                class="h-3 w-24 animate-pulse rounded bg-gray-100"
                                            ></div>
                                        </div>
                                    </td>
                                    <td class="px-3 py-2 align-middle">
                                        <div
                                            class="h-6 w-24 animate-pulse rounded-full bg-gray-100"
                                        ></div>
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        {:else if loading}
            <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div class="border-b border-blue-100 bg-blue-50/70 px-4 py-3">
                    <div class="flex items-center justify-between gap-4">
                        <div class="min-w-0">
                            <p class="text-sm font-bold text-blue-950">
                                Processing label image
                            </p>
                            <div
                                class="mt-1 flex min-h-5 items-center gap-2"
                                role="status"
                                aria-live="polite"
                            >
                                <span
                                    class="h-2 w-2 shrink-0 animate-pulse rounded-full bg-blue-600"
                                    aria-hidden="true"
                                ></span>
                                <div
                                    class="loading-step-rotator relative min-h-5 min-w-[13rem] overflow-hidden text-xs font-semibold text-blue-800"
                                >
                                    {#each LOADING_STEPS as step, index}
                                        <span
                                            class="loading-step absolute left-0 top-0 whitespace-nowrap"
                                            style={`animation-delay: ${index * 1.8}s`}
                                        >
                                            {step}
                                        </span>
                                    {/each}
                                </div>
                            </div>
                        </div>
                        <span
                            class="inline-flex shrink-0 items-center gap-2 rounded-md border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-800"
                        >
                            <span
                                class="h-2 w-2 animate-pulse rounded-full bg-blue-600"
                                aria-hidden="true"
                            ></span>
                            In progress
                        </span>
                    </div>
                    <div
                        class="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100"
                        aria-hidden="true"
                    >
                        <div
                            class="loading-progress h-full w-1/3 rounded-full bg-blue-600"
                        ></div>
                    </div>
                </div>
                <div class="relative min-h-0 flex-1 overflow-hidden p-4">
                    <div
                        class="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-gray-200"
                    >
                        <div
                            class="grid shrink-0 grid-cols-[1fr_1.4fr_1.4fr_0.8fr] gap-3 border-b border-gray-200 bg-gray-50 px-3 py-2 text-[11px] font-bold uppercase text-gray-500"
                        >
                            <span>Field</span>
                            <span>Label</span>
                            <span>Application</span>
                            <span>Status</span>
                        </div>
                        <div
                            class="min-h-0 flex-1 divide-y divide-gray-100 bg-white"
                        >
                            {#each Array(12) as _, index}
                                <div
                                    class="grid grid-cols-[1fr_1.4fr_1.4fr_0.8fr] gap-3 px-3 py-3"
                                >
                                    <div
                                        class="h-3 animate-pulse rounded bg-gray-200 {index %
                                            3 ===
                                        0
                                            ? 'w-24'
                                            : 'w-32'}"
                                    ></div>
                                    <div
                                        class="h-3 animate-pulse rounded bg-gray-100 {index %
                                            2 ===
                                        0
                                            ? 'w-36'
                                            : 'w-48'}"
                                    ></div>
                                    <div
                                        class="h-3 w-40 animate-pulse rounded bg-gray-100"
                                    ></div>
                                    <div
                                        class="h-6 w-20 animate-pulse rounded-full bg-gray-100"
                                    ></div>
                                </div>
                            {/each}
                        </div>
                    </div>
                    <div
                        class="pointer-events-none absolute inset-x-4 bottom-4 h-28 rounded-b-md bg-gradient-to-t from-white via-white/85 to-transparent"
                        aria-hidden="true"
                    ></div>
                </div>
            </div>
        {:else if error}
            <div class="flex min-h-0 flex-1 flex-col justify-center p-5">
                <h2 class="text-sm font-bold text-red-900">
                    Verification Error
                </h2>
                <p class="mt-1 text-sm text-red-800">{error}</p>
            </div>
            <div
                class="h-[190px] shrink-0 border-t bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
            >
                Retry after checking the API response or network connection.
            </div>
        {/if}
    </section>
{/if}

<style>
    .loading-step {
        animation: loading-step-cycle 7.2s infinite;
        opacity: 0;
        transform: translateY(0.4rem);
    }

    .loading-progress {
        animation: loading-progress-sweep 1.6s ease-in-out infinite;
    }

    @keyframes loading-step-cycle {
        0%,
        19% {
            opacity: 1;
            transform: translateY(0);
        }
        25%,
        100% {
            opacity: 0;
            transform: translateY(-0.4rem);
        }
    }

    @keyframes loading-progress-sweep {
        0% {
            transform: translateX(-110%);
        }
        50% {
            transform: translateX(95%);
        }
        100% {
            transform: translateX(310%);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .loading-step {
            animation: none;
            opacity: 0;
            transform: none;
        }

        .loading-step:first-child {
            opacity: 1;
        }

        .loading-progress {
            animation: none;
            transform: none;
            width: 100%;
        }
    }
</style>
