export const TTB_REQUIREMENTS = {
    distilled_spirits: {
        alwaysRequired: [
            'brandName',
            'classType',
            'alcoholContent',  // same field of vision rule
            'netContents',
            'producerName',
            'producerAddress',
            'governmentWarning'
        ],
        sameFieldOfVision: [
            'brandName',
            'classType',
            'alcoholContent'   // must all be visible simultaneously
        ],
        conditional: [
            { field: 'countryOfOrigin', condition: 'imported products only' },
            { field: 'statementOfAge', condition: 'whisky aged under 4 years' },
            { field: 'stateOfDistillation', condition: 'if not distilled in address state' }
        ]
    },
    wine: {
        alwaysRequired: [
            'brandName',
            'classType',
            'alcoholContent',
            'netContents',
            'producerName',
            'producerAddress',
            'governmentWarning'
        ],
        sameFieldOfVision: [],  // no same-field-of-vision requirement for wine
        conditional: [
            { field: 'countryOfOrigin', condition: 'imported products only' },
            { field: 'appellation', condition: 'when varietal or vintage claim is made' },
            { field: 'vintageYear', condition: 'when vintage claim is made' }
        ]
    },
    beer: {
        alwaysRequired: [
            'brandName',
            'classType',
            'netContents',
            'producerName',
            'producerAddress',
            'governmentWarning'
        ],
        sameFieldOfVision: [],  // no same-field-of-vision requirement for beer
        conditional: [
            { field: 'alcoholContent', condition: 'only if alcohol derived from added flavors' },
            { field: 'countryOfOrigin', condition: 'imported products only' }
        ]
    }
} as const;

export const CFR_CITATIONS = {
    brandName: { beer: '27 CFR 7.64', wine: '27 CFR 4.33', spirits: '27 CFR 5.64' },
    alcoholContent: { beer: '27 CFR 7.63', wine: '27 CFR 4.36', spirits: '27 CFR 5.65' },
    governmentWarning: { all: '27 CFR Part 16' },
    sameFieldOfVision: { spirits: '27 CFR 5.165' }
    // add others as needed
} as const;