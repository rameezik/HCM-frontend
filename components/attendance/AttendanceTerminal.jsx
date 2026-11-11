"use client";

import Link from "next/link";
import { Button, Message, Panel } from "@/components/WorkspaceUI";
import TerminalConnection from "./terminal/TerminalConnection";
import TerminalScanner from "./terminal/TerminalScanner";
import useAttendanceTerminal from "./terminal/useAttendanceTerminal";

export default function AttendanceTerminal() {
  const terminal = useAttendanceTerminal();
  const {
    status,
    loading,
    paired,
    configured,
    busy,
    error,
    disconnect,
    retryConnection,
  } = terminal;
  return (
    <main className="neon-background min-h-screen px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-[#82cde6]">HCM</p>
            <h1 className="text-3xl font-semibold">Attendance Terminal</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Face the camera to record your attendance. No sign-in required.
            </p>
          </div>
          <Link
            href="/admin/attendance-terminal"
            className="text-sm text-zinc-400 underline"
          >
            Terminal settings
          </Link>
        </header>
        <Message error={error} />
        {loading && !status && (
          <p role="status" className="text-zinc-400">
            Connecting…
          </p>
        )}
        {!paired ? (
          <TerminalConnection terminal={terminal} />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-sm">
                <span className="font-medium">
                  {status.companyName || "Company attendance"}
                </span>
                <span className="text-zinc-400">
                  {" "}
                  ·{" "}
                  {status.deviceLabel ||
                    status.device?.label ||
                    "Attendance Terminal"}
                </span>
              </p>
              <Button secondary disabled={busy} onClick={disconnect}>
                Disconnect terminal
              </Button>
            </div>
            {!configured && (
              <Panel title="Attendance unavailable">
                <p className="text-sm leading-6 text-amber-100">
                  Face attendance is unavailable. Please contact your
                  administrator.
                </p>
                <div className="mt-4">
                  <Button
                    secondary
                    disabled={loading}
                    onClick={retryConnection}
                  >
                    Check again
                  </Button>
                </div>
              </Panel>
            )}
            {configured && status.registeredEmployees === 0 && (
              <p className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100">
                No employee photos are enabled for attendance yet. Ask your
                administrator to add photos in Terminal settings.
              </p>
            )}
            <TerminalScanner terminal={terminal} />
            <details className="text-xs leading-6 text-zinc-400">
              <summary className="cursor-pointer">
                About face attendance
              </summary>
              <p className="mt-2">
                Matching runs on your company server using approved employee
                profile photos. Camera samples are not saved. Face matching does
                not prevent photo or video replay; this terminal should be
                supervised.
              </p>
            </details>
          </>
        )}
      </div>
    </main>
  );
}
