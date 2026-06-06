<script lang="ts">
    import { browser } from '$app/environment'
    import { fly } from 'svelte/transition'
    import { Tooltip } from '$lib/components/ui/tooltip'
    import type { VerificationResult, FieldResult, FieldStatus } from '$shared/index'
    import { Button } from '$lib/components/ui/button'
    import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
    import { Badge } from '$lib/components/ui/badge'
    import { Separator } from '$lib/components/ui/separator'
    import { Alert, AlertDescription } from '$lib/components/ui/alert'

    // ── Image state ──────────────────────────────────────────────────────────────
    let imageFile: File | null = $state(null)
    let imagePreviewUrl: string | null = $state(null)
    let globalDragActive = $state(false)
    let fileInputEl: HTMLInputElement | undefined = $state()

    // ── Form state ───────────────────────────────────────────────────────────────
    let brandName = $state('')
    let productName = $state('')
    let beverageType = $state<'beer' | 'wine' | 'distilled_spirits' | ''>('')
    let alcoholContent = $state('')
    let netContents = $state('')
    let producerName = $state('')
    let producerAddress = $state('')
    let countryOfOrigin = $state('')
    let appellation = $state('')
    let vintageYear = $state('')

    // ── Lock state (fields preserved on clear) ───────────────────────────────────
    let locked = $state(new Set<string>())
    function toggleLock(field: string) {
        const s = new Set(locked)
        if (s.has(field)) s.delete(field)
        else s.add(field)
        locked = s
    }

    // ── localStorage autocomplete history ────────────────────────────────────────
    let brandHistory = $state<string[]>([])
    let producerHistory = $state<string[]>([])
    let addressHistory = $state<string[]>([])

    function loadHist(key: string): string[] {
        if (!browser) return []
        try {
            return JSON.parse(localStorage.getItem(key) ?? '[]')
        } catch {
            return []
        }
    }

    function saveHist(key: string, value: string) {
        if (!browser || !value.trim()) return
        const h = loadHist(key)
        localStorage.setItem(
            key,
            JSON.stringify([value.trim(), ...h.filter((x) => x !== value.trim())].slice(0, 20))
        )
    }

    $effect(() => {
        brandHistory = loadHist('ttb_brands')
        producerHistory = loadHist('ttb_producers')
        addressHistory = loadHist('ttb_addresses')
    })

    // ── UI state ─────────────────────────────────────────────────────────────────
    let loading = $state(false)
    let result = $state<VerificationResult | null>(null)
    let error: string | null = $state(null)

    let canSubmit = $derived(
        imageFile !== null &&
            brandName.trim() !== '' &&
            beverageType !== '' &&
            alcoholContent.trim() !== '' &&
            netContents.trim() !== '' &&
            producerName.trim() !== '' &&
            producerAddress.trim() !== ''
    )

    // ── HUD: fieldName → result mapping ──────────────────────────────────────────
    let fieldResultMap = $derived(
        new Map<string, FieldResult>(
            (result !== null ? result.fields : []).map((f) => [f.fieldName, f] as [string, FieldResult])
        )
    )

    const STATUS_BORDER: Record<string, string> = {
        pass: 'border-green-400 focus:border-green-500 focus:ring-green-500',
        warning: 'border-yellow-400 focus:border-yellow-500 focus:ring-yellow-500',
        fail: 'border-red-400 focus:border-red-500 focus:ring-red-500',
        not_found: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    }

    function borderCls(fieldName: string): string {
        const f = fieldResultMap.get(fieldName)
        if (!f) return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        return STATUS_BORDER[f.status] ?? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }

    function fieldHint(name: string): { text: string; cls: string } | null {
        const f = fieldResultMap.get(name)
        if (!f || f.status === 'pass') return null
        const text = `Expected: ${f.expectedValue ?? '—'}  ·  Found: ${f.foundValue ?? 'not found'}`
        const cls = f.status === 'fail' || f.status === 'not_found' ? 'text-red-600' : 'text-yellow-700'
        return { text, cls }
    }

    const INPUT_BASE =
        'w-full rounded-md border pl-3 pr-9 h-11 text-base text-gray-900 focus:outline-none focus:ring-1'

    // ── Image handlers ────────────────────────────────────────────────────────────
    const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

    // ── Zoom & Pan state (Hover Magnification) ───────────────────────────────────
    let hoverScale = $state(2.5)
    let isHovering = $state(false)
    let zoomOrigin = $state('50% 50%')

    function handleMouseMove(e: MouseEvent) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        zoomOrigin = `${x}% ${y}%`
    }

    $effect(() => () => {
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    })

    function applyFile(file: File) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            error = 'Only JPEG, PNG, and WebP images are accepted'
            return
        }
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
        imageFile = file
        imagePreviewUrl = URL.createObjectURL(file)
        resetZoom()
        if (fileInputEl) fileInputEl.value = ''
        error = null
    }

    function onFileInputChange(e: Event) {
        const f = (e.currentTarget as HTMLInputElement).files?.[0]
        if (f) applyFile(f)
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
            const f = e.dataTransfer?.files[0]
            if (f) applyFile(f)
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

    // ── Clear form (respects locked fields) ──────────────────────────────────────
    function clearForm() {
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
        imageFile = null
        imagePreviewUrl = null
        brandName = ''
        productName = ''
        beverageType = ''
        alcoholContent = ''
        netContents = ''
        if (!locked.has('producerName')) producerName = ''
        if (!locked.has('producerAddress')) producerAddress = ''
        if (!locked.has('countryOfOrigin')) countryOfOrigin = ''
        appellation = ''
        vintageYear = ''
        result = null
        error = null
    }

    // ── Smart paste from clipboard ────────────────────────────────────────────────
    async function smartPaste() {
        let text: string
        try {
            text = await navigator.clipboard.readText()
        } catch {
            error = 'Clipboard access denied — check browser permissions'
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

    // ── Submit ────────────────────────────────────────────────────────────────────
    async function handleSubmit(e?: Event) {
        e?.preventDefault()
        if (!imageFile || !canSubmit || loading) return

        loading = true
        result = null
        error = null

        const application: Record<string, string> = {
            brandName,
            beverageType,
            alcoholContent,
            netContents,
            producerName,
            producerAddress,
        }
        if (productName.trim()) application.productName = productName.trim()
        if (countryOfOrigin.trim()) application.countryOfOrigin = countryOfOrigin.trim()
        if (appellation.trim()) application.appellation = appellation.trim()
        if (vintageYear.trim()) application.vintageYear = vintageYear.trim()

        const formData = new FormData()
        formData.append('image', imageFile)
        formData.append('application', JSON.stringify(application))

        try {
            const res = await fetch('/api/verify', { method: 'POST', body: formData })
            const data = await res.json()
            if (!res.ok) {
                error = data.error ?? 'Verification failed'
            } else {
                result = data as VerificationResult
                saveHist('ttb_brands', brandName)
                saveHist('ttb_producers', producerName)
                saveHist('ttb_addresses', producerAddress)
                brandHistory = loadHist('ttb_brands')
                producerHistory = loadHist('ttb_producers')
                addressHistory = loadHist('ttb_addresses')
            }
        } catch {
            error = 'Network error — please try again'
        } finally {
            loading = false
        }
    }

    // ── Keyboard shortcuts ────────────────────────────────────────────────────────
    $effect(() => {
        function onKeydown(e: KeyboardEvent) {
            const mod = e.metaKey || e.ctrlKey
            if (mod && e.key === 'Enter') {
                e.preventDefault()
                handleSubmit()
            }
            if (mod && (e.key === 'u' || e.key === 'U')) {
                e.preventDefault()
                fileInputEl?.click()
            }
            if (e.key === 'Escape') {
                if (result || error) {
                    result = null
                    error = null
                } else clearForm()
            }
        }
        window.addEventListener('keydown', onKeydown)
        return () => window.removeEventListener('keydown', onKeydown)
    })

    // ── Display helpers ───────────────────────────────────────────────────────────
    function formatFieldName(name: string): string {
        return name.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())
    }

    const STATUS_LABEL: Record<FieldStatus, string> = {
        pass: 'Pass',
        warning: 'Warning',
        fail: 'Fail',
        not_found: 'Not Found',
    }

    const OVERALL_LABEL: Record<string, string> = {
        pass: 'Pass',
        warning: 'Warning',
        fail: 'Fail',
    }
</script>

<!-- ── HUD snippets ──────────────────────────────────────────────────────────── -->
{#snippet statusIcon(name: string)}
    {#if result}
        {@const fr = fieldResultMap.get(name)}
        {#if fr}
            <span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" aria-hidden="true">
                {#if fr.status === 'pass'}
                    <svg class="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                    </svg>
                {:else if fr.status === 'warning'}
                    <svg class="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                    </svg>
                {:else}
                    <svg class="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
                    </svg>
                {/if}
            </span>
        {/if}
    {/if}
{/snippet}

{#snippet hintText(name: string)}
    {#if result}
        {@const h = fieldHint(name)}
        {#if h}
            <p class="mt-1 text-xs {h.cls}" in:fly={{ y: -4, duration: 150 }}>{h.text}</p>
        {/if}
    {/if}
{/snippet}

<!-- Autocomplete datalists -->
<datalist id="brands-list">
    {#each brandHistory as h}<option value={h}></option>{/each}
</datalist>
<datalist id="producers-list">
    {#each producerHistory as h}<option value={h}></option>{/each}
</datalist>
<datalist id="addresses-list">
    {#each addressHistory as h}<option value={h}></option>{/each}
</datalist>

<main class="mx-auto max-w-[2200px] px-6 py-6">
    <nav class="mb-6 flex items-center justify-between border-b pb-4">
        <div class="flex gap-4">
            <a href="/" class="font-medium text-blue-600">Single Label</a>
            <a href="/batch" class="text-gray-600 hover:text-blue-600">Batch Upload</a>
        </div>
        <Tooltip text="Paste application data from clipboard">
            <Button type="button" variant="outline" size="sm" onclick={smartPaste}>
                Paste from Clipboard
            </Button>
        </Tooltip>
    </nav>

    <h1 class="mb-4 text-xl font-semibold">TTB Label Verification</h1>

    <div class="grid grid-cols-[2fr_3fr] gap-6 items-start">

        <!-- ── LEFT: Sticky image panel ───────────────────────────────────────────── -->
        <div class="sticky top-6">
            <Card>
                <CardHeader>
                    <div class="flex items-center justify-between">
                        <CardTitle>Label Image</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div class="mb-3 rounded bg-blue-50 px-3 py-2 text-center text-xs text-blue-700 border border-blue-100">
                        Tip: You can drag and drop a file anywhere on this page to add it
                    </div>
                    <input
                        bind:this={fileInputEl}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        class="sr-only"
                        aria-label="Upload label image"
                        onchange={onFileInputChange}
                    />

                    {#if imagePreviewUrl}
                        <div class="flex flex-col items-center gap-3">
                            <div 
                                class="relative h-[calc(100vh-20rem)] w-full overflow-hidden rounded border bg-gray-50 cursor-crosshair"
                                onmouseenter={() => isHovering = true}
                                onmouseleave={() => isHovering = false}
                                onmousemove={handleMouseMove}
                            >
                                <img
                                    src={imagePreviewUrl}
                                    alt="Label preview"
                                    class="absolute left-1/2 top-1/2 max-h-full max-w-full origin-center transition-transform duration-200 ease-out"
                                    style="transform: translate(-50%, -50%) scale({isHovering ? hoverScale : 1}); transform-origin: {zoomOrigin};"
                                    draggable="false"
                                />
                            </div>
                            <div class="flex w-full items-center justify-between">
                                <p class="text-xs text-gray-500">{imageFile?.name}</p>
                                <Tooltip text="Select a different image">
                                    <button
                                        type="button"
                                        class="text-xs text-blue-600 hover:underline"
                                        onclick={() => fileInputEl?.click()}
                                    >Replace image</button>
                                </Tooltip>
                            </div>
                        </div>
                    {:else}
                        <!-- svelte-ignore a11y_interactive_supports_focus -->
                        <div
                            role="button"
                            tabindex="0"
                            aria-label="Click or drag to upload a label image"
                            class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center transition-colors hover:border-gray-400 hover:bg-gray-50"
                            onclick={() => fileInputEl?.click()}
                            onkeydown={onDropZoneKeydown}
                        >
                            <svg class="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            <p class="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                            <p class="text-xs text-gray-400">JPEG, PNG, WebP · max 10 MB</p>
                            <p class="mt-1 text-xs text-gray-300">Ctrl+U to open file picker</p>
                        </div>
                    {/if}
                </CardContent>
            </Card>
        </div>

        <!-- ── RIGHT: Form + Results ──────────────────────────────────────────────── -->
        <div class="space-y-4">
            <form onsubmit={(e) => handleSubmit(e)}>
                <Card>
                    <CardHeader><CardTitle>Application Data (COLA Spec)</CardTitle></CardHeader>
                    <CardContent class="space-y-4">

                        <p class="text-xs text-gray-600">
                            <span class="text-red-500">*</span> Required · Lock icon preserves field value when clearing
                        </p>

                        <!-- Required fields -->
                        <div class="space-y-3">

                            <!-- Brand Name -->
                            <div>
                                <label for="brandName" class="mb-1 block text-sm font-medium text-gray-700">Brand Name *</label>
                                <div class="relative">
                                    <input id="brandName" type="text" bind:value={brandName} list="brands-list" autocomplete="off" class="{INPUT_BASE} {borderCls('brandName')}" />
                                    {@render statusIcon('brandName')}
                                </div>
                                {@render hintText('brandName')}
                            </div>

                            <!-- Beverage Type (no icon — native select has its own indicator) -->
                            <div>
                                <label for="beverageType" class="mb-1 block text-sm font-medium text-gray-700">Beverage Type *</label>
                                <select id="beverageType" bind:value={beverageType} class="{INPUT_BASE} {borderCls('beverageType')}">
                                    <option value="">Select type</option>
                                    <option value="beer">Beer</option>
                                    <option value="wine">Wine</option>
                                    <option value="distilled_spirits">Distilled Spirits</option>
                                </select>
                            </div>

                            <!-- Alcohol Content + Net Contents -->
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label for="alcoholContent" class="mb-1 block text-sm font-medium text-gray-700">Alcohol Content *</label>
                                    <div class="relative">
                                        <input id="alcoholContent" type="text" placeholder="e.g. 12.5% ALC/VOL" bind:value={alcoholContent} class="{INPUT_BASE} {borderCls('alcoholContent')}" />
                                        {@render statusIcon('alcoholContent')}
                                    </div>
                                    {@render hintText('alcoholContent')}
                                </div>
                                <div>
                                    <label for="netContents" class="mb-1 block text-sm font-medium text-gray-700">Net Contents *</label>
                                    <div class="relative">
                                        <input id="netContents" type="text" placeholder="e.g. 750 mL" bind:value={netContents} class="{INPUT_BASE} {borderCls('netContents')}" />
                                        {@render statusIcon('netContents')}
                                    </div>
                                    {@render hintText('netContents')}
                                </div>
                            </div>

                            <!-- Producer Name (lockable + autocomplete) -->
                            <div>
                                <div class="mb-1 flex items-center justify-between">
                                    <label for="producerName" class="text-sm font-medium text-gray-700">Producer Name *</label>
                                    <button type="button" class="rounded p-0.5 {locked.has('producerName') ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}" onclick={() => toggleLock('producerName')} aria-label="{locked.has('producerName') ? 'Unlock' : 'Lock'} producer name">
                                        {#if locked.has('producerName')}
                                            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                        {:else}
                                            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                                        {/if}
                                    </button>
                                </div>
                                <div class="relative">
                                    <input id="producerName" type="text" bind:value={producerName} list="producers-list" autocomplete="off" class="{INPUT_BASE} {borderCls('producerName')}" />
                                    {@render statusIcon('producerName')}
                                </div>
                                {@render hintText('producerName')}
                            </div>

                            <!-- Producer Address (lockable + autocomplete) -->
                            <div>
                                <div class="mb-1 flex items-center justify-between">
                                    <label for="producerAddress" class="text-sm font-medium text-gray-700">Producer Address *</label>
                                    <button type="button" class="rounded p-0.5 {locked.has('producerAddress') ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}" onclick={() => toggleLock('producerAddress')} aria-label="{locked.has('producerAddress') ? 'Unlock' : 'Lock'} producer address">
                                        {#if locked.has('producerAddress')}
                                            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                        {:else}
                                            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                                        {/if}
                                    </button>
                                </div>
                                <div class="relative">
                                    <input id="producerAddress" type="text" bind:value={producerAddress} list="addresses-list" autocomplete="off" class="{INPUT_BASE} {borderCls('producerAddress')}" />
                                    {@render statusIcon('producerAddress')}
                                </div>
                                {@render hintText('producerAddress')}
                            </div>
                        </div>

                        <div class="pt-2">
                            <Button type="submit" disabled={!canSubmit || loading} class="w-full">
                                {#if loading}
                                    <svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                    </svg>
                                    Verifying…
                                {:else}
                                    Verify Label <span class="ml-2 text-xs opacity-50">⌘↵</span>
                                {/if}
                            </Button>
                        </div>

                        <p class="text-center text-xs text-gray-600">
                            Ctrl+U: upload image · Esc: clear · ⌘↵: verify
                        </p>

                    </CardContent>
                </Card>
            </form>

            <!-- Error -->
            {#if error}
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            {/if}

            <!-- Results -->
            {#if result}
                <Card>
                    <CardHeader>
                        <div class="flex items-center justify-between">
                            <CardTitle>Verification Results</CardTitle>
                            <Badge variant={result.overallStatus} class="px-3 py-1 text-sm">
                                {OVERALL_LABEL[result.overallStatus]}
                            </Badge>
                        </div>
                        {#if result.processingTimeMs !== undefined}
                            <p class="text-xs text-gray-400">Completed in {result.processingTimeMs} ms</p>
                        {/if}
                    </CardHeader>
                    <CardContent class="space-y-1">
                        {#each result.fields as field}
                            <div class="rounded-md border border-gray-100 p-3">
                                <div class="flex items-center gap-2">
                                    <span class="w-36 shrink-0 text-sm font-medium text-gray-700">
                                        {formatFieldName(field.fieldName)}
                                    </span>
                                    <span class="flex-1 truncate text-sm text-gray-500" title={field.expectedValue ?? ''}>
                                        {#if field.expectedValue}{field.expectedValue}{:else}<span class="italic">—</span>{/if}
                                    </span>
                                    <span class="flex-1 truncate text-sm text-gray-900" title={field.foundValue ?? ''}>
                                        {#if field.foundValue}{field.foundValue}{:else}<span class="italic text-gray-400">not found</span>{/if}
                                    </span>
                                    <Badge variant={field.status}>
                                        {STATUS_LABEL[field.status]}
                                    </Badge>
                                </div>
                                {#if field.notes}
                                    <p class="mt-1 pl-36 text-xs text-gray-500">{field.notes}</p>
                                {/if}
                            </div>
                        {/each}
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
            <p class="text-2xl font-semibold text-blue-700">Drop anywhere to load label image</p>
            <p class="mt-2 text-sm text-blue-500">JPEG, PNG, or WebP</p>
        </div>
    </div>
{/if}