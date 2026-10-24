"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button, Message, Panel } from "@/components/WorkspaceUI";
import { LiveFaceCapture } from "@/components/attendance/FaceVerification";
import {
  biometricError,
  notifyBiometricEnrollmentChanged,
  requestCameraPermission,
  useBiometricStatus,
} from "@/lib/biometrics";

const formattedTime = (value) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not available";
export default function BiometricEnrollment({ user }) {
  const linked = !user || Boolean(user.employee);
  const {
    status,
    loading,
    error: statusError,
    refresh,
  } = useBiometricStatus(linked);
  const [consent, setConsent] = useState(false),
    [capture, setCapture] = useState(null),
    [busy, setBusy] = useState(false),
    [phase, setPhase] = useState(""),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [confirmDelete, setConfirmDelete] = useState(false);
  const role = user?.role === "hr" ? "hr" : "employee";
  const enrollment = status?.enrollment;
  const legacy = [
    "legacy-enrollment-requires-cleanup",
    "legacy-cleanup-required",
  ].includes(enrollment?.status);
  const removable =
    enrollment?.enrolled ||
    legacy ||
    [
      "active",
      "expired",
      "deleting",
      "delete_failed",
      "deletion-pending",
    ].includes(enrollment?.status);
  async function begin() {
    if (legacy || !consent || !status?.consent?.version) return;
    setBusy(true);
    setError("");
    setSuccess("");
    setPhase("Requesting access to your camera…");
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
    setPhase(
      "The backend is detecting, aligning and embedding your face locally, then encrypting your enrollment…",
    );
    try {
      await api("/biometrics/enrollment", {
        method: "POST",
        body: { challengeId: capture.challenge.challengeId, samples },
      });
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
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await api("/biometrics/enrollment", { method: "DELETE" });
      if (result?.deleted === false)
        setSuccess(
          result.message ||
            "Consent withdrawn. Face attendance remains disabled while enrollment cleanup is pending.",
        );
      else
        setSuccess(
          "Your enrollment was deleted. Face attendance is unavailable until you choose to enroll again.",
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
  if (!linked)
    return (
      <Panel title="Face enrollment">
        <p className="text-sm text-zinc-400">
          Your account needs a linked employee profile. Ask your company
          administrator to link it; you can continue using the rest of your
          workspace.
        </p>
      </Panel>
    );
  return (
    <div className="space-y-6">
      <Panel
        title="Your face enrollment"
        action={
          <Button secondary disabled={busy || loading} onClick={refresh}>
            Refresh status
          </Button>
        }
      >
        <p className="mb-5 text-sm leading-7 text-zinc-400">
          Face attendance is optional. Camera samples are detected, aligned and
          converted into face embeddings locally on the application server.
          Your encrypted template belongs to your employee account and company.
          The backend independently verifies identity before saving attendance.
        </p>
        <Message error={statusError || error} success={success} />
        {loading ? (
          <p role="status" className="text-sm text-zinc-400">
            Loading enrollment status…
          </p>
        ) : (
          status && (
            <>
              <div className="grid gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Enrollment
                  </p>
                  <p className="mt-2 text-sm text-[#82cde6]">
                    {legacy
                      ? "Legacy enrollment: cleanup required"
                      : enrollment?.enrolled
                      ? "Active"
                      : enrollment?.status
                          ?.replaceAll("_", " ")
                          .replaceAll("-", " ") || "Not enrolled"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Enrolled
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">
                    {formattedTime(enrollment?.enrolledAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Expires
                  </p>
                  <p className="mt-2 text-sm text-zinc-300">
                    {formattedTime(enrollment?.expiresAt)}
                  </p>
                </div>
              </div>
              {legacy && (
                <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100">
                  <p className="font-medium">Former provider cleanup required</p>
                  <p className="mt-2">
                    This enrollment belongs to the previous biometric provider
                    and cannot be deleted by the local engine. Face attendance
                    and re-enrollment remain disabled. Ask your administrator
                    to confirm deletion at the former provider and resolve the
                    preserved cleanup record before enrolling locally.
                  </p>
                </div>
              )}
              {!status.configured && (
                <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100">
                  <p className="font-medium">
                    Local face verification setup is incomplete
                  </p>
                  <p className="mt-2">
                    {status.unavailableReason ||
                      "Local recognition model files and an encryption key are required before enrollment or face attendance can run."}
                  </p>
                  <p className="mt-2">
                    No recognition result is simulated. You can use
                    non-biometric attendance while your administrator completes
                    the integration.
                  </p>
                </div>
              )}
            </>
          )
        )}
        <Link
          href={`/${role}/attendance`}
          className="mt-5 inline-block text-sm text-[#82cde6] underline underline-offset-4"
        >
          Return to web attendance and HR correction options
        </Link>
      </Panel>
      <Panel title="Consent and data retention">
        <div className="space-y-3 text-sm leading-7 text-zinc-400">
          <p>
            {status?.consent?.notice ||
              "Your company must provide its biometric notice before enrollment is available. Face attendance is optional and a non-biometric alternative remains available."}
          </p>
          <p>
            The application does not retain raw face photographs. Face
            embeddings are encrypted in MongoDB and camera frames are processed
            transiently on this application’s server. Nothing is sent to a
            cloud biometric provider. Local recognition does not include
            reliable liveness detection: photographs, video replay and modified
            clients may defeat the camera capture flow.
          </p>
          {status?.consent?.retentionDays && (
            <p>
              Enrollment expires after {status.consent.retentionDays} days.
              Expired or withdrawn enrollment is disabled for attendance and
              its encrypted template is deleted from the active database. Normal
              attendance and non-biometric audit records remain available.
            </p>
          )}
          <p>
            You can withdraw consent and request deletion below. Re-enrollment
            requires another explicit consent and a new live verification;
            deleting enrollment does not remove your normal attendance records.
          </p>
        </div>
        {!enrollment?.enrolled && !removable && (
          <div className="mt-5 space-y-5">
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-zinc-200">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[#007ba7]"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                disabled={busy || Boolean(capture) || !status?.configured}
              />
              <span>
                I voluntarily consent to face-template processing and the
                retention/deletion policy above for optional attendance
                verification.
                {status?.consent?.version && (
                  <span className="mt-1 block text-xs text-zinc-500">
                    Consent notice version: {status.consent.version}
                  </span>
                )}
              </span>
            </label>
            <Button
              disabled={
                !consent ||
                !status?.configured ||
                !status?.consent?.version ||
                busy ||
                Boolean(capture)
              }
              onClick={begin}
            >
              Enroll with live camera
            </Button>
          </div>
        )}
        {removable && (
          <div className="mt-6 rounded-xl border border-rose-300/15 p-4">
            <h3 className="font-medium">
              {legacy ? "Withdraw consent and request legacy cleanup" : "Withdraw consent and delete enrollment"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {legacy
                ? "This withdraws consent and requests administrator cleanup. It does not confirm deletion at the former provider."
                : "This disables face attendance and removes your encrypted local enrollment. You can enroll again with new consent after deletion."}
            </p>
            <label className="my-4 flex cursor-pointer items-start gap-3 text-sm text-zinc-200">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-rose-400"
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
              disabled={!confirmDelete || busy}
              onClick={remove}
            >
              {legacy ? "Withdraw consent and request cleanup" : "Withdraw consent and delete"}
            </Button>
          </div>
        )}
      </Panel>
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
