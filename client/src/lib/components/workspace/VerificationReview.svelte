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
    import {
        BEVERAGE_FIELD_SETS,
        REQUIREMENT_BADGE,
    } from '$lib/utils/beverage-fields'
    import type { BeverageFieldDef, BeverageType } from '$lib/utils/beverage-fields'

    let {
        result,
        loading,
        comparing = false,
        error,
        mode = 'body',
        beverageType = 'distilled_spirits' as BeverageType,
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
        onSelectedFieldChange?: (fieldName: string | null) => void
        onExport?: (decisions: ReviewDecisions) => void
        onMarkAllReviewed?: (decisions: ReviewDecisions) => void
    } = $props()

    const GOVERNMENT_WARNING_REQUIRED =
        'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.'

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

    let issueFields = $derived(
        visibleFields.filter((f) => f.status !== 'pass')
    )

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
                            class="sticky top-0 z-10 border-b border-gray-300 bg-gray-100 text-[11px] font-bold text-gray-600 shadow-sm"
                        >
                            <tr>
                                <th class="w-[18%] px-3 py-2">Field</th>
                                <th class="w-[32%] px-3 py-2"
                                    >Label (extracted)</th
                                >
                                <th class="w-[32%] px-3 py-2">
                                    <span>Application (provided)</span>
                                    {#if isExtractionOnly}
                                        <span
                                            class="mt-0.5 block text-[11px] font-medium italic text-gray-400"
                                        >
                                            No application data — extraction only
                                        </span>
                                    {/if}
                                </th>
                                <th class="w-[13%] px-3 py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            {#each visibleFields as field}
                                {@const selected =
                                    selectedField?.fieldName ===
                                    field.fieldName}
                                {@const expanded =
                                    expandedFields[field.fieldName] === true}
                                {@const fieldDef = fieldDefMap.get(field.fieldName)}
                                <tr
                                    class="hover:cursor-pointer {selected
                                        ? 'bg-blue-50'
                                        : 'bg-white hover:bg-slate-50'} align-top transition-colors focus-within:bg-blue-50"
                                    style="box-shadow: inset 3px 0 0 {selected
                                        ? '#3b82f6'
                                        : 'transparent'};"
                                    onclick={() => toggleExpanded(field)}
                                >
                                    <td class="px-3 py-1.5">
                                        <button
                                            type="button"
                                            class="flex w-full items-start h-full gap-2 text-left focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                            onclick={() => selectField(field)}
                                            title={formatFieldName(
                                                field.fieldName
                                            )}
                                        >
                                            <span
                                                class="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm bg-blue-500"
                                                aria-hidden="true"
                                            ></span>
                                            <span class="min-w-0">
                                                <span class="block truncate text-sm font-semibold text-gray-950"
                                                    >{formatFieldName(
                                                        field.fieldName
                                                    )}</span
                                                >
                                                {#if fieldDef && fieldDef.requirement !== 'required'}
                                                    <span class="mt-0.5 inline-block rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] font-normal text-gray-400">
                                                        {REQUIREMENT_BADGE[fieldDef.requirement]}
                                                    </span>
                                                {/if}
                                            </span>
                                        </button>
                                    </td>
                                    <td
                                        class="px-3 py-1.5 text-xs leading-5 text-gray-800 flex items-center h-full"
                                    >
                                        <span
                                            class="line-clamp-2 break-words h-full flex items-center"
                                            >{displayValue(
                                                field.foundValue
                                            )}</span
                                        >
                                    </td>
                                    <td class="px-3 py-1.5 text-xs leading-5">
                                        {#if isExtractionOnly}
                                            <span class="sr-only">
                                                No application data provided
                                            </span>
                                        {:else if field.expectedValue}
                                            <span
                                                class="line-clamp-2 break-words text-gray-800 flex items-center h-full"
                                                >{field.expectedValue}</span
                                            >
                                        {:else}
                                            <span
                                                class="italic text-gray-400 flex items-center h-full"
                                                >Not provided</span
                                            >
                                        {/if}
                                    </td>
                                    <td class="px-3 py-1.5">
                                        <div class="flex items-center h-full">
                                            {#if isOptionalNotFound(field)}
                                                <span class="rounded border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                                                    N/A
                                                </span>
                                            {:else}
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
                                        class="bg-blue-50"
                                        style="box-shadow: inset 3px 0 0 #3b82f6;"
                                    >
                                        <td
                                            colspan="4"
                                            class="border-t px-4 py-3"
                                        >
                                            <div
                                                class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_9rem]"
                                            >
                                                <div class="min-w-0">
                                                    <span
                                                        class="mb-1.5 block text-[10px] font-bold uppercase text-gray-500"
                                                        >Review notes</span
                                                    >
                                                    <div
                                                        class="rounded-md border border-blue-200 bg-white/80 px-3 py-2 text-xs leading-5 text-gray-700"
                                                    >
                                                        {reviewNote(field)}
                                                    </div>
                                                    <label class="mt-2 block">
                                                        <span
                                                            class="sr-only"
                                                            >Agent comment</span
                                                        >
                                                        <input
                                                            type="text"
                                                            class="h-9 w-full rounded border border-gray-300 bg-white px-3 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                                            placeholder="Agent comment (optional)"
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
                                                        />
                                                    </label>
                                                </div>
                                                <div
                                                    class="flex flex-col justify-center gap-2"
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        class="border-gray-300 bg-white text-gray-800 hover:bg-gray-50 {decisionFor(
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
                                                        class="bg-amber-600 text-white hover:bg-amber-700 {decisionFor(
                                                            field.fieldName
                                                        ) === 'escalated'
                                                            ? 'ring-2 ring-amber-400'
                                                            : ''}"
                                                        onclick={() =>
                                                            setDecision(
                                                                field.fieldName,
                                                                'escalated'
                                                            )}
                                                        >Escalate</Button
                                                    >
                                                </div>
                                            </div>
                                            <!-- {#if field.fieldName === 'governmentWarning' || (governmentWarning !== null && governmentWarning.status !== 'pass')}
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
                                            {/if} -->
                                        </td>
                                    </tr>
                                {/if}
                            {/each}
                        </tbody>
                    </table>
                </div>
            {/if}
        {:else if loading}
            <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div
                    class="border-b border-blue-100 bg-blue-50/70 px-4 py-3"
                >
                    <div class="flex items-center justify-between gap-3">
                        <div class="min-w-0">
                            <p class="text-sm font-bold text-blue-950">
                                Processing label image
                            </p>
                            <p class="mt-0.5 text-xs font-medium text-blue-800">
                                Extracting required fields and preparing the
                                review table.
                            </p>
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
                    <div class="mt-3 grid gap-2 sm:grid-cols-3">
                        {#each ['Reading label', 'Extracting fields', 'Checking rules'] as step}
                            <div
                                class="rounded border border-blue-100 bg-white px-3 py-2"
                            >
                                <div class="flex items-center gap-2">
                                    <span
                                        class="h-2 w-2 animate-pulse rounded-full bg-blue-500"
                                        aria-hidden="true"
                                    ></span>
                                    <span
                                        class="text-xs font-semibold text-gray-800"
                                    >
                                        {step}
                                    </span>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
                <div class="min-h-0 flex-1 overflow-hidden p-4">
                    <div
                        class="overflow-hidden rounded-md border border-gray-200"
                    >
                        <div
                            class="grid grid-cols-[1fr_1.4fr_1.4fr_0.8fr] gap-3 border-b border-gray-200 bg-gray-50 px-3 py-2 text-[11px] font-bold uppercase text-gray-500"
                        >
                            <span>Field</span>
                            <span>Label</span>
                            <span>Application</span>
                            <span>Status</span>
                        </div>
                        <div class="divide-y divide-gray-100 bg-white">
                            {#each Array(7) as _, index}
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
                </div>
            </div>
            <div
                class="h-[190px] shrink-0 border-t bg-gray-50 px-4 py-3"
            >
                <p class="text-xs font-bold uppercase text-gray-500">
                    Selected Issue Details
                </p>
                <div class="mt-3 space-y-2">
                    <div
                        class="h-3 w-48 animate-pulse rounded bg-gray-200"
                    ></div>
                    <div
                        class="h-3 w-3/4 animate-pulse rounded bg-gray-100"
                    ></div>
                    <div
                        class="h-3 w-2/3 animate-pulse rounded bg-gray-100"
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
