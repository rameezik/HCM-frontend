"use client";

import { useState } from "react";
import EmployeePhoto from "@/components/EmployeePhoto";
import { api } from "@/lib/api";
import { Button, Message } from "@/components/WorkspaceUI";
import { getEnrollmentError } from "./enrollmentErrors";

const API = "/attendance-terminal-management";

export default function EmployeePhotoEditor({
  employee,
  consentNotice,
  configured,
  onRefresh,
  onSaved,
}) {
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function enable() {
    if (!consent || !employee.photoUpdatedAt || !consentNotice?.version) return;
    setBusy(true);
    setError("");
    try {
      await api(`${API}/employees/${employee._id}/enrollment`, {
        method: "POST",
        body: { consent: true, consentVersion: consentNotice.version },
      });
      onSaved(`Face attendance enabled for ${employee.name}.`);
    } catch (failure) {
      const diagnostic = getEnrollmentError(failure);
      setError(diagnostic.message);
      if (diagnostic.refreshReadiness) onRefresh?.();
    } finally {
      setBusy(false);
    }
  }
  async function disable() {
    setBusy(true);
    setError("");
    try {
      await api(`${API}/employees/${employee._id}/enrollment`, {
        method: "DELETE",
      });
      onSaved(`Face attendance disabled for ${employee.name}.`);
    } catch (failure) {
      const diagnostic = getEnrollmentError(failure);
      setError(diagnostic.message);
      if (diagnostic.refreshReadiness) onRefresh?.();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <EmployeePhoto employee={employee} canEdit onChanged={onRefresh} />
      <p className="text-sm text-zinc-300">
        Use a clear, recent photo with one face. The terminal will compare
        camera scans with this photo.
      </p>
      <label className="flex items-start gap-3 rounded-xl border border-white/10 p-4 text-sm leading-6 text-zinc-300">
        <input
          type="checkbox"
          checked={consent}
          disabled={busy}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-1 accent-[#007ba7]"
        />
        I have the employee’s permission to use this photo for face attendance.
      </label>
      <details className="text-sm text-zinc-400">
        <summary className="cursor-pointer">
          Employee consent and data use
        </summary>
        <p className="mt-3 leading-6">{consentNotice?.notice}</p>
      </details>
      <Message error={error} />
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={
            busy ||
            !configured ||
            !consent ||
            !employee.photoUpdatedAt ||
            employee.faceAttendance?.state === "account_inactive"
          }
          onClick={enable}
        >
          {busy ? "Saving…" : "Enable face attendance"}
        </Button>
        {employee.faceAttendance?.expiresAt && (
          <Button secondary disabled={busy} onClick={disable}>
            Disable face attendance
          </Button>
        )}
      </div>
    </div>
  );
}
