<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from '$lib/components/ui/card'
    import { FileTextIcon, UploadIcon } from '$lib/components/ui/icon'
    import { formatFieldName } from '$lib/utils/compliance-logic'
    import type { FieldResult } from '$shared/index'
    import Tesseract from 'tesseract.js'

    let {
        files,
        imagePreviewUrl,
        selectedFileIndex,
        jobId,
        selectedFieldName = null,
        verificationFields = [],
        workstation = false,
        blankState = false,
        hideFileInput = false,
        hoverScale = 1.75,
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
        verificationFields?: FieldResult[]
        workstation?: boolean
        blankState?: boolean
        hideFileInput?: boolean
        hoverScale?: number
        onFileInput: (e: Event) => void
        onSelectFile: (i: number) => void
        onRemoveFile: (i: number) => void
        onDropZoneKeydown: (e: KeyboardEvent) => void
        onUseSingleFile: () => void
    } = $props()

    let isHovering = $state(false)
    let zoomEnabled = $state(true)
    let zoomLevel = $state(2.5)
    let previewSurface = $state<HTMLDivElement | null>(null)
    let previewFrame = $state<HTMLDivElement | null>(null)
    let previewImage = $state<HTMLImageElement | null>(null)
    let zoomInitialized = false
    let pointerFrame = 0
    let nextOrigin = '50% 50%'
    let ocrRunning = $state(false)
    let ocrProgress = $state('')
    let ocrError = $state<string | null>(null)
    let ocrMatches = $state<OcrFieldMatch[]>([])
    let ocrText = $state('')

    let zoomPercent = $derived(Math.round(zoomLevel * 100))
    let activeScale = $derived(isHovering && zoomEnabled ? zoomLevel : 1)
    let matchedCount = $derived(
        ocrMatches.filter((match) => match.score >= MATCH_THRESHOLD).length
    )
    let matchedFields = $derived.by(() => {
        const map = new Map<string, OcrFieldMatch>()
        for (const match of ocrMatches) map.set(match.fieldName, match)
        return map
    })
    let visibleMatches = $derived(
        selectedFieldName
            ? ocrMatches.filter(
                  (match) =>
                      match.fieldName === selectedFieldName &&
                      match.score >= MATCH_THRESHOLD
              )
            : ocrMatches.filter((match) => match.score >= MATCH_THRESHOLD)
    )

    const MATCH_THRESHOLD = 0.6

    type OcrBox = {
        x0: number
        y0: number
        x1: number
        y1: number
    }

    type OcrWord = {
        text: string
        confidence: number
        bbox: OcrBox
    }

    type OcrFieldMatch = {
        fieldName: string
        fieldLabel: string
        value: string
        score: number
        confidence: number
        bbox: OcrBox | null
        matchedText: string
    }

    $effect(() => {
        if (zoomInitialized) return
        zoomLevel = hoverScale
        zoomInitialized = true
    })

    function handlePointerMove(e: PointerEvent) {
        if (!zoomEnabled || !previewSurface) return
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        nextOrigin = `${x}% ${y}%`
        if (pointerFrame) return
        pointerFrame = requestAnimationFrame(() => {
            previewSurface?.style.setProperty('--zoom-origin', nextOrigin)
            pointerFrame = 0
        })
    }

    function handlePointerLeave() {
        isHovering = false
        nextOrigin = '50% 50%'
        previewSurface?.style.setProperty('--zoom-origin', nextOrigin)
    }

    function setZoom(next: number) {
        zoomLevel = Math.min(4, Math.max(1.5, Number(next.toFixed(2))))
    }

    function normalizeTokens(value: string | null | undefined) {
        return (value ?? '')
            .toLowerCase()
            .replace(/[^a-z0-9.%/]+/g, ' ')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
    }

    function unionBox(words: OcrWord[]): OcrBox {
        return {
            x0: Math.min(...words.map((word) => word.bbox.x0)),
            y0: Math.min(...words.map((word) => word.bbox.y0)),
            x1: Math.max(...words.map((word) => word.bbox.x1)),
            y1: Math.max(...words.map((word) => word.bbox.y1)),
        }
    }

    function collectWords(page: Tesseract.Page): OcrWord[] {
        const blocks = page.blocks ?? []
        return blocks.flatMap((block) =>
            block.paragraphs.flatMap((paragraph) =>
                paragraph.lines.flatMap((line) =>
                    line.words
                        .filter((word) => normalizeTokens(word.text).length > 0)
                        .map((word) => ({
                            text: word.text,
                            confidence: word.confidence,
                            bbox: word.bbox,
                        }))
                )
            )
        )
    }

    function matchField(field: FieldResult, words: OcrWord[]): OcrFieldMatch {
        const value = field.foundValue ?? ''
        const targetTokens = normalizeTokens(value)
        if (targetTokens.length === 0 || words.length === 0) {
            return emptyMatch(field, value)
        }

        const ocrTokens = words.map(
            (word) => normalizeTokens(word.text)[0] ?? ''
        )
        let best: OcrFieldMatch = emptyMatch(field, value)
        const maxWindow = Math.min(Math.max(targetTokens.length + 2, 2), 14)

        for (let start = 0; start < words.length; start += 1) {
            for (
                let length = 1;
                length <= maxWindow && start + length <= words.length;
                length += 1
            ) {
                const windowTokens = ocrTokens.slice(start, start + length)
                const matched = targetTokens.filter((token) =>
                    windowTokens.includes(token)
                ).length
                const score = matched / targetTokens.length
                if (score <= best.score) continue

                const windowWords = words.slice(start, start + length)
                best = {
                    fieldName: field.fieldName,
                    fieldLabel: formatFieldName(field.fieldName),
                    value,
                    score,
                    confidence:
                        windowWords.reduce(
                            (sum, word) => sum + word.confidence,
                            0
                        ) / windowWords.length,
                    bbox: unionBox(windowWords),
                    matchedText: windowWords.map((word) => word.text).join(' '),
                }
            }
        }

        return best
    }

    function emptyMatch(field: FieldResult, value: string): OcrFieldMatch {
        return {
            fieldName: field.fieldName,
            fieldLabel: formatFieldName(field.fieldName),
            value,
            score: 0,
            confidence: 0,
            bbox: null,
            matchedText: '',
        }
    }

    async function runOcrMatch() {
        if (!imagePreviewUrl || verificationFields.length === 0 || ocrRunning)
            return
        ocrRunning = true
        ocrError = null
        ocrProgress = 'Loading OCR engine...'
        ocrMatches = []
        try {
            const worker = await Tesseract.createWorker('eng', 1, {
                logger: (message) => {
                    if (!message.status) return
                    const pct = Number.isFinite(message.progress)
                        ? ` ${Math.round(message.progress * 100)}%`
                        : ''
                    ocrProgress = `${message.status}${pct}`
                },
            })
            await worker.setParameters({
                tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
            })
            const { data } = await worker.recognize(imagePreviewUrl)
            await worker.terminate()
            ocrText = data.text
            const words = collectWords(data)
            const matches = verificationFields
                .filter((field) => field.foundValue?.trim())
                .map((field) => matchField(field, words))
            ocrMatches = matches
            ocrProgress = `Matched ${matches.filter((match) => match.score >= MATCH_THRESHOLD).length} of ${matches.length} fields`
        } catch (err) {
            ocrError =
                err instanceof Error
                    ? err.message
                    : 'OCR matching failed in the browser'
            ocrProgress = ''
        } finally {
            ocrRunning = false
        }
    }

    function boxStyle(box: OcrBox) {
        if (!previewFrame || !previewImage) return ''
        const frame = previewFrame.getBoundingClientRect()
        const image = previewImage.getBoundingClientRect()
        const naturalWidth = previewImage.naturalWidth || image.width
        const naturalHeight = previewImage.naturalHeight || image.height
        const left =
            image.left - frame.left + (box.x0 / naturalWidth) * image.width
        const top =
            image.top - frame.top + (box.y0 / naturalHeight) * image.height
        const width = ((box.x1 - box.x0) / naturalWidth) * image.width
        const height = ((box.y1 - box.y0) / naturalHeight) * image.height
        return `left:${left}px;top:${top}px;width:${width}px;height:${height}px;`
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
                <div class="min-w-0">
                    <CardTitle
                        class="{workstation
                            ? 'text-sm'
                            : 'text-base'} font-bold text-gray-950"
                    >
                        {blankState ? 'Add Label Image' : 'Label Image'}
                    </CardTitle>
                    <p class="mt-1 truncate text-xs font-medium text-gray-500">
                        {files.length > 1
                            ? `${files.length} labels`
                            : imagePreviewUrl
                              ? 'Single label'
                              : 'Upload a label image'}
                    </p>
                </div>
                {#if imagePreviewUrl}
                    <button
                        type="button"
                        class="shrink-0 rounded border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                        onclick={() =>
                            document.getElementById('file-input-el')?.click()}
                    >
                        Change files
                    </button>
                {:else if blankState}
                    <FileTextIcon
                        size={28}
                        className="shrink-0 text-blue-700"
                    />
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
                        <!-- {#if verificationFields.length > 0}
                            <button
                                type="button"
                                class="h-7 rounded border border-gray-300 bg-white px-2.5 text-xs font-semibold text-gray-800 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-50"
                                disabled={ocrRunning}
                                onclick={runOcrMatch}
                            >
                                {ocrRunning
                                    ? 'OCR running...'
                                    : 'Run OCR match'}
                            </button>
                        {/if} -->
                        <button
                            type="button"
                            class="h-7 rounded border px-2.5 text-xs font-semibold transition-colors {zoomEnabled
                                ? 'border-gray-300 bg-white text-gray-800 shadow-sm'
                                : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-white'} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                            aria-pressed={zoomEnabled}
                            onclick={() => (zoomEnabled = !zoomEnabled)}
                        >
                            <div class="flex items-center gap-2">
                                Inspect {#if zoomEnabled}<div
                                        class="h-1.5 w-1.5 mt-0.5 bg-green-500 rounded-full"
                                    ></div>{:else}<div
                                        class="h-1.5 w-1.5 mt-0.5 bg-red-500 rounded-full"
                                    ></div>{/if}
                            </div>
                        </button>
                        <div
                            class="flex h-7 items-center overflow-hidden rounded border border-gray-300 bg-white shadow-sm"
                            aria-label="Inspect zoom controls"
                        >
                            <button
                                type="button"
                                class="flex h-full w-7 items-center justify-center text-sm font-bold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
                                aria-label="Decrease inspect zoom"
                                onclick={() => setZoom(zoomLevel - 0.25)}
                            >
                                -
                            </button>
                            <span
                                class="min-w-12 border-x border-gray-200 px-2 text-center text-xs font-semibold text-gray-700"
                            >
                                {zoomPercent}%
                            </span>
                            <button
                                type="button"
                                class="flex h-full w-7 items-center justify-center text-sm font-bold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
                                aria-label="Increase inspect zoom"
                                onclick={() => setZoom(zoomLevel + 0.25)}
                            >
                                +
                            </button>
                        </div>
                    {/if}
                </div>
            </div>
            <!-- {#if ocrProgress || ocrError || ocrMatches.length > 0}
                <div
                    class="mb-2 shrink-0 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs"
                >
                    <div
                        class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between"
                    >
                        <div class="min-w-0">
                            <p class="font-bold text-gray-900">
                                OCR field matching
                            </p>
                            <p
                                class="mt-0.5 truncate font-medium {ocrError
                                    ? 'text-red-700'
                                    : 'text-gray-600'}"
                            >
                                {ocrError ??
                                    ocrProgress ??
                                    'Run OCR to compare extracted values against image text.'}
                            </p>
                        </div>
                        {#if ocrMatches.length > 0}
                            <span
                                class="shrink-0 rounded border border-gray-200 bg-gray-50 px-2 py-1 font-semibold text-gray-700"
                            >
                                {matchedCount} matched · {ocrMatches.length -
                                    matchedCount} unmatched
                            </span>
                        {/if}
                    </div>
                    {#if ocrMatches.length > 0}
                        <div
                            class="mt-2 flex max-h-16 flex-wrap gap-1.5 overflow-auto"
                        >
                            {#each ocrMatches.slice(0, 10) as match (match.fieldName)}
                                <span
                                    class="rounded px-2 py-1 text-[11px] font-semibold {match.score >=
                                    MATCH_THRESHOLD
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-600'}"
                                    title={match.matchedText ||
                                        'No OCR phrase matched'}
                                >
                                    {match.fieldLabel}: {Math.round(
                                        match.score * 100
                                    )}%
                                </span>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/if} -->
            {#if !hideFileInput}
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    class="sr-only"
                    onchange={onFileInput}
                    id="file-input-el"
                />
            {/if}

            {#if imagePreviewUrl}
                <div class="flex min-h-0 flex-1 flex-col gap-2">
                    <div
                        bind:this={previewFrame}
                        class="relative min-h-0 flex-1 w-full overflow-hidden rounded border border-gray-300 bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:18px_18px] bg-[position:0_0,0_9px,9px_-9px,-9px_0] cursor-default shadow-inner"
                        role="region"
                        aria-label="Label image preview. Inspect on hover can be toggled in the viewer toolbar."
                        onpointerenter={() => (isHovering = true)}
                        onpointerleave={handlePointerLeave}
                        onpointermove={handlePointerMove}
                    >
                        <div
                            bind:this={previewSurface}
                            class="absolute left-1/2 top-1/2 origin-center will-change-transform transition-transform {zoomEnabled
                                ? 'duration-150'
                                : 'duration-200'} ease-out [--zoom-origin:50%_50%]"
                            style="transform: translate(-50%, -50%) scale({activeScale}); transform-origin: var(--zoom-origin); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; contain: paint;"
                        >
                            <img
                                bind:this={previewImage}
                                src={imagePreviewUrl}
                                alt="Preview"
                                style="display: block; max-width: 100%; max-height: 100%; object-fit: contain; user-select: none;"
                                draggable="false"
                            />
                        </div>
                        {#each visibleMatches as match (match.fieldName)}
                            {#if match.bbox}
                                <div
                                    class="pointer-events-none absolute border-2 {selectedFieldName ===
                                    match.fieldName
                                        ? 'border-blue-600 bg-blue-500/10'
                                        : 'border-amber-500 bg-amber-400/10'}"
                                    style={boxStyle(match.bbox)}
                                    title={match.fieldLabel}
                                >
                                    <span
                                        class="absolute -top-6 left-0 max-w-40 truncate rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-gray-900 shadow"
                                    >
                                        {match.fieldLabel}
                                    </span>
                                </div>
                            {/if}
                        {/each}
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
                            {zoomEnabled
                                ? 'Hover to inspect; adjust zoom above.'
                                : 'Inspect is off'}
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
                            or drag and drop label images anywhere on the screen
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
