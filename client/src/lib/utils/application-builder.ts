export function parseSmartPaste(text: string) {
    const alcMatch = text.match(
        /\b(\d+\.?\d*)\s*%\s*(alc|abv|vol)[./\s]*(vol)?/i
    )
    const alcoholContent = alcMatch ? alcMatch[0].trim() : null

    const netMatch = text.match(/\b(\d+\.?\d*)\s*(mL|L\b|oz\.?|fl\.?\s*oz\.?)/i)
    const netContents = netMatch ? netMatch[0].trim() : null

    const yearMatch = text.match(/\b(19|20)\d{2}\b/)
    const vintageYear = yearMatch ? yearMatch[0] : null

    const fallbackBrand =
        !alcMatch && !netMatch && !yearMatch
            ? text.trim().split('\n')[0].slice(0, 100)
            : null

    return { alcoholContent, netContents, vintageYear, fallbackBrand }
}

export function buildApplicationData(data: {
    brandName: string
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
