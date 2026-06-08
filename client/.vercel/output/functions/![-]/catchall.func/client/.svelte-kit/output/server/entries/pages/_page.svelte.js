import { s as ssr_context, a as attr, b as attr_class, c as clsx$1, e as escape_html, d as attr_style, f as stringify, g as derived, h as ensure_array_like, i as bind_props } from "../../chunks/index.js";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function Button($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      variant = "default",
      size = "default",
      disabled = false,
      title,
      type = "button",
      class: className = "",
      onclick,
      children
    } = $$props;
    const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    const variants = {
      default: "bg-gray-900 text-white hover:bg-gray-700 focus-visible:ring-gray-900",
      outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 focus-visible:ring-gray-500",
      ghost: "hover:bg-gray-100 text-gray-900 focus-visible:ring-gray-500",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
      primary: "bg-blue-900 font-semibold text-white hover:bg-blue-800 focus-visible:ring-blue-900 disabled:opacity-50"
    };
    const sizes = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-8 px-3 text-xs",
      lg: "h-11 px-6 text-base"
    };
    $$renderer2.push(`<button${attr("type", type)}${attr("disabled", disabled, true)}${attr("title", title)}${attr_class(clsx$1(cn(base, variants[variant || "primary"], sizes[size], className)))}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></button>`);
  });
}
function UploadIcon($$renderer, $$props) {
  let { size = 24, className = "" } = $$props;
  $$renderer.push(`<svg${attr("width", size)}${attr("height", size)} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${attr_class(clsx$1(className))} aria-hidden="true"><path d="M12 16V4"></path><path d="M7 9l5-5 5 5"></path><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"></path></svg>`);
}
function FileTextIcon($$renderer, $$props) {
  let { size = 22, className = "" } = $$props;
  $$renderer.push(`<svg${attr("width", size)}${attr("height", size)} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"${attr_class(clsx$1(className))} aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M8 13h8"></path><path d="M8 17h6"></path><path d="M8 9h2"></path></svg>`);
}
function QueueIcon($$renderer, $$props) {
  let { size = 24, className = "" } = $$props;
  $$renderer.push(`<svg${attr("width", size)}${attr("height", size)} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${attr_class(clsx$1(className))} aria-hidden="true"><path d="M8 6h13"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="M3 6h.01"></path><path d="M3 12h.01"></path><path d="M3 18h.01"></path></svg>`);
}
function InfoIcon($$renderer, $$props) {
  let { size = 18, className = "" } = $$props;
  $$renderer.push(`<svg${attr("width", size)}${attr("height", size)} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${attr_class(clsx$1(className))} aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v5"></path><path d="M12 8h.01"></path></svg>`);
}
function ChevronDownIcon($$renderer, $$props) {
  let { size = 18, className = "" } = $$props;
  $$renderer.push(`<svg${attr("width", size)}${attr("height", size)} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${attr_class(clsx$1(className))} aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>`);
}
function Card($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { class: className = "", children } = $$props;
    $$renderer2.push(`<div${attr_class(clsx$1(cn("rounded-lg border border-gray-300 bg-white shadow-sm", className)))}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
  });
}
function CardHeader($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { class: className = "", children } = $$props;
    $$renderer2.push(`<div${attr_class(clsx$1(cn("flex flex-col space-y-1.5 p-4", className)))}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
  });
}
function CardContent($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { class: className = "", children } = $$props;
    $$renderer2.push(`<div${attr_class(clsx$1(cn("p-6 pt-0", className)))}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
  });
}
function CardTitle($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { class: className = "", children } = $$props;
    $$renderer2.push(`<h3${attr_class(clsx$1(cn("text-lg font-semibold leading-none tracking-tight", className)))}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></h3>`);
  });
}
function MediaPanel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      files,
      imagePreviewUrl,
      workstation = false,
      blankState = false,
      hideFileInput = false
    } = $$props;
    let zoomEnabled = true;
    let zoomLevel = 2.5;
    let zoomPercent = derived(() => Math.round(zoomLevel * 100));
    let activeScale = derived(() => 1);
    onDestroy(() => {
    });
    $$renderer2.push(`<div class="min-w-0 h-full">`);
    Card($$renderer2, {
      class: "h-full flex flex-col overflow-hidden border-gray-200 shadow-sm",
      children: ($$renderer3) => {
        CardHeader($$renderer3, {
          class: `${workstation ? "py-2.5" : "py-4"} border-b border-gray-200 bg-white`,
          children: ($$renderer4) => {
            $$renderer4.push(`<div class="flex items-center justify-between gap-3 w-full"><div class="min-w-0">`);
            CardTitle($$renderer4, {
              class: `${workstation ? "text-sm" : "text-base"} font-bold text-gray-950`,
              children: ($$renderer5) => {
                $$renderer5.push(`<!---->${escape_html(blankState ? "Add Label Image" : "Label Image")}`);
              }
            });
            $$renderer4.push(`<!----> <p class="mt-1 truncate text-xs font-medium text-gray-500">${escape_html(files.length > 1 ? `${files.length} labels` : imagePreviewUrl ? "Single label" : "Upload a label image")}</p></div> `);
            if (imagePreviewUrl) {
              $$renderer4.push("<!--[0-->");
              $$renderer4.push(`<button type="button" class="shrink-0 rounded border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Change files</button>`);
            } else if (blankState) {
              $$renderer4.push("<!--[1-->");
              FileTextIcon($$renderer4, { size: 28, className: "shrink-0 text-blue-700" });
            } else {
              $$renderer4.push("<!--[-1-->");
            }
            $$renderer4.push(`<!--]--></div>`);
          }
        });
        $$renderer3.push(`<!----> `);
        CardContent($$renderer3, {
          class: `${workstation ? "p-2" : "p-4"} min-w-0 flex flex-col flex-1 overflow-hidden`,
          children: ($$renderer4) => {
            $$renderer4.push(`<div class="mb-4 flex h-10 shrink-0 flex-wrap items-center justify-between gap-2 rounded border border-gray-200 bg-gray-50 px-3 text-xs text-gray-600"><div class="flex items-center gap-2"><span class="font-bold text-gray-800">Document Viewer</span></div> <div class="flex items-center gap-2">`);
            if (imagePreviewUrl) {
              $$renderer4.push("<!--[0-->");
              $$renderer4.push(`<button type="button"${attr_class(`inline-flex h-7 items-center gap-2 rounded-full border px-2.5 text-xs font-semibold shadow-sm transition-colors ${"border-green-300 bg-green-50 text-green-800"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600`)}${attr("aria-pressed", zoomEnabled)}><span>Inspect</span> <span${attr_class(`relative h-3.5 w-6 rounded-full transition-colors ${"bg-green-600"}`)} aria-hidden="true"><span${attr_class(`absolute left-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-white shadow-sm transition-transform ${"translate-x-2.5"}`)}></span></span></button> <div class="flex h-7 items-center overflow-hidden rounded border border-gray-300 bg-white shadow-sm" aria-label="Inspect zoom controls"><button type="button" class="flex h-full w-7 items-center justify-center text-sm font-bold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600" aria-label="Decrease inspect zoom">-</button> <span class="min-w-12 border-x border-gray-200 px-2 text-center text-xs font-semibold text-gray-700">${escape_html(zoomPercent())}%</span> <button type="button" class="flex h-full w-7 items-center justify-center text-sm font-bold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600" aria-label="Increase inspect zoom">+</button></div>`);
            } else {
              $$renderer4.push("<!--[-1-->");
            }
            $$renderer4.push(`<!--]--></div></div> `);
            if (!hideFileInput) {
              $$renderer4.push("<!--[0-->");
              $$renderer4.push(`<input type="file" accept="image/jpeg,image/png,image/webp" multiple="" class="sr-only" id="file-input-el"/>`);
            } else {
              $$renderer4.push("<!--[-1-->");
            }
            $$renderer4.push(`<!--]--> `);
            if (imagePreviewUrl) {
              $$renderer4.push("<!--[0-->");
              $$renderer4.push(`<div class="flex min-h-0 flex-1 flex-col gap-2"><div${attr_class(`relative min-h-0 flex-1 w-full overflow-hidden rounded border border-gray-300 bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:18px_18px] bg-[position:0_0,0_9px,9px_-9px,-9px_0] shadow-inner ${"cursor-zoom-in"}`)} role="region" aria-label="Label image preview. Inspect on hover can be toggled in the viewer toolbar."><div class="absolute inset-0 flex items-center justify-center overflow-hidden"><img${attr("src", imagePreviewUrl)} alt="Preview"${attr_class(`block max-h-full max-w-full select-none object-contain will-change-transform [--zoom-origin:50%_50%] ${"transition-transform duration-150 ease-out"}`)}${attr_style(`transform: scale(${stringify(activeScale())}); transform-origin: var(--zoom-origin);`)} draggable="false"/></div></div> <div class="flex shrink-0 items-center justify-between px-1">`);
              if (files.length > 1) {
                $$renderer4.push("<!--[0-->");
                $$renderer4.push(`<div class="flex flex-col gap-1"><span class="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"><svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"></path><line x1="12" y1="12" x2="12" y2="17"></line><line x1="9" y1="14.5" x2="15" y2="14.5"></line></svg> Batch Mode ${escape_html(files.length)} labels</span> <button type="button" class="text-left text-xs text-gray-500 hover:text-blue-600 hover:underline px-1">← Use first file only</button></div>`);
              } else {
                $$renderer4.push("<!--[-1-->");
                $$renderer4.push(`<span class="text-xs font-semibold uppercase text-gray-600">Single Label</span>`);
              }
              $$renderer4.push(`<!--]--> <span class="text-xs font-medium text-gray-500">${escape_html(
                "Hover to inspect; adjust zoom above."
              )}</span></div></div>`);
            } else {
              $$renderer4.push("<!--[-1-->");
              $$renderer4.push(`<button type="button" class="flex min-h-[24rem] flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-gray-300 bg-white p-10 text-center transition-all hover:border-blue-500 hover:bg-blue-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" aria-label="Add label images"><div class="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-blue-100">`);
              UploadIcon($$renderer4, { size: 28 });
              $$renderer4.push(`<!----></div> <div><p class="text-sm font-semibold text-gray-700">Add Label Images</p> <span class="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">`);
              UploadIcon($$renderer4, { size: 24 });
              $$renderer4.push(`<!----> Browse Files</span> <p class="mt-2 text-sm text-gray-600">or drag and drop label images anywhere on the screen</p> <p class="mt-2 text-xs text-gray-500 tracking-wider">JPEG, PNG, WebP supported</p></div></button>`);
            }
            $$renderer4.push(`<!--]-->`);
          }
        });
        $$renderer3.push(`<!---->`);
      }
    });
    $$renderer2.push(`<!----></div>`);
  });
}
function buildOptionalApplicationData(data) {
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
    aspartameDeclaration: data.aspartameDeclaration
  };
  return Object.fromEntries(
    Object.entries(entries).map(([key, value]) => [key, value?.trim() ?? ""]).filter(([, value]) => value !== "")
  );
}
const CLASS_TYPE_OPTIONS = {
  distilled_spirits: [
    "Vodka",
    "Gin",
    "Rum",
    "Tequila",
    "Mezcal",
    "Bourbon Whisky",
    "Kentucky Straight Bourbon Whisky",
    "Straight Bourbon Whisky",
    "Tennessee Whisky",
    "Rye Whisky",
    "Straight Rye Whisky",
    "American Whisky",
    "Blended American Whisky",
    "Scotch Whisky",
    "Blended Scotch Whisky",
    "Irish Whisky",
    "Canadian Whisky",
    "Brandy",
    "Cognac",
    "Armagnac",
    "Pisco",
    "Neutral Spirits",
    "Grain Spirits",
    "Malt Spirits"
  ],
  wine: [
    "Table Wine",
    "Red Table Wine",
    "White Table Wine",
    "Rosé Table Wine",
    "Sparkling Wine",
    "Champagne",
    "Prosecco",
    "Cava",
    "Dessert Wine",
    "Late Harvest Wine",
    "Port Wine",
    "Sherry",
    "Vermouth",
    "Fruit Wine",
    "Mead",
    "Hard Cider"
  ],
  beer: [
    "Beer",
    "Ale",
    "Lager",
    "Stout",
    "Porter",
    "India Pale Ale (IPA)",
    "Pale Ale",
    "Wheat Beer",
    "Hefeweizen",
    "Pilsner",
    "Sour Beer",
    "Saison",
    "Malt Beverage",
    "Flavored Malt Beverage",
    "Hard Seltzer"
  ]
};
const BEVERAGE_FIELD_SETS = {
  // 27 CFR Part 5 - Same-field-of-vision requirement: brand_name,
  // class_type, alcohol_content must all be visible simultaneously.
  distilled_spirits: [
    {
      key: "brand_name",
      resultKey: "brandName",
      label: "Brand Name",
      requirement: "required",
      formKey: "brandName"
    },
    {
      key: "class_type",
      resultKey: "classType",
      label: "Class / Type",
      requirement: "required",
      formKey: "classType"
    },
    {
      key: "alcohol_content",
      resultKey: "alcoholContent",
      label: "Alcohol Content",
      requirement: "required",
      hint: "Must be in same field of vision as brand name and class/type",
      formKey: "alcoholContent"
    },
    {
      key: "net_contents",
      resultKey: "netContents",
      label: "Net Contents",
      requirement: "required",
      formKey: "netContents"
    },
    {
      key: "name_address",
      resultKey: "producerName",
      label: "Name and Address",
      requirement: "required",
      hint: "Bottler/importer name + city/state per basic permit",
      formKey: "name_address"
    },
    {
      key: "government_warning",
      resultKey: "governmentWarning",
      label: "Health Warning Statement",
      requirement: "required",
      hint: '"GOVERNMENT WARNING" in bold caps - exact statutory wording per 27 CFR Part 16',
      formKey: "health_warning"
    },
    {
      key: "age_statement",
      resultKey: "ageStatement",
      label: "Age Statement",
      requirement: "conditional",
      hint: "Required for whisky aged <4 years, grape brandy aged <2 years, or when any age claim is made",
      formKey: "ageStatement"
    },
    {
      key: "color_disclosures",
      resultKey: "colorDisclosures",
      label: "Color Ingredient Disclosure",
      requirement: "if_applicable",
      hint: "Required if FD&C Yellow No. 5, cochineal extract, carmine, or artificial coloring is added",
      formKey: "colorDisclosures"
    },
    {
      key: "commodity_statement",
      resultKey: "commodityStatement",
      label: "Commodity Statement",
      requirement: "if_applicable",
      hint: "Required for neutral spirits products: must state % and commodity (e.g. grain)",
      formKey: "commodityStatement"
    },
    {
      key: "country_of_origin",
      resultKey: "countryOfOrigin",
      label: "Country of Origin",
      requirement: "imports_only",
      formKey: "countryOfOrigin"
    }
  ],
  // 27 CFR Part 4 - Brand label items vs. any-label items
  wine: [
    {
      key: "brand_name",
      resultKey: "brandName",
      label: "Brand Name",
      requirement: "required",
      formKey: "brandName"
    },
    {
      key: "class_type",
      resultKey: "classType",
      label: "Class / Type",
      requirement: "required",
      formKey: "classType"
    },
    {
      key: "alcohol_content",
      resultKey: "alcoholContent",
      label: "Alcohol Content",
      requirement: "required",
      hint: "Table wine/light wine designation may substitute for wines 7–14% ABV",
      formKey: "alcoholContent"
    },
    {
      key: "net_contents",
      resultKey: "netContents",
      label: "Net Contents",
      requirement: "required",
      formKey: "netContents"
    },
    {
      key: "name_address",
      resultKey: "producerName",
      label: "Name and Address",
      requirement: "required",
      hint: '"Bottled by" or "Packed by" + name + city/state',
      formKey: "name_address"
    },
    {
      key: "government_warning",
      resultKey: "governmentWarning",
      label: "Health Warning Statement",
      requirement: "required",
      hint: '"GOVERNMENT WARNING" in bold caps - exact statutory wording per 27 CFR Part 16',
      formKey: "health_warning"
    },
    {
      key: "sulfite_declaration",
      resultKey: "sulfiteDeclaration",
      label: "Sulfite Declaration",
      requirement: "conditional",
      hint: 'Required if total SO₂ is ≥10 ppm (e.g. "Contains Sulfites")',
      formKey: "sulfiteDeclaration"
    },
    {
      key: "appellation",
      resultKey: "appellation",
      label: "Appellation of Origin",
      requirement: "conditional",
      hint: "Required when a vintage date, varietal designation, or estate bottled claim is made",
      formKey: "appellation"
    },
    {
      key: "foreign_wine_pct",
      resultKey: "foreignWinePct",
      label: "Percentage of Foreign Wine",
      requirement: "if_applicable",
      hint: "Required if foreign wine is present in a domestic-foreign blend",
      formKey: "foreignWinePct"
    },
    {
      key: "color_disclosures",
      resultKey: "colorDisclosures",
      label: "Color Ingredient Disclosure",
      requirement: "if_applicable",
      hint: "Required if FD&C Yellow No. 5, cochineal extract, or carmine is used",
      formKey: "colorDisclosures"
    },
    {
      key: "country_of_origin",
      resultKey: "countryOfOrigin",
      label: "Country of Origin",
      requirement: "imports_only",
      formKey: "countryOfOrigin"
    }
  ],
  // 27 CFR Part 7 - No same-field-of-vision requirement
  beer: [
    {
      key: "brand_name",
      resultKey: "brandName",
      label: "Brand Name",
      requirement: "required",
      formKey: "brandName"
    },
    {
      key: "class_type",
      resultKey: "classType",
      label: "Class / Type",
      requirement: "required",
      formKey: "classType"
    },
    {
      key: "net_contents",
      resultKey: "netContents",
      label: "Net Contents",
      requirement: "required",
      formKey: "netContents"
    },
    {
      key: "name_address",
      resultKey: "producerName",
      label: "Name and Address",
      requirement: "required",
      hint: "Bottler/importer name + city/state",
      formKey: "name_address"
    },
    {
      key: "government_warning",
      resultKey: "governmentWarning",
      label: "Health Warning Statement",
      requirement: "required",
      hint: '"GOVERNMENT WARNING" in bold caps - exact statutory wording per 27 CFR Part 16',
      formKey: "health_warning"
    },
    {
      key: "alcohol_content",
      resultKey: "alcoholContent",
      label: "Alcohol Content",
      requirement: "conditional",
      hint: "Required only if alcohol derives from added flavors or non-beverage ingredients (other than hops extract)",
      formKey: "alcoholContent"
    },
    {
      key: "color_additives",
      resultKey: "colorAdditives",
      label: "Color Additive Disclosure",
      requirement: "if_applicable",
      hint: "Required for FD&C Yellow No. 5, cochineal extract, or carmine",
      formKey: "colorAdditives"
    },
    {
      key: "sulfite_declaration",
      resultKey: "sulfiteDeclaration",
      label: "Sulfite Declaration",
      requirement: "if_applicable",
      hint: "Required if total SO₂ is ≥10 ppm",
      formKey: "sulfiteDeclaration"
    },
    {
      key: "aspartame_declaration",
      resultKey: "aspartameDeclaration",
      label: "Aspartame Declaration",
      requirement: "if_applicable",
      hint: "Required if aspartame is used as a sweetener",
      formKey: "aspartameDeclaration"
    },
    {
      key: "country_of_origin",
      resultKey: "countryOfOrigin",
      label: "Country of Origin",
      requirement: "imports_only",
      formKey: "countryOfOrigin"
    }
  ]
};
function ApplicationDataInput($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    function emptyApplicationValues() {
      return {
        beverageType: "distilled_spirits",
        brandName: "",
        producerName: "",
        classType: "",
        producerAddress: "",
        countryOfOrigin: "",
        alcoholContent: "",
        netContents: "",
        appellation: "",
        ageStatement: "",
        colorDisclosures: "",
        commodityStatement: "",
        sulfiteDeclaration: "",
        foreignWinePct: "",
        colorAdditives: "",
        aspartameDeclaration: ""
      };
    }
    let { values = emptyApplicationValues(), loading = false } = $$props;
    values.beverageType;
    let classTypeOptions = derived(() => CLASS_TYPE_OPTIONS[values.beverageType] ?? []);
    let fieldSet = derived(() => BEVERAGE_FIELD_SETS[values.beverageType] ?? []);
    const INPUT_FORM_KEYS = [
      "brandName",
      "classType",
      "alcoholContent",
      "netContents",
      "countryOfOrigin",
      "appellation",
      "ageStatement",
      "colorDisclosures",
      "commodityStatement",
      "sulfiteDeclaration",
      "foreignWinePct",
      "colorAdditives",
      "aspartameDeclaration"
    ];
    const isInputFormKey = (key) => {
      return INPUT_FORM_KEYS.includes(key);
    };
    const getVal = (key) => {
      return isInputFormKey(key) ? values[key] : "";
    };
    const PLACEHOLDERS = {
      brandName: "e.g. Old Tom Distillery",
      alcoholContent: "e.g. 45% Alc./Vol.",
      netContents: "e.g. 750 mL",
      countryOfOrigin: "Required for imports",
      appellation: "e.g. Napa Valley",
      ageStatement: "e.g. Aged 4 Years",
      colorDisclosures: "e.g. Artificially Colored",
      commodityStatement: "e.g. 100% Grain Neutral Spirits",
      sulfiteDeclaration: "e.g. Contains Sulfites",
      foreignWinePct: "e.g. 25% foreign wine",
      colorAdditives: "e.g. Colored with FD&C Red 40",
      aspartameDeclaration: "e.g. Contains Aspartame"
    };
    $$renderer2.push(`<div class="flex h-full min-h-0 flex-col rounded-md border border-gray-200 bg-white shadow-sm"><div class="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3"><div><h3 id="application-data-title" class="text-sm font-semibold text-gray-950">Application Data (COLA)</h3> <p class="mt-0.5 text-xs text-gray-500">Enter application details to compare against the label.</p></div> <button type="button" class="shrink-0 rounded text-xs font-medium text-blue-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">${escape_html("Paste raw COLA text to auto-fill")}</button></div> <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"><label class="block"><span class="field-label"><span>Beverage Type</span> <span class="text-red-600" aria-hidden="true">*</span> <span class="sr-only">Required</span></span> `);
    $$renderer2.select({ value: values.beverageType, class: "form-input" }, ($$renderer3) => {
      $$renderer3.option({ value: "distilled_spirits" }, ($$renderer4) => {
        $$renderer4.push(`Distilled Spirits`);
      });
      $$renderer3.option({ value: "wine" }, ($$renderer4) => {
        $$renderer4.push(`Wine`);
      });
      $$renderer3.option({ value: "beer" }, ($$renderer4) => {
        $$renderer4.push(`Beer`);
      });
    });
    $$renderer2.push(`</label> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <div class="grid grid-cols-1 gap-3 md:grid-cols-2"><!--[-->`);
    const each_array = ensure_array_like(fieldSet());
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let field = each_array[$$index_1];
      if (field.formKey === "name_address") {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<label class="block"><span class="field-label"><span>Bottler / Producer Name</span> <span class="text-red-600" aria-hidden="true">*</span> <span class="sr-only">Required</span></span> <input type="text"${attr("value", values.producerName)} placeholder="e.g. Old Tom Distillery LLC" class="form-input"/></label> <label class="block"><span class="field-label"><span>Bottler / Producer Address</span> <span class="text-red-600" aria-hidden="true">*</span> <span class="sr-only">Required</span></span> <input type="text"${attr("value", values.producerAddress)} placeholder="e.g. Louisville, KY 40201" class="form-input"/></label>`);
      } else if (field.formKey === "classType") {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<label class="block"><span class="field-label"><span>${escape_html(field.label)}</span> `);
        if (field.requirement === "required") {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span class="text-red-600" aria-hidden="true">*</span> <span class="sr-only">Required</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></span> `);
        $$renderer2.select({ value: values.classType, class: "form-input" }, ($$renderer3) => {
          $$renderer3.option({ value: "" }, ($$renderer4) => {
            $$renderer4.push(`Select class / type…`);
          });
          $$renderer3.push(`<!--[-->`);
          const each_array_1 = ensure_array_like(classTypeOptions());
          for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
            let opt = each_array_1[$$index];
            $$renderer3.option({ value: opt }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(opt)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        });
        $$renderer2.push(`</label>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<label class="block"><span class="field-label"><span>${escape_html(field.label)}</span> `);
        if (field.requirement === "required") {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<span class="text-red-600" aria-hidden="true">*</span> <span class="sr-only">Required</span>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--></span> <input type="text"${attr("value", getVal(field.formKey))}${attr("placeholder", PLACEHOLDERS[field.formKey] ?? "")} class="form-input"/></label>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></div></div>`);
    bind_props($$props, { values });
  });
}
function Badge($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { variant = "default", class: className = "", children } = $$props;
    const variants = {
      default: "bg-gray-100 text-gray-800",
      pass: "bg-green-600 text-white",
      warning: "bg-amber-500 text-white",
      fail: "bg-red-600 text-white",
      not_found: "bg-gray-500 text-white",
      outline: "border border-gray-300 text-gray-700"
    };
    $$renderer2.push(`<span${attr_class(clsx$1(cn("inline-flex items-center rounded-full px-2.5 py-1 text-sm whitespace-nowrap tracking-wide", variants[variant], className)))}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></span>`);
  });
}
function formatFieldName(name) {
  return name.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}
