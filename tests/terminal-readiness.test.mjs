import { test } from "node:test";
import assert from "node:assert/strict";
import { getReadinessIssues } from "../components/attendance/terminal/settings/readinessMessages.js";

test("Admin readiness identifies each missing face dependency without exposing values", () => {
  const codes = [
    "BIOMETRIC_PYTHON_PATH",
    "BIOMETRIC_MODEL_DIR",
    "face_detection_yunet_2023mar.onnx",
    "face_recognition_sface_2021dec.onnx",
    "BIOMETRIC_TEMPLATE_KEY",
    "BIOMETRIC_MATCH_THRESHOLD",
    "BIOMETRIC_RETENTION_DAYS",
    "KIOSK_MATCH_THRESHOLD",
    "KIOSK_MATCH_MARGIN",
    "KIOSK_SCAN_COOLDOWN_SECONDS",
    "BIOMETRIC_RUNTIME",
  ];
  const issues = getReadinessIssues(codes);
  assert.deepEqual(
    issues.map((issue) => issue.code),
    codes,
  );
  for (const issue of issues) {
    assert.ok(issue.title);
    assert.ok(issue.message);
  }
  assert.match(
    issues.find((issue) => issue.code === "BIOMETRIC_TEMPLATE_KEY").message,
    /Preserve the existing key/,
  );
  assert.match(
    issues.find((issue) => issue.code === "BIOMETRIC_RUNTIME").message,
    /runtime logs/,
  );
});

test("unknown configuration values are never copied into the Admin page", () => {
  const issues = getReadinessIssues([
    "/opt/render/private/key=do-not-display",
    "JWT_SECRET=do-not-display",
    { secret: "do-not-display" },
    "__proto__",
  ]);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].code, "BIOMETRIC_CONFIGURATION");
  assert.doesNotMatch(
    JSON.stringify(issues),
    /do-not-display|__proto__|\/opt\/render/,
  );
});

test("missing or duplicate diagnostic codes produce one useful setup item", () => {
  for (const value of [undefined, null, [], "BIOMETRIC_PYTHON_PATH"]) {
    assert.equal(getReadinessIssues(value)[0].code, "BIOMETRIC_CONFIGURATION");
  }
  assert.equal(
    getReadinessIssues(["BIOMETRIC_PYTHON_PATH", "BIOMETRIC_PYTHON_PATH"])
      .length,
    1,
  );
});
