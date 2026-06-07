export function parseSmartPaste(text: string) {
    const trimmed = text.trim()

    // JSON object
    if (trimmed.startsWith('{')) {
        try {
            const obj = JSON.parse(trimmed)
            if (typeof obj === 'object' && obj !== null) return parseFromObject(obj)
        } catch { /* fall through */ }
    }

    // JSON array — use first element
    if (trimmed.startsWith('[')) {
        try {
            const arr = JSON.parse(trimmed)
            if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'object') {
                return parseFromObject(arr[0])
            }
        } catch { /* fall through */ }
    }

    // SQL INSERT INTO table (col1, col2) VALUES (val1, val2)
    const sqlMatch = trimmed.match(
        /INSERT\s+INTO\s+\S+\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i
    )
    if (sqlMatch) {
        const cols = sqlMatch[1].split(',').map((s) => s.trim().replace(/[`'"[\]]/g, ''))
        const vals = sqlMatch[2]
            .split(',')
            .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        const obj: Record<string, string> = {}
        cols.forEach((c, i) => { obj[c] = vals[i] ?? '' })
        return parseFromObject(obj)
    }

    return parsePlainText(text)
}

// Map a loose object (from JSON or SQL) to our field shape.
// Accepts camelCase, snake_case, and common label variants.
function parseFromObject(obj: Record<string, unknown>) {
    function pick(...keys: string[]): string | null {
        for (const k of keys) {
            const v = obj[k]
            if (typeof v === 'string' && v.trim()) return v.trim()
        }
        return null
    }

    const brandName = pick('brandName', 'brand_name', 'brand', 'name')
    const producerName = pick('producerName', 'producer_name', 'producer', 'bottler', 'bottlerName')
    const producerAddress = pick('producerAddress', 'producer_address', 'address', 'bottlerAddress')
    const countryOfOrigin = pick('countryOfOrigin', 'country_of_origin', 'country', 'origin')
    const alcoholContent = pick('alcoholContent', 'alcohol_content', 'alcohol', 'abv', 'alc')
    const netContents = pick('netContents', 'net_contents', 'netContent', 'volume', 'size')
    const vintageYear = pick('vintageYear', 'vintage_year', 'vintage', 'year')
    const classType = pick('classType', 'class_type', 'class', 'type', 'style', 'variety')
    const appellation = pick('appellation')
    const ageStatement = pick('ageStatement', 'age_statement', 'age')
    const colorDisclosures = pick('colorDisclosures', 'color_disclosures', 'color')
    const commodityStatement = pick('commodityStatement', 'commodity_statement', 'commodity')
    const sulfiteDeclaration = pick('sulfiteDeclaration', 'sulfite_declaration', 'sulfites')
    const foreignWinePct = pick('foreignWinePct', 'foreign_wine_pct', 'foreignWine')
    const colorAdditives = pick('colorAdditives', 'color_additives')
    const aspartameDeclaration = pick('aspartameDeclaration', 'aspartame_declaration', 'aspartame')

    // beverageType detection: try explicit field first, then infer from classType/other fields
    let beverageType: string | null = pick('beverageType', 'beverage_type', 'type') ?? null
    if (beverageType && !['beer', 'wine', 'distilled_spirits'].includes(beverageType)) {
        beverageType = inferBeverageType(beverageType + ' ' + (classType ?? ''))
    }
    if (!beverageType) {
        beverageType = inferBeverageType(
            [brandName, classType, producerName].filter(Boolean).join(' ')
        )
    }

    return {
        brandName,
        producerName,
        producerAddress,
        countryOfOrigin,
        beverageType,
        classType,
        alcoholContent,
        netContents,
        vintageYear,
        appellation,
        ageStatement,
        colorDisclosures,
        commodityStatement,
        sulfiteDeclaration,
        foreignWinePct,
        colorAdditives,
        aspartameDeclaration,
    }
}

function inferBeverageType(text: string): string | null {
    if (
        /\b(whiskey|whisky|vodka|rum\b|gin\b|tequila|bourbon|brandy|mezcal|cognac|distilled\s+spirits?)\b/i.test(text)
    ) return 'distilled_spirits'
    if (
        /\b(wine|champagne|chardonnay|cabernet|merlot|pinot|riesling|sauvignon|mead|prosecco|bordeaux|burgundy|chablis|shiraz|viognier)\b/i.test(text)
    ) return 'wine'
    if (
        /\b(beer|ale\b|lager|stout|porter\b|ipa\b|pilsner|saison|bock\b|weizen|hefeweizen|pale\s+ale|wheat\s+beer)\b/i.test(text)
    ) return 'beer'
    return null
}

function parsePlainText(text: string) {
    // normalize tabs to newlines so tab-separated spreadsheet rows parse like multi-line blocks
    const normalized = text.replace(/\t/g, '\n')
    const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean)

    // alcoholContent: "12.5% alc/vol", "40% ABV", "5.6% alcohol", "40% ALCOHOL BY VOLUME", "5.4% ALC. BY VOL."
    const alcMatch = normalized.match(
        /\b(\d+\.?\d*)\s*%\s*(alc(?:ohol)?\.?(?:\s*(?:\/\s*vol\.?|by\s+vol(?:ume)?))?|abv|vol(?:ume)?)/i
    )
    const alcoholContent = alcMatch ? alcMatch[0].trim() : null

    // netContents: "750mL", "1L", "12 fl. oz.", "355 ml"
    const netMatch = normalized.match(/\b(\d+\.?\d*)\s*(mL|L\b|oz\.?|fl\.?\s*oz\.?)/i)
    const netContents = netMatch ? netMatch[0].trim() : null

    // vintageYear: 4-digit year 1900–2099
    const yearMatch = normalized.match(/\b(19|20)\d{2}\b/)
    const vintageYear = yearMatch ? yearMatch[0] : null

    // brandName: first non-empty line
    const brandName = lines.length > 0 ? lines[0].slice(0, 100) : null

    // producerName: "Produced/Brewed/Bottled/Distilled/Manufactured/Imported/MFD/MFG by/for: ..."
    const producerMatch = normalized.match(
        /(?:Produced|Brewed|Bottled|Distilled|Manufactured|Imported|Packed|MFD|MFG)\s+(?:by|for)[:\s]+([^\t\n]+)/i
    )
    const producerName = producerMatch ? producerMatch[1].trim() : null

    // producerAddress: line after producer line, or fallback to city/state/ZIP pattern
    let producerAddress: string | null = null
    if (producerMatch) {
        const producerLineIdx = lines.findIndex((l) =>
            /(?:Produced|Brewed|Bottled|Distilled|Manufactured|Imported|Packed|MFD|MFG)\s+(?:by|for)/i.test(l)
        )
        const next = lines[producerLineIdx + 1] ?? null
        if (next && !/(?:product\s+of|made\s+in|imported\s+from|%|mL|L\b|oz|\d{4})/i.test(next)) {
            producerAddress = next
        }
    }
    if (!producerAddress) {
        const addrMatch = normalized.match(/\b[A-Za-z][A-Za-z\s]+,\s+[A-Z]{2}\s+\d{5}(?:-\d{4})?\b/)
        if (addrMatch) producerAddress = addrMatch[0].trim()
    }

    // countryOfOrigin: "Product of USA", "Made in France", "PRODUCT OF U.S.A.", "Imported from Mexico"
    const countryMatch = normalized.match(
        /(?:Product\s+of|Made\s+in|Imported\s+from)\s+([A-Za-z][A-Za-z.\s]{1,35}?)(?:\t|\n|$|,)/i
    )
    const countryOfOrigin = countryMatch
        ? countryMatch[1].trim().replace(/\.+$/, '').trim()
        : null

    // beverageType: keyword scan → one of the three API values
    const beverageType = inferBeverageType(normalized)

    // classType: explicit "Class/Type/Style/Variety: ..." label, or second line if plain descriptor
    let classType: string | null = null
    const classLabelMatch = normalized.match(/(?:Class|Type|Style|Variety)[:\s]+(.+)/i)
    if (classLabelMatch) {
        classType = classLabelMatch[1].trim().slice(0, 80)
    } else if (lines.length >= 2) {
        const second = lines[1]
        if (
            !/(?:Produced|Brewed|Bottled|Distilled|Manufactured|Imported|Made|Product\s+of|%|mL|L\b|oz|\d{4})/i.test(
                second
            )
        ) {
            classType = second.slice(0, 80)
        }
    }

    return {
        brandName,
        producerName,
        producerAddress,
        countryOfOrigin,
        beverageType,
        classType,
        alcoholContent,
        netContents,
        vintageYear,
        appellation: null,
        ageStatement: null,
        colorDisclosures: null,
        commodityStatement: null,
        sulfiteDeclaration: null,
        foreignWinePct: null,
        colorAdditives: null,
        aspartameDeclaration: null,
    }
}

export function buildOptionalApplicationData(data: {
    brandName: string
    classType: string
    beverageType: string
    alcoholContent: string
    netContents: string
    producerName: string
    producerAddress: string
    productName?: string
    countryOfOrigin?: string
    appellation?: string
    vintageYear?: string
    ageStatement?: string
    colorDisclosures?: string
    commodityStatement?: string
    sulfiteDeclaration?: string
    foreignWinePct?: string
    colorAdditives?: string
    aspartameDeclaration?: string
}) {
    const entries = {
        brandName: data.brandName,
        classType: data.classType,
        beverageType: data.beverageType,
        alcoholContent: data.alcoholContent,
        netContents: data.netContents,
        producerName: data.producerName,
        producerAddress: data.producerAddress,
        productName: data.productName,
        countryOfOrigin: data.countryOfOrigin,
        appellation: data.appellation,
        vintageYear: data.vintageYear,
        ageStatement: data.ageStatement,
        colorDisclosures: data.colorDisclosures,
        commodityStatement: data.commodityStatement,
        sulfiteDeclaration: data.sulfiteDeclaration,
        foreignWinePct: data.foreignWinePct,
        colorAdditives: data.colorAdditives,
        aspartameDeclaration: data.aspartameDeclaration,
    }

    return Object.fromEntries(
        Object.entries(entries)
            .map(([key, value]) => [key, value?.trim() ?? ''])
            .filter(([, value]) => value !== '')
    )
}