<script lang="ts">
    import { browser } from '$app/environment'
    import type {
        VerificationResult,
        BatchLabelItem,
        BatchJobStatus,
    } from '$shared/index'
    import { Button } from '$lib/components/ui/button'
    import { Tooltip } from '$lib/components/ui/tooltip'
    import {
        FileTextIcon,
        FlagIcon,
        InfoIcon,
        ScaleIcon,
        UploadIcon,
    } from '$lib/components/ui/icon'

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
    let beverageType = $state<'beer' | 'wine' | 'distilled_spirits' | ''>('')
    let classType = $state('')
    let alcoholContent = $state('')
    let netContents = $state('')
    let producerName = $state('')
    let producerAddress = $state('')
    let countryOfOrigin = $state('')

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
        void handleSubmitForFiles(valid)
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
        beverageType = ''
        classType = ''
        countryOfOrigin = ''
        alcoholContent = ''
        netContents = ''
        producerName = ''
        producerAddress = ''
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

    // ── Debug ─────────────────────────────────────────────────────────────────────
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

    // ── Global Ctrl+V — fills application data fields from clipboard ──────────────
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
    class="mx-auto h-full max-w-[2200px] overflow-y-auto px-4 py-3 flex flex-col bg-slate-50"
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

    {#if reviewActive}
        <!-- Status banner -->
        <div class="mb-3 shrink-0">
            <VerificationReview
                {result}
                {loading}
                {comparing}
                {error}
                mode="banner"
                onMarkAllReviewed={handleMarkAllReviewed}
            />
        </div>

        <!-- Application data input — shown after extraction and after comparison (for re-comparing) -->
        <!-- {#if result !== null && !loading}
            <div class="mb-3 shrink-0">
                <ApplicationDataInput
                    bind:brandName
                    bind:producerName
                    bind:beverageType
                    bind:classType
                    bind:producerAddress
                    bind:countryOfOrigin
                    bind:alcoholContent
                    bind:netContents
                    loading={comparing}
                    hasResult={true}
                    onCompare={handleCompare}
                />
            </div>
        {/if} -->

        <!-- #region Main two-column review area -->
        <div
            class="grid min-h-[400px] grid-cols-1 gap-3 lg:h-[34rem] lg:grid-cols-[minmax(22rem,0.75fr)_minmax(44rem,1.25fr)]"
        >
            <MediaPanel
                {files}
                {imagePreviewUrl}
                {selectedFileIndex}
                {jobId}
                selectedFieldName={selectedReviewFieldName}
                workstation
                onFileInput={(e) => {
                    const fl = (e.currentTarget as HTMLInputElement).files
                    if (fl) applyFiles(fl)
                }}
                onSelectFile={selectFile}
                onRemoveFile={removeFile}
                {onDropZoneKeydown}
                onUseSingleFile={useSingleFile}
            />
            <VerificationReview
                {result}
                {loading}
                {comparing}
                {error}
                mode="body"
                onSelectedFieldChange={(fieldName) =>
                    (selectedReviewFieldName = fieldName)}
                onExport={handleExport}
                onMarkAllReviewed={handleMarkAllReviewed}
            />
        </div>

        <!-- #region Batch queue -->
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
            />
        </div>
        <!-- #endregion -->
    {:else}
        <!-- #region Pre-upload layout -->
        <div class="flex min-h-0 flex-1 flex-col gap-4">
            <div
                class="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(22rem,0.82fr)_minmax(34rem,1.18fr)] lg:items-stretch"
            >
                <MediaPanel
                    {files}
                    {imagePreviewUrl}
                    {selectedFileIndex}
                    {jobId}
                    selectedFieldName={selectedReviewFieldName}
                    blankState
                    onFileInput={(e) => {
                        const fl = (e.currentTarget as HTMLInputElement).files
                        if (fl) applyFiles(fl)
                    }}
                    onSelectFile={selectFile}
                    onRemoveFile={removeFile}
                    {onDropZoneKeydown}
                    onUseSingleFile={useSingleFile}
                />

                <div class="flex min-h-0 min-w-0 flex-col gap-4">
                    <section
                        class="rounded-md border border-gray-200 bg-white shadow-sm pb-4"
                    >
                        <div class="min-w-0 border-b border-gray-200 p-4">
                            <h2
                                class="inline-flex items-center gap-3 text-lg font-semibold text-gray-950"
                            >
                                <UploadIcon
                                    size={24}
                                    className="text-gray-600"
                                />
                                Upload a Label to Begin
                            </h2>
                            <p
                                class="mt-1 max-w-3xl text-sm text-gray-600 font-medium"
                            >
                                Upload a label image to start extraction and
                                review.
                            </p>
                            <p
                                class="mt-1 max-w-3xl text-sm text-gray-600 font-normal"
                            >
                                Application data can be added before or after
                                upload.
                            </p>
                        </div>

                        <div
                            class="mx-4 mt-5 grid grid-cols-1 overflow-hidden rounded border border-gray-200 bg-white sm:grid-cols-3"
                        >
                            <div class="flex items-center gap-3 px-4 py-3">
                                <FileTextIcon
                                    size={32}
                                    className="shrink-0 text-blue-700"
                                />
                                <div class="flex flex-col p-2">
                                    <p
                                        class="text-sm font-semibold text-slate-800"
                                    >
                                        Extract fields
                                    </p>
                                    <p class="text-xs text-gray-500">
                                        AI extracts label fields and values
                                    </p>
                                </div>
                            </div>
                            <div
                                class="flex items-center gap-3 border-t border-gray-200 px-4 sm:border-l sm:border-t-0"
                            >
                                <ScaleIcon
                                    size={32}
                                    className="shrink-0 text-blue-700"
                                />
                                <div class="flex flex-col p-2">
                                    <p
                                        class="text-sm font-semibold text-slate-800"
                                    >
                                        Compare data
                                    </p>
                                    <p class="text-xs text-gray-500">
                                        Match application values
                                    </p>
                                </div>
                            </div>

                            <div
                                class="flex items-center gap-1 border-t border-gray-200 px-4 sm:border-l sm:border-t-0"
                            >
                                <FlagIcon
                                    size={32}
                                    className="shrink-0 text-blue-700"
                                />
                                <div class="flex flex-col p-2">
                                    <p
                                        class="text-sm font-semibold text-slate-800"
                                    >
                                        Flag issues
                                    </p>
                                    <p class="text-xs text-gray-500">
                                        Show items needing review
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- <div
                            class="mx-4 mb-4 mt-5 flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950"
                        >
                            <InfoIcon size={18} className="shrink-0" />
                            Uploading a label starts the review workflow.
                        </div> -->
                    </section>

                    <!-- Optional: paste application data before upload -->
                    <div class="min-h-0 flex-1">
                        <ApplicationDataInput
                            bind:brandName
                            bind:producerName
                            bind:beverageType
                            bind:classType
                            bind:producerAddress
                            bind:countryOfOrigin
                            bind:alcoholContent
                            bind:netContents
                            {loading}
                            hasResult={false}
                            blankState
                            onCompare={handleCompare}
                        />
                    </div>
                </div>
            </div>

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
