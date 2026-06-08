# Smart Paste Sample Data

Paste any of these blocks into the app (Ctrl+V on the form) to pre-fill fields.
Each sample is designed to exercise every regex pattern in `parseSmartPaste`.

---

## Beer

```
Sierra Nevada Brewing Co.
Pale Ale
Brewed by: Sierra Nevada Brewing Co.
1075 E 20th St, Chico, CA 95928
Product of USA
5.6% alc/vol
355 mL
```

| Field            | Extracted value                       | Pattern used              |
|------------------|---------------------------------------|---------------------------|
| brandName        | Sierra Nevada Brewing Co.             | first non-empty line      |
| classType        | Pale Ale                              | second line (plain desc)  |
| producerName     | Sierra Nevada Brewing Co.             | "Brewed by: ..."          |
| producerAddress  | 1075 E 20th St, Chico, CA 95928       | line after producer line  |
| countryOfOrigin  | USA                                   | "Product of ..."          |
| beverageType     | beer                                  | keyword "Pale Ale"        |
| alcoholContent   | 5.6% alc/vol                          | `\d+\.?\d*\s*%\s*alc`    |
| netContents      | 355 mL                                | `\d+\s*mL`               |

---

## Wine (with vintage year)

```
Chateau Margaux
2019 Bordeaux Red Wine
Produced by: Chateau Margaux
33 Route de Margaux, Margaux, France
Product of France
13.5% alc/vol
750 mL
```

| Field            | Extracted value                       | Pattern used              |
|------------------|---------------------------------------|---------------------------|
| brandName        | Chateau Margaux                       | first non-empty line      |
| classType        | 2019 Bordeaux Red Wine                | second line (plain desc)  |
| producerName     | Chateau Margaux                       | "Produced by: ..."        |
| producerAddress  | 33 Route de Margaux, Margaux, France  | line after producer line  |
| countryOfOrigin  | France                                | "Product of ..."          |
| beverageType     | wine                                  | keyword "Wine"            |
| alcoholContent   | 13.5% alc/vol                         | `\d+\.?\d*\s*%\s*alc`    |
| netContents      | 750 mL                                | `\d+\s*mL`               |
| vintageYear      | 2019                                  | `(19\|20)\d{2}`          |

Note: `vintageYear` is parsed but not a form field — it's available if added later.

---

## Distilled Spirits

```
Jack Daniel's
Tennessee Whiskey
Distilled by: Jack Daniel Distillery
280 Lynchburg Hwy, Lynchburg, TN 37352
Product of USA
40% ABV
750 mL
```

| Field            | Extracted value                       | Pattern used              |
|------------------|---------------------------------------|---------------------------|
| brandName        | Jack Daniel's                         | first non-empty line      |
| classType        | Tennessee Whiskey                     | second line (plain desc)  |
| producerName     | Jack Daniel Distillery                | "Distilled by: ..."       |
| producerAddress  | 280 Lynchburg Hwy, Lynchburg, TN 37352| line after producer line  |
| countryOfOrigin  | USA                                   | "Product of ..."          |
| beverageType     | distilled_spirits                     | keyword "Whiskey"         |
| alcoholContent   | 40% ABV                               | `\d+\.?\d*\s*%\s*abv`    |
| netContents      | 750 mL                                | `\d+\s*mL`               |

---

## Messy / Real-World Samples

### 4 — ALL CAPS COLA database export (common in legacy TTB systems)

```
JOSE CUERVO
TEQUILA
MFD BY: TEQUILA CUERVO LA ROJENA S.A. DE C.V.
AVENIDA VALLARTA 2828, GUADALAJARA, MEXICO
IMPORTED FROM MEXICO
40% ALCOHOL BY VOLUME
750 ML
```

