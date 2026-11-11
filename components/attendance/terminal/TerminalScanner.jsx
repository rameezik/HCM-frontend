import { Button, Panel } from "@/components/WorkspaceUI";

const timestamp = (value) =>
  value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "medium",
      })
    : "Not recorded";

export default function TerminalScanner({ terminal }) {
  const {
    action,
    setAction,
    automatic,
    setAutomatic,
    paused,
    cameraReady,
    opening,
    busy,
    configured,
    hint,
    result,
    videoRef,
    startCamera,
    stopCamera,
    scan,
    nextPerson,
  } = terminal;
  return (
    <Panel title="Record attendance">
      <div className="mb-5 flex flex-wrap items-center gap-5">
        <label className="text-sm text-zinc-300" htmlFor="terminal-action">
          Attendance action
        </label>
        <select
          id="terminal-action"
          className="input-field max-w-48"
          value={action}
          disabled={busy}
          onChange={(event) => {
            setAction(event.target.value);
            nextPerson();
          }}
        >
          <option value="check-in">Check in</option>
          <option value="check-out">Check out</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            className="accent-[#007ba7]"
            checked={automatic}
            disabled={busy}
            onChange={(event) => setAutomatic(event.target.checked)}
          />
          Scan automatically
        </label>
      </div>
      <video
        ref={videoRef}
        aria-label="Attendance camera preview"
        muted
        autoPlay
        playsInline
        className="mx-auto aspect-[4/3] w-full max-w-2xl rounded-xl border border-white/10 bg-black object-contain"
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          disabled={!configured || opening || cameraReady || busy}
          onClick={startCamera}
        >
          {opening ? "Opening camera…" : "Start camera"}
        </Button>
        <Button
          secondary
          disabled={!cameraReady || busy}
          onClick={() => stopCamera()}
        >
          Stop camera
        </Button>
        <Button
          disabled={!cameraReady || !configured || busy || paused}
          onClick={() => void scan()}
        >
          {busy ? "Scanning…" : "Scan now"}
        </Button>
        {paused && (
          <Button disabled={busy || !cameraReady} onClick={nextPerson}>
            Next person
          </Button>
        )}
      </div>
      <p role="status" className="mt-4 text-sm text-[#82cde6]">
        {hint ||
          (cameraReady
            ? paused
              ? "Scanning paused. Select Next person when ready."
              : "Keep one face visible."
            : "Select Start camera to begin.")}
      </p>
      {result && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-5 rounded-xl border p-5 ${result.type === "success" ? "border-cyan-300/25 bg-cyan-300/5 text-cyan-100" : "border-amber-300/30 bg-amber-300/5 text-amber-100"}`}
        >
          <p className="text-2xl font-semibold">{result.message}</p>
          {result.employee && (
            <p className="mt-2 text-lg">
              {result.employee.name}
              {result.employee.code ? ` · ${result.employee.code}` : ""}
            </p>
          )}
          {result.timestamp && (
            <p className="mt-2 text-sm">
              Recorded at{" "}
              <time dateTime={result.timestamp}>
                {timestamp(result.timestamp)}
              </time>
            </p>
          )}
        </div>
      )}
      <p className="mt-5 text-xs leading-5 text-zinc-400">
        Use this terminal only if you have agreed to face attendance. Contact HR
        for a profile update or manual attendance.
      </p>
    </Panel>
  );
}
