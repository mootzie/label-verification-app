<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Badge } from '$lib/components/ui/badge';
    import { Progress } from '$lib/components/ui/progress';
    import { Button } from '$lib/components/ui/button';
    import { OVERALL_LABEL, STATUS_LABEL, BATCH_STATUS_VARIANT, formatFieldName } from '$lib/utils/compliance-logic';
    import type { BatchLabelItem } from '$shared/index';

    let {
        jobId,
        jobDone,
        labels,
        completedCount,
        batchProgress,
        onExportCsv
    }: {
        jobId: string | null,
        jobDone: boolean,
        labels: BatchLabelItem[],
        completedCount: number,
        batchProgress: number,
        onExportCsv: () => void
    } = $props();

    let expandedLabels = $state(new Set<string>())

    // when batch completes, auto-expand rows with failures or warnings
    $effect(() => {
        if (!jobDone) return
        const toExpand = new Set<string>()
        for (const label of labels) {
            if (label.result && label.result.overallStatus !== 'pass') {
                toExpand.add(label.labelId)
            }
        }
        if (toExpand.size > 0) expandedLabels = toExpand
    })

    function toggleExpanded(labelId: string) {
        const s = new Set(expandedLabels)
        if (s.has(labelId)) s.delete(labelId)
        else s.add(labelId)
        expandedLabels = s
    }

    const STATUS_ROW_BG: Record<string, string> = {
        pass: 'bg-green-50',
        warning: 'bg-yellow-50',
        fail: 'bg-red-50',
        not_found: 'bg-gray-50',
    }
</script>

{#if jobId}
    <Card class="overflow-hidden border-gray-200 shadow-sm">
        <CardHeader class="bg-gray-50/80 py-4 border-b">
            <div class="flex items-center justify-between gap-2 min-w-0">
                <CardTitle class="text-sm font-semibold tracking-widest">{jobDone ? 'Batch Complete' : 'Processing Queue'}</CardTitle>
                <span class="text-xs font-medium text-gray-500">{completedCount} / {labels.length}</span>
            </div>
        </CardHeader>
        <CardContent class="space-y-4 p-5 min-w-0 bg-white">
            <Progress value={batchProgress} class="h-2" />
            <div class="max-h-[480px] overflow-y-auto space-y-1 min-w-0" role="list">
                {#each labels as label}
                    {@const expanded = expandedLabels.has(label.labelId)}
                    {@const canExpand = label.status === 'complete' || label.status === 'processing'}
                    <div class="rounded border border-gray-100 overflow-hidden" role="listitem">
                        <!-- row header — always visible, clickable if expandable -->
                        <!-- svelte-ignore a11y_interactive_supports_focus -->
                        <div
                            class="flex items-center justify-between gap-3 min-w-0 px-3 py-2.5 {canExpand ? 'cursor-pointer hover:bg-gray-50 select-none' : ''}"
                            role={canExpand ? 'button' : undefined}
                            aria-expanded={canExpand ? expanded : undefined}
                            onclick={canExpand ? () => toggleExpanded(label.labelId) : undefined}
                        >
                            <div class="flex items-center gap-1.5 min-w-0 flex-1">
                                {#if canExpand}
                                    <span class="text-gray-400 text-xs shrink-0">{expanded ? '▾' : '▸'}</span>
                                {/if}
                                <span class="truncate text-xs font-medium text-gray-700">{label.filename}</span>
                            </div>
                            <div class="flex shrink-0 items-center gap-2">
                                {#if label.status === 'complete' && label.result}
                                    <Badge variant={label.result.overallStatus} class="text-xs font-bold border-0 uppercase">{OVERALL_LABEL[label.result.overallStatus]}</Badge>
                                {/if}
                                <Badge variant={BATCH_STATUS_VARIANT[label.status]} class="text-xs font-bold border-0 uppercase {label.status === 'processing' ? 'animate-pulse' : ''}">
                                    {STATUS_LABEL[label.status]}
                                </Badge>
                            </div>
                        </div>

                        {#if label.status === 'failed' && label.error}
                            <p class="px-3 pb-2 text-xs font-medium text-red-500 uppercase tracking-tight">{label.error}</p>
                        {/if}

                        <!-- expanded detail panel -->
                        {#if expanded}
                            <div class="border-t border-gray-100 bg-gray-50/50 px-3 py-2 space-y-1">
                                {#if label.status === 'processing'}
                                    <p class="text-xs text-gray-400 animate-pulse py-1">Analyzing label…</p>
                                {:else if label.result}
                                    {#each label.result.fields as field}
                                        <div class="flex items-start gap-2 rounded px-2 py-1.5 text-xs {STATUS_ROW_BG[field.status] ?? 'bg-gray-50'}">
                                            <Badge variant={field.status} class="shrink-0 text-[10px] font-bold border-0 uppercase mt-px">{STATUS_LABEL[field.status] ?? field.status}</Badge>
                                            <div class="min-w-0 flex-1">
                                                <span class="font-medium text-gray-800">{formatFieldName(field.fieldName)}</span>
                                                {#if field.status !== 'pass' && (field.foundValue || field.notes)}
                                                    <div class="mt-0.5 text-gray-500 space-y-0.5">
                                                        {#if field.foundValue}
                                                            <p><span class="text-gray-400">Found:</span> {field.foundValue}</p>
                                                        {/if}
                                                        {#if field.notes}
                                                            <p class="italic">{field.notes.slice(0, 120)}{field.notes.length > 120 ? '…' : ''}</p>
                                                        {/if}
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
            {#if jobDone}
                <Button class="w-full" onclick={onExportCsv}>Export Results (CSV)</Button>
            {/if}
        </CardContent>
    </Card>
{/if}
