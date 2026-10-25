"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Button,
  Form,
  Message,
  Panel,
  Table,
  tag,
} from "@/components/WorkspaceUI";

const time = (value) => (value ? new Date(value).toLocaleString() : "—");
const validExpiry = (value) =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

export default function KioskManagement() {
  const [search, setSearch] = useState("");
  const [epoch, setEpoch] = useState(0),
    [state, setState] = useState({
      epoch: -1,
      search: null,
      devices: [],
      employees: [],
      error: "",
    });
  const [pairing, setPairing] = useState(null),
    [grant, setGrant] = useState(null),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [revoking, setRevoking] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api("/kiosk-management/devices", { signal: controller.signal }),
      api(
        `/employees?limit=100${search ? `&search=${encodeURIComponent(search)}` : ""}`,
        { signal: controller.signal },
      ),
    ])
      .then(([devices, employees]) => {
        if (!Array.isArray(devices) || !Array.isArray(employees.items))
          throw new Error(
            "The kiosk setup service returned an invalid response. Retry or contact your administrator.",
          );
        setState({ epoch, search, devices, employees: employees.items, error: "" });
      })
      .catch((failure) => {
        if (!controller.signal.aborted)
          setState({
            epoch,
            search,
            devices: [],
            employees: [],
            error: failure.message,
          });
      });
    return () => controller.abort();
  }, [epoch, search]);
  const loading = state.epoch !== epoch || state.search !== search;
  const eligible = state.employees.filter(
    (employee) =>
      employee.photoUpdatedAt &&
      employee.status !== "exited" &&
      employee.user?.active === true,
  );

  async function copy(value, label) {
    setError("");
    setSuccess("");
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error(
          "Clipboard access is unavailable. Select the displayed value and copy it manually.",
        );
      await navigator.clipboard.writeText(value);
      setSuccess(`${label} copied.`);
    } catch (failure) {
      setError(
        failure.message || "Copy failed. Select and copy the value manually.",
      );
    }
  }
  async function revoke(device) {
    setRevoking(device._id || device.id);
    setError("");
    setSuccess("");
    try {
      const result = await api(
        `/kiosk-management/devices/${device._id || device.id}`,
        { method: "DELETE" },
      );
      if (result.revoked !== true)
        throw new Error(
          "The service did not confirm revocation. Refresh the device list before retrying.",
        );
      if (
        String(pairing?.device?._id || pairing?.device?.id) ===
        String(device._id || device.id)
      )
        setPairing(null);
      setSuccess(
        "Kiosk access revoked. This device can no longer record attendance.",
      );
      setEpoch((value) => value + 1);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setRevoking("");
    }
  }
  return (
    <div className="space-y-6">
      <Panel title="Set up a shared attendance kiosk">
        <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-zinc-300">
          <li>
            Upload each employee’s profile photo in{" "}
            <Link href="/admin/employees" className="text-[#82cde6] underline">
              Employees
            </Link>
            . A profile photo alone does not create a biometric enrollment.
          </li>
          <li>
            Configure office coordinates in{" "}
            <Link href="/admin/settings" className="text-[#82cde6] underline">
              Company settings
            </Link>
            , then create a kiosk pairing link below and open it on the
            company’s trusted shared device. Pairing is company-scoped, expires
            after 10 minutes and can be used once.
          </li>
          <li>
            Issue a one-time enrollment code for an eligible employee. At the
            kiosk, the employee reads and explicitly accepts biometric consent,
            then captures camera samples for actual local identity verification.
          </li>
          <li>
            After consented enrollment, the paired kiosk can identify enrolled
            employees and record check-in or check-out using backend attendance
            rules. No employee login is required on that shared device.
          </li>
        </ol>
        <p className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100">
          Use a supervised company device over HTTPS. Pairing links and
          enrollment codes grant access: share them only with the intended
          operator or employee. Local face matching does not provide robust
          liveness or replay protection. Authorized non-biometric attendance
          remains available.
        </p>
      </Panel>
      <Message error={error || state.error} success={success} />
      <Panel title="Create a kiosk pairing link">
        <Form
          fields={[{ name: "label", label: "Kiosk name", maxLength: 100 }]}
          submitLabel="Create pairing link"
          successMessage=""
          onSubmit={async (body) => {
            setError("");
            setSuccess("");
            setPairing(null);
            const result = await api("/kiosk-management/devices", {
              method: "POST",
              body,
            });
            if (
              !result.device ||
              typeof result.pairingToken !== "string" ||
              !validExpiry(result.expiresAt)
            )
              throw new Error(
                "The service did not return a valid pairing link. Refresh the device list before retrying.",
              );
            setPairing({
              device: result.device,
              url: `${window.location.origin}/attendance-kiosk#pair=${encodeURIComponent(result.pairingToken)}`,
              expiresAt: result.expiresAt,
            });
            setEpoch((value) => value + 1);
          }}
        />
        {pairing && (
          <div className="mt-5 space-y-3 rounded-xl border border-cyan-300/20 p-4">
            <p className="font-medium">Pair {pairing.device.label}</p>
            <p className="text-sm text-zinc-400">
              Expires {time(pairing.expiresAt)}. This link is shown only now and
              is not saved in browser storage. Creating or copying a link does
              not pair the device.
            </p>
            <label className="block text-sm">
              <span className="mb-2 block text-zinc-300">
                One-time pairing link
              </span>
              <input
                aria-label="One-time pairing link"
                readOnly
                value={pairing.url}
                onFocus={(event) => event.target.select()}
                className="input-field w-full text-xs"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <Button
                secondary
                onClick={() => copy(pairing.url, "Pairing link")}
              >
                Copy pairing link
              </Button>
              <a
                href={pairing.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-[#007ba7] px-4 py-2.5 text-sm text-white"
              >
                Open public kiosk
              </a>
              <Button secondary onClick={() => setPairing(null)}>
                Hide pairing link
              </Button>
            </div>
          </div>
        )}
      </Panel>
      <Panel title="Issue an employee enrollment code">
        <p className="mb-4 text-sm leading-6 text-zinc-400">
          Only employees with an uploaded profile photo, active employment and
          an active linked login are listed. The code expires after 15 minutes
          and requires the employee’s explicit consent at the kiosk. No
          templates are created from the employee directory automatically.
        </p>
        <div className="mb-5">
          <Form
            fields={[
              {
                name: "search",
                label: "Find employee by name, ID or email",
                optional: true,
              },
            ]}
            submitLabel="Find employee"
            successMessage=""
            onSubmit={async (body) => {
              setSearch(body.search || "");
            }}
          />
        </div>
        <Form
          fields={[
            {
              name: "employee",
              label: "Employee to enroll",
              options: eligible.map((employee) => ({
                value: employee._id,
                label: `${employee.name} · ${employee.code} · Photo uploaded`,
              })),
            },
          ]}
          disabled={loading || !eligible.length}
          submitLabel="Issue enrollment code"
          successMessage=""
          onSubmit={async (body) => {
            setError("");
            setSuccess("");
            setGrant(null);
            const result = await api("/kiosk-management/enrollment-grants", {
              method: "POST",
              body,
            });
            if (
              typeof result.code !== "string" ||
              !validExpiry(result.expiresAt) ||
              !result.employee?._id
            )
              throw new Error(
                "The service did not return a valid enrollment code. Retry or contact your administrator.",
              );
            setGrant(result);
          }}
        />
        {!loading && !eligible.length && (
          <p className="mt-4 text-sm text-zinc-400">
            No eligible employees are available. Create an active employee and
            upload their profile photo first.
          </p>
        )}
        {grant && (
          <div className="mt-5 space-y-3 rounded-xl border border-cyan-300/20 p-4">
            <p className="font-medium">
              Enrollment code for {grant.employee.name} · {grant.employee.code}
            </p>
            <label className="block text-sm">
              <span className="mb-2 block text-zinc-300">
                One-time enrollment code
              </span>
              <input
                aria-label="One-time enrollment code"
                readOnly
                value={grant.code}
                onFocus={(event) => event.target.select()}
                className="input-field w-full font-mono tracking-wide"
              />
            </label>
            <p className="text-sm text-zinc-400">
              Expires {time(grant.expiresAt)}. Share securely with this
              employee. Refreshing this page hides the code.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                secondary
                onClick={() => copy(grant.code, "Enrollment code")}
              >
                Copy enrollment code
              </Button>
              <Button secondary onClick={() => setGrant(null)}>
                Hide enrollment code
              </Button>
            </div>
          </div>
        )}
      </Panel>
      <Panel
        title="Company kiosk devices"
        action={
          <Button
            secondary
            disabled={loading}
            onClick={() => setEpoch((value) => value + 1)}
          >
            Refresh devices
          </Button>
        }
      >
        {loading ? (
          <p role="status" className="text-sm text-zinc-400">
            Loading kiosk devices…
          </p>
        ) : (
          !state.error && (
            <Table
              rows={state.devices}
              columns={[
                { key: "label", label: "Kiosk" },
                {
                  key: "state",
                  label: "Status",
                  render: (row) => tag(row.state),
                },
                {
                  key: "pairedAt",
                  label: "Paired",
                  render: (row) => time(row.pairedAt),
                },
                {
                  key: "credentialExpiresAt",
                  label: "Device access expires",
                  render: (row) => time(row.credentialExpiresAt),
                },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) =>
                    row.state !== "revoked" && (
                      <Button
                        secondary
                        disabled={Boolean(revoking)}
                        onClick={() => revoke(row)}
                      >
                        {revoking === String(row._id || row.id)
                          ? "Revoking…"
                          : "Revoke device"}
                      </Button>
                    ),
                },
              ]}
            />
          )
        )}
        <p className="mt-4 text-xs leading-5 text-zinc-400">
          Only a successfully paired, unexpired and unrevoked device credential
          can use the public kiosk. Device pairing does not sign an employee
          into their personal workspace.
        </p>
      </Panel>
    </div>
  );
}
