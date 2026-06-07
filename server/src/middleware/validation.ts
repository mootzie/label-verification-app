import { z } from "zod";

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const LabelApplicationSchema = z
  .object({
    brandName: z.string().min(1),
    productName: z.string().optional(),
    classType: z.string().min(1),
    alcoholContent: z.string().min(1),
    netContents: z.string().min(1),
    beverageType: z.enum(["beer", "wine", "distilled_spirits"]),
    producerName: z.string().min(1),
    producerAddress: z.string().min(1),
    countryOfOrigin: z.string().optional(),
    appellation: z.string().optional(),
    vintageYear: z.string().optional(),
    ageStatement: z.string().optional(),
    colorDisclosures: z.string().optional(),
    commodityStatement: z.string().optional(),
    sulfiteDeclaration: z.string().optional(),
    foreignWinePct: z.string().optional(),
    colorAdditives: z.string().optional(),
    aspartameDeclaration: z.string().optional(),
  })
  .partial();
