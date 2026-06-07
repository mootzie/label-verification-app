<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from '$lib/components/ui/card'
    import { FileTextIcon, UploadIcon } from '$lib/components/ui/icon'
    import { formatFieldName } from '$lib/utils/compliance-logic'

    let {
        files,
        imagePreviewUrl,
        selectedFileIndex,
        jobId,
        selectedFieldName = null,
        workstation = false,
        blankState = false,
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
        blankState?: boolean
        hoverScale?: number
        onFileInput: (e: Event) => void
        onSelectFile: (i: number) => void
        onRemoveFile: (i: number) => void
        onDropZoneKeydown: (e: KeyboardEvent) => void
        onUseSingleFile: () => void
    } = $props()

    let isHovering = $state(false)
    let zoomOrigin = $state('50% 50%')

    function handleMouseMove(e: MouseEvent) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        zoomOrigin = `${x}% ${y}%`
    }
</script>

<div class="min-w-0 h-full">
    <Card
        class="h-full flex flex-col overflow-hidden border-gray-200 shadow-sm"
    >
        <CardHeader
            class="{workstation
                ? 'py-2.5'
                : 'py-4'} border-b border-gray-200 bg-white"
        >
            <div class="flex items-center justify-between gap-3 w-full">
                <div class="min-w-0 w-full">
                    <CardTitle
                        class="w-full {workstation
                            ? 'text-sm'
                            : 'text-base'} font-bold text-gray-950"
                    >
                        <div
                            class="flex justify-between items-center gap-2 w-full"
                        >
                            <span class="inline-flex items-center gap-2">
                                <FileTextIcon
                                    size={32}
                                    className={blankState
                                        ? 'text-blue-700'
                                        : 'text-gray-500'}
                                />
                                {#if blankState}
                                    <span class="font-bold text-blue-700"
                                        >Step 1</span
                                    >
                                    <span
                                        class="h-1 w-1 rounded-full bg-blue-700"
                                        aria-hidden="true"
                                    ></span>
                                    Add Label Image
                                {:else if files.length > 0 && selectedFileIndex !== null}
                                    <p
                                        class="truncate text-[11px] font-medium text-gray-500"
                                    >
                                        {files[selectedFileIndex]?.name}
                                    </p>
                                {/if}
                            </span>
                            {#if blankState}
                                <span
                                    class="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                                >
                                    Start here
                                </span>
                            {/if}
                        </div>
                    </CardTitle>
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
                : 'p-4'} min-w-0 flex flex-col flex-1 overflow-hidden"
        >
            <div
                class="mb-4 flex h-10 shrink-0 flex-wrap items-center justify-between gap-2 rounded border border-gray-200 bg-gray-50 px-3 text-xs text-gray-600"
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
                        <div
                            class="absolute left-1/2 top-1/2 origin-center transition-transform duration-200 ease-out"
                            style="transform: translate(-50%, -50%) scale({isHovering
                                ? hoverScale
                                : 1}); transform-origin: {zoomOrigin}; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;"
                        >
                            <img
                                src={imagePreviewUrl}
                                alt="Preview"
                                style="display: block; max-width: 100%; max-height: 100%; object-fit: contain;"
                                draggable="false"
                            />
                        </div>
                    </div>
                    <!-- {#if files.length > 1}
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
                    {/if} -->
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
                <button
                    type="button"
                    class="flex min-h-[24rem] flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-gray-300 bg-white p-10 text-center transition-all hover:border-blue-500 hover:bg-blue-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    aria-label="Add label images"
                    onclick={() =>
                        document.getElementById('file-input-el')?.click()}
                >
                    <div
                        class="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-blue-100"
                    >
                        <UploadIcon size={28} />
                    </div>
                    <div>
                        <p class="text-sm font-semibold text-gray-700">
                            Add Label Images
                        </p>
                        <span
                            class="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                        >
                            <UploadIcon size={24} />
                            Browse Files
                        </span>
                        <p class="mt-2 text-sm text-gray-600">
                            or drag and drop label images here
                        </p>
                        <p class="mt-2 text-xs text-gray-500 tracking-wider">
                            JPEG, PNG, WebP supported
                        </p>
                    </div>
                </button>
            {/if}
        </CardContent>
    </Card>
</div>
