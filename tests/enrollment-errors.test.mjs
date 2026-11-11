import { test } from "node:test";
import assert from "node:assert/strict";
import { getEnrollmentError } from "../components/attendance/terminal/settings/enrollmentErrors.js";

test("Admin enrollment identifies an unreadable template without displaying secret values", () => {
  const result = getEnrollmentError({
    status: 503,
    code: "BIOMETRIC_TEMPLATE_UNREADABLE",
    message: "secret-value, ciphertext-value, private-path",
  });
  assert.match(result.message, /^503 · /);
  assert.match(result.message, /Restore the original BIOMETRIC_TEMPLATE_KEY/);
  assert.match(
    result.message,
    /Do not generate another key or delete employee records/,
  );
  assert.match(result.message, /BIOMETRIC_TEMPLATE_UNREADABLE/);
  assert.doesNotMatch(
    result.message,
    /secret-value|ciphertext-value|private-path/,
  );
  assert.equal(result.refreshReadiness, false);
});

test("a key version mismatch directs Admin to restore the original matching key and version", () => {
  const result = getEnrollmentError({
    status: 503,
    code: "BIOMETRIC_KEY_VERSION_MISMATCH",
  });
  assert.match(result.message, /BIOMETRIC_TEMPLATE_KEY_ID/);
  assert.match(result.message, /original BIOMETRIC_TEMPLATE_KEY/);
  assert.equal(result.refreshReadiness, false);
});

test("only unavailable configuration triggers a readiness refresh, without retrying enrollment", () => {
  const result = getEnrollmentError({
    status: 503,
    code: "BIOMETRIC_NOT_CONFIGURED",
  });
  assert.match(result.message, /Recheck readiness/);
  assert.equal(result.refreshReadiness, true);
});

test("unknown server errors and diagnostic codes never copy raw server information", () => {
  for (const code of [
    "JWT_SECRET=private-value",
    "__proto__",
    "BIOMETRIC_UNKNOWN",
    undefined,
  ]) {
    const result = getEnrollmentError({
      status: 503,
      code,
      message: "private-value /internal/path raw stderr",
    });
    assert.match(result.message, /^503 · Unable to update face attendance/);
    assert.doesNotMatch(
      result.message,
      /private-value|internal|stderr|__proto__|BIOMETRIC_UNKNOWN/,
    );
    assert.equal(result.refreshReadiness, false);
  }
});

test("business validation and authentication failures retain their existing status messages", () => {
  for (const [status, message] of [
    [401, "401 · Sign in to continue."],
    [422, "422 · Exactly one clearly visible face is required."],
    [429, "429 · Too many requests. Please try again later."],
    [0, "Connection error. Check your internet connection and try again."],
  ]) {
    assert.deepEqual(getEnrollmentError({ status, message }), {
      message,
      refreshReadiness: false,
    });
  }
  assert.match(
    getEnrollmentError(null).message,
    /Unable to update face attendance/,
  );
});
