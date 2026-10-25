"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { biometricError, checkCameraSupport } from "@/lib/biometrics";
import { Button, Message, Panel } from "@/components/WorkspaceUI";

const wait = (milliseconds, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    const cancel = () => {
      clearTimeout(timer);
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

export default function AttendanceKiosk() {
  const [status, setStatus] = useState(null),
    [loading, setLoading] = useState(true);
  const [pairingToken, setPairingToken] = useState("");
  const [view, setView] = useState("attendance"),
    [action, setAction] = useState("check-in");
  const [automatic, setAutomatic] = useState(true),
    [paused, setPaused] = useState(false);
  const [cameraReady, setCameraReady] = useState(false),
    [opening, setOpening] = useState(false),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [hint, setHint] = useState(""),
    [result, setResult] = useState(null);
  const [enrollmentCode, setEnrollmentCode] = useState(""),
    [consent, setConsent] = useState("");
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
        const next = await api("/kiosk/status", { signal });
        if (typeof next?.paired !== "boolean")
          throw new Error(
            "The kiosk service returned incomplete configuration. Ask your administrator to check setup.",
          );
        if (mounted.current && !signal?.aborted) {
          setStatus(next);
          if (!next.paired) {
            stopCamera();
            setEnrollmentCode("");
            setConsent("");
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
    const initialToken = fragment.get("pair") || "";
    async function initialize() {
      try {
        if (initialToken) {
          try {
            await api("/kiosk/pair", {
              method: "POST",
              body: { pairingToken: initialToken },
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
        setHint(
          "Camera stopped while this page was hidden. Start it again when you are ready.",
        );
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
      await api("/kiosk/pair", {
        method: "POST",
        body: { pairingToken: pairingToken.trim() },
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
    if (
      !configured ||
      !cameraReady ||
      processing.current ||
      paused ||
      view !== "attendance"
    )
      return;
    processing.current = true;
    const controller = new AbortController(),
      attempt = generation.current;
    operation.current = controller;
    setBusy(true);
    setError("");
    setResult(null);
    setHint("Checking your face on the attendance server…");
    let samples;
    try {
      const challenge = await api("/kiosk/challenges", {
        method: "POST",
        body: { purpose: action },
        signal: controller.signal,
      });
      samples = await cameraSamples(
        video.current,
        challenge.capture,
        controller.signal,
      );
      const response = await api("/kiosk/attendance", {
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
        setResult({ type: "unregistered", message: "Unregistered profile" });
        setHint(
          "No matching enrolled employee was found. Use enrollment or contact your administrator.",
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
          message:
            action === "check-in" ? "Check-in recorded" : "Check-out recorded",
          timestamp: saved,
          hours: response.attendance.hours,
        });
        setPaused(true);
        setHint(
          "Attendance was saved in the portal. Select Next person for another employee.",
        );
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
        if (failure.status === 429) setPaused(true);
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
  }, [action, cameraReady, configured, paused, refresh, stopCamera, view]);

  useEffect(() => {
    if (
      !automatic ||
      !cameraReady ||
      !configured ||
      paused ||
      busy ||
      view !== "attendance"
    )
      return undefined;
    const timer = setTimeout(
      () => {
        void scan();
      },
      result?.type === "unregistered" || error ? 5000 : 1400,
    );
    return () => clearTimeout(timer);
  }, [
    automatic,
    busy,
    cameraReady,
    configured,
    error,
    paused,
    result,
    scan,
    view,
  ]);

  async function enroll(event) {
    event.preventDefault();
    if (
      !configured ||
      !cameraReady ||
      processing.current ||
      consent !== status?.consent?.version ||
      !enrollmentCode.trim() ||
      !status?.consent?.version
    )
      return;
    processing.current = true;
    const controller = new AbortController(),
      attempt = generation.current;
    operation.current = controller;
    setBusy(true);
    setError("");
    setResult(null);
    setHint(
      "Comparing your live camera samples with your saved employee photo…",
    );
    let samples;
    try {
      const challenge = await api("/kiosk/challenges", {
        method: "POST",
        body: { purpose: "enroll" },
        signal: controller.signal,
      });
      samples = await cameraSamples(
        video.current,
        challenge.capture,
        controller.signal,
      );
      const response = await api("/kiosk/enroll", {
        method: "POST",
        body: {
          challengeId: challenge.challengeId,
          enrollmentCode: enrollmentCode.trim(),
          consent: true,
          consentVersion: consent,
          samples,
        },
        signal: controller.signal,
      });
      if (
        !mounted.current ||
        controller.signal.aborted ||
        attempt !== generation.current
      )
        return;
      if (response.enrolled !== true && response.enrollment?.enrolled !== true)
        throw new Error(
          "Enrollment was not confirmed. Ask your administrator before retrying.",
        );
      setEnrollmentCode("");
      setConsent("");
      setPaused(true);
      setView("attendance");
      setHint(
        "Face enrollment saved. Select Next person to start attendance scanning.",
      );
      setResult({ type: "enrolled", message: "Face enrollment saved" });
    } catch (failure) {
      if (
        !controller.signal.aborted &&
        mounted.current &&
        attempt === generation.current
      ) {
        setHint("");
        setError(biometricError(failure));
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
  }

  function changeView(next) {
    if (busy) return;
    setView(next);
    setPaused(false);
    setResult(null);
    setError("");
    setHint("");
    setEnrollmentCode("");
    setConsent("");
  }

  async function unpair() {
    if (busy) return;
    stopCamera();
    setBusy(true);
    setError("");
    try {
      await api("/kiosk/unpair", { method: "POST", body: {} });
      setStatus({ paired: false });
      setResult(null);
      setConsent("");
      setEnrollmentCode("");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="neon-background min-h-screen px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-[#82cde6]">HCM Lite</p>
            <h1 className="text-3xl font-semibold">Attendance kiosk</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Scan your face. No employee login required.
            </p>
          </div>
          <Link
            href="/admin/attendance-kiosks"
            className="text-sm text-zinc-400 underline"
          >
            Administrator settings
          </Link>
        </header>
        <Message error={error} />
        {loading && !status ? (
          <p role="status" className="text-zinc-400">
            Checking kiosk connection…
          </p>
        ) : null}
        {!paired ? (
          <Panel title="Connect this kiosk">
            <p className="mb-5 text-sm leading-7 text-zinc-400">
              Your administrator pairs this camera with the company once.
              Employees then scan without signing in. Open the pairing link from
              Admin settings, or enter its one-time code below.
            </p>
            <form onSubmit={pair} className="space-y-4">
              <label className="block text-sm text-zinc-300">
                Kiosk pairing code
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
              <button
                className="rounded-xl bg-[#007ba7] px-4 py-3 text-sm font-medium disabled:opacity-50"
                disabled={busy || !pairingToken.trim()}
              >
                {busy ? "Connecting…" : "Connect kiosk"}
              </button>
            </form>
            <Button
              secondary
              disabled={busy || loading}
              onClick={() => {
                setError("");
                void refresh().catch((failure) => setError(failure.message));
              }}
            >
              Retry connection
            </Button>
          </Panel>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-sm">
                <span className="font-medium">
                  {status.companyName ||
                    status.company?.name ||
                    "Company attendance"}
                </span>
                <span className="text-zinc-400">
                  {" "}
                  ·{" "}
                  {status.device?.label ||
                    status.deviceLabel ||
                    "Paired camera"}
                </span>
              </p>
              <Button secondary disabled={busy} onClick={unpair}>
                Disconnect kiosk
              </Button>
            </div>
            {!configured && (
              <Panel title="Face recognition setup is required">
                <p className="text-sm leading-7 text-amber-100">
                  {status.unavailableReason ||
                    "The local face model, biometric key or office setup is unavailable. Ask your administrator to complete kiosk setup; no attendance will be recorded until verification is available."}
                </p>
                {Array.isArray(status.missingConfiguration) &&
                  status.missingConfiguration.length > 0 && (
                    <p className="mt-3 text-xs text-zinc-400">
                      Setup needed: {status.missingConfiguration.join(", ")}
                    </p>
                  )}
                <Button
                  secondary
                  disabled={loading}
                  onClick={() => {
                    setError("");
                    void refresh().catch((failure) =>
                      setError(failure.message),
                    );
                  }}
                >
                  Refresh setup
                </Button>
              </Panel>
            )}
            <div className="flex flex-wrap gap-3" aria-label="Kiosk mode">
              <Button
                secondary={view !== "attendance"}
                disabled={busy}
                onClick={() => changeView("attendance")}
              >
                Attendance scan
              </Button>
              <Button
                secondary={view !== "enroll"}
                disabled={busy}
                onClick={() => changeView("enroll")}
              >
                Enroll employee
              </Button>
            </div>
            <Panel
              title={
                view === "enroll" ? "Enroll your face" : "Face attendance scan"
              }
            >
              {view === "attendance" ? (
                <div className="mb-5 flex flex-wrap items-center gap-4">
                  <label className="text-sm text-zinc-300">
                    Attendance action
                    <select
                      className="input-field mt-2"
                      value={action}
                      disabled={busy}
                      onChange={(event) => {
                        setAction(event.target.value);
                        setPaused(false);
                        setResult(null);
                        setError("");
                      }}
                    >
                      <option value="check-in">Check in</option>
                      <option value="check-out">Check out</option>
                    </select>
                  </label>
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
              ) : (
                <p className="mb-5 text-sm leading-7 text-zinc-400">
                  Ask Admin for a one-time enrollment code. Your live samples
                  must match the employee photo already saved in the company
                  database. Enrollment does not create a new employee account.
                </p>
              )}
              <video
                ref={video}
                aria-label="Kiosk camera preview"
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
                  disabled={!cameraReady && !opening}
                  onClick={() => {
                    stopCamera();
                    setHint(
                      "Camera stopped. If a scan was already processing, ask HR to check its record before retrying.",
                    );
                  }}
                >
                  Stop camera
                </Button>
                {view === "attendance" && (
                  <Button
                    disabled={!configured || !cameraReady || busy || paused}
                    onClick={() => {
                      void scan();
                    }}
                  >
                    {busy ? "Verifying…" : "Scan now"}
                  </Button>
                )}
                {paused && (
                  <Button
                    disabled={busy || !cameraReady}
                    onClick={() => {
                      setPaused(false);
                      setResult(null);
                      setError("");
                      setHint("");
                    }}
                  >
                    Next person
                  </Button>
                )}
              </div>
              <p role="status" className="mt-4 text-sm text-[#82cde6]">
                {hint ||
                  (cameraReady
                    ? paused
                      ? "Scanning paused. Select Next person when ready."
                      : "Camera ready. Keep exactly one face visible."
                    : "Start the camera when you are ready.")}
              </p>
              {result && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`mt-5 rounded-xl border p-5 ${result.type === "unregistered" ? "border-amber-300/30 bg-amber-300/5 text-amber-100" : "border-cyan-300/25 bg-cyan-300/5 text-cyan-100"}`}
                >
                  <p className="text-xl font-semibold">{result.message}</p>
                  {result.employee && (
                    <p className="mt-2 text-lg">
                      {result.employee.name}
                      {result.employee.code ? ` · ${result.employee.code}` : ""}
                    </p>
                  )}
                  {result.timestamp && (
                    <p className="mt-2 text-sm">
                      Server time:{" "}
                      <time dateTime={result.timestamp}>
                        {timestamp(result.timestamp)}
                      </time>
                    </p>
                  )}
                  {result.type === "success" &&
                    action === "check-out" &&
                    Number.isFinite(Number(result.hours)) && (
                      <p className="mt-2 text-sm">
                        Working duration: {Number(result.hours).toFixed(2)}{" "}
                        hours
                      </p>
                    )}
                </div>
              )}
              {view === "enroll" && (
                <form
                  className="mt-6 space-y-4 border-t border-white/10 pt-5"
                  onSubmit={enroll}
                >
                  <label className="block text-sm text-zinc-300">
                    One-time enrollment code
                    <input
                      className="input-field mt-2"
                      type="password"
                      autoComplete="off"
                      value={enrollmentCode}
                      onChange={(event) =>
                        setEnrollmentCode(event.target.value)
                      }
                      required
                      maxLength={200}
                      disabled={busy}
                    />
                  </label>
                  <label className="flex items-start gap-3 text-sm leading-6 text-zinc-300">
                    <input
                      type="checkbox"
                      checked={
                        Boolean(consent) && consent === status.consent?.version
                      }
                      className="mt-1 accent-[#007ba7]"
                      onChange={(event) =>
                        setConsent(
                          event.target.checked
                            ? status.consent?.version || ""
                            : "",
                        )
                      }
                      disabled={busy}
                    />
                    <span>
                      I consent to comparing these live samples with my saved
                      employee photo and storing an encrypted face template for
                      kiosk attendance. I can withdraw consent through my
                      company administrator.
                    </span>
                  </label>
                  <details className="text-sm leading-7 text-zinc-400">
                    <summary className="cursor-pointer text-[#82cde6]">
                      Read biometric consent and retention notice
                    </summary>
                    <p className="mt-3">
                      {status.consent?.notice ||
                        "Your administrator must provide the current biometric notice before enrollment."}
                    </p>
                  </details>
                  <button
                    disabled={
                      !configured ||
                      !cameraReady ||
                      busy ||
                      consent !== status.consent?.version ||
                      !enrollmentCode.trim() ||
                      !status.consent?.version
                    }
                    className="rounded-xl bg-[#007ba7] px-4 py-3 text-sm font-medium disabled:opacity-50"
                  >
                    {busy ? "Checking enrollment…" : "Verify and enroll"}
                  </button>
                </form>
              )}
              <p className="mt-5 text-xs leading-6 text-zinc-500">
                Face matching runs on the company server. Basic camera capture
                does not provide reliable liveness or protection against
                photographs and replayed video. Camera images are processed
                transiently and are not retained by this page.
              </p>
            </Panel>
          </>
        )}
      </div>
    </main>
  );
}
