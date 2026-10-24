"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { Form, Message, Panel } from "@/components/WorkspaceUI";

export default function Page() {
  const [success, setSuccess] = useState("");
  return (
    <main className="neon-background flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-3xl font-bold">
          HCM <span className="gradient-text">Lite</span>
        </p>
        <Panel title="Reset your password">
          <p className="mb-6 text-sm leading-6 text-zinc-400">
            Enter your account email to request a secure password reset link. If
            company email delivery is unavailable, your Admin can reset your
            temporary password.
          </p>
          <Message success={success} />
          <Form
            fields={[
              {
                name: "email",
                label: "Email",
                type: "email",
                autoComplete: "email",
              },
            ]}
            submitLabel="Send reset link"
            successMessage=""
            onSubmit={async (body) => {
              setSuccess("");
              const result = await api("/auth/forgot-password", {
                method: "POST",
                body,
              });
              setSuccess(result.message);
            }}
          />
          <Link
            href="/login"
            className="mt-6 block text-sm text-[#82cde6] underline underline-offset-4"
          >
            Back to sign in
          </Link>
        </Panel>
      </div>
    </main>
  );
}
