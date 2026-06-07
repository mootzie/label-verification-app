<script lang="ts">
    import { Button } from '$lib/components/ui/button'
    import { FileTextIcon } from '$lib/components/ui/icon'
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
        hasResult = false,
        blankState = false,
        onCompare,
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
        hasResult?: boolean
        blankState?: boolean
        onCompare: () => void
    } = $props()

    let pasteText = $state('')
    let showFields = $state(false)
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
        // Only fill empty fields — don't overwrite values the user already entered
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
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) tryParse()
    }

    const inputCls =
        'w-full rounded border border-gray-300 bg-white px-2.5 h-9 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors'
</script>

<div
    class="flex h-full min-h-0 flex-col rounded-md border border-gray-200 bg-white shadow-sm"
>
    <div
        class="flex flex-col gap-1 px-4 py-4 border-b border-gray-200 lg:flex-row lg:items-center lg:justify-between"
    >
        <h3
            id="application-data-title"
            class="inline-flex items-center gap-2 text-base font-semibold text-gray-950"
        >
            <!-- {#if blankState}
                <FileTextIcon size={20} className="text-blue-700" />
                <span class="font-bold text-blue-700">Step 2</span>
                <span
                    class="h-1 w-1 rounded-full bg-blue-700"
                    aria-hidden="true"
                ></span>
            {/if} -->
            Application Data
            <!-- {#if blankState}
                <span
                    class="rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-semibold text-gray-600"
                >
                    Optional
                </span>
            {/if} -->
        </h3>
        <!-- <p class="max-w-xl text-sm text-gray-500 lg:text-right">
            {blankState
                ? 'Can be added before or after upload.'
                : 'Paste COLA application values to compare against extracted label fields'}
        </p> -->
    </div>

    <div class="flex min-h-0 flex-1 flex-col space-y-3 p-4">
        <!-- #region Paste area -->
        <div class="flex min-h-0 flex-1 flex-col space-y-3">
            <textarea
                id="application-paste"
                aria-labelledby="application-data-title"
                class="min-h-24 w-full flex-1 resize-none rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Paste application text: brand name, producer, ABV, class/type, address..."
                bind:value={pasteText}
                onkeydown={handleKeydown}
            ></textarea>
            <Button
                variant="outline"
                disabled={!pasteText.trim() || loading}
                onclick={tryParse}
                class="h-10 w-full bg-blue-900 px-5 text-white hover:bg-blue-800"
            >
                Parse
            </Button>
        </div>

        {#if parseError}
            <p class="text-xs text-red-600">
                No recognizable fields found. Try the manual fields below.
            </p>
        {:else if parsedCount > 0}
            <p class="text-xs font-semibold text-green-700">
                {parsedCount} field{parsedCount !== 1 ? 's' : ''} parsed — review
                below or compare now.
            </p>
        {/if}

        <!-- Toggle manual fields -->
        <button
            type="button"
            class="text-xs font-semibold text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded underline"
            onclick={() => (showFields = !showFields)}
        >
            {showFields ? 'Hide manual fields' : 'Enter fields manually'}
        </button>

        {#if showFields}
            <div class="grid grid-cols-1 gap-3 pt-1 md:grid-cols-2">
                <label class="block">
                    <span
                        class="mb-1 block text-xs font-bold uppercase text-gray-600"
                        >Brand Name</span
                    >
                    <input
                        type="text"
                        bind:value={brandName}
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
                        >Beverage Type</span
                    >
                    <select bind:value={beverageType} class={inputCls}>
                        <option value="">Select type</option>
                        <option value="beer">Beer</option>
                        <option value="wine">Wine</option>
                        <option value="distilled_spirits"
                            >Distilled Spirits</option
                        >
                    </select>
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
                <label class="block md:col-span-2">
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
            </div>
        {/if}

        <!-- Compare button — only shown when a label has already been extracted -->
        {#if hasResult}
            <div class="border-t border-gray-100 pt-3">
                <Button
                    disabled={loading}
                    onclick={onCompare}
                    class="h-9 bg-blue-900 hover:bg-blue-800"
                >
                    {loading ? 'Comparing…' : 'Compare with Label'}
                </Button>
            </div>
        {/if}
    </div>
</div>
