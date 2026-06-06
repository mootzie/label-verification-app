<script lang="ts">
    import { browser } from '$app/environment'
    import { fly } from 'svelte/transition'
    import type {
        VerificationResult,
        BatchLabelItem,
        BatchJobStatus,
        FieldResult,
    } from '$shared/index'
    import { Button } from '$lib/components/ui/button'
    import { Tooltip } from '$lib/components/ui/tooltip'
    import { Alert, AlertDescription } from '$lib/components/ui/alert'

    // Components
    import MediaPanel from '$lib/components/workspace/MediaPanel.svelte'
    import ComplianceForm from '$lib/components/workspace/ComplianceForm.svelte'
    import BatchQueue from '$lib/components/workspace/BatchQueue.svelte'

    // Utils
    import { loadHist, saveHist } from '$lib/utils/history'
    import {
        parseSmartPaste,
        buildApplicationData,
    } from '$lib/utils/application-builder'
    import { OVERALL_LABEL } from '$lib/utils/compliance-logic'
    import { resizeForUpload } from '$lib/utils/image-resize'

    // ── Primary State ────────────────────────────────────────────────────────────
    let files = $state<File[]>([])
    let selectedFileIndex = $state<number | null>(null)
    let imagePreviewUrl = $state<string | null>(null)
    let globalDragActive = $state(false)

    let brandName = $state('')
    let beverageType = $state<'beer' | 'wine' | 'distilled_spirits' | ''>('')
    let classType = $state('')
    let alcoholContent = $state('')
    let netContents = $state('')
    let producerName = $state('')
    let producerAddress = $state('')
    let countryOfOrigin = $state('')

    const LOCK_KEY = 'ttb_locked_fields'
    const DEFAULT_LOCKED = ['producerName', 'producerAddress']

    function loadLocked(): Set<string> {
        if (!browser) return new Set(DEFAULT_LOCKED)
        try {
            const raw = localStorage.getItem(LOCK_KEY)
            return raw ? new Set(JSON.parse(raw)) : new Set(DEFAULT_LOCKED)
        } catch {
            return new Set(DEFAULT_LOCKED)
        }
    }

    function saveLocked(s: Set<string>) {
        if (!browser) return
        localStorage.setItem(LOCK_KEY, JSON.stringify([...s]))
    }

    let locked = $state(loadLocked())

    let brandHistory = $state<string[]>([])
    let producerHistory = $state<string[]>([])
    let addressHistory = $state<string[]>([])

    let loading = $state(false)
    let submitting = $state(false)
    let error = $state<string | null>(null)
    let result = $state<VerificationResult | null>(null)
    let jobId = $state<string | null>(null)
    let labels = $state<BatchLabelItem[]>([])
    let jobDone = $state(false)
    let es: EventSource | null = null

    // #region Initialization
    $effect(() => {
        brandHistory = loadHist('ttb_brands')
        producerHistory = loadHist('ttb_producers')
        addressHistory = loadHist('ttb_addresses')
    })

    // #region Derived
    let completedCount = $derived(
        labels.filter((l) => l.status === 'complete' || l.status === 'failed')
            .length
    )
    let batchProgress = $derived(
        labels.length > 0 ? (completedCount / labels.length) * 100 : 0
    )
    let fieldResultMap = $derived(
        new Map<string, FieldResult>(
            (result !== null ? result.fields : []).map(
                (f) => [f.fieldName, f] as [string, FieldResult]
            )
        )
    )

    // #region Handlers
    function toggleLock(field: string) {
        const s = new Set(locked)
        if (s.has(field)) s.delete(field)
        else s.add(field)
        locked = s
        saveLocked(s)
    }

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
        if (files.length > 0) {
            selectedFileIndex = 0
            imagePreviewUrl = URL.createObjectURL(files[0])
        } else {
            selectedFileIndex = null
            imagePreviewUrl = null
        }
        error = null
        result = null
        jobId = null
        labels = []
        jobDone = false
    }

    function selectFile(index: number) {
        if (selectedFileIndex === index) return
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
        selectedFileIndex = index
        imagePreviewUrl = URL.createObjectURL(files[index])
    }

    function useSingleFile() {
        const first = files[0]
        if (!first) return
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
        files = [first]
        selectedFileIndex = 0
        imagePreviewUrl = URL.createObjectURL(first)
        result = null
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
        if (!locked.has('producerName')) producerName = ''
        if (!locked.has('producerAddress')) producerAddress = ''
        result = null
        jobId = null
        labels = []
        jobDone = false
        error = null
        es?.close()
        es = null
    }

    // #region Submission
    async function handleSubmit(e?: Event) {
        e?.preventDefault()
        if (files.length === 1) await handleSingleSubmit()
        else await handleBatchSubmit()
    }

    async function handleSingleSubmit() {
        loading = true
        result = null
        error = null
        const formData = new FormData()
        formData.append('image', await resizeForUpload(files[0]))
        formData.append(
            'application',
            JSON.stringify(
                buildApplicationData({
                    brandName,
                    classType,
                    beverageType,
                    alcoholContent,
                    netContents,
                    producerName,
                    producerAddress,
                    countryOfOrigin,
                })
            )
        )
        try {
            const res = await fetch('/api/verify', {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            if (!res.ok) error = data.error ?? 'Verification failed'
            else {
                result = data as VerificationResult
                saveHistories()
            }
            console.log('Verification result:', data)
        } catch {
            error = 'Network error'
        } finally {
            loading = false
        }
    }

    async function handleBatchSubmit() {
        submitting = true
        error = null
        const fd = new FormData()
        const resized = await Promise.all(files.map(resizeForUpload))
        resized.forEach((f) => fd.append('images', f))
        fd.append(
            'application',
            JSON.stringify(
                buildApplicationData({
                    brandName,
                    classType,
                    beverageType,
                    alcoholContent,
                    netContents,
                    producerName,
                    producerAddress,
                    countryOfOrigin,
                })
            )
        )
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
            labels = files.map((f, i) => ({
                labelId: `${jobId}-${i}`,
                filename: f.name,
                status: 'pending' as BatchJobStatus,
            }))
            openEventSource(jobId!)
            saveHistories()
        } catch {
            error = 'Network error'
            submitting = false
        }
    }

    function saveHistories() {
        saveHist('ttb_brands', brandName)
        saveHist('ttb_producers', producerName)
        saveHist('ttb_addresses', producerAddress)
        brandHistory = loadHist('ttb_brands')
        producerHistory = loadHist('ttb_producers')
        addressHistory = loadHist('ttb_addresses')
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
        const fieldNames = Array.from(
            new Set(
                labels.flatMap(
                    (l) => l.result?.fields.map((f) => f.fieldName) ?? []
                )
            )
        )
        const header = [
            'filename',
            'overallStatus',
            'processingTimeMs',
            ...fieldNames.flatMap((fn) => [
                `${fn}_status`,
                `${fn}_expected`,
                `${fn}_found`,
                `${fn}_notes`,
            ]),
        ]
        const rows = labels.map((l) => {
            const row = [
                l.filename,
                l.result?.overallStatus ?? l.status,
                String(l.result?.processingTimeMs ?? ''),
            ]
            for (const fn of fieldNames) {
                const f = l.result?.fields.find((f) => f.fieldName === fn)
                row.push(
                    f?.status ?? '',
                    f?.expectedValue ?? '',
                    f?.foundValue ?? '',
                    f?.notes ?? ''
                )
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

    function onDropZoneKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' || e.key === ' ') {
            if (browser) document.getElementById('file-input-el')?.click()
        }
    }

    // #region Debug
    function mockVerification() {
        // Pre-fill form so submit is not required
        brandName = 'Old Tom Distillery'
        producerName = 'Old Tom Distillery LLC'
        beverageType = 'distilled_spirits'
        classType = 'Bourbon Whiskey'
        producerAddress = 'Louisville, KY 40201'
        alcoholContent = '45% Alc./Vol.'
        netContents = '750 mL'
        countryOfOrigin = ''
        imagePreviewUrl =
            'https://placehold.co/600x800/f3f4f6/1d4ed8?text=Mock+Label'
        result = {
            overallStatus: 'warning',
            fields: [
                {
                    fieldName: 'brandName',
                    expectedValue: 'Old Tom Distillery',
                    foundValue: 'Old Tom Distillery',
                    status: 'pass',
                },
                {
                    fieldName: 'producerName',
                    expectedValue: 'Old Tom Distillery LLC',
                    foundValue: 'Old Tom Distillery',
                    status: 'warning',
                    notes: 'Label omits "LLC" — minor variation, flag for review.',
                },
                {
                    fieldName: 'beverageType',
                    expectedValue: 'distilled_spirits',
                    foundValue: 'Distilled Spirits',
                    status: 'pass',
                },
                {
                    fieldName: 'classType',
                    expectedValue: 'Bourbon Whiskey',
                    foundValue: 'Kentucky Straight Bourbon Whiskey',
                    status: 'warning',
                    notes: 'More specific designation than application data — review for consistency.',
                },
                {
                    fieldName: 'producerAddress',
                    expectedValue: 'Louisville, KY 40201',
                    foundValue: 'Louisville, KY 40201',
                    status: 'pass',
                },
                {
                    fieldName: 'alcoholContent',
                    expectedValue: '45% Alc./Vol.',
                    foundValue: '45% Alc./Vol. (90 Proof)',
                    status: 'pass',
                },
                {
                    fieldName: 'netContents',
                    expectedValue: '750 mL',
                    foundValue: '750 mL',
                    status: 'pass',
                },
                {
                    fieldName: 'governmentWarning',
                    expectedValue: 'GOVERNMENT WARNING: ...',
                    foundValue:
                        'GOVERNMENT WARNING: (1) According to the Surgeon General...',
                    status: 'pass',
                },
                {
                    fieldName: 'stateOfDistillation',
                    expectedValue: null,
                    foundValue: 'Kentucky',
                    status: 'warning',
                    notes: 'Label implies Kentucky distillation — verify address matches 27 CFR 5.212.',
                },
            ],
            processingTimeMs: 2340,
        }
    }

    function mockBatch() {
        jobId = 'debug-' + Math.random().toString(36).slice(2, 7)
        labels = [
            {
                labelId: '1',
                filename: 'l1.png',
                status: 'complete',
                result: { overallStatus: 'pass', fields: [] },
            },
            { labelId: '2', filename: 'l2.png', status: 'processing' },
        ]
        setTimeout(() => {
            labels = labels.map((l) => ({
                ...l,
                status: 'complete',
                result: { overallStatus: 'pass', fields: [] },
            }))
            jobDone = true
        }, 2000)
    }

    // #region Global Ctrl+V / Cmd+V paste shortcut
    $effect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (!(e.key === 'v' && (e.ctrlKey || e.metaKey))) return
            const tag = (document.activeElement?.tagName ?? '').toLowerCase()
            if (['input', 'textarea', 'select'].includes(tag)) return
            e.preventDefault()
            smartPaste()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    })

    // #region Global Drag & Drop
    $effect(() => {
        let counter = 0
        const enter = (e: DragEvent) => {
            if (e.dataTransfer?.types.includes('Files')) {
                counter++
                globalDragActive = true
            }
        }
        const leave = () => {
            counter--
            if (counter <= 0) {
                counter = 0
                globalDragActive = false
            }
        }
        const over = (e: DragEvent) => {
            if (e.dataTransfer?.types.includes('Files')) e.preventDefault()
        }
        const drop = (e: DragEvent) => {
            e.preventDefault()
            counter = 0
            globalDragActive = false
            if (e.dataTransfer?.files) applyFiles(e.dataTransfer.files)
        }
        window.addEventListener('dragenter', enter)
        window.addEventListener('dragleave', leave)
        window.addEventListener('dragover', over)
        window.addEventListener('drop', drop)
        return () => {
            window.removeEventListener('dragenter', enter)
            window.removeEventListener('dragleave', leave)
            window.removeEventListener('dragover', over)
            window.removeEventListener('drop', drop)
        }
    })
</script>

{#snippet statusIcon(name: string)}
    {#if result}
        {@const fr = fieldResultMap.get(name)}
        {#if fr}
            <span
                class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
            >
                {#if fr.status === 'pass'}
                    <svg
                        class="h-4 w-4 text-green-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        ><path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                            clip-rule="evenodd"
                        /></svg
                    >
                {:else if fr.status === 'warning'}
                    <svg
                        class="h-4 w-4 text-yellow-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        ><path
                            fill-rule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                            clip-rule="evenodd"
                        /></svg
                    >
                {:else}
                    <svg
                        class="h-4 w-4 text-red-500"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        ><path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                            clip-rule="evenodd"
                        /></svg
                    >
                {/if}
            </span>
        {/if}
    {/if}
{/snippet}
<!-- 
<datalist id="brands-list">{#each brandHistory as h}<option value={h}></option>{/each}</datalist>
<datalist id="producers-list">{#each producerHistory as h}<option value={h}></option>{/each}</datalist>
<datalist id="addresses-list">{#each addressHistory as h}<option value={h}></option>{/each}</datalist> -->

<main
    class="mx-auto h-full max-w-[2200px] px-6 py-6 overflow-hidden flex flex-col"
>
    <nav class="mb-6 flex items-center justify-between border-b pb-4">
        <h1 class="text-xl font-semibold">TTB Label Verification</h1>
        <div class="flex items-center gap-3">
            {#if import.meta.env.DEV}
                <Button
                    variant="outline"
                    size="sm"
                    class="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                    onclick={mockVerification}>Debug: Mock Single</Button
                >
                <Button
                    variant="outline"
                    size="sm"
                    class="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                    onclick={mockBatch}>Debug: Mock Batch</Button
                >
            {/if}
            {#if jobDone || result}
                <Tooltip text="Clear everything and start fresh"
                    ><Button variant="ghost" size="sm" onclick={clearAll}
                        >New Task</Button
                    ></Tooltip
                >
            {/if}
        </div>
    </nav>

    <div
        class="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 items-stretch flex-1 min-h-0"
    >
        <MediaPanel
            {files}
            {imagePreviewUrl}
            {selectedFileIndex}
            {jobId}
            onFileInput={(e) => {
                const fl = (e.currentTarget as HTMLInputElement).files
                if (fl) applyFiles(fl)
            }}
            onSelectFile={selectFile}
            onRemoveFile={removeFile}
            {onDropZoneKeydown}
            onUseSingleFile={useSingleFile}
        />

        <div class="space-y-6 min-w-0 h-full overflow-y-auto">
            <ComplianceForm
                bind:brandName
                bind:producerName
                bind:beverageType
                bind:classType
                bind:producerAddress
                bind:countryOfOrigin
                bind:alcoholContent
                bind:netContents
                {locked}
                {result}
                {jobId}
                {loading}
                {submitting}
                {files}
                {brandHistory}
                {producerHistory}
                {addressHistory}
                {fieldResultMap}
                onToggleLock={toggleLock}
                onSubmit={handleSubmit}
                {statusIcon}
            />

            {#if error}<Alert variant="destructive"
                    ><AlertDescription
                        class="font-medium text-xs tracking-tight"
                        >{error}</AlertDescription
                    ></Alert
                >{/if}

            <BatchQueue
                {jobId}
                {jobDone}
                {labels}
                {completedCount}
                {batchProgress}
                onExportCsv={exportCsv}
            />
        </div>
    </div>
</main>

{#if globalDragActive}
    <div
        class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-blue-500/10 backdrop-blur-[2px]"
    >
        <div
            class="rounded-2xl border-2 border-dashed border-blue-400 bg-white/95 px-16 py-12 text-center shadow-2xl"
        >
            <svg
                class="mx-auto mb-4 h-14 w-14 text-blue-400"
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
            <p class="text-2xl font-semibold text-blue-700">
                Drop anywhere to add labels
            </p>
            <p class="mt-2 text-sm text-blue-500 font-medium">
                Multiple files supported
            </p>
        </div>
    </div>
{/if}
