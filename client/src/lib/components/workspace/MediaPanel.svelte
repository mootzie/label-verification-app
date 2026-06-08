<script lang="ts">
    import { onDestroy } from 'svelte'
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
    import { FileTextIcon, UploadIcon } from '$lib/components/ui/icon'

    let {
        files,
        imagePreviewUrl,
        workstation = false,
        blankState = false,
        hideFileInput = false,
        hoverScale = 1.75,
        onFileInput,
        onUseSingleFile,
    }: {
        files: File[]
        imagePreviewUrl: string | null
        workstation?: boolean
        blankState?: boolean
        hideFileInput?: boolean
        hoverScale?: number
        onFileInput: (e: Event) => void
        onUseSingleFile: () => void
    } = $props()

    let isHovering = $state(false)
    let zoomLevel = $state(2.5)
    let previewImage = $state<HTMLImageElement | null>(null)
    let zoomInitialized = false
    let pointerFrame = 0
    let nextOrigin = '50% 50%'

    let zoomPercent = $derived(Math.round(zoomLevel * 100))
    let activeScale = $derived(isHovering ? zoomLevel : 1)

    $effect(() => {
        if (zoomInitialized) return
        zoomLevel = hoverScale
        zoomInitialized = true
    })

    onDestroy(() => {
        if (pointerFrame) cancelAnimationFrame(pointerFrame)
    })

    function originFromPointer(e: PointerEvent) {
        if (!previewImage) return '50% 50%'
        const rect = previewImage.getBoundingClientRect()
        if (rect.width <= 0 || rect.height <= 0) return '50% 50%'
        const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100))
        const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100))
        return `${x}% ${y}%`
    }

    function setZoomOrigin(origin: string) {
        previewImage?.style.setProperty('--zoom-origin', origin)
    }

    function handlePointerEnter(e: PointerEvent) {
        if (!previewImage) return
        nextOrigin = originFromPointer(e)
        setZoomOrigin(nextOrigin)
        isHovering = true
    }

    function handlePointerMove(e: PointerEvent) {
        if (!previewImage) return
        nextOrigin = originFromPointer(e)
        if (pointerFrame) return
        pointerFrame = requestAnimationFrame(() => {
            setZoomOrigin(nextOrigin)
            pointerFrame = 0
        })
    }

    function handlePointerLeave() {
        isHovering = false
        nextOrigin = '50% 50%'
        setZoomOrigin(nextOrigin)
    }

    function setZoom(next: number) {
        zoomLevel = Math.min(4, Math.max(1.25, Number(next.toFixed(2))))
    }

    function handleWheel(e: WheelEvent) {
        if (!isHovering) return
        e.preventDefault()
        setZoom(zoomLevel + (e.deltaY > 0 ? -0.25 : 0.25))
    }
</script>

<div class="min-w-0 h-full">
    <Card class="h-full flex flex-col overflow-hidden border-gray-200 shadow-sm">
        <CardHeader class="{workstation ? 'py-2.5' : 'py-4'} border-b border-gray-200 bg-white">
            <div class="flex items-center justify-between gap-3 w-full">
                <div class="min-w-0">
                    <CardTitle class="{workstation ? 'text-sm' : 'text-base'} font-bold text-gray-950">
                        {blankState ? 'Add Label Image' : 'Label Image'}
                    </CardTitle>
                </div>
                {#if blankState}
                    <FileTextIcon size={28} className="shrink-0 text-blue-700" />
                {/if}
                <div class="flex items-center gap-2">
                    {#if imagePreviewUrl}
                        <div class="flex h-7 items-center overflow-hidden rounded border border-gray-300 bg-white shadow-sm" aria-label="Inspect zoom controls">
                            <button type="button" class="flex h-full w-7 items-center justify-center text-sm font-bold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600" aria-label="Decrease inspect zoom" onclick={() => setZoom(zoomLevel - 0.25)}>-</button>
                            <span class="min-w-12 border-x border-gray-200 px-2 text-center text-xs font-semibold text-gray-700">
                                {zoomPercent}%
                            </span>
                            <button type="button" class="flex h-full w-7 items-center justify-center text-sm font-bold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600" aria-label="Increase inspect zoom" onclick={() => setZoom(zoomLevel + 0.25)}>+</button>
                        </div>
                    {/if}
                </div>
            </div>
        </CardHeader>

        <CardContent class="{workstation ? 'p-2' : 'p-4'} min-w-0 flex flex-col flex-1 overflow-hidden">
            {#if !hideFileInput}
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple class="sr-only" onchange={onFileInput} id="file-input-el" />
            {/if}

            {#if imagePreviewUrl}
                <div class="flex min-h-0 flex-1 flex-col gap-2">
                    <div class="relative min-h-0 flex-1 w-full overflow-hidden rounded border border-gray-300 bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:18px_18px] bg-[position:0_0,0_9px,9px_-9px,-9px_0] shadow-inner hover:cursor-pointer" role="region" aria-label="Label image preview. Inspect on hover can be toggled in the viewer toolbar." onpointerenter={handlePointerEnter} onpointerleave={handlePointerLeave} onpointermove={handlePointerMove} onwheel={handleWheel}>
                        <div class="absolute inset-0 flex items-center justify-center overflow-hidden">
                            <img bind:this={previewImage} src={imagePreviewUrl} alt="Preview" class="block max-h-full max-w-full select-none object-contain will-change-transform [--zoom-origin:50%_50%] {isHovering ? 'duration-0' : 'transition-transform duration-150 ease-out'}" style="transform: scale({activeScale}); transform-origin: var(--zoom-origin);" draggable="false" />
                        </div>
                    </div>
                    <!-- <div class="flex shrink-0 items-center justify-between px-1">
                        {#if files.length > 1}
                            <div class="flex flex-col gap-1">
                                <span class="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                    <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                        <rect x="2" y="7" width="20" height="14" rx="2" />
                                        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                                        <line x1="12" y1="12" x2="12" y2="17" />
                                        <line x1="9" y1="14.5" x2="15" y2="14.5" />
                                    </svg>
                                    Batch Mode {files.length} labels
                                </span>
                                <button type="button" class="text-left text-xs text-gray-500 hover:text-blue-600 hover:underline px-1" onclick={onUseSingleFile}>← Use first file only</button>
                            </div>
                        {:else}
                            <span class="text-xs font-semibold uppercase text-gray-600">Single Label</span>
                        {/if}
                    </div> -->
                </div>
            {:else}
                <button type="button" class="flex min-h-[24rem] flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-gray-300 bg-white p-10 text-center transition-all hover:border-blue-500 hover:bg-blue-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" aria-label="Add label images" onclick={() => document.getElementById('file-input-el')?.click()}>
                    <div class="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-blue-100">
                        <UploadIcon size={28} />
                    </div>
                    <div>
                        <p class="text-sm font-semibold text-gray-700">Add Label Images</p>
                        <span class="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                            <UploadIcon size={24} />
                            Browse Files
                        </span>
                        <p class="mt-2 text-sm text-gray-600">or drag and drop label images anywhere on the screen</p>
                        <p class="mt-2 text-xs text-gray-500 tracking-wider">JPEG, PNG, WebP supported</p>
                    </div>
                </button>
            {/if}
        </CardContent>
    </Card>
</div>
