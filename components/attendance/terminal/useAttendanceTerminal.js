"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { biometricError } from "@/lib/biometrics";
import useTerminalCamera from "./useTerminalCamera";
import { captureCameraSamples } from "./cameraCapture";
import {
  getTerminalStatus,
  connectTerminal,
  createScanChallenge,
  submitAttendance,
  disconnectTerminal,
} from "./terminalApi";

export default function useAttendanceTerminal() {
  const [status, setStatus] = useState(null),
    [loading, setLoading] = useState(true);
  const [pairingToken, setPairingToken] = useState("");
  const [action, setAction] = useState("check-in");
  const [automatic, setAutomatic] = useState(true),
    [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [hint, setHint] = useState(""),
    [result, setResult] = useState(null);
  const connectionMethod = useRef("pair");
  const isMounted = useRef(false);
  const activeRequest = useRef(null),
    scanInProgress = useRef(false);
  const paired = status?.paired === true;
  const configured = paired && status?.configured === true;

  const {
    videoRef,
    cameraVersion,
    cameraReady,
    opening,
    openCamera,
    stopCamera,
  } = useTerminalCamera(isMounted, activeRequest, setError);

  const refresh = useCallback(
    async (signal) => {
      if (isMounted.current) setLoading(true);
      try {
        const next = await getTerminalStatus(signal);
        if (typeof next?.paired !== "boolean")
          throw new Error(
            "Unable to load terminal settings. Please try again.",
          );
        if (isMounted.current && !signal?.aborted) {
          setStatus(next);
          if (!next.paired) {
            stopCamera();
            setResult(null);
          }
        }
        return next;
      } finally {
        if (isMounted.current && !signal?.aborted) setLoading(false);
      }
    },
    [stopCamera],
  );

  useEffect(() => {
    isMounted.current = true;
    const controller = new AbortController();
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = fragment.get("access") || "";
    const initialToken = accessToken || fragment.get("pair") || "";
    connectionMethod.current = accessToken ? "connect" : "pair";
    async function initialize() {
      try {
        if (initialToken) {
          try {
            await connectTerminal(
              initialToken,
              connectionMethod.current,
              controller.signal,
            );
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
        if (!controller.signal.aborted && isMounted.current) {
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
      isMounted.current = false;
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

  async function connect(event) {
    event.preventDefault();
    if (busy || !pairingToken.trim()) return;
    setBusy(true);
    setError("");
    try {
      await connectTerminal(pairingToken.trim(), connectionMethod.current);
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
    setError("");
    setHint("");
    setResult(null);
    setPaused(false);
    await openCamera();
  }

  const scan = useCallback(async () => {
    if (!configured || !cameraReady || scanInProgress.current || paused) return;
    scanInProgress.current = true;
    const controller = new AbortController(),
      attempt = cameraVersion.current;
    activeRequest.current = controller;
    setBusy(true);
    setError("");
    setResult(null);
    setHint("Scanning…");
    let samples;
    try {
      const challenge = await createScanChallenge(action, controller.signal);
      samples = await captureCameraSamples(
        videoRef.current,
        challenge.capture,
        controller.signal,
      );
      const response = await submitAttendance(
        challenge.challengeId,
        action,
        samples,
        controller.signal,
      );
      if (
        !isMounted.current ||
        controller.signal.aborted ||
        attempt !== cameraVersion.current
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
            "Unable to confirm attendance. Check your attendance history before trying again.",
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
        isMounted.current &&
        attempt === cameraVersion.current
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
      if (activeRequest.current === controller) activeRequest.current = null;
      scanInProgress.current = false;
      if (isMounted.current) setBusy(false);
    }
  }, [
    action,
    cameraReady,
    cameraVersion,
    configured,
    paused,
    refresh,
    stopCamera,
    videoRef,
  ]);

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
      await disconnectTerminal();
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

  return {
    status,
    loading,
    pairingToken,
    setPairingToken,
    action,
    setAction,
    automatic,
    setAutomatic,
    paused,
    cameraReady,
    opening,
    busy,
    error,
    hint,
    result,
    videoRef,
    paired,
    configured,
    connect,
    startCamera,
    stopCamera,
    scan,
    disconnect,
    nextPerson,
    retryConnection,
  };
}
