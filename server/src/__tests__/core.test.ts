import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { deriveOverallStatus, tryParse } from "../services/labelVerifier";
import { GOVERNMENT_WARNING } from "../constants/warnings";
import type { FieldResult } from "../types/index";

function field(status: FieldResult["status"]): FieldResult {
  return {
    fieldName: "x",
    expectedValue: "x",
    foundValue: "x",
    status,
    notes: "",
  };
}

// Matches the Claude response schema (new format)
const validClaudeResponse = {
  fields: [
    {
      field: "brand_name",
      extracted: "Acme",
      confidence: "high",
      application: "Acme",
      status: "pass",
      notes: "",
    },
  ],
  image_quality: "good",
  image_notes: "",
};

describe("deriveOverallStatus", () => {
  test("all pass → pass", () => {
    assert.equal(deriveOverallStatus([field("pass"), field("pass")]), "pass");
  });

  test("any warning → warning", () => {
    assert.equal(
      deriveOverallStatus([field("pass"), field("warning")]),
      "warning",
    );
  });

  test("any fail → fail", () => {
    assert.equal(deriveOverallStatus([field("pass"), field("fail")]), "fail");
  });

  test("any not_found → fail", () => {
    assert.equal(deriveOverallStatus([field("not_found")]), "fail");
  });

  test("fail beats warning", () => {
    assert.equal(
      deriveOverallStatus([field("warning"), field("fail")]),
      "fail",
    );
  });
});

describe("tryParse", () => {
  test("clean Claude JSON → VerificationResult with mapped field names", () => {
    const result = tryParse(JSON.stringify(validClaudeResponse));
    assert.ok(result);
    assert.equal(result.fields.length, 1);
    assert.equal(result.fields[0].fieldName, "brandName");
    assert.equal(result.fields[0].foundValue, "Acme");
    assert.equal(result.fields[0].status, "pass");
  });

  test("JSON wrapped in prose → extracted", () => {
    const result = tryParse(
      `Here is the analysis:\n${JSON.stringify(validClaudeResponse)}\nHope that helps.`,
    );
    assert.ok(result);
    assert.equal(result.fields.length, 1);
  });

  test("JSON in markdown code fence → extracted", () => {
    const result = tryParse(
      "```json\n" + JSON.stringify(validClaudeResponse) + "\n```",
    );
    assert.ok(result);
  });

  test("invalid JSON → null", () => {
    assert.equal(tryParse("not json at all"), null);
  });

  test("wrong schema shape → null", () => {
    assert.equal(tryParse(JSON.stringify({ wrong: "shape" })), null);
  });

  test("empty fields array violates min(1) → null", () => {
    assert.equal(
      tryParse(JSON.stringify({ ...validClaudeResponse, fields: [] })),
      null,
    );
  });

  test("invalid field status value → null", () => {
    const bad = {
      ...validClaudeResponse,
      fields: [{ ...validClaudeResponse.fields[0], status: "approved" }],
    };
    assert.equal(tryParse(JSON.stringify(bad)), null);
  });

  test("extracted status maps to pass", () => {
    const extracted = {
      ...validClaudeResponse,
      fields: [
        {
          ...validClaudeResponse.fields[0],
          status: "extracted",
          application: null,
        },
      ],
    };
    const result = tryParse(JSON.stringify(extracted));
    assert.ok(result);
    assert.equal(result.fields[0].status, "pass");
    assert.equal(result.fields[0].expectedValue, null);
  });

  test("image_quality propagated to result", () => {
    const result = tryParse(
      JSON.stringify({ ...validClaudeResponse, image_quality: "angled" }),
    );
    assert.ok(result);
    assert.equal(result.imageQuality, "angled");
  });
});

describe("GOVERNMENT_WARNING", () => {
  test('opens with "GOVERNMENT WARNING:" in all caps', () => {
    assert.ok(GOVERNMENT_WARNING.startsWith("GOVERNMENT WARNING:"));
  });

  test("contains both required clauses", () => {
    assert.ok(GOVERNMENT_WARNING.includes("Surgeon General"));
    assert.ok(GOVERNMENT_WARNING.includes("impairs your ability to drive"));
  });
});