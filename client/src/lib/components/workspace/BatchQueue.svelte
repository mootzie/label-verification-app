<script lang="ts">
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
    import { Badge } from '$lib/components/ui/badge';
    import { Progress } from '$lib/components/ui/progress';
    import { Button } from '$lib/components/ui/button';
    import { Tooltip } from '$lib/components/ui/tooltip';
    import { OVERALL_LABEL, STATUS_LABEL, BATCH_STATUS_VARIANT } from '$lib/utils/compliance-logic';
    import type { BatchLabelItem, OverallStatus } from '$shared/index';

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
</script>

{#if jobId}
    <Card class="overflow-hidden border-gray-200 shadow-sm">
        <CardHeader class="bg-gray-50/80 py-4 border-b">
            <div class="flex items-center justify-between gap-2 min-w-0">
                <CardTitle class="text-sm font-semibold tracking-widest">{jobDone ? 'Batch Complete' : 'Processing Queue'}</CardTitle>
                <div class="flex shrink-0 items-center gap-4">
                    <span class="text-xs font-medium text-gray-500">{completedCount} / {labels.length}</span>
                    {#if jobDone}
                        <Tooltip text="Download CSV">
                            <Button variant="outline" size="sm" class="h-8 px-4 text-[10px] uppercase font-bold tracking-wider" onclick={onExportCsv}>Export CSV</Button>
                        </Tooltip>
                    {/if}
                </div>
            </div>
        </CardHeader>
        <CardContent class="space-y-4 p-5 min-w-0 bg-white">
            <Progress value={batchProgress} class="h-2" />
            <div class="max-h-[400px] overflow-y-auto space-y-1.5 min-w-0" role="list">
                {#each labels as label}
                    <div class="border-b border-gray-50 py-3 last:border-0" role="listitem">
                        <div class="flex items-center justify-between gap-3 min-w-0">
                            <span class="truncate text-xs font-medium text-gray-700 min-w-0 flex-1">{label.filename}</span>
                            <div class="flex shrink-0 items-center gap-2">
                                {#if label.status === 'complete' && label.result}
                                    <Badge variant={label.result.overallStatus} class="text-[9px] font-bold border-0 uppercase">{OVERALL_LABEL[label.result.overallStatus]}</Badge>
                                {/if}
                                <Badge variant={BATCH_STATUS_VARIANT[label.status]} class="text-[9px] font-bold border-0 uppercase {label.status === 'processing' ? 'animate-pulse' : ''}">
                                    {STATUS_LABEL[label.status]}
                                </Badge>
                            </div>
                        </div>
                        {#if label.status === 'failed' && label.error}
                            <p class="mt-1 text-[10px] font-medium text-red-500 uppercase tracking-tight">{label.error}</p>
                        {/if}
                    </div>
                {/each}
            </div>
        </CardContent>
    </Card>
{/if}
