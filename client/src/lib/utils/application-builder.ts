export function parseSmartPaste(text: string) {
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
    let beverageType: string | null = null
    if (
        /\b(whiskey|whisky|vodka|rum\b|gin\b|tequila|bourbon|brandy|mezcal|cognac|distilled\s+spirits?)\b/i.test(
            normalized
        )
    ) {
        beverageType = 'distilled_spirits'
    } else if (
        /\b(wine|champagne|chardonnay|cabernet|merlot|pinot|riesling|sauvignon|mead|prosecco|bordeaux|burgundy|chablis|shiraz|viognier)\b/i.test(
            normalized
        )
    ) {
        beverageType = 'wine'
    } else if (
        /\b(beer|ale\b|lager|stout|porter\b|ipa\b|pilsner|saison|bock\b|weizen|hefeweizen|pale\s+ale|wheat\s+beer)\b/i.test(
            normalized
        )
    ) {
        beverageType = 'beer'
    }

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
    }
}

export function buildApplicationData(data: {
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
}) {
    const app: Record<string, string> = {
        brandName: data.brandName.trim(),
        classType: data.classType.trim(),
        beverageType: data.beverageType,
        alcoholContent: data.alcoholContent.trim(),
        netContents: data.netContents.trim(),
        producerName: data.producerName.trim(),
        producerAddress: data.producerAddress.trim(),
    }
    if (data.productName?.trim()) app.productName = data.productName.trim()
    if (data.countryOfOrigin?.trim())
        app.countryOfOrigin = data.countryOfOrigin.trim()
    if (data.appellation?.trim()) app.appellation = data.appellation.trim()
    if (data.vintageYear?.trim()) app.vintageYear = data.vintageYear.trim()
    return app
}
