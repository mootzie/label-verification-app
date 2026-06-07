<script lang="ts">
    import { Button } from '$lib/components/ui/button'
    import { parseSmartPaste } from '$lib/utils/application-builder'

    let {
        brandName = $bindable(''),
        producerName = $bindable(''),
        beverageType = $bindable<'beer' | 'wine' | 'distilled_spirits' | ''>(
            ''
        ),
        classType = $bindable(''),
        producerAddress = $bindable(''),
        countryOfOrigin = $bindable(''),
        alcoholContent = $bindable(''),
        netContents = $bindable(''),
        loading = false,
    }: {
        brandName?: string
        producerName?: string
        beverageType?: 'beer' | 'wine' | 'distilled_spirits' | ''
        classType?: string
        producerAddress?: string
        countryOfOrigin?: string
        alcoholContent?: string
        netContents?: string
        loading?: boolean
    } = $props()

    let pasteText = $state('')
    let showPaste = $state(false)
    let parsedCount = $state(0)
    let parseError = $state(false)

    function tryParse() {
        const r = parseSmartPaste(pasteText)
        const count = Object.values(r).filter(
            (v) => v !== null && v !== ''
        ).length
        if (count === 0) {
            parseError = true
            parsedCount = 0
            return
        }
        parseError = false
        parsedCount = count
        if (r.brandName && !brandName) brandName = r.brandName
        if (r.producerName && !producerName) producerName = r.producerName
        if (r.producerAddress && !producerAddress)
            producerAddress = r.producerAddress
        if (r.countryOfOrigin && !countryOfOrigin)
            countryOfOrigin = r.countryOfOrigin
        if (r.beverageType && !beverageType)
            beverageType = r.beverageType as typeof beverageType
        if (r.classType && !classType) classType = r.classType
        if (r.alcoholContent && !alcoholContent)
            alcoholContent = r.alcoholContent
        if (r.netContents && !netContents) netContents = r.netContents
        showPaste = false
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) tryParse()
    }

    const inputCls =
        'w-full rounded border border-gray-300 bg-white px-2.5 h-9 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors'
</script>

<div class="flex flex-col rounded-md border border-gray-200 bg-white shadow-sm">
    <div
        class="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3"
    >
        <div>
            <h3
                id="application-data-title"
                class="text-sm font-semibold text-gray-950"
            >
                Application Data (COLA)
            </h3>
            <p class="mt-0.5 text-xs text-gray-500">
                Enter application details to compare against the label.
            </p>
        </div>
        <button
            type="button"
            class="shrink-0 rounded text-xs font-medium text-blue-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            onclick={() => (showPaste = !showPaste)}
        >
            {showPaste ? 'Hide paste helper' : 'Paste raw COLA text to auto-fill'}
        </button>
    </div>

    <div class="flex flex-col gap-3 p-4">
        {#if showPaste}
            <div
                class="flex flex-col gap-2 rounded border border-blue-100 bg-blue-50/40 p-3"
            >
                <p class="text-xs text-gray-600">
                    Paste raw COLA application text below. Fields will be
                    auto-filled without overwriting values you've already
                    entered.
                </p>
                <textarea
                    id="application-paste"
                    aria-label="Paste application text"
                    class="min-h-20 w-full resize-none rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Paste application text: brand name, producer, ABV, class/type, address..."
                    bind:value={pasteText}
                    onkeydown={handleKeydown}
                ></textarea>
                <Button
                    variant="outline"
                    disabled={!pasteText.trim() || loading}
                    onclick={tryParse}
                    class="h-9 w-full bg-blue-900 px-5 text-white hover:bg-blue-800"
                >
                    Auto-fill fields
                </Button>
                {#if parseError}
                    <p class="text-xs text-red-600">
                        No recognizable fields found. Enter fields manually
                        below.
                    </p>
                {:else if parsedCount > 0}
                    <p class="text-xs font-semibold text-green-700">
                        {parsedCount} field{parsedCount !== 1 ? 's' : ''} auto-filled.
                    </p>
                {/if}
            </div>
        {/if}

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label class="block">
                <span
                    class="mb-1 block text-xs font-bold uppercase text-gray-600"
                    >Brand Name</span
                >
                <input type="text" bind:value={brandName} class={inputCls} />
            </label>
            <label class="block">
                <span
                    class="mb-1 block text-xs font-bold uppercase text-gray-600"
                    >Class / Type</span
                >
                <input
                    type="text"
                    bind:value={classType}
                    placeholder="e.g. Bourbon Whiskey"
                    class={inputCls}
                />
            </label>
            <label class="block">
                <span
                    class="mb-1 block text-xs font-bold uppercase text-gray-600"
                    >Alcohol Content</span
                >
                <input
                    type="text"
                    bind:value={alcoholContent}
                    placeholder="e.g. 45% Alc./Vol."
                    class={inputCls}
                />
            </label>
            <label class="block">
                <span
                    class="mb-1 block text-xs font-bold uppercase text-gray-600"
                    >Net Contents</span
                >
                <input
                    type="text"
                    bind:value={netContents}
                    placeholder="e.g. 750 mL"
                    class={inputCls}
                />
            </label>
            <label class="block">
                <span
                    class="mb-1 block text-xs font-bold uppercase text-gray-600"
                    >Producer Name</span
                >
                <input
                    type="text"
                    bind:value={producerName}
                    class={inputCls}
                />
            </label>
            <label class="block">
                <span
                    class="mb-1 block text-xs font-bold uppercase text-gray-600"
                    >Producer Address</span
                >
                <input
                    type="text"
                    bind:value={producerAddress}
                    class={inputCls}
                />
            </label>
            <label class="block">
                <span
                    class="mb-1 block text-xs font-bold uppercase text-gray-600"
                    >Country of Origin</span
                >
                <input
                    type="text"
                    bind:value={countryOfOrigin}
                    placeholder="Required for imports"
                    class={inputCls}
                />
            </label>
            <label class="block">
                <span
                    class="mb-1 block text-xs font-bold uppercase text-gray-600"
                    >Beverage Type</span
                >
                <select bind:value={beverageType} class={inputCls}>
                    <option value="">Select type</option>
                    <option value="beer">Beer</option>
                    <option value="wine">Wine</option>
                    <option value="distilled_spirits">Distilled Spirits</option>
                </select>
            </label>
        </div>
    </div>
</div>