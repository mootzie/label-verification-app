<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from '$lib/components/ui/card'
    import { Badge } from '$lib/components/ui/badge'
    import { Button } from '$lib/components/ui/button'
    import {
        OVERALL_LABEL,
        borderCls,
        formatFieldName,
    } from '$lib/utils/compliance-logic'
    import FieldFeedback from './FieldFeedback.svelte'
    import type {
        VerificationResult,
        BatchLabelItem,
        FieldResult,
    } from '$shared/index'

    let {
        brandName = $bindable(),
        producerName = $bindable(),
        beverageType = $bindable(),
        classType = $bindable(),
        producerAddress = $bindable(),
        countryOfOrigin = $bindable(),
        alcoholContent = $bindable(),
        netContents = $bindable(),
        locked,
        result,
        jobId,
        loading,
        submitting,
        files,
        brandHistory,
        producerHistory,
        addressHistory,
        fieldResultMap,
        onToggleLock,
        onSubmit,
        statusIcon,
        compact = false,
    }: {
        brandName: string
        producerName: string
        beverageType: string
        classType: string
        producerAddress: string
        countryOfOrigin: string
        alcoholContent: string
        netContents: string
        locked: Set<string>
        result: VerificationResult | null
        jobId: string | null
        loading: boolean
        submitting: boolean
        files: File[]
        brandHistory: string[]
        producerHistory: string[]
        addressHistory: string[]
        fieldResultMap: Map<string, FieldResult>
        onToggleLock: (field: string) => void
        onSubmit: (e: Event) => void
        statusIcon: any
        compact?: boolean
    } = $props()

    let inputBase = $derived(
        compact
            ? 'w-full rounded border px-2.5 h-9 text-sm text-gray-900 focus:outline-none focus:ring-1 transition-colors'
            : 'w-full rounded-md border px-3 h-11 text-base text-gray-900 focus:outline-none focus:ring-1 transition-colors'
    )
    let fieldGap = $derived(compact ? 'gap-3' : result ? 'gap-3' : 'gap-8')
    let formSpacing = $derived(compact ? 'space-y-3' : result ? 'space-y-3' : 'space-y-8')
    let labelClass = $derived(
        compact
            ? 'text-xs font-bold uppercase text-gray-600'
            : 'font-semibold text-gray-800 tracking-tight'
    )
    const primaryFields = [
        'brandName',
        'beverageType',
        'classType',
        'alcoholContent',
        'netContents',
        'producerName',
        'producerAddress',
        'countryOfOrigin',
    ]

    // Field was checked by Claude and passed
    function isPass(fieldName: string) {
        return (
            result !== null && fieldResultMap.get(fieldName)?.status === 'pass'
        )
    }
    // Field exists in form but Claude didn't return a result for it (e.g. beverageType)
    function isUnchecked(fieldName: string) {
        return result !== null && !fieldResultMap.has(fieldName)
    }
    // Field is empty and unchecked — hide it in results mode (e.g. unused countryOfOrigin)
    function shouldHide(fieldName: string, value: string) {
        return (
            result !== null &&
            value.trim() === '' &&
            !fieldResultMap.has(fieldName)
        )
    }
    // Truncate long Claude notes to keep them scannable
    function truncNote(notes: string | null | undefined, max = 110): string {
        if (!notes) return ''
        return notes.length > max ? notes.slice(0, max).trimEnd() + '…' : notes
    }

    let canSubmit = $derived(
        files.length > 0 &&
            !loading &&
            !submitting &&
            jobId === null
    )

    function getOS() {
        const nav = navigator as Navigator & {
            userAgentData?: { platform?: string }
        }
        // 1. Check the modern User-Agent Client Hints API (Chromium-based browsers)
        if (nav.userAgentData?.platform) {
            const platform = nav.userAgentData.platform.toLowerCase()
            if (platform.includes('windows')) return 'windows'
            if (platform.includes('macos')) return 'mac'
        }

        // 2. Fallback to traditional User-Agent sniffing (Safari, Firefox, and older versions)
        const userAgent = navigator.userAgent.toLowerCase()
        if (userAgent.includes('win')) return 'windows'
        if (userAgent.includes('mac')) return 'mac'

        return 'unknown'
    }

    let os = getOS()

    let showSubmitModal = $state(false)

    function handleSubmitClick(e: Event) {
        if (result?.overallStatus === 'pass') {
            e.preventDefault()
            showSubmitModal = true
            setTimeout(() => {
                showSubmitModal = false
            }, 1800)
        }
    }
</script>

