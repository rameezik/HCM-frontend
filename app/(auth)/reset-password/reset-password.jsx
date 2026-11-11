"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";
import { Form, Message, Panel } from "@/components/WorkspaceUI";

export default function ResetPassword() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const hasToken = /^[a-f\d]{64}$/i.test(token);
  return (
    <main className="neon-background flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-3xl font-bold">
          HCM <span className="gradient-text">Lite</span>
        </p>
        <Panel title="Choose a new password">
          <p className="mb-6 text-sm leading-6 text-zinc-400">
            Use at least {MIN_PASSWORD_LENGTH} characters. Completing this reset
            ends your previous sessions and signs you in securely.
          </p>
          <Message
            error={
              !hasToken
                ? "This password reset link is missing or invalid. Request a new link."
                : ""
            }
          />
          <Form
            disabled={!hasToken}
            fields={[
              {
                name: "password",
                label: "New password",
                type: "password",
                minLength: MIN_PASSWORD_LENGTH,
                autoComplete: "new-password",
              },
              {
                name: "confirmPassword",
                label: "Confirm password",
                type: "password",
                minLength: MIN_PASSWORD_LENGTH,
                autoComplete: "new-password",
              },
            ]}
            submitLabel="Reset password"
            successMessage=""
            onSubmit={async ({ password, confirmPassword }) => {
              if (password !== confirmPassword)
                throw new Error("Passwords do not match.");
              const user = await api("/auth/reset-password", {
                method: "POST",
                body: { token, password },
              });
              if (!["admin", "hr", "employee"].includes(user?.role))
                throw new Error("Unable to sign in. Please try again.");
              router.replace(`/${user.role}/dashboard`);
            }}
          />
          <Link
            href="/forgot-password"
            className="mt-6 block text-sm text-[#82cde6] underline underline-offset-4"
          >
            Request a new reset link
          </Link>
          <Link
            href="/login"
            className="mt-3 block text-sm text-[#82cde6] underline underline-offset-4"
          >
            Back to sign in
          </Link>
        </Panel>
      </div>
    </main>
  );
}
