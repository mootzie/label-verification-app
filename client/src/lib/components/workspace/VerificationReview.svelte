<script lang="ts">
    import { Badge } from '$lib/components/ui/badge'
    import { Button } from '$lib/components/ui/button'
    import { formatFieldName, STATUS_LABEL } from '$lib/utils/compliance-logic'
    import type { ReviewDecision, ReviewDecisions } from '$lib/utils/review-types'
    import type { FieldResult, FieldStatus, VerificationResult } from '$shared/index'
    import { BEVERAGE_FIELD_SETS } from '$lib/utils/beverage-fields'
    import type { BeverageFieldDef, BeverageType } from '$lib/utils/beverage-fields'
    import ApplicationDataSummaryDrawer from './ApplicationDataSummaryDrawer.svelte'
    import type { ApplicationFormValues } from './ApplicationDataInput.svelte'

    const DEFAULT_APPLICATION_DATA: ApplicationFormValues = {
        beverageType: 'distilled_spirits',
        brandName: '',
        producerName: '',
        classType: '',
        producerAddress: '',
        countryOfOrigin: '',
        alcoholContent: '',
        netContents: '',
        appellation: '',
        ageStatement: '',
        colorDisclosures: '',
        commodityStatement: '',
        sulfiteDeclaration: '',
        foreignWinePct: '',
        colorAdditives: '',
        aspartameDeclaration: '',
    }

    type VerificationReviewProps = {
        result: VerificationResult | null
        loading: boolean
        comparing?: boolean
        error: string | null
        mode?: 'banner' | 'body'
        applicationData?: ApplicationFormValues
        onSelectedFieldChange?: (fieldName: string | null) => void
        onExport?: (decisions: ReviewDecisions) => void
        onMarkAllReviewed?: (decisions: ReviewDecisions) => void
    }

    let { result, loading, comparing = false, error, mode = 'body', applicationData = DEFAULT_APPLICATION_DATA, onSelectedFieldChange, onExport, onMarkAllReviewed }: VerificationReviewProps = $props()

    const GOVERNMENT_WARNING_REQUIRED = 'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.'
    const LOADING_STEPS = ['Reading label...', 'Extracting fields...', 'Checking rules...', 'Preparing review table...']
    type ReviewStateKey = 'loading' | 'comparing' | 'error' | 'ready' | 'extracted' | 'approved' | 'warning' | 'rejected'
    type FieldToneKey = FieldStatus | 'neutral'

    const REVIEW_STATE_UI: Record<ReviewStateKey, { title: string; summary: string; className: string; badgeLabel: string; badgeDetail: string; badgeClass: string; dotClass: string }> = {
        loading: {
            title: 'Reading Label...',
            summary: 'Please wait while we ready the label image.',
            className: 'border-blue-200 bg-blue-50 text-blue-950',
            badgeLabel: 'Processing',
            badgeDetail: 'Reading label image',
            badgeClass: 'border-blue-200 bg-blue-50 text-blue-800',
            dotClass: 'bg-blue-500',
        },
        comparing: {
            title: 'Comparing...',
            summary: 'Comparing label against application data...',
            className: 'border-blue-200 bg-blue-50 text-blue-950',
            badgeLabel: 'Comparing',
            badgeDetail: 'Checking application values',
            badgeClass: 'border-blue-200 bg-blue-50 text-blue-800',
            dotClass: 'bg-blue-500',
        },
        error: {
            title: 'Error',
            summary: 'Could not complete verification.',
            className: 'border-red-200 bg-red-50 text-red-950',
            badgeLabel: 'Error',
            badgeDetail: 'Could not complete',
            badgeClass: 'border-red-200 bg-red-50 text-red-800',
            dotClass: 'bg-red-500',
        },
        ready: {
            title: 'Ready',
            summary: 'Upload a label image to extract fields automatically',
            className: 'border-gray-200 bg-white text-gray-900',
            badgeLabel: 'Not verified',
            badgeDetail: 'Awaiting label',
            badgeClass: 'border-gray-200 bg-white text-gray-600',
            dotClass: 'bg-gray-400',
        },
        extracted: {
            title: 'Label Extracted',
            summary: 'Fields extracted from label. Add application data below to compare.',
            className: 'border-blue-200 bg-blue-50 text-blue-950',
            badgeLabel: 'Extracted',
            badgeDetail: 'Complete',
            badgeClass: 'border-blue-200 bg-blue-50 text-blue-800',
            dotClass: 'bg-blue-500',
        },
        approved: {
            title: 'Approved',
            summary: 'All checked fields passed',
            className: 'border-green-200 bg-green-50 text-green-950',
            badgeLabel: 'Verified',
            badgeDetail: 'Complete',
            badgeClass: 'border-green-200 bg-green-50 text-green-800',
            dotClass: 'bg-green-500',
        },
        warning: {
            title: 'Review Required',
            summary: 'Potential issues found',
            className: 'border-amber-200 bg-amber-50 text-amber-950',
            badgeLabel: 'Review required',
            badgeDetail: 'Complete',
            badgeClass: 'border-amber-200 bg-amber-50 text-amber-800',
            dotClass: 'bg-amber-500',
        },
        rejected: {
            title: 'Rejected',
            summary: 'Verification failed',
            className: 'border-red-200 bg-red-50 text-red-950',
            badgeLabel: 'Failed verification',
            badgeDetail: 'Complete',
            badgeClass: 'border-red-200 bg-red-50 text-red-800',
            dotClass: 'bg-red-500',
        },
    }

    const FIELD_TONE_UI: Record<FieldToneKey, { glyph: string; accentClass: string; accentColor: string }> = {
        pass: { glyph: '✓', accentClass: 'bg-green-500', accentColor: '#22c55e' },
        warning: { glyph: '!', accentClass: 'bg-amber-500', accentColor: '#f59e0b' },
        fail: { glyph: '×', accentClass: 'bg-red-500', accentColor: '#ef4444' },
        not_found: { glyph: '—', accentClass: 'bg-gray-400', accentColor: '#9ca3af' },
        neutral: { glyph: '—', accentClass: 'bg-gray-400', accentColor: '#9ca3af' },
    }

    let selectedFieldName = $state<string | null>(null)
    let expandedFields = $state<Record<string, boolean>>({})
    let agentComments = $state<Record<string, string>>({})
    let decisions = $state<ReviewDecisions>({})
    let markAllMessage = $state<string | null>(null)
    let verificationCompletedAt = $state<Date | null>(null)
    let _completionResultRef = $state<VerificationResult | null>(null)
    let columnWidths = $state([20, 34, 31, 15])
    const minColumnWidths = [14, 22, 22, 8]

    let fieldDefMap = $derived.by(() => {
        const map = new Map<string, BeverageFieldDef>()
        for (const f of BEVERAGE_FIELD_SETS?.[applicationData.beverageType] ?? []) {
            map.set(f.resultKey, f)
            if (f.formKey === 'name_address') map.set('producerAddress', f)
        }
        return map
    })

    let validResultKeys = $derived.by(() => {
        const keys = new Set<string>()
        for (const f of BEVERAGE_FIELD_SETS?.[applicationData.beverageType] ?? []) {
            keys.add(f.resultKey)
            if (f.formKey === 'name_address') keys.add('producerAddress')
        }
        return keys
    })

    let visibleFields = $derived(result?.fields.filter((f) => validResultKeys.has(f.fieldName)) ?? [])
    let skeletonRowCount = $derived(result && (loading || comparing) ? Math.max(0, validResultKeys.size - visibleFields.length) : 0)

    $effect(() => {
        if (result !== _completionResultRef) {
            verificationCompletedAt = null
            _completionResultRef = result
        }

        if (!result || loading || comparing || error) return
        if (!verificationCompletedAt && result.fields.length > 0) {
            verificationCompletedAt = new Date()
        }
    })

    // Reset decisions when result reference changes (new label loaded)
    let _lastResultRef = $state<VerificationResult | null>(null)
    $effect(() => {
        if (result !== _lastResultRef) {
            decisions = {}
            agentComments = {}
            expandedFields = visibleFields.reduce<Record<string, boolean>>((acc, field) => {
                if (field.status === 'warning' || field.status === 'fail') {
                    acc[field.fieldName] = true
                }
                return acc
            }, {})
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

    let isExtractionOnly = $derived(result !== null && visibleFields.length > 0 && visibleFields.every((f) => f.expectedValue == null))

    let selectedField = $derived.by(() => {
        if (!result) return null
        const preferred = selectedFieldName ? visibleFields.find((f) => f.fieldName === selectedFieldName) : null
        return preferred ?? issueFields[0] ?? visibleFields[0] ?? null
    })

    let governmentWarning = $derived(result?.fields.find((f) => f.fieldName === 'governmentWarning') ?? null)

    $effect(() => {
        if (mode !== 'body') return
        if (!result || visibleFields.length === 0) {
            selectedFieldName = null
            onSelectedFieldChange?.(null)
            return
        }
        if (!selectedFieldName || !visibleFields.some((f) => f.fieldName === selectedFieldName)) {
            const next = issueFields[0]?.fieldName ?? visibleFields[0]?.fieldName ?? null
            selectedFieldName = next
            onSelectedFieldChange?.(next)
        }
    })

    const selectField = (field: FieldResult) => {
        selectedFieldName = field.fieldName
        onSelectedFieldChange?.(field.fieldName)
    }

    const toggleExpanded = (field: FieldResult) => {
        selectField(field)
        expandedFields = {
            ...expandedFields,
            [field.fieldName]: !expandedFields[field.fieldName],
        }
    }

    const setAgentComment = (fieldName: string, value: string) => {
        agentComments = { ...agentComments, [fieldName]: value }
    }

    const resizeColumns = (boundaryIndex: number, deltaPercent: number, commit = true) => {
        const next = [...columnWidths]
        const left = next[boundaryIndex]
        const right = next[boundaryIndex + 1]
        const minLeft = minColumnWidths[boundaryIndex]
        const minRight = minColumnWidths[boundaryIndex + 1]
        const allowedDelta = Math.max(minLeft - left, Math.min(deltaPercent, right - minRight))
        next[boundaryIndex] = Number((left + allowedDelta).toFixed(2))
        next[boundaryIndex + 1] = Number((right - allowedDelta).toFixed(2))
        if (commit) columnWidths = next
        return next
    }

    const startColumnResize = (boundaryIndex: number, event: PointerEvent) => {
        event.preventDefault()
        event.stopPropagation()
        const table = (event.currentTarget as HTMLElement).closest('table')
        const tableWidth = table?.getBoundingClientRect().width ?? 0
        if (tableWidth <= 0) return

        const startX = event.clientX
        const startWidths = [...columnWidths]

        const handleMove = (moveEvent: PointerEvent) => {
            const deltaPercent = ((moveEvent.clientX - startX) / tableWidth) * 100
            columnWidths = startWidths
            resizeColumns(boundaryIndex, deltaPercent)
        }

        const handleUp = () => {
            window.removeEventListener('pointermove', handleMove)
            window.removeEventListener('pointerup', handleUp)
        }

        window.addEventListener('pointermove', handleMove)
        window.addEventListener('pointerup', handleUp, { once: true })
    }

    const handleColumnResizeKeydown = (boundaryIndex: number, event: KeyboardEvent) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        event.stopPropagation()
        resizeColumns(boundaryIndex, event.key === 'ArrowRight' ? 2 : -2)
    }

    const decisionFor = (fieldName: string): ReviewDecision => {
        return decisions[fieldName] ?? 'unreviewed'
    }

    const setDecision = (fieldName: string, decision: ReviewDecision) => {
        decisions = { ...decisions, [fieldName]: decision }
    }

    const handleMarkAllReviewed = () => {
        const unresolved = issueFields.filter((f) => !decisions[f.fieldName] || decisions[f.fieldName] === 'unreviewed')
        if (unresolved.length > 0) {
            markAllMessage = `${unresolved.length} field${unresolved.length === 1 ? '' : 's'} still need a decision`
            setTimeout(() => {
                markAllMessage = null
            }, 3000)
            return
        }
        onMarkAllReviewed?.(decisions)
    }

    let reviewStateKey = $derived.by<ReviewStateKey>(() => {
        if (loading) return 'loading'
        if (comparing && result) return 'comparing'
        if (error) return 'error'
        if (!result) return 'ready'
        if (isExtractionOnly) return 'extracted'
        if (result.overallStatus === 'pass') return 'approved'
        if (result.overallStatus === 'warning') return 'warning'
        return 'rejected'
    })

    let reviewState = $derived(REVIEW_STATE_UI[reviewStateKey])

    let reviewSummary = $derived.by(() => {
        if (error) return error
        if (!result || loading || comparing || isExtractionOnly) return reviewState.summary
        if (issueFields.length === 0) return REVIEW_STATE_UI.approved.summary
        return `${issueFields.length} potential ${issueFields.length === 1 ? 'issue' : 'issues'} found`
    })

    const fieldToneKey = (field: FieldResult): FieldToneKey => {
        if (isExtractionOnly || isOptionalNotFound(field)) return 'neutral'
        return field.status
    }

    const fieldTone = (field: FieldResult) => FIELD_TONE_UI[fieldToneKey(field)]

    const displayValue = (value: string | null | undefined) => {
        const trimmed = value?.trim()
        return trimmed ? trimmed : 'Not found'
    }

    const tableSummary = () => {
        if (isExtractionOnly) return `${visibleFields.length} extracted fields · not compared`
        const parts = [`${statusCounts.warning} warning${statusCounts.warning === 1 ? '' : 's'}`, `${statusCounts.fail} failure${statusCounts.fail === 1 ? '' : 's'}`, `${statusCounts.pass} pass${statusCounts.pass === 1 ? '' : 'es'}`]
        if (statusCounts.notFound > 0) {
            parts.push(`${statusCounts.notFound} not found`)
        }
        return parts.join(' · ')
    }

    const rowStatusLabel = (field: FieldResult) => {
        if (isExtractionOnly) return 'Not compared'
        if (isOptionalNotFound(field)) return 'N/A'
        return STATUS_LABEL[field.status]
    }

    const rowStatusVariant = (field: FieldResult) => {
        if (isExtractionOnly || isOptionalNotFound(field)) return 'not_found'
        return field.status
    }

    const processingTimeText = () => {
        if (!result?.processingTimeMs) return '—'
        return `${(result.processingTimeMs / 1000).toFixed(1)}s`
    }

    const completedAtText = () =>
        verificationCompletedAt?.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
        }) ?? null

    let verificationBadgeDetail = $derived.by(() => {
        if (!result || loading || comparing || error) return reviewState.badgeDetail
        const detailParts: string[] = []
        const completedAt = completedAtText()
        if (completedAt) detailParts.push(completedAt)
        if (processingTimeText() !== '—') detailParts.push(processingTimeText())
        return detailParts.length > 0 ? detailParts.join(' · ') : reviewState.badgeDetail
    })

    const reviewNote = (field: FieldResult) => {
        if (field.notes) return field.notes
        if (field.status === 'pass') return 'Exact match. No action needed.'
        if (field.status === 'warning') return 'Minor variation detected. Review before approval.'
        if (field.status === 'fail') return 'Application value does not match the label value.'
        return 'Text was not found on the label.'
    }

    const normalizedWarning = (value: string | null | undefined) => {
        return (value || '').replace(/\s+/g, ' ').trim()
    }

    const governmentWarningHeaderLabel = (value: string | null | undefined) => {
        const normalized = normalizedWarning(value)
        if (!normalized) return 'Not found'
        if (normalized.startsWith('GOVERNMENT WARNING:')) return 'Exact header'
        if (normalized.toLowerCase().startsWith('government warning:')) return 'Header case issue'
        return 'Header not found'
    }

    const governmentWarningHeaderClass = (value: string | null | undefined) => {
        const label = governmentWarningHeaderLabel(value)
        if (label === 'Exact header') return 'bg-green-100 text-green-800'
        if (label === 'Header case issue') return 'bg-amber-100 text-amber-800'
        return 'bg-red-100 text-red-800'
    }

    const governmentWarningTextLabel = (value: string | null | undefined) => {
        if (!normalizedWarning(value)) return 'Text not found'
        return normalizedWarning(value) === normalizedWarning(GOVERNMENT_WARNING_REQUIRED) ? 'Exact wording' : 'Wording differs'
    }

    const governmentWarningTextClass = (value: string | null | undefined) => (governmentWarningTextLabel(value) === 'Exact wording' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')

    const isOptionalNotFound = (field: FieldResult): boolean => {
        const def = fieldDefMap.get(field.fieldName)
        return !!def && (def.requirement === 'if_applicable' || def.requirement === 'imports_only') && !field.foundValue && (field.status === 'not_found' || field.status === 'pass')
    }

    const showGovernmentDetails = (field: FieldResult) => {
        return field.fieldName === 'governmentWarning' || (governmentWarning !== null && governmentWarning.status !== 'pass' && selectedField?.fieldName === field.fieldName)
    }
</script>

{#if mode === 'banner'}
    <section class={`rounded-md border px-4 py-3 ${reviewState.className}`}>
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-3">
                    <p class="text-sm font-bold uppercase tracking-wide">
                        {reviewState.title}
                    </p>
                    <span class="text-sm font-semibold text-current/80">
                        {reviewSummary}
                    </span>
                </div>
                <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {#if result}
                        {#each issueFields.slice(0, 6) as issue}
                            <Badge variant={issue.status} class="border-0 px-2 py-0.5 text-[11px]">
                                {formatFieldName(issue.fieldName)}
                            </Badge>
                        {/each}
                        {#if isExtractionOnly}
                            <Badge variant="not_found" class="border-0 px-2 py-0.5 text-[11px]">Not compared</Badge>
                        {:else if issueFields.length === 0}
                            <Badge variant="pass" class="border-0 px-2 py-0.5 text-[11px]">All required checks passed</Badge>
                        {/if}
                    {:else if loading}
                        <span class="text-xs font-medium">Verification is running. This may take a few seconds.</span>
                    {:else if error}
                        <span class="text-xs font-medium">Retry after checking the API response or network connection.</span>
                    {:else}
                        <span class="text-xs font-medium">Results will appear here after verification.</span>
                    {/if}
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-2 lg:justify-end">
                <span class="rounded border border-current/15 bg-white/55 px-2.5 py-1 text-xs font-bold">
                    Time: {processingTimeText()}
                </span>
                {#if markAllMessage}
                    <span class="text-xs font-semibold text-amber-700">
                        {markAllMessage}
                    </span>
                {/if}
                {#if result && !isExtractionOnly}
                    <Button size="sm" class="bg-blue-900 hover:bg-blue-800" onclick={handleMarkAllReviewed}>Mark as Reviewed</Button>
                {/if}
            </div>
        </div>
    </section>
{:else}
    <section class="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm">
        <div class="flex shrink-0 flex-col gap-3 border-b border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
                <h2 class="panel-title">Verification Results</h2>

                <p class="text-[11px] font-medium text-gray-500">
                    {#if result}
                        {tableSummary()}
                    {:else}
                        Results appear after verification
                    {/if}
                </p>
            </div>
            <div class="flex shrink-0 flex-wrap items-center gap-2">
                <div class="inline-flex min-w-[10.5rem] items-center gap-2 rounded-md border px-2.5 py-1.5 shadow-sm {reviewState.badgeClass}" role="status" aria-live="polite">
                    <span class="h-2.5 w-2.5 shrink-0 rounded-full {reviewState.dotClass}"></span>
                    <span class="min-w-0">
                        <span class="block text-xs font-bold leading-4">
                            {reviewState.badgeLabel}
                        </span>
                        <span class="block text-[11px] font-medium leading-4">
                            {verificationBadgeDetail}
                        </span>
                    </span>
                </div>
                <Button variant="outline" size="sm" class="h-8" disabled={!result} onclick={() => result && onExport?.(decisions)}>Export</Button>
            </div>
        </div>

        {#if result}
            <ApplicationDataSummaryDrawer {applicationData} fields={visibleFields} extractionOnly={isExtractionOnly} />
            {#if comparing}
                <div class="flex shrink-0 items-center gap-2 border-b border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                    <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500"></span>
                    Comparing with application data…
                </div>
            {/if}
            {#if result.fields.length === 0 && !loading && !comparing}
                <div class="flex min-h-0 flex-1 items-center justify-center p-5 text-sm font-medium text-gray-600">The verifier returned no field checks. Try another label or review the API response.</div>
            {:else}
                <div class="min-h-0 flex-1 overflow-auto bg-white">
                    <table class="h-full w-full min-w-[760px] table-fixed text-left text-sm">
                        <colgroup>
                            {#each columnWidths as width}
                                <col style={`width: ${width}%`} />
                            {/each}
                        </colgroup>
                        <thead class="sticky top-0 z-10 border-b border-gray-300 bg-gray-100 text-[11px] font-bold text-gray-600 shadow-sm">
                            <tr>
                                <th class="relative px-3 py-2">
                                    Field
                                    <button type="button" aria-label="Resize Field column" class="group absolute bottom-0 right-0 top-0 z-20 flex w-3 cursor-col-resize items-center justify-center border-0 border-r border-gray-300 bg-transparent p-0 hover:border-blue-500 focus:border-blue-600 focus:outline-none" onpointerdown={(event) => startColumnResize(0, event)} onkeydown={(event) => handleColumnResizeKeydown(0, event)}>
                                        <span class="flex flex-col gap-[3px]" aria-hidden="true">
                                            <span class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600"></span>
                                            <span class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600"></span>
                                            <span class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600"></span>
                                        </span>
                                    </button>
                                </th>
                                <th class="relative px-3 py-2">
                                    Label (extracted)
                                    <button type="button" aria-label="Resize Label extracted column" class="group absolute bottom-0 right-0 top-0 z-20 flex w-3 cursor-col-resize items-center justify-center border-0 border-r border-gray-300 bg-transparent p-0 hover:border-blue-500 focus:border-blue-600 focus:outline-none" onpointerdown={(event) => startColumnResize(1, event)} onkeydown={(event) => handleColumnResizeKeydown(1, event)}>
                                        <span class="flex flex-col gap-[3px]" aria-hidden="true">
                                            <span class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600"></span>
                                            <span class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600"></span>
                                            <span class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600"></span>
                                        </span>
                                    </button>
                                </th>
                                <th class="relative px-3 py-2">
                                    <span>Application (provided)</span>
                                    {#if isExtractionOnly}
                                        <span class="mt-0.5 block text-[11px] font-medium italic text-gray-400">No application data — extraction only</span>
                                    {/if}
                                    <button type="button" aria-label="Resize Application provided column" class="group absolute bottom-0 right-0 top-0 z-20 flex w-3 cursor-col-resize items-center justify-center border-0 border-r border-gray-300 bg-transparent p-0 hover:border-blue-500 focus:border-blue-600 focus:outline-none" onpointerdown={(event) => startColumnResize(2, event)} onkeydown={(event) => handleColumnResizeKeydown(2, event)}>
                                        <span class="flex flex-col gap-[3px]" aria-hidden="true">
                                            <span class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600"></span>
                                            <span class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600"></span>
                                            <span class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600"></span>
                                        </span>
                                    </button>
                                </th>
                                <th class="px-3 py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            {#each visibleFields as field}
                                {@const selected = selectedField?.fieldName === field.fieldName}
                                {@const expanded = expandedFields[field.fieldName] === true}
                                <tr class="hover:cursor-pointer {selected ? (expanded ? 'bg-blue-100' : 'bg-blue-50') : 'bg-white hover:bg-slate-50'} align-middle transition-colors focus-within:bg-blue-50" style="box-shadow: inset 3px 0 0 {selected ? fieldTone(field).accentColor : 'transparent'};" onclick={() => toggleExpanded(field)}>
                                    <td class="px-3 py-1.5 align-middle">
                                        <button type="button" class="flex h-full w-full items-center gap-2 text-left focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" onclick={() => selectField(field)} title={formatFieldName(field.fieldName)}>
                                            <span class="h-2.5 w-2.5 shrink-0 rounded-sm {fieldTone(field).accentClass}" aria-hidden="true"></span>
                                            <span class="min-w-0">
                                                <span class="block truncate text-sm font-semibold text-gray-950">
                                                    {formatFieldName(field.fieldName)}
                                                </span>
                                            </span>
                                        </button>
                                    </td>
                                    <td class="px-3 py-1.5 align-middle text-xs leading-5 text-gray-800">
                                        <span class="line-clamp-2 break-words">
                                            {displayValue(field.foundValue)}
                                        </span>
                                    </td>
                                    <td class="px-3 py-1.5 align-middle text-xs leading-5">
                                        {#if isExtractionOnly}
                                            <span class="sr-only">No application data provided</span>
                                        {:else if field.expectedValue}
                                            <span class="line-clamp-2 break-words text-gray-800">
                                                {field.expectedValue}
                                            </span>
                                        {:else}
                                            <span class="italic text-gray-400">Not provided</span>
                                        {/if}
                                    </td>
                                    <td class="px-3 py-1.5 align-middle">
                                        <div class="flex items-center">
                                            {#if !isExtractionOnly && isOptionalNotFound(field)}
                                                <span class="inline-flex h-6 w-20 items-center justify-center rounded-full border border-gray-200 bg-gray-100 px-2 text-[11px] font-medium text-gray-500">N/A</span>
                                            {:else}
                                                <Badge variant={rowStatusVariant(field)} class="h-6 w-24 justify-center gap-1 border-0 px-2 text-[11px]">
                                                    <span aria-hidden="true">
                                                            {fieldTone(field).glyph}
                                                    </span>
                                                    {rowStatusLabel(field)}
                                                </Badge>
                                            {/if}
                                            {#if decisionFor(field.fieldName) !== 'unreviewed'}
                                                <div class="mt-1">
                                                    <span class="rounded px-1.5 py-0.5 text-[10px] font-semibold {decisionFor(field.fieldName) === 'escalated' ? 'bg-red-100 text-red-700' : decisionFor(field.fieldName) === 'accepted_variation' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}">
                                                        {decisionFor(field.fieldName) === 'accepted_variation' ? 'Accepted' : decisionFor(field.fieldName) === 'escalated' ? 'Escalated' : 'Reviewed'}
                                                    </span>
                                                </div>
                                            {/if}
                                        </div>
                                    </td>
                                </tr>
                                {#if expanded}
                                    <tr class="bg-blue-50/60" style="box-shadow: inset 3px 0 0 {fieldTone(field).accentColor};">
                                        <td colspan="4" class="border-t px-4 py-3">
                                            <div class="rounded-md border border-gray-300 bg-white p-3 shadow-sm ring-1 ring-blue-100">
                                                <div class="mb-3 flex items-center justify-between gap-3 border-b border-gray-100 pb-2">
                                                    <div class="flex items-center gap-2">
                                                        <span class="h-2.5 w-2.5 rounded-sm {fieldTone(field).accentClass}" aria-hidden="true"></span>
                                                        <span class="truncate text-xs font-semibold text-gray-700">
                                                            {formatFieldName(field.fieldName)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span class="detail-label">Review notes</span>
                                                    <div class="flex gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-950 items-center">
                                                        <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" aria-hidden="true"></span>
                                                        <p>
                                                            {reviewNote(field)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div class="mt-3">
                                                    <label class="block min-w-0">
                                                        <span class="detail-label">Agent comment (optional)</span>
                                                        <textarea class="min-h-[4.5rem] w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-xs leading-5 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Add a comment..." oninput={(e) => setAgentComment(field.fieldName, e.currentTarget.value)}>
                                                            {agentComments[field.fieldName] ?? ''}
                                                        </textarea>
                                                    </label>
                                                </div>
                                                <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                    <Button variant="outline" size="sm" class="h-9 w-full border-gray-300 bg-white text-gray-800 hover:bg-gray-50 {decisionFor(field.fieldName) === 'accepted_variation' ? 'ring-2 ring-amber-400' : ''}" onclick={() => setDecision(field.fieldName, 'accepted_variation')}>Accept variation</Button>
                                                    <Button size="sm" variant="primary" onclick={() => setDecision(field.fieldName, 'escalated')}>Escalate</Button>
                                                </div>
                                            </div>
                                            {#if showGovernmentDetails(field)}
                                                <div class="mt-3 rounded-md border border-gray-300 bg-white p-3 shadow-sm">
                                                    <div class="mb-3 flex flex-col gap-2 border-b border-gray-100 pb-3 lg:flex-row lg:items-center lg:justify-between">
                                                        <div class="min-w-0">
                                                            <h3 class="text-xs font-bold text-gray-950">Government warning check</h3>
                                                            <p class="mt-0.5 text-[11px] font-medium text-gray-600">Required header and statutory wording per 27 CFR Part 16.</p>
                                                        </div>
                                                        <div class="flex shrink-0 flex-wrap gap-1.5">
                                                            <span class="rounded px-2 py-1 text-[11px] font-bold {governmentWarningHeaderClass(governmentWarning?.foundValue)}">
                                                                {governmentWarningHeaderLabel(governmentWarning?.foundValue)}
                                                            </span>
                                                            <span class="rounded px-2 py-1 text-[11px] font-bold {governmentWarningTextClass(governmentWarning?.foundValue)}">
                                                                {governmentWarningTextLabel(governmentWarning?.foundValue)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div class="grid gap-3 lg:grid-cols-2">
                                                        <div class="min-w-0 rounded border border-gray-200 bg-gray-50 p-3">
                                                            <p class="mb-1.5 text-[10px] font-bold uppercase text-gray-500">Detected on label</p>
                                                            <p class="max-h-28 overflow-auto text-xs leading-5 text-gray-900">
                                                                {normalizedWarning(governmentWarning?.foundValue) || 'Not found on label'}
                                                            </p>
                                                        </div>
                                                        <div class="min-w-0 rounded border border-gray-200 bg-gray-50 p-3">
                                                            <p class="mb-1.5 text-[10px] font-bold uppercase text-gray-500">Required text</p>
                                                            <p class="max-h-28 overflow-auto text-xs leading-5 text-gray-900">
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
                                <tr class="h-[4.25rem] bg-white" aria-hidden="true">
                                    <td class="px-3 py-2 align-middle">
                                        <div class="flex items-center gap-2">
                                            <span class="h-2.5 w-2.5 shrink-0 animate-pulse rounded-sm bg-gray-200"></span>
                                            <span class="h-3 animate-pulse rounded bg-gray-200 {index % 3 === 0 ? 'w-24' : 'w-32'}"></span>
                                        </div>
                                    </td>
                                    <td class="px-3 py-2 align-middle">
                                        <div class="space-y-2">
                                            <div class="h-3 animate-pulse rounded bg-gray-100 {index % 2 === 0 ? 'w-40' : 'w-56'}"></div>
                                            <div class="h-3 w-28 animate-pulse rounded bg-gray-100"></div>
                                        </div>
                                    </td>
                                    <td class="px-3 py-2 align-middle">
                                        <div class="space-y-2">
                                            <div class="h-3 w-44 animate-pulse rounded bg-gray-100"></div>
                                            <div class="h-3 w-24 animate-pulse rounded bg-gray-100"></div>
                                        </div>
                                    </td>
                                    <td class="px-3 py-2 align-middle">
                                        <div class="h-6 w-24 animate-pulse rounded-full bg-gray-100"></div>
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
                            <p class="text-sm font-bold text-blue-950">Processing label image</p>
                            <div class="mt-1 flex min-h-5 items-center gap-2" role="status" aria-live="polite">
                                <span class="h-2 w-2 shrink-0 animate-pulse rounded-full bg-blue-600" aria-hidden="true"></span>
                                <div class="loading-step-rotator relative min-h-5 min-w-[13rem] overflow-hidden text-xs font-semibold text-blue-800">
                                    {#each LOADING_STEPS as step, index}
                                        <span class="loading-step absolute left-0 top-0 whitespace-nowrap" style={`animation-delay: ${index * 1.8}s`}>
                                            {step}
                                        </span>
                                    {/each}
                                </div>
                            </div>
                        </div>
                        <span class="inline-flex shrink-0 items-center gap-2 rounded-md border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-800">
                            <span class="h-2 w-2 animate-pulse rounded-full bg-blue-600" aria-hidden="true"></span>
                            In progress
                        </span>
                    </div>
                    <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100" aria-hidden="true">
                        <div class="loading-progress h-full w-1/3 rounded-full bg-blue-600"></div>
                    </div>
                </div>
                <div class="relative min-h-0 flex-1 overflow-hidden p-4">
                    <div class="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-gray-200">
                        <div class="grid shrink-0 grid-cols-[1fr_1.4fr_1.4fr_0.8fr] gap-3 border-b border-gray-200 bg-gray-50 px-3 py-2 text-[11px] font-bold uppercase text-gray-500">
                            <span>Field</span>
                            <span>Label</span>
                            <span>Application</span>
                            <span>Status</span>
                        </div>
                        <div class="min-h-0 flex-1 divide-y divide-gray-100 bg-white">
                            {#each Array(12) as _, index}
                                <div class="grid grid-cols-[1fr_1.4fr_1.4fr_0.8fr] gap-3 px-3 py-3">
                                    <div class="h-3 animate-pulse rounded bg-gray-200 {index % 3 === 0 ? 'w-24' : 'w-32'}"></div>
                                    <div class="h-3 animate-pulse rounded bg-gray-100 {index % 2 === 0 ? 'w-36' : 'w-48'}"></div>
                                    <div class="h-3 w-40 animate-pulse rounded bg-gray-100"></div>
                                    <div class="h-6 w-20 animate-pulse rounded-full bg-gray-100"></div>
                                </div>
                            {/each}
                        </div>
                    </div>
                    <div class="pointer-events-none absolute inset-x-4 bottom-4 h-28 rounded-b-md bg-gradient-to-t from-white via-white/85 to-transparent" aria-hidden="true"></div>
                </div>
            </div>
        {:else if error}
            <div class="flex min-h-0 flex-1 flex-col justify-center p-5">
                <h2 class="text-sm font-bold text-red-900">Verification Error</h2>
                <p class="mt-1 text-sm text-red-800">{error}</p>
            </div>
            <div class="h-[190px] shrink-0 border-t bg-red-50 px-3 py-2 text-sm font-medium text-red-800">Retry after checking the API response or network connection.</div>
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
