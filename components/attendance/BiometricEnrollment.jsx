"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button, Message, Panel } from "@/components/WorkspaceUI";
import LocalFaceCapture from "@/components/attendance/LocalFaceCapture";
import {
  biometricError,
  biometricIdentity,
  notifyBiometricEnrollmentChanged,
  requestCameraPermission,
  useBiometricStatus,
} from "@/lib/biometrics";

const formattedTime = (value) =>
  value && Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not yet";

function setupItems(status) {
  const missing = status?.missingConfiguration || [];
  const items = [];
  if (missing.some((name) => /\.onnx$|PYTHON/.test(name)))
    items.push(
      "Install the local face models and Python runtime on the backend.",
    );
  if (missing.includes("BIOMETRIC_TEMPLATE_KEY"))
    items.push(
      "Configure the backend biometric encryption key; keep the same key for existing enrollments.",
    );
  if (missing.some((name) => /THRESHOLD|RETENTION/.test(name)))
    items.push(
      "Correct the face matching or retention settings on the backend.",
    );
  return items;
}

export default function BiometricEnrollment({ user }) {
  return <EnrollmentContent key={biometricIdentity(user)} user={user} />;
}

function EnrollmentContent({ user }) {
  const linked = !user || Boolean(user.employee);
  const {
    status,
    loading,
    error: statusError,
    refresh,
  } = useBiometricStatus(linked, user);
  const [acceptedNotice, setAcceptedNotice] = useState(""),
    [capture, setCapture] = useState(null),
    [busy, setBusy] = useState(false),
    [phase, setPhase] = useState(""),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [confirmDelete, setConfirmDelete] = useState(false);
  const role = user?.role === "hr" ? "hr" : "employee";
  const currentNotice = status?.consent?.version
    ? `${biometricIdentity(user)}:${status.consent.version}`
    : "";
  const consent = Boolean(currentNotice && acceptedNotice === currentNotice);
  const setConsent = (value) => setAcceptedNotice(value ? currentNotice : "");
  const enrollment = status?.enrollment;
  const legacy = [
    "legacy-enrollment-requires-cleanup",
    "legacy-cleanup-required",
  ].includes(enrollment?.status);
  const removable = Boolean(
    enrollment?.enrolled ||
      legacy ||
      [
        "active",
        "expired",
        "deleting",
        "delete_failed",
        "deletion-pending",
      ].includes(enrollment?.status),
  );
  const ready = Boolean(
    linked && status?.configured && status?.consent?.version && !removable,
  );
  const missing = setupItems(status);
  const blockedReason = !linked
    ? "Your login needs a linked employee profile. Ask your administrator to link your account."
    : loading
      ? "Checking your company’s face enrollment service…"
      : statusError
        ? "Enrollment status could not be loaded. Retry the connection below; no enrollment has been recorded."
        : legacy
          ? "Your previous provider enrollment needs administrator cleanup before local re-enrollment."
          : enrollment?.enrolled
            ? "Your face enrollment is active. Open Attendance to check in or out."
            : removable
              ? "Delete the existing enrollment below before starting a new enrollment."
              : !status?.configured
                ? status?.unavailableReason ||
                  "Your company’s local recognition service is not ready. Ask your administrator to complete backend setup."
                : !consent
                  ? "Read the notice and select the consent checkbox to enable your webcam."
                  : "Ready to open your webcam. Keep exactly one face clearly visible.";

  async function begin() {
    if (!ready || !consent || busy || capture) return;
    setBusy(true);
    setError("");
    setSuccess("");
    setPhase("Requesting access to your webcam…");
    try {
      await requestCameraPermission();
      const challenge = await api("/biometrics/challenges", {
        method: "POST",
        body: {
          purpose: "enroll",
          consent: true,
          consentVersion: status.consent.version,
        },
      });
      if (
        !challenge?.challengeId ||
        !Number.isFinite(Date.parse(challenge.expiresAt))
      )
        throw new Error(
          "The enrollment service did not return a valid camera session. Retry the connection.",
        );
      setCapture({ challenge });
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
    setPhase("Checking your face samples and saving the encrypted enrollment…");
    try {
      const result = await api("/biometrics/enrollment", {
        method: "POST",
        body: { challengeId: capture.challenge.challengeId, samples },
      });
      if (result?.enrollment?.enrolled !== true)
        throw new Error(
          "Enrollment was not confirmed by the server. Refresh your status before retrying.",
        );
      setSuccess(
        "Face enrollment was verified and saved. You can now use local face attendance.",
      );
      setConsent(false);
      notifyBiometricEnrollmentChanged();
      refresh();
    } catch (failure) {
      setError(biometricError(failure));
    } finally {
      setCapture(null);
      setBusy(false);
      setPhase("");
    }
  }
  async function remove() {
    if (!confirmDelete || busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await api("/biometrics/enrollment", { method: "DELETE" });
      if (result?.deleted === false)
        setSuccess(
          result.message ||
            "Consent withdrawn. Administrator cleanup is still required.",
        );
      else if (result?.deleted === true)
        setSuccess(
          "Your enrollment was deleted. Face attendance is unavailable until you choose to enroll again.",
        );
      else
        throw new Error(
          "Deletion was not confirmed. Refresh enrollment status before trying again.",
        );
      setConsent(false);
      setConfirmDelete(false);
      notifyBiometricEnrollmentChanged();
      refresh();
    } catch (failure) {
      setError(biometricError(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Panel
        title="Enroll your face"
        action={
          <Button
            secondary
            disabled={busy || Boolean(capture)}
            onClick={refresh}
          >
            Refresh status
          </Button>
        }
      >
        <p className="mb-4 text-sm leading-6 text-zinc-400">
          Enroll using your webcam. Your company’s server verifies the samples
          and saves your encrypted face template.
        </p>
        <ol
          aria-label="Face enrollment steps"
          className="mb-4 grid grid-cols-3 gap-2 text-xs sm:text-sm"
        >
          <li className="rounded-lg border border-white/10 p-2 text-[#82cde6]">
            1. Consent
          </li>
          <li className="rounded-lg border border-white/10 p-2 text-zinc-300">
            2. Open webcam
          </li>
          <li className="rounded-lg border border-white/10 p-2 text-zinc-300">
            3. Verify and save
          </li>
        </ol>
        <Message error={statusError || error} success={success} />
        <p className="mb-3 text-sm leading-6 text-zinc-400">
          Optional: keep an encrypted face template for up to{" "}
          {status?.consent?.retentionDays || "the configured number of"} days.
          No stored photographs. You may withdraw consent. This has no reliable
          liveness or replay protection.
        </p>
        {!enrollment?.enrolled && (
          <label className="mb-4 flex cursor-pointer items-start gap-3 text-sm leading-6 text-zinc-200">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[#007ba7]"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              disabled={
                busy ||
                Boolean(capture) ||
                !linked ||
                removable ||
                !status?.consent?.notice
              }
            />
            <span>
              I voluntarily consent to face-template processing and the
              retention/deletion policy for optional attendance verification.
            </span>
          </label>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={!ready || !consent || busy || Boolean(capture)}
            onClick={begin}
          >
            Enroll with live camera
          </Button>
          {(statusError || (!loading && !status?.configured)) && (
            <Button
              secondary
              disabled={busy || Boolean(capture)}
              onClick={refresh}
            >
              Retry connection
            </Button>
          )}
          <Link
            href={`/${role}/attendance`}
            className="text-sm text-[#82cde6] underline underline-offset-4"
          >
            Open Attendance / manual alternative
          </Link>
        </div>
        <p role="status" className="mt-3 text-sm leading-6 text-zinc-400">
          {phase || blockedReason}
        </p>
        {enrollment?.enrolled && (
          <p className="mt-3 text-sm text-[#82cde6]">
            Enrollment active since {formattedTime(enrollment.enrolledAt)}.
            Expires {formattedTime(enrollment.expiresAt)}.
          </p>
        )}
        {!status?.configured && !loading && missing.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100">
            <p className="font-medium">Administrator setup needed</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {missing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {legacy && (
          <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100">
            This enrollment belongs to the former biometric provider.
            Recognition is disabled; your administrator must confirm provider
            cleanup before you enroll locally.
          </p>
        )}
        {capture && (
          <div className="mt-5">
            <LocalFaceCapture
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
          </div>
        )}
      </Panel>
      <details className="rounded-2xl border border-white/10 bg-[#111116] p-5">
        <summary className="cursor-pointer text-sm font-medium text-zinc-200">
          Read the full biometric consent and retention notice
        </summary>
        <div className="mt-4 space-y-3 text-sm leading-7 text-zinc-400">
          <p>
            {status?.consent?.notice ||
              "Your company’s biometric processing notice will appear here when the service is available. Enrollment stays disabled until the backend supplies the notice."}
          </p>
          {status?.consent?.version && (
            <p>Consent notice version: {status.consent.version}</p>
          )}
          <p>
            Enrollment and camera captures are separate from profile photos. No
            image upload is used as proof of face verification. Local
            recognition cannot establish robust liveness; photographs, replayed
            video or modified clients may defeat camera capture.
          </p>
          <p>
            Withdrawing consent removes the active local template. Attendance
            and audit records remain; operator-managed backups follow their
            separate retention schedule.
          </p>
        </div>
      </details>
      {removable && (
        <Panel
          title={
            legacy
              ? "Request former-provider cleanup"
              : "Delete face enrollment"
          }
        >
          <p className="mb-4 text-sm leading-6 text-zinc-400">
            {legacy
              ? "This disables recognition and requests cleanup; it does not claim provider-held data has been deleted."
              : "This removes your encrypted local template. Re-enrollment requires new consent and camera samples."}
          </p>
          <label className="mb-4 flex cursor-pointer items-start gap-3 text-sm leading-6 text-zinc-200">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-rose-400"
              checked={confirmDelete}
              onChange={(event) => setConfirmDelete(event.target.checked)}
              disabled={busy}
            />
            <span>
              I understand that I will use web attendance or HR corrections
              after withdrawing consent.
            </span>
          </label>
          <Button
            secondary
            disabled={!confirmDelete || busy || Boolean(capture)}
            onClick={remove}
          >
            {legacy
              ? "Withdraw consent and request cleanup"
              : "Withdraw consent and delete"}
          </Button>
        </Panel>
      )}
    </div>
  );
}
