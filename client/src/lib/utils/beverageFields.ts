// TTB label field definitions per beverage type.
// Source: 27 CFR Parts 4 (Wine), 5 (Distilled Spirits), 7 (Beer/Malt Beverage) + 27 CFR Part 16

export type BeverageType = 'distilled_spirits' | 'wine' | 'beer'

// ── Requirement status ────────────────────────────────────────────────────────
// 'required'      → always mandatory, no badge
// 'conditional'   → required when certain conditions are met
// 'if_applicable' → only needed when the product uses that ingredient/claim
// 'imports_only'  → required for imported products only
export type FieldRequirement =
    | 'required'
    | 'conditional'
    | 'if_applicable'
    | 'imports_only'

export const REQUIREMENT_BADGE: Record<
    Exclude<FieldRequirement, 'required'>,
    string
> = {
    conditional: 'conditional',
    if_applicable: 'if applicable',
    imports_only: 'imports only',
}

// ── Field definition ─────────────────────────────────────────────────────────
// key:       snake_case - used in the backend field list and FIELD_NAME_MAP
// resultKey: camelCase - the fieldName Claude returns in VerificationResult
// formKey:   identifies which bound state variable(s) this field maps to in the form
//            'name_address' renders producerName + producerAddress as a pair
//            'health_warning' is extracted/verified only - no form input
export interface BeverageFieldDef {
    key: string
    resultKey: string
    label: string
    requirement: FieldRequirement
    hint?: string
    formKey:
    | 'brandName'
    | 'classType'
    | 'alcoholContent'
    | 'netContents'
    | 'name_address'
    | 'health_warning'
    | 'ageStatement'
    | 'colorDisclosures'
    | 'commodityStatement'
    | 'countryOfOrigin'
    | 'appellation'
    | 'sulfiteDeclaration'
    | 'foreignWinePct'
    | 'colorAdditives'
    | 'aspartameDeclaration'
}

// ── Class / Type dropdown options ────────────────────────────────────────────

export const CLASS_TYPE_OPTIONS: Record<BeverageType, string[]> = {
    distilled_spirits: [
        'Vodka',
        'Gin',
        'Rum',
        'Tequila',
        'Mezcal',
        'Bourbon Whisky',
        'Kentucky Straight Bourbon Whisky',
        'Straight Bourbon Whisky',
        'Tennessee Whisky',
        'Rye Whisky',
        'Straight Rye Whisky',
        'American Whisky',
        'Blended American Whisky',
        'Scotch Whisky',
        'Blended Scotch Whisky',
        'Irish Whisky',
        'Canadian Whisky',
        'Brandy',
        'Cognac',
        'Armagnac',
        'Pisco',
        'Neutral Spirits',
        'Grain Spirits',
        'Malt Spirits',
    ],
    wine: [
        'Table Wine',
        'Red Table Wine',
        'White Table Wine',
        'Rosé Table Wine',
        'Sparkling Wine',
        'Champagne',
        'Prosecco',
        'Cava',
        'Dessert Wine',
        'Late Harvest Wine',
        'Port Wine',
        'Sherry',
        'Vermouth',
        'Fruit Wine',
        'Mead',
        'Hard Cider',
    ],
    beer: [
        'Beer',
        'Ale',
        'Lager',
        'Stout',
        'Porter',
        'India Pale Ale (IPA)',
        'Pale Ale',
        'Wheat Beer',
        'Hefeweizen',
        'Pilsner',
        'Sour Beer',
        'Saison',
        'Malt Beverage',
        'Flavored Malt Beverage',
        'Hard Seltzer',
    ],
}

// ── Field sets per beverage type ─────────────────────────────────────────────

