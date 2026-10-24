import { Suspense } from "react";
import ResetPassword from "./reset-password";

export const metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="p-10 text-zinc-400">Opening password reset…</main>
      }
    >
      <ResetPassword />
    </Suspense>
  );
}
