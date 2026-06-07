<script lang="ts">
    import { Badge } from '$lib/components/ui/badge'
    import { formatFieldName, STATUS_LABEL } from '$lib/utils/compliance-logic'
    import { BEVERAGE_FIELD_SETS } from '$lib/utils/beverage-fields'
    import type { BeverageType } from '$lib/utils/beverage-fields'
    import type { FieldResult, FieldStatus } from '$shared/index'

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
        extractionOnly = false,
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

    let expanded = $state(false)

    let fieldResults = $derived.by(() => {
        const map = new Map<string, FieldResult>()
        for (const field of fields) map.set(field.fieldName, field)
        return map
    })

    let hasApplicationData = $derived(
        [
            brandName,
            classType,
            alcoholContent,
            netContents,
            producerName,
            producerAddress,
            countryOfOrigin,
            appellation,
            ageStatement,
            colorDisclosures,
            commodityStatement,
            sulfiteDeclaration,
            foreignWinePct,
            colorAdditives,
            aspartameDeclaration,
        ].some((value) => value.trim().length > 0)
    )

    let summary = $derived.by(() => {
        const values = [brandName, classType, alcoholContent, netContents]
            .map((value) => value.trim())
            .filter(Boolean)
        if (values.length === 0)
            return 'No application data provided - extraction only'
        return values.join(' · ')
    })

    let applicationRows = $derived.by(() => {
        const rows: {
            key: string
            label: string
            value: string
            resultKey: string
        }[] = []

        function add(
            key: string,
            label: string,
            value: string,
            resultKey = key
        ) {
            if (!value.trim() && !fieldResults.has(resultKey)) return
            rows.push({ key, label, value, resultKey })
        }

        for (const field of BEVERAGE_FIELD_SETS[beverageType] ?? []) {
            if (field.formKey === 'health_warning') {
                add(
                    'governmentWarning',
                    'Government Warning',
                    'Required statutory warning',
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

        return rows
    })

    function fieldValue(key: string) {
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

    function statusFor(resultKey: string): FieldStatus | 'not_compared' {
        if (extractionOnly) return 'not_compared'
        return fieldResults.get(resultKey)?.status ?? 'not_compared'
    }

    function statusLabel(status: FieldStatus | 'not_compared') {
        if (status === 'not_compared') return 'Not compared'
        return STATUS_LABEL[status]
    }

    function statusVariant(status: FieldStatus | 'not_compared') {
        if (status === 'not_compared') return 'not_found'
        return status
    }

    function statusDotClass(status: FieldStatus | 'not_compared') {
        if (status === 'pass') return 'bg-green-500'
        if (status === 'warning') return 'bg-amber-500'
        if (status === 'fail') return 'bg-red-500'
        return 'bg-gray-400'
    }
</script>

<section class="shrink-0 border-b border-gray-200 bg-white px-3 py-2">
    <div
        class="rounded-md border border-gray-200 bg-slate-50 px-3 py-2 shadow-sm"
    >
        <div class="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                    <h3 class="text-xs font-bold text-gray-950">
                        Application data
                    </h3>
                    {#if !hasApplicationData}
                        <span
                            class="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-500"
                        >
                            Extraction only
                        </span>
                    {/if}
                </div>
                <p class="mt-1 truncate text-xs font-medium text-gray-600">
                    {summary}
                </p>
            </div>
            <button
                type="button"
                class="inline-flex h-8 shrink-0 items-center justify-center rounded border border-gray-300 bg-white px-3 text-xs font-semibold text-blue-800 shadow-sm hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                aria-expanded={expanded}
                onclick={() => (expanded = !expanded)}
            >
                {expanded ? 'Hide application data' : 'View application data'}
                <span class="ml-1" aria-hidden="true"
                    >{expanded ? '▴' : '▾'}</span
                >
            </button>
        </div>

        {#if expanded}
            <div class="mt-3 border-t border-gray-200 pt-3">
                {#if applicationRows.length === 0}
                    <p class="text-xs font-medium text-gray-600">
                        No application data was submitted for comparison.
                    </p>
                {:else}
                    <div class="grid grid-cols-1 gap-2 xl:grid-cols-2">
                        {#each applicationRows as row (row.key)}
                            {@const status = statusFor(row.resultKey)}
                            <div
                                class="flex min-w-0 items-center justify-between gap-3 rounded border border-gray-200 bg-white px-3 py-2"
                            >
                                <div class="min-w-0">
                                    <div class="flex items-center gap-2">
                                        <span
                                            class="h-2 w-2 shrink-0 rounded-sm {statusDotClass(
                                                status
                                            )}"
                                            aria-hidden="true"
                                        ></span>
                                        <p
                                            class="truncate text-xs font-bold text-gray-900"
                                        >
                                            {row.label ||
                                                formatFieldName(row.resultKey)}
                                        </p>
                                    </div>
                                    <p
                                        class="mt-1 line-clamp-2 break-words pl-4 text-xs leading-5 text-gray-600"
                                    >
                                        {row.value.trim() || 'Not provided'}
                                    </p>
                                </div>
                                <Badge
                                    variant={statusVariant(status)}
                                    class="h-6 w-24 shrink-0 justify-center border-0 px-2 text-[11px]"
                                >
                                    {statusLabel(status)}
                                </Badge>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</section>
