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

const serverTime = (value) =>
  value && Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      }).format(new Date(value))
    : "Not recorded";

export default function FaceVerification(props) {
  const user = props.user;
  return (
    <FaceVerificationSession
      key={`${user?.company}:${user?._id}:${user?.employee}:${user?.role}`}
      {...props}
    />
  );
}

function FaceVerificationSession({ user, onRecorded, onChange }) {
  const linked = !user || Boolean(user.employee);
  const {
    status,
    loading,
    error: statusError,
    refresh,
  } = useBiometricStatus(linked, user);
  const [capture, setCapture] = useState(null),
    [busy, setBusy] = useState(false),
    [phase, setPhase] = useState(""),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [lastRecord, setLastRecord] = useState(null);
  const attendance = status?.attendance || lastRecord;
  const attendanceKnown =
    Boolean(lastRecord) || status?.attendance !== undefined;
  const checkedIn = Boolean(attendance?.checkIn && !attendance?.checkOut);
  const scanReady = Boolean(
    status?.configured &&
      status?.enrollment?.enrolled &&
      status.officeConfigured !== false,
  );
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
      const timestamp =
        capture.action === "check-in" ? record.checkIn : record.checkOut;
      const method =
        capture.action === "check-in"
          ? record.verificationMethod
          : record.checkOutVerification?.method;
      if (
        method !== "face" ||
        !timestamp ||
        !Number.isFinite(Date.parse(timestamp))
      )
        throw new Error(
          "The attendance confirmation is incomplete. Check your history before trying again.",
        );
      setLastRecord(record);
      setSuccess(
        capture.action === "check-in"
          ? `Face-verified check-in saved at ${serverTime(timestamp)}.`
          : `Face-verified check-out saved at ${serverTime(timestamp)}. Working duration: ${Number(record.hours || 0).toFixed(2)} hours.`,
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
        <h3 className="font-medium text-zinc-100">Webcam face attendance</h3>
        <Link
          href={`/${role}/face-enrollment`}
          className="text-sm text-[#82cde6] underline underline-offset-4"
        >
          Manage face enrollment
        </Link>
      </div>
      <p className="text-sm leading-6 text-zinc-400">
        Optional face matching runs locally on the application server with an
        office-location check. Camera frames are processed in memory and are not
        retained as photographs. This does not provide reliable liveness or
        anti-spoofing protection. Web attendance and HR corrections remain
        available without biometric consent.
      </p>
      <Message error={statusError || error} success={success} />
      {status?.enrollment?.enrolled && (
        <p className="text-sm text-[#82cde6]">
          Face enrollment active. Your camera samples will be compared with your
          own protected template.
        </p>
      )}
      {attendance?.checkIn && (
        <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-zinc-500">Last check-in</p>
            <time
              className="mt-1 block text-zinc-200"
              dateTime={attendance.checkIn}
            >
              {serverTime(attendance.checkIn)}
            </time>
          </div>
          <div>
            <p className="text-zinc-500">Check-out</p>
            {attendance.checkOut ? (
              <time
                className="mt-1 block text-zinc-200"
                dateTime={attendance.checkOut}
              >
                {serverTime(attendance.checkOut)}
              </time>
            ) : (
              <p className="mt-1 text-[#82cde6]">Currently checked in</p>
            )}
          </div>
          <div>
            <p className="text-zinc-500">Recorded working hours</p>
            <p className="mt-1 text-zinc-200">
              {Number(attendance.hours || 0).toFixed(2)} hours
            </p>
          </div>
        </div>
      )}
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
        <div className="space-y-3 text-sm text-zinc-400">
          <p>
            Complete face enrollment with your consent before using this
            attendance method.
          </p>
          <Link
            href={`/${role}/face-enrollment`}
            className="inline-flex rounded-xl bg-[#007ba7] px-4 py-2 font-medium text-white"
          >
            Enroll my face with webcam
          </Link>
        </div>
      ) : status.officeConfigured === false ? (
        <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100">
          Office location setup is required for face attendance. Ask your
          administrator to save office coordinates and radius in Company
          settings. Your enrollment remains active; authorized manual attendance
          is available meanwhile.
        </div>
      ) : (
        <p className="text-sm text-zinc-400">
          Your enrollment is ready. Select check-in or check-out below to open
          your webcam.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={
            loading || !scanReady || busy || Boolean(capture) || checkedIn
          }
          onClick={() => begin("check-in")}
        >
          Scan face to check in
        </Button>
        <Button
          secondary
          disabled={
            loading ||
            !scanReady ||
            busy ||
            Boolean(capture) ||
            (attendanceKnown && !checkedIn)
          }
          onClick={() => begin("check-out")}
        >
          Scan face to check out
        </Button>
      </div>
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
