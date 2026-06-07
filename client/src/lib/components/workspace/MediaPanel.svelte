<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from '$lib/components/ui/card'
    import { formatFieldName } from '$lib/utils/compliance-logic'

    let {
        files,
        imagePreviewUrl,
        selectedFileIndex,
        jobId,
        selectedFieldName = null,
        workstation = false,
        highlightFields = [],
        hoverScale = 2.5,
        onFileInput,
        onSelectFile,
        onRemoveFile,
        onDropZoneKeydown,
        onUseSingleFile,
    }: {
        files: File[]
        imagePreviewUrl: string | null
        selectedFileIndex: number | null
        jobId: string | null
        selectedFieldName?: string | null
        workstation?: boolean
        highlightFields?: string[]
        hoverScale?: number
        onFileInput: (e: Event) => void
        onSelectFile: (i: number) => void
        onRemoveFile: (i: number) => void
        onDropZoneKeydown: (e: KeyboardEvent) => void
        onUseSingleFile: () => void
    } = $props()

    let isHovering = $state(false)
    let zoomOrigin = $state('50% 50%')

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

    const APPROXIMATE_REGIONS: Record<
        string,
        { left: string; top: string; width: string; height: string }
    > = {
        brandName: { left: '24%', top: '13%', width: '52%', height: '9%' },
        classType: { left: '17%', top: '48%', width: '66%', height: '10%' },
        alcoholContent: { left: '30%', top: '61%', width: '40%', height: '6%' },
        netContents: { left: '42%', top: '68%', width: '18%', height: '5%' },
        governmentWarning: {
            left: '17%',
            top: '74%',
            width: '66%',
            height: '13%',
        },
        producerName: { left: '26%', top: '89%', width: '48%', height: '8%' },
        producerAddress: {
            left: '26%',
            top: '91%',
            width: '48%',
            height: '5%',
        },
        stateOfDistillation: {
            left: '23%',
            top: '49%',
            width: '54%',
            height: '5%',
        },
    }

    let visibleHighlightFields = $derived.by(() => {
        const known = highlightFields.filter(
            (field) => APPROXIMATE_REGIONS[field]
        )
        return known.length > 0
            ? known
            : [
                  'brandName',
                  'classType',
                  'alcoholContent',
                  'netContents',
                  'governmentWarning',
                  'producerName',
              ]
    })

    function handleMouseMove(e: MouseEvent) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        zoomOrigin = `${x}% ${y}%`
    }
</script>

