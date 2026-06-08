<script lang="ts">
    import { ChevronDownIcon, InfoIcon } from '$lib/components/ui/icon'
    import { BEVERAGE_FIELD_SETS } from '$lib/utils/beverage-fields'
    import type {
        BeverageFieldDef,
        BeverageType,
    } from '$lib/utils/beverage-fields'
    import type { FieldResult } from '$shared/index'

    let {
        brandName = '',
        producerName = '',
        beverageType = 'distilled_spirits' as BeverageType,
        classType = '',
        producerAddress = '',
        countryOfOrigin = '',
        alcoholContent = '',
        netContents = '',
        appellation = '',
        ageStatement = '',
        colorDisclosures = '',
        commodityStatement = '',
        sulfiteDeclaration = '',
        foreignWinePct = '',
        colorAdditives = '',
        aspartameDeclaration = '',
        fields = [],
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
        fields?: FieldResult[]
        extractionOnly?: boolean
    } = $props()

    type ApplicationRow = {
        key: string
        label: string
        value: string
        resultKey: string
    }

    let expanded = $state(false)

    let fieldResults = $derived.by(() => {
        const map = new Map<string, FieldResult>()
        for (const field of fields) map.set(field.fieldName, field)
        return map
    })

    let summaryValues = $derived.by(() =>
        [brandName, classType, alcoholContent, netContents]
            .map((value) => value.trim())
            .filter(Boolean)
    )

    let summary = $derived(
        summaryValues.length > 0
            ? summaryValues.join(' · ')
            : 'No application data provided'
    )

    let rows = $derived.by(() => {
        const next: ApplicationRow[] = []

        function add(
            key: string,
            label: string,
            value: string,
            resultKey = key
        ) {
            const display = displayValue(value, resultKey)
            if (!display) return
            next.push({ key, label, value: display, resultKey })
        }

        for (const field of BEVERAGE_FIELD_SETS[beverageType] ?? []) {
            if (field.formKey === 'health_warning') {
                add(
                    'governmentWarning',
                    'Government Warning',
                    '',
                    'governmentWarning'
                )
            } else if (field.formKey === 'name_address') {
                add(
                    'producerName',
                    'Producer Name',
                    producerName,
                    'producerName'
                )
                add(
                    'producerAddress',
                    'Producer Address',
                    producerAddress,
                    'producerAddress'
                )
            } else {
                add(
                    field.formKey,
                    field.label,
                    fieldValue(field.formKey),
                    field.resultKey
                )
            }
        }

        return next
    })

    let rowColumns = $derived.by(() => {
        const midpoint = Math.ceil(rows.length / 2)
        return [rows.slice(0, midpoint), rows.slice(midpoint)]
    })

    function fieldValue(key: BeverageFieldDef['formKey']) {
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

    function displayValue(value: string, resultKey: string) {
        const trimmed = value.trim()
        if (trimmed) return trimmed
        if (resultKey === 'governmentWarning')
            return 'Required statutory warning'
        return fieldResults.get(resultKey)?.expectedValue?.trim() ?? ''
    }
</script>

<section class="shrink-0 border-b border-gray-200 bg-white px-3 py-2">
    <div
        class="rounded-md border border-gray-200 bg-white px-4 py-3 shadow-sm"
    >
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start">
            <div class="min-w-0 flex-1">
                <h3 class="text-sm font-bold text-gray-950">
                    Application data
                </h3>
                <p class="mt-1 truncate text-xs font-medium text-gray-700">
                    {summary}
                </p>
                <p
                    class="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-500"
                >
                    Reference values used for comparison
                    <span
                        class="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-gray-500"
                        aria-label="Application data comes from the submitted application or source system."
                    >
                        <InfoIcon size={14} />
                    </span>
                </p>
            </div>
            <button
                type="button"
                class="inline-flex h-9 shrink-0 items-center justify-center rounded border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-800 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                aria-expanded={expanded}
                onclick={() => (expanded = !expanded)}
            >
                {expanded ? 'Hide details' : 'View details'}
                <ChevronDownIcon
                    size={16}
                    className="ml-2 text-gray-500 transition-transform {expanded ? 'rotate-180' : ''}"
                />
            </button>
        </div>

        {#if expanded}
            {#if rows.length === 0}
                <p
                    class="mt-3 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600"
                >
                    No application data was submitted for comparison.
                </p>
            {:else}
                <div
                    class="mt-3 grid overflow-hidden rounded border border-gray-200 bg-white lg:grid-cols-2"
                >
                    {#each rowColumns as column, columnIndex}
                        <div
                            class="divide-y divide-gray-100 {columnIndex === 0
                                ? 'lg:border-r lg:border-gray-200'
                                : ''}"
                        >
                            {#each column as row (row.key)}
                                <div
                                    class="grid grid-cols-[minmax(8rem,0.75fr)_1fr] gap-4 px-3 py-2.5 text-xs"
                                >
                                    <div
                                        class="font-bold text-gray-900"
                                    >
                                        {row.label}
                                    </div>
                                    <div
                                        class="min-w-0 break-words font-medium leading-5 text-gray-700"
                                    >
                                        {row.value}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/each}
                </div>
            {/if}
        {/if}
    </div>
</section>
