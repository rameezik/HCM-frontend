"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  Button,
  Form,
  Message,
  Panel,
  Table,
  tag,
} from "@/components/WorkspaceUI";

function useRecords(path, version, identity) {
  const key = `${identity}:${path}:${version}`;
  const [state, setState] = useState({ key: null, data: null, error: "" });
  useEffect(() => {
    if (!path) return undefined;
    const controller = new AbortController();
    api(path, { signal: controller.signal })
      .then((data) => setState({ key, data, error: "" }))
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ key, data: null, error: error.message });
      });
    return () => controller.abort();
  }, [path, key]);
  return state.key === key
    ? { ...state, loading: false }
    : { data: null, error: "", loading: Boolean(path) };
}

function assignment(employee, department) {
  // PATCH validates the complete employee profile. Copy only writable fields,
  // never populated account data, photo metadata or role defaults.
  const fields = [
    "name",
    "email",
    "code",
    "joinDate",
    "exitDate",
    "status",
    "gender",
    "basic",
    "phone",
    "address",
  ];
  const body = Object.fromEntries(
    fields
      .filter((key) => employee[key] !== undefined)
      .map((key) => [key, employee[key]]),
  );
  return {
    ...body,
    department,
    designation: employee.designation?._id || employee.designation,
  };
}