const STATUS_LABEL = {
  pass: "Pass",
  warning: "Warning",
  fail: "Fail",
  not_found: "Not Found",
  pending: "Pending",
  processing: "Processing",
  complete: "Complete",
  failed: "Failed"
};
const BATCH_STATUS_VARIANT = {
  pending: "not_found",
  processing: "warning",
  complete: "pass",
  failed: "fail"
};
function BatchQueue($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      jobId,
      jobDone,
      labels,
      completedCount,
      files = [],
      selectedFileIndex = null,
      onSelectFile,
      onExportCsv
    } = $$props;
    const urlCache = /* @__PURE__ */ new WeakMap();
    const createdUrls = /* @__PURE__ */ new Set();
    onDestroy(() => createdUrls.forEach((url) => URL.revokeObjectURL(url)));
    const thumbnailUrl = (file) => {
      if (!file) return null;
      const existing = urlCache.get(file);
      if (existing) return existing;
      try {
        const url = URL.createObjectURL(file);
        urlCache.set(file, url);
        createdUrls.add(url);
        return url;
      } catch {
        return null;
      }
    };
    const issueCount = (label) => label.result?.fields.filter((f) => f.status !== "pass").length ?? 0;
    Card($$renderer2, {
      class: "flex h-full flex-col overflow-hidden border-gray-200 shadow-sm",
      children: ($$renderer3) => {
        if (jobId) {
          $$renderer3.push("<!--[0-->");
          CardHeader($$renderer3, {
            class: "border-b bg-white py-2.5",
            children: ($$renderer4) => {
              $$renderer4.push(`<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div class="flex min-w-0 flex-wrap items-center gap-2">`);
              QueueIcon($$renderer4, { size: 20, className: "shrink-0 text-muted-foreground" });
              $$renderer4.push(`<!----> `);
              CardTitle($$renderer4, {
                class: "text-base font-bold text-gray-950",
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->${escape_html(jobDone ? "Batch Queue Complete" : "Batch Queue")}`);
                }
              });
              $$renderer4.push(`<!----> `);
              Badge($$renderer4, {
                variant: "outline",
                class: "px-2 py-0.5 text-xs",
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->${escape_html(labels.length)} item${escape_html(labels.length === 1 ? "" : "s")}`);
                }
              });
              $$renderer4.push(`<!----> <span class="text-xs font-semibold text-gray-600">${escape_html(completedCount)} / ${escape_html(labels.length)}</span></div> <div class="flex flex-wrap items-center gap-2">`);
              if (jobDone) {
                $$renderer4.push("<!--[0-->");
                Button($$renderer4, {
                  variant: "outline",
                  size: "sm",
                  onclick: onExportCsv,
                  children: ($$renderer5) => {
                    $$renderer5.push(`<!---->Export Results (CSV)`);
                  }
                });
              } else {
                $$renderer4.push("<!--[-1-->");
                $$renderer4.push(`<span class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 shadow-sm"><span class="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true"></span> Processing batch</span>`);
              }
              $$renderer4.push(`<!--]--></div></div>`);
            }
          });
          $$renderer3.push(`<!----> `);
          CardContent($$renderer3, {
            class: "bg-white p-2.5",
            children: ($$renderer4) => {
              $$renderer4.push(`<div class="flex min-h-[5.75rem] overflow-hidden rounded-md border border-gray-200 bg-white"><div class="flex w-[12.5rem] shrink-0 flex-col justify-between border-r border-gray-200 bg-gray-50 p-2.5"><div class="min-w-0"><p class="truncate text-xs font-bold text-gray-900">${escape_html(jobDone ? "Batch Complete" : "Batch Processing")}</p> `);
              Badge($$renderer4, {
                variant: "outline",
                class: "mt-2 border-green-200 bg-green-50 px-2 py-1 text-xs font-bold text-green-700",
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->${escape_html(completedCount)} of ${escape_html(labels.length)}`);
                }
              });
              $$renderer4.push(`<!----></div> <div class="mt-3 flex items-center gap-2"><button type="button" class="flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-lg font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-40"${attr("disabled", (selectedFileIndex ?? 0) <= 0, true)} aria-label="Previous label">‹</button> <button type="button" class="flex h-8 w-8 items-center justify-center rounded border border-gray-200 bg-white text-lg font-bold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:opacity-40"${attr("disabled", (selectedFileIndex ?? 0) >= labels.length - 1, true)} aria-label="Next label">›</button></div></div> <div class="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto px-3 py-2.5" role="list" aria-label="Batch label filmstrip"><!--[-->`);
              const each_array = ensure_array_like(labels);
              for (let index = 0, $$length = each_array.length; index < $$length; index++) {
                let label = each_array[index];
                const issues = issueCount(label);
                const selected = selectedFileIndex === index;
                const url = thumbnailUrl(files[index]);
                $$renderer4.push(`<div role="listitem" class="shrink-0"><button type="button"${attr_class(`group w-[4.75rem] rounded-md border bg-white p-1.5 text-left shadow-sm transition ${selected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600`)}${attr("title", `${label.filename} · ${label.result ? `${issues} issue${issues === 1 ? "" : "s"}` : STATUS_LABEL[label.status]}`)}><div class="relative h-14 w-14 overflow-hidden rounded border border-gray-200 bg-white">`);
                if (url) {
                  $$renderer4.push("<!--[0-->");
                  $$renderer4.push(`<img${attr("src", url)} alt="" class="h-full w-full object-cover" draggable="false"/>`);
                } else {
                  $$renderer4.push("<!--[-1-->");
                  $$renderer4.push(`<div class="flex h-full items-center justify-center px-2 text-center text-[11px] font-semibold text-gray-500">${escape_html(label.filename)}</div>`);
                }
                $$renderer4.push(`<!--]--> <span class="absolute bottom-1 right-1 rounded-full shadow">`);
                if (label.status === "complete" && label.result) {
                  $$renderer4.push("<!--[0-->");
                  Badge($$renderer4, {
                    variant: label.result.overallStatus,
                    class: "border-0 px-1.5 py-0.5 text-[10px]",
                    children: ($$renderer5) => {
                      $$renderer5.push(`<!---->${escape_html(label.result.overallStatus === "pass" ? "✓" : label.result.overallStatus === "warning" ? "!" : "×")}`);
                    }
                  });
                } else {
                  $$renderer4.push("<!--[-1-->");
                  Badge($$renderer4, {
                    variant: BATCH_STATUS_VARIANT[label.status],
                    class: "border-0 px-1.5 py-0.5 text-[10px]",
                    children: ($$renderer5) => {
                      $$renderer5.push(`<!---->${escape_html(label.status === "processing" ? "…" : STATUS_LABEL[label.status])}`);
                    }
                  });
                }
                $$renderer4.push(`<!--]--></span></div></button></div>`);
              }
              $$renderer4.push(`<!--]--></div></div>`);
            }
          });
          $$renderer3.push(`<!---->`);
        } else {
          $$renderer3.push("<!--[-1-->");
          CardHeader($$renderer3, {
            class: "bg-white py-3",
            children: ($$renderer4) => {
              $$renderer4.push(`<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div class="min-w-0">`);
              CardTitle($$renderer4, {
                class: "text-base font-bold text-gray-950",
                children: ($$renderer5) => {
                  $$renderer5.push(`<!---->Batch Queue`);
                }
              });
              $$renderer4.push(`<!----> <p class="mt-0.5 text-xs font-medium text-gray-500">Queue multiple labels for batch review and verification.</p></div></div>`);
            }
          });
          $$renderer3.push(`<!----> `);
          CardContent($$renderer3, {
            class: "flex min-h-0 flex-1 bg-white p-3 pt-1",
            children: ($$renderer4) => {
              $$renderer4.push(`<div class="flex min-h-0 flex-1 overflow-hidden px-1 py-2">`);
              if (files.length > 0) {
                $$renderer4.push("<!--[0-->");
                $$renderer4.push(`<div class="flex min-w-0 flex-1 gap-3 overflow-x-auto pb-1" role="list" aria-label="Uploaded labels queued for batch review"><!--[-->`);
                const each_array_1 = ensure_array_like(files);
                for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
                  let file = each_array_1[index];
                  const selected = selectedFileIndex === index;
                  const url = thumbnailUrl(file);
                  $$renderer4.push(`<div role="listitem" class="shrink-0"><button type="button"${attr_class(`group flex min-w-[11rem] max-w-[11rem] flex-col overflow-hidden rounded-md border bg-white text-left shadow-sm transition ${selected ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600`)}${attr("title", file.name)}><div class="h-24 w-full overflow-hidden border-b border-gray-100 bg-gray-50">`);
                  if (url) {
                    $$renderer4.push("<!--[0-->");
                    $$renderer4.push(`<img${attr("src", url)} alt="" class="h-full w-full object-cover" draggable="false"/>`);
                  } else {
                    $$renderer4.push("<!--[-1-->");
                  }
                  $$renderer4.push(`<!--]--></div> <div class="min-w-0 px-2 py-2"><p class="truncate text-xs font-bold text-gray-900">${escape_html(file.name)}</p> <p class="mt-0.5 text-[11px] font-medium text-gray-500">Ready to verify</p></div></button></div>`);
                }
                $$renderer4.push(`<!--]--></div>`);
              } else {
                $$renderer4.push("<!--[-1-->");
                $$renderer4.push(`<div class="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-gray-200 bg-white text-center"><div class="absolute left-4 top-1/2 hidden -translate-y-1/2 gap-2 [mask-image:linear-gradient(to_right,black_0%,black_58%,transparent_100%)] sm:flex" aria-hidden="true"><!--[-->`);
                const each_array_2 = ensure_array_like(Array(5));
                for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
                  each_array_2[$$index_2];
                  $$renderer4.push(`<div class="h-24 w-24 rounded border border-dashed border-gray-200 bg-white shadow-sm"></div>`);
                }
                $$renderer4.push(`<!--]--></div> <div class="absolute right-4 top-1/2 hidden -translate-y-1/2 gap-2 [mask-image:linear-gradient(to_right,transparent_0%,black_42%,black_100%)] lg:flex" aria-hidden="true"><!--[-->`);
                const each_array_3 = ensure_array_like(Array(6));
                for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
                  each_array_3[$$index_3];
                  $$renderer4.push(`<div class="h-24 w-24 rounded border border-dashed border-gray-200 bg-white shadow-sm"></div>`);
                }
                $$renderer4.push(`<!--]--></div> <div class="relative z-10 rounded-md bg-white/90 px-5 py-3 backdrop-blur-sm"><div class="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500">`);
                QueueIcon($$renderer4, { size: 24 });
                $$renderer4.push(`<!----></div> <p class="panel-title">No labels queued yet</p> <p class="mt-1 text-xs font-medium text-gray-600">Uploaded labels will appear here for batch review.</p></div></div>`);
              }
              $$renderer4.push(`<!--]--></div>`);
            }
          });
          $$renderer3.push(`<!---->`);
        }
        $$renderer3.push(`<!--]-->`);
      }
    });
  });
}
function ApplicationDataSummaryDrawer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const DEFAULT_APPLICATION_DATA = {
      beverageType: "distilled_spirits",
      brandName: "",
      producerName: "",
      classType: "",
      producerAddress: "",
      countryOfOrigin: "",
      alcoholContent: "",
      netContents: "",
      appellation: "",
      ageStatement: "",
      colorDisclosures: "",
      commodityStatement: "",
      sulfiteDeclaration: "",
      foreignWinePct: "",
      colorAdditives: "",
      aspartameDeclaration: ""
    };
    let { applicationData = DEFAULT_APPLICATION_DATA } = $$props;
    let expanded = false;
    let summaryValues = derived(() => [
      applicationData.brandName,
      applicationData.classType,
      applicationData.alcoholContent,
      applicationData.netContents
    ].map((value) => value.trim()).filter(Boolean));
    let summary = derived(() => summaryValues().length > 0 ? summaryValues().join(" · ") : "No application data provided");
    $$renderer2.push(`<section class="shrink-0 border-b border-gray-200 bg-white px-3 py-2"><div class="rounded-md border border-gray-200 bg-white px-4 py-3 shadow-sm"><div class="flex flex-col gap-3 lg:flex-row lg:items-start"><div class="min-w-0 flex-1"><h3 class="panel-title">Application data</h3> <p class="mt-1 truncate text-xs font-medium text-gray-700">${escape_html(summary())}</p> <p class="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-500">Reference values used for comparison <span class="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-gray-500" aria-label="Application data comes from the submitted application or source system.">`);
    InfoIcon($$renderer2, { size: 14 });
    $$renderer2.push(`<!----></span></p></div> <button type="button" class="inline-flex h-9 shrink-0 items-center justify-center rounded border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-800 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"${attr("aria-expanded", expanded)}>${escape_html("View details")} `);
    ChevronDownIcon($$renderer2, {
      size: 16,
      className: `ml-2 text-gray-500 transition-transform ${""}`
    });
    $$renderer2.push(`<!----></button></div> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></section>`);
  });
}
function VerificationReview($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const DEFAULT_APPLICATION_DATA = {
      beverageType: "distilled_spirits",
      brandName: "",
      producerName: "",
      classType: "",
      producerAddress: "",
      countryOfOrigin: "",
      alcoholContent: "",
      netContents: "",
      appellation: "",
      ageStatement: "",
      colorDisclosures: "",
      commodityStatement: "",
      sulfiteDeclaration: "",
      foreignWinePct: "",
      colorAdditives: "",
      aspartameDeclaration: ""
    };
    let {
      result,
      loading,
      comparing = false,
      error,
      mode = "body",
      applicationData = DEFAULT_APPLICATION_DATA,
      onExport,
      onMarkAllReviewed
    } = $$props;
    const GOVERNMENT_WARNING_REQUIRED = "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";
    const LOADING_STEPS = [
      "Reading label...",
      "Extracting fields...",
      "Checking rules...",
      "Preparing review table..."
    ];
    const REVIEW_STATE_UI = {
      loading: {
        title: "Reading Label...",
        summary: "Please wait while we ready the label image.",
        className: "border-blue-200 bg-blue-50 text-blue-950",
        badgeLabel: "Processing",
        badgeDetail: "Reading label image",
        badgeClass: "border-blue-200 bg-blue-50 text-blue-800",
        dotClass: "bg-blue-500"
      },
      comparing: {
        title: "Comparing...",
        summary: "Comparing label against application data...",
        className: "border-blue-200 bg-blue-50 text-blue-950",
        badgeLabel: "Comparing",
        badgeDetail: "Checking application values",
        badgeClass: "border-blue-200 bg-blue-50 text-blue-800",
        dotClass: "bg-blue-500"
      },
      error: {
        title: "Error",
        summary: "Could not complete verification.",
        className: "border-red-200 bg-red-50 text-red-950",
        badgeLabel: "Error",
        badgeDetail: "Could not complete",
        badgeClass: "border-red-200 bg-red-50 text-red-800",
        dotClass: "bg-red-500"
      },
      ready: {
        title: "Ready",
        summary: "Upload a label image to extract fields automatically",
        className: "border-gray-200 bg-white text-gray-900",
        badgeLabel: "Not verified",
        badgeDetail: "Awaiting label",
        badgeClass: "border-gray-200 bg-white text-gray-600",
        dotClass: "bg-gray-400"
      },
      extracted: {
        title: "Label Extracted",
        summary: "Fields extracted from label. Add application data below to compare.",
        className: "border-blue-200 bg-blue-50 text-blue-950",
        badgeLabel: "Extracted",
        badgeDetail: "Complete",
        badgeClass: "border-blue-200 bg-blue-50 text-blue-800",
        dotClass: "bg-blue-500"
      },
      approved: {
        title: "Approved",
        summary: "All checked fields passed",
        className: "border-green-200 bg-green-50 text-green-950",
        badgeLabel: "Verified",
        badgeDetail: "Complete",
        badgeClass: "border-green-200 bg-green-50 text-green-800",
        dotClass: "bg-green-500"
      },
      warning: {
        title: "Review Required",
        summary: "Potential issues found",
        className: "border-amber-200 bg-amber-50 text-amber-950",
        badgeLabel: "Review required",
        badgeDetail: "Complete",
        badgeClass: "border-amber-200 bg-amber-50 text-amber-800",
        dotClass: "bg-amber-500"
      },
      rejected: {
        title: "Rejected",
        summary: "Verification failed",
        className: "border-red-200 bg-red-50 text-red-950",
        badgeLabel: "Failed verification",
        badgeDetail: "Complete",
        badgeClass: "border-red-200 bg-red-50 text-red-800",
        dotClass: "bg-red-500"
      }
    };
    const FIELD_TONE_UI = {
      pass: {
        glyph: "✓",
        accentClass: "bg-green-500",
        accentColor: "#22c55e"
      },
      warning: {
        glyph: "!",
        accentClass: "bg-amber-500",
        accentColor: "#f59e0b"
      },
      fail: {
        glyph: "×",
        accentClass: "bg-red-500",
        accentColor: "#ef4444"
      },
      not_found: {
        glyph: "—",
        accentClass: "bg-gray-400",
        accentColor: "#9ca3af"
      },
      neutral: {
        glyph: "—",
        accentClass: "bg-gray-400",
        accentColor: "#9ca3af"
      }
    };
    let expandedFields = {};
    let agentComments = {};
    let decisions = {};
    let markAllMessage = null;
    let columnWidths = [20, 34, 31, 15];
    let fieldDefMap = derived(() => {
      const map = /* @__PURE__ */ new Map();
      for (const f of BEVERAGE_FIELD_SETS?.[applicationData.beverageType] ?? []) {
        map.set(f.resultKey, f);
        if (f.formKey === "name_address") map.set("producerAddress", f);
      }
      return map;
    });
    let validResultKeys = derived(() => {
      const keys = /* @__PURE__ */ new Set();
      for (const f of BEVERAGE_FIELD_SETS?.[applicationData.beverageType] ?? []) {
        keys.add(f.resultKey);
        if (f.formKey === "name_address") keys.add("producerAddress");
      }
      return keys;
    });
    let visibleFields = derived(() => result?.fields.filter((f) => validResultKeys().has(f.fieldName)) ?? []);
    let skeletonRowCount = derived(() => result && (loading || comparing) ? Math.max(0, validResultKeys().size - visibleFields().length) : 0);
    let issueFields = derived(() => visibleFields().filter((f) => f.status !== "pass"));
    let statusCounts = derived(() => ({
      pass: visibleFields().filter((f) => f.status === "pass").length,
      warning: visibleFields().filter((f) => f.status === "warning").length,
      fail: visibleFields().filter((f) => f.status === "fail").length,
      notFound: visibleFields().filter((f) => f.status === "not_found").length
    }));
    let isExtractionOnly = derived(() => result !== null && visibleFields().length > 0 && visibleFields().every((f) => f.expectedValue == null));
    let selectedField = derived(() => {
      if (!result) return null;
      const preferred = null;
      return preferred ?? issueFields()[0] ?? visibleFields()[0] ?? null;
    });
    let governmentWarning = derived(() => result?.fields.find((f) => f.fieldName === "governmentWarning") ?? null);
    const decisionFor = (fieldName) => {
      return decisions[fieldName] ?? "unreviewed";
    };
    const setDecision = (fieldName, decision) => {
      decisions = { ...decisions, [fieldName]: decision };
    };
    const handleMarkAllReviewed = () => {
      const unresolved = issueFields().filter((f) => !decisions[f.fieldName] || decisions[f.fieldName] === "unreviewed");
      if (unresolved.length > 0) {
        markAllMessage = `${unresolved.length} field${unresolved.length === 1 ? "" : "s"} still need a decision`;
        setTimeout(
          () => {
            markAllMessage = null;
          },
          3e3
        );
        return;
      }
      onMarkAllReviewed?.(decisions);
    };
    let reviewStateKey = derived(() => {
      if (loading) return "loading";
      if (comparing && result) return "comparing";
      if (error) return "error";
      if (!result) return "ready";
      if (isExtractionOnly()) return "extracted";
      if (result.overallStatus === "pass") return "approved";
      if (result.overallStatus === "warning") return "warning";
      return "rejected";
    });
    let reviewState = derived(() => REVIEW_STATE_UI[reviewStateKey()]);
    let reviewSummary = derived(() => {
      if (error) return error;
      if (!result || loading || comparing || isExtractionOnly()) return reviewState().summary;
      if (issueFields().length === 0) return REVIEW_STATE_UI.approved.summary;
      return `${issueFields().length} potential ${issueFields().length === 1 ? "issue" : "issues"} found`;
    });
    const fieldToneKey = (field) => {
      if (isExtractionOnly() || isOptionalNotFound(field)) return "neutral";
      return field.status;
    };
    const fieldTone = (field) => FIELD_TONE_UI[fieldToneKey(field)];
    const displayValue = (value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : "Not found";
    };
    const tableSummary = () => {
      if (isExtractionOnly()) return `${visibleFields().length} extracted fields · not compared`;
      const parts = [
        `${statusCounts().warning} warning${statusCounts().warning === 1 ? "" : "s"}`,
        `${statusCounts().fail} failure${statusCounts().fail === 1 ? "" : "s"}`,
        `${statusCounts().pass} pass${statusCounts().pass === 1 ? "" : "es"}`
      ];
      if (statusCounts().notFound > 0) {
        parts.push(`${statusCounts().notFound} not found`);
      }
      return parts.join(" · ");
    };
    const rowStatusLabel = (field) => {
      if (isExtractionOnly()) return "Not compared";
      if (isOptionalNotFound(field)) return "N/A";
      return STATUS_LABEL[field.status];
    };
    const rowStatusVariant = (field) => {
      if (isExtractionOnly() || isOptionalNotFound(field)) return "not_found";
      return field.status;
    };
    const processingTimeText = () => {
      if (!result?.processingTimeMs) return "—";
      return `${(result.processingTimeMs / 1e3).toFixed(1)}s`;
    };
    let verificationBadgeDetail = derived(() => {
      if (!result || loading || comparing || error) return reviewState().badgeDetail;
      const detailParts = [];
      if (processingTimeText() !== "—") detailParts.push(processingTimeText());
      return detailParts.length > 0 ? detailParts.join(" · ") : reviewState().badgeDetail;
    });
    const reviewNote = (field) => {
      if (field.notes) return field.notes;
      if (field.status === "pass") return "Exact match. No action needed.";
      if (field.status === "warning") return "Minor variation detected. Review before approval.";
      if (field.status === "fail") return "Application value does not match the label value.";
      return "Text was not found on the label.";
    };
    const normalizedWarning = (value) => {
      return (value || "").replace(/\s+/g, " ").trim();
    };
    const governmentWarningHeaderLabel = (value) => {
      const normalized = normalizedWarning(value);
      if (!normalized) return "Not found";
      if (normalized.startsWith("GOVERNMENT WARNING:")) return "Exact header";
      if (normalized.toLowerCase().startsWith("government warning:")) return "Header case issue";
      return "Header not found";
    };
    const governmentWarningHeaderClass = (value) => {
      const label = governmentWarningHeaderLabel(value);
      if (label === "Exact header") return "bg-green-100 text-green-800";
      if (label === "Header case issue") return "bg-amber-100 text-amber-800";
      return "bg-red-100 text-red-800";
    };
    const governmentWarningTextLabel = (value) => {
      if (!normalizedWarning(value)) return "Text not found";
      return normalizedWarning(value) === normalizedWarning(GOVERNMENT_WARNING_REQUIRED) ? "Exact wording" : "Wording differs";
    };
    const governmentWarningTextClass = (value) => governmentWarningTextLabel(value) === "Exact wording" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
    const isOptionalNotFound = (field) => {
      const def = fieldDefMap().get(field.fieldName);
      return !!def && (def.requirement === "if_applicable" || def.requirement === "imports_only") && !field.foundValue && (field.status === "not_found" || field.status === "pass");
    };
    const showGovernmentDetails = (field) => {
      return field.fieldName === "governmentWarning" || governmentWarning() !== null && governmentWarning().status !== "pass" && selectedField()?.fieldName === field.fieldName;
    };
    if (mode === "banner") {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<section${attr_class(`rounded-md border px-4 py-3 ${reviewState().className}`, "svelte-1yizjpb")}><div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between svelte-1yizjpb"><div class="min-w-0 svelte-1yizjpb"><div class="flex flex-wrap items-center gap-3 svelte-1yizjpb"><p class="text-sm font-bold uppercase tracking-wide svelte-1yizjpb">${escape_html(reviewState().title)}</p> <span class="text-sm font-semibold text-current/80 svelte-1yizjpb">${escape_html(reviewSummary())}</span></div> <div class="mt-1.5 flex flex-wrap items-center gap-1.5 svelte-1yizjpb">`);
      if (result) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<!--[-->`);
        const each_array = ensure_array_like(issueFields().slice(0, 6));
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let issue = each_array[$$index];
          Badge($$renderer2, {
            variant: issue.status,
            class: "border-0 px-2 py-0.5 text-[11px]",
            children: ($$renderer3) => {
              $$renderer3.push(`<!---->${escape_html(formatFieldName(issue.fieldName))}`);
            }
          });
        }
        $$renderer2.push(`<!--]--> `);
        if (isExtractionOnly()) {
          $$renderer2.push("<!--[0-->");
          Badge($$renderer2, {
            variant: "not_found",
            class: "border-0 px-2 py-0.5 text-[11px]",
            children: ($$renderer3) => {
              $$renderer3.push(`<!---->Not compared`);
            }
          });
        } else if (issueFields().length === 0) {
          $$renderer2.push("<!--[1-->");
          Badge($$renderer2, {
            variant: "pass",
            class: "border-0 px-2 py-0.5 text-[11px]",
            children: ($$renderer3) => {
              $$renderer3.push(`<!---->All required checks passed`);
            }
          });
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]-->`);
      } else if (loading) {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<span class="text-xs font-medium svelte-1yizjpb">Verification is running. This may take a few seconds.</span>`);
      } else if (error) {
        $$renderer2.push("<!--[2-->");
        $$renderer2.push(`<span class="text-xs font-medium svelte-1yizjpb">Retry after checking the API response or network connection.</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`<span class="text-xs font-medium svelte-1yizjpb">Results will appear here after verification.</span>`);
      }
      $$renderer2.push(`<!--]--></div></div> <div class="flex flex-wrap items-center gap-2 lg:justify-end svelte-1yizjpb"><span class="rounded border border-current/15 bg-white/55 px-2.5 py-1 text-xs font-bold svelte-1yizjpb">Time: ${escape_html(processingTimeText())}</span> `);
      if (markAllMessage) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`<span class="text-xs font-semibold text-amber-700 svelte-1yizjpb">${escape_html(markAllMessage)}</span>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (result && !isExtractionOnly()) {
        $$renderer2.push("<!--[0-->");
        Button($$renderer2, {
          size: "sm",
          class: "bg-blue-900 hover:bg-blue-800",
          onclick: handleMarkAllReviewed,
          children: ($$renderer3) => {
            $$renderer3.push(`<!---->Mark as Reviewed`);
          }
        });
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></div></div></section>`);
    } else {
      $$renderer2.push("<!--[-1-->");
      $$renderer2.push(`<section class="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm svelte-1yizjpb"><div class="flex shrink-0 flex-col gap-3 border-b border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between svelte-1yizjpb"><div class="min-w-0 svelte-1yizjpb"><h2 class="panel-title svelte-1yizjpb">Verification Results</h2> <p class="text-[11px] font-medium text-gray-500 svelte-1yizjpb">`);
      if (result) {
        $$renderer2.push("<!--[0-->");
        $$renderer2.push(`${escape_html(tableSummary())}`);
      } else {
        $$renderer2.push("<!--[-1-->");
        $$renderer2.push(`Results appear after verification`);
      }
      $$renderer2.push(`<!--]--></p></div> <div class="flex shrink-0 flex-wrap items-center gap-2 svelte-1yizjpb"><div${attr_class(`inline-flex min-w-[10.5rem] items-center gap-2 rounded-md border px-2.5 py-1.5 shadow-sm ${stringify(reviewState().badgeClass)}`, "svelte-1yizjpb")} role="status" aria-live="polite"><span${attr_class(`h-2.5 w-2.5 shrink-0 rounded-full ${stringify(reviewState().dotClass)}`, "svelte-1yizjpb")}></span> <span class="min-w-0 svelte-1yizjpb"><span class="block text-xs font-bold leading-4 svelte-1yizjpb">${escape_html(reviewState().badgeLabel)}</span> <span class="block text-[11px] font-medium leading-4 svelte-1yizjpb">${escape_html(verificationBadgeDetail())}</span></span></div> `);
      Button($$renderer2, {
        variant: "outline",
        size: "sm",
        class: "h-8",
        disabled: !result,
        onclick: () => result && onExport?.(decisions),
        children: ($$renderer3) => {
          $$renderer3.push(`<!---->Export`);
        }
      });
      $$renderer2.push(`<!----></div></div> `);
      if (result) {
        $$renderer2.push("<!--[0-->");
        ApplicationDataSummaryDrawer($$renderer2, {
          applicationData,
          fields: visibleFields(),
          extractionOnly: isExtractionOnly()
        });
        $$renderer2.push(`<!----> `);
        if (comparing) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="flex shrink-0 items-center gap-2 border-b border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 svelte-1yizjpb"><span class="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500 svelte-1yizjpb"></span> Comparing with application data…</div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (result.fields.length === 0 && !loading && !comparing) {
          $$renderer2.push("<!--[0-->");
          $$renderer2.push(`<div class="flex min-h-0 flex-1 items-center justify-center p-5 text-sm font-medium text-gray-600 svelte-1yizjpb">The verifier returned no field checks. Try another label or review the API response.</div>`);
        } else {
          $$renderer2.push("<!--[-1-->");
          $$renderer2.push(`<div class="min-h-0 flex-1 overflow-auto bg-white svelte-1yizjpb"><table class="h-full w-full min-w-[760px] table-fixed text-left text-sm svelte-1yizjpb"><colgroup class="svelte-1yizjpb"><!--[-->`);
          const each_array_1 = ensure_array_like(columnWidths);
          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
            let width = each_array_1[$$index_1];
            $$renderer2.push(`<col${attr_style(`width: ${width}%`)} class="svelte-1yizjpb"/>`);
          }
          $$renderer2.push(`<!--]--></colgroup><thead class="sticky top-0 z-10 border-b border-gray-300 bg-gray-100 text-[11px] font-bold text-gray-600 shadow-sm svelte-1yizjpb"><tr class="svelte-1yizjpb"><th class="relative px-3 py-2 svelte-1yizjpb">Field <button type="button" aria-label="Resize Field column" class="group absolute bottom-0 right-0 top-0 z-20 flex w-3 cursor-col-resize items-center justify-center border-0 border-r border-gray-300 bg-transparent p-0 hover:border-blue-500 focus:border-blue-600 focus:outline-none svelte-1yizjpb"><span class="flex flex-col gap-[3px] svelte-1yizjpb" aria-hidden="true"><span class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600 svelte-1yizjpb"></span> <span class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600 svelte-1yizjpb"></span> <span class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600 svelte-1yizjpb"></span></span></button></th><th class="relative px-3 py-2 svelte-1yizjpb">Label (extracted) <button type="button" aria-label="Resize Label extracted column" class="group absolute bottom-0 right-0 top-0 z-20 flex w-3 cursor-col-resize items-center justify-center border-0 border-r border-gray-300 bg-transparent p-0 hover:border-blue-500 focus:border-blue-600 focus:outline-none svelte-1yizjpb"><span class="flex flex-col gap-[3px] svelte-1yizjpb" aria-hidden="true"><span class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600 svelte-1yizjpb"></span> <span class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600 svelte-1yizjpb"></span> <span class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600 svelte-1yizjpb"></span></span></button></th><th class="relative px-3 py-2 svelte-1yizjpb"><span class="svelte-1yizjpb">Application (provided)</span> `);
          if (isExtractionOnly()) {
            $$renderer2.push("<!--[0-->");
            $$renderer2.push(`<span class="mt-0.5 block text-[11px] font-medium italic text-gray-400 svelte-1yizjpb">No application data — extraction only</span>`);
          } else {
            $$renderer2.push("<!--[-1-->");
          }
          $$renderer2.push(`<!--]--> <button type="button" aria-label="Resize Application provided column" class="group absolute bottom-0 right-0 top-0 z-20 flex w-3 cursor-col-resize items-center justify-center border-0 border-r border-gray-300 bg-transparent p-0 hover:border-blue-500 focus:border-blue-600 focus:outline-none svelte-1yizjpb"><span class="flex flex-col gap-[3px] svelte-1yizjpb" aria-hidden="true"><span class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600 svelte-1yizjpb"></span> <span class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600 svelte-1yizjpb"></span> <span class="h-0.5 w-0.5 rounded-full bg-gray-400 group-hover:bg-blue-500 group-focus:bg-blue-600 svelte-1yizjpb"></span></span></button></th><th class="px-3 py-2 svelte-1yizjpb">Status</th></tr></thead><tbody class="divide-y divide-gray-100 svelte-1yizjpb"><!--[-->`);
          const each_array_2 = ensure_array_like(visibleFields());
          for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
            let field = each_array_2[$$index_2];
            const selected = selectedField()?.fieldName === field.fieldName;
            const expanded = expandedFields[field.fieldName] === true;
            $$renderer2.push(`<tr${attr_class(
              `hover:cursor-pointer ${selected ? expanded ? "bg-blue-100" : "bg-blue-50" : "bg-white hover:bg-slate-50"} align-middle transition-colors focus-within:bg-blue-50`,
              "svelte-1yizjpb"
            )}${attr_style(`box-shadow: inset 3px 0 0 ${stringify(selected ? fieldTone(field).accentColor : "transparent")};`)}><td class="px-3 py-1.5 align-middle svelte-1yizjpb"><button type="button" class="flex h-full w-full items-center gap-2 text-left focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 svelte-1yizjpb"${attr("title", formatFieldName(field.fieldName))}><span${attr_class(`h-2.5 w-2.5 shrink-0 rounded-sm ${stringify(fieldTone(field).accentClass)}`, "svelte-1yizjpb")} aria-hidden="true"></span> <span class="min-w-0 svelte-1yizjpb"><span class="block truncate text-sm font-semibold text-gray-950 svelte-1yizjpb">${escape_html(formatFieldName(field.fieldName))}</span></span></button></td><td class="px-3 py-1.5 align-middle text-xs leading-5 text-gray-800 svelte-1yizjpb"><span class="line-clamp-2 break-words svelte-1yizjpb">${escape_html(displayValue(field.foundValue))}</span></td><td class="px-3 py-1.5 align-middle text-xs leading-5 svelte-1yizjpb">`);
            if (isExtractionOnly()) {
              $$renderer2.push("<!--[0-->");
              $$renderer2.push(`<span class="sr-only svelte-1yizjpb">No application data provided</span>`);
            } else if (field.expectedValue) {
              $$renderer2.push("<!--[1-->");
              $$renderer2.push(`<span class="line-clamp-2 break-words text-gray-800 svelte-1yizjpb">${escape_html(field.expectedValue)}</span>`);
            } else {
              $$renderer2.push("<!--[-1-->");
              $$renderer2.push(`<span class="italic text-gray-400 svelte-1yizjpb">Not provided</span>`);
            }
            $$renderer2.push(`<!--]--></td><td class="px-3 py-1.5 align-middle svelte-1yizjpb"><div class="flex items-center svelte-1yizjpb">`);
            if (!isExtractionOnly() && isOptionalNotFound(field)) {
              $$renderer2.push("<!--[0-->");
              $$renderer2.push(`<span class="inline-flex h-6 w-20 items-center justify-center rounded-full border border-gray-200 bg-gray-100 px-2 text-[11px] font-medium text-gray-500 svelte-1yizjpb">N/A</span>`);
            } else {
              $$renderer2.push("<!--[-1-->");
              Badge($$renderer2, {
                variant: rowStatusVariant(field),
                class: "h-6 w-24 justify-center gap-1 border-0 px-2 text-[11px]",
                children: ($$renderer3) => {
                  $$renderer3.push(`<span aria-hidden="true" class="svelte-1yizjpb">${escape_html(fieldTone(field).glyph)}</span> ${escape_html(rowStatusLabel(field))}`);
                }
              });
            }
            $$renderer2.push(`<!--]--> `);
            if (decisionFor(field.fieldName) !== "unreviewed") {
              $$renderer2.push("<!--[0-->");
              $$renderer2.push(`<div class="mt-1 svelte-1yizjpb"><span${attr_class(
                `rounded px-1.5 py-0.5 text-[10px] font-semibold ${decisionFor(field.fieldName) === "escalated" ? "bg-red-100 text-red-700" : decisionFor(field.fieldName) === "accepted_variation" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`,
                "svelte-1yizjpb"
              )}>${escape_html(decisionFor(field.fieldName) === "accepted_variation" ? "Accepted" : decisionFor(field.fieldName) === "escalated" ? "Escalated" : "Reviewed")}</span></div>`);
            } else {
              $$renderer2.push("<!--[-1-->");
            }
            $$renderer2.push(`<!--]--></div></td></tr> `);
            if (expanded) {
              $$renderer2.push("<!--[0-->");
              $$renderer2.push(`<tr class="bg-blue-50/60 svelte-1yizjpb"${attr_style(`box-shadow: inset 3px 0 0 ${stringify(fieldTone(field).accentColor)};`)}><td colspan="4" class="border-t px-4 py-3 svelte-1yizjpb"><div class="rounded-md border border-gray-300 bg-white p-3 shadow-sm ring-1 ring-blue-100 svelte-1yizjpb"><div class="mb-3 flex items-center justify-between gap-3 border-b border-gray-100 pb-2 svelte-1yizjpb"><div class="flex items-center gap-2 svelte-1yizjpb"><span${attr_class(`h-2.5 w-2.5 rounded-sm ${stringify(fieldTone(field).accentClass)}`, "svelte-1yizjpb")} aria-hidden="true"></span> <span class="truncate text-xs font-semibold text-gray-700 svelte-1yizjpb">${escape_html(formatFieldName(field.fieldName))}</span></div></div> <div class="svelte-1yizjpb"><span class="detail-label svelte-1yizjpb">Review notes</span> <div class="flex gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-950 items-center svelte-1yizjpb"><span class="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 svelte-1yizjpb" aria-hidden="true"></span> <p class="svelte-1yizjpb">${escape_html(reviewNote(field))}</p></div></div> <div class="mt-3 svelte-1yizjpb"><label class="block min-w-0 svelte-1yizjpb"><span class="detail-label svelte-1yizjpb">Agent comment (optional)</span> <textarea class="min-h-[4.5rem] w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-xs leading-5 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 svelte-1yizjpb" placeholder="Add a comment...">`);
              const $$body = escape_html(`                                                            ${stringify(agentComments[field.fieldName] ?? "")}
                                                        `);
              if ($$body) {
                $$renderer2.push(`${$$body}`);
              }
              $$renderer2.push(`</textarea></label></div> <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 svelte-1yizjpb">`);
              Button($$renderer2, {
                variant: "outline",
                size: "sm",
                class: `h-9 w-full border-gray-300 bg-white text-gray-800 hover:bg-gray-50 ${decisionFor(field.fieldName) === "accepted_variation" ? "ring-2 ring-amber-400" : ""}`,
                onclick: () => setDecision(field.fieldName, "accepted_variation"),
                children: ($$renderer3) => {
                  $$renderer3.push(`<!---->Accept variation`);
                }
              });
              $$renderer2.push(`<!----> `);
              Button($$renderer2, {
                size: "sm",
                variant: "primary",
                onclick: () => setDecision(field.fieldName, "escalated"),
                children: ($$renderer3) => {
                  $$renderer3.push(`<!---->Escalate`);
                }
              });
              $$renderer2.push(`<!----></div></div> `);
              if (showGovernmentDetails(field)) {
                $$renderer2.push("<!--[0-->");
                $$renderer2.push(`<div class="mt-3 rounded-md border border-gray-300 bg-white p-3 shadow-sm svelte-1yizjpb"><div class="mb-3 flex flex-col gap-2 border-b border-gray-100 pb-3 lg:flex-row lg:items-center lg:justify-between svelte-1yizjpb"><div class="min-w-0 svelte-1yizjpb"><h3 class="text-xs font-bold text-gray-950 svelte-1yizjpb">Government warning check</h3> <p class="mt-0.5 text-[11px] font-medium text-gray-600 svelte-1yizjpb">Required header and statutory wording per 27 CFR Part 16.</p></div> <div class="flex shrink-0 flex-wrap gap-1.5 svelte-1yizjpb"><span${attr_class(`rounded px-2 py-1 text-[11px] font-bold ${stringify(governmentWarningHeaderClass(governmentWarning()?.foundValue))}`, "svelte-1yizjpb")}>${escape_html(governmentWarningHeaderLabel(governmentWarning()?.foundValue))}</span> <span${attr_class(`rounded px-2 py-1 text-[11px] font-bold ${stringify(governmentWarningTextClass(governmentWarning()?.foundValue))}`, "svelte-1yizjpb")}>${escape_html(governmentWarningTextLabel(governmentWarning()?.foundValue))}</span></div></div> <div class="grid gap-3 lg:grid-cols-2 svelte-1yizjpb"><div class="min-w-0 rounded border border-gray-200 bg-gray-50 p-3 svelte-1yizjpb"><p class="mb-1.5 text-[10px] font-bold uppercase text-gray-500 svelte-1yizjpb">Detected on label</p> <p class="max-h-28 overflow-auto text-xs leading-5 text-gray-900 svelte-1yizjpb">${escape_html(normalizedWarning(governmentWarning()?.foundValue) || "Not found on label")}</p></div> <div class="min-w-0 rounded border border-gray-200 bg-gray-50 p-3 svelte-1yizjpb"><p class="mb-1.5 text-[10px] font-bold uppercase text-gray-500 svelte-1yizjpb">Required text</p> <p class="max-h-28 overflow-auto text-xs leading-5 text-gray-900 svelte-1yizjpb">GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.</p></div></div></div>`);
              } else {
                $$renderer2.push("<!--[-1-->");
              }
              $$renderer2.push(`<!--]--></td></tr>`);
            } else {
              $$renderer2.push("<!--[-1-->");
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]--><!--[-->`);
          const each_array_3 = ensure_array_like(Array(skeletonRowCount()));
          for (let index = 0, $$length = each_array_3.length; index < $$length; index++) {
            each_array_3[index];
            $$renderer2.push(`<tr class="h-[4.25rem] bg-white svelte-1yizjpb" aria-hidden="true"><td class="px-3 py-2 align-middle svelte-1yizjpb"><div class="flex items-center gap-2 svelte-1yizjpb"><span class="h-2.5 w-2.5 shrink-0 animate-pulse rounded-sm bg-gray-200 svelte-1yizjpb"></span> <span${attr_class(`h-3 animate-pulse rounded bg-gray-200 ${index % 3 === 0 ? "w-24" : "w-32"}`, "svelte-1yizjpb")}></span></div></td><td class="px-3 py-2 align-middle svelte-1yizjpb"><div class="space-y-2 svelte-1yizjpb"><div${attr_class(`h-3 animate-pulse rounded bg-gray-100 ${index % 2 === 0 ? "w-40" : "w-56"}`, "svelte-1yizjpb")}></div> <div class="h-3 w-28 animate-pulse rounded bg-gray-100 svelte-1yizjpb"></div></div></td><td class="px-3 py-2 align-middle svelte-1yizjpb"><div class="space-y-2 svelte-1yizjpb"><div class="h-3 w-44 animate-pulse rounded bg-gray-100 svelte-1yizjpb"></div> <div class="h-3 w-24 animate-pulse rounded bg-gray-100 svelte-1yizjpb"></div></div></td><td class="px-3 py-2 align-middle svelte-1yizjpb"><div class="h-6 w-24 animate-pulse rounded-full bg-gray-100 svelte-1yizjpb"></div></td></tr>`);
          }
          $$renderer2.push(`<!--]--></tbody></table></div>`);
        }
        $$renderer2.push(`<!--]-->`);
      } else if (loading) {
        $$renderer2.push("<!--[1-->");
        $$renderer2.push(`<div class="flex min-h-0 flex-1 flex-col overflow-hidden svelte-1yizjpb"><div class="border-b border-blue-100 bg-blue-50/70 px-4 py-3 svelte-1yizjpb"><div class="flex items-center justify-between gap-4 svelte-1yizjpb"><div class="min-w-0 svelte-1yizjpb"><p class="text-sm font-bold text-blue-950 svelte-1yizjpb">Processing label image</p> <div class="mt-1 flex min-h-5 items-center gap-2 svelte-1yizjpb" role="status" aria-live="polite"><span class="h-2 w-2 shrink-0 animate-pulse rounded-full bg-blue-600 svelte-1yizjpb" aria-hidden="true"></span> <div class="loading-step-rotator relative min-h-5 min-w-[13rem] overflow-hidden text-xs font-semibold text-blue-800 svelte-1yizjpb"><!--[-->`);
        const each_array_4 = ensure_array_like(LOADING_STEPS);
        for (let index = 0, $$length = each_array_4.length; index < $$length; index++) {
          let step = each_array_4[index];
          $$renderer2.push(`<span class="loading-step absolute left-0 top-0 whitespace-nowrap svelte-1yizjpb"${attr_style(`animation-delay: ${index * 1.8}s`)}>${escape_html(step)}</span>`);
        }
        $$renderer2.push(`<!--]--></div></div></div> <span class="inline-flex shrink-0 items-center gap-2 rounded-md border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-800 svelte-1yizjpb"><span class="h-2 w-2 animate-pulse rounded-full bg-blue-600 svelte-1yizjpb" aria-hidden="true"></span> In progress</span></div> <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100 svelte-1yizjpb" aria-hidden="true"><div class="loading-progress h-full w-1/3 rounded-full bg-blue-600 svelte-1yizjpb"></div></div></div> <div class="relative min-h-0 flex-1 overflow-hidden p-4 svelte-1yizjpb"><div class="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-gray-200 svelte-1yizjpb"><div class="grid shrink-0 grid-cols-[1fr_1.4fr_1.4fr_0.8fr] gap-3 border-b border-gray-200 bg-gray-50 px-3 py-2 text-[11px] font-bold uppercase text-gray-500 svelte-1yizjpb"><span class="svelte-1yizjpb">Field</span> <span class="svelte-1yizjpb">Label</span> <span class="svelte-1yizjpb">Application</span> <span class="svelte-1yizjpb">Status</span></div> <div class="min-h-0 flex-1 divide-y divide-gray-100 bg-white svelte-1yizjpb"><!--[-->`);
        const each_array_5 = ensure_array_like(Array(12));
        for (let index = 0, $$length = each_array_5.length; index < $$length; index++) {
          each_array_5[index];
          $$renderer2.push(`<div class="grid grid-cols-[1fr_1.4fr_1.4fr_0.8fr] gap-3 px-3 py-3 svelte-1yizjpb"><div${attr_class(`h-3 animate-pulse rounded bg-gray-200 ${index % 3 === 0 ? "w-24" : "w-32"}`, "svelte-1yizjpb")}></div> <div${attr_class(`h-3 animate-pulse rounded bg-gray-100 ${index % 2 === 0 ? "w-36" : "w-48"}`, "svelte-1yizjpb")}></div> <div class="h-3 w-40 animate-pulse rounded bg-gray-100 svelte-1yizjpb"></div> <div class="h-6 w-20 animate-pulse rounded-full bg-gray-100 svelte-1yizjpb"></div></div>`);
        }
        $$renderer2.push(`<!--]--></div></div> <div class="pointer-events-none absolute inset-x-4 bottom-4 h-28 rounded-b-md bg-gradient-to-t from-white via-white/85 to-transparent svelte-1yizjpb" aria-hidden="true"></div></div></div>`);
      } else if (error) {
        $$renderer2.push("<!--[2-->");
        $$renderer2.push(`<div class="flex min-h-0 flex-1 flex-col justify-center p-5 svelte-1yizjpb"><h2 class="text-sm font-bold text-red-900 svelte-1yizjpb">Verification Error</h2> <p class="mt-1 text-sm text-red-800 svelte-1yizjpb">${escape_html(error)}</p></div> <div class="h-[190px] shrink-0 border-t bg-red-50 px-3 py-2 text-sm font-medium text-red-800 svelte-1yizjpb">Retry after checking the API response or network connection.</div>`);
      } else {
        $$renderer2.push("<!--[-1-->");
      }
      $$renderer2.push(`<!--]--></section>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
const MAX_LONG_EDGE = 1568;
const MAX_BYTES = 1048576;
async function resizeForUpload(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      const longEdge = Math.max(w, h);
      if (longEdge <= MAX_LONG_EDGE && file.size <= MAX_BYTES) {
        resolve(file);
        return;
      }
      const scale = longEdge > MAX_LONG_EDGE ? MAX_LONG_EDGE / longEdge : 1;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.88
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}
const GW_FULL = "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";
const GW_PASS = {
  fieldName: "governmentWarning",
  expectedValue: GW_FULL,
  foundValue: GW_FULL,
  status: "pass",
  notes: "Header and statutory text verified (100% word match)."
};
const DEMO_SCENARIOS = [
  // ── 1. Spirits - All Pass ─────────────────────────────────────────────────
  // Image: clean digital render of Old Tom Distillery bourbon.
  // App data matches the label exactly → all fields pass.
  {
    id: "spirits_pass",
    label: "Spirits - Approved",
    description: "All fields match. Ready to approve.",
    status: "pass",
    imagePath: "/demo/single-1.png",
    appData: {
      beverageType: "distilled_spirits",
      brandName: "Old Tom Distillery",
      classType: "Kentucky Straight Bourbon Whisky",
      alcoholContent: "45% Alc./Vol.",
      netContents: "750 mL",
      producerName: "Old Tom Distillery LLC",
      producerAddress: "Louisville, KY 40201",
      ageStatement: "Aged 4 Years"
    },
    previewResult: {
      overallStatus: "pass",
      processingTimeMs: 1890,
      fields: [
        { fieldName: "brandName", expectedValue: "Old Tom Distillery", foundValue: "Old Tom Distillery", status: "pass", notes: "" },
        { fieldName: "classType", expectedValue: "Kentucky Straight Bourbon Whisky", foundValue: "Kentucky Straight Bourbon Whisky", status: "pass", notes: "" },
        { fieldName: "alcoholContent", expectedValue: "45% Alc./Vol.", foundValue: "45% Alc./Vol. (90 Proof)", status: "pass", notes: "Proof annotation is informational only." },
        { fieldName: "netContents", expectedValue: "750 mL", foundValue: "750 mL", status: "pass", notes: "" },
        { fieldName: "producerName", expectedValue: "Old Tom Distillery LLC", foundValue: "Old Tom Distillery LLC", status: "pass", notes: "" },
        { fieldName: "producerAddress", expectedValue: "Louisville, KY 40201", foundValue: "Louisville, KY 40201", status: "pass", notes: "" },
        { fieldName: "ageStatement", expectedValue: "Aged 4 Years", foundValue: "Aged 4 Years", status: "pass", notes: "" },
        GW_PASS
      ]
    }
  },
  // ── 2. Spirits - Review Required ─────────────────────────────────────────
  // Image: Ridgeline Spirits Co. label.
  // Label shows "Rye Whisky" (omits "Straight") and "Ridgeline Distilling Co. LLC"
  // (abbreviates "Company"). App data uses full COLA designations → 3 warnings.
  {
    id: "spirits_warning",
    label: "Spirits - Review Required",
    description: "3 fields differ from COLA filing.",
    status: "warning",
    imagePath: "/demo/single-2.png",
    appData: {
      beverageType: "distilled_spirits",
      brandName: "Ridgeline Spirits",
      classType: "Straight Rye Whisky",
      alcoholContent: "46% Alc./Vol.",
      netContents: "750 mL",
      producerName: "Ridgeline Distilling Company LLC",
      producerAddress: "Denver, CO 80203"
    },
    previewResult: {
      overallStatus: "warning",
      processingTimeMs: 2340,
      fields: [
        { fieldName: "brandName", expectedValue: "Ridgeline Spirits", foundValue: "Ridgeline Spirits Co.", status: "warning", notes: 'Label appends "Co." - minor variation, review for consistency with COLA.' },
        { fieldName: "classType", expectedValue: "Straight Rye Whisky", foundValue: "Rye Whisky", status: "warning", notes: 'Label omits "Straight" designation - verify whether age requirements are met per 27 CFR 5.143.' },
        { fieldName: "alcoholContent", expectedValue: "46% Alc./Vol.", foundValue: "46% Alc./Vol.", status: "pass", notes: "" },
        { fieldName: "netContents", expectedValue: "750 mL", foundValue: "750 mL", status: "pass", notes: "" },
        { fieldName: "producerName", expectedValue: "Ridgeline Distilling Company LLC", foundValue: "Ridgeline Distilling Co. LLC", status: "warning", notes: '"Company" abbreviated as "Co." - minor variation, agent should confirm acceptability.' },
        { fieldName: "producerAddress", expectedValue: "Denver, CO 80203", foundValue: "Denver, CO 80203", status: "pass", notes: "" },
        GW_PASS
      ]
    }
  },
  // ── 3. Spirits - Rejected ────────────────────────────────────────────────
  // Image: Canyon Creek label. No class/type visible on label; no government warning.
  // App data says "Vodka" and expects a gov warning → two hard fails.
  {
    id: "spirits_fail",
    label: "Spirits - Rejected",
    description: "Missing class/type and government warning.",
    status: "fail",
    imagePath: "/demo/single-3.png",
    appData: {
      beverageType: "distilled_spirits",
      brandName: "Canyon Creek",
      classType: "Vodka",
      alcoholContent: "40% Alc./Vol.",
      netContents: "1 L",
      producerName: "Canyon Creek Spirits Inc.",
      producerAddress: "Phoenix, AZ 85001"
    },
    previewResult: {
      overallStatus: "fail",
      processingTimeMs: 3100,
      fields: [
        { fieldName: "brandName", expectedValue: "Canyon Creek", foundValue: "Canyon Creek Distillery", status: "warning", notes: 'Label includes "Distillery" - not on COLA application, review for consistency.' },
        { fieldName: "classType", expectedValue: "Vodka", foundValue: null, status: "fail", notes: "Class/type designation absent from label. Required per 27 CFR 5.63." },
        { fieldName: "alcoholContent", expectedValue: "40% Alc./Vol.", foundValue: "40% Alc./Vol.", status: "pass", notes: "" },
        { fieldName: "netContents", expectedValue: "1 L", foundValue: "1 L", status: "pass", notes: "" },
        { fieldName: "producerName", expectedValue: "Canyon Creek Spirits Inc.", foundValue: "Canyon Creek Spirits", status: "warning", notes: 'Label omits "Inc." - legal entity suffix may be required per permit.' },
        { fieldName: "producerAddress", expectedValue: "Phoenix, AZ 85001", foundValue: "Phoenix, AZ 85001", status: "pass", notes: "" },
        { fieldName: "governmentWarning", expectedValue: GW_FULL, foundValue: null, status: "fail", notes: "Government warning statement not found on label." }
      ]
    }
  },
  // ── 4. Wine - Review Required ────────────────────────────────────────────
  // Image: Hillside Cellars. Label shows "Red Wine" and "California" as appellation.
  // COLA says "Red Table Wine", "Napa Valley" appellation, and sulfite declaration.
  {
    id: "wine_warning",
    label: "Wine - Review Required",
    description: "Appellation, class, and sulfite issues.",
    status: "warning",
    imagePath: "/demo/single-4.png",
    appData: {
      beverageType: "wine",
      brandName: "Hillside Cellars",
      classType: "Red Table Wine",
      alcoholContent: "13.5% Alc./Vol.",
      netContents: "750 mL",
      producerName: "Hillside Cellars LLC",
      producerAddress: "Napa, CA 94558",
      appellation: "Napa Valley",
      sulfiteDeclaration: "Contains Sulfites"
    },
    previewResult: {
      overallStatus: "fail",
      processingTimeMs: 2710,
      fields: [
        { fieldName: "brandName", expectedValue: "Hillside Cellars", foundValue: "Hillside Cellars", status: "pass", notes: "" },
        { fieldName: "classType", expectedValue: "Red Table Wine", foundValue: "Red Wine", status: "warning", notes: '"Table Wine" omitted - verify whether the full designation is required on this label type.' },
        { fieldName: "alcoholContent", expectedValue: "13.5% Alc./Vol.", foundValue: "13.5% Alc./Vol.", status: "pass", notes: "" },
        { fieldName: "netContents", expectedValue: "750 mL", foundValue: "750 mL", status: "pass", notes: "" },
        { fieldName: "producerName", expectedValue: "Hillside Cellars LLC", foundValue: "Hillside Cellars LLC", status: "pass", notes: "" },
        { fieldName: "producerAddress", expectedValue: "Napa, CA 94558", foundValue: "Napa, CA 94558", status: "pass", notes: "" },
        { fieldName: "appellation", expectedValue: "Napa Valley", foundValue: "California", status: "fail", notes: 'Label shows "California" but COLA specifies "Napa Valley" - upgrade requires ≥85% Napa Valley fruit per 27 CFR 4.25.' },
        { fieldName: "sulfiteDeclaration", expectedValue: "Contains Sulfites", foundValue: null, status: "fail", notes: "Sulfite declaration absent. Required when SO₂ exceeds 10 ppm per 27 CFR 4.32(e)." },
        GW_PASS
      ]
    }
  },
  // ── 5. Beer - Approved ───────────────────────────────────────────────────
  // Image: Ironforge Brewing IPA. All fields present and correctly rendered.
  {
    id: "beer_pass",
    label: "Beer - Approved",
    description: "All fields verified. Ready to approve.",
    status: "pass",
    imagePath: "/demo/single-5.png",
    appData: {
      beverageType: "beer",
      brandName: "Ironforge Brewing",
      classType: "India Pale Ale (IPA)",
      alcoholContent: "6.8% Alc./Vol.",
      netContents: "355 mL",
      producerName: "Ironforge Brewing Company",
      producerAddress: "Portland, OR 97201"
    },
    previewResult: {
      overallStatus: "pass",
      processingTimeMs: 1640,
      fields: [
        { fieldName: "brandName", expectedValue: "Ironforge Brewing", foundValue: "Ironforge Brewing", status: "pass", notes: "" },
        { fieldName: "classType", expectedValue: "India Pale Ale (IPA)", foundValue: "India Pale Ale", status: "pass", notes: '"IPA" abbreviation not shown separately - designation is semantically equivalent.' },
        { fieldName: "netContents", expectedValue: "355 mL", foundValue: "355 mL (12 fl. oz.)", status: "pass", notes: "Dual-measure format is acceptable." },
        { fieldName: "producerName", expectedValue: "Ironforge Brewing Company", foundValue: "Ironforge Brewing Company", status: "pass", notes: "" },
        { fieldName: "producerAddress", expectedValue: "Portland, OR 97201", foundValue: "Portland, OR 97201", status: "pass", notes: "" },
        { fieldName: "alcoholContent", expectedValue: "6.8% Alc./Vol.", foundValue: "6.8% Alc./Vol.", status: "pass", notes: "" },
        GW_PASS
      ]
    }
  }
];
const DEMO_BULK = {
  label: "Batch - Old Tom Distillery (5 Labels)",
  description: "Mixed photo quality: digital render → aged photos."
};
function exportSingleLabelCsv(result, decisions, filename) {
  const header = [
    "filename",
    "field",
    "extractedValue",
    "applicationValue",
    "status",
    "reviewerDecision",
    "notes",
    "evidenceAvailable"
  ];
  const rows = result.fields.map((f) => [
    filename,
    f.fieldName,
    f.foundValue ?? "",
    f.expectedValue ?? "",
    f.status,
    decisions[f.fieldName] ?? "unreviewed",
    f.notes ?? "",
    "no"
  ]);
  const csv = "\uFEFF" + [header, ...rows].map(
    (row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
  ).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `verification-${filename.replace(/\.[^.]+$/, "")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
function exportBatchCsv(labels, jobId) {
  const fieldNames = Array.from(
    new Set(
      labels.flatMap(
        (l) => l.result?.fields.map((f) => f.fieldName) ?? []
      )
    )
  );
  const header = [
    "filename",
    "overallStatus",
    "processingTimeMs",
    ...fieldNames.flatMap((fn) => [
      `${fn}_status`,
      `${fn}_expected`,
      `${fn}_found`,
      `${fn}_notes`
    ])
  ];
  const rows = labels.map((l) => {
    const row = [
      l.filename,
      l.result?.overallStatus ?? l.status,
      String(l.result?.processingTimeMs ?? "")
    ];
    for (const fn of fieldNames) {
      const f = l.result?.fields.find((f2) => f2.fieldName === fn);
      row.push(
        f?.status ?? "",
        f?.expectedValue ?? "",
        f?.foundValue ?? "",
        f?.notes ?? ""
      );
    }
    return row;
  });
  const csv = "\uFEFF" + [header, ...rows].map(
    (row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
  ).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `batch-${jobId ?? "results"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
function DragAndDrop($$renderer, $$props) {
  {
    $$renderer.push("<!--[-1-->");
  }
  $$renderer.push(`<!--]-->`);
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const apiBase = "http://localhost:3000";
    let files = [];
    let selectedFileIndex = null;
    let imagePreviewUrl = null;
    function emptyApplicationData() {
      return {
        brandName: "",
        beverageType: "distilled_spirits",
        classType: "",
        alcoholContent: "",
        netContents: "",
        producerName: "",
        producerAddress: "",
        countryOfOrigin: "",
        appellation: "",
        ageStatement: "",
        colorDisclosures: "",
        commodityStatement: "",
        sulfiteDeclaration: "",
        foreignWinePct: "",
        colorAdditives: "",
        aspartameDeclaration: ""
      };
    }
    let applicationData = emptyApplicationData();
    let loading = false;
    let streaming = false;
    let streamStartMs = null;
    let streamElapsedMs = null;
    let comparing = false;
    let submitting = false;
    let error = null;
    let result = null;
    let jobId = null;
    let labels = [];
    let jobDone = false;
    let es = null;
    let completedCount = derived(() => labels.filter((l) => l.status === "complete" || l.status === "failed").length);
    let batchProgress = derived(() => labels.length > 0 ? completedCount() / labels.length * 100 : 0);
    let headerProcessingTime = derived(() => streamElapsedMs !== null ? `Streamed in ${(streamElapsedMs / 1e3).toFixed(1)}s` : streaming ? "Streaming…" : loading ? "Processing…" : "Ready");
    let reviewActive = derived(() => result !== null || loading || error !== null);
    let showReviewQueue = derived(() => files.length > 1 || labels.length > 1);
    function selectFile(index) {
      if (selectedFileIndex !== index) {
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        selectedFileIndex = index;
        imagePreviewUrl = files[index] ? URL.createObjectURL(files[index]) : imagePreviewUrl;
      }
      const labelResult = labels[index]?.result;
      if (labelResult) {
        result = labelResult;
        error = null;
      } else if (labels[index]) {
        result = null;
        error = null;
      }
    }
    function clearAll() {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      files = [];
      imagePreviewUrl = null;
      selectedFileIndex = null;
      applicationData = emptyApplicationData();
      result = null;
      jobId = null;
      labels = [];
      jobDone = false;
      error = null;
      streaming = false;
      streamStartMs = null;
      streamElapsedMs = null;
      es?.close();
      es = null;
    }
    async function handleSubmit(e) {
      e?.preventDefault();
      await handleSubmitForFiles(files);
    }
    async function handleSubmitForFiles(targetFiles) {
      if (targetFiles.length === 0 || loading || submitting) return;
      if (targetFiles.length === 1) await handleSingleSubmit(targetFiles);
      else await handleBatchSubmit(targetFiles);
    }
    function appendOptionalApplication(fd) {
      const application = buildOptionalApplicationData({ ...applicationData });
      if (Object.keys(application).length > 0) {
        fd.append("application", JSON.stringify(application));
      }
    }
    async function handleSingleSubmit(targetFiles = files) {
      const image = targetFiles[0];
      if (!image) return;
      const syntheticId = `single-${Date.now()}`;
      loading = true;
      streaming = false;
      streamStartMs = null;
      streamElapsedMs = null;
      result = null;
      error = null;
      jobId = syntheticId;
      jobDone = false;
      labels = [
        {
          labelId: syntheticId,
          filename: image.name,
          status: "processing"
        }
      ];
      const formData = new FormData();
      formData.append("image", await resizeForUpload(image));
      appendOptionalApplication(formData);
      let res;
      try {
        res = await fetch(`${apiBase}/api/verify/stream`, { method: "POST", body: formData });
      } catch {
        error = "Network error";
        labels = [{ ...labels[0], status: "failed", error: "Network error" }];
        loading = false;
        jobDone = true;
        return;
      }
      if (!res.ok || !res.body) {
        let errMsg = "Verification failed";
        try {
          errMsg = (await res.json()).error ?? errMsg;
        } catch {
        }
        error = errMsg;
        labels = [{ ...labels[0], status: "failed", error: errMsg }];
        loading = false;
        jobDone = true;
        return;
      }
      result = { overallStatus: "warning", fields: [] };
      streaming = true;
      streamStartMs = Date.now();
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";
      try {
        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });
          const parts = sseBuffer.split("\n\n");
          sseBuffer = parts.pop() ?? "";
          for (const part of parts) {
            if (!part.startsWith("data: ")) continue;
            const payload = part.slice(6).trim();
            if (payload === "[DONE]") break outer;
            let event;
            try {
              event = JSON.parse(payload);
            } catch {
              continue;
            }
            if (event.type === "field") {
              result.fields.push(event);
              result = result;
            } else if (event.type === "done") {
              result.overallStatus = event.overallStatus;
              if (event.processingTimeMs != null) result.processingTimeMs = event.processingTimeMs;
              if (event.imageQuality != null) result.imageQuality = event.imageQuality;
              if (event.imageNotes != null) result.imageNotes = event.imageNotes;
              result = result;
              streamElapsedMs = streamStartMs !== null ? Date.now() - streamStartMs : null;
              labels = [{ ...labels[0], status: "complete", result }];
            } else if (event.type === "error") {
              error = event.error ?? "Verification failed";
              if (result.fields.length > 0) {
                result.overallStatus = "fail";
                result = result;
              } else {
                result = null;
              }
              labels = [
                { ...labels[0], status: "failed", error: error ?? void 0 }
              ];
              break outer;
            }
          }
        }
      } catch {
        if (!result || result.fields.length === 0) {
          error = "Network error during verification";
          result = null;
          labels = [{ ...labels[0], status: "failed", error: "Network error" }];
        }
      } finally {
        loading = false;
        streaming = false;
        streamStartMs = null;
        jobDone = true;
      }
    }
    async function handleBatchSubmit(targetFiles = files) {
      if (targetFiles.length === 0) return;
      submitting = true;
      error = null;
      const fd = new FormData();
      const resized = await Promise.all(targetFiles.map(resizeForUpload));
      resized.forEach((f) => fd.append("images", f));
      appendOptionalApplication(fd);
      try {
        const res = await fetch(`${apiBase}/api/batch/upload`, { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          error = data.error ?? "Upload failed";
          submitting = false;
          return;
        }
        jobId = data.jobId;
        labels = targetFiles.map((f, i) => ({
          labelId: `${jobId}-${i}`,
          filename: f.name,
          status: "pending"
        }));
        openEventSource(jobId);
      } catch {
        error = "Network error";
        submitting = false;
      }
    }
    function openEventSource(jid) {
      es = new EventSource(`${apiBase}/api/batch/${jid}/stream`);
      es.addEventListener("label", (e) => {
        const update = JSON.parse(e.data);
        labels = labels.map((l) => l.labelId === update.labelId ? { ...l, ...update } : l);
      });
      es.addEventListener("done", () => {
        jobDone = true;
        submitting = false;
        es?.close();
        es = null;
      });
      es.addEventListener("error", () => {
        if (es?.readyState === EventSource.CLOSED) {
          error = "Connection lost";
          submitting = false;
          es = null;
        }
      });
    }
    function exportCsv() {
      exportBatchCsv(labels, jobId);
    }
    function handleExport(decisions) {
      if (result && files[selectedFileIndex ?? 0]) {
        exportSingleLabelCsv(result, decisions, files[selectedFileIndex ?? 0].name);
      } else if (result) {
        exportSingleLabelCsv(result, decisions, labels[0]?.filename ?? "label");
      } else {
        exportBatchCsv(labels, jobId);
      }
    }
    function handleMarkAllReviewed(_decisions) {
      labels = labels.map((l, i) => i === (selectedFileIndex ?? 0) ? { ...l, status: "complete" } : l);
    }
    let showDemoPanel = false;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<main class="mx-auto flex h-full min-h-0 max-w-[2200px] flex-col overflow-hidden bg-slate-50 px-4 py-3"><header class="mb-2 flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h1 class="text-lg font-bold text-gray-950">TTB Label Verification</h1> <p class="mt-0.5 text-xs font-medium text-gray-600">Verify alcohol beverage label compliance with TTB requirements.</p></div> <div class="flex flex-wrap items-center gap-2"><a href="/docs" class="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 hover:text-gray-900">Docs</a> `);
      {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> <span class="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm"><span${attr_class(`h-2.5 w-2.5 rounded-full ${loading || submitting ? "bg-blue-500" : error ? "bg-red-500" : "bg-green-500"}`)} aria-hidden="true"></span> ${escape_html(headerProcessingTime())}</span> <div class="relative">`);
      Button($$renderer3, {
        variant: "outline",
        size: "sm",
        class: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
        onclick: () => showDemoPanel = !showDemoPanel,
        children: ($$renderer4) => {
          $$renderer4.push(`<!---->Load Demo`);
        }
      });
      $$renderer3.push(`<!----> `);
      if (showDemoPanel) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="absolute right-0 top-full z-50 mt-1 w-72 rounded-md border border-gray-200 bg-white shadow-lg"><div class="border-b border-gray-100 px-3 py-2"><p class="text-xs font-semibold text-gray-700">Demo Scenarios</p> <div class="mt-1 flex items-center gap-3 text-xs text-gray-500"><span><span class="font-medium text-gray-700">Preview</span> - instant pre-baked result</span> <span>·</span> <span><span class="font-medium text-indigo-700">Run</span> - real Claude API</span></div></div> <ul class="py-1"><!--[-->`);
        const each_array = ensure_array_like(DEMO_SCENARIOS);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let scenario = each_array[$$index];
          $$renderer3.push(`<li class="flex items-center gap-1 px-2 py-1.5"><span${attr_class(`h-2 w-2 shrink-0 rounded-full ${scenario.status === "pass" ? "bg-green-500" : scenario.status === "warning" ? "bg-amber-400" : "bg-red-500"}`)} aria-hidden="true"></span> <span class="min-w-0 flex-1 px-1"><span class="block truncate text-sm font-medium text-gray-900">${escape_html(scenario.label)}</span> <span class="block truncate text-xs text-gray-500">${escape_html(scenario.description)}</span></span> <button type="button" class="shrink-0 rounded border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Preview</button> <button type="button" class="shrink-0 rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">Run</button></li>`);
        }
        $$renderer3.push(`<!--]--> <li class="flex items-center gap-1 border-t border-gray-100 px-2 py-1.5"><span class="h-2 w-2 shrink-0 rounded-full bg-blue-400" aria-hidden="true"></span> <span class="min-w-0 flex-1 px-1"><span class="block truncate text-sm font-medium text-gray-900">${escape_html(DEMO_BULK.label)}</span> <span class="block truncate text-xs text-gray-500">${escape_html(DEMO_BULK.description)}</span></span> <button type="button" class="shrink-0 rounded border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Preview</button> <button type="button" class="shrink-0 rounded border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">Run</button></li></ul></div> <button type="button" class="fixed inset-0 z-40 cursor-default" aria-label="Close demo panel" tabindex="-1"></button>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></div> `);
      if (jobDone || result) {
        $$renderer3.push("<!--[0-->");
        Button($$renderer3, {
          variant: "primary",
          size: "sm",
          onclick: clearAll,
          children: ($$renderer4) => {
            $$renderer4.push(`<!---->New Verification`);
          }
        });
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></div></header> `);
      {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (!reviewActive()) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="mb-3 flex shrink-0 items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900">`);
        UploadIcon($$renderer3, { size: 16, className: "shrink-0 text-blue-700" });
        $$renderer3.push(`<!----> <span>Tip: Drag and drop label images anywhere on this screen to
                upload.</span></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (reviewActive()) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[minmax(22rem,0.58fr)_1fr]"><div class="min-h-0 min-w-0 overflow-hidden">`);
        MediaPanel($$renderer3, {
          files,
          imagePreviewUrl,
          workstation: true,
          hideFileInput: true
        });
        $$renderer3.push(`<!----></div> <div class="min-h-0 min-w-0 overflow-hidden">`);
        VerificationReview($$renderer3, {
          result,
          loading,
          comparing,
          error,
          applicationData,
          mode: "body",
          onExport: handleExport,
          onMarkAllReviewed: handleMarkAllReviewed
        });
        $$renderer3.push(`<!----></div></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
        $$renderer3.push(`<div class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[minmax(22rem,0.42fr)_1fr]"><div class="h-full min-h-0 overflow-hidden pr-1"><div class="flex h-full min-h-0 flex-col gap-3"><div class="min-h-0 flex-1 [&amp;>div]:h-full">`);
        ApplicationDataInput($$renderer3, {
          loading,
          get values() {
            return applicationData;
          },
          set values($$value) {
            applicationData = $$value;
            $$settled = false;
          }
        });
        $$renderer3.push(`<!----></div> <div class="sticky bottom-0 z-20 -mx-1 flex shrink-0 flex-col gap-1.5 bg-slate-50/95 px-1 pb-1 pt-3 backdrop-blur">`);
        Button($$renderer3, {
          disabled: files.length === 0 || loading || submitting,
          onclick: handleSubmit,
          variant: "primary",
          children: ($$renderer4) => {
            if (loading) {
              $$renderer4.push("<!--[0-->");
              $$renderer4.push(`Verifying…`);
            } else {
              $$renderer4.push("<!--[-1-->");
              $$renderer4.push(`<svg class="mr-2 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg> Verify Label`);
            }
            $$renderer4.push(`<!--]-->`);
          }
        });
        $$renderer3.push(`<!----> `);
        if (files.length === 0) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<p class="text-center text-sm text-gray-600">Drag and drop an image anywhere on the screen to
                                enable verification.</p>`);
        } else {
          $$renderer3.push("<!--[-1-->");
        }
        $$renderer3.push(`<!--]--></div></div></div> <div class="grid min-h-0 grid-rows-[minmax(0,2fr)_minmax(0,1fr)] gap-3 overflow-hidden"><section class="flex min-h-0 flex-col rounded-md border border-gray-200 bg-white shadow-sm"><div class="px-4 py-3"><h2 class="panel-title">Label Image Upload</h2> <p class="mt-0.5 text-xs font-medium text-gray-500">Add a single label image to begin verification.</p></div> <div class="flex min-h-0 flex-1 p-4 pt-0"><input type="file" id="file-input-el" accept="image/jpeg,image/png,image/webp" multiple="" class="sr-only"/> `);
        if (files.length > 0) {
          $$renderer3.push("<!--[0-->");
          $$renderer3.push(`<div class="flex min-h-0 w-full flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed border-blue-200 bg-blue-50/20 p-8 text-center"><div class="flex h-16 w-16 items-center justify-center rounded-full border border-green-200 bg-green-50 shadow-sm ring-4 ring-green-50" aria-hidden="true"><svg class="h-7 w-7 text-green-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg></div> <div class="max-w-lg"><p class="text-base font-bold text-gray-900">${escape_html(files.length)} label${escape_html(files.length === 1 ? "" : "s")} ready for verification</p> <div class="mt-3 max-h-28 min-w-[20rem] max-w-xl overflow-y-auto rounded-md border border-gray-200 bg-white text-left shadow-sm"><!--[-->`);
          const each_array_1 = ensure_array_like(files);
          for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
            let file = each_array_1[index];
            $$renderer3.push(`<div class="flex items-center gap-2 border-b border-gray-100 px-3 py-2 last:border-b-0"><span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-50 text-[11px] font-bold text-green-700" aria-hidden="true">${escape_html(index + 1)}</span> <span class="min-w-0 flex-1 truncate text-sm font-medium text-gray-700"${attr("title", file.name)}>${escape_html(file.name)}</span></div>`);
          }
          $$renderer3.push(`<!--]--></div></div> <div class="flex flex-wrap justify-center gap-2">`);
          Button($$renderer3, {
            variant: "outline",
            size: "sm",
            onclick: () => document.getElementById("file-input-el")?.click(),
            children: ($$renderer4) => {
              $$renderer4.push(`<!---->Replace files`);
            }
          });
          $$renderer3.push(`<!----></div></div>`);
        } else {
          $$renderer3.push("<!--[-1-->");
          $$renderer3.push(`<button type="button" class="flex min-h-0 w-full flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-blue-200 bg-white p-8 text-center transition-all hover:border-blue-500 hover:bg-blue-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600" aria-label="Upload label image"><div class="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">`);
          UploadIcon($$renderer3, { size: 28, className: "text-blue-700" });
          $$renderer3.push(`<!----></div> <p class="text-base font-bold text-gray-900">Drag and drop label images here</p> <div class="flex w-full max-w-xs items-center gap-3 text-xs text-gray-400" aria-hidden="true"><span class="h-px flex-1 bg-gray-200"></span> <span>or</span> <span class="h-px flex-1 bg-gray-200"></span></div> <span class="inline-flex h-10 items-center gap-2 rounded-md border border-blue-300 bg-white px-5 text-sm font-bold text-blue-800 shadow-sm hover:bg-blue-50">`);
          UploadIcon($$renderer3, { size: 18 });
          $$renderer3.push(`<!----> Browse Files</span> <p class="text-xs font-medium text-gray-500">JPEG, PNG, WebP supported</p></button>`);
        }
        $$renderer3.push(`<!--]--></div></section> <div class="min-h-0 [&amp;>div]:h-full">`);
        BatchQueue($$renderer3, {
          jobId,
          jobDone,
          labels,
          completedCount: completedCount(),
          batchProgress: batchProgress(),
          files,
          selectedFileIndex,
          onSelectFile: selectFile,
          onExportCsv: exportCsv
        });
        $$renderer3.push(`<!----></div></div></div>`);
      }
      $$renderer3.push(`<!--]--> `);
      if (reviewActive() && showReviewQueue()) {
        $$renderer3.push("<!--[0-->");
        $$renderer3.push(`<div class="mt-3 shrink-0">`);
        BatchQueue($$renderer3, {
          jobId,
          jobDone,
          labels,
          completedCount: completedCount(),
          batchProgress: batchProgress(),
          files,
          selectedFileIndex,
          onSelectFile: selectFile,
          onExportCsv: exportCsv
        });
        $$renderer3.push(`<!----></div>`);
      } else {
        $$renderer3.push("<!--[-1-->");
      }
      $$renderer3.push(`<!--]--></main> `);
      DragAndDrop($$renderer3);
      $$renderer3.push(`<!---->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
export {
  _page as default
};
