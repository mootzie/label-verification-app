<script lang="ts">
    import { Button } from '$lib/components/ui/button'
    import { parseSmartPaste } from '$lib/utils/application-builder'
    import {
        CLASS_TYPE_OPTIONS,
        BEVERAGE_FIELD_SETS,
        REQUIREMENT_BADGE,
    } from '$lib/utils/beverage-fields'
    import type {
        BeverageType,
        BeverageFieldDef,
        FieldRequirement,
    } from '$lib/utils/beverage-fields'

    let {
        brandName = $bindable(''),
        producerName = $bindable(''),
        beverageType = $bindable<BeverageType>('distilled_spirits'),
        classType = $bindable(''),
        producerAddress = $bindable(''),
        countryOfOrigin = $bindable(''),
        alcoholContent = $bindable(''),
        netContents = $bindable(''),
        appellation = $bindable(''),
        ageStatement = $bindable(''),
        colorDisclosures = $bindable(''),
        commodityStatement = $bindable(''),
        sulfiteDeclaration = $bindable(''),
        foreignWinePct = $bindable(''),
        colorAdditives = $bindable(''),
        aspartameDeclaration = $bindable(''),
        loading = false,
    }: {
        brandName?: string
        producerName?: string
        beverageType?: BeverageType
        classType?: string
        producerAddress?: string
        countryOfOrigin?: string
        alcoholContent?: string
        netContents?: string
        appellation?: string
        ageStatement?: string
        colorDisclosures?: string
        commodityStatement?: string
        sulfiteDeclaration?: string
        foreignWinePct?: string
        colorAdditives?: string
        aspartameDeclaration?: string
        loading?: boolean
    } = $props()

    let pasteText = $state('')
    let showPaste = $state(false)
    let parsedCount = $state(0)
    let parseError = $state(false)

    // Reset classType when beverage type changes, but only if the current value
    // isn't valid for the new type — this avoids wiping a classType that was
    // set in the same tick as beverageType (e.g. via paste auto-fill).
    let _prevType = $state<BeverageType>(beverageType)
    $effect(() => {
        if (beverageType !== _prevType) {
            const validOpts = CLASS_TYPE_OPTIONS[beverageType] ?? []
            if (!validOpts.includes(classType)) classType = ''
            _prevType = beverageType
        }
    })

    // Find the closest option from the dropdown list for a free-text parsed value.
    function matchClassType(raw: string, options: string[]): string {
        if (!raw) return ''
        const lower = raw.toLowerCase()
        const exact = options.find((o) => o.toLowerCase() === lower)
        if (exact) return exact
        // option text is wholly contained inside the raw string
        const contained = options.find((o) => lower.includes(o.toLowerCase()))
        if (contained) return contained
        // raw string is wholly contained inside an option
        const contains = options.find((o) => o.toLowerCase().includes(lower))
        if (contains) return contains
        return ''
    }

    let classTypeOptions = $derived(CLASS_TYPE_OPTIONS[beverageType] ?? [])
    let fieldSet = $derived(BEVERAGE_FIELD_SETS[beverageType] ?? [])

    // Dynamic field value getter/setter — used for the generic {#each} rendering
    function getVal(key: BeverageFieldDef['formKey']): string {
        switch (key) {
            case 'brandName':
                return brandName
            case 'classType':
                return classType
            case 'alcoholContent':
                return alcoholContent
            case 'netContents':
                return netContents
            case 'countryOfOrigin':
                return countryOfOrigin
            case 'appellation':
                return appellation
            case 'ageStatement':
                return ageStatement
            case 'colorDisclosures':
                return colorDisclosures
            case 'commodityStatement':
                return commodityStatement
            case 'sulfiteDeclaration':
                return sulfiteDeclaration
            case 'foreignWinePct':
                return foreignWinePct
            case 'colorAdditives':
                return colorAdditives
            case 'aspartameDeclaration':
                return aspartameDeclaration
            default:
                return ''
        }
    }

    function setVal(key: BeverageFieldDef['formKey'], val: string) {
        switch (key) {
            case 'brandName':
                brandName = val
                break
            case 'classType':
                classType = val
                break
            case 'alcoholContent':
                alcoholContent = val
                break
            case 'netContents':
                netContents = val
                break
            case 'countryOfOrigin':
                countryOfOrigin = val
                break
            case 'appellation':
                appellation = val
                break
            case 'ageStatement':
                ageStatement = val
                break
            case 'colorDisclosures':
                colorDisclosures = val
                break
            case 'commodityStatement':
                commodityStatement = val
                break
            case 'sulfiteDeclaration':
                sulfiteDeclaration = val
                break
            case 'foreignWinePct':
                foreignWinePct = val
                break
            case 'colorAdditives':
                colorAdditives = val
                break
            case 'aspartameDeclaration':
                aspartameDeclaration = val
                break
        }
    }

    const PLACEHOLDERS: Partial<Record<BeverageFieldDef['formKey'], string>> = {
        brandName: 'e.g. Old Tom Distillery',
        alcoholContent: 'e.g. 45% Alc./Vol.',
        netContents: 'e.g. 750 mL',
        countryOfOrigin: 'Required for imports',
        appellation: 'e.g. Napa Valley',
        ageStatement: 'e.g. Aged 4 Years',
        colorDisclosures: 'e.g. Artificially Colored',
        commodityStatement: 'e.g. 100% Grain Neutral Spirits',
        sulfiteDeclaration: 'e.g. Contains Sulfites',
        foreignWinePct: 'e.g. 25% foreign wine',
        colorAdditives: 'e.g. Colored with FD&C Red 40',
        aspartameDeclaration: 'e.g. Contains Aspartame',
    }

    function requirementBadge(requirement: FieldRequirement) {
        return requirement === 'required'
            ? null
            : REQUIREMENT_BADGE[requirement]
    }

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
            beverageType = r.beverageType as BeverageType
        if (r.classType && !classType) {
            const opts = CLASS_TYPE_OPTIONS[beverageType] ?? []
            const matched = matchClassType(r.classType, opts)
            if (matched) classType = matched
        }
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

    let textarea: HTMLTextAreaElement
    import { tick } from 'svelte'
