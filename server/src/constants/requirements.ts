export const TTB_REQUIREMENTS = {
  distilled_spirits: {
    alwaysRequired: [
      "brandName",
      "classType",
      "alcoholContent", // same field of vision rule
      "netContents",
      "producerName",
      "producerAddress",
      "governmentWarning",
    ],
    sameFieldOfVision: [
      "brandName",
      "classType",
      "alcoholContent", // must all be visible simultaneously
    ],
    conditional: [
      { field: "countryOfOrigin", condition: "imported products only" },
      {
        field: "sulfiteDeclaration",
        condition:
          "required if product contains ≥10 ppm sulfur dioxide - must read 'Contains Sulfites' or equivalent - 27 CFR 5.63(c)(7)",
      },
      {
        field: "statementOfAge",
        condition:
          "mandatory for whisky aged <4 years and grape brandy aged <2 years; also required whenever any age representation is made - 27 CFR 5.74",
      },
      {
        field: "stateOfDistillation",
        condition:
          "if the label's stated distillation location differs from the producer address state, or if the label makes a state-specific claim (e.g. 'Distilled in Kentucky') that cannot be verified from the address alone - flag as warning for agent review",
      },
    ],
  },
  wine: {
    alwaysRequired: [
      "brandName",
      "classType",
      "alcoholContent",
      "netContents",
      "producerName",
      "producerAddress",
      "governmentWarning",
    ],
    sameFieldOfVision: [], // no same-field-of-vision requirement for wine
    conditional: [
      { field: "countryOfOrigin", condition: "imported products only" },
      {
        field: "appellation",
        condition: "when varietal or vintage claim is made",
      },
      { field: "vintageYear", condition: "when vintage claim is made" },
      {
        field: "sulfiteDeclaration",
        condition:
          "required if product contains ≥10 ppm sulfur dioxide - must read 'Contains Sulfites' or equivalent - 27 CFR 4.32(e)",
      },
    ],
  },
  beer: {
    alwaysRequired: [
      "brandName",
      "classType",
      "netContents",
      "producerName",
      "producerAddress",
      "governmentWarning",
    ],
    sameFieldOfVision: [], // no same-field-of-vision requirement for beer
    conditional: [
      {
        field: "alcoholContent",
        condition:
          "required only if alcohol is derived from added flavors or non-beverage ingredients (other than hops extract) - 27 CFR 7.63(a)(3)",
      },
      { field: "countryOfOrigin", condition: "imported products only" },
      {
        field: "sulfiteDeclaration",
        condition:
          "required if product contains ≥10 ppm sulfur dioxide - must read 'Contains Sulfites' or equivalent - 27 CFR 7.63(b)",
      },
    ],
  },
} as const;

export const CFR_CITATIONS = {
  brandName: {
    beer: "27 CFR 7.64",
    wine: "27 CFR 4.33",
    spirits: "27 CFR 5.64",
  },
  alcoholContent: {
    beer: "27 CFR 7.63",
    wine: "27 CFR 4.36",
    spirits: "27 CFR 5.65",
  },
  governmentWarning: { all: "27 CFR Part 16" },
  sameFieldOfVision: { spirits: "27 CFR 5.165" },
  // add others as needed
} as const;
