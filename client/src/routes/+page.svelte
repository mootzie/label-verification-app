<script lang="ts">
    import { browser } from '$app/environment'
    import type {
        VerificationResult,
        BatchLabelItem,
        BatchJobStatus,
    } from '$shared/index'
    import { Button } from '$lib/components/ui/button'
    import { Tooltip } from '$lib/components/ui/tooltip'
    import { QueueIcon, UploadIcon } from '$lib/components/ui/icon'

    import MediaPanel from '$lib/components/workspace/MediaPanel.svelte'
    import ApplicationDataInput from '$lib/components/workspace/ApplicationDataInput.svelte'
    import BatchQueue from '$lib/components/workspace/BatchQueue.svelte'
    import VerificationReview from '$lib/components/workspace/VerificationReview.svelte'

    import {
        parseSmartPaste,
        buildOptionalApplicationData,
    } from '$lib/utils/application-builder'
    import { resizeForUpload } from '$lib/utils/image-resize'
    import {
        setupGlobalDragAndDrop,
        setupCtrlVHandler,
    } from '$lib/utils/globalDragAndDrop'
    import {
        MOCK_EXTRACTION,
        MOCK_COMPARISON,
        applyMockBatch,
    } from '$lib/utils/debug-mocks'
    import { exportBatchCsv, exportSingleLabelCsv } from '$lib/utils/export'
    import type { ReviewDecisions } from '$lib/utils/review-types'
    import DragAndDrop from '$lib/components/ui/dragAndDrop/DragAndDrop.svelte'

    // ── State ────────────────────────────────────────────────────────────────────
    let files = $state<File[]>([])
    let selectedFileIndex = $state<number | null>(null)
    let imagePreviewUrl = $state<string | null>(null)
    let globalDragActive = $state(false)

    // Application data — populated by paste/parse or manual entry in ApplicationDataInput
    let brandName = $state('')
    let beverageType = $state<'beer' | 'wine' | 'distilled_spirits'>(
        'distilled_spirits'
    )
    let classType = $state('')
    let alcoholContent = $state('')
    let netContents = $state('')
    let producerName = $state('')
    let producerAddress = $state('')
    let countryOfOrigin = $state('')
    // Type-specific optional fields
    let appellation = $state('')
    let ageStatement = $state('')
    let colorDisclosures = $state('')
    let commodityStatement = $state('')
    let sulfiteDeclaration = $state('')
    let foreignWinePct = $state('')
    let colorAdditives = $state('')
    let aspartameDeclaration = $state('')

    let loading = $state(false)
    let comparing = $state(false)
    let submitting = $state(false)
    let error = $state<string | null>(null)
    let result = $state<VerificationResult | null>(null)
    let selectedReviewFieldName = $state<string | null>(null)
    let jobId = $state<string | null>(null)
    let labels = $state<BatchLabelItem[]>([])
    let jobDone = $state(false)
    let es: EventSource | null = null

    // ── Derived ──────────────────────────────────────────────────────────────────
    let completedCount = $derived(
        labels.filter((l) => l.status === 'complete' || l.status === 'failed')
            .length
    )
    let batchProgress = $derived(
        labels.length > 0 ? (completedCount / labels.length) * 100 : 0
    )
    let headerProcessingTime = $derived(
        result?.processingTimeMs
            ? `Processed in ${(result.processingTimeMs / 1000).toFixed(1)}s`
            : loading
              ? 'Processing…'
              : 'Ready'
    )
    let reviewActive = $derived(result !== null || loading || error !== null)
    let labelUploaded = $derived(files.length > 0 && imagePreviewUrl !== null)
    let showReviewQueue = $derived(files.length > 1 || labels.length > 1)

    // ── File management ───────────────────────────────────────────────────────────
    function applyFiles(incoming: FileList | File[]) {
        const valid = Array.from(incoming).filter((f) =>
            ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
        )
        if (valid.length === 0) {
            error = 'Only JPEG, PNG, and WebP images are accepted'
            return
        }
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
        files = valid
        selectedFileIndex = 0
        imagePreviewUrl = URL.createObjectURL(files[0])
        error = null
        result = null
        selectedReviewFieldName = null
        jobId = null
        labels = []
        jobDone = false
    }

    function selectFile(index: number) {
        if (selectedFileIndex !== index) {
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
            selectedFileIndex = index
            // files[index] may be undefined for debug mocks or batch-only flows
            imagePreviewUrl = files[index]
                ? URL.createObjectURL(files[index])
                : imagePreviewUrl
        }
        const labelResult = labels[index]?.result
        if (labelResult) {
            result = labelResult
            selectedReviewFieldName = null
            error = null
        } else if (labels[index]) {
            // Item exists but result not ready yet — clear stale review so the
            // panel doesn't show the previous label's data
            result = null
            error = null
        }
    }

    function useSingleFile() {
        const first = files[0]
        if (!first) return
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
        files = [first]
        selectedFileIndex = 0
        imagePreviewUrl = URL.createObjectURL(first)
        result = null
        selectedReviewFieldName = null
        jobId = null
        labels = []
        jobDone = false
        error = null
        es?.close()
        es = null
    }

    function removeFile(i: number) {
        const wasSelected = selectedFileIndex === i
        files = files.filter((_, idx) => idx !== i)
        if (files.length === 0) {
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
            imagePreviewUrl = null
            selectedFileIndex = null
        } else if (
            wasSelected ||
            (selectedFileIndex !== null && selectedFileIndex >= files.length)
        ) {
            selectFile(Math.max(0, Math.min(i, files.length - 1)))
        } else if (selectedFileIndex !== null && selectedFileIndex > i) {
            selectedFileIndex--
        }
    }

    function clearAll() {
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
        files = []
        imagePreviewUrl = null
        selectedFileIndex = null
        brandName = ''
        beverageType = 'distilled_spirits'
        classType = ''
        countryOfOrigin = ''
        alcoholContent = ''
        netContents = ''
        producerName = ''
        producerAddress = ''
        appellation = ''
        ageStatement = ''
        colorDisclosures = ''
        commodityStatement = ''
        sulfiteDeclaration = ''
        foreignWinePct = ''
        colorAdditives = ''
        aspartameDeclaration = ''
        result = null
        selectedReviewFieldName = null
        jobId = null
        labels = []
        jobDone = false
        error = null
        es?.close()
        es = null
    }

    // ── Submission ────────────────────────────────────────────────────────────────
    async function handleSubmit(e?: Event) {
        e?.preventDefault()
        await handleSubmitForFiles(files)
    }

    async function handleSubmitForFiles(targetFiles: File[]) {
        if (targetFiles.length === 0 || loading || submitting) return
        if (targetFiles.length === 1) await handleSingleSubmit(targetFiles)
        else await handleBatchSubmit(targetFiles)
    }

    function appendOptionalApplication(fd: FormData) {
        const application = buildOptionalApplicationData({
            brandName,
            classType,
            beverageType,
            alcoholContent,
            netContents,
            producerName,
            producerAddress,
            countryOfOrigin,
            appellation,
            ageStatement,
            colorDisclosures,
            commodityStatement,
            sulfiteDeclaration,
            foreignWinePct,
            colorAdditives,
            aspartameDeclaration,
        })
        if (Object.keys(application).length > 0) {
            fd.append('application', JSON.stringify(application))
        }
    }

    async function handleSingleSubmit(targetFiles = files) {
        const image = targetFiles[0]
        if (!image) return
        const syntheticId = `single-${Date.now()}`
        loading = true
        result = null
        selectedReviewFieldName = null
        error = null
        // Set queue entry so the BatchQueue shows this label immediately
        jobId = syntheticId
        jobDone = false
        labels = [
            {
                labelId: syntheticId,
                filename: image.name,
                status: 'processing',
            },
        ]
        const formData = new FormData()
        formData.append('image', await resizeForUpload(image))
        appendOptionalApplication(formData)
        try {
            const res = await fetch('/api/verify', {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            if (!res.ok) {
                error = data.error ?? 'Verification failed'
                labels = [
                    {
                        ...labels[0],
                        status: 'failed',
                        error: error ?? undefined,
                    },
                ]
            } else {
                result = data as VerificationResult
                labels = [{ ...labels[0], status: 'complete', result }]
            }
        } catch {
            error = 'Network error'
            labels = [
                { ...labels[0], status: 'failed', error: 'Network error' },
            ]
        } finally {
            loading = false
            jobDone = true
        }
    }

    async function handleBatchSubmit(targetFiles = files) {
        if (targetFiles.length === 0) return
        submitting = true
        selectedReviewFieldName = null
        error = null
        const fd = new FormData()
        const resized = await Promise.all(targetFiles.map(resizeForUpload))
        resized.forEach((f) => fd.append('images', f))
        appendOptionalApplication(fd)
        try {
            const res = await fetch('/api/batch/upload', {
                method: 'POST',
                body: fd,
            })
            const data = await res.json()
            if (!res.ok) {
                error = data.error ?? 'Upload failed'
                submitting = false
                return
            }
            jobId = data.jobId
            labels = targetFiles.map((f, i) => ({
                labelId: `${jobId}-${i}`,
                filename: f.name,
                status: 'pending' as BatchJobStatus,
            }))
            openEventSource(jobId!)
        } catch {
            error = 'Network error'
            submitting = false
        }
    }

    // Re-run verification with application data, keeping existing result visible
    async function handleCompare() {
        if (files.length === 0 || loading || comparing) return
        comparing = true
        error = null
        const formData = new FormData()
        formData.append('image', await resizeForUpload(files[0]))
        appendOptionalApplication(formData)
        try {
            const res = await fetch('/api/verify', {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            if (!res.ok) error = data.error ?? 'Verification failed'
            else result = data as VerificationResult
        } catch {
            error = 'Network error'
        } finally {
            comparing = false
        }
    }

    function openEventSource(jid: string) {
        es = new EventSource(`/api/batch/${jid}/stream`)
        es.addEventListener('label', (e: MessageEvent) => {
            const update: BatchLabelItem = JSON.parse(e.data)
            labels = labels.map((l) =>
                l.labelId === update.labelId ? { ...l, ...update } : l
            )
        })
        es.addEventListener('done', () => {
            jobDone = true
            submitting = false
            es?.close()
            es = null
        })
        es.addEventListener('error', () => {
            if (es?.readyState === EventSource.CLOSED) {
                error = 'Connection lost'
                submitting = false
                es = null
            }
        })
    }

    function exportCsv() {
        exportBatchCsv(labels, jobId)
    }

    function handleExport(decisions: ReviewDecisions) {
        if (result && files[selectedFileIndex ?? 0]) {
            exportSingleLabelCsv(
                result,
                decisions,
                files[selectedFileIndex ?? 0].name
            )
        } else if (result) {
            exportSingleLabelCsv(
                result,
                decisions,
                labels[0]?.filename ?? 'label'
            )
        } else {
            exportBatchCsv(labels, jobId)
        }
    }

    function handleMarkAllReviewed(_decisions: ReviewDecisions) {
        // Mark the current queue item as complete in the queue
        labels = labels.map((l, i) =>
            i === (selectedFileIndex ?? 0) ? { ...l, status: 'complete' } : l
        )
    }

    function onDropZoneKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' || e.key === ' ') {
            if (browser) document.getElementById('file-input-el')?.click()
        }
    }

    // #region Debug
    function mockExtraction() {
        ;({ imagePreviewUrl, result } = MOCK_EXTRACTION)
        const id = `debug-extraction-${Date.now()}`
        jobId = id
        jobDone = true
        labels = [
            {
                labelId: id,
                filename: 'mock-label.png',
                status: 'complete',
                result: MOCK_EXTRACTION.result,
            },
        ]
    }
    function mockComparison() {
        ;({ imagePreviewUrl, result } = MOCK_COMPARISON)
        const id = `debug-comparison-${Date.now()}`
        jobId = id
        jobDone = true
        labels = [
            {
                labelId: id,
                filename: 'mock-label.png',
                status: 'complete',
                result: MOCK_COMPARISON.result,
            },
        ]
    }
    function mockBatch() {
        applyMockBatch(
            (id, lbs) => {
                jobId = id
                labels = lbs
            },
            (lbs) => {
                labels = lbs
                jobDone = true
            }
        )
    }

    // #region Global Ctrl+V — fills application data fields from clipboard
    $effect(() => setupCtrlVHandler(() => void smartPaste()))

    async function smartPaste() {
        let text: string
        try {
            text = await navigator.clipboard.readText()
        } catch {
            error = 'Clipboard access denied'
            return
        }
        const parsed = parseSmartPaste(text)
        if (parsed.brandName && !brandName) brandName = parsed.brandName
        if (parsed.producerName && !producerName)
            producerName = parsed.producerName
        if (parsed.producerAddress && !producerAddress)
            producerAddress = parsed.producerAddress
        if (parsed.countryOfOrigin && !countryOfOrigin)
            countryOfOrigin = parsed.countryOfOrigin
        if (parsed.beverageType && !beverageType)
            beverageType = parsed.beverageType as typeof beverageType
        if (parsed.classType && !classType) classType = parsed.classType
        if (parsed.alcoholContent && !alcoholContent)
            alcoholContent = parsed.alcoholContent
        if (parsed.netContents && !netContents) netContents = parsed.netContents
        error = null
    }

    // ── Global drag-and-drop ──────────────────────────────────────────────────────
    $effect(() =>
        setupGlobalDragAndDrop(
            (files) => applyFiles(files),
            (active) => {
                globalDragActive = active
            }
        )
    )
</script>

<main
    class="mx-auto flex h-full min-h-0 max-w-[2200px] flex-col overflow-hidden bg-slate-50 px-4 py-3"
>
    <header
        class="mb-3 flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
    >
        <div>
            <h1 class="text-lg font-bold text-gray-950">
                TTB Label Verification
            </h1>
            <p class="mt-0.5 text-xs font-medium text-gray-600">
                Verify alcohol beverage label compliance with TTB requirements.
            </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
            <span
                class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm"
            >
                <span
                    class="h-2.5 w-2.5 rounded-full {loading || submitting
                        ? 'bg-blue-500'
                        : error
                          ? 'bg-red-500'
                          : 'bg-green-500'}"
                    aria-hidden="true"
                ></span>
                {headerProcessingTime}
            </span>
            <!-- #region Debug buttons -->
            {#if import.meta.env.DEV}
                <Button
                    variant="outline"
                    size="sm"
                    class="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                    onclick={mockExtraction}>Debug: Extraction</Button
                >
                <Button
                    variant="outline"
                    size="sm"
                    class="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                    onclick={mockComparison}>Debug: Comparison</Button
                >
                <Button
                    variant="outline"
                    size="sm"
                    class="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                    onclick={mockBatch}>Debug: Batch</Button
                >
            {/if}
            <!-- #endregion -->
            {#if jobDone || result}
                <Tooltip text="Clear everything and start fresh">
                    <Button variant="outline" size="sm" onclick={clearAll}
                        >New Verification</Button
                    >
                </Tooltip>
            {/if}
        </div>
    </header>

    <!-- Persistent two-column layout -->
    <div
        class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[minmax(22rem,0.42fr)_1fr]"
    >
        <!-- LEFT PANEL: always visible -->
        <div class="min-h-0 overflow-y-auto pr-1">
            <div class="flex min-h-full flex-col gap-3">
                <div
                    class={labelUploaded
                        ? 'min-h-0 flex-1 [&>div]:min-h-full'
                        : 'shrink-0'}
                >
                    <ApplicationDataInput
                        bind:brandName
                        bind:producerName
                        bind:beverageType
                        bind:classType
                        bind:producerAddress
                        bind:countryOfOrigin
                        bind:alcoholContent
                        bind:netContents
                        bind:appellation
                        bind:ageStatement
                        bind:colorDisclosures
                        bind:commodityStatement
                        bind:sulfiteDeclaration
                        bind:foreignWinePct
                        bind:colorAdditives
                        bind:aspartameDeclaration
                        {loading}
                    />
                </div>

                <!-- Label image upload -->
                <div
                    class="{labelUploaded
                        ? 'shrink-0'
                        : 'min-h-[14rem] flex-1'} flex flex-col rounded-md border border-gray-200 bg-white shadow-sm"
                >
                    <div class="border-b border-gray-200 px-4 py-3">
                        <h3 class="text-sm font-semibold text-gray-950">
                            Label Image
                        </h3>
                        <p class="mt-0.5 text-xs text-gray-500">
                            Upload the label image to extract and verify fields.
                        </p>
                    </div>
                    <div
                        class="{labelUploaded ? '' : 'min-h-0 flex-1'} flex p-4"
                    >
                        <input
                            type="file"
                            id="file-input-el"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            class="sr-only"
                            onchange={(e) => {
                                const fl = (e.currentTarget as HTMLInputElement)
                                    .files
                                if (fl) applyFiles(fl)
                            }}
                        />
                        {#if files.length > 0}
                            <div class="flex w-full flex-col gap-3">
                                <div class="flex items-center gap-2">
                                    <span
                                        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700"
                                        aria-hidden="true">✓</span
                                    >
                                    <span
                                        class="truncate text-sm font-medium text-gray-700"
                                        >{files[selectedFileIndex ?? 0]?.name ??
                                            files[0].name}</span
                                    >
                                </div>
                                <p class="text-xs font-medium text-gray-500">
                                    Uploaded and ready for verification.
                                </p>
                                <button
                                    type="button"
                                    class="inline-flex h-9 w-fit items-center rounded border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                    onclick={() =>
                                        document
                                            .getElementById('file-input-el')
                                            ?.click()}
                                >
                                    Replace image
                                </button>
                            </div>
                        {:else}
                            <button
                                type="button"
                                class="flex min-h-[12rem] w-full flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-300 bg-white p-6 text-center transition-all hover:border-blue-500 hover:bg-blue-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                aria-label="Upload label image"
                                onclick={() =>
                                    document
                                        .getElementById('file-input-el')
                                        ?.click()}
                            >
                                <div
                                    class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
                                >
                                    <UploadIcon
                                        size={20}
                                        className="text-gray-500"
                                    />
                                </div>
                                <p class="text-sm font-semibold text-gray-700">
                                    Drag and drop label images anywhere on the
                                    screen
                                </p>
                                <p class="text-xs text-gray-500">or</p>
                                <span
                                    class="rounded border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Browse Files
                                </span>
                                <p class="text-xs text-gray-400">
                                    JPEG, PNG, WebP supported
                                </p>
                            </button>
                        {/if}
                    </div>
                </div>

                <!-- Verify button -->
                <div
                    class="sticky bottom-0 z-20 -mx-1 flex shrink-0 flex-col gap-1.5 bg-slate-50/95 px-1 pb-1 pt-3 backdrop-blur"
                >
                    <Button
                        disabled={files.length === 0 || loading || submitting}
                        onclick={handleSubmit}
                        class="h-11 w-full bg-blue-900 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                    >
                        {#if loading}
                            Verifying…
                        {:else}
                            <svg
                                class="mr-2 h-4 w-4 shrink-0"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                aria-hidden="true"
                            >
                                <path d="M9 11l3 3L22 4" /><path
                                    d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
                                />
                            </svg>
                            Verify Label
                        {/if}
                    </Button>
                    {#if files.length === 0}
                        <p class="text-center text-sm text-gray-600">
                            Upload a label image to enable verification.
                        </p>
                    {/if}
                </div>
            </div>
        </div>

        <!-- RIGHT PANEL: results -->
        <div class="flex min-h-0 flex-col">
            {#if reviewActive || labelUploaded}
                <div
                    class="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(18rem,0.55fr)_1fr]"
                >
                    <div class="min-h-0 min-w-0 overflow-hidden">
                        <MediaPanel
                            {files}
                            {imagePreviewUrl}
                            {selectedFileIndex}
                            {jobId}
                            selectedFieldName={selectedReviewFieldName}
                            workstation
                            hideFileInput={true}
                            onFileInput={(e) => {
                                const fl = (
                                    e.currentTarget as HTMLInputElement
                                ).files
                                if (fl) applyFiles(fl)
                            }}
                            onSelectFile={selectFile}
                            onRemoveFile={removeFile}
                            {onDropZoneKeydown}
                            onUseSingleFile={useSingleFile}
                        />
                    </div>
                    {#if reviewActive}
                        <div class="min-h-0 min-w-0 overflow-hidden">
                            <VerificationReview
                                {result}
                                {loading}
                                {comparing}
                                {error}
                                {beverageType}
                                mode="body"
                                onSelectedFieldChange={(fieldName) =>
                                    (selectedReviewFieldName = fieldName)}
                                onExport={handleExport}
                                onMarkAllReviewed={handleMarkAllReviewed}
                            />
                        </div>
                    {:else}
                        <div
                            class="flex min-h-0 flex-1 items-center justify-center rounded-md border border-gray-200 bg-white shadow-sm"
                        >
                            <div
                                class="flex flex-col items-center gap-3 p-8 text-center"
                            >
                                <div
                                    class="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100"
                                >
                                    <QueueIcon
                                        size={28}
                                        className="text-gray-400"
                                    />
                                </div>
                                <p
                                    class="text-base font-semibold text-gray-700"
                                >
                                    No verification results yet
                                </p>
                                <p class="max-w-xs text-sm text-gray-400">
                                    Click "Verify Label" to see results here.
                                </p>
                                <Button
                                    disabled={files.length === 0 ||
                                        loading ||
                                        submitting}
                                    onclick={handleSubmit}
                                    class="h-11 w-full bg-blue-900 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                                >
                                    {#if loading}
                                        Verifying…
                                    {:else}
                                        <svg
                                            class="mr-2 h-4 w-4 shrink-0"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            aria-hidden="true"
                                        >
                                            <path d="M9 11l3 3L22 4" /><path
                                                d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
                                            />
                                        </svg>
                                        Verify Label
                                    {/if}
                                </Button>
                            </div>
                        </div>
                    {/if}
                </div>
            {:else}
                <div
                    class="flex min-h-0 flex-1 items-center justify-center rounded-md border border-gray-200 bg-white shadow-sm"
                >
                    <div
                        class="flex flex-col items-center gap-3 p-8 text-center"
                    >
                        <div
                            class="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100"
                        >
                            <QueueIcon size={28} className="text-gray-400" />
                        </div>
                        <p class="text-base font-semibold text-gray-700">
                            No verification results yet
                        </p>
                        <p class="max-w-xs text-sm text-gray-400">
                            Upload a label image and click "Verify Label" to see
                            results here.
                        </p>
                    </div>
                </div>
            {/if}
        </div>
    </div>

    {#if showReviewQueue}
        <!-- Batch queue — shown only for multi-label review -->
        <div class="mt-3 shrink-0">
            <BatchQueue
                {jobId}
                {jobDone}
                {labels}
                {completedCount}
                {batchProgress}
                {files}
                {selectedFileIndex}
                onSelectFile={selectFile}
                onExportCsv={exportCsv}
                onBatchUpload={() =>
                    document.getElementById('file-input-el')?.click()}
                onClearQueue={clearAll}
            />
        </div>
    {/if}
</main>

<DragAndDrop {globalDragActive} />
