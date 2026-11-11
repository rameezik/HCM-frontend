import { test } from "node:test";
import assert from "node:assert/strict";
import { requestErrorMessage } from "../lib/errorMessages.js";
import { readApiResponse } from "../lib/api.js";

test("errors retain their actual HTTP status and useful business messages", () => {
  for (const [status, message] of [
    [401, "Invalid email or password."],
    [403, "Only Admin can manage user accounts."],
    [409, "You have already checked in today."],
    [422, "Current password is incorrect."],
    [429, "Too many scans. Wait one minute."],
  ]) {
    assert.equal(
      requestErrorMessage(status, message),
      `${status} · ${message}`,
    );
  }
});

test("connection and server errors never display configuration or developer instructions", () => {
  const internal =
    "Start the backend, set API_INTERNAL_URL=http://private.example.test and run npm run setup:env.";
  for (const status of [500, 502, 503, 504]) {
    const message = requestErrorMessage(status, internal, [
      { field: "JWT_SECRET", reason: "private-value" },
    ]);
    assert.ok(message.startsWith(`${status} · `));
    assert.doesNotMatch(
      message,
      /API_INTERNAL_URL|private|JWT_SECRET|backend|npm/,
    );
  }
  assert.match(requestErrorMessage(0, internal), /^Connection error\./);
});

test("validation errors include readable field labels and the eight-character requirement", () => {
  const message = requestErrorMessage(422, "Check the form fields.", [
    {
      field: "password",
      reason: "Password must contain at least 8 characters.",
    },
    { field: "currentPassword", reason: "Current password is incorrect." },
    { field: "company.name", reason: "Enter your company name." },
    { reason: null },
  ]);
  assert.match(message, /^422 · /);
  assert.match(message, /at least 8 characters/);
  assert.match(message, /Current password:/);
  assert.match(message, /Company name:/);
  assert.doesNotMatch(message, /null|undefined/);
});

test("missing messages use professional defaults without changing status", () => {
  for (const status of [
    400, 401, 403, 404, 408, 409, 413, 422, 429, 500, 502, 503, 504,
  ]) {
    assert.ok(requestErrorMessage(status).startsWith(`${status} · `));
  }
  assert.equal(
    requestErrorMessage(401, "API endpoint returned non-JSON data"),
    "401 · Authentication required. Please sign in again.",
  );
});

test("API errors preserve codes and authentication semantics while formatting their display text", async () => {
  await assert.rejects(
    readApiResponse(
      Response.json(
        {
          message: "Invalid email or password.",
          code: "AUTH_INVALID_CREDENTIALS",
        },
        { status: 401 },
      ),
    ),
    (error) =>
      error.status === 401 &&
      error.code === "AUTH_INVALID_CREDENTIALS" &&
      error.message === "401 · Invalid email or password.",
  );
  await assert.rejects(
    readApiResponse(
      Response.json(
        {
          message: "Configure BIOMETRIC_TEMPLATE_KEY on the backend.",
          code: "BIOMETRIC_NOT_CONFIGURED",
        },
        { status: 503 },
      ),
    ),
    (error) =>
      error.status === 503 &&
      error.code === "BIOMETRIC_NOT_CONFIGURED" &&
      error.message === "503 · Service unavailable. Please try again later.",
  );
});
