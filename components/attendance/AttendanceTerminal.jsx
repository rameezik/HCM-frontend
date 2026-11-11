"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { biometricError, checkCameraSupport } from "@/lib/biometrics";
import { Button, Message, Panel } from "@/components/WorkspaceUI";

const wait = (milliseconds, signal) =>
  new Promise((resolve, reject) => {
    const finish = () => {
      signal.removeEventListener("abort", cancel);
      resolve();
    };
    const timer = setTimeout(finish, milliseconds);
    const cancel = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", cancel);
      reject(new DOMException("Capture stopped", "AbortError"));
    };
    if (signal.aborted) cancel();
    else signal.addEventListener("abort", cancel, { once: true });
  });
const timestamp = (value) =>
  value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "medium",
      })
    : "Not recorded";

async function cameraSamples(video, capture, signal) {
  const samples = [],
    canvas = document.createElement("canvas");
  try {
    for (let index = 0; index < 3; index++) {
      signal.throwIfAborted();
      if (
        !video ||
        video.readyState < 2 ||
        video.videoWidth < 160 ||
        video.videoHeight < 160
      )
        throw new Error(
          "The camera frame is not ready. Keep one face visible and retry.",
        );
      const scale = Math.min(
        1,
        Math.min(640, capture?.maxWidth || 640) /
          Math.max(video.videoWidth, video.videoHeight),
      );
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const context = canvas.getContext("2d", { alpha: false });
      if (!context)
        throw new Error("This browser cannot capture camera frames.");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL("image/jpeg", 0.86).split(",")[1];
      if (
        !image ||
        Math.ceil((image.length * 3) / 4) >
          Math.min(250000, capture?.maxImageBytes || 250000)
      )
        throw new Error(
          "The camera image is too large. Retry with a lower-resolution camera.",
        );
      samples.push(image);
      if (index < 2) await wait(350, signal);
    }
    return samples;
  } catch (error) {
    samples.fill("");
    throw error;
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

export default function AttendanceTerminal() {
  const [status, setStatus] = useState(null),
    [loading, setLoading] = useState(true);
  const [pairingToken, setPairingToken] = useState("");
  const [action, setAction] = useState("check-in");
  const [automatic, setAutomatic] = useState(true),
    [paused, setPaused] = useState(false);
  const [cameraReady, setCameraReady] = useState(false),
    [opening, setOpening] = useState(false),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [hint, setHint] = useState(""),
    [result, setResult] = useState(null);
  const connectionMethod = useRef("pair");
  const video = useRef(null),
    stream = useRef(null),
    mounted = useRef(false),
    generation = useRef(0);
  const operation = useRef(null),
    processing = useRef(false);
  const paired = status?.paired === true;
  const configured = paired && status?.configured === true;

  const stopCamera = useCallback((update = true) => {
    generation.current += 1;
    operation.current?.abort();
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (video.current) video.current.srcObject = null;
    if (update && mounted.current) {
      setCameraReady(false);
      setOpening(false);
    }
  }, []);

  const refresh = useCallback(
    async (signal) => {
      if (mounted.current) setLoading(true);
      try {
        const next = await api("/attendance-terminal/status", { signal });
        if (typeof next?.paired !== "boolean")
          throw new Error(
            "Terminal settings could not be loaded. Ask your administrator to check the connection.",
          );
        if (mounted.current && !signal?.aborted) {
          setStatus(next);
          if (!next.paired) {
            stopCamera();
            setResult(null);
          }
        }
        return next;
      } finally {
        if (mounted.current && !signal?.aborted) setLoading(false);
      }
    },
    [stopCamera],
  );

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = fragment.get("access") || "";
    const initialToken = accessToken || fragment.get("pair") || "";
    connectionMethod.current = accessToken ? "connect" : "pair";
    async function initialize() {
      try {
        if (initialToken) {
          try {
            await api(`/attendance-terminal/${connectionMethod.current}`, {
              method: "POST",
              body:
                connectionMethod.current === "connect"
                  ? { accessToken: initialToken }
                  : { pairingToken: initialToken },
              signal: controller.signal,
            });
          } finally {
            window.history.replaceState(
              null,
              "",
              window.location.pathname + window.location.search,
            );
          }
        }
        await refresh(controller.signal);
      } catch (failure) {
        if (!controller.signal.aborted && mounted.current) {
          setError(failure.message);
          setPairingToken(initialToken);
          setLoading(false);
        }
      }
    }
    // React's development effect rehearsal must not consume a single-use code.
    const initializeTimer = setTimeout(() => void initialize(), 0);
    const hidden = () => {
      if (document.hidden) {
        stopCamera();
        setHint("Camera stopped. Select Start camera to continue.");
      }
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      mounted.current = false;
      clearTimeout(initializeTimer);
      controller.abort();
      stopCamera(false);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [refresh, stopCamera]);

  useEffect(() => {
    if (result?.type !== "success" || !result.employee) return undefined;
    const timer = setTimeout(
      () =>
        setResult((previous) =>
          previous?.type === "success"
            ? { ...previous, employee: null }
            : previous,
        ),
      8000,
    );
    return () => clearTimeout(timer);
  }, [result]);

  async function pair(event) {
    event.preventDefault();
    if (busy || !pairingToken.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api(`/attendance-terminal/${connectionMethod.current}`, {
        method: "POST",
        body:
          connectionMethod.current === "connect"
            ? { accessToken: pairingToken.trim() }
            : { pairingToken: pairingToken.trim() },
      });
      setPairingToken("");
      await refresh();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function startCamera() {
    if (opening || busy || !configured) return;
    const attempt = ++generation.current;
    setOpening(true);
    setError("");
    setHint("");
    setResult(null);
    setPaused(false);
    try {
      checkCameraSupport();
      const camera = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      if (!mounted.current || attempt !== generation.current) {
        camera.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = camera;
      video.current.srcObject = camera;
      await video.current.play();
      if (mounted.current && attempt === generation.current)
        setCameraReady(true);
    } catch (failure) {
      if (mounted.current && attempt === generation.current) {
        stopCamera();
        setError(biometricError(failure));
      }
    } finally {
      if (mounted.current && attempt === generation.current) setOpening(false);
    }
  }

  const scan = useCallback(async () => {
    if (!configured || !cameraReady || processing.current || paused) return;
    processing.current = true;
    const controller = new AbortController(),
      attempt = generation.current;
    operation.current = controller;
    setBusy(true);
    setError("");
    setResult(null);
    setHint("Scanning…");
    let samples;
    try {
      const challenge = await api("/attendance-terminal/challenges", {
        method: "POST",
        body: { purpose: action },
        signal: controller.signal,
      });
      samples = await cameraSamples(
        video.current,
        challenge.capture,
        controller.signal,
      );
      const response = await api("/attendance-terminal/attendance", {
        method: "POST",
        body: { challengeId: challenge.challengeId, action, samples },
        signal: controller.signal,
      });
      if (
        !mounted.current ||
        controller.signal.aborted ||
        attempt !== generation.current
      )
        return;
      if (
        response.matched === false &&
        response.code === "UNREGISTERED_PROFILE"
      ) {
        setResult({ type: "unregistered", message: "Record not found" });
        setHint(
          "No employee photo matched. Contact HR if your profile needs updating.",
        );
      } else {
        const saved =
          action === "check-in"
            ? response.attendance?.checkIn
            : response.attendance?.checkOut;
        if (
          response.matched !== true ||
          response.action !== action ||
          !saved ||
          !Number.isFinite(Date.parse(saved)) ||
          !response.employee?.name
        )
          throw new Error(
            "The attendance confirmation is incomplete. Ask HR to check the attendance record before retrying.",
          );
        setResult({
          type: "success",
          employee: {
            name: response.employee.name,
            code: response.employee.code,
          },
          message: action === "check-in" ? "Present" : "Check-out recorded",
          timestamp: saved,
          hours: response.attendance.hours,
        });
        setPaused(true);
        setHint("Attendance saved. Select Next person to continue.");
        window.dispatchEvent(new Event("attendance-updated"));
      }
    } catch (failure) {
      if (
        !controller.signal.aborted &&
        mounted.current &&
        attempt === generation.current
      ) {
        setHint("");
        setError(biometricError(failure));
        if (failure.status === 429 || failure.status === 409) setPaused(true);
        if (
          failure.status === 409 &&
          /already checked (?:in|out)|already recorded/i.test(
            failure.message || "",
          )
        ) {
          setResult({
            type: "duplicate",
            message: "Attendance already recorded",
          });
        }
        if (failure.status === 401 || failure.status === 403) {
          stopCamera();
          await refresh().catch(() => {});
        }
      }
    } finally {
      samples?.fill("");
      if (operation.current === controller) operation.current = null;
      processing.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [action, cameraReady, configured, paused, refresh, stopCamera]);

  useEffect(() => {
    if (!automatic || !cameraReady || !configured || paused || busy)
      return undefined;
    const timer = setTimeout(
      () => {
        void scan();
      },
      result?.type === "unregistered" || error ? 5000 : 1400,
    );
    return () => clearTimeout(timer);
  }, [automatic, busy, cameraReady, configured, error, paused, result, scan]);

  async function disconnect() {
    if (busy) return;
    stopCamera();
    setBusy(true);
    setError("");
    try {
      await api("/attendance-terminal/disconnect", { method: "POST", body: {} });
      setStatus({ paired: false });
      setResult(null);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  function nextPerson() {
    setPaused(false);
    setResult(null);
    setError("");
    setHint("");
  }

  function retryConnection() {
    setError("");
    void refresh().catch((failure) => setError(failure.message));
  }

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
          <Panel title="Connect this terminal">
            <p className="mb-5 text-sm leading-6 text-zinc-400">
              Open the connection link from your company administrator. This
              device only needs to be connected once.
            </p>
            <form onSubmit={pair} className="space-y-4">
              <label className="block text-sm text-zinc-300">
                Connection code
                <input
                  className="input-field mt-2"
                  type="password"
                  autoComplete="off"
                  value={pairingToken}
                  onChange={(event) => setPairingToken(event.target.value)}
                  maxLength={200}
                  required
                />
              </label>
              <Button disabled={busy || !pairingToken.trim()} type="submit">
                {busy ? "Connecting…" : "Connect terminal"}
              </Button>
            </form>
            <div className="mt-4">
              <Button
                secondary
                disabled={busy || loading}
                onClick={retryConnection}
              >
                Retry connection
              </Button>
            </div>
          </Panel>
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
              <Panel title="Terminal needs attention">
                <p className="text-sm leading-6 text-amber-100">
                  {status.unavailableReason ||
                    "The attendance service is not ready. Ask your administrator to finish terminal setup."}
                </p>
                {status.missingConfiguration?.length > 0 && (
                  <details className="mt-3 text-xs text-zinc-400">
                    <summary className="cursor-pointer">Setup details</summary>
                    <p className="mt-2">
                      {status.missingConfiguration.join(", ")}
                    </p>
                  </details>
                )}
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
            <Panel title="Record attendance">
              <div className="mb-5 flex flex-wrap items-center gap-5">
                <label
                  className="text-sm text-zinc-300"
                  htmlFor="terminal-action"
                >
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
                ref={video}
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
                Use this terminal only if you have agreed to face attendance.
                Contact HR for a profile update or manual attendance.
              </p>
            </Panel>
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
