<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Badge } from '$lib/components/ui/badge';
    import { Button } from '$lib/components/ui/button';
    import { OVERALL_LABEL, borderCls } from '$lib/utils/compliance-logic';
    import FieldFeedback from './FieldFeedback.svelte';
    import type { VerificationResult, BatchLabelItem, FieldResult } from '$shared/index';

    let { 
        brandName = $bindable(),
        producerName = $bindable(),
        beverageType = $bindable(),
        producerAddress = $bindable(),
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
        statusIcon
    }: {
        brandName: string,
        producerName: string,
        beverageType: string,
        producerAddress: string,
        alcoholContent: string,
        netContents: string,
        locked: Set<string>,
        result: VerificationResult | null,
        jobId: string | null,
        loading: boolean,
        submitting: boolean,
        files: File[],
        brandHistory: string[],
        producerHistory: string[],
        addressHistory: string[],
        fieldResultMap: Map<string, FieldResult>,
        onToggleLock: (field: string) => void,
        onSubmit: (e: Event) => void,
        statusIcon: any // Snippet
    } = $props();

    const INPUT_BASE = 'w-full rounded-md border px-3 h-11 text-base text-gray-900 focus:outline-none focus:ring-1 transition-colors';
    
    let canSubmit = $derived(
        files.length > 0 &&
        brandName.trim() !== '' &&
        beverageType !== '' &&
        alcoholContent.trim() !== '' &&
        netContents.trim() !== '' &&
        producerName.trim() !== '' &&
        producerAddress.trim() !== '' &&
        !loading && !submitting && jobId === null
    );
</script>

