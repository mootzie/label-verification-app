<script lang="ts">
    import { onDestroy } from 'svelte'
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from '$lib/components/ui/card'
    import { Badge } from '$lib/components/ui/badge'
    import { Button } from '$lib/components/ui/button'
    import { QueueIcon, TrashIcon, UploadIcon } from '$lib/components/ui/icon'
    import {
        BATCH_STATUS_VARIANT,
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
        onBatchUpload,
        onClearQueue,
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
        onBatchUpload?: () => void
        onClearQueue?: () => void
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
        return (
            label.result?.fields.filter((f) => f.status !== 'pass').length ?? 0
        )
    }

    function selectItem(index: number) {
        onSelectFile?.(index)
    }

    function selectRelative(delta: number) {
        if (labels.length === 0) return
        const base = selectedFileIndex ?? 0
        const next = Math.max(0, Math.min(labels.length - 1, base + delta))
        selectItem(next)
    }
</script>

<Card
    class="overflow-hidden border-gray-200 shadow-sm {jobId
        ? ''
        : 'opacity-70'}"
>
    {#if jobId}
        <CardHeader class="border-b bg-white py-2.5">
            <div
                class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
            >
                <div class="flex min-w-0 flex-wrap items-center gap-2">
                    <QueueIcon
                        size={20}
                        className="shrink-0 text-muted-foreground"
                    />
                    <CardTitle class="text-base font-bold text-gray-950">
                        {jobDone ? 'Batch Queue Complete' : 'Batch Queue'}
                    </CardTitle>
                    <Badge variant="outline" class="px-2 py-0.5 text-xs">
                        {labels.length} item{labels.length === 1 ? '' : 's'}
                    </Badge>
                    <span class="text-xs font-semibold text-gray-600">
                        {completedCount} / {labels.length}
                    </span>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    {#if jobDone}
                        <Button
                            variant="outline"
                            size="sm"
                            onclick={onExportCsv}
                        >
                            Export Results (CSV)
                        </Button>
                    {:else}
                        <span
                            class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm"
                        >
                            <span
                                class="h-2 w-2 rounded-full bg-blue-500"
                                aria-hidden="true"
                            ></span>
                            Processing batch
                        </span>
                    {/if}
                </div>
            </div>
        </CardHeader>
        <CardContent class="bg-white p-2.5">
            <div
                class="flex min-h-[5.75rem] overflow-hidden rounded-md border border-gray-200 bg-white"
            >
                <div
                    class="flex w-[12.5rem] shrink-0 flex-col justify-between border-r border-gray-200 bg-gray-50 p-2.5"
                >
                    <div class="min-w-0">
                        <p class="truncate text-xs font-bold text-gray-900">
                            {jobDone ? 'Batch Complete' : 'Batch Processing'}
                        </p>
                        <Badge
                            variant="outline"
                            class="mt-2 border-green-200 bg-green-50 px-2 py-1 text-xs font-bold text-green-700"
                        >
                            {completedCount} of {labels.length}
                        </Badge>
                    </div>
                    <div class="mt-3 flex items-center gap-2">
                        <button
                            type="button"
                            class="flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-lg font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-40"
                            disabled={(selectedFileIndex ?? 0) <= 0}
                            aria-label="Previous label"
                            onclick={() => selectRelative(-1)}
                        >
                            ‹
                        </button>
                        <button
                            type="button"
                            class="flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-lg font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-40"
                            disabled={(selectedFileIndex ?? 0) >=
                                labels.length - 1}
                            aria-label="Next label"
                            onclick={() => selectRelative(1)}
                        >
                            ›
                        </button>
                    </div>
                </div>
                <div
                    class="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto px-3 py-2.5"
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
                                class="group w-[4.75rem] rounded-md border bg-white p-1.5 text-left shadow-sm transition {selected
                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                onclick={() => selectItem(index)}
                                title={`${label.filename} · ${label.result ? `${issues} issue${issues === 1 ? '' : 's'}` : STATUS_LABEL[label.status]}`}
                            >
                                <div
                                    class="relative h-14 w-14 overflow-hidden rounded border border-gray-200 bg-white"
                                >
                                    {#if url}
                                        <img
                                            src={url}
                                            alt=""
                                            class="h-full w-full object-cover"
                                            draggable="false"
                                        />
                                    {:else}
                                        <div
                                            class="flex h-full items-center justify-center px-2 text-center text-[11px] font-semibold text-gray-500"
                                        >
                                            {label.filename}
                                        </div>
                                    {/if}
                                    <span
                                        class="absolute bottom-1 right-1 rounded-full shadow"
                                    >
                                        {#if label.status === 'complete' && label.result}
                                            <Badge
                                                variant={label.result
                                                    .overallStatus}
                                                class="border-0 px-1.5 py-0.5 text-[10px]"
                                            >
                                                {label.result.overallStatus ===
                                                'pass'
                                                    ? '✓'
                                                    : label.result
                                                            .overallStatus ===
                                                        'warning'
                                                      ? '!'
                                                      : '×'}
                                            </Badge>
                                        {:else}
                                            <Badge
                                                variant={BATCH_STATUS_VARIANT[
                                                    label.status
                                                ]}
                                                class="border-0 px-1.5 py-0.5 text-[10px]"
                                            >
                                                {label.status === 'processing'
                                                    ? '…'
                                                    : STATUS_LABEL[
                                                          label.status
                                                      ]}
                                            </Badge>
                                        {/if}
                                    </span>
                                </div>
                            </button>
                        </div>
                    {/each}
                </div>
            </div>
        </CardContent>
    {:else}
        <CardHeader class="border-b bg-white py-3">
            <div
                class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
            >
                <div class="flex min-w-0 items-center gap-2">
                    <!-- <QueueIcon
                        size={20}
                        className="shrink-0 text-muted-foreground"
                    /> -->
                    <CardTitle class="text-base font-bold text-gray-950">
                        Review Queue
                    </CardTitle>
                    <Badge variant="outline" class="px-2 py-0.5 text-xs">
                        0 items
                    </Badge>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onclick={onBatchUpload}
                        class="gap-2"
                    >
                        <UploadIcon size={18} />
                        Batch Upload
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onclick={onClearQueue}
                        class="gap-2"
                    >
                        <TrashIcon size={18} />
                        Clear Queue
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent class="bg-white p-3">
            <div
                class="flex min-h-[7rem] items-center justify-between gap-4 overflow-hidden rounded-md border-2 border-dashed border-gray-300 bg-gray-50/40 px-6 py-5"
            >
                <div class="hidden shrink-0 gap-3 md:flex" aria-hidden="true">
                    {#each Array(5) as _}
                        <div
                            class="h-14 w-14 rounded-md border border-gray-200 bg-white shadow-sm"
                        ></div>
                    {/each}
                </div>
                <div
                    class="flex min-w-0 flex-1 items-center justify-center gap-4 text-center"
                >
                    <div
                        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                    >
                        <QueueIcon size={32} />
                    </div>
                    <div class="min-w-0 text-left">
                        <p class="text-sm font-bold text-gray-950">
                            No labels loaded
                        </p>
                        <p class="mt-1 text-xs font-medium text-gray-600">
                            Uploaded labels will appear here for batch review.
                        </p>
                    </div>
                </div>
                <div class="hidden shrink-0 gap-3 lg:flex" aria-hidden="true">
                    {#each Array(6) as _}
                        <div
                            class="h-14 w-14 rounded-md border border-gray-200 bg-white shadow-sm"
                        ></div>
                    {/each}
                </div>
            </div>
        </CardContent>
    {/if}
</Card>
