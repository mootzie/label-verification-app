<script lang="ts">
    import { onDestroy } from 'svelte'
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from '$lib/components/ui/card'
    import { Badge } from '$lib/components/ui/badge'
    import { Progress } from '$lib/components/ui/progress'
    import { Button } from '$lib/components/ui/button'
    import {
        BATCH_STATUS_VARIANT,
        OVERALL_LABEL,
        STATUS_LABEL,
    } from '$lib/utils/compliance-logic'
    import type { BatchLabelItem } from '$shared/index'

    let {
        jobId,
        jobDone,
        labels,
        completedCount,
        batchProgress,
        files = [],
        selectedFileIndex = null,
        onSelectFile,
        onExportCsv,
    }: {
        jobId: string | null
        jobDone: boolean
        labels: BatchLabelItem[]
        completedCount: number
        batchProgress: number
        files?: File[]
        selectedFileIndex?: number | null
        onSelectFile?: (i: number) => void
        onExportCsv: () => void
    } = $props()

    const urlCache = new WeakMap<File, string>()
    const createdUrls = new Set<string>()

    onDestroy(() => {
        createdUrls.forEach((url) => URL.revokeObjectURL(url))
    })

    function thumbnailUrl(file: File | undefined) {
        if (!file) return null
        const existing = urlCache.get(file)
        if (existing) return existing
        const url = URL.createObjectURL(file)
        urlCache.set(file, url)
        createdUrls.add(url)
        return url
    }

    function issueCount(label: BatchLabelItem) {
        return label.result?.fields.filter((f) => f.status !== 'pass').length ?? 0
    }

    function processingTime(label: BatchLabelItem) {
        if (!label.result?.processingTimeMs) return '—'
        return `${(label.result.processingTimeMs / 1000).toFixed(1)}s`
    }

    function selectItem(index: number) {
        onSelectFile?.(index)
    }
</script>

{#if jobId}
    <Card class="overflow-hidden border-gray-200 shadow-sm">
        <CardHeader class="border-b bg-gray-50/80 py-3">
            <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                    <CardTitle class="text-sm font-bold text-gray-950">
                        {jobDone ? 'Batch Queue Complete' : 'Batch Queue'}
                    </CardTitle>
                    <p class="text-xs text-gray-500">
                        Select a label to open it in the review workstation.
                    </p>
                </div>
                <span class="shrink-0 text-xs font-semibold text-gray-600">
                    {completedCount} / {labels.length}
                </span>
            </div>
        </CardHeader>
        <CardContent class="space-y-3 bg-white p-3">
            <Progress value={batchProgress} class="h-1.5" />

            <div
                class="flex gap-3 overflow-x-auto pb-1"
                role="list"
                aria-label="Batch label filmstrip"
            >
                {#each labels as label, index}
                    {@const issues = issueCount(label)}
                    {@const selected = selectedFileIndex === index}
                    {@const url = thumbnailUrl(files[index])}
                    <div role="listitem" class="shrink-0">
                        <button
                            type="button"
                            class="group w-[8.5rem] rounded-md border bg-white p-2 text-left transition {selected
                                ? 'border-blue-500 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                            onclick={() => selectItem(index)}
                        >
                            <div class="relative mb-2 aspect-[3/4] overflow-hidden rounded border border-gray-200 bg-gray-100">
                                {#if url}
                                    <img
                                        src={url}
                                        alt=""
                                        class="h-full w-full object-cover"
                                        draggable="false"
                                    />
                                {:else}
                                    <div class="flex h-full items-center justify-center px-2 text-center text-[11px] font-semibold text-gray-500">
                                        {label.filename}
                                    </div>
                                {/if}
                                <span class="absolute bottom-1 right-1 rounded-full bg-white/95 p-0.5 shadow">
                                    {#if label.status === 'complete' && label.result}
                                        <Badge
                                            variant={label.result.overallStatus}
                                            class="border-0 px-1.5 py-0.5 text-[10px]"
                                        >
                                            {label.result.overallStatus === 'pass'
                                                ? '✓'
                                                : label.result.overallStatus === 'warning'
                                                  ? '!'
                                                  : '×'}
                                        </Badge>
                                    {:else}
                                        <Badge
                                            variant={BATCH_STATUS_VARIANT[label.status]}
                                            class="border-0 px-1.5 py-0.5 text-[10px]"
                                        >
                                            {label.status === 'processing' ? '…' : STATUS_LABEL[label.status]}
                                        </Badge>
                                    {/if}
                                </span>
                            </div>

                            <div class="min-w-0">
                                <p class="truncate text-xs font-bold text-gray-900">
                                    {label.filename}
                                </p>
                                <div class="mt-1 flex items-center justify-between gap-1">
                                    {#if label.status === 'complete' && label.result}
                                        <Badge
                                            variant={label.result.overallStatus}
                                            class="border-0 px-1.5 py-0.5 text-[10px]"
                                        >
                                            {OVERALL_LABEL[label.result.overallStatus]}
                                        </Badge>
                                    {:else}
                                        <Badge
                                            variant={BATCH_STATUS_VARIANT[label.status]}
                                            class="border-0 px-1.5 py-0.5 text-[10px]"
                                        >
                                            {STATUS_LABEL[label.status]}
                                        </Badge>
                                    {/if}
                                    <span class="text-[11px] font-semibold {issues > 0 ? 'text-amber-700' : 'text-green-700'}">
                                        {label.result ? `${issues} issue${issues === 1 ? '' : 's'}` : processingTime(label)}
                                    </span>
                                </div>
                                {#if label.status === 'failed' && label.error}
                                    <p class="mt-1 line-clamp-2 text-[11px] font-medium text-red-700">
                                        {label.error}
                                    </p>
                                {/if}
                            </div>
                        </button>
                    </div>
                {/each}
            </div>

            {#if jobDone}
                <div class="flex justify-end">
                    <Button size="sm" onclick={onExportCsv}>Export Results (CSV)</Button>
                </div>
            {/if}
        </CardContent>
    </Card>
{/if}
