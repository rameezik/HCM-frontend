"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "@/lib/api";
import { Button, Form, Message, Panel, Table } from "@/components/WorkspaceUI";
import AttendanceCharts, { ATTENDANCE_STATUS } from "./AttendanceCharts";

function useLiveAttendance(query, identity) {
  const [state, setState] = useState({
    key: null,
    data: null,
    error: "",
    updatedAt: null,
  });
  const request = useRef(null);
  const queryString = new URLSearchParams(
    Object.entries(query).filter(([, value]) => value !== "" && value != null),
  ).toString();
  const key = `${identity}:${queryString}`;
  const [refreshVersion, setRefreshVersion] = useState(0);
  const refresh = useCallback(
    () => setRefreshVersion((value) => value + 1),
    [],
  );

  useEffect(() => {
    let active = true;
    let pending = false;
    let current = null;
    let queued = false;
    async function load() {
      if (!active || document.hidden) return;
      if (pending) {
        queued = true;
        return;
      }
      pending = true;
      const controller = new AbortController();
      current = controller;
      request.current = controller;
      let timedOut = false;
      const timeout = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, 12000);
      try {
        const data = await api(`/attendance/analytics?${queryString}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (active && !controller.signal.aborted)
          setState({
            key,
            data,
            error: "",
            updatedAt: new Date().toISOString(),
          });
      } catch (error) {
        if (active && (!controller.signal.aborted || timedOut))
          setState((previous) => ({
            key,
            data: previous.key === key ? previous.data : null,
            error: timedOut
              ? "Attendance refresh timed out. Try Refresh again."
              : error.message,
            updatedAt: previous.key === key ? previous.updatedAt : null,
          }));
      } finally {
        window.clearTimeout(timeout);
        pending = false;
        if (request.current === controller) request.current = null;
        if (queued && active) {
          queued = false;
          void load();
        }
      }
    }
    const updateWhenVisible = () => {
      if (!document.hidden) void load();
    };
    void load();
    const interval = window.setInterval(updateWhenVisible, 15000);
    window.addEventListener("focus", updateWhenVisible);
    window.addEventListener("attendance-updated", updateWhenVisible);
    document.addEventListener("visibilitychange", updateWhenVisible);
    return () => {
      active = false;
      current?.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", updateWhenVisible);
      window.removeEventListener("attendance-updated", updateWhenVisible);
      document.removeEventListener("visibilitychange", updateWhenVisible);
    };
  }, [queryString, key, refreshVersion]);

  return {
    data: state.key === key ? state.data : null,
    lastData: state.key?.startsWith(`${identity}:`) ? state.data : null,
    error: state.key === key ? state.error : "",
    updatedAt: state.key === key ? state.updatedAt : null,
    loading: state.key !== key,
    refresh,
  };
}

function formatTime(value, timezone) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  try {
    return date.toLocaleString("en-GB", {
      timeZone: timezone,
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return date.toISOString();
  }
}
function figure(value, suffix = "") {
  if (value == null) return "—";
  return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(value)}${suffix}`;
}
function statusLabel(status) {
  return (
    ATTENDANCE_STATUS[status]?.label ||
    status?.replaceAll("_", " ") ||
    "No record"
  );
}
function Status({ value }) {
  const style = ATTENDANCE_STATUS[value];
  return (
    <span
      className="hcm-tag"
      style={
        style
          ? { color: style.color, borderColor: `${style.color}45` }
          : undefined
      }
    >
      {statusLabel(value)}
    </span>
  );
}
function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111116] p-5">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-[#82cde6]">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
function Calendar({ rows, timezone }) {
  const legendId = useId();
  return (
    <Panel title="Attendance history timeline">
      <p className="mb-5 text-xs leading-5 text-zinc-400">
        Your company-calendar workdays. Dates without an attendance entry are
        distinguished from saved records. Times are shown in {timezone}.
      </p>
      {rows?.length ? (
        <>
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7"
            aria-describedby={legendId}
          >
            {rows.map((row) => (
              <article
                key={`${row.employee?._id}:${row.date}`}
                className="min-w-0 rounded-xl border border-white/10 bg-white/[0.02] p-3"
                style={{
                  borderTop: `3px solid ${ATTENDANCE_STATUS[row.status]?.color || "#6b7280"}`,
                }}
              >
                <p className="text-xs font-medium text-zinc-300">{row.date}</p>
                <p
                  className="mt-2 text-xs font-semibold"
                  style={{
                    color: ATTENDANCE_STATUS[row.status]?.color || "#a1a1aa",
                  }}
                >
                  {statusLabel(row.status)}
                </p>
                <dl className="mt-3 space-y-1 text-[11px] text-zinc-400">
                  <div>
                    <dt className="inline">In: </dt>
                    <dd className="inline">
                      {row.checkIn ? formatTime(row.checkIn, timezone) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline">Out: </dt>
                    <dd className="inline">
                      {row.checkOut ? formatTime(row.checkOut, timezone) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline">Hours: </dt>
                    <dd className="inline">
                      {row.recorded ? figure(row.hours) : "—"}
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 text-[10px] text-zinc-500">
                  {row.recorded
                    ? "Saved attendance"
                    : row.status === "on_leave"
                      ? "Approved leave"
                      : "No attendance record"}
                </p>
              </article>
            ))}
          </div>
          <p id={legendId} className="mt-4 text-xs leading-5 text-zinc-500">
            Approved leave and absence are calculated from the company calendar
            and employee dates. Weekends, holidays and dates outside employment
            are excluded.
          </p>
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-400">
          No attendance records available yet.
        </p>
      )}
    </Panel>
  );
}

export default function AttendanceAnalytics({ user }) {
  const employeeView = user.role === "employee";
  const [query, setQuery] = useState({ page: 1, limit: 25 });
  const identity = `${user._id || user.employee || user.role}:${user.company || ""}`;
  const resource = useLiveAttendance(query, identity);
  const data = resource.data;
  const timezone = data?.filters?.timezone || "UTC";
  const directory = data || resource.lastData;
  const departments = directory?.departmentOptions || [];
  const employees = directory?.employees || [];
  const fieldDefaults = useMemo(
    () => ({
      start: data?.filters?.start || query.start || "",
      end: data?.filters?.end || query.end || "",
      department: query.department || "",
      employee: query.employee || "",
    }),
    [
      data?.filters?.start,
      data?.filters?.end,
      query.start,
      query.end,
      query.department,
      query.employee,
    ],
  );
  const reportColumns = [
    ...(!employeeView
      ? [
          {
            key: "employee",
            label: "Employee",
            render: (row) => (
              <div>
                <p>{row.employee?.name}</p>
                <p className="text-xs text-zinc-500">{row.employee?.code}</p>
              </div>
            ),
          },
        ]
      : []),
    { key: "date", label: "Workday" },
    {
      key: "status",
      label: "Status",
      render: (row) => <Status value={row.status} />,
    },
    {
      key: "checkIn",
      label: `Check in (${timezone})`,
      render: (row) => formatTime(row.checkIn, timezone),
    },
    {
      key: "checkOut",
      label: `Check out (${timezone})`,
      render: (row) => formatTime(row.checkOut, timezone),
    },
    {
      key: "hours",
      label: "Hours",
      render: (row) => (row.recorded ? figure(row.hours) : "—"),
    },
    {
      key: "verificationMethod",
      label: "Method",
      render: (row) =>
        row.verificationMethod
          ? String(row.verificationMethod).replaceAll("_", " ")
          : "Not recorded",
    },
    {
      key: "recorded",
      label: "Source",
      render: (row) =>
        row.recorded
          ? "Saved attendance"
          : row.status === "on_leave"
            ? "Approved leave"
            : "Calendar-derived absence",
    },
  ];
  const summary = data?.summary;
  const today = data?.today;
  const own = today?.own;
  return (
    <section
      className="min-w-0 space-y-6"
      aria-label="Live attendance analytics"
    >
      <Panel
        title={employeeView ? "My attendance insights" : "Attendance analytics"}
        action={
          <Button secondary onClick={resource.refresh}>
            Refresh
          </Button>
        }
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm leading-6 text-zinc-400">
            Company-calendar reporting{data ? ` · ${timezone}` : ""}. Updates
            every 15 seconds while this page is visible.
          </p>
          {resource.updatedAt && (
            <p className="text-xs text-zinc-500">
              Last refreshed {formatTime(resource.updatedAt, timezone)}
            </p>
          )}
        </div>
        <Form
          key={JSON.stringify(fieldDefaults)}
          initial={fieldDefaults}
          fields={[
            { name: "start", label: "From", type: "date" },
            { name: "end", label: "Through", type: "date" },
            ...(!employeeView
              ? [
                  {
                    name: "department",
                    label: "Department",
                    optional: true,
                    options: departments.map((department) => ({
                      value: department._id,
                      label: department.name,
                    })),
                  },
                  {
                    name: "employee",
                    label: "Employee report",
                    optional: true,
                    options: employees.map((employee) => ({
                      value: employee._id,
                      label: `${employee.name} · ${employee.code}`,
                    })),
                  },
                ]
              : []),
          ]}
          submitLabel="Apply attendance filters"
          successMessage="Filters applied."
          onSubmit={async (filters) => {
            if (filters.start > filters.end)
              throw new Error("The start date must not follow the end date.");
            setQuery({ ...filters, page: 1, limit: query.limit });
          }}
        />
        <Message error={resource.error} />
        {resource.error && data && (
          <p className="text-xs leading-5 text-amber-200">
            Refresh failed. The data below is from the last successful update
            shown above.
          </p>
        )}
      </Panel>

      {resource.loading && (
        <Panel title="Loading attendance">
          <p role="status" className="py-7 text-sm text-zinc-400">
            Loading attendance records and company-calendar statistics…
          </p>
        </Panel>
      )}
      {data && (
        <>
          <Panel
            title={
              employeeView
                ? `Today · ${today?.date || ""}`
                : `Today’s attendance · ${today?.date || ""}`
            }
          >
            {today?.isWorkingDay === false && (
              <p className="mb-4 text-sm text-zinc-400">
                Today is not a scheduled company workday. Existing attendance,
                if any, remains in the history.
              </p>
            )}
            {employeeView ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat
                  label="Attendance status"
                  value={statusLabel(own?.status)}
                  hint={
                    own?.recorded
                      ? "Saved database record"
                      : today?.isWorkingDay
                        ? "No attendance saved today"
                        : "No scheduled workday"
                  }
                />
                <Stat
                  label="Check-in time"
                  value={own?.checkIn ? formatTime(own.checkIn, timezone) : "—"}
                />
                <Stat
                  label="Check-out time"
                  value={
                    own?.checkOut ? formatTime(own.checkOut, timezone) : "—"
                  }
                />
                <Stat
                  label="Working hours"
                  value={own?.recorded ? figure(own.hours, " h") : "—"}
                  hint="Calculated from actual timestamps"
                />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Stat
                  label="Total employees"
                  value={figure(today?.totals?.totalEmployees)}
                />
                <Stat
                  label="Present employees"
                  value={figure(today?.totals?.attended)}
                  hint="Includes late and incomplete attendance"
                />
                <Stat
                  label="Absent employees"
                  value={figure(today?.totals?.absent)}
                />
                <Stat
                  label="Late arrivals"
                  value={figure(today?.totals?.late)}
                />
                <Stat
                  label="Approved leave"
                  value={figure(today?.totals?.onLeave)}
                />
                <Stat
                  label="Attendance percentage"
                  value={figure(today?.totals?.attendanceRate, "%")}
                />
              </div>
            )}
          </Panel>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Recorded workdays in period"
              value={figure(summary?.recordedDays)}
              hint="Actual saved attendance entries"
            />
            <Stat
              label="Expected workdays in period"
              value={figure(summary?.expectedDays)}
              hint="Company calendar and employment dates"
            />
            <Stat
              label="Attendance rate in period"
              value={figure(summary?.attendanceRate, "%")}
              hint="Approved leave excluded; half days weighted"
            />
            <Stat
              label="Working hours in period"
              value={figure(summary?.workedHours, " h")}
              hint="Calculated from saved timestamps"
            />
          </div>
          <AttendanceCharts data={data} employeeView={employeeView} />
          {(employeeView || query.employee) && (
            <Calendar rows={data.calendar} timezone={timezone} />
          )}
          <Panel
            title={
              employeeView
                ? "My attendance records"
                : "Employee attendance report"
            }
          >
            <p className="mb-4 text-xs leading-5 text-zinc-400">
              Dates are company workdays; actual times use {timezone}. Filter by
              an employee to see their full timeline. No biometric templates are
              included in reports.
            </p>
            <Table
              rows={(data.history || []).map((row) => ({
                ...row,
                _id: `${row.employee?._id}:${row.date}`,
              }))}
              columns={reportColumns}
              empty="No attendance records available yet."
            />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-zinc-400">
                {figure(data.historyTotal)} workday entries · page{" "}
                {data.page || query.page}
              </p>
              <div className="flex gap-2">
                <Button
                  secondary
                  disabled={(data.page || query.page) <= 1}
                  onClick={() =>
                    setQuery((filters) => ({
                      ...filters,
                      page: Math.max(1, (data.page || filters.page) - 1),
                    }))
                  }
                >
                  Previous
                </Button>
                <Button
                  secondary
                  disabled={
                    (data.page || query.page) * (data.limit || query.limit) >=
                    data.historyTotal
                  }
                  onClick={() =>
                    setQuery((filters) => ({
                      ...filters,
                      page: (data.page || filters.page) + 1,
                    }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </Panel>
        </>
      )}
    </section>
  );
}
