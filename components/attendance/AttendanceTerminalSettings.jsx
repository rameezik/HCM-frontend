"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button, Message, Panel } from "@/components/WorkspaceUI";
import EmployeePhotoEditor from "./terminal/settings/EmployeePhotoEditor";
import TerminalEmployeeList from "./terminal/settings/TerminalEmployeeList";
import TerminalReadiness from "./terminal/settings/TerminalReadiness";
import {
  TerminalLinkPanel,
  ConnectedTerminalList,
} from "./terminal/settings/TerminalConnections";

const API = "/attendance-terminal-management";
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

  async function searchEmployees(body) {
    const nextSearch = body.search || "";
    if (nextSearch === search && page === 1) reload();
    else {
      setPage(1);
      setSearch(nextSearch);
      setLoading(true);
    }
  }

  function changePage(nextPage) {
    setPage(nextPage);
    setLoading(true);
  }

  function managePhoto(employee) {
    setSelected(employee);
    setSuccess("");
  }

  async function createLink(body) {
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
        <TerminalReadiness
          missingConfiguration={state.missingConfiguration}
          loading={loading}
          onRecheck={reload}
        />
      )}
      <TerminalEmployeeList
        settings={state}
        loading={loading}
        page={page}
        onRefresh={reload}
        onSearch={searchEmployees}
        onManagePhoto={managePhoto}
        onPageChange={changePage}
      />
      {currentEmployee && (
        <Panel
          title={`Photo attendance · ${currentEmployee.name}`}
          action={
            <Button secondary onClick={() => setSelected(null)}>
              Close
            </Button>
          }
        >
          <EmployeePhotoEditor
            key={`${currentEmployee._id}:${currentEmployee.photoUpdatedAt || "none"}`}
            employee={currentEmployee}
            consentNotice={state?.consent}
            configured={!loading && state?.configured}
            onRefresh={reload}
            onSaved={saved}
          />
        </Panel>
      )}
      <TerminalLinkPanel
        pairing={pairing}
        onCreate={createLink}
        onCopy={copy}
        onHideLink={() => setPairing(null)}
      />
      <ConnectedTerminalList
        devices={state?.devices}
        revoking={revoking}
        onDisconnect={revoke}
      />
    </div>
  );
}