| Field           | Extracted value                          | Notes                            |
|-----------------|------------------------------------------|----------------------------------|
| brandName       | JOSE CUERVO                              | first line                       |
| classType       | TEQUILA                                  | second line                      |
| producerName    | TEQUILA CUERVO LA ROJENA S.A. DE C.V.    | MFD BY: now supported            |
| producerAddress | AVENIDA VALLARTA 2828, GUADALAJARA, MEXICO | line-after-producer heuristic   |
| countryOfOrigin | MEXICO                                   | "IMPORTED FROM ..."              |
| beverageType    | distilled_spirits                        | keyword "TEQUILA"                |
| alcoholContent  | 40% ALCOHOL BY VOLUME                    | "BY VOLUME" now supported        |
| netContents     | 750 ML                                   |                                  |

---

### 5 — Producer email with field labels and informal formatting

```
Brand: Blue Moon Brewing Company
Style: Belgian White Wheat Ale

Bottled For: Blue Moon Brewing Co.
1221 S Biscayne Blvd, Miami, FL 33131

Alcohol: 5.4% ALC. BY VOL.
Size: 12 fl. oz.
Product of United States
```

| Field           | Extracted value               | Notes                                     |
|-----------------|-------------------------------|-------------------------------------------|
| brandName       | Brand: Blue Moon Brewing Company | first line — includes the "Brand:" label; agent should trim |
| classType       | Belgian White Wheat Ale       | "Style: ..." label match                  |
| producerName    | Blue Moon Brewing Co.         | "Bottled For:" now supported              |
| producerAddress | 1221 S Biscayne Blvd, Miami, FL 33131 | city/state/ZIP fallback pattern  |
| countryOfOrigin | United States                 | "Product of ..."                          |
| beverageType    | beer                          | keyword "Wheat"                           |
| alcoholContent  | 5.4% ALC. BY VOL              | period-terminated variant supported       |
| netContents     | 12 fl. oz.                    |                                           |

Note: `brandName` will include "Brand: " prefix when a field-labeled format is used. The agent
should clear and retype it. Stripping "Field: " prefixes is future work.

---

### 6 — Tab-separated spreadsheet row (copied from Excel/Google Sheets)

```
Kendall-Jackson	Vintner's Reserve Chardonnay	Produced by: Jackson Family Wines	5007 Fulton Rd, Fulton, CA 95439	PRODUCT OF U.S.A.	13.5% alc/vol	750mL	2022
```

| Field           | Extracted value              | Notes                                     |
|-----------------|------------------------------|-------------------------------------------|
| brandName       | Kendall-Jackson              | first tab-separated token (first "line")  |
| producerName    | Jackson Family Wines         | tab stops at `[^\t\n]+` — no bleed        |
| producerAddress | 5007 Fulton Rd, Fulton, CA 95439 | city/state/ZIP fallback               |
| countryOfOrigin | U.S.A                        | periods in [A-Za-z.\s]; trailing dot stripped |
| beverageType    | wine                         | keyword "Chardonnay"                      |
| alcoholContent  | 13.5% alc/vol                |                                           |
| netContents     | 750mL                        |                                           |
| vintageYear     | 2022                         | (parsed but not a form field yet)         |

Note: `classType` is blank for tab-separated rows — the "second line" heuristic doesn't apply
when all data is on one line. Agent fills it manually.

---

## Gaps / Known Limitations

- `classType` falls back to the **second line** if no "Class:/Type:/Style:" label is present. This
  means if the second line is an address or producer, classType will be wrong — but that's an
  unusual format.
- `producerAddress` for international addresses (no US ZIP) relies on the line-after-producer
  heuristic, not the city/state/ZIP regex fallback.
- `vintageYear` is extracted but has no corresponding form field — it's dropped silently. If a
  vintage year input is added later, wire it up in `smartPaste()` in `+page.svelte`.
- `countryOfOrigin` regex stops at newline or comma, so "United States of America" will truncate
  at "United States of" unless a comma follows. "USA" / "France" / "Mexico" all work fine.