<script lang="ts">
    import { tick } from 'svelte'
    import { Button } from '$lib/components/ui/button'
    import { parseSmartPaste } from '$lib/utils/application-builder'
    import { CLASS_TYPE_OPTIONS, BEVERAGE_FIELD_SETS } from '$lib/utils/beverage-fields'
    import type { BeverageType, BeverageFieldDef, FieldRequirement } from '$lib/utils/beverage-fields'

    type InputFormKey = Exclude<BeverageFieldDef['formKey'], 'name_address' | 'health_warning'>

    export type ApplicationFormValues = Record<InputFormKey | 'producerName' | 'producerAddress', string> & {
        beverageType: BeverageType
    }

    const emptyApplicationValues = (): ApplicationFormValues => ({
        beverageType: 'distilled_spirits',
        brandName: '',
        producerName: '',
        classType: '',
        producerAddress: '',
        countryOfOrigin: '',
        alcoholContent: '',
        netContents: '',
        appellation: '',
        ageStatement: '',
        colorDisclosures: '',
        commodityStatement: '',
        sulfiteDeclaration: '',
        foreignWinePct: '',
        colorAdditives: '',
        aspartameDeclaration: '',
    })

    let {
        values = $bindable<ApplicationFormValues>(emptyApplicationValues()),
        loading = false,
    }: {
        values?: ApplicationFormValues
        loading?: boolean
    } = $props()

    let pasteText = $state('')
    let showPaste = $state(false)
    let parsedCount = $state(0)
    let parseError = $state(false)

    // Reset classType when beverage type changes, but only if the current value
    // isn't valid for the new type this avoids wiping a classType that was
    // set in the same tick as beverageType (e.g. via paste auto-fill).
    let _prevType = $state<BeverageType>(values.beverageType)
    $effect(() => {
        if (values.beverageType !== _prevType) {
            const validOpts = CLASS_TYPE_OPTIONS[values.beverageType] ?? []
            if (!validOpts.includes(values.classType)) values.classType = ''
            _prevType = values.beverageType
        }
    })

    const matchClassType = (raw: string, options: string[]): string => {
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

    let classTypeOptions = $derived.by(() => CLASS_TYPE_OPTIONS[values.beverageType] ?? [])
    let fieldSet = $derived.by(() => BEVERAGE_FIELD_SETS[values.beverageType] ?? [])
    let textarea = $state<HTMLTextAreaElement | null>(null)

    const INPUT_FORM_KEYS = ['brandName', 'classType', 'alcoholContent', 'netContents', 'countryOfOrigin', 'appellation', 'ageStatement', 'colorDisclosures', 'commodityStatement', 'sulfiteDeclaration', 'foreignWinePct', 'colorAdditives', 'aspartameDeclaration'] as const satisfies readonly InputFormKey[]

    const isInputFormKey = (key: BeverageFieldDef['formKey']): key is InputFormKey => {
        return INPUT_FORM_KEYS.includes(key as InputFormKey)
    }

    const getVal = (key: BeverageFieldDef['formKey']): string => {
        return isInputFormKey(key) ? values[key] : ''
    }

    const setVal = (key: BeverageFieldDef['formKey'], value: string) => {
        if (isInputFormKey(key)) values[key] = value
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

    const tryParse = () => {
        const r = parseSmartPaste(pasteText)
        const count = Object.values(r).filter((v) => v !== null && v !== '').length
        if (count === 0) {
            parseError = true
            parsedCount = 0
            return
        }
        parseError = false
        parsedCount = count
        if (r.brandName && !values.brandName) values.brandName = r.brandName
        if (r.producerName && !values.producerName) values.producerName = r.producerName
        if (r.producerAddress && !values.producerAddress) values.producerAddress = r.producerAddress
        if (r.countryOfOrigin && !values.countryOfOrigin) values.countryOfOrigin = r.countryOfOrigin
        if (r.beverageType && !values.beverageType) values.beverageType = r.beverageType as BeverageType
        if (r.classType && !values.classType) {
            const opts = CLASS_TYPE_OPTIONS[values.beverageType] ?? []
            const matched = matchClassType(r.classType, opts)
            if (matched) values.classType = matched
        }
        if (r.alcoholContent && !values.alcoholContent) values.alcoholContent = r.alcoholContent
        if (r.netContents && !values.netContents) values.netContents = r.netContents
        showPaste = false
    }

    const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) tryParse()
    }
</script>

<div class="flex h-full min-h-0 flex-col rounded-md border border-gray-200 bg-white shadow-sm">
    <div class="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
        <div>
            <h3 id="application-data-title" class="text-sm font-semibold text-gray-950">Application Data (COLA)</h3>
            <p class="mt-0.5 text-xs text-gray-500">Enter application details to compare against the label.</p>
        </div>
        <button
            type="button"
            class="shrink-0 rounded text-xs font-medium text-blue-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            onclick={async () => {
                showPaste = !showPaste
                await tick()
                textarea?.focus()
            }}>
            {showPaste ? 'Hide paste helper' : 'Paste raw COLA text to auto-fill'}
        </button>
    </div>

    <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        <label class="block">
            <span class="field-label">
                <span>Beverage Type</span>
                <span class="text-red-600" aria-hidden="true">*</span>
                <span class="sr-only">Required</span>
            </span>
            <select bind:value={values.beverageType} class="form-input">
                <option value="distilled_spirits">Distilled Spirits</option>
                <option value="wine">Wine</option>
                <option value="beer">Beer</option>
            </select>
        </label>

        {#if showPaste}
            <div class="flex flex-col gap-2 rounded border border-blue-100 bg-blue-50/40 p-3">
                <p class="text-xs text-gray-600">Paste raw COLA application text below. Fields will be auto-filled without overwriting values you've already entered.</p>
                <textarea bind:this={textarea} id="application-paste" aria-label="Paste application text" class="min-h-20 w-full resize-none rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600" placeholder="Paste application text: brand name, producer, ABV, class/type, address..." bind:value={pasteText} onkeydown={handleKeydown}></textarea>
                <Button variant="outline" disabled={!pasteText.trim() || loading} onclick={tryParse} class="h-9 w-full bg-blue-900 px-5 text-white hover:bg-blue-800">Auto-fill fields</Button>
                {#if parseError}
                    <p class="text-xs text-red-600">No recognizable fields found. Enter fields manually below.</p>
                {:else if parsedCount > 0}
                    <p class="text-xs font-semibold text-green-700">
                        {parsedCount} field{parsedCount !== 1 ? 's' : ''} auto-filled.
                    </p>
                {/if}
            </div>
        {/if}

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            {#each fieldSet as field (field.key)}
                {#if field.formKey === 'name_address'}
                    <!-- Renders as two adjacent cells in the 2-col grid -->
                    <label class="block">
                        <span class="field-label">
                            <span>Bottler / Producer Name</span>
                            <span class="text-red-600" aria-hidden="true">*</span>
                            <span class="sr-only">Required</span>
                        </span>
                        <input type="text" value={values.producerName} oninput={(e) => (values.producerName = e.currentTarget.value)} placeholder="e.g. Old Tom Distillery LLC" class="form-input" />
                    </label>
                    <label class="block">
                        <span class="field-label">
                            <span>Bottler / Producer Address</span>
                            <span class="text-red-600" aria-hidden="true">*</span>
                            <span class="sr-only">Required</span>
                        </span>
                        <input type="text" value={values.producerAddress} oninput={(e) => (values.producerAddress = e.currentTarget.value)} placeholder="e.g. Louisville, KY 40201" class="form-input" />
                    </label>
                {:else if field.formKey === 'classType'}
                    <label class="block">
                        <span class="field-label">
                            <span>{field.label}</span>
                            {#if field.requirement === 'required'}
                                <span class="text-red-600" aria-hidden="true">*</span>
                                <span class="sr-only">Required</span>
                            {/if}
                        </span>
                        <select bind:value={values.classType} class="form-input">
                            <option value="">Select class / type…</option>
                            {#each classTypeOptions as opt}
                                <option value={opt}>{opt}</option>
                            {/each}
                        </select>
                    </label>
                {:else}
                    <label class="block">
                        <span class="field-label">
                            <span>{field.label}</span>
                            {#if field.requirement === 'required'}
                                <span class="text-red-600" aria-hidden="true">*</span>
                                <span class="sr-only">Required</span>
                            {/if}
                        </span>
                        <input type="text" value={getVal(field.formKey)} oninput={(e) => setVal(field.formKey, e.currentTarget.value)} placeholder={PLACEHOLDERS[field.formKey] ?? ''} class="form-input" />
                    </label>
                {/if}
            {/each}
        </div>
    </div>
</div>