<div class="min-w-0 h-full">
    <Card
        class="h-full flex flex-col overflow-hidden border-gray-300 shadow-sm"
    >
        <CardHeader
            class="{workstation
                ? 'py-2.5'
                : 'py-4'} border-b border-gray-200 bg-white"
        >
            <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                    <CardTitle
                        class="{workstation
                            ? 'text-sm'
                            : 'text-base'} font-bold text-gray-950"
                        >Label Image</CardTitle
                    >
                    {#if files.length > 0 && selectedFileIndex !== null}
                        <p
                            class="truncate text-[11px] font-medium text-gray-500"
                        >
                            {files[selectedFileIndex]?.name}
                        </p>
                    {/if}
                </div>
                {#if selectedFieldName}
                    <span
                        class="max-w-[45%] truncate rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800"
                    >
                        {formatFieldName(selectedFieldName)}
                    </span>
                {/if}
            </div>
        </CardHeader>
        <CardContent
            class="{workstation
                ? 'p-2'
                : 'p-4'} min-w-0 flex flex-col flex-1 overflow-hidden bg-gray-100"
        >
            <div
                class="mb-2 flex h-9 shrink-0 flex-wrap items-center justify-between gap-2 rounded border border-gray-300 bg-gray-50 px-2 text-xs text-gray-600"
            >
                <div class="flex items-center gap-2">
                    <span class="font-bold text-gray-800">Document Viewer</span>
                    <span class="text-gray-300">|</span>
                    <span
                        >{files.length > 1
                            ? `${files.length} labels loaded`
                            : 'Single label'}</span
                    >
                </div>
                <div class="flex items-center gap-2">
                    <span class="font-semibold text-gray-700"
                        >Highlights: On</span
                    >
                    {#if imagePreviewUrl}
                        <button
                            type="button"
                            class="rounded border border-gray-300 bg-white px-2 py-1 font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                            onclick={() =>
                                document
                                    .getElementById('file-input-el')
                                    ?.click()}>Change files</button
                        >
                    {/if}
                </div>
            </div>
            <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                class="sr-only"
                onchange={onFileInput}
                id="file-input-el"
            />

            {#if imagePreviewUrl}
                <div class="flex min-h-0 flex-1 flex-col gap-2">
                    <div
                        class="relative min-h-0 flex-1 w-full overflow-hidden rounded border border-gray-500 bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:18px_18px] bg-[position:0_0,0_9px,9px_-9px,-9px_0] cursor-crosshair shadow-inner"
                        role="region"
                        aria-label="Label image preview"
                        onmouseenter={() => (isHovering = true)}
                        onmouseleave={() => (isHovering = false)}
                        onmousemove={handleMouseMove}
                    >
                        <img
                            src={imagePreviewUrl}
                            alt="Preview"
                            class="absolute left-1/2 top-1/2 max-h-full max-w-full origin-center transition-transform duration-200 ease-out"
                            style="transform: translate(-50%, -50%) scale({isHovering
                                ? hoverScale
                                : 1}); transform-origin: {zoomOrigin};"
                            draggable="false"
                        />
                        <!-- {#each visibleHighlightFields as fieldName}
                            {@const region = APPROXIMATE_REGIONS[fieldName]}
                            {@const selected = selectedFieldName === fieldName}
                            {@const color = FIELD_COLORS[fieldName] ?? '#64748b'}
                            <div
                                class="pointer-events-none absolute rounded-sm {selected
                                    ? 'border-[3px] opacity-100 shadow-[0_0_0_9999px_rgba(15,23,42,0.04)]'
                                    : 'border-2 opacity-75'}"
                                style="left: {region.left}; top: {region.top}; width: {region.width}; height: {region.height}; border-color: {color}; background-color: {color}1f;"
                                title={formatFieldName(fieldName)}
                            ></div>
                        {/each} -->
                        {#if selectedFieldName}
                            <div
                                class="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded border border-amber-300 bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-gray-800 shadow-sm"
                            >
                                Approximate region: {formatFieldName(
                                    selectedFieldName
                                )}
                            </div>
                        {/if}
                    </div>
                    {#if files.length > 1}
                        <div
                            class="max-h-[12rem] overflow-y-auto space-y-1 rounded-md border border-gray-100 p-1.5 min-w-0 bg-gray-50/30"
                        >
                            {#each files as file, i}
                                <div
                                    class="group flex items-center justify-between gap-2 rounded px-2.5 py-2 transition-colors {selectedFileIndex ===
                                    i
                                        ? 'bg-blue-100/50 text-blue-700 font-medium'
                                        : 'hover:bg-gray-100/50'} min-w-0"
                                >
                                    <button
                                        type="button"
                                        class="flex-1 truncate text-left text-sm"
                                        onclick={() => onSelectFile(i)}
                                        >{file.name}</button
                                    >
                                    {#if !jobId}
                                        <button
                                            type="button"
                                            onclick={() => onRemoveFile(i)}
                                            class="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            aria-label="Remove file"
                                            ><svg
                                                class="h-4 w-4"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                stroke-width="2"
                                                ><path d="M18 6L6 18M6 6l12 12"
                                                ></path></svg
                                            ></button
                                        >{/if}
                                </div>
                            {/each}
                        </div>
                    {/if}
                    <div
                        class="flex shrink-0 items-center justify-between px-1"
                    >
                        {#if files.length > 1}
                            <div class="flex flex-col gap-1">
                                <span
                                    class="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"
                                >
                                    <svg
                                        class="h-3.5 w-3.5 shrink-0"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        aria-hidden="true"
                                        ><rect
                                            x="2"
                                            y="7"
                                            width="20"
                                            height="14"
                                            rx="2"
                                        /><path
                                            d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"
                                        /><line
                                            x1="12"
                                            y1="12"
                                            x2="12"
                                            y2="17"
                                        /><line
                                            x1="9"
                                            y1="14.5"
                                            x2="15"
                                            y2="14.5"
                                        /></svg
                                    >
                                    Batch Mode — {files.length} labels
                                </span>
                                <button
                                    type="button"
                                    class="text-left text-xs text-gray-500 hover:text-blue-600 hover:underline px-1"
                                    onclick={onUseSingleFile}
                                    >← Use first file only</button
                                >
                            </div>
                        {:else}
                            <span
                                class="text-xs font-semibold uppercase text-gray-600"
                                >Single Label</span
                            >
                        {/if}
                        <span class="text-xs font-medium text-gray-500">
                            Hover image to inspect
                        </span>
                    </div>
                </div>
            {:else}
                <!-- svelte-ignore a11y_interactive_supports_focus -->
                <div
                    role="button"
                    tabindex="0"
                    class="flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-gray-300 bg-white p-10 text-center transition-all hover:border-blue-500 hover:bg-blue-50/30"
                    onclick={() =>
                        document.getElementById('file-input-el')?.click()}
                    onkeydown={onDropZoneKeydown}
                >
                    <div
                        class="rounded-full bg-gray-100 p-4 transition-colors group-hover:bg-blue-100"
                    >
                        <svg
                            class="h-8 w-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            ><path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                            /></svg
                        >
                    </div>
                    <div>
                        <p class="text-sm font-semibold text-gray-700">
                            Add Label Images
                        </p>
                        <p class="mt-1 text-xs text-gray-500 tracking-wider">
                            JPEG, PNG, WebP supported
                        </p>
                    </div>
                </div>
            {/if}
        </CardContent>
    </Card>
</div>
