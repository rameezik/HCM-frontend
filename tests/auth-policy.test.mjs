import { test } from "node:test";
import assert from "node:assert/strict";
import { requiresPasswordChange } from "../lib/authPolicy.js";

// Account-policy DTO fixtures only; these are not application accounts.
test("legacy password recommendations cannot block normal workspace access", () => {
  for (const user of [null, {}, { mustChangePassword: true }, { mustChangePassword: true, passwordChangeEnforced: false }, { mustChangePassword: false, passwordChangeEnforced: true }]) {
    assert.equal(requiresPasswordChange(user), false);
  }
});

test("only an explicit current server policy requires a password change", () => {
  const enforced = { mustChangePassword: true, passwordChangeEnforced: true };
  assert.equal(requiresPasswordChange(enforced), true);
  const refreshed = { mustChangePassword: false, passwordChangeEnforced: false, passwordChangeRecommended: true };
  assert.equal(requiresPasswordChange(refreshed), false);
});