export const BEVERAGE_FIELD_SETS: Record<BeverageType, BeverageFieldDef[]> = {
    // 27 CFR Part 5 - Same-field-of-vision requirement: brand_name,
    // class_type, alcohol_content must all be visible simultaneously.
    distilled_spirits: [
        {
            key: 'brand_name',
            resultKey: 'brandName',
            label: 'Brand Name',
            requirement: 'required',
            formKey: 'brandName',
        },
        {
            key: 'class_type',
            resultKey: 'classType',
            label: 'Class / Type',
            requirement: 'required',
            formKey: 'classType',
        },
        {
            key: 'alcohol_content',
            resultKey: 'alcoholContent',
            label: 'Alcohol Content',
            requirement: 'required',
            hint: 'Must be in same field of vision as brand name and class/type',
            formKey: 'alcoholContent',
        },
        {
            key: 'net_contents',
            resultKey: 'netContents',
            label: 'Net Contents',
            requirement: 'required',
            formKey: 'netContents',
        },
        {
            key: 'name_address',
            resultKey: 'producerName',
            label: 'Name and Address',
            requirement: 'required',
            hint: 'Bottler/importer name + city/state per basic permit',
            formKey: 'name_address',
        },
        {
            key: 'government_warning',
            resultKey: 'governmentWarning',
            label: 'Health Warning Statement',
            requirement: 'required',
            hint: '"GOVERNMENT WARNING" in bold caps - exact statutory wording per 27 CFR Part 16',
            formKey: 'health_warning',
        },
        {
            key: 'age_statement',
            resultKey: 'ageStatement',
            label: 'Age Statement',
            requirement: 'conditional',
            hint: 'Required for whisky aged <4 years, grape brandy aged <2 years, or when any age claim is made',
            formKey: 'ageStatement',
        },
        {
            key: 'color_disclosures',
            resultKey: 'colorDisclosures',
            label: 'Color Ingredient Disclosure',
            requirement: 'if_applicable',
            hint: 'Required if FD&C Yellow No. 5, cochineal extract, carmine, or artificial coloring is added',
            formKey: 'colorDisclosures',
        },
        {
            key: 'commodity_statement',
            resultKey: 'commodityStatement',
            label: 'Commodity Statement',
            requirement: 'if_applicable',
            hint: 'Required for neutral spirits products: must state % and commodity (e.g. grain)',
            formKey: 'commodityStatement',
        },
        {
            key: 'country_of_origin',
            resultKey: 'countryOfOrigin',
            label: 'Country of Origin',
            requirement: 'imports_only',
            formKey: 'countryOfOrigin',
        },
    ],

    // 27 CFR Part 4 - Brand label items vs. any-label items
    wine: [
        {
            key: 'brand_name',
            resultKey: 'brandName',
            label: 'Brand Name',
            requirement: 'required',
            formKey: 'brandName',
        },
        {
            key: 'class_type',
            resultKey: 'classType',
            label: 'Class / Type',
            requirement: 'required',
            formKey: 'classType',
        },
        {
            key: 'alcohol_content',
            resultKey: 'alcoholContent',
            label: 'Alcohol Content',
            requirement: 'required',
            hint: 'Table wine/light wine designation may substitute for wines 7–14% ABV',
            formKey: 'alcoholContent',
        },
        {
            key: 'net_contents',
            resultKey: 'netContents',
            label: 'Net Contents',
            requirement: 'required',
            formKey: 'netContents',
        },
        {
            key: 'name_address',
            resultKey: 'producerName',
            label: 'Name and Address',
            requirement: 'required',
            hint: '"Bottled by" or "Packed by" + name + city/state',
            formKey: 'name_address',
        },
        {
            key: 'government_warning',
            resultKey: 'governmentWarning',
            label: 'Health Warning Statement',
            requirement: 'required',
            hint: '"GOVERNMENT WARNING" in bold caps - exact statutory wording per 27 CFR Part 16',
            formKey: 'health_warning',
        },
        {
            key: 'sulfite_declaration',
            resultKey: 'sulfiteDeclaration',
            label: 'Sulfite Declaration',
            requirement: 'conditional',
            hint: 'Required if total SO₂ is ≥10 ppm (e.g. "Contains Sulfites")',
            formKey: 'sulfiteDeclaration',
        },
        {
            key: 'appellation',
            resultKey: 'appellation',
            label: 'Appellation of Origin',
            requirement: 'conditional',
            hint: 'Required when a vintage date, varietal designation, or estate bottled claim is made',
            formKey: 'appellation',
        },
        {
            key: 'foreign_wine_pct',
            resultKey: 'foreignWinePct',
            label: 'Percentage of Foreign Wine',
            requirement: 'if_applicable',
            hint: 'Required if foreign wine is present in a domestic-foreign blend',
            formKey: 'foreignWinePct',
        },
        {
            key: 'color_disclosures',
            resultKey: 'colorDisclosures',
            label: 'Color Ingredient Disclosure',
            requirement: 'if_applicable',
            hint: 'Required if FD&C Yellow No. 5, cochineal extract, or carmine is used',
            formKey: 'colorDisclosures',
        },
        {
            key: 'country_of_origin',
            resultKey: 'countryOfOrigin',
            label: 'Country of Origin',
            requirement: 'imports_only',
            formKey: 'countryOfOrigin',
        },
    ],

    // 27 CFR Part 7 - No same-field-of-vision requirement
    beer: [
        {
            key: 'brand_name',
            resultKey: 'brandName',
            label: 'Brand Name',
            requirement: 'required',
            formKey: 'brandName',
        },
        {
            key: 'class_type',
            resultKey: 'classType',
            label: 'Class / Type',
            requirement: 'required',
            formKey: 'classType',
        },
        {
            key: 'net_contents',
            resultKey: 'netContents',
            label: 'Net Contents',
            requirement: 'required',
            formKey: 'netContents',
        },
        {
            key: 'name_address',
            resultKey: 'producerName',
            label: 'Name and Address',
            requirement: 'required',
            hint: 'Bottler/importer name + city/state',
            formKey: 'name_address',
        },
        {
            key: 'government_warning',
            resultKey: 'governmentWarning',
            label: 'Health Warning Statement',
            requirement: 'required',
            hint: '"GOVERNMENT WARNING" in bold caps - exact statutory wording per 27 CFR Part 16',
            formKey: 'health_warning',
        },
        {
            key: 'alcohol_content',
            resultKey: 'alcoholContent',
            label: 'Alcohol Content',
            requirement: 'conditional',
            hint: 'Required only if alcohol derives from added flavors or non-beverage ingredients (other than hops extract)',
            formKey: 'alcoholContent',
        },
        {
            key: 'color_additives',
            resultKey: 'colorAdditives',
            label: 'Color Additive Disclosure',
            requirement: 'if_applicable',
            hint: 'Required for FD&C Yellow No. 5, cochineal extract, or carmine',
            formKey: 'colorAdditives',
        },
        {
            key: 'sulfite_declaration',
            resultKey: 'sulfiteDeclaration',
            label: 'Sulfite Declaration',
            requirement: 'if_applicable',
            hint: 'Required if total SO₂ is ≥10 ppm',
            formKey: 'sulfiteDeclaration',
        },
        {
            key: 'aspartame_declaration',
            resultKey: 'aspartameDeclaration',
            label: 'Aspartame Declaration',
            requirement: 'if_applicable',
            hint: 'Required if aspartame is used as a sweetener',
            formKey: 'aspartameDeclaration',
        },
        {
            key: 'country_of_origin',
            resultKey: 'countryOfOrigin',
            label: 'Country of Origin',
            requirement: 'imports_only',
            formKey: 'countryOfOrigin',
        },
    ],
}

// All snake_case field keys that map to a government_warning result row
export const GOVERNMENT_WARNING_KEYS = new Set(['government_warning'])
