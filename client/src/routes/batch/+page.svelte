<script lang="ts">
    import { browser } from '$app/environment'
    import type {
        BatchLabelItem,
        BatchJobStatus,
        OverallStatus,
    } from '$shared/index'
    import { Button } from '$lib/components/ui/button'
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from '$lib/components/ui/card'
    import { Badge } from '$lib/components/ui/badge'
    import { Progress } from '$lib/components/ui/progress'
    import { Tooltip } from '$lib/components/ui/tooltip'
    import { Alert, AlertDescription } from '$lib/components/ui/alert'
    import { Separator } from '$lib/components/ui/separator'

    // ── Baseline form state ────────────────────────────────────────────────────
    let brandName = $state('')
    let productName = $state('')
    let beverageType = $state<'beer' | 'wine' | 'distilled_spirits' | ''>('')
    let classType = $state('')
    let alcoholContent = $state('')
    let netContents = $state('')
    let producerName = $state('')
    let producerAddress = $state('')
    let countryOfOrigin = $state('')
    let appellation = $state('')
    let vintageYear = $state('')

    // ── Upload state ───────────────────────────────────────────────────────────
    let files = $state<File[]>([])
    let globalDragActive = $state(false)
    let fileInputEl: HTMLInputElement | undefined = $state()

    // ── Job state ──────────────────────────────────────────────────────────────
    let submitting = $state(false)
    let submitError: string | null = $state(null)
    let jobId: string | null = $state(null)
    let labels = $state<BatchLabelItem[]>([])
    let jobDone = $state(false)
    let es: EventSource | null = null

    // ── Derived ────────────────────────────────────────────────────────────────
    let baselineComplete = $derived(
        brandName.trim() !== '' &&
            beverageType !== '' &&
            classType.trim() !== '' &&
            alcoholContent.trim() !== '' &&
            netContents.trim() !== '' &&
            producerName.trim() !== '' &&
            producerAddress.trim() !== ''
    )
    let canSubmit = $derived(
        baselineComplete && files.length > 0 && !submitting && jobId === null
    )
    let completedCount = $derived(
        labels.filter((l) => l.status === 'complete' || l.status === 'failed')
            .length
    )
    let progress = $derived(
        labels.length > 0 ? (completedCount / labels.length) * 100 : 0
    )

    // ── File handlers ──────────────────────────────────────────────────────────
    const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

    function applyFiles(incoming: FileList | File[]) {
        const valid = Array.from(incoming).filter((f) =>
            ACCEPTED.includes(f.type)
        )
        if (valid.length === 0) {
            submitError = 'Only JPEG, PNG, and WebP images are accepted'
            return
        }
        files = valid
        submitError = null
        if (fileInputEl) fileInputEl.value = ''
    }

    function onFileInputChange(e: Event) {
        const fl = (e.currentTarget as HTMLInputElement).files
        if (fl && fl.length > 0) applyFiles(fl)
    }

    function onDropZoneKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' || e.key === ' ') fileInputEl?.click()
    }

    // ── Global window drag-drop (entire window is a drop zone) ───────────────────
    $effect(() => {
        let counter = 0
        function onDragEnter(e: DragEvent) {
            if (e.dataTransfer?.types.includes('Files')) {
                counter++
                globalDragActive = true
            }
        }
        function onDragLeave() {
            counter--
            if (counter <= 0) {
                counter = 0
                globalDragActive = false
            }
        }
        function onDragOver(e: DragEvent) {
            if (e.dataTransfer?.types.includes('Files')) e.preventDefault()
        }
        function onDrop(e: DragEvent) {
            e.preventDefault()
            counter = 0
            globalDragActive = false
            if (e.dataTransfer?.files) applyFiles(e.dataTransfer.files)
        }
        window.addEventListener('dragenter', onDragEnter)
        window.addEventListener('dragleave', onDragLeave)
        window.addEventListener('dragover', onDragOver)
        window.addEventListener('drop', onDrop)
        return () => {
            window.removeEventListener('dragenter', onDragEnter)
            window.removeEventListener('dragleave', onDragLeave)
            window.removeEventListener('dragover', onDragOver)
            window.removeEventListener('drop', onDrop)
        }
    })

    function removeFile(i: number) {
        files = files.filter((_, idx) => idx !== i)
    }

    // ── Smart paste from clipboard ────────────────────────────────────────────────
    async function smartPaste() {
        let text: string
        try {
            text = await navigator.clipboard.readText()
        } catch {
            submitError = 'Clipboard access denied — check browser permissions'
            return
        }

        const alcMatch = text.match(/\b(\d+\.?\d*)\s*%\s*(alc|abv|vol)[./\s]*(vol)?/i)
        if (alcMatch && !alcoholContent) alcoholContent = alcMatch[0].trim()

        const netMatch = text.match(/\b(\d+\.?\d*)\s*(mL|L\b|oz\.?|fl\.?\s*oz\.?)/i)
        if (netMatch && !netContents) netContents = netMatch[0].trim()

        const yearMatch = text.match(/\b(19|20)\d{2}\b/)
        if (yearMatch && !vintageYear) vintageYear = yearMatch[0]

        if (!alcMatch && !netMatch && !yearMatch && !brandName) {
            brandName = text.trim().split('\n')[0].slice(0, 100)
        }
    }

    // ── Submit ─────────────────────────────────────────────────────────────────
    async function handleSubmit() {
        if (!canSubmit) return
        submitting = true
        submitError = null

        const application: Record<string, string> = {
            brandName: brandName.trim(),
            classType: classType.trim(),
            beverageType,
            alcoholContent: alcoholContent.trim(),
            netContents: netContents.trim(),
            producerName: producerName.trim(),
            producerAddress: producerAddress.trim(),
        }
        if (productName.trim()) application.productName = productName.trim()
        if (countryOfOrigin.trim())
            application.countryOfOrigin = countryOfOrigin.trim()
        if (appellation.trim()) application.appellation = appellation.trim()
        if (vintageYear.trim()) application.vintageYear = vintageYear.trim()

        const fd = new FormData()
        files.forEach((f) => fd.append('images', f))
        fd.append('application', JSON.stringify(application))

        try {
            const res = await fetch('/api/batch/upload', {
                method: 'POST',
                body: fd,
            })
            const data = await res.json()
            if (!res.ok) {
                submitError = data.error ?? 'Upload failed'
                submitting = false
                return
            }

            const jid: string = data.jobId
            jobId = jid
            labels = files.map((f, i) => ({
                labelId: `${jid}-${i}`,
                filename: f.name,
                status: 'pending' as BatchJobStatus,
            }))
            openEventSource(jid)
        } catch {
            submitError = 'Network error — please try again'
            submitting = false
        }
    }

    // ── SSE ────────────────────────────────────────────────────────────────────
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
                submitError =
                    'Connection lost — job may still be running. Refresh to check status.'
                submitting = false
                es = null
            }
        })
    }

    $effect(() => () => {
        es?.close()
    })

    // ── CSV export ─────────────────────────────────────────────────────────────
    function exportCsv() {
        const fieldNames = Array.from(
            new Set(
                labels.flatMap(
                    (l) => l.result?.fields.map((f) => f.fieldName) ?? []
                )
            )
        )
        const header = ['filename', 'overallStatus', ...fieldNames]
        const rows = labels.map((l) => {
            const row = [l.filename, l.result?.overallStatus ?? l.status]
            for (const fn of fieldNames) {
                const field = l.result?.fields.find((f) => f.fieldName === fn)
                row.push(field ? field.status : '')
            }
            return row
        })
        const csv =
            '﻿' +
            [header, ...rows]
                .map((row) =>
                    row
                        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
                        .join(',')
                )
                .join('\n')
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
        const a = document.createElement('a')
        a.href = url
        a.download = `batch-${jobId ?? 'results'}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    // ── Reset ──────────────────────────────────────────────────────────────────
    function resetForm() {
        es?.close()
        es = null
        files = []
        submitError = null
        jobId = null
        labels = []
        jobDone = false
        submitting = false
        // Baseline stays populated — agents run multiple batches with same COLA spec
    }

    // ── Helpers ────────────────────────────────────────────────────────────────
    const BADGE_VARIANT: Record<
        BatchJobStatus,
        'not_found' | 'warning' | 'pass' | 'fail'
    > = {
        pending: 'not_found',
        processing: 'warning',
        complete: 'pass',
        failed: 'fail',
    }
    const STATUS_LABEL: Record<BatchJobStatus, string> = {
        pending: 'Pending',
        processing: 'Processing',
        complete: 'Complete',
        failed: 'Failed',
    }
    const OVERALL_LABEL: Record<OverallStatus, string> = {
        pass: 'Pass',
        warning: 'Warning',
        fail: 'Fail',
    }

    const INPUT_BASE =
        'w-full rounded-md border border-gray-300 px-3 h-11 text-base text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500'
</script>

<main class="mx-auto max-w-[2200px] px-6 py-6">
    <nav class="mb-6 flex items-center justify-between border-b pb-4">
        <div class="flex gap-4">
            <a href="/" class="text-gray-600 hover:text-blue-600">Single Label</a>
            <a href="/batch" class="font-medium text-blue-600">Batch Upload</a>
        </div>
        <Tooltip text="Paste baseline data from clipboard">
            <Button type="button" variant="outline" size="sm" onclick={smartPaste}>
                Paste from Clipboard
            </Button>
        </Tooltip>
    </nav>

    <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold">TTB Label Verification</h1>
        {#if jobDone}
            <Tooltip text="Clear results and start a new batch">
                <Button variant="outline" size="sm" onclick={resetForm}>New Batch</Button>
            </Tooltip>
        {/if}
    </div>

    <div class="grid grid-cols-[2fr_3fr] gap-6 items-start">

        <!-- ── LEFT: Sticky images panel ───────────────────────────────────────────── -->
        <div class="sticky top-6">
            <Card>
                <CardHeader>
                    <div class="flex items-center justify-between">
                        <CardTitle>Label Images</CardTitle>
                        {#if files.length > 0}
                            <p class="text-xs text-gray-400">
                                {files.length} file{files.length !== 1 ? 's' : ''}
                            </p>
                        {/if}
                    </div>
                </CardHeader>
                <CardContent>
                    <div class="mb-3 rounded bg-blue-50 px-3 py-2 text-center text-xs text-blue-700 border border-blue-100">
                        Tip: You can drag and drop multiple files anywhere on this page to add them
                    </div>
                    <input
                        bind:this={fileInputEl}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        class="sr-only"
                        aria-label="Upload label images"
                        onchange={onFileInputChange}
                        disabled={!!jobId}
                    />

                    {#if files.length > 0}
                        <div class="flex flex-col gap-3">
                            <div class="max-h-[calc(100vh-16rem)] overflow-y-auto space-y-1 rounded-md border border-gray-100 p-2">
                                {#each files as file, i}
                                    <div class="flex items-center justify-between rounded px-2 py-1.5 hover:bg-gray-50">
                                        <span class="truncate text-sm text-gray-700" title={file.name}>{file.name}</span>
                                        {#if !jobId}
                                            <button
                                                type="button"
                                                onclick={() => removeFile(i)}
                                                class="ml-1 shrink-0 text-gray-300 hover:text-red-400"
                                                aria-label="Remove {file.name}"
                                            >
                                                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                                            </button>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                            {#if !jobId}
                                <button
                                    type="button"
                                    class="text-sm text-blue-600 hover:underline text-center"
                                    onclick={() => fileInputEl?.click()}
                                >Replace files</button>
                            {/if}
                        </div>
                    {:else}
                        <!-- svelte-ignore a11y_interactive_supports_focus -->
                        <div
                            role="button"
                            tabindex="0"
                            aria-label="Click or drag to upload label images"
                            class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center transition-colors hover:border-gray-400 hover:bg-gray-50"
                            onclick={() => fileInputEl?.click()}
                            onkeydown={onDropZoneKeydown}
                        >
                            <svg class="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            <p class="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                            <p class="text-xs text-gray-400">JPEG, PNG, WebP · max 10 MB each</p>
                        </div>
                    {/if}
                </CardContent>
            </Card>
        </div>

        <!-- ── RIGHT: Form + Results ──────────────────────────────────────────────── -->
        <div class="space-y-4">
            <Card>
                <CardHeader><CardTitle>Application Baseline (COLA Spec)</CardTitle></CardHeader>
                <CardContent class="space-y-4">
                    <p class="text-xs text-gray-600">
                        <span class="text-red-500">*</span> Required · Applied to every image in the batch
                    </p>

                    <div class="space-y-3">
                        <!-- Brand Name -->
                        <div>
                            <label for="b-brandName" class="mb-1 block text-sm font-medium text-gray-700">Brand Name *</label>
                            <input id="b-brandName" type="text" bind:value={brandName} disabled={!!jobId} class={INPUT_BASE} />
                        </div>

                        <!-- Beverage Type + Class/Type -->
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label for="b-beverageType" class="mb-1 block text-sm font-medium text-gray-700">Beverage Type *</label>
                                <select id="b-beverageType" bind:value={beverageType} disabled={!!jobId} class={INPUT_BASE}>
                                    <option value="">Select type</option>
                                    <option value="beer">Beer</option>
                                    <option value="wine">Wine</option>
                                    <option value="distilled_spirits">Distilled Spirits</option>
                                </select>
                            </div>
                            <div>
                                <label for="b-classType" class="mb-1 block text-sm font-medium text-gray-700">Class/Type *</label>
                                <input id="b-classType" type="text" placeholder="e.g. Bourbon Whiskey" bind:value={classType} disabled={!!jobId} class={INPUT_BASE} />
                            </div>
                        </div>

                        <!-- Alcohol Content + Net Contents -->
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label for="b-alcoholContent" class="mb-1 block text-sm font-medium text-gray-700">Alcohol Content *</label>
                                <input id="b-alcoholContent" type="text" placeholder="e.g. 12.5% ALC/VOL" bind:value={alcoholContent} disabled={!!jobId} class={INPUT_BASE} />
                            </div>
                            <div>
                                <label for="b-netContents" class="mb-1 block text-sm font-medium text-gray-700">Net Contents *</label>
                                <input id="b-netContents" type="text" placeholder="e.g. 750 mL" bind:value={netContents} disabled={!!jobId} class={INPUT_BASE} />
                            </div>
                        </div>

                        <!-- Producer Name -->
                        <div>
                            <label for="b-producerName" class="mb-1 block text-sm font-medium text-gray-700">Producer Name *</label>
                            <input id="b-producerName" type="text" bind:value={producerName} disabled={!!jobId} class={INPUT_BASE} />
                        </div>

                        <!-- Producer Address -->
                        <div>
                            <label for="b-producerAddress" class="mb-1 block text-sm font-medium text-gray-700">Producer Address *</label>
                            <input id="b-producerAddress" type="text" bind:value={producerAddress} disabled={!!jobId} class={INPUT_BASE} />
                        </div>
                    </div>

                    {#if !jobId}
                        <div class="pt-2">
                            <Button onclick={handleSubmit} disabled={!canSubmit || submitting} class="w-full">
                                {#if submitting}
                                    <svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                    </svg>
                                    Uploading…
                                {:else}
                                    Start Batch Verification ({files.length} labels)
                                {/if}
                            </Button>
                        </div>
                    {/if}
                </CardContent>
            </Card>

            <!-- Error -->
            {#if submitError}
                <Alert variant="destructive">
                    <AlertDescription>{submitError}</AlertDescription>
                </Alert>
            {/if}

            <!-- Live queue -->
            {#if jobId}
                <Card>
                    <CardHeader>
                        <div class="flex items-center justify-between">
                            <CardTitle>{jobDone ? 'Batch Results' : 'Processing Queue'}</CardTitle>
                            <div class="flex items-center gap-3">
                                <span class="text-sm text-gray-500">{completedCount} / {labels.length}</span>
                                {#if jobDone}
                                    <Tooltip text="Download results as a spreadsheet">
                                        <Button variant="outline" size="sm" onclick={exportCsv}>Export CSV</Button>
                                    </Tooltip>
                                {/if}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent class="space-y-4">
                        <Progress value={progress} />

                        <div class="max-h-[600px] overflow-y-auto space-y-1" role="list">
                            {#each labels as label}
                                <div class="rounded-md border border-gray-100 p-3" role="listitem">
                                    <div class="flex items-center justify-between gap-2">
                                        <span class="truncate text-sm font-medium text-gray-700" title={label.filename}>
                                            {label.filename}
                                        </span>
                                        <div class="flex shrink-0 items-center gap-2">
                                            {#if label.status === 'complete' && label.result}
                                                <Badge variant={label.result.overallStatus}>
                                                    {OVERALL_LABEL[label.result.overallStatus]}
                                                </Badge>
                                            {/if}
                                            <Badge variant={BADGE_VARIANT[label.status]} class={label.status === 'processing' ? 'animate-pulse' : ''}>
                                                {STATUS_LABEL[label.status]}
                                            </Badge>
                                        </div>
                                    </div>
                                    {#if label.status === 'failed' && label.error}
                                        <p class="mt-2 text-xs text-red-500">{label.error}</p>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </CardContent>
                </Card>
            {/if}
        </div>
    </div>
</main>

{#if globalDragActive}
    <div class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-blue-500/10 backdrop-blur-[2px]">
        <div class="rounded-2xl border-4 border-dashed border-blue-400 bg-white/95 px-16 py-12 text-center shadow-2xl">
            <svg class="mx-auto mb-4 h-14 w-14 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p class="text-2xl font-semibold text-blue-700">Drop anywhere to add label images</p>
            <p class="mt-2 text-sm text-blue-500">JPEG, PNG, or WebP · multiple files accepted</p>
        </div>
    </div>
{/if}
