import { test } from "node:test";
import assert from "node:assert";

const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";

test("VAPT Security Remediation Verification Suite", async (t) => {
  await t.test("GET /api/services should return public DTO and shield admin PII", async () => {
    const res = await fetch(`${BASE_URL}/api/services`);
    assert.strictEqual(res.status, 200, "Should return 200 OK");
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    if (body.data.length > 0) {
      const service = body.data[0];
      assert.strictEqual("assignedAdmin" in service, false);
    }
  });

  await t.test("POST /api/track should reject invalid UUID formats", async () => {
    const res = await fetch(`${BASE_URL}/api/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticket: "TKT-20260401-2376",
        trackingToken: "123e4567-e89b-12d3-a456-426614174000",
      }),
    });
    assert.strictEqual(res.status, 400);
  });

  await t.test("POST /api/uploads should fail without uploadToken", async () => {
    const formData = new FormData();
    const res = await fetch(`${BASE_URL}/api/uploads`, { method: "POST", body: formData });
    assert.ok(res.status === 400 || res.status === 401);
  });
});
