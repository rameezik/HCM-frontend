"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Form, Panel, Message } from "@/components/WorkspaceUI";
export default function Auth({ setup = false }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    let live = true;
    api("/setup")
      .then((state) => {
        if (!live) return;
        if (state.required !== setup)
          router.replace(state.required ? "/setup" : "/login");
        else setChecking(false);
      })
      .catch((e) => {
        if (live) {
          setError(e.message);
          setChecking(false);
        }
      });
    return () => {
      live = false;
    };
  }, [router, setup]);
  async function submit(body) {
    if (setup) {
      await api("/setup", {
        method: "POST",
        body: {
          name: body.name,
          email: body.email,
          password: body.password,
          company: { name: body.company },
        },
      });
      router.replace("/login");
    } else {
      const user = await api("/auth/login", { method: "POST", body });
      router.replace(`/${user.role}/dashboard`);
    }
  }
  return (
    <main className="neon-background flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-3xl font-bold">
          HCM <span className="gradient-text">Lite</span>
        </p>
        <Panel title={setup ? "Create your workspace" : "Welcome back"}>
          <p className="mb-6 text-sm text-zinc-400">
            {setup
              ? "Start with your company and Admin account. Business records start empty."
              : "Sign in to your workspace."}
          </p>
          <Message error={error} />
          {checking ? (
            <p>Connecting to your workspace…</p>
          ) : (
            <Form
              onSubmit={submit}
              submitLabel={setup ? "Create workspace" : "Sign in"}
              fields={[
                ...(setup
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
                  minLength: setup ? 12 : 1,
                  autoComplete: setup ? "new-password" : "current-password",
                },
              ]}
            />
          )}
        </Panel>
      </div>
    </main>
  );
}
