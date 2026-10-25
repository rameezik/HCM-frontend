"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { requiresPasswordChange } from "@/lib/authPolicy";
import { Button, Form, Panel, Message } from "@/components/WorkspaceUI";

function workspaceFor(user) {
  if (!["admin", "hr", "employee"].includes(user?.role))
    throw new Error(
      "The authentication service returned an invalid account. Please retry or contact your administrator.",
    );
  return `/${user.role}/${requiresPasswordChange(user) ? "password" : "dashboard"}`;
}

export default function Auth({ setup = false, register = false }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(!register);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (register) return undefined;
    let live = true;
    const controller = new AbortController();
    api(setup ? "/setup" : "/auth/me", { signal: controller.signal })
      .then((result) => {
        if (!live) return;
        if (!setup) router.replace(workspaceFor(result));
        else if (!result.required) router.replace("/login");
        else setChecking(false);
      })
      .catch((e) => {
        if (live && !controller.signal.aborted) {
          // An absent or expired session is the expected logged-out state.
          // Transport/server failures remain visible and can be retried.
          if (setup || e.status !== 401) setError(e.message);
          setChecking(false);
        }
      });
    return () => {
      live = false;
      controller.abort();
    };
  }, [router, setup, register, attempt]);
  async function submit(body) {
    setError("");
    if (setup || register) {
      const user = await api(register ? "/auth/register" : "/setup", {
        method: "POST",
        body: {
          name: body.name,
          email: body.email,
          password: body.password,
          company: { name: body.company },
        },
      });
      router.replace(register ? workspaceFor(user) : "/login");
    } else {
      const user = await api("/auth/login", { method: "POST", body });
      router.replace(workspaceFor(user));
    }
  }
  return (
    <main className="neon-background flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-3xl font-bold">
          HCM <span className="gradient-text">Lite</span>
        </p>
        <Panel
          title={
            register
              ? "Register your company"
              : setup
                ? "Create your workspace"
                : "Welcome back"
          }
        >
          <p className="mb-6 text-sm text-zinc-400">
            {setup || register
              ? "Start with your company and Admin account. Business records start empty."
              : "Sign in to your workspace."}
          </p>
          <Message error={error} />
          {error && (
            <Button
              secondary
              onClick={() => {
                setError("");
                setChecking(true);
                setAttempt((value) => value + 1);
              }}
            >
              Retry connection
            </Button>
          )}
          {setup && checking ? (
            <p role="status">Connecting to your workspace…</p>
          ) : (
            <Form
              onSubmit={submit}
              successMessage=""
              submitLabel={
                register
                  ? "Register company"
                  : setup
                    ? "Create workspace"
                    : "Sign in"
              }
              fields={[
                ...(setup || register
                  ? [
                      { name: "company", label: "Company name" },
                      { name: "name", label: "Your full name" },
                    ]
                  : []),
                {
                  name: "email",
                  label: "Email",
                  type: "email",
                  autoComplete: "username",
                },
                {
                  name: "password",
                  label: "Password",
                  type: "password",
                  minLength: setup || register ? 12 : 1,
                  autoComplete:
                    setup || register ? "new-password" : "current-password",
                },
              ]}
            />
          )}
          {!setup && !register && (
            <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
              <Link
                href="/forgot-password"
                className="block text-[#82cde6] underline underline-offset-4"
              >
                Forgot your password?
              </Link>
              <Link
                href="/register"
                className="block text-[#82cde6] underline underline-offset-4"
              >
                Don&apos;t have an account? Register your company
              </Link>
            </div>
          )}
          {(setup || register) && (
            <p className="mt-5 text-sm text-zinc-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#82cde6] underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          )}
        </Panel>
      </div>
    </main>
  );
}
