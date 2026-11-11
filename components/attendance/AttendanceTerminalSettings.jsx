"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import EmployeePhoto from "@/components/EmployeePhoto";
import { api } from "@/lib/api";
import { Button, Form, Message, Panel, Table } from "@/components/WorkspaceUI";

const API = "/attendance-terminal-management";
const formatTime = (value) => (value ? new Date(value).toLocaleString() : "—");
const statusLabels = {
  ready: "Ready",
  photo_required: "Add a photo",
  account_inactive: "Account inactive",
  not_enabled: "Not enabled",
  expired: "Permission expired",
  photo_changed: "Photo changed — enable again",
};

function EmployeeSetup({
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
      setError(failure.message);
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
      setError(failure.message);
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

export default function AttendanceTerminalSettings() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pairing, setPairing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [revoking, setRevoking] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    Promise.all([
      api(`${API}/devices`, { signal: controller.signal }),
      api(
        `${API}/employees?page=${page}&limit=50&search=${encodeURIComponent(search)}`,
        { signal: controller.signal },
      ),
    ])
      .then(([devices, data]) => {
        if (!Array.isArray(devices) || !Array.isArray(data.employees))
          throw new Error("Attendance settings could not be loaded.");
        if (active) {
          setState({ ...data, devices });
          setError("");
        }
      })
      .catch((failure) => {
        if (!controller.signal.aborted && active) setError(failure.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [search, page, refresh]);

  function reload() {
    setLoading(true);
    setRefresh((value) => value + 1);
  }
  function saved(message) {
    setSelected(null);
    setSuccess(message);
    reload();
  }
  async function copy(value) {
    try {
      await navigator.clipboard.writeText(value);
      setSuccess("Terminal link copied.");
    } catch {
      setError("Select the displayed link and copy it manually.");
    }
  }
  async function revoke(device) {
    setRevoking(String(device._id || device.id));
    setError("");
    try {
      await api(`${API}/devices/${device._id || device.id}`, {
        method: "DELETE",
      });
      setPairing(null);
      setSuccess("Terminal disconnected.");
      reload();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setRevoking("");
    }
  }
  const currentEmployee =
    state?.employees.find((employee) => employee._id === selected?._id) ||
    selected;
  return (
    <div className="space-y-6">
      <Panel
        title="Attendance Terminal"
        action={
          <Link
            href="/attendance-terminal"
            target="_blank"
            className="text-sm text-[#82cde6] underline"
          >
            Open terminal
          </Link>
        }
      >
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-zinc-300">
          <li>
            Add an employee photo and enable face attendance with their
            permission.
          </li>
          <li>Connect the company’s attendance device using the link below.</li>
          <li>
            Employees open the terminal and scan. No employee sign-in is needed.
          </li>
        </ol>
        <p className="mt-4 text-sm text-zinc-400">
          Set the office location in{" "}
          <Link href="/admin/settings" className="text-[#82cde6] underline">
            Company settings
          </Link>{" "}
          before connecting a device.
        </p>
      </Panel>
      <Message error={error} success={success} />
      {state && !state.configured && (
        <Panel title="Face recognition needs setup">
          <p className="text-sm text-zinc-300">
            The server is missing the local face recognition files or encryption
            settings. Employee records and manual attendance remain available.
          </p>
          <p className="mt-3 text-sm text-amber-100">
            Missing:{" "}
            {state.missingConfiguration?.join(", ") || "Server configuration"}
          </p>
          <details className="mt-4 text-sm text-zinc-400">
            <summary className="cursor-pointer">Server setup</summary>
            <p className="mt-2">
              In HCM-backend, run <code>npm run setup:face</code> and{" "}
              <code>npm run setup:env</code>, then restart the backend. Keep the
              existing encryption key.
            </p>
          </details>
        </Panel>
      )}
      <Panel
        title="Employee photos"
        action={
          <Button secondary disabled={loading} onClick={reload}>
            Refresh
          </Button>
        }
      >
        <Form
          fields={[{ name: "search", label: "Find employee", optional: true }]}
          submitLabel="Search"
          successMessage=""
          onSubmit={async (body) => {
            const nextSearch = body.search || "";
            if (nextSearch === search && page === 1) reload();
            else {
              setPage(1);
              setSearch(nextSearch);
              setLoading(true);
            }
          }}
        />
        <div className="mt-5">
          {loading ? (
            <p role="status" className="text-sm text-zinc-400">
              Loading employees…
            </p>
          ) : (
            state && (
              <>
                <Table
                  rows={state.employees}
                  columns={[
                    {
                      key: "name",
                      label: "Employee",
                      render: (employee) => (
                        <div className="flex items-center gap-3">
                          <EmployeePhoto employee={employee} compact />
                          <div>
                            <p>{employee.name}</p>
                            <p className="text-xs text-zinc-400">
                              {employee.code}
                            </p>
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "faceAttendance",
                      label: "Face attendance",
                      render: (employee) =>
                        statusLabels[employee.faceAttendance?.state] ||
                        "Not enabled",
                    },
                    {
                      key: "actions",
                      label: "Action",
                      render: (employee) => (
                        <Button
                          secondary
                          onClick={() => {
                            setSelected(employee);
                            setSuccess("");
                          }}
                        >
                          Manage photo
                        </Button>
                      ),
                    },
                  ]}
                />
                {state.pages > 1 && (
                  <div className="mt-4 flex items-center gap-4">
                    <Button
                      secondary
                      disabled={page <= 1}
                      onClick={() => {
                        setPage((value) => value - 1);
                        setLoading(true);
                      }}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-zinc-400">
                      Page {page} of {state.pages}
                    </span>
                    <Button
                      secondary
                      disabled={page >= state.pages}
                      onClick={() => {
                        setPage((value) => value + 1);
                        setLoading(true);
                      }}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )
          )}
        </div>
      </Panel>
      {currentEmployee && (
        <Panel
          title={`Photo attendance · ${currentEmployee.name}`}
          action={
            <Button secondary onClick={() => setSelected(null)}>
              Close
            </Button>
          }
        >
          <EmployeeSetup
            key={`${currentEmployee._id}:${currentEmployee.photoUpdatedAt || "none"}`}
            employee={currentEmployee}
            consentNotice={state?.consent}
            configured={!loading && state?.configured}
            onRefresh={reload}
            onSaved={saved}
          />
        </Panel>
      )}
      <Panel title="Connect an attendance device">
        <Form
          fields={[{ name: "label", label: "Device name", maxLength: 80 }]}
          submitLabel="Create terminal link"
          successMessage=""
          onSubmit={async (body) => {
            const result = await api(`${API}/devices`, {
              method: "POST",
              body: { ...body, reusable: true },
            });
            if (!result.accessToken || !result.device)
              throw new Error("A terminal link was not returned. Try again.");
            setPairing({
              label: result.device.label,
              url: `${window.location.origin}/attendance-terminal#access=${encodeURIComponent(result.accessToken)}`,
              expiresAt: result.expiresAt,
            });
            reload();
          }}
        />
        {pairing && (
          <div className="mt-5 space-y-3 rounded-xl border border-cyan-300/20 p-4">
            <p className="font-medium">{pairing.label}</p>
            <label className="block text-sm text-zinc-300">
              Terminal connection link
              <input
                aria-label="Terminal connection link"
                readOnly
                value={pairing.url}
                onFocus={(event) => event.target.select()}
                className="input-field mt-2 w-full text-xs"
              />
            </label>
            <p className="text-sm text-zinc-400">
              This link works until {formatTime(pairing.expiresAt)} or until you
              disconnect the device. Share it only with your company.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button secondary onClick={() => copy(pairing.url)}>
                Copy terminal link
              </Button>
              <a
                href={pairing.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-[#007ba7] px-4 py-2.5 text-sm text-white"
              >
                Connect this device
              </a>
              <Button secondary onClick={() => setPairing(null)}>
                Hide link
              </Button>
            </div>
          </div>
        )}
      </Panel>
      <Panel title="Connected devices">
        {state && (
          <Table
            rows={state.devices}
            columns={[
              { key: "label", label: "Device" },
              {
                key: "state",
                label: "Status",
                render: (device) =>
                  ({
                    paired: "Connected",
                    pending: "Awaiting connection",
                    revoked: "Disconnected",
                  })[device.state] || device.state,
              },
              {
                key: "credentialExpiresAt",
                label: "Access expires",
                render: (device) => formatTime(device.credentialExpiresAt),
              },
              {
                key: "actions",
                label: "Action",
                render: (device) =>
                  device.state !== "revoked" && (
                    <Button
                      secondary
                      disabled={Boolean(revoking)}
                      onClick={() => revoke(device)}
                    >
                      {revoking === String(device._id || device.id)
                        ? "Disconnecting…"
                        : "Disconnect device"}
                    </Button>
                  ),
              },
            ]}
          />
        )}
      </Panel>
    </div>
  );
}
