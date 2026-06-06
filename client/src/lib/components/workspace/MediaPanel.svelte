<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from '$lib/components/ui/card'
    import { Tooltip } from '$lib/components/ui/tooltip'
    import Button from '../ui/button/Button.svelte'

    let {
        files,
        imagePreviewUrl,
        selectedFileIndex,
        jobId,
        hoverScale = 2.5,
        onFileInput,
        onSelectFile,
        onRemoveFile,
        onDropZoneKeydown,
    }: {
        files: File[]
        imagePreviewUrl: string | null
        selectedFileIndex: number | null
        jobId: string | null
        hoverScale?: number
        onFileInput: (e: Event) => void
        onSelectFile: (i: number) => void
        onRemoveFile: (i: number) => void
        onDropZoneKeydown: (e: KeyboardEvent) => void
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

<div class="lg:sticky lg:top-6 min-w-0">
    <Card>
        <CardHeader class="py-4">
            <CardTitle class="text-base font-semibold">Label Media</CardTitle>
        </CardHeader>
        <CardContent class="p-4 min-w-0">
            <div
                class="mb-4 rounded-md bg-blue-50/50 px-3 py-2 text-center text-xs text-blue-600 border border-blue-100/50"
            >
                Tip: You can drag and drop files anywhere on this page
            </div>
            <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                class="sr-only"
                onchange={onFileInput}
                id="file-input-el"
            />

            {#if files.length > 0 && imagePreviewUrl}
                <div class="flex flex-col gap-4 min-w-0">
                    <div
                        class="relative h-[400px] lg:h-[calc(100vh-36rem)] w-full overflow-hidden rounded-lg border bg-gray-50 cursor-crosshair shadow-inner"
                        role="region"
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
                    <div class="flex items-center justify-between px-1">
                        <p
                            class="text-[10px] text-gray-400 uppercase tracking-widest font-semibold"
                        >
                            {files.length === 1
                                ? 'Single Unit'
                                : `${files.length} Unit Batch`}
                        </p>
                        <button
                            type="button"
                            class="text-xs text-blue-600 hover:underline font-medium"
                            onclick={() =>
                                document
                                    .getElementById('file-input-el')
                                    ?.click()}>Change Media</button
                        >
                    </div>
                </div>
            {:else}
                <!-- svelte-ignore a11y_interactive_supports_focus -->
                <div
                    role="button"
                    tabindex="0"
                    class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 p-12 text-center transition-all hover:border-blue-400 hover:bg-blue-50/30"
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
                        <p
                            class="mt-1 text-[10px] text-gray-400 tracking-wider"
                        >
                            JPEG, PNG, WebP supported
                        </p>
                    </div>
                </div>
            {/if}
        </CardContent>
    </Card>
</div>
