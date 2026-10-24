"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button, Message } from "@/components/WorkspaceUI";
import LocalFaceCapture from "./LocalFaceCapture";
import {
  biometricError,
  notifyAttendanceChanged,
  requestAttendanceLocation,
  requestCameraPermission,
  useBiometricStatus,
} from "@/lib/biometrics";

export const LiveFaceCapture = LocalFaceCapture;

export default function FaceVerification({ user, onRecorded, onChange }) {
  const linked = !user || Boolean(user.employee);
  const {
    status,
    loading,
    error: statusError,
    refresh,
  } = useBiometricStatus(linked);
  const [capture, setCapture] = useState(null),
    [busy, setBusy] = useState(false),
    [phase, setPhase] = useState(""),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  const role = user?.role === "hr" ? "hr" : "employee";
  async function begin(action) {
    setBusy(true);
    setError("");
    setSuccess("");
    setPhase("Requesting camera and office location…");
    try {
      await requestCameraPermission();
      const location = await requestAttendanceLocation();
      const challenge = await api("/biometrics/challenges", {
        method: "POST",
        body: { purpose: action },
      });
      setCapture({ action, challenge, location });
      setPhase("");
    } catch (failure) {
      setError(biometricError(failure));
      setPhase("");
    } finally {
      setBusy(false);
    }
  }
  async function complete(samples) {
    if (!capture) return;
    setBusy(true);
    setPhase(
      "The backend is comparing your face locally and checking location and attendance rules…",
    );
    try {
      const record = await api("/biometrics/attendance", {
        method: "POST",
        body: {
          challengeId: capture.challenge.challengeId,
          action: capture.action,
          location: capture.location,
          samples,
        },
      });
      setSuccess(
        capture.action === "check-in"
          ? "Face-verified check-in saved."
          : "Face-verified check-out saved.",
      );
      notifyAttendanceChanged();
      refresh();
      onRecorded?.(record);
      onChange?.(record);
    } catch (failure) {
      setError(biometricError(failure));
    } finally {
      setCapture(null);
      setBusy(false);
      setPhase("");
    }
  }
  if (!linked)
    return (
      <p className="text-sm text-zinc-400">
        Face attendance requires a linked employee profile. Ask your company
        administrator to link your HR login.
      </p>
    );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-medium text-zinc-100">Face attendance</h3>
        <Link
          href={`/${role}/face-enrollment`}
          className="text-sm text-[#82cde6] underline underline-offset-4"
        >
          Manage face enrollment
        </Link>
      </div>
      <p className="text-sm leading-6 text-zinc-400">
        Optional face matching runs locally on the application server with an
        office-location check. Camera frames are processed in memory and are
        not retained as photographs. This does not provide reliable liveness or
        anti-spoofing protection. Web attendance and HR corrections remain
        available without biometric consent.
      </p>
      <Message error={statusError || error} success={success} />
      {loading ? (
        <p role="status" className="text-sm text-zinc-400">
          Checking enrollment and local model status…
        </p>
      ) : !status?.configured ? (
        <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100">
          <p className="font-medium">Face verification is not available yet</p>
          <p className="mt-1">
            {status?.unavailableReason ||
              "The local model or encryption configuration is unavailable. Use web check-in/check-out or request an HR correction."}
          </p>
          <p className="mt-2 text-xs text-amber-100/70">
            Local model files and the encryption key must be configured on the
            application server. No external API key is required.
          </p>
        </div>
      ) : !status.enrollment?.enrolled ? (
        <p className="text-sm text-zinc-400">
          Complete face enrollment with your consent before using this
          attendance method.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={busy || Boolean(capture)}
            onClick={() => begin("check-in")}
          >
            Check in with face
          </Button>
          <Button
            secondary
            disabled={busy || Boolean(capture)}
            onClick={() => begin("check-out")}
          >
            Check out with face
          </Button>
        </div>
      )}
      {phase && (
        <p role="status" className="text-sm leading-6 text-[#82cde6]">
          {phase}
        </p>
      )}
      {capture && (
        <LiveFaceCapture
          key={capture.challenge.challengeId}
          challenge={capture.challenge}
          onComplete={complete}
          onCancel={() => {
            setCapture(null);
            setPhase("");
          }}
          onError={(failure) => {
            setCapture(null);
            setPhase("");
            setError(biometricError(failure));
          }}
        />
      )}
    </div>
  );
}
