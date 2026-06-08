import type { BeverageFieldDef } from '$lib/utils/beverageFields'

export type InputFormKey = Exclude<BeverageFieldDef['formKey'], 'name_address' | 'health_warning'>

export const INPUT_FORM_KEYS = ['brandName', 'classType', 'alcoholContent', 'netContents', 'countryOfOrigin', 'appellation', 'ageStatement', 'colorDisclosures', 'commodityStatement', 'sulfiteDeclaration', 'foreignWinePct', 'colorAdditives', 'aspartameDeclaration'] as const satisfies readonly InputFormKey[]
export const isInputFormKey = (key: BeverageFieldDef['formKey']): key is InputFormKey => INPUT_FORM_KEYS.includes(key as InputFormKey)
export const PLACEHOLDERS: Partial<Record<BeverageFieldDef['formKey'], string>> = {
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
