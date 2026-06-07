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

    let {
        result,
        loading,
        comparing = false,
        error,
        mode = 'body',
        onSelectedFieldChange,
        onExport,
        onMarkAllReviewed,
    }: {
        result: VerificationResult | null
        loading: boolean
        comparing?: boolean
        error: string | null
        mode?: 'banner' | 'body'
        onSelectedFieldChange?: (fieldName: string | null) => void
        onExport?: (decisions: ReviewDecisions) => void
        onMarkAllReviewed?: (decisions: ReviewDecisions) => void
    } = $props()

    const GOVERNMENT_WARNING_REQUIRED =
        'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.'

    const FIELD_COLORS: Record<string, string> = {
        brandName: '#3b82f6',
        producerName: '#f59e0b',
        classType: '#22c55e',
        beverageType: '#06b6d4',
        alcoholContent: '#8b5cf6',
        netContents: '#eab308',
        producerAddress: '#14b8a6',
        governmentWarning: '#ef4444',
        stateOfDistillation: '#f97316',
    }

    // const INSPECTOR_TONE: Record<FieldStatus, string> = {
    //     pass: 'border-green-500 bg-green-50/60',
    //     warning: 'border-amber-500 bg-amber-50/75',
    //     fail: 'border-red-500 bg-red-50/75',
    //     not_found: 'border-gray-500 bg-gray-50',
    // }

    type DraftField = {
        foundValue: string
        expectedValue: string
        note: string
    }

    let selectedFieldName = $state<string | null>(null)
    let expandedFieldName = $state<string | null>(null)
    let drafts = $state<Record<string, DraftField>>({})
    let decisions = $state<ReviewDecisions>({})
    let markAllMessage = $state<string | null>(null)

    // Reset decisions when result reference changes (new label loaded)
    let _lastResultRef = $state<VerificationResult | null>(null)
    $effect(() => {
        if (result !== _lastResultRef) {
            decisions = {}
            markAllMessage = null
            _lastResultRef = result
        }
    })

    let issueFields = $derived(
        result?.fields.filter((f) => f.status !== 'pass') ?? []
    )

    let isExtractionOnly = $derived(
        result !== null &&
            result.fields.length > 0 &&
            result.fields.every((f) => f.expectedValue === null)
    )

    let selectedField = $derived.by(() => {
        if (!result) return null
        const preferred = selectedFieldName
            ? result.fields.find((f) => f.fieldName === selectedFieldName)
            : null
        return preferred ?? issueFields[0] ?? result.fields[0] ?? null
    })

    let governmentWarning = $derived(
        result?.fields.find((f) => f.fieldName === 'governmentWarning') ?? null
    )

    $effect(() => {
        if (mode !== 'body') return
        if (!result || result.fields.length === 0) {
            selectedFieldName = null
            expandedFieldName = null
            onSelectedFieldChange?.(null)
            return
        }
        if (
            !selectedFieldName ||
            !result.fields.some((f) => f.fieldName === selectedFieldName)
        ) {
            const next =
                issueFields[0]?.fieldName ?? result.fields[0]?.fieldName ?? null
            selectedFieldName = next
            expandedFieldName = next
            onSelectedFieldChange?.(next)
        }
    })

    function selectField(field: FieldResult) {
        selectedFieldName = field.fieldName
        onSelectedFieldChange?.(field.fieldName)
    }

    function toggleExpanded(field: FieldResult) {
        selectField(field)
        expandedFieldName =
            expandedFieldName === field.fieldName ? null : field.fieldName
        ensureDraft(field)
    }

    function ensureDraft(field: FieldResult) {
        if (drafts[field.fieldName]) return
        drafts = {
            ...drafts,
            [field.fieldName]: {
                foundValue: field.foundValue ?? '',
                expectedValue: field.expectedValue ?? '',
                note: field.notes ?? '',
            },
        }
    }

    function updateDraft(
        field: FieldResult,
        key: keyof DraftField,
        value: string
    ) {
        ensureDraft(field)
        drafts = {
            ...drafts,
            [field.fieldName]: {
                ...drafts[field.fieldName],
                [key]: value,
            },
        }
    }

    function draftFor(field: FieldResult): DraftField {
        return (
            drafts[field.fieldName] ?? {
                foundValue: field.foundValue ?? '',
                expectedValue: field.expectedValue ?? '',
                note: field.notes ?? '',
            }
        )
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

    function fieldColor(fieldName: string) {
        return FIELD_COLORS[fieldName] ?? '#64748b'
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
        if (status === 'pass') return '✓'
        if (status === 'warning') return '!'
        if (status === 'fail') return '×'
        return '—'
    }

    function displayValue(value: string | null | undefined) {
        const trimmed = value?.trim()
        return trimmed ? trimmed : 'Not found'
    }

    function compactValue(value: string | null | undefined) {
        const text = displayValue(value)
        return text.length > 160 ? `${text.slice(0, 160).trimEnd()}…` : text
    }

    function processingTimeText() {
        if (!result?.processingTimeMs) return '—'
        return `${(result.processingTimeMs / 1000).toFixed(1)}s`
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

    // function showGovernmentDetails() {
    //     return (
    //         selectedField?.fieldName === 'governmentWarning' ||
    //         (governmentWarning !== null && governmentWarning.status !== 'pass')
    //     )
    // }
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
                        {#if issueFields.length === 0}
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
                    Expand rows to edit values and record review action
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
            {#if result.fields.length === 0}
                <div
                    class="flex min-h-0 flex-1 items-center justify-center p-5 text-sm font-medium text-gray-600"
                >
                    The verifier returned no field checks. Try another label or
                    review the API response.
                </div>
            {:else}
                <div class="min-h-0 flex-1 overflow-auto">
                    <table
                        class="w-full min-w-[760px] table-fixed text-left text-sm h-full"
                    >
                        <thead
                            class="sticky top-0 z-10 border-b border-gray-300 bg-gray-100 text-[11px] font-bold uppercase text-gray-600 shadow-sm"
                        >
                            <tr>
                                <th class="w-[18%] px-3 py-2">Field</th>
                                <th class="w-[32%] px-3 py-2"
                                    >Label (Extracted)</th
                                >
                                <th class="w-[32%] px-3 py-2"
                                    >Application (Provided)</th
                                >
                                <th class="w-[13%] px-3 py-2">Status</th>
                                <!-- <th class="w-[5%] px-2 py-2 text-right">Edit</th
                                > -->
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            {#each result.fields as field}
                                {@const selected =
                                    selectedField?.fieldName ===
                                    field.fieldName}
                                {@const expanded =
                                    expandedFieldName === field.fieldName}
                                {@const color = fieldColor(field.fieldName)}
                                <tr
                                    class="{selected
                                        ? 'bg-blue-50'
                                        : 'bg-white hover:bg-slate-50'} align-top transition-colors focus-within:bg-blue-50"
                                    style="box-shadow: inset 3px 0 0 {selected
                                        ? color
                                        : 'transparent'};"
                                    onclick={() => toggleExpanded(field)}
                                >
                                    <td class="px-3 py-1.5">
                                        <button
                                            type="button"
                                            class="flex w-full items-center h-full gap-2 truncate text-left text-sm font-semibold text-gray-950 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                            onclick={() => selectField(field)}
                                            title={formatFieldName(
                                                field.fieldName
                                            )}
                                        >
                                            <span
                                                class="h-2.5 w-2.5 shrink-0 rounded-sm"
                                                style="background-color: {color};"
                                                aria-hidden="true"
                                            ></span>
                                            <span class="truncate"
                                                >{formatFieldName(
                                                    field.fieldName
                                                )}</span
                                            >
                                        </button>
                                    </td>
                                    <td
                                        class="px-3 py-1.5 text-xs leading-5 text-gray-800"
                                    >
                                        <span class="line-clamp-2 break-words"
                                            >{displayValue(
                                                field.foundValue
                                            )}</span
                                        >
                                    </td>
                                    <td class="px-3 py-1.5 text-xs leading-5">
                                        {#if field.expectedValue}
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
                                    <td class="px-3 py-1.5">
                                        <Badge
                                            variant={field.status}
                                            class="gap-1 border-0 px-2 py-0.5 text-[11px]"
                                        >
                                            <span aria-hidden="true"
                                                >{statusGlyph(
                                                    field.status
                                                )}</span
                                            >
                                            {STATUS_LABEL[field.status]}
                                        </Badge>
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
                                                    ) === 'accepted_variation'
                                                        ? 'Accepted'
                                                        : decisionFor(
                                                                field.fieldName
                                                            ) === 'escalated'
                                                          ? 'Escalated'
                                                          : 'Reviewed'}
                                                </span>
                                            </div>
                                        {/if}
                                    </td>
                                    <!-- <td class="px-2 py-1.5 text-right">
                                        <button
                                            type="button"
                                            class="rounded bg-transparent px-2 py-1 text-xs font-bold text-gray-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                            aria-expanded={expanded}
                                            aria-label="{expanded
                                                ? 'Collapse'
                                                : 'Expand'} {formatFieldName(
                                                field.fieldName
                                            )} review row"
                                            onclick={() =>
                                                toggleExpanded(field)}
                                        >
                                            {expanded ? '⌃' : '⌄'}
                                        </button>
                                    </td> -->
                                </tr>
                                {#if expanded}
                                    {@const draft = draftFor(field)}
                                    <tr
                                        class="bg-blue-50"
                                        style="box-shadow: inset 3px 0 0 {color};"
                                    >
                                        <td
                                            colspan="4"
                                            class="border-t px-3 py-2"
                                        >
                                            <div
                                                class="grid gap-2 lg:grid-cols-[1fr_1fr_1.1fr_auto]"
                                            >
                                                <label class="block">
                                                    <span
                                                        class="mb-1 block text-[10px] font-bold uppercase text-gray-500"
                                                        >Edit Extracted Value</span
                                                    >
                                                    <textarea
                                                        class="h-20 w-full resize-none rounded border border-gray-300 bg-white px-2 py-1.5 text-xs leading-5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                                        value={draft.foundValue}
                                                        oninput={(e) =>
                                                            updateDraft(
                                                                field,
                                                                'foundValue',
                                                                e.currentTarget
                                                                    .value
                                                            )}
                                                    ></textarea>
                                                </label>
                                                <label class="block">
                                                    <span
                                                        class="mb-1 block text-[10px] font-bold uppercase text-gray-500"
                                                        >Edit Application Value</span
                                                    >
                                                    <textarea
                                                        class="h-20 w-full resize-none rounded border border-gray-300 bg-white px-2 py-1.5 text-xs leading-5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                                        value={draft.expectedValue}
                                                        oninput={(e) =>
                                                            updateDraft(
                                                                field,
                                                                'expectedValue',
                                                                e.currentTarget
                                                                    .value
                                                            )}
                                                    ></textarea>
                                                </label>
                                                <label class="block">
                                                    <span
                                                        class="mb-1 block text-[10px] font-bold uppercase text-gray-500"
                                                        >Review Notes</span
                                                    >
                                                    <textarea
                                                        class="h-20 w-full resize-none rounded border border-gray-300 bg-white px-2 py-1.5 text-xs leading-5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                                        value={draft.note}
                                                        placeholder="Add review comment"
                                                        oninput={(e) =>
                                                            updateDraft(
                                                                field,
                                                                'note',
                                                                e.currentTarget
                                                                    .value
                                                            )}
                                                    ></textarea>
                                                </label>
                                                <div
                                                    class="flex min-w-[9rem] flex-col justify-end gap-2"
                                                >
                                                    {#if field.status === 'warning' || field.status === 'fail'}
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            class="border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 {decisionFor(
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
                                                            >Accept Variation</Button
                                                        >
                                                    {/if}
                                                    <!-- <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        class="justify-start text-gray-700 hover:bg-gray-100 {decisionFor(
                                                            field.fieldName
                                                        ) === 'reviewed'
                                                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                                            : ''}"
                                                        onclick={() =>
                                                            setDecision(
                                                                field.fieldName,
                                                                'reviewed'
                                                            )}
                                                        >Mark Reviewed</Button
                                                    > -->
                                                    {#if field.status !== 'pass'}
                                                        <Button
                                                            size="sm"
                                                            class="bg-blue-900 hover:bg-blue-800 {decisionFor(
                                                                field.fieldName
                                                            ) === 'escalated'
                                                                ? 'ring-2 ring-red-400'
                                                                : ''}"
                                                            onclick={() =>
                                                                setDecision(
                                                                    field.fieldName,
                                                                    'escalated'
                                                                )}
                                                            >Escalate</Button
                                                        >
                                                    {/if}
                                                </div>
                                            </div>
                                            {#if field.fieldName === 'governmentWarning' || (governmentWarning !== null && governmentWarning.status !== 'pass')}
                                                <div
                                                    class="mt-2 grid gap-2 border-t border-gray-200 pt-2 lg:grid-cols-2"
                                                >
                                                    <p
                                                        class="line-clamp-2 text-[11px] leading-4 text-gray-800"
                                                    >
                                                        <span
                                                            class="font-bold uppercase text-gray-500"
                                                            >Detected:</span
                                                        >
                                                        {normalizedWarning(
                                                            governmentWarning?.foundValue
                                                        ) ||
                                                            'Not found on label'}
                                                    </p>
                                                    <p
                                                        class="line-clamp-2 text-[11px] leading-4 text-gray-800"
                                                    >
                                                        <span
                                                            class="font-bold uppercase text-gray-500"
                                                            >Required:</span
                                                        >
                                                        {GOVERNMENT_WARNING_REQUIRED}
                                                    </p>
                                                </div>
                                            {/if}
                                        </td>
                                    </tr>
                                {/if}
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}

            <!-- <div
                class={`h-[190px] shrink-0 overflow-hidden border-l-4 border-t px-3 py-2 ${selectedField ? INSPECTOR_TONE[selectedField.status] : 'border-gray-300 bg-gray-50'}`}
                style="border-left-color: {selectedField
                    ? fieldColor(selectedField.fieldName)
                    : undefined};"
            >
                {#if selectedField}
                    <div class="flex h-full min-h-0 flex-col gap-2">
                        <div
                            class="flex shrink-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between"
                        >
                            <div class="min-w-0">
                                <div class="flex flex-wrap items-center gap-2">
                                    <h3
                                        class="truncate text-sm font-bold text-gray-950"
                                    >
                                        {formatFieldName(
                                            selectedField.fieldName
                                        )}
                                    </h3>
                                    <Badge
                                        variant={selectedField.status}
                                        class="border-0 px-2 py-0.5 text-[11px]"
                                    >
                                        {STATUS_LABEL[selectedField.status]}
                                    </Badge>
                                </div>
                                <p
                                    class="mt-0.5 truncate text-xs font-medium text-gray-700"
                                >
                                    {suggestedAction(selectedField)}
                                </p>
                            </div>
                            <div class="flex shrink-0 flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    title="Source region unavailable"
                                >
                                    View in Document
                                </Button>
                                {#if selectedField.status === 'warning'}
                                    <Button variant="outline" size="sm"
                                        >Accept Variation</Button
                                    >
                                {/if}
                                {#if selectedField.status !== 'pass'}
                                    <Button
                                        size="sm"
                                        class="bg-blue-900 hover:bg-blue-800"
                                        >Escalate</Button
                                    >
                                {:else}
                                    <Button
                                        size="sm"
                                        class="bg-blue-900 hover:bg-blue-800"
                                        >Mark as Reviewed</Button
                                    >
                                {/if}
                            </div>
                        </div>

                        <div
                            class="grid min-h-0 flex-1 gap-2 overflow-hidden lg:grid-cols-[1fr_1fr_1.15fr]"
                        >
                            <div
                                class="overflow-hidden rounded border border-current/15 bg-white/70 p-2"
                            >
                                <p
                                    class="mb-1 text-[10px] font-bold uppercase text-gray-500"
                                >
                                    Label Value
                                </p>
                                <p
                                    class="line-clamp-4 break-words text-xs font-medium leading-5 text-gray-900"
                                >
                                    {compactValue(selectedField.foundValue)}
                                </p>
                            </div>
                            <div
                                class="overflow-hidden rounded border border-current/15 bg-white/70 p-2"
                            >
                                <p
                                    class="mb-1 text-[10px] font-bold uppercase text-gray-500"
                                >
                                    Application Value
                                </p>
                                {#if selectedField.expectedValue}
                                    <p
                                        class="line-clamp-4 break-words text-xs font-medium leading-5 text-gray-900"
                                    >
                                        {compactValue(
                                            selectedField.expectedValue
                                        )}
                                    </p>
                                {:else}
                                    <p class="text-xs italic text-gray-400">
                                        Not provided
                                    </p>
                                {/if}
                            </div>
                            <div
                                class="overflow-hidden rounded border border-current/15 bg-white/70 p-2"
                            >
                                <p
                                    class="mb-1 text-[10px] font-bold uppercase text-gray-500"
                                >
                                    Why Flagged
                                </p>
                                <p
                                    class="line-clamp-4 break-words text-xs leading-5 text-gray-800"
                                >
                                    {issueReason(selectedField)}
                                </p>
                            </div>
                        </div>

                        {#if showGovernmentDetails()}
                            <div
                                class="grid shrink-0 gap-2 border-t border-current/15 pt-2 lg:grid-cols-2"
                            >
                                <p
                                    class="line-clamp-2 text-[11px] leading-4 text-gray-800"
                                >
                                    <span
                                        class="font-bold uppercase text-gray-500"
                                        >Detected:</span
                                    >
                                    {normalizedWarning(
                                        governmentWarning?.foundValue
                                    ) || 'Not found on label'}
                                </p>
                                <p
                                    class="line-clamp-2 text-[11px] leading-4 text-gray-800"
                                >
                                    <span
                                        class="font-bold uppercase text-gray-500"
                                        >Required:</span
                                    >
                                    {GOVERNMENT_WARNING_REQUIRED}
                                </p>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <div
                        class="flex h-full items-center text-sm font-medium text-gray-600"
                    >
                        Select a result row to review field details.
                    </div>
                {/if}
            </div> -->
        {:else if loading}
            <div class="flex min-h-0 flex-1 flex-col justify-center gap-3 p-5">
                <div class="h-3 w-40 animate-pulse rounded bg-gray-200"></div>
                <div class="h-20 animate-pulse rounded bg-gray-100"></div>
                <p class="text-sm font-medium text-gray-600">
                    Processing label image...
                </p>
            </div>
            <div
                class="h-[190px] shrink-0 border-t bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600"
            >
                Selected issue details will appear here.
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
