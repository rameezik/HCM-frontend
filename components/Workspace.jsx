"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AttendanceAnalytics from "@/components/attendance/AttendanceAnalytics";
import FaceVerification from "@/components/attendance/FaceVerification";
import BiometricEnrollment from "@/components/attendance/BiometricEnrollment";
import { CompanyOverview, EmployeeOverview, WorkspaceActions } from '@/components/CompanyOverview';
import { api } from "@/lib/api";
import {
  Panel,
  Form,
  Message,
  Button,
  Table,
  money,
  tag,
} from "@/components/WorkspaceUI";
const isoToday = () => new Date().toISOString().slice(0, 10);
const monthNow = () => isoToday().slice(0, 7);
const nameColumn = {
  key: "employee",
  label: "Employee",
  render: (r) => r.employee?.name || "—",
};
const dateTime = (d) =>
  d ? new Date(d).toLocaleString("en-GB", { timeZone: "UTC" }) : "—";
function useResource(path) {
  const [state, setState] = useState({
    path: null,
    data: null,
    error: "",
    errorStatus: null,
  });
  const [epoch, setEpoch] = useState(0);
  const refresh = useCallback(() => setEpoch((v) => v + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    if (path)
      api(path, { signal: controller.signal })
        .then((data) => setState({ path, data, error: "", errorStatus: null }))
        .catch((e) => {
          if (!controller.signal.aborted)
            setState({
              path,
              data: null,
              error: e.message,
              errorStatus: e.status,
            });
        });
    return () => controller.abort();
  }, [path, epoch]);
  return {
    data: state.path === path ? state.data : null,
    error: state.path === path ? state.error : "",
    errorStatus: state.path === path ? state.errorStatus : null,
    loading: state.path !== path,
    refresh,
  };
}
function Resource({ resource, children }) {
  return resource.error ? (
    <Message error={resource.error} />
  ) : resource.loading ? (
    <p role="status" className="py-6 text-zinc-400">
      Loading records…
    </p>
  ) : (
    children
  );
}
function useAction(refresh) {
  const [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false);
  async function act(path, method = "POST", body) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await api(path, { method, ...(body === undefined ? {} : { body }) });
      refresh?.();
      window.dispatchEvent(new Event("attendance-updated"));
      setSuccess("Saved successfully.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return { act, error, success, busy };
}
function Password({ onChanged }) {
  return (
    <Panel title="Change password">
      <p className="mb-5 text-sm text-zinc-400">
        Temporary passwords must be changed before accessing your workspace. Use
        at least 12 characters.
      </p>
      <Form
        fields={[
          {
            name: "currentPassword",
            label: "Current password",
            type: "password",
            autoComplete: "current-password",
          },
          {
            name: "password",
            label: "New password",
            type: "password",
            minLength: 12,
            autoComplete: "new-password",
          },
        ]}
        onSubmit={async (body) => {
          const user = await api("/auth/password", { method: "POST", body });
          onChanged(user);
        }}
        submitLabel="Change password"
      />
    </Panel>
  );
}
export default function Workspace({ role, view = "dashboard" }) {
  const router = useRouter(),
    identity = useResource("/auth/me");
  const user = identity.data;
  const [logoutError, setLogoutError] = useState("");
  useEffect(() => {
    if (identity.errorStatus === 401) router.replace("/login");
    else if (user && user.role !== role)
      router.replace(`/${user.role}/dashboard`);
  }, [identity.errorStatus, user, role, router]);
  if (identity.error && identity.errorStatus !== 401)
    return (
      <main className="mx-auto w-full max-w-xl p-10">
        <Panel title="Your workspace could not be loaded">
          <Message error={identity.error} />
          <Button secondary onClick={identity.refresh}>
            Retry connection
          </Button>
        </Panel>
      </main>
    );
  if (!user || user.role !== role)
    return (
      <p role="status" className="p-10">
        Opening your workspace…
      </p>
    );
  const content = {
    dashboard: <Dashboard user={user} />,
    employees: <Employees user={user} />,
    profile: <Profile user={user} />,
    attendance: <Attendance user={user} />,
    "face-enrollment": <BiometricEnrollment user={user} />,
    leaves: <Leaves user={user} />,
    payroll: <Payroll user={user} />,
    payslips: <Payroll user={user} />,
    users: <Users user={user} />,
    settings: <Settings user={user} />,
    departments: <Catalog kind="departments" user={user} />,
    designations: <Catalog kind="designations" user={user} />,
    "leave-types": <Catalog kind="leave-types" user={user} />,
    holidays: <Catalog kind="holidays" user={user} />,
    "audit-logs": <Audit />,
    announcements: <Announcements user={user} />,
    notifications: <Notifications />,
    assistant: <Assistant />,
    password: <Password onChanged={identity.refresh} />,
  };
  return (
    <DashboardLayout role={role}>
      <div className="space-y-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[.2em] text-[#4bb8dc]">
              {role} workspace
            </p>
            <h1 className="text-3xl font-semibold capitalize tracking-tight">
              {view.replaceAll("-", " ")}
              <span className="text-[#ff2d95]">.</span>
            </h1>
            <p className="mt-2 text-sm text-zinc-400">Welcome, {user.name}</p>
          </div>
          <div className="flex gap-2">
            <Button secondary onClick={() => router.push(`/${role}/password`)}>
              Password
            </Button>
            <Button
              secondary
              onClick={async () => {
                try {
                  await api("/auth/logout", { method: "POST" });
                  router.replace("/login");
                } catch (e) {
                  setLogoutError(e.message);
                }
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
        <Message error={logoutError} />
        {user.mustChangePassword ? (
          <Password onChanged={identity.refresh} />
        ) : (
          content[view] || <Message error="This page is unavailable." />
        )}
      </div>
    </DashboardLayout>
  );
}
function DateFilters({ onChange, initial = {} }) {
  return (
    <Form
      key={JSON.stringify(initial)}
      initial={{ start: `${monthNow()}-01`, end: isoToday(), ...initial }}
      fields={[
        { name: "start", label: "From (UTC)", type: "date" },
        { name: "end", label: "Through (UTC)", type: "date" },
        ...(initial.department !== undefined
          ? [{ name: "department", label: "Department ID", optional: true }]
          : []),
      ]}
      submitLabel="Apply filters"
      successMessage="Filters applied."
      onSubmit={async (body) => onChange(body)}
    />
  );
}
function Dashboard({ user }) {
  const ai = useResource("/ai/status");
  const [filters, setFilters] = useState({
    start: `${monthNow()}-01`,
    end: isoToday(),
    ...(user.role !== "employee" ? { department: "" } : {}),
  });
  const stats = useResource(
    `/dashboard?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v))}`,
  );
  const [summary, setSummary] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const d = stats.data;
  const refreshStats = stats.refresh;
  useEffect(() => {
    const refresh = () => refreshStats();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 15000);
    window.addEventListener('attendance-updated', refresh);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('attendance-updated', refresh); window.removeEventListener('focus', refresh); };
  }, [refreshStats]);
  return (
    <div className="space-y-6">
      <WorkspaceActions user={user} />
      {user.role === 'employee' ? (
        <>
          <EmployeeOverview user={user} />
          <Panel title="Face-verified attendance"><FaceVerification user={user} onRecorded={stats.refresh} /></Panel>
        </>
      ) : <Resource resource={stats}><CompanyOverview summary={d?.companySummary} /></Resource>}
      <AttendanceAnalytics user={user} />
      <Panel title="Reporting period">
        <DateFilters initial={filters} onChange={setFilters} />
      </Panel>
      <Resource resource={stats}>
        {d && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(user.role === "employee"
                ? [
                    ["Hours this week / 40", d.weeklyHours || 0],
                    ["Late count", d.lateCount],
                    ["Attendance rate", `${d.attendanceRate}%`],
                    [
                      "Latest payslip",
                      d.lastPayslip
                        ? money(d.lastPayslip.net)
                        : "No payslip yet",
                    ],
                  ]
                : user.role === "admin"
                  ? [
                      ["Headcount", d.headcount],
                      ["Attrition YTD", `${d.attritionYTD}%`],
                      ["Payroll gross", money(d.payrollGross)],
                      ["Average salary", money(d.averageSalary)],
                    ]
                  : [
                      ["Headcount", d.headcount],
                      ["Present today", d.presentToday],
                      ["On leave today", d.onLeaveToday],
                      ["Late today", d.lateToday],
                      ["Pending approvals", d.pendingApprovals],
                      ["Attendance rate", `${d.attendanceRate}%`],
                      ["Absenteeism", `${d.absenteeism}%`],
                      ["Late percentage", `${d.latePercent}%`],
                    ]
              ).map(([label, value]) => (
                <Panel key={label} title={label}>
                  <p className="text-3xl font-semibold text-[#82cde6]">
                    {value}
                  </p>
                </Panel>
              ))}
            </div>
            {user.role === "employee" && (
              <>
                <Panel title="Authorized attendance without face">
                  <CheckButtons onChange={stats.refresh} />
                </Panel>
                <Panel title="Leave remaining">
                  <Table
                    rows={d.leaveBalance}
                    columns={[
                      { key: "name", label: "Type" },
                      {
                        key: "remaining",
                        render: (r) => (r.unpaid ? "Unlimited" : r.remaining),
                      },
                      { key: "used" },
                      { key: "pending" },
                    ]}
                  />
                </Panel>
              </>
            )}
            <Panel title="Attendance trend">
              <TrendChart rows={d.trend} />
              <Table
                rows={d.trend}
                columns={["date", "present", "late", "absent", "onLeave"].map(
                  (key) => ({ key }),
                )}
              />
            </Panel>
            {user.role !== "employee" && (
              <>
                <Panel title="Headcount and salary by department">
                  <Table
                    rows={d.byDepartment}
                    columns={[
                      { key: "name" },
                      { key: "count", label: "Headcount" },
                      {
                        key: "averageSalary",
                        render: (r) => money(r.averageSalary),
                      },
                    ]}
                  />
                </Panel>
                <Panel title="Attendance by department">
                  <Table
                    rows={d.departmentAttendance}
                    columns={[
                      { key: "name" },
                      { key: "expectedDays" },
                      { key: "absent" },
                      { key: "leaveDays" },
                      { key: "late" },
                      {
                        key: "absenteeism",
                        render: (r) => `${r.absenteeism}%`,
                      },
                      {
                        key: "latePercent",
                        render: (r) => `${r.latePercent}%`,
                      },
                    ]}
                  />
                </Panel>
                <Panel title="Leave utilization">
                  <Table
                    rows={d.leaveUtilization}
                    columns={[
                      { key: "name" },
                      { key: "department" },
                      { key: "approvedDays" },
                      { key: "quota", label: "Quota per employee" },
                      {
                        key: "utilization",
                        render: (r) =>
                          r.utilization === null
                            ? "Unlimited"
                            : `${r.utilization}%`,
                      },
                    ]}
                  />
                </Panel>
                <Panel title="Top five late-comers">
                  <Table
                    rows={d.topLateComers}
                    columns={[
                      { key: "name" },
                      { key: "code" },
                      { key: "count" },
                    ]}
                  />
                </Panel>
                <Panel title="Payroll by month and department">
                  <Table
                    rows={d.payroll}
                    columns={[
                      { key: "month", render: (r) => r._id.month },
                      { key: "department", render: (r) => r._id.department },
                      { key: "gross", render: (r) => money(r.gross) },
                      { key: "net", render: (r) => money(r.net) },
                    ]}
                  />
                </Panel>
                <Panel title="Salary by designation">
                  <Table
                    rows={d.byDesignation}
                    columns={[
                      { key: "name" },
                      { key: "count" },
                      {
                        key: "averageSalary",
                        render: (r) => money(r.averageSalary),
                      },
                    ]}
                  />
                </Panel>
                <div className="grid gap-5 md:grid-cols-2">
                  <Panel title="Gender distribution">
                    <Table
                      rows={d.gender}
                      columns={[
                        { key: "_id", label: "Gender" },
                        { key: "count" },
                      ]}
                    />
                  </Panel>
                  <Panel title="Tenure (years; lower bound)">
                    <Table
                      rows={d.tenure}
                      columns={[
                        { key: "_id", label: "Years" },
                        { key: "count" },
                      ]}
                    />
                  </Panel>
                </div>
                <Panel
                  title="AI dashboard summary"
                  action={
                    <Button
                      disabled={busy || !ai.data?.configured}
                      onClick={async () => {
                        setBusy(true);
                        setError("");
                        try {
                          const result = await api("/ai/chat", {
                            method: "POST",
                            body: { mode: "summary", filters },
                          });
                          setSummary(result.answer);
                        } catch (e) {
                          setError(e.message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {busy ? "Summarizing…" : "Summarize"}
                    </Button>
                  }
                >
                  <AiAvailability resource={ai} />
                  <Message error={error} />
                  {summary ? (
                    <>
                      <span className="hcm-tag">AI-generated</span>
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-7">
                        {summary}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-zinc-400">
                      Generate insights from the current reporting period.
                    </p>
                  )}
                </Panel>
              </>
            )}
          </>
        )}
      </Resource>
      <Announcements user={user} compact />
      {user.role === "admin" && <Audit compact />}
    </div>
  );
}
function employeeDetails(employee) {
  return Object.fromEntries(
    [
      "name",
      "email",
      "code",
      "department",
      "designation",
      "joinDate",
      "exitDate",
      "status",
      "gender",
      "basic",
      "phone",
      "address",
    ].flatMap((key) =>
      employee[key] === undefined
        ? []
        : [
            [
              key,
              ["department", "designation"].includes(key)
                ? employee[key]?._id || employee[key]
                : employee[key],
            ],
          ],
    ),
  );
}
function Catalog({ kind, user }) {
  const resource = useResource(`/${kind}`),
    [edit, setEdit] = useState(null),
    [selected, setSelected] = useState(null),
    [confirmDelete, setConfirmDelete] = useState(null);
  const canManage =
    user.role === "admin" ||
    (user.role === "hr" && ["departments", "designations"].includes(kind));
  const action = useAction(() => {
    resource.refresh();
    setConfirmDelete(null);
  });
  const members = useResource(
    kind === "departments" && selected
      ? `/employees?department=${selected._id}&limit=100`
      : null,
  );
  const employees = useResource(
    kind === "departments" && selected && canManage
      ? "/employees?limit=100"
      : null,
  );
  const fields = [
    {
      name: "name",
      label: kind === "departments" ? "Department name" : "Name",
    },
    ...(kind === "holidays"
      ? [{ name: "date", type: "date", label: "Holiday date" }]
      : []),
    ...(kind === "leave-types"
      ? [
          {
            name: "quota",
            type: "number",
            min: 0,
            max: 366,
            label: "Annual quota",
          },
          { name: "unpaid", type: "checkbox", label: "Unlimited unpaid leave" },
        ]
      : []),
  ];
  return (
    <div className="space-y-6">
      {canManage && (
        <Panel
          title={
            edit
              ? "Edit record"
              : kind === "departments"
                ? "Create department"
                : "Add record"
          }
        >
          <Form
            key={edit?._id || "new"}
            fields={fields}
            initial={edit || {}}
            onCancel={edit ? () => setEdit(null) : undefined}
            submitLabel={
              edit
                ? "Save changes"
                : kind === "departments"
                  ? "Create department"
                  : "Create record"
            }
            onSubmit={async (body) => {
              await api(`/${kind}${edit ? `/${edit._id}` : ""}`, {
                method: edit ? "PUT" : "POST",
                body,
              });
              setEdit(null);
              resource.refresh();
            }}
          />
        </Panel>
      )}
      <Panel title={kind.replaceAll("-", " ")}>
        <Message error={action.error} success={action.success} />
        <Resource resource={resource}>
          <Table
            rows={resource.data}
            columns={[
              { key: "name" },
              ...(kind === "departments"
                ? [
                    {
                      key: "employeeCount",
                      label: "Employees",
                      render: (row) => row.employeeCount ?? "—",
                    },
                  ]
                : []),
              ...(kind === "holidays" ? [{ key: "date" }] : []),
              ...(kind === "leave-types"
                ? [
                    { key: "quota" },
                    {
                      key: "unpaid",
                      render: (row) => (row.unpaid ? "Unlimited" : "Paid"),
                    },
                  ]
                : []),
              { key: "_id", label: "Record ID" },
              ...(canManage
                ? [
                    {
                      key: "actions",
                      label: "Actions",
                      render: (row) => (
                        <div className="flex flex-wrap gap-2">
                          <Button secondary onClick={() => setEdit(row)}>
                            Edit
                          </Button>
                          {kind === "departments" && (
                            <Button secondary onClick={() => setSelected(row)}>
                              View employees
                            </Button>
                          )}
                          {["departments", "designations"].includes(kind) && (
                            <Button
                              secondary
                              disabled={action.busy}
                              onClick={() => setConfirmDelete(row)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </Resource>
      </Panel>
      {confirmDelete && (
        <Panel title={`Remove ${confirmDelete.name}?`}>
          <p className="mb-4 text-sm text-zinc-400">
            Only unused organization records can be removed. Employees and their
            history are preserved.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={action.busy}
              onClick={() =>
                action.act(`/${kind}/${confirmDelete._id}`, "DELETE")
              }
            >
              Confirm removal
            </Button>
            <Button secondary onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
          </div>
        </Panel>
      )}
      {kind === "departments" && selected && (
        <Panel
          title={`Department employees · ${selected.name}`}
          action={
            <Button secondary onClick={() => setSelected(null)}>
              Close
            </Button>
          }
        >
          <Resource resource={members}>
            <Table
              rows={members.data?.items}
              columns={[
                { key: "name" },
                { key: "code", label: "Employee ID" },
                { key: "email" },
                { key: "status", render: (row) => tag(row.status) },
              ]}
            />
            <p className="mt-4 text-sm text-zinc-400">
              {members.data?.total ?? "—"} employees in this department. Up to
              100 records are shown; use Employees to search the full directory.
            </p>
          </Resource>
          {canManage && (
            <div className="mt-6 border-t border-white/10 pt-5">
              <h3 className="mb-4 font-medium">
                Assign employee to this department
              </h3>
              <Message error={employees.error} />
              <Form
                key={selected._id}
                fields={[
                  {
                    name: "employee",
                    label: "Employee",
                    options: (employees.data?.items || [])
                      .filter(
                        (row) =>
                          user.role === "admin" ||
                          row.user?.role === "employee",
                      )
                      .map((row) => ({
                        value: row._id,
                        label: `${row.name} · ${row.code}`,
                      })),
                  },
                ]}
                submitLabel="Assign department"
                onSubmit={async (body) => {
                  const employee = employees.data?.items.find(
                    (row) => row._id === body.employee,
                  );
                  if (!employee)
                    throw new Error("Choose an available employee.");
                  await api(`/employees/${employee._id}`, {
                    method: "PATCH",
                    body: {
                      ...employeeDetails(employee),
                      department: selected._id,
                    },
                  });
                  resource.refresh();
                  members.refresh();
                  employees.refresh();
                }}
              />
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
function Settings({ user }) {
  const resource = useResource("/company");
  return (
    <Panel title="Company policy">
      <p className="mb-5 text-sm text-zinc-400">
        Attendance uses your company timezone and shift hours. Records retain
        their policy snapshot; stored timestamps remain UTC. Weekend numbers:
        Sunday 0 through Saturday 6.
      </p>
      <Resource resource={resource}>
        {resource.data &&
          (user.role === "admin" ? (
            <Form
              initial={{
                ...resource.data,
                weekend: resource.data.weekend.join(","),
              }}
              fields={[
                { name: "name", label: "Company name" },
                {
                  name: "officeStart",
                  label: "Office start (company timezone)",
                  type: "time",
                },
                {
                  name: "timezone",
                  label: "Company timezone (IANA)",
                  defaultValue: "UTC",
                },
                {
                  name: "officeEnd",
                  label: "Office end (company timezone)",
                  type: "time",
                  defaultValue: "17:00",
                },
                {
                  name: "maxShiftHours",
                  label: "Maximum shift duration (hours)",
                  type: "number",
                  min: 1,
                  max: 24,
                  defaultValue: 20,
                },
                {
                  name: "biometricRetentionDays",
                  label: "Biometric retention (days)",
                  type: "number",
                  min: 1,
                  max: 365,
                  defaultValue: 365,
                },
                {
                  name: "graceMinutes",
                  label: "Grace period (minutes)",
                  type: "number",
                  min: 0,
                  max: 180,
                },
                {
                  name: "halfDayHours",
                  label: "Half-day threshold (hours)",
                  type: "number",
                  min: 1,
                  max: 12,
                },
                {
                  name: "weekend",
                  label: "Weekend days, comma separated",
                  optional: true,
                },
                {
                  name: "latitude",
                  label: "Office latitude",
                  type: "number",
                  min: -90,
                  max: 90,
                  optional: true,
                },
                {
                  name: "longitude",
                  label: "Office longitude",
                  type: "number",
                  min: -180,
                  max: 180,
                  optional: true,
                },
                {
                  name: "radius",
                  label: "Office radius (meters)",
                  type: "number",
                  min: 1,
                  max: 10000,
                },
              ]}
              onSubmit={async (body) => {
                body.weekend = String(body.weekend || "")
                  .split(",")
                  .filter(Boolean)
                  .map(Number);
                await api("/company", { method: "PUT", body });
                resource.refresh();
              }}
            />
          ) : (
            <dl className="grid gap-3 sm:grid-cols-2">
              {Object.entries(resource.data)
                .filter(
                  ([k]) =>
                    ![
                      "_id",
                      "__v",
                      "singleton",
                      "createdAt",
                      "updatedAt",
                    ].includes(k),
                )
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-sm text-zinc-400">{k}</dt>
                    <dd>{String(v)}</dd>
                  </div>
                ))}
            </dl>
          ))}
      </Resource>
    </Panel>
  );
}
function Employees({ user }) {
  const [filters, setFilters] = useState({
    search: "",
    department: "",
    page: 1,
  });
  const resource = useResource(
    `/employees?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== ""))}`,
  );
  const deps = useResource("/departments"),
    designations = useResource("/designations");
  const [edit, setEdit] = useState(null),
    [selected, setSelected] = useState(null),
    [showCreate, setShowCreate] = useState(false),
    [reset, setReset] = useState(null);
  const canManage = ["admin", "hr"].includes(user.role),
    action = useAction(resource.refresh);
  const fields = [
    { name: "name", label: "Full name" },
    { name: "email", type: "email", label: "Work email" },
    { name: "code", label: "Employee ID" },
    {
      name: "department",
      label: "Department",
      options: (deps.data || []).map((row) => ({
        value: row._id,
        label: row.name,
      })),
    },
    {
      name: "designation",
      label: "Designation",
      options: (designations.data || []).map((row) => ({
        value: row._id,
        label: row.name,
      })),
    },
    ...(user.role === "admin"
      ? [
          {
            name: "role",
            label: "Account role",
            options: [
              { value: "employee", label: "Employee" },
              { value: "hr", label: "HR" },
              { value: "admin", label: "Admin" },
            ],
            defaultValue: "employee",
          },
        ]
      : []),
    { name: "joinDate", type: "date", label: "Joining date" },
    { name: "exitDate", type: "date", label: "Exit date", optional: true },
    {
      name: "status",
      label: "Employment status",
      options: ["active", "probation", "exited"],
      defaultValue: "active",
    },
    {
      name: "gender",
      label: "Gender",
      options: ["female", "male", "other", "unspecified"],
      defaultValue: "unspecified",
    },
    {
      name: "basic",
      type: "number",
      min: 0.01,
      label: "Monthly basic salary (PKR)",
    },
    { name: "phone", label: "Phone", optional: true },
    { name: "address", label: "Address", optional: true },
    ...(!edit
      ? [
          {
            name: "password",
            type: "password",
            minLength: 12,
            autoComplete: "new-password",
            label: "Temporary password",
          },
        ]
      : []),
  ];
  return (
    <div className="space-y-6">
      <Panel
        title="Find employees"
        action={
          canManage && (
            <Button
              onClick={() => {
                setShowCreate((value) => !value);
                setEdit(null);
              }}
            >
              Create employee account
            </Button>
          )
        }
      >
        <p className="mb-5 text-sm text-zinc-400">
          Create and manage real company accounts.{" "}
          {user.role === "admin"
            ? "Assign Employee, HR or Admin roles. "
            : "HR can manage employee profiles; privileged staff accounts remain under Admin control. "}
          <Link
            href={`/${user.role}/departments`}
            className="text-[#82cde6] underline"
          >
            Manage departments
          </Link>{" "}
          ·{" "}
          <Link
            href={`/${user.role}/designations`}
            className="text-[#82cde6] underline"
          >
            Manage designations
          </Link>
        </p>
        <Form
          initial={filters}
          fields={[
            { name: "search", label: "Name, ID or email", optional: true },
            {
              name: "department",
              label: "Department",
              options: (deps.data || []).map((row) => ({
                value: row._id,
                label: row.name,
              })),
              optional: true,
            },
          ]}
          submitLabel="Search"
          successMessage="Search complete."
          onSubmit={async (body) => setFilters({ ...body, page: 1 })}
        />
      </Panel>
      <Message
        error={deps.error || designations.error || action.error}
        success={action.success}
      />
      {(showCreate || edit) && canManage && (
        <Panel
          title={edit ? "Edit employee account" : "Create employee account"}
        >
          <p className="mb-5 text-sm text-zinc-400">
            Share temporary credentials securely with the account holder. Their
            first login requires a new password before workspace access.
          </p>
          {(!deps.data?.length || !designations.data?.length) && (
            <p className="mb-5 rounded-xl border border-amber-300/20 p-4 text-sm text-amber-100">
              Create a department and designation first using the links above.
            </p>
          )}
          <Form
            key={edit?._id || "new"}
            fields={fields}
            initial={
              edit
                ? {
                    ...employeeDetails(edit),
                    role: edit.user?.role || "employee",
                  }
                : {}
            }
            disabled={!deps.data?.length || !designations.data?.length}
            submitLabel={edit ? "Save employee changes" : "Create account"}
            onCancel={() => {
              setShowCreate(false);
              setEdit(null);
            }}
            onSubmit={async (body) => {
              await api(`/employees${edit ? `/${edit._id}` : ""}`, {
                method: edit ? "PATCH" : "POST",
                body,
              });
              setEdit(null);
              setShowCreate(false);
              resource.refresh();
            }}
          />
        </Panel>
      )}
      <Panel title="Employee directory">
        <Resource resource={resource}>
          <Table
            rows={resource.data?.items}
            columns={[
              { key: "name" },
              { key: "code", label: "Employee ID" },
              { key: "email" },
              { key: "department", render: (row) => row.department?.name },
              { key: "designation", render: (row) => row.designation?.name },
              {
                key: "role",
                label: "Role",
                render: (row) => row.user?.role ? tag(row.user.role) : "No linked login",
              },
              {
                key: "status",
                label: "Employment",
                render: (row) => tag(row.status),
              },
              {
                key: "active",
                label: "Login access",
                render: (row) =>
                  !row.user?._id
                    ? "No linked login"
                    : row.user.active === false
                    ? "Deactivated"
                    : row.user?.mustChangePassword
                      ? "Activation: password change required"
                      : "Active",
              },
              { key: "joinDate", label: "Joined" },
              {
                key: "basic",
                label: "Gross salary",
                render: (row) => money(row.basic * 1.5),
              },
              {
                key: "actions",
                label: "Actions",
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <Button secondary onClick={() => setSelected(row._id)}>
                      360° profile
                    </Button>
                    {(user.role === "admin" ||
                      (user.role === "hr" &&
                        row.user?.role === "employee")) && (
                      <Button
                        secondary
                        onClick={() => {
                          setEdit(row);
                          setShowCreate(false);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                    {user.role === "admin" &&
                      row.user?._id &&
                      String(row.user._id) !== String(user._id) && (
                        <>
                          <Button
                            secondary
                            disabled={action.busy}
                            onClick={() =>
                              action.act(`/users/${row.user._id}`, "PATCH", {
                                active: !row.user.active,
                              })
                            }
                          >
                            {row.user.active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button secondary onClick={() => setReset(row)}>
                            Reset access
                          </Button>
                        </>
                      )}
                  </div>
                ),
              },
            ]}
          />
          <div className="mt-5 flex items-center gap-4">
            <Button
              secondary
              disabled={filters.page <= 1}
              onClick={() =>
                setFilters((value) => ({ ...value, page: value.page - 1 }))
              }
            >
              Previous
            </Button>
            <span className="text-sm text-zinc-400">
              Page {resource.data?.page || 1} · {resource.data?.total || 0}{" "}
              employees
            </span>
            <Button
              secondary
              disabled={filters.page >= (resource.data?.pages || 1)}
              onClick={() =>
                setFilters((value) => ({ ...value, page: value.page + 1 }))
              }
            >
              Next
            </Button>
          </div>
        </Resource>
      </Panel>
      {selected && (
        <Employee360 id={selected} onClose={() => setSelected(null)} />
      )}
      {reset && (
        <Panel title={`Reset access · ${reset.name}`}>
          <p className="mb-5 text-sm text-zinc-400">
            Set a new temporary password and deliver it through a secure
            channel. Existing sessions are revoked and a password change is
            required at next login.
          </p>
          <Form
            fields={[
              {
                name: "password",
                label: "New temporary password",
                type: "password",
                minLength: 12,
                autoComplete: "new-password",
              },
            ]}
            submitLabel="Reset access"
            onCancel={() => setReset(null)}
            onSubmit={async (body) => {
              await api(`/users/${reset.user._id}`, { method: "PATCH", body });
              setReset(null);
              resource.refresh();
            }}
          />
        </Panel>
      )}
      {["admin", "hr"].includes(user.role) && <Csv onImported={resource.refresh} />}
    </div>
  );
}
function Employee360({ id, onClose }) {
  const resource = useResource(`/employees/${id}`);
  return (
    <Panel
      title="Employee 360"
      action={
        <Button secondary onClick={onClose}>
          Close
        </Button>
      }
    >
      <Resource resource={resource}>
        {resource.data && (
          <>
            <dl className="mb-6 grid gap-3 sm:grid-cols-2">
              {Object.entries(resource.data.employee)
                .filter(([k]) => !["_id", "__v", "user"].includes(k))
                .map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs uppercase text-zinc-500">{k}</dt>
                    <dd className="text-sm">{v?.name || String(v ?? "—")}</dd>
                  </div>
                ))}
            </dl>
            <h3 className="my-4 font-medium">Recent attendance</h3>
            <Table
              rows={resource.data.attendance}
              columns={[{ key: "date" }, { key: "status" }, { key: "hours" }]}
            />
            <h3 className="my-4 font-medium">Leave history</h3>
            <Table
              rows={resource.data.leaves}
              columns={[
                { key: "start" },
                { key: "end" },
                { key: "type", render: (r) => r.type?.name },
                { key: "status" },
              ]}
            />
          </>
        )}
      </Resource>
    </Panel>
  );
}
function Csv({ onImported }) {
  const [result, setResult] = useState(null);
  return (
    <Panel title="Employee CSV">
      <a
        download
        href="/api/employees/export"
        className="mb-5 inline-block text-sm text-[#82cde6] underline"
      >
        Export employees
      </a>
      <p className="mb-5 text-sm text-zinc-400">
        Columns:
        code,name,email,department,designation,joinDate,exitDate,status,gender,basic,phone,address.
        Use department and designation IDs shown in organization lists. Dry-run
        before importing. A temporary password is required only for import.
      </p>
      <Form
        fields={[
          {
            name: "csv",
            label: "CSV content",
            type: "textarea",
            wide: true,
            maxLength: 500000,
          },
          {
            name: "dryRun",
            label: "Validate only (dry run)",
            type: "checkbox",
            defaultValue: true,
          },
          {
            name: "password",
            label: "Initial password for imported accounts",
            type: "password",
            minLength: 12,
            optional: true,
          },
        ]}
        submitLabel="Process CSV"
        successMessage="CSV processed. Review the results below."
        onSubmit={async (body) => {
          const output = await api("/employees/import", {
            method: "POST",
            body,
          });
          setResult(output);
          if (output.imported) onImported();
        }}
      />
      {result && (
        <>
          <p className="my-4 text-sm">
            {result.imported !== undefined
              ? `Imported ${result.imported} employees.`
              : `${result.valid} of ${result.rows} rows valid.`}
          </p>
          <Table
            rows={result.errors}
            columns={[{ key: "row" }, { key: "field" }, { key: "reason" }]}
            empty="No validation errors."
          />
        </>
      )}
    </Panel>
  );
}
function Profile({ user }) {
  const resource = useResource(
    user.employee ? `/employees/${user.employee}` : null,
  );
  if (!user.employee)
    return <Message error="Your login has no linked employee profile." />;
  return (
    <Panel title="My profile">
      <Resource resource={resource}>
        {resource.data && (
          <>
            <p className="mb-5 text-zinc-400">
              {resource.data.employee.name} · {resource.data.employee.code} ·{" "}
              {resource.data.employee.department?.name}
            </p>
            <Form
              initial={resource.data.employee}
              fields={[
                { name: "phone", label: "Phone" },
                { name: "address", label: "Address" },
              ]}
              onSubmit={async (body) => {
                await api(`/employees/${user.employee}`, {
                  method: "PATCH",
                  body,
                });
                resource.refresh();
              }}
            />
          </>
        )}
      </Resource>
    </Panel>
  );
}
function CheckButtons({ onChange }) {
  const action = useAction(onChange);
  return (
    <>
      <div className="flex gap-3">
        <Button
          disabled={action.busy}
          onClick={() => action.act("/attendance/check-in")}
        >
          Check in without face
        </Button>
        <Button
          secondary
          disabled={action.busy}
          onClick={() => action.act("/attendance/check-out")}
        >
          Check out without face
        </Button>
      </div>
      <p className="mt-3 text-xs text-zinc-400">
        Recorded using server time in UTC.
      </p>
      <Message error={action.error} success={action.success} />
    </>
  );
}
function Attendance({ user }) {
  const [filters, setFilters] = useState({
    start: `${monthNow()}-01`,
    end: isoToday(),
    ...(user.role !== "employee" ? { department: "" } : {}),
  });
  const resource = useResource(
    `/attendance?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v))}`,
  );
  const corrections = useResource("/corrections"),
    [decision, setDecision] = useState(null);
  return (
    <div className="space-y-6">
      {user.role !== "admin" && (
        <Panel title="Verified face attendance">
          <FaceVerification user={user} onRecorded={resource.refresh} />
        </Panel>
      )}
      {user.role !== "admin" && (
        <Panel title="Authorized attendance without face">
          <CheckButtons onChange={resource.refresh} />
        </Panel>
      )}
      <AttendanceAnalytics user={user} />
      <Panel title="Attendance filters">
        <DateFilters initial={filters} onChange={setFilters} />
      </Panel>
      <Panel
        title={
          user.role === "employee"
            ? "My attendance calendar"
            : "Daily attendance board"
        }
      >
        <Resource resource={resource}>
          <Table
            rows={resource.data}
            columns={[
              nameColumn,
              { key: "date" },
              {
                key: "checkIn",
                label: "Check in (UTC)",
                render: (r) => dateTime(r.checkIn),
              },
              {
                key: "checkOut",
                label: "Check out (UTC)",
                render: (r) => dateTime(r.checkOut),
              },
              { key: "status", render: (r) => tag(r.status) },
              { key: "hours", render: (r) => Number(r.hours).toFixed(2) },
            ]}
          />
        </Resource>
      </Panel>
      {user.role === "employee" && (
        <Panel title="Request attendance correction">
          <Form
            fields={[
              { name: "date", label: "Date", type: "date" },
              {
                name: "checkIn",
                label: "Correct check in (UTC)",
                type: "datetime-local",
              },
              {
                name: "checkOut",
                label: "Correct check out (UTC)",
                type: "datetime-local",
              },
              { name: "reason", label: "Reason" },
            ]}
            submitLabel="Request correction"
            onSubmit={async (body) => {
              body.checkIn = `${body.checkIn}:00.000Z`;
              body.checkOut = `${body.checkOut}:00.000Z`;
              await api("/corrections", { method: "POST", body });
              corrections.refresh();
            }}
          />
        </Panel>
      )}
      <Panel title="Attendance corrections">
        <Resource resource={corrections}>
          <Table
            rows={corrections.data}
            columns={[
              nameColumn,
              { key: "date" },
              { key: "reason" },
              { key: "status" },
              { key: "comment" },
              ...(["admin", "hr"].includes(user.role)
                ? [
                    {
                      key: "actions",
                      label: "",
                      render: (r) =>
                        r.status === "pending" &&
                        String(r.employee?._id) !== String(user.employee) && (
                          <Button secondary onClick={() => setDecision(r)}>
                            Review
                          </Button>
                        ),
                    },
                  ]
                : []),
            ]}
          />
        </Resource>
      </Panel>
      {decision && (
        <Panel title={`Review correction · ${decision.employee?.name}`}>
          <Decision
            onCancel={() => setDecision(null)}
            onSubmit={async (body) => {
              await api(`/corrections/${decision._id}`, {
                method: "PATCH",
                body,
              });
              setDecision(null);
              corrections.refresh();
              resource.refresh();
              window.dispatchEvent(new Event("attendance-updated"));
            }}
          />
        </Panel>
      )}
    </div>
  );
}
function Decision({ onSubmit, onCancel, cancellation = false }) {
  return (
    <Form
      fields={[
        {
          name: "status",
          label: "Decision",
          options: cancellation ? ["cancelled"] : ["approved", "rejected"],
        },
        { name: "comment", label: "Comment" },
      ]}
      onSubmit={onSubmit}
      onCancel={onCancel}
      submitLabel="Confirm decision"
    />
  );
}
function Leaves({ user }) {
  const ai = useResource("/ai/status");
  const resource = useResource("/leave"),
    types = useResource("/leave-types"),
    balance = useResource(
      user.employee && user.role !== "admin" ? "/leave/balance" : null,
    );
  const [draft, setDraft] = useState(null),
    [decision, setDecision] = useState(null);
  return (
    <div className="space-y-6">
      {user.role !== "admin" && (
        <>
          <Panel title="Leave balance">
            <Resource resource={balance}>
              <Table
                rows={balance.data}
                columns={[
                  { key: "name" },
                  {
                    key: "quota",
                    render: (r) => (r.unpaid ? "Unlimited" : r.quota),
                  },
                  { key: "used" },
                  { key: "pending" },
                  {
                    key: "remaining",
                    render: (r) => (r.unpaid ? "Unlimited" : r.remaining),
                  },
                ]}
              />
            </Resource>
            {!user.employee && (
              <Message error="Ask Admin to link your HR login to an employee profile for self-service." />
            )}
          </Panel>
          <Panel title="Smart leave">
            <AiAvailability resource={ai} />
            <p className="mb-4 text-sm text-zinc-400">
              Describe your leave in plain words. Review the AI-generated dates
              before submitting the form.
            </p>
            <Form
              fields={[
                {
                  name: "message",
                  label: "Your request",
                  type: "textarea",
                  wide: true,
                },
              ]}
              disabled={!ai.data?.configured}
              submitLabel="Prepare leave form"
              successMessage="AI draft prepared. Review and confirm below."
              onSubmit={async (body) => {
                const result = await api("/ai/chat", {
                  method: "POST",
                  body: { ...body, mode: "smart-leave" },
                });
                setDraft(result.draft);
              }}
            />
          </Panel>
          <Panel
            title={draft ? "Review AI-generated draft" : "Apply for leave"}
          >
            <Form
              key={JSON.stringify(draft)}
              initial={draft || {}}
              fields={[
                {
                  name: "type",
                  label: "Leave type",
                  options: (types.data || []).map((t) => ({
                    value: t._id,
                    label: t.name,
                  })),
                },
                { name: "start", type: "date", label: "Start date" },
                { name: "end", type: "date", label: "End date" },
                { name: "reason", label: "Reason" },
              ]}
              submitLabel="Confirm and apply"
              onSubmit={async (body) => {
                await api("/leave", { method: "POST", body });
                setDraft(null);
                resource.refresh();
                balance.refresh();
              }}
            />
          </Panel>
        </>
      )}
      <Panel
        title={
          ["admin", "hr"].includes(user.role)
            ? "Leave approval inbox and history"
            : "Leave history"
        }
      >
        <Resource resource={resource}>
          <Table
            rows={resource.data}
            columns={[
              nameColumn,
              { key: "type", render: (r) => r.type?.name },
              { key: "start" },
              { key: "end" },
              { key: "days", render: (r) => r.days.length },
              { key: "status", render: (r) => tag(r.status) },
              { key: "reason" },
              { key: "comment" },
              {
                key: "actions",
                label: "",
                render: (r) => (
                  <div className="flex gap-2">
                    {["admin", "hr"].includes(user.role) &&
                      r.status === "pending" &&
                      String(r.employee?._id) !== String(user.employee) && (
                        <Button
                          secondary
                          onClick={() =>
                            setDecision({ ...r, cancellation: false })
                          }
                        >
                          Review
                        </Button>
                      )}
                    {String(r.employee?._id) === String(user.employee) &&
                      ["pending", "approved"].includes(r.status) && (
                        <Button
                          secondary
                          onClick={() =>
                            setDecision({ ...r, cancellation: true })
                          }
                        >
                          Cancel leave
                        </Button>
                      )}
                  </div>
                ),
              },
            ]}
          />
        </Resource>
      </Panel>
      {decision && (
        <Panel
          title={
            decision.cancellation
              ? "Cancel leave request"
              : "Review leave request"
          }
        >
          <Decision
            cancellation={decision.cancellation}
            onCancel={() => setDecision(null)}
            onSubmit={async (body) => {
              await api(`/leave/${decision._id}`, { method: "PATCH", body });
              setDecision(null);
              resource.refresh();
              balance.refresh();
            }}
          />
        </Panel>
      )}
    </div>
  );
}
function Payroll({ user }) {
  const resource = useResource("/payroll"),
    [selected, setSelected] = useState(null);
  const action = useAction(resource.refresh);
  const run = resource.data?.find((r) => r._id === selected);
  return (
    <div className="space-y-6">
      {["admin", "hr"].includes(user.role) && (
        <Panel title="Prepare monthly payroll">
          <p className="mb-4 text-sm text-zinc-400">
            A draft can be regenerated until Admin finalizes it. Missing working
            days count as absences. Review the month and deductions before
            finalization.
          </p>
          <Form
            fields={[
              {
                name: "month",
                label: "Payroll month",
                type: "month",
                defaultValue: monthNow(),
              },
            ]}
            submitLabel="Generate / refresh draft"
            onSubmit={async (body) => {
              const result = await api("/payroll", { method: "POST", body });
              setSelected(result._id);
              resource.refresh();
            }}
          />
        </Panel>
      )}
      <Panel
        title={
          user.role === "employee" ? "My payslips" : "Monthly payroll runs"
        }
      >
        <Message error={action.error} success={action.success} />
        <Resource resource={resource}>
          <Table
            rows={resource.data}
            columns={[
              { key: "month" },
              { key: "status", render: (r) => tag(r.status) },
              { key: "employees", render: (r) => r.slips.length },
              {
                key: "gross",
                render: (r) => money(r.slips.reduce((n, s) => n + s.gross, 0)),
              },
              {
                key: "net",
                render: (r) => money(r.slips.reduce((n, s) => n + s.net, 0)),
              },
              {
                key: "actions",
                label: "",
                render: (r) => (
                  <Button secondary onClick={() => setSelected(r._id)}>
                    Review payslips
                  </Button>
                ),
              },
            ]}
          />
        </Resource>
      </Panel>
      {run && (
        <Panel
          title={`${run.month} · ${run.status}`}
          action={
            <Button secondary onClick={() => setSelected(null)}>
              Close
            </Button>
          }
        >
          <Table
            rows={run.slips}
            columns={[
              { key: "name" },
              { key: "basic", render: (r) => money(r.basic) },
              { key: "hra", render: (r) => money(r.hra) },
              { key: "medical", render: (r) => money(r.medical) },
              { key: "gross", render: (r) => money(r.gross) },
              { key: "workingDays" },
              { key: "eligibleDays" },
              { key: "absent" },
              { key: "unpaid" },
              { key: "halfDays" },
              { key: "deduction", render: (r) => money(r.deduction) },
              { key: "tax", render: (r) => money(r.tax) },
              { key: "net", render: (r) => money(r.net) },
              {
                key: "pdf",
                label: "",
                render: (r) =>
                  run.status === "finalized" ? (
                    <a
                      className="text-[#82cde6] underline"
                      href={`/api/payroll/${run._id}/payslip/${r.employee}`}
                      download
                    >
                      Download PDF
                    </a>
                  ) : (
                    "Draft"
                  ),
              },
            ]}
          />
          {user.role === "admin" && run.status === "draft" && (
            <div className="mt-5">
              <p className="mb-3 text-sm text-zinc-400">
                Finalization permanently locks this payroll month.
              </p>
              <Form
                fields={[
                  {
                    name: "confirmation",
                    label: `Type ${run.month} to finalize`,
                  },
                ]}
                submitLabel="Finalize and lock month"
                onSubmit={async (body) => {
                  if (body.confirmation !== run.month)
                    throw new Error("Confirmation month does not match.");
                  await api(`/payroll/${run._id}/finalize`, { method: "POST" });
                  resource.refresh();
                }}
              />
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
function Users({ user }) {
  const resource = useResource("/users"),
    employees = useResource("/employees?limit=100");
  const [selected, setSelected] = useState(null),
    [roleEdit, setRoleEdit] = useState(null),
    action = useAction(resource.refresh);
  return (
    <div className="space-y-6">
      <Panel title="Create HR or Admin login">
        <p className="mb-4 text-sm text-zinc-400">
          Create a staff login or promote an existing employee account. To
          create an HR account with a complete employee profile, use{" "}
          <Link href="/admin/employees" className="text-[#82cde6] underline">
            Employees
          </Link>{" "}
          and select the HR role. Temporary credentials require a password
          change at first login.
        </p>
        <Form
          fields={[
            { name: "name", label: "Full name" },
            { name: "email", type: "email", label: "Email" },
            {
              name: "role",
              label: "Account role",
              defaultValue: "hr",
              options: [
                { value: "hr", label: "HR" },
                { value: "admin", label: "Admin" },
                { value: "employee", label: "Employee (link a profile below)" },
              ],
            },
            {
              name: "password",
              type: "password",
              minLength: 12,
              autoComplete: "new-password",
              label: "Temporary password",
            },
            {
              name: "employee",
              label: "Link existing employee",
              optional: true,
              options: (employees.data?.items || [])
                .filter((row) => row.user?.role === "employee")
                .map((row) => ({
                  value: row._id,
                  label: `${row.name} · ${row.code}`,
                })),
            },
          ]}
          submitLabel="Create staff account"
          onSubmit={async (body) => {
            if (body.role === "employee" && !body.employee)
              throw new Error(
                "Create employee accounts from Employees, or choose an existing employee profile.",
              );
            await api("/users", { method: "POST", body });
            resource.refresh();
            employees.refresh();
          }}
        />
      </Panel>
      <Panel title="HR management and login access">
        <Message
          error={action.error || employees.error}
          success={action.success}
        />
        <Resource resource={resource}>
          <Table
            rows={resource.data}
            columns={[
              { key: "name" },
              { key: "email" },
              { key: "role", render: (row) => tag(row.role) },
              {
                key: "active",
                label: "Access",
                render: (row) => (row.active ? "Active" : "Deactivated"),
              },
              {
                key: "mustChangePassword",
                label: "Activation",
                render: (row) =>
                  row.mustChangePassword
                    ? "First password change required"
                    : "Activated",
              },
              {
                key: "actions",
                label: "Actions",
                render: (row) =>
                  String(row._id) !== String(user._id) && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        secondary
                        disabled={action.busy}
                        onClick={() =>
                          action.act(`/users/${row._id}`, "PATCH", {
                            active: !row.active,
                          })
                        }
                      >
                        {row.active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button secondary onClick={() => setRoleEdit(row)}>
                        Change role
                      </Button>
                      <Button secondary onClick={() => setSelected(row)}>
                        Reset access
                      </Button>
                    </div>
                  ),
              },
            ]}
          />
        </Resource>
      </Panel>
      {roleEdit && (
        <Panel title={`Change role · ${roleEdit.name}`}>
          <Form
            initial={{ role: roleEdit.role }}
            fields={[
              {
                name: "role",
                label: "Account role",
                options: ["admin", "hr", "employee"],
              },
            ]}
            submitLabel="Save role"
            onCancel={() => setRoleEdit(null)}
            onSubmit={async (body) => {
              await api(`/users/${roleEdit._id}`, { method: "PATCH", body });
              setRoleEdit(null);
              resource.refresh();
            }}
          />
        </Panel>
      )}
      {selected && (
        <Panel title={`Reset access · ${selected.name}`}>
          <p className="mb-5 text-sm text-zinc-400">
            Set and securely deliver a new temporary password. Previous sessions
            are revoked and the account holder must change it before using the
            workspace.
          </p>
          <Form
            fields={[
              {
                name: "password",
                label: "New temporary password",
                type: "password",
                minLength: 12,
                autoComplete: "new-password",
              },
            ]}
            submitLabel="Reset access"
            onCancel={() => setSelected(null)}
            onSubmit={async (body) => {
              await api(`/users/${selected._id}`, { method: "PATCH", body });
              setSelected(null);
              resource.refresh();
            }}
          />
        </Panel>
      )}
    </div>
  );
}
function Announcements({ user, compact = false }) {
  const resource = useResource("/announcements");
  return (
    <Panel title="Company announcements">
      {!compact && user.role !== "employee" && (
        <div className="mb-6">
          <Form
            fields={[
              { name: "title", label: "Title" },
              { name: "body", type: "textarea", label: "Message", wide: true },
            ]}
            submitLabel="Publish announcement"
            onSubmit={async (body) => {
              await api("/announcements", { method: "POST", body });
              resource.refresh();
            }}
          />
        </div>
      )}
      <Resource resource={resource}>
        {resource.data?.length ? (
          resource.data.slice(0, compact ? 5 : 100).map((r) => (
            <article
              key={r._id}
              className="border-b border-white/10 py-4 last:border-0"
            >
              <h3 className="font-medium">{r.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                {r.body}
              </p>
              <p className="mt-3 text-xs text-zinc-500">
                {r.actor?.name} · {dateTime(r.createdAt)} UTC
              </p>
            </article>
          ))
        ) : (
          <p className="text-sm text-zinc-400">No announcements yet.</p>
        )}
      </Resource>
    </Panel>
  );
}
function Notifications() {
  const resource = useResource("/notifications"),
    action = useAction(resource.refresh);
  return (
    <Panel title="My notifications">
      <Message error={action.error} />
      <Resource resource={resource}>
        <Table
          rows={resource.data}
          columns={[
            { key: "message" },
            { key: "createdAt", render: (r) => dateTime(r.createdAt) },
            {
              key: "read",
              render: (r) =>
                r.read ? (
                  "Read"
                ) : (
                  <Button
                    secondary
                    disabled={action.busy}
                    onClick={() =>
                      action.act(`/notifications/${r._id}`, "PATCH")
                    }
                  >
                    Mark read
                  </Button>
                ),
            },
          ]}
        />
      </Resource>
    </Panel>
  );
}
function Audit({ compact = false }) {
  const resource = useResource("/audit");
  return (
    <Panel title="Audit log">
      <Resource resource={resource}>
        <Table
          rows={resource.data?.slice(0, compact ? 5 : 200)}
          columns={[
            {
              key: "createdAt",
              label: "When (UTC)",
              render: (r) => dateTime(r.createdAt),
            },
            { key: "actor", render: (r) => r.actor?.name || "System" },
            { key: "action" },
            { key: "entity" },
            ...(!compact
              ? [
                  {
                    key: "changes",
                    render: (r) => (
                      <details>
                        <summary className="cursor-pointer text-[#82cde6]">
                          Before / after
                        </summary>
                        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs">
                          {JSON.stringify(
                            { before: r.before, after: r.after },
                            null,
                            2,
                          )}
                        </pre>
                      </details>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Resource>
    </Panel>
  );
}
function Assistant() {
  const ai = useResource("/ai/status");
  const [history, setHistory] = useState([]);
  return (
    <Panel title="Ask your assistant">
      <AiAvailability resource={ai} />
      <p className="mb-5 text-sm text-zinc-400">
        Answers use your role and data scope. The assistant cannot save or
        approve records.
      </p>
      <div aria-live="polite" className="mb-6 space-y-4">
        {history.map((h, i) => (
          <article key={i} className="rounded-xl border border-white/10 p-4">
            <p className="mb-2 text-sm text-zinc-400">{h.question}</p>
            <span className="hcm-tag">AI-generated</span>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
              {h.answer}
            </p>
          </article>
        ))}
      </div>
      <Form
        fields={[
          {
            name: "message",
            label: "Question",
            type: "textarea",
            wide: true,
            maxLength: 4000,
          },
        ]}
        disabled={!ai.data?.configured}
        submitLabel="Ask assistant"
        successMessage="Answer received."
        onSubmit={async (body) => {
          const result = await api("/ai/chat", {
            method: "POST",
            body: { ...body, mode: "chat" },
          });
          setHistory((h) => [
            ...h,
            { question: body.message, answer: result.answer },
          ]);
        }}
      />
    </Panel>
  );
}

function TrendChart({ rows }) {
  if (!rows?.length) return null;
  const maximum = Math.max(
    1,
    ...rows.map((r) => r.present + r.absent + r.onLeave),
  );
  const width = 700,
    height = 160,
    x = (index) => 20 + (index * 660) / Math.max(1, rows.length - 1),
    y = (value) => 140 - (value / maximum) * 120;
  return (
    <figure className="mb-5">
      <svg
        role="img"
        aria-label="Attendance trend: present in cyan, absent in rose. Exact daily values are in the table below."
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
      >
        <path d="M20 20V140H680" fill="none" stroke="#292934" />
        {[
          ["present", "#4bb8dc"],
          ["absent", "#ff2d95"],
        ].map(([key, color]) => (
          <g key={key}>
            <polyline
              points={rows.map((r, i) => `${x(i)},${y(r[key])}`).join(" ")}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
            />
            {rows.map((r, i) => (
              <circle key={r.date} cx={x(i)} cy={y(r[key])} r="3" fill={color}>
                <title>{`${r.date}: ${r[key]} ${key}`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <figcaption className="flex justify-between text-xs text-zinc-400">
        <span>{rows[0].date}</span>
        <span>
          <span className="text-[#4bb8dc]">Present</span> /{" "}
          <span className="text-[#ff2d95]">Absent</span>
        </span>
        <span>{rows.at(-1).date}</span>
      </figcaption>
    </figure>
  );
}

function AiAvailability({ resource }) {
  if (resource.loading)
    return (
      <p className="mb-3 text-sm text-zinc-400" role="status">
        Checking optional AI availability…
      </p>
    );
  if (resource.data?.configured) return null;
  return (
    <p
      className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-400"
      role="status"
    >
      {resource.data?.message ||
        "AI availability could not be checked. Regular forms and reports remain available."}
    </p>
  );
}