<!-- Compact pass row for primary fields -->
{#snippet passRow(label: string, fieldName: string)}
    {@const fr = fieldResultMap.get(fieldName)}
    <div
        class="flex items-center justify-between rounded-md border border-green-100 bg-green-50/20 px-3 py-2.5 gap-3 min-w-0"
    >
        <span class="text-sm font-semibold text-gray-600 shrink-0">{label}</span
        >
        <div class="flex items-center gap-2 min-w-0">
            <span class="text-xs text-gray-500 truncate"
                >{fr?.foundValue ?? '—'}</span
            >
            <svg
                class="h-4 w-4 text-green-600 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
                ><path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clip-rule="evenodd"
                /></svg
            >
        </div>
    </div>
{/snippet}

<!-- Neutral row: Claude used this field as context but didn't verify it against the label -->
{#snippet neutralRow(label: string, value: string)}
    <div
        class="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50/40 px-3 py-2.5 gap-3 min-w-0"
    >
        <span class="text-sm font-semibold text-gray-600 shrink-0">{label}</span
        >
        <span class="text-xs text-gray-400 capitalize"
            >{value.replace(/_/g, ' ')}</span
        >
    </div>
{/snippet}

<!-- Status badge inline with a field label -->
{#snippet fieldBadge(fieldName: string)}
    {@const fr = fieldResultMap.get(fieldName)}
    {#if fr && fr.status !== 'pass'}
        <Badge variant={fr.status} class="text-xs font-bold"
            >{fr.status.replace('_', ' ')}</Badge
        >
    {/if}
{/snippet}

<form onsubmit={onSubmit} autocomplete="off" class="flex flex-col">
    <Card
        class="{compact
            ? 'border-gray-200 shadow-sm'
            : 'border-gray-200 transition-all shadow-lg h-full'} {result
            ? 'ring-1 ring-black/5'
            : ''}"
    >
        <CardHeader class="{compact ? 'py-3' : 'py-5'} border-b border-gray-200 bg-white">
            <div class="flex items-center justify-between gap-4">
                <div class="flex flex-col gap-1.5">
                    <CardTitle class="{compact ? 'text-sm' : 'text-xl'} font-bold text-gray-950"
                        >{compact ? 'Application Data' : 'Label Verification'}</CardTitle
                    >
                    {#if result}
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-xs font-semibold text-green-700">
                                {result.fields.filter(
                                    (f) => f.status === 'pass'
                                ).length} passed
                            </span>
                            <span class="text-gray-300">·</span>
                            <span class="text-xs font-semibold text-amber-600">
                                {result.fields.filter(
                                    (f) => f.status === 'warning'
                                ).length} warnings
                            </span>
                            <span class="text-gray-300">·</span>
                            <span class="text-xs font-semibold text-red-600">
                                {result.fields.filter(
                                    (f) =>
                                        f.status === 'fail' ||
                                        f.status === 'not_found'
                                ).length} failed
                            </span>
                            <span class="text-gray-300">·</span>
                            <span class="text-xs text-gray-400"
                                >{result.processingTimeMs}ms</span
                            >
                        </div>
                    {:else}
                        <p class="{compact ? 'text-xs' : 'text-sm'} text-gray-600 font-medium">
                            {compact
                                ? 'Optional values used for comparison when available'
                                : 'Optional application data for comparison'}
                        </p>
                    {/if}
                </div>
                {#if result}
                    <Badge
                        variant={result.overallStatus}
                        class="px-3 py-1 text-xs font-bold shrink-0"
                    >
                        {OVERALL_LABEL[result.overallStatus]}
                    </Badge>
                {/if}
            </div>
        </CardHeader>

        <CardContent class="{compact ? 'p-3' : 'p-6'} min-w-0 bg-white">
            <!-- ── Automatic checks (government warning, state of distillation, etc.)  -->
            <!-- Shown at top so agent sees auto-detected issues immediately             -->
            {#if result && !compact}
                {@const autoChecks = result.fields.filter(
                    (f) => !primaryFields.includes(f.fieldName)
                )}
                {#if autoChecks.length > 0}
                    <div class="mb-5 space-y-2">
                        <p
                            class="text-xs font-bold uppercase tracking-wider text-gray-400"
                        >
                            Automatic Checks
                        </p>
                        {#each autoChecks as fr}
                            {#if fr.status === 'pass'}
                                <div
                                    class="flex items-center justify-between rounded-md border border-green-100 bg-green-50/20 px-3 py-2.5 gap-3"
                                >
                                    <span
                                        class="text-sm font-semibold text-gray-600"
                                        >{formatFieldName(fr.fieldName)}</span
                                    >
                                    <div
                                        class="flex items-center gap-2 min-w-0"
                                    >
                                        <span
                                            class="text-xs text-gray-500 truncate max-w-[200px]"
                                            >{fr.foundValue ?? '—'}</span
                                        >
                                        <svg
                                            class="h-4 w-4 text-green-600 shrink-0"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            ><path
                                                fill-rule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                                clip-rule="evenodd"
                                            /></svg
                                        >
                                    </div>
                                </div>
                            {:else}
                                <div
                                    class="rounded-lg border-l-4 {fr.status ===
                                    'warning'
                                        ? 'border-l-amber-400 border border-amber-200 bg-amber-50/30'
                                        : 'border-l-red-500 border border-red-200 bg-red-50/30'} px-4 py-3 space-y-2"
                                >
                                    <div
                                        class="flex items-center justify-between gap-2"
                                    >
                                        <span
                                            class="text-sm font-bold text-gray-900"
                                            >{formatFieldName(
                                                fr.fieldName
                                            )}</span
                                        >
                                        <Badge
                                            variant={fr.status}
                                            class="text-xs font-bold shrink-0"
                                            >{fr.status.replace(
                                                '_',
                                                ' '
                                            )}</Badge
                                        >
                                    </div>
                                    {#if fr.foundValue}
                                        <div
                                            class="grid grid-cols-[min-content_1fr] gap-2 text-xs"
                                        >
                                            <span
                                                class="font-bold uppercase tracking-wide text-gray-500 w-12 shrink-0"
                                                >Found</span
                                            >
                                            <span
                                                class="text-gray-800 font-medium"
                                                >{fr.foundValue}</span
                                            >
                                        </div>
                                    {/if}
                                    {#if fr.notes}
                                        <div
                                            class="flex gap-2 text-xs border-t border-gray-200/60 pt-2"
                                        >
                                            <span
                                                class="font-bold uppercase tracking-wide text-gray-500 w-12 shrink-0"
                                                >Why</span
                                            >
                                            <span class="text-gray-700"
                                                >{truncNote(fr.notes)}</span
                                            >
                                        </div>
                                    {/if}
                                </div>
                            {/if}
                        {/each}
                    </div>
                    <div class="border-t border-gray-100 mb-5"></div>
                {/if}
            {/if}

            <!-- ── Form fields ──────────────────────────────────────────────────────── -->
            <div class={formSpacing}>
                {#if !result && !compact}
                    <div class="flex items-center justify-between">
                        <p class="text-sm text-gray-600">
                            Application data is optional. Uploading a label starts extraction.
                        </p>
                        <p class="text-xs text-gray-500">
                            Press
                            <kbd
                                class="rounded border border-gray-200 bg-gray-100 px-1 py-0.5 font-mono text-xs"
                            >
                                {#if os === 'mac'}
                                    ⌘ + V
                                {:else}
                                    Ctrl + V
                                {/if}
                            </kbd>
                            to paste application data
                        </p>
                    </div>
                {/if}

                <!-- Brand Name + Producer Name -->
                <div
                    class="grid grid-cols-1 md:grid-cols-2 {fieldGap}"
                >
                    {#if isPass('brandName')}
                        {@render passRow('Brand Name', 'brandName')}
                    {:else}
                        <div>
                            <div class="mb-1.5 flex items-center gap-2">
                                <label
                                    for="brandName"
                                    class={labelClass}
                                    >Brand Name</label
                                >
                                {#if result}{@render fieldBadge(
                                        'brandName'
                                    )}{/if}
                            </div>
                            <div class="relative">
                                <input
                                    id="brandName"
                                    type="text"
                                    bind:value={brandName}
                                    list="brands-list"
                                    autocomplete="off"
                                    disabled={!!jobId || loading}
                                    class="{inputBase} {borderCls(
                                        fieldResultMap,
                                        'brandName'
                                    )}"
                                />
                                {@render statusIcon('brandName')}
                            </div>
                            {#if result}<FieldFeedback
                                    fr={fieldResultMap.get('brandName')}
                                />{/if}
                        </div>
                    {/if}

                    {#if isPass('producerName')}
                        {@render passRow('Producer Name', 'producerName')}
                    {:else}
                        <div>
                            <div
                                class="mb-1.5 flex items-center justify-between"
                            >
                                <div class="flex items-center gap-2">
                                    <label
                                        for="producerName"
                                        class={labelClass}
                                        >Producer Name</label
                                    >
                                    {#if result}{@render fieldBadge(
                                            'producerName'
                                        )}{/if}
                                </div>
                                <label
                                    class="flex items-center gap-1.5 cursor-pointer select-none text-xs text-gray-500"
                                    ><input
                                        type="checkbox"
                                        checked={locked.has('producerName')}
                                        onchange={() =>
                                            onToggleLock('producerName')}
                                        class="h-3.5 w-3.5 rounded border-gray-300"
                                    /> Keep</label
                                >
                            </div>
                            <div class="relative">
                                <input
                                    id="producerName"
                                    type="text"
                                    bind:value={producerName}
                                    list="producers-list"
                                    autocomplete="off"
                                    disabled={!!jobId || loading}
                                    class="{inputBase} {borderCls(
                                        fieldResultMap,
                                        'producerName'
                                    )}"
                                />
                                {@render statusIcon('producerName')}
                            </div>
                            {#if result}<FieldFeedback
                                    fr={fieldResultMap.get('producerName')}
                                />{/if}
                        </div>
                    {/if}
                </div>

                <!-- Beverage Type + Class/Type -->
                <div
                    class="grid grid-cols-1 md:grid-cols-2 {fieldGap}"
                >
                    <!-- Beverage type: Claude uses it as context but doesn't verify it against the label -->
                    {#if result}
                        {@render neutralRow('Beverage Type', beverageType)}
                    {:else}
                        <div>
                            <label
                                for="beverageType"
                                class="mb-1.5 block {labelClass}"
                                >Beverage Type</label
                            >
                            <select
                                id="beverageType"
                                bind:value={beverageType}
                                disabled={!!jobId || loading}
                                class="{inputBase} {borderCls(
                                    fieldResultMap,
                                    'beverageType'
                                )}"
                            >
                                <option value="">Select type</option>
                                <option value="beer">Beer</option>
                                <option value="wine">Wine</option>
                                <option value="distilled_spirits"
                                    >Distilled Spirits</option
                                >
                            </select>
                        </div>
                    {/if}

                    {#if isPass('classType')}
                        {@render passRow('Class / Type', 'classType')}
                    {:else}
                        <div>
                            <div class="mb-1.5 flex items-center gap-2">
                                <label
                                    for="classType"
                                    class={labelClass}
                                    >Class / Type</label
                                >
                                {#if result}{@render fieldBadge(
                                        'classType'
                                    )}{/if}
                            </div>
                            <div class="relative">
                                <input
                                    id="classType"
                                    type="text"
                                    placeholder="e.g. Bourbon Whiskey"
                                    bind:value={classType}
                                    disabled={!!jobId || loading}
                                    class="{inputBase} {borderCls(
                                        fieldResultMap,
                                        'classType'
                                    )}"
                                />
                                {@render statusIcon('classType')}
                            </div>
                            {#if result}<FieldFeedback
                                    fr={fieldResultMap.get('classType')}
                                />{/if}
                        </div>
                    {/if}
                </div>

                <!-- Producer Address -->
                {#if isPass('producerAddress')}
                    {@render passRow('Producer Address', 'producerAddress')}
                {:else}
                    <div>
                        <div class="mb-1.5 flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <label
                                    for="producerAddress"
                                    class={labelClass}
                                    >Producer Address</label
                                >
                                {#if result}{@render fieldBadge(
                                        'producerAddress'
                                    )}{/if}
                            </div>
                            <label
                                class="flex items-center gap-1.5 cursor-pointer select-none text-xs text-gray-500"
                                ><input
                                    type="checkbox"
                                    checked={locked.has('producerAddress')}
                                    onchange={() =>
                                        onToggleLock('producerAddress')}
                                    class="h-3.5 w-3.5 rounded border-gray-300"
                                /> Keep</label
                            >
                        </div>
                        <div class="relative">
                            <input
                                id="producerAddress"
                                type="text"
                                bind:value={producerAddress}
                                list="addresses-list"
                                autocomplete="off"
                                disabled={!!jobId || loading}
                                class="{inputBase} {borderCls(
                                    fieldResultMap,
                                    'producerAddress'
                                )}"
                            />
                            {@render statusIcon('producerAddress')}
                        </div>
                        {#if result}<FieldFeedback
                                fr={fieldResultMap.get('producerAddress')}
                            />{/if}
                    </div>
                {/if}

                <!-- Country of Origin: hide when blank and not in results -->
                {#if !shouldHide('countryOfOrigin', countryOfOrigin)}
                    {#if isPass('countryOfOrigin')}
                        {@render passRow(
                            'Country of Origin',
                            'countryOfOrigin'
                        )}
                    {:else}
                        <div>
                            <div class="mb-1.5 flex items-center gap-2">
                                <label
                                    for="countryOfOrigin"
                                    class={labelClass}
                                    >Country of Origin</label
                                >
                                <span class="text-xs font-normal text-gray-500"
                                    >Required for imported products</span
                                >
                                {#if result}{@render fieldBadge(
                                        'countryOfOrigin'
                                    )}{/if}
                            </div>
                            <div class="relative">
                                <input
                                    id="countryOfOrigin"
                                    type="text"
                                    placeholder="e.g. France"
                                    bind:value={countryOfOrigin}
                                    disabled={!!jobId || loading}
                                    class="{inputBase} {borderCls(
                                        fieldResultMap,
                                        'countryOfOrigin'
                                    )}"
                                />
                                {@render statusIcon('countryOfOrigin')}
                            </div>
                            {#if result}<FieldFeedback
                                    fr={fieldResultMap.get('countryOfOrigin')}
                                />{/if}
                        </div>
                    {/if}
                {/if}

                <!-- Alcohol Content + Net Contents -->
                <div
                    class="grid grid-cols-1 md:grid-cols-2 {fieldGap}"
                >
                    {#if isPass('alcoholContent')}
                        {@render passRow('Alcohol Content', 'alcoholContent')}
                    {:else}
                        <div>
                            <div class="mb-1.5 flex items-center gap-2">
                                <label
                                    for="alcoholContent"
                                    class={labelClass}
                                    >Alcohol Content</label
                                >
                                {#if result}{@render fieldBadge(
                                        'alcoholContent'
                                    )}{/if}
                            </div>
                            <div class="relative">
                                <input
                                    id="alcoholContent"
                                    type="text"
                                    placeholder="e.g. 12.5%"
                                    bind:value={alcoholContent}
                                    disabled={!!jobId || loading}
                                    class="{inputBase} {borderCls(
                                        fieldResultMap,
                                        'alcoholContent'
                                    )}"
                                />
                                {@render statusIcon('alcoholContent')}
                            </div>
                            {#if result}<FieldFeedback
                                    fr={fieldResultMap.get('alcoholContent')}
                                />{/if}
                        </div>
                    {/if}

                    {#if isPass('netContents')}
                        {@render passRow('Net Contents', 'netContents')}
                    {:else}
                        <div>
                            <div class="mb-1.5 flex items-center gap-2">
                                <label
                                    for="netContents"
                                    class={labelClass}
                                    >Net Contents</label
                                >
                                {#if result}{@render fieldBadge(
                                        'netContents'
                                    )}{/if}
                            </div>
                            <div class="relative">
                                <input
                                    id="netContents"
                                    type="text"
                                    placeholder="e.g. 750 mL"
                                    bind:value={netContents}
                                    disabled={!!jobId || loading}
                                    class="{inputBase} {borderCls(
                                        fieldResultMap,
                                        'netContents'
                                    )}"
                                />
                                {@render statusIcon('netContents')}
                            </div>
                            {#if result}<FieldFeedback
                                    fr={fieldResultMap.get('netContents')}
                                />{/if}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Submit button -->
            {#if !jobId}
                <div class="{compact ? 'mt-3 pt-3' : 'mt-6 pt-4'} border-t border-gray-100">
                    {#if result?.overallStatus === 'pass'}
                        <Button
                            type="button"
                            onclick={handleSubmitClick}
                            class="w-full {compact ? 'h-9' : 'h-12'} text-sm font-semibold tracking-wider shadow-sm transition-all hover:translate-y-[-1px] bg-green-600 hover:bg-green-700 text-white"
                        >
                            Submit to COLA System
                        </Button>
                    {:else}
                        <Button
                            type="submit"
                            disabled={!canSubmit}
                            class="w-full {compact ? 'h-9' : 'h-12'} text-sm font-semibold tracking-wider shadow-sm transition-all hover:translate-y-[-1px]"
                        >
                            {#if loading || submitting}
                                <svg
                                    class="mr-2 h-4 w-4 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    ><circle
                                        class="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        stroke-width="4"
                                    ></circle><path
                                        class="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                    ></path></svg
                                >Verifying…
                            {:else if result}
                                Re-analyze Label
                            {:else if files.length > 1}
                                Start Batch ({files.length} labels)
                            {:else}
                                Analyze Label
                            {/if}
                        </Button>
                    {/if}
                </div>
            {/if}
        </CardContent>
    </Card>
</form>

<!-- COLA submission modal -->
{#if showSubmitModal}
    <div
        role="presentation"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Submitted"
            tabindex="-1"
            class="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-2xl"
        >
            <svg
                class="h-12 w-12 text-green-600"
                viewBox="0 0 20 20"
                fill="currentColor"
            >
                <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clip-rule="evenodd"
                />
            </svg>
        </div>
    </div>
{/if}