<form onsubmit={onSubmit}>
    <Card class="overflow-hidden border-gray-200 transition-all {result ? 'shadow-md ring-1 ring-black/5' : 'shadow-sm'}">
        <CardHeader class="py-5 bg-gray-50/50 border-b">
            <div class="flex items-center justify-between gap-4">
                <div class="flex flex-col gap-1">
                    <CardTitle class="text-lg font-semibold">Compliance Workspace</CardTitle>
                    {#if result}
                        <p class="text-xs text-gray-400">Scan duration: {result.processingTimeMs}ms</p>
                    {:else}
                        <p class="text-xs text-gray-400 font-medium">Verify COLA Specification</p>
                    {/if}

                </div>
                {#if result}
                    <div class="flex items-center gap-3">
                        <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400">Result</span>
                        <Badge variant={result.overallStatus} class="px-3 py-1 text-xs font-bold">
                            {OVERALL_LABEL[result.overallStatus]}
                        </Badge>
                    </div>
                {/if}
            </div>
        </CardHeader>
        
        <CardContent class="space-y-8 p-6 min-w-0 bg-white">
            <div class="space-y-8">
                <!-- Row 1: Brand & Producer Name -->
                <p class="text-sm text-gray-600">
                    <span class="text-red-500">*</span> Required · Applied to every image in the batch
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label for="brandName" class="mb-1.5 block font-semibold text-gray-700 tracking-tight h-6 flex items-center">Brand Name <span class="text-red-500 px-0.5 font-semibold text-lg">*</span></label>
                        <div class="relative">
                            <input id="brandName" type="text" bind:value={brandName} list="brands-list" autocomplete="off" disabled={!!jobId || loading} class="{INPUT_BASE} {borderCls(fieldResultMap, 'brandName')}" />
                            {@render statusIcon('brandName')}
                        </div>
                        <FieldFeedback fr={fieldResultMap.get('brandName')} />
                    </div>
                    <div>
                        <div class="mb-1.5 flex items-center justify-between h-6">
                            <label for="producerName" class="font-semibold text-gray-700 tracking-tight">Producer Name <span class="text-red-500 px-0.5 font-semibold text-lg">*</span></label>
                            <button type="button" class="rounded p-1 {locked.has('producerName') ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}" onclick={() => onToggleLock('producerName')} aria-label="Lock"><svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></button>
                        </div>
                        <div class="relative">
                            <input id="producerName" type="text" bind:value={producerName} list="producers-list" autocomplete="off" disabled={!!jobId || loading} class="{INPUT_BASE} {borderCls(fieldResultMap, 'producerName')}" />
                            {@render statusIcon('producerName')}
                        </div>
                        <FieldFeedback fr={fieldResultMap.get('producerName')} />
                    </div>
                </div>

                <!-- Row 2: Type & Producer Address -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-1">
                        <label for="beverageType" class="font-semibold text-gray-700 tracking-tight">Beverage Type <span class="text-red-500 px-0.5 font-semibold text-lg">*</span></label>
                        <select id="beverageType" bind:value={beverageType} disabled={!!jobId || loading} class="{INPUT_BASE} {borderCls(fieldResultMap, 'beverageType')}">
                            <option value="">Select type</option>
                            <option value="beer">Beer</option>
                            <option value="wine">Wine</option>
                            <option value="distilled_spirits">Distilled Spirits</option>
                        </select>
                        <FieldFeedback fr={fieldResultMap.get('beverageType')} />
                    </div>
                    <div>
                        <div class="mb-1.5 flex items-center justify-between h-6">
                            <label for="producerAddress" class="font-semibold text-gray-700 tracking-tight">Producer Address <span class="text-red-500 px-0.5 font-semibold text-lg">*</span></label>
                            <button type="button" class="rounded p-1 {locked.has('producerAddress') ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}" onclick={() => onToggleLock('producerAddress')} aria-label="Lock"><svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></button>
                        </div>
                        <div class="relative">
                            <input id="producerAddress" type="text" bind:value={producerAddress} list="addresses-list" autocomplete="off" disabled={!!jobId || loading} class="{INPUT_BASE} {borderCls(fieldResultMap, 'producerAddress')}" />
                            {@render statusIcon('producerAddress')}
                        </div>
                        <FieldFeedback fr={fieldResultMap.get('producerAddress')} />
                    </div>
                </div>

                <!-- Row 3: Alcohol & Net Contents -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label for="alcoholContent" class="mb-1.5 block font-semibold text-gray-700 tracking-tight h-6 flex items-center">Alcohol Content <span class="text-red-500 px-0.5 font-semibold text-lg">*</span></label>
                        <div class="relative">
                            <input id="alcoholContent" type="text" placeholder="e.g. 12.5%" bind:value={alcoholContent} disabled={!!jobId || loading} class="{INPUT_BASE} {borderCls(fieldResultMap, 'alcoholContent')}" />
                            {@render statusIcon('alcoholContent')}
                        </div>
                        <FieldFeedback fr={fieldResultMap.get('alcoholContent')} />
                    </div>
                    <div>
                        <label for="netContents" class="mb-1.5 block font-semibold text-gray-700 tracking-tight h-6 flex items-center">Net Contents <span class="text-red-500 px-0.5 font-semibold text-lg">*</span></label>
                        <div class="relative">
                            <input id="netContents" type="text" placeholder="e.g. 750 mL" bind:value={netContents} disabled={!!jobId || loading} class="{INPUT_BASE} {borderCls(fieldResultMap, 'netContents')}" />
                            {@render statusIcon('netContents')}
                        </div>
                        <FieldFeedback fr={fieldResultMap.get('netContents')} />
                    </div>
                </div>
            </div>

            <!-- Automatic / Background Field Failures -->
            {#if result}
                {@const primaryFields = ['brandName', 'beverageType', 'alcoholContent', 'netContents', 'producerName', 'producerAddress']}
                {@const autoFailures = result.fields.filter(f => !primaryFields.includes(f.fieldName) && f.status !== 'pass')}
                
                {#if autoFailures.length > 0}
                    <div class="mt-8 space-y-4 border-t border-gray-100 pt-6">
                        <div class="flex items-center gap-2">
                            <svg class="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" /></svg>
                            <h3 class="text-xs font-bold text-gray-900 uppercase tracking-wider">System-Verified Failures</h3>
                        </div>
                        <div class="grid grid-cols-1 gap-4">
                            {#each autoFailures as fr}
                                <div class="rounded-lg border border-red-100 bg-red-50/30 p-4">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-bold text-gray-900">{fr.fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                                        <Badge variant={fr.status} class="text-[10px] font-bold uppercase">{fr.status}</Badge>
                                    </div>
                                    <FieldFeedback {fr} />
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
            {/if}

            {#if !jobId && !result}
                <div class="pt-6 border-t border-gray-100">
                    <Button type="submit" disabled={!canSubmit} class="w-full h-12 text-sm font-semibold tracking-wider shadow-sm transition-all hover:translate-y-[-1px]">
                        {#if loading || submitting}
                            <svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>Executing Analysis…
                        {:else}
                            Run Compliance Check {#if files.length > 0}({files.length} Unit{files.length !== 1 ? 's' : ''}){/if}
                        {/if}
                    </Button>
                </div>
            {/if}
        </CardContent>
    </Card>
</form>