</script>

<div class="flex flex-col rounded-md border border-gray-200 bg-white shadow-sm">
    <div
        class="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
        <div>
            <h3
                id="application-data-title"
                class="text-sm font-semibold text-gray-950">
                Application Data (COLA)
            </h3>
            <p class="mt-0.5 text-xs text-gray-500">
                Enter application details to compare against the label.
            </p>
        </div>
        <button
            type="button"
            class="shrink-0 rounded text-xs font-medium text-blue-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            onclick={async () => {
                showPaste = !showPaste
                await tick()
                textarea.focus()
            }}>
            {showPaste
                ? 'Hide paste helper'
                : 'Paste raw COLA text to auto-fill'}
        </button>
    </div>

    <div class="flex flex-col gap-3 p-4">
        <!-- Beverage type — controls which fields and class/type options are shown -->
        <label class="block">
            <span
                class="mb-1 flex items-center gap-1.5 text-sm font-semibold text-gray-600">
                <span>Beverage Type</span>
                <span class="text-red-600" aria-hidden="true">*</span>
                <span class="sr-only">Required</span>
            </span>
            <select bind:value={beverageType} class={inputCls}>
                <option value="distilled_spirits">Distilled Spirits</option>
                <option value="wine">Wine</option>
                <option value="beer">Beer</option>
            </select>
        </label>

        {#if showPaste}
            <div
                class="flex flex-col gap-2 rounded border border-blue-100 bg-blue-50/40 p-3">
                <p class="text-xs text-gray-600">
                    Paste raw COLA application text below. Fields will be
                    auto-filled without overwriting values you've already
                    entered.
                </p>
                <textarea
                    bind:this={textarea}
                    id="application-paste"
                    aria-label="Paste application text"
                    class="min-h-20 w-full resize-none rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Paste application text: brand name, producer, ABV, class/type, address..."
                    bind:value={pasteText}
                    onkeydown={handleKeydown}>
                </textarea>
                <Button
                    variant="outline"
                    disabled={!pasteText.trim() || loading}
                    onclick={tryParse}
                    class="h-9 w-full bg-blue-900 px-5 text-white hover:bg-blue-800">
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

        <!-- Dynamic field grid — driven by BEVERAGE_FIELD_SETS[beverageType] -->
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            {#each fieldSet as field (field.key)}
                {#if field.formKey === 'health_warning'}
                    <!-- Health warning is auto-verified against the statutory text — no user input -->
                {:else if field.formKey === 'name_address'}
                    <!-- Renders as two adjacent cells in the 2-col grid -->
                    <label class="block">
                        <span
                            class="mb-1 flex items-center gap-1.5 text-sm font-semibold text-gray-600">
                            <span>Bottler / Producer Name</span>
                            <span class="text-red-600" aria-hidden="true">
                                *
                            </span>
                            <span class="sr-only">Required</span>
                        </span>
                        <input
                            type="text"
                            value={producerName}
                            oninput={(e) =>
                                (producerName = e.currentTarget.value)}
                            placeholder="e.g. Old Tom Distillery LLC"
                            class={inputCls} />
                    </label>
                    <label class="block">
                        <span
                            class="mb-1 flex items-center gap-1.5 text-sm font-semibold text-gray-600">
                            <span>Bottler / Producer Address</span>
                            <span class="text-red-600" aria-hidden="true">
                                *
                            </span>
                            <span class="sr-only">Required</span>
                        </span>
                        <input
                            type="text"
                            value={producerAddress}
                            oninput={(e) =>
                                (producerAddress = e.currentTarget.value)}
                            placeholder="e.g. Louisville, KY 40201"
                            class={inputCls} />
                    </label>
                {:else if field.formKey === 'classType'}
                    <label class="block">
                        <span
                            class="mb-1 flex items-center gap-1.5 text-sm font-semibold text-gray-600">
                            <span>{field.label}</span>
                            {#if field.requirement === 'required'}
                                <span class="text-red-600" aria-hidden="true">
                                    *
                                </span>
                                <span class="sr-only">Required</span>
                            {:else}
                                <!-- <span
                                    class="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold normal-case text-gray-600"
                                >
                                    {requirementBadge(field.requirement)}
                                </span> -->
                            {/if}
                        </span>
                        <select bind:value={classType} class={inputCls}>
                            <option value="">Select class / type…</option>
                            {#each classTypeOptions as opt}
                                <option value={opt}>{opt}</option>
                            {/each}
                        </select>
                    </label>
                {:else}
                    <label class="block">
                        <span
                            class="mb-1 flex items-center gap-1.5 text-sm font-semibold text-gray-600">
                            <span>{field.label}</span>
                            {#if field.requirement === 'required'}
                                <span class="text-red-600" aria-hidden="true">
                                    *
                                </span>
                                <span class="sr-only">Required</span>
                            {:else}
                                <!-- <span
                                    class="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-semibold normal-case text-gray-600"
                                >
                                    {requirementBadge(field.requirement)}
                                </span> -->
                            {/if}
                        </span>
                        <input
                            type="text"
                            value={getVal(field.formKey)}
                            oninput={(e) =>
                                setVal(field.formKey, e.currentTarget.value)}
                            placeholder={PLACEHOLDERS[field.formKey] ?? ''}
                            class={inputCls} />
                    </label>
                {/if}
            {/each}
        </div>
    </div>
</div>
