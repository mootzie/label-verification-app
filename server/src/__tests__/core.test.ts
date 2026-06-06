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

const validResult = {
  overallStatus: "pass" as const,
  fields: [
    {
      fieldName: "brandName",
      expectedValue: "Acme",
      foundValue: "Acme",
      status: "pass" as const,
      notes: "",
    },
  ],
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
  test("clean JSON → VerificationResult", () => {
    const result = tryParse(JSON.stringify(validResult));
    assert.ok(result);
    assert.equal(result.overallStatus, "pass");
    assert.equal(result.fields.length, 1);
  });

  test("JSON wrapped in prose → extracted", () => {
    const result = tryParse(
      `Here is the analysis:\n${JSON.stringify(validResult)}\nHope that helps.`,
    );
    assert.ok(result);
    assert.equal(result.overallStatus, "pass");
  });

  test("JSON in markdown code fence → extracted", () => {
    const result = tryParse(
      "```json\n" + JSON.stringify(validResult) + "\n```",
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
      tryParse(JSON.stringify({ ...validResult, fields: [] })),
      null,
    );
  });

  test("invalid overallStatus value → null", () => {
    assert.equal(
      tryParse(JSON.stringify({ ...validResult, overallStatus: "approved" })),
      null,
    );
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
