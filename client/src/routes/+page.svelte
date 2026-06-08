<script lang="ts">
    // to whom it may concern: yes this file is very large, but it's mostly UI and state management for a complex single-page app. Breaking it up would make it harder to understand and maintain, not easier. Please forgive the size of this one file
    import { browser } from '$app/environment'
    import { PUBLIC_API_URL } from '$env/static/public'

    const apiBase = PUBLIC_API_URL || 'http://localhost:3000'
    import type { VerificationResult, FieldResult, OverallStatus, BatchLabelItem, BatchJobStatus } from '$shared/index'
    import { Button } from '$lib/components/ui/button'
    import { Tooltip } from '$lib/components/ui/tooltip'
    import { UploadIcon } from '$lib/components/ui/icon'

    import MediaPanel from '$lib/components/workspace/MediaPanel.svelte'
    import ApplicationDataInput from '$lib/components/workspace/ApplicationDataInput.svelte'
    import BatchQueue from '$lib/components/workspace/BatchQueue.svelte'
    import VerificationReview from '$lib/components/workspace/VerificationReview.svelte'

    import { parseSmartPaste, buildOptionalApplicationData } from '$lib/utils/applicationBuilder'
    import { resizeForUpload } from '$lib/utils/imageResize'
    import { setupGlobalDragAndDrop, setupCtrlVHandler } from '$lib/utils/globalDragAndDrop'
    import { DEMO_SCENARIOS, DEMO_BULK } from '$lib/utils/debugMocks'
    import type { DemoScenario } from '$lib/utils/debugMocks'
    import { exportBatchCsv, exportSingleLabelCsv } from '$lib/utils/export'
    import type { ReviewDecisions } from '$lib/utils/reviewTypes'
    import DragAndDrop from '$lib/components/ui/dragAndDrop/DragAndDrop.svelte'
    import type { ApplicationFormValues } from '$lib/components/workspace/ApplicationDataInput.svelte'

    // ── AI provider health ────────────────────────────────────────────────────────
    interface AIProviderHealth {
        provider: string
        configured: boolean
        available: boolean
        mode: 'real' | 'mock'
        message: string
    }
    let aiHealth = $state<AIProviderHealth | null>(null)

    $effect(() => {
        if (!browser) return
        fetch(`${apiBase}/api/ai/health`)
            .then((r) => r.json())
            .then((data: AIProviderHealth) => {
                aiHealth = data
            })
            .catch(() => {})
    })

    function aiProviderLabel(health: AIProviderHealth): string {
        if (health.mode === 'mock') return 'Mock Mode'
        if (health.provider === 'azure_foundry') return 'Azure Foundry'
        return 'Claude API'
    }

    // ── State ────────────────────────────────────────────────────────────────────
    let files = $state<File[]>([])
    let selectedFileIndex = $state<number | null>(null)
    let imagePreviewUrl = $state<string | null>(null)
    let globalDragActive = $state(false)

    function emptyApplicationData(): ApplicationFormValues {
        return {
            brandName: '',
            beverageType: 'distilled_spirits',
            classType: '',
            alcoholContent: '',
            netContents: '',
            producerName: '',
            producerAddress: '',
            countryOfOrigin: '',
            appellation: '',
            ageStatement: '',
            colorDisclosures: '',
            commodityStatement: '',
            sulfiteDeclaration: '',
            foreignWinePct: '',
            colorAdditives: '',
            aspartameDeclaration: '',
        }
    }

    // Application data - populated by paste/parse or manual entry in ApplicationDataInput
    let applicationData = $state<ApplicationFormValues>(emptyApplicationData())

    let loading = $state(false)
    let streaming = $state(false)
    let streamStartMs = $state<number | null>(null)
    let streamElapsedMs = $state<number | null>(null)
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
    let completedCount = $derived(labels.filter((l) => l.status === 'complete' || l.status === 'failed').length)
    let batchProgress = $derived(labels.length > 0 ? (completedCount / labels.length) * 100 : 0)
    let headerProcessingTime = $derived(streamElapsedMs !== null ? `Streamed in ${(streamElapsedMs / 1000).toFixed(1)}s` : streaming ? 'Streaming…' : loading ? 'Processing…' : 'Ready')
    let reviewActive = $derived(result !== null || loading || error !== null)
    let labelUploaded = $derived(files.length > 0 && imagePreviewUrl !== null)
    let showReviewQueue = $derived(files.length > 1 || labels.length > 1)

    // ── File management ───────────────────────────────────────────────────────────
    function applyFiles(incoming: FileList | File[]) {
        const valid = Array.from(incoming).filter((f) => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type))
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

        // focus the submit button after file selection so users can hit Enter to submit without
    }

    function selectFile(index: number) {
        if (selectedFileIndex !== index) {
            if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
            selectedFileIndex = index
            // files[index] may be undefined for debug mocks or batch-only flows
            imagePreviewUrl = files[index] ? URL.createObjectURL(files[index]) : imagePreviewUrl
        }
        const labelResult = labels[index]?.result
        if (labelResult) {
            result = labelResult
            selectedReviewFieldName = null
            error = null
        } else if (labels[index]) {
            // Item exists but result not ready yet - clear stale review so the
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
        } else if (wasSelected || (selectedFileIndex !== null && selectedFileIndex >= files.length)) {
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
        applicationData = emptyApplicationData()
        result = null
        selectedReviewFieldName = null
        jobId = null
        labels = []
        jobDone = false
        error = null
        streaming = false
        streamStartMs = null
        streamElapsedMs = null
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
            ...applicationData,
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
        streaming = false
        streamStartMs = null
        streamElapsedMs = null
        result = null
        selectedReviewFieldName = null
        error = null
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

        let res: Response
        try {
            res = await fetch(`${apiBase}/api/verify/stream`, {
                method: 'POST',
                body: formData,
            })
        } catch {
            error = 'Network error'
            labels = [{ ...labels[0], status: 'failed', error: 'Network error' }]
            loading = false
            jobDone = true
            return
        }

        if (!res.ok || !res.body) {
            let errMsg = 'Verification failed'
            try {
                errMsg = (await res.json()).error ?? errMsg
            } catch {
                /* ignore */
            }
            error = errMsg
            labels = [{ ...labels[0], status: 'failed', error: errMsg }]
            loading = false
            jobDone = true
            return
        }

        // Create the result object once - VerificationReview's decisions/expandedFields
        // reset fires on this reference change, then stays stable as we mutate in place.
        result = { overallStatus: 'warning' as OverallStatus, fields: [] }
        streaming = true
        streamStartMs = Date.now()

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let sseBuffer = ''

        try {
            outer: while (true) {
                const { done, value } = await reader.read()
                if (done) break

                sseBuffer += decoder.decode(value, { stream: true })
                const parts = sseBuffer.split('\n\n')
                sseBuffer = parts.pop() ?? ''

                for (const part of parts) {
                    if (!part.startsWith('data: ')) continue
                    const payload = part.slice(6).trim()
                    if (payload === '[DONE]') break outer

                    let event: Record<string, unknown>
                    try {
                        event = JSON.parse(payload)
                    } catch {
                        continue
                    }

                    if (event.type === 'field') {
                        result!.fields.push(event as unknown as FieldResult)
                        result = result // surface mutation to Svelte reactivity
                    } else if (event.type === 'done') {
                        result!.overallStatus = event.overallStatus as OverallStatus
                        if (event.processingTimeMs != null) result!.processingTimeMs = event.processingTimeMs as number
                        if (event.imageQuality != null) result!.imageQuality = event.imageQuality as VerificationResult['imageQuality']
                        if (event.imageNotes != null) result!.imageNotes = event.imageNotes as string
                        result = result
                        streamElapsedMs = streamStartMs !== null ? Date.now() - streamStartMs : null
                        labels = [{ ...labels[0], status: 'complete', result }]
                    } else if (event.type === 'error') {
                        error = (event.error as string) ?? 'Verification failed'
                        if (result!.fields.length > 0) {
                            result!.overallStatus = 'fail' as OverallStatus
                            result = result
                        } else {
                            result = null
                        }
                        labels = [
                            {
                                ...labels[0],
                                status: 'failed',
                                error: error ?? undefined,
                            },
                        ]
                        break outer
                    }
                }
            }
        } catch {
            if (!result || result.fields.length === 0) {
                error = 'Network error during verification'
                result = null
                labels = [{ ...labels[0], status: 'failed', error: 'Network error' }]
            }
        } finally {
            loading = false
            streaming = false
            streamStartMs = null
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
            const res = await fetch(`${apiBase}/api/batch/upload`, {
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

    function openEventSource(jid: string) {
        es = new EventSource(`${apiBase}/api/batch/${jid}/stream`)
        es.addEventListener('label', (e: MessageEvent) => {
            const update: BatchLabelItem = JSON.parse(e.data)
            labels = labels.map((l) => (l.labelId === update.labelId ? { ...l, ...update } : l))
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
            exportSingleLabelCsv(result, decisions, files[selectedFileIndex ?? 0].name)
        } else if (result) {
            exportSingleLabelCsv(result, decisions, labels[0]?.filename ?? 'label')
        } else {
            exportBatchCsv(labels, jobId)
        }
    }

    function handleMarkAllReviewed(_decisions: ReviewDecisions) {
        // Mark the current queue item as complete in the queue
        labels = labels.map((l, i) => (i === (selectedFileIndex ?? 0) ? { ...l, status: 'complete' } : l))
    }

    function onDropZoneKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' || e.key === ' ') {
            if (browser) document.getElementById('file-input-el')?.click()
        }
    }

    // #region Demo scenarios
    let showDemoPanel = $state(false)

    function applyDemoAppData(appData: (typeof DEMO_SCENARIOS)[0]['appData']) {
        applicationData = {
            ...emptyApplicationData(),
            ...appData,
            countryOfOrigin: appData.countryOfOrigin ?? '',
            appellation: appData.appellation ?? '',
            ageStatement: appData.ageStatement ?? '',
            colorDisclosures: appData.colorDisclosures ?? '',
            commodityStatement: appData.commodityStatement ?? '',
            sulfiteDeclaration: appData.sulfiteDeclaration ?? '',
            foreignWinePct: appData.foreignWinePct ?? '',
            colorAdditives: appData.colorAdditives ?? '',
            aspartameDeclaration: appData.aspartameDeclaration ?? '',
        }
    }

    async function fetchDemoFile(path: string, filename: string): Promise<File> {
        const res = await fetch(path)
        const blob = await res.blob()
        return new File([blob], filename, { type: 'image/png' })
    }

    // Preview: load real image + set pre-baked result instantly, no API call.
    async function previewScenario(scenario: DemoScenario) {
        showDemoPanel = false
        error = null
        let file: File
        try {
            file = await fetchDemoFile(scenario.imagePath, `${scenario.id}.png`)
        } catch {
            error = 'Could not load demo image'
            return
        }
        applyFiles([file])
        applyDemoAppData(scenario.appData)
        result = scenario.previewResult
        selectedReviewFieldName = null
        const id = `preview-${scenario.id}-${Date.now()}`
        jobId = id
        jobDone = true
        labels = [
            {
                labelId: id,
                filename: `${scenario.id}.png`,
                status: 'complete',
                result: scenario.previewResult,
            },
        ]
    }

    // Load Demo: load real image + submit to Claude API.
    async function loadScenario(scenario: DemoScenario) {
        showDemoPanel = false
        error = null
        let file: File
        try {
            file = await fetchDemoFile(scenario.imagePath, `${scenario.id}.png`)
        } catch {
            error = 'Could not load demo image'
            return
        }
        applyFiles([file])
        applyDemoAppData(scenario.appData)
        await handleSubmitForFiles([file])
    }

    // Preview batch: load real images + pre-baked results instantly, no API call.
    async function previewBatchDemo() {
        showDemoPanel = false
        error = null
        let fetchedFiles: File[]
        try {
            fetchedFiles = await Promise.all(DEMO_BULK.imagePaths.map((p, i) => fetchDemoFile(p, DEMO_BULK.filenames[i])))
        } catch {
            error = 'Could not load demo images'
            return
        }
        applyFiles(fetchedFiles)
        applyDemoAppData(DEMO_BULK.appData)
        const id = `preview-batch-${Date.now()}`
        jobId = id
        jobDone = true
        labels = fetchedFiles.map((f, i) => ({
            labelId: `${id}-${i}`,
            filename: f.name,
            status: 'complete' as const,
            result: DEMO_BULK.previewResults[i],
        }))
        result = DEMO_BULK.previewResults[0]
        selectedReviewFieldName = null
    }

    // Load Batch Demo: load real images + submit all to Claude API.
    async function loadBatchDemo() {
        showDemoPanel = false
        error = null
        let fetchedFiles: File[]
        try {
            fetchedFiles = await Promise.all(DEMO_BULK.imagePaths.map((p, i) => fetchDemoFile(p, DEMO_BULK.filenames[i])))
        } catch {
            error = 'Could not load demo images'
            return
        }
        applyFiles(fetchedFiles)
        applyDemoAppData(DEMO_BULK.appData)
        await handleSubmitForFiles(fetchedFiles)
    }

    // #region Global Ctrl+V - fills application data fields from clipboard
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
        if (parsed.brandName && !applicationData.brandName) applicationData.brandName = parsed.brandName
        if (parsed.producerName && !applicationData.producerName) applicationData.producerName = parsed.producerName
        if (parsed.producerAddress && !applicationData.producerAddress) applicationData.producerAddress = parsed.producerAddress
        if (parsed.countryOfOrigin && !applicationData.countryOfOrigin) applicationData.countryOfOrigin = parsed.countryOfOrigin
        if (parsed.beverageType && !applicationData.beverageType) applicationData.beverageType = parsed.beverageType as ApplicationFormValues['beverageType']
        if (parsed.classType && !applicationData.classType) applicationData.classType = parsed.classType
        if (parsed.alcoholContent && !applicationData.alcoholContent) applicationData.alcoholContent = parsed.alcoholContent
        if (parsed.netContents && !applicationData.netContents) applicationData.netContents = parsed.netContents
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

<main class="mx-auto flex h-full min-h-0 max-w-[2200px] flex-col overflow-hidden bg-slate-50 px-4 py-3">
    <header class="mb-2 flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
            <h1 class="text-lg font-bold text-gray-950">TTB Label Verification</h1>
            <p class="mt-0.5 text-xs font-medium text-gray-600">Verify alcohol beverage label compliance with TTB requirements.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
            <a href="/docs" class="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 hover:text-gray-900">Docs</a>
            {#if aiHealth}
                <span title={aiHealth.message} class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm">
                    <span class="h-2.5 w-2.5 rounded-full {aiHealth.mode === 'mock' ? 'bg-amber-400' : aiHealth.available ? 'bg-green-500' : 'bg-red-500'}" aria-hidden="true"></span>
                    AI: {aiProviderLabel(aiHealth)}
                </span>
            {/if}
            <span class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm">
                <span class="h-2.5 w-2.5 rounded-full {loading || submitting ? 'bg-blue-500' : error ? 'bg-red-500' : 'bg-green-500'}" aria-hidden="true"></span>
                {headerProcessingTime}
            </span>
            <!-- Demo scenarios -->
            <div class="relative">
                <Button variant="outline" size="sm" class="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100" onclick={() => (showDemoPanel = !showDemoPanel)}>Load Demo</Button>
                {#if showDemoPanel}
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div class="absolute left-0 md:right-0 top-full z-50 mt-1 w-xl rounded-md border border-gray-200 bg-white shadow-lg" onkeydown={(e) => e.key === 'Escape' && (showDemoPanel = false)}>
                        <div class="border-b border-gray-100 px-3 py-2">
                            <p class="text-xs font-semibold text-gray-700">Demo Scenarios</p>
                            <div class="mt-1 flex items-center gap-3 text-xs text-gray-500">
                                <span>
                                    <span class="font-medium text-gray-700">Preview</span>
                                    - instant pre-baked result
                                </span>
                                <span>·</span>
                                <span>
                                    <span class="font-medium text-indigo-700">Run</span>
                                    - real Claude API
                                </span>
                            </div>
                        </div>
                        <ul class="py-1 divide-y">
                            {#each DEMO_SCENARIOS as scenario (scenario.id)}
                                <li class="flex items-center gap-1 px-2 py-1.5">
                                    <span class="h-2 w-2 shrink-0 rounded-full {scenario.status === 'pass' ? 'bg-green-500' : scenario.status === 'warning' ? 'bg-amber-400' : 'bg-red-500'}" aria-hidden="true"></span>
                                    <span class="min-w-0 flex-1 px-1">
                                        <span class="block truncate md:text-sm text-xs font-medium text-gray-900">
                                            {scenario.label}
                                        </span>
                                        <span class="block truncate md:text-xs text-[10px] text-gray-500">
                                            {scenario.description}
                                        </span>
                                    </span>
                                    <button type="button" class="shrink-0 rounded border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" onclick={() => previewScenario(scenario)}>Preview</button>
                                    <button type="button" class="shrink-0 rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600" onclick={() => loadScenario(scenario)}>Run</button>
                                </li>
                            {/each}
                            <li class="flex items-center gap-1 border-t border-gray-100 px-2 py-1.5">
                                <span class="h-2 w-2 shrink-0 rounded-full bg-blue-400" aria-hidden="true"></span>
                                <span class="min-w-0 flex-1 px-1">
                                    <span class="block truncate md:text-sm text-xs font-medium text-gray-900">
                                        {DEMO_BULK.label}
                                    </span>
                                    <span class="block truncate md:text-xs text-[10px] text-gray-500">
                                        {DEMO_BULK.description}
                                    </span>
                                </span>
                                <button type="button" class="shrink-0 rounded border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" onclick={previewBatchDemo}>Preview</button>
                                <button type="button" class="shrink-0 rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600" onclick={loadBatchDemo}>Run</button>
                            </li>
                        </ul>
                    </div>
                    <button type="button" class="fixed inset-0 z-40 cursor-default" aria-label="Close demo panel" tabindex="-1" onclick={() => (showDemoPanel = false)}></button>
                {/if}
            </div>
            {#if jobDone || result}
                <Button variant="primary" size="sm" onclick={clearAll}>New Verification</Button>
            {/if}
        </div>
    </header>

    {#if aiHealth?.mode === 'mock'}
        <div class="mb-3 flex shrink-0 items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900" role="alert">
            <span class="shrink-0">⚠</span>
            <span>Mock Mode Active — AI provider is not configured. Results are simulated and must not be used for compliance review.</span>
        </div>
    {/if}

    {#if !reviewActive}
        <div class="mb-3 flex shrink-0 items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900">
            <UploadIcon size={16} className="shrink-0 text-blue-700" />
            <span>Tip: Drag and drop label images anywhere on this screen to upload.</span>
        </div>
    {/if}

    {#if reviewActive}
        <!-- Review phase: keep attention on the document and verification results. -->
        <div class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[minmax(22rem,0.58fr)_1fr]">
            <div class="min-h-0 min-w-0 overflow-hidden">
                <MediaPanel
                    {files}
                    {imagePreviewUrl}
                    {selectedFileIndex}
                    workstation
                    hideFileInput={true}
                    onFileInput={(e) => {
                        const fl = (e.currentTarget as HTMLInputElement).files
                        if (fl) applyFiles(fl)
                    }}
                    onUseSingleFile={useSingleFile} />
            </div>
            <div class="min-h-0 min-w-0 overflow-hidden">
                <VerificationReview {result} {loading} {comparing} {error} {applicationData} mode="body" onSelectedFieldChange={(fieldName) => (selectedReviewFieldName = fieldName)} onExport={handleExport} onMarkAllReviewed={handleMarkAllReviewed} />
            </div>
        </div>
    {:else}
        <!-- Intake phase: application data left, upload and queue blank slate right. -->
        <div class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[minmax(22rem,0.42fr)_1fr]">
            <div class="h-full min-h-0 overflow-hidden pr-1">
                <div class="flex h-full min-h-0 flex-col gap-3">
                    <div class="min-h-0 flex-1 [&>div]:h-full">
                        <ApplicationDataInput bind:values={applicationData} {loading} />
                    </div>

                    <div class="sticky bottom-0 z-20 -mx-1 flex shrink-0 flex-col gap-1.5 bg-slate-50/95 px-1 pb-1 pt-3 backdrop-blur">
                        <Button disabled={files.length === 0 || loading || submitting} onclick={handleSubmit} variant="primary">
                            {#if loading}
                                Verifying…
                            {:else}
                                <svg class="mr-2 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                    <path d="M9 11l3 3L22 4" />
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                </svg>
                                Verify Label
                            {/if}
                        </Button>
                        {#if files.length === 0}
                            <p class="text-center text-sm text-gray-600 hidden md:block">Drag and drop an image anywhere on the screen to enable verification.</p>
                        {/if}
                    </div>
                </div>
            </div>

            <div class="grid min-h-0 grid-rows-[minmax(0,2fr)_minmax(0,1fr)] gap-3 overflow-hidden">
                <section class="flex min-h-0 flex-col rounded-md border border-gray-200 bg-white shadow-sm">
                    <div class="px-4 py-3">
                        <h2 class="panel-title">Label Image Upload</h2>
                        <p class="mt-0.5 text-xs font-medium text-gray-500">Add a single label image to begin verification.</p>
                    </div>
                    <div class="flex min-h-0 flex-1 p-4 pt-0">
                        <input
                            type="file"
                            id="file-input-el"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            class="sr-only"
                            onchange={(e) => {
                                const fl = (e.currentTarget as HTMLInputElement).files
                                if (fl) applyFiles(fl)
                            }} />
                        {#if files.length > 0}
                            <div class="flex min-h-0 w-full flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed border-blue-200 bg-blue-50/20 p-8 text-center">
                                <div class="flex h-16 w-16 items-center justify-center rounded-full border border-green-200 bg-green-50 shadow-sm ring-4 ring-green-50" aria-hidden="true">
                                    <svg class="h-7 w-7 text-green-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                </div>
                                <div class="max-w-lg">
                                    <p class="text-base font-bold text-gray-900">
                                        {files.length} label{files.length === 1 ? '' : 's'} ready for verification
                                    </p>
                                    <div class="mt-3 max-h-28 min-w-[20rem] max-w-xl overflow-y-auto rounded-md border border-gray-200 bg-white text-left shadow-sm">
                                        {#each files as file, index}
                                            <div class="flex items-center gap-2 border-b border-gray-100 px-3 py-2 last:border-b-0">
                                                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-50 text-[11px] font-bold text-green-700" aria-hidden="true">
                                                    {index + 1}
                                                </span>
                                                <span class="min-w-0 flex-1 truncate text-sm font-medium text-gray-700" title={file.name}>
                                                    {file.name}
                                                </span>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                                <div class="flex flex-wrap justify-center gap-2">
                                    <Button variant="outline" size="sm" onclick={() => document.getElementById('file-input-el')?.click()}>Replace files</Button>
                                </div>
                            </div>
                        {:else}
                            <button type="button" class="flex min-h-0 w-full flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-blue-200 bg-white p-8 text-center transition-all hover:border-blue-500 hover:bg-blue-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" aria-label="Upload label image" onclick={() => document.getElementById('file-input-el')?.click()}>
                                <div class="md:flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700 hidden">
                                    <UploadIcon size={28} className="text-blue-700" />
                                </div>
                                <p class="text-base font-bold text-gray-900">Drag and drop label images here</p>
                                <div class="flex w-full max-w-xs items-center gap-3 text-xs text-gray-400" aria-hidden="true">
                                    <span class="h-px flex-1 bg-gray-200"></span>
                                    <span>or</span>
                                    <span class="h-px flex-1 bg-gray-200"></span>
                                </div>
                                <span class="inline-flex h-10 items-center gap-2 rounded-md border border-blue-300 bg-white px-5 text-sm font-bold text-blue-800 shadow-sm hover:bg-blue-50">
                                    <UploadIcon size={18} />
                                    Browse Files
                                </span>
                                <p class="text-xs font-medium text-gray-500 hidden md:block">JPEG, PNG, WebP supported</p>
                            </button>
                        {/if}
                    </div>
                </section>

                <div class="min-h-0 [&>div]:h-full">
                    <BatchQueue {jobId} {jobDone} {labels} {completedCount} {batchProgress} {files} {selectedFileIndex} onSelectFile={selectFile} onExportCsv={exportCsv} />
                </div>
            </div>
        </div>
    {/if}

    {#if reviewActive && showReviewQueue}
        <!-- Batch queue - shown only for multi-label review -->
        <div class="mt-3 shrink-0">
            <BatchQueue {jobId} {jobDone} {labels} {completedCount} {batchProgress} {files} {selectedFileIndex} onSelectFile={selectFile} onExportCsv={exportCsv} />
        </div>
    {/if}
</main>

<DragAndDrop {globalDragActive} />
