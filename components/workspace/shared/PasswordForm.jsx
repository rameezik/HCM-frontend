"use client";

import { api } from "@/lib/api";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";
import { Panel, Form } from "@/components/WorkspaceUI";

export default function PasswordForm({ onChanged, activation = false }) {
  return (
    <Panel title="Change password">
      <p className="mb-5 text-sm text-zinc-400">
        {activation
          ? "Activate your account by replacing the temporary password. "
          : "Choose a new password for your account. "}
        Use at least {MIN_PASSWORD_LENGTH} characters.
      </p>
      <Form
        fields={[
          {
            name: "currentPassword",
            label: "Current password",
            type: "password",
            autoComplete: "current-password",
          },
          {
            name: "password",
            label: "New password",
            type: "password",
            minLength: MIN_PASSWORD_LENGTH,
            autoComplete: "new-password",
          },
        ]}
        onSubmit={async (body) => {
          const user = await api("/auth/password", { method: "POST", body });
          onChanged(user);
        }}
        submitLabel="Change password"
      />
    </Panel>
  );
}