export default function Departments({ user }) {
  const canManage = ["admin", "hr"].includes(user.role);
  const identity = `${user.company}:${user._id}`;
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  const departments = useRecords("/departments", version, identity);
  const [editor, setEditor] = useState({ mode: "create" });
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [remove, setRemove] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ error: "", success: "" });
  const selected = departments.data?.find((row) => row._id === selectedId);
  const members = useRecords(
    selectedId
      ? `/employees?${new URLSearchParams({ department: selectedId, page: String(page), limit: "25" })}`
      : null,
    version,
    identity,
  );
  const candidates = useRecords(
    selectedId && canManage
      ? `/employees?${new URLSearchParams({ search, limit: "100" })}`
      : null,
    version,
    identity,
  );
  const eligible = (candidates.data?.items || []).filter(
    (employee) => user.role === "admin" || employee.user?.role === "employee",
  );

  async function deleteDepartment() {
    if (!remove || busy) return;
    setBusy(true);
    setMessage({ error: "", success: "" });
    try {
      await api(`/departments/${remove._id}`, { method: "DELETE" });
      if (selectedId === remove._id) setSelectedId(null);
      setMessage({ error: "", success: `${remove.name} was removed.` });
      setRemove(null);
      refresh();
    } catch (error) {
      setMessage({ error: error.message, success: "" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Panel
        title="Department management"
        action={
          <div className="flex flex-wrap gap-2">
            <Button secondary onClick={refresh}>
              Refresh departments
            </Button>
            {canManage && (
              <Button
                onClick={() => {
                  setEditor({ mode: "create" });
                  setMessage({ error: "", success: "" });
                }}
              >
                Add department
              </Button>
            )}
          </div>
        }
      >
        <p className="text-sm leading-7 text-zinc-400">
          Create departments, assign your company&apos;s employees and keep
          their organization details up to date.
        </p>
        <Message error={message.error} success={message.success} />
      </Panel>

      {canManage && editor && (
        <Panel
          title={
            editor.mode === "edit" ? "Edit department" : "Add a department"
          }
        >
          <Form
            key={editor.department?._id || "new-department"}
            fields={[
              {
                name: "name",
                label: "Department name",
                minLength: 1,
                maxLength: 200,
                wide: true,
              },
            ]}
            initial={{ name: editor.department?.name || "" }}
            submitLabel={
              editor.mode === "edit" ? "Save department" : "Create department"
            }
            successMessage=""
            onCancel={() => setEditor(null)}
            onSubmit={async ({ name }) => {
              const normalized = name.trim();
              if (!normalized) throw new Error("Enter a department name.");
              const editing = editor.mode === "edit";
              await api(
                `/departments${editing ? `/${editor.department._id}` : ""}`,
                {
                  method: editing ? "PUT" : "POST",
                  body: { name: normalized },
                },
              );
              setEditor(null);
              setMessage({
                error: "",
                success: `${normalized} was ${editing ? "updated" : "created"}.`,
              });
              refresh();
            }}
          />
        </Panel>
      )}

      <Panel title="Company departments">
        <Message error={departments.error} />
        {departments.loading ? (
          <p role="status" className="text-sm text-zinc-400">
            Loading departments…
          </p>
        ) : departments.error ? (
          <Button secondary onClick={refresh}>
            Retry departments
          </Button>
        ) : (
          <Table
            rows={departments.data}
            empty="No departments yet. Use Add department to create the first one."
            columns={[
              { key: "name", label: "Department" },
              {
                key: "employeeCount",
                label: "Employees",
                render: (row) => row.employeeCount ?? "—",
              },
              {
                key: "actions",
                label: "Actions",
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      secondary
                      onClick={() => {
                        setSelectedId(row._id);
                        setPage(1);
                        setSearch("");
                      }}
                    >
                      View employees
                    </Button>
                    {canManage && (
                      <>
                        <Button
                          secondary
                          onClick={() =>
                            setEditor({ mode: "edit", department: row })
                          }
                        >
                          Edit
                        </Button>
                        <Button
                          secondary
                          disabled={busy}
                          onClick={() => {
                            setRemove(row);
                            setMessage({ error: "", success: "" });
                          }}
                        >
                          Remove
                        </Button>
                      </>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Panel>

      {remove && (
        <Panel title={`Remove ${remove.name}?`}>
          <p className="mb-5 text-sm leading-7 text-zinc-400">
            Only an unused department can be removed. Employees and payroll
            history are preserved; move employees to another department first.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button disabled={busy} onClick={deleteDepartment}>
              {busy ? "Removing…" : "Confirm removal"}
            </Button>
            <Button secondary disabled={busy} onClick={() => setRemove(null)}>
              Cancel
            </Button>
          </div>
        </Panel>
      )}

      {selectedId && (
        <Panel
          title={`Department employees${selected ? ` · ${selected.name}` : ""}`}
          action={
            <Button secondary onClick={() => setSelectedId(null)}>
              Close employees
            </Button>
          }
        >
          <Message error={members.error} />
          {members.loading ? (
            <p role="status" className="text-sm text-zinc-400">
              Loading department employees…
            </p>
          ) : (
            !members.error && (
              <>
                <Table
                  rows={members.data?.items}
                  empty="No employees are assigned to this department yet."
                  columns={[
                    { key: "name", label: "Employee" },
                    { key: "code", label: "Employee ID" },
                    { key: "email", label: "Email" },
                    {
                      key: "designation",
                      label: "Designation",
                      render: (row) => row.designation?.name || "—",
                    },
                    {
                      key: "status",
                      label: "Employment",
                      render: (row) => tag(row.status),
                    },
                  ]}
                />
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                  <p>
                    {members.data?.total ?? "—"} employees · Page {page}
                  </p>
                  <Button
                    secondary
                    disabled={page === 1}
                    onClick={() => setPage((value) => value - 1)}
                  >
                    Previous employees
                  </Button>
                  <Button
                    secondary
                    disabled={page * 25 >= (members.data?.total || 0)}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    Next employees
                  </Button>
                </div>
              </>
            )
          )}
          {canManage && (
            <div className="mt-6 space-y-5 border-t border-white/10 pt-5">
              <h3 className="font-medium text-zinc-200">
                Assign employee to this department
              </h3>
              <Form
                fields={[
                  { name: "search", label: "Find employee", optional: true },
                ]}
                submitLabel="Search employees"
                successMessage=""
                onSubmit={async ({ search = "" }) => setSearch(search.trim())}
              />
              <Message error={candidates.error} />
              {candidates.loading ? (
                <p role="status" className="text-sm text-zinc-400">
                  Loading available employees…
                </p>
              ) : eligible.length ? (
                <Form
                  key={`${selectedId}:${search}:${version}`}
                  fields={[
                    {
                      name: "employee",
                      label: "Employee to assign",
                      options: eligible.map((employee) => ({
                        value: employee._id,
                        label: `${employee.name} · ${employee.code}`,
                      })),
                    },
                  ]}
                  submitLabel="Assign department"
                  successMessage=""
                  onSubmit={async ({ employee: employeeId }) => {
                    const employee = eligible.find(
                      (row) => row._id === employeeId,
                    );
                    if (!employee)
                      throw new Error("Choose an available employee.");
                    // Read the current profile before submitting the complete
                    // validated PATCH, rather than resubmitting an old list row.
                    const latest = await api(`/employees/${employeeId}`);
                    if (!latest.employee)
                      throw new Error(
                        "The employee could not be loaded. Refresh and retry.",
                      );
                    await api(`/employees/${employeeId}`, {
                      method: "PATCH",
                      body: assignment(latest.employee, selectedId),
                    });
                    setMessage({
                      error: "",
                      success: `${employee.name} was assigned to ${selected?.name || "the department"}.`,
                    });
                    setPage(1);
                    refresh();
                  }}
                />
              ) : !candidates.error ? (
                <p className="text-sm text-zinc-400">
                  No permitted employees matched.{" "}
                  <Link
                    href={`/${user.role}/employees`}
                    className="text-[#82cde6] underline"
                  >
                    Create or manage employee accounts
                  </Link>
                  .
                </p>
              ) : null}
              <p className="text-xs leading-6 text-zinc-500">
                Search results show up to 100 employees. Refine the name,
                employee ID or email to find a specific account.
              </p>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
