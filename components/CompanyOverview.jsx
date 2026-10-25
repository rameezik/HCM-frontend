"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Panel, Table, Message } from "@/components/WorkspaceUI";
import EmployeePhoto from "@/components/EmployeePhoto";

const actionStyle =
  "rounded-xl border border-white/15 px-4 py-2 text-sm text-[#82cde6] hover:bg-white/5";
const time = (value) => (value ? new Date(value).toLocaleString() : "—");

export function WorkspaceActions({ user }) {
  const links =
    user.role === "employee"
      ? [
          ["My profile", "profile"],
          ["Webcam face scan", "face-scan"],
          ["Face enrollment", "face-enrollment"],
          ["Attendance history", "attendance"],
          ["Attendance graphs", "attendance-graphs"],
          ["My leave requests", "leaves"],
        ]
      : [
          ["Employees", "employees"],
          ["Departments", "departments"],
          ...(user.role === "admin" ? [["HR Management", "users"]] : []),
          ["Attendance", "attendance"],
          ["Attendance graphs", "attendance-graphs"],
          ...(user.role === "hr" ? [["Webcam face scan", "face-scan"]] : []),
          ["Leave requests", "leaves"],
        ];
  return (
    <nav aria-label="Workspace actions" className="flex flex-wrap gap-3">
      {links.map(([label, view]) => (
        <Link key={view} className={actionStyle} href={`/${user.role}/${view}`}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function CompanyOverview({ summary }) {
  if (!summary)
    return (
      <p role="status" className="text-sm text-zinc-400">
        Loading company overview…
      </p>
    );
  const stats = [
    ["Total employees", summary.totalEmployees],
    ["Total departments", summary.totalDepartments],
    ["Total HR users", summary.totalHrUsers],
    ["Present employees", summary.presentEmployees],
    ["Absent employees", summary.absentEmployees],
    ["Pending leave requests", summary.pendingLeaveRequests],
  ];
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([label, value]) => (
          <Panel key={label} title={label}>
            <p className="text-3xl font-semibold text-[#82cde6]">{value}</p>
          </Panel>
        ))}
      </div>
      <p className="text-xs text-zinc-400">
        Current company totals · attendance business date {summary.date} ·{" "}
        {summary.activeEmployees} active employees · {summary.activeHrUsers}{" "}
        active HR accounts
      </p>
      <Panel title="Today's company attendance">
        <Table
          rows={summary.todayAttendance}
          columns={[
            {
              key: "employee",
              label: "Employee",
              render: (row) => row.employee?.name,
            },
            {
              key: "department",
              label: "Department",
              render: (row) => row.employee?.department?.name || "—",
            },
            { key: "status", label: "Status" },
            {
              key: "checkIn",
              label: "Check in",
              render: (row) => time(row.checkIn),
            },
            {
              key: "checkOut",
              label: "Check out",
              render: (row) => time(row.checkOut),
            },
            { key: "hours", label: "Hours" },
            { key: "verificationMethod", label: "Method" },
          ]}
        />
      </Panel>
    </div>
  );
}

export function EmployeeOverview({ user }) {
  const [state, setState] = useState({ id: null, employee: null, error: "" });
  const [epoch, setEpoch] = useState(0);
  useEffect(() => {
    if (!user.employee) return undefined;
    const controller = new AbortController();
    api(`/employees/${user.employee}`, { signal: controller.signal })
      .then((result) =>
        setState({ id: user.employee, employee: result.employee, error: "" }),
      )
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ id: user.employee, employee: null, error: error.message });
      });
    return () => controller.abort();
  }, [user.employee, epoch]);
  const employee = state.id === user.employee ? state.employee : null;
  return (
    <Panel title="Your employee profile">
      <Message error={state.error} />
      {employee ? (
        <>
          <EmployeePhoto
            employee={employee}
            canEdit
            onChanged={() => setEpoch((value) => value + 1)}
          />
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ["Full name", employee.name],
              ["Employee ID", employee.code],
              ["Department", employee.department?.name],
              ["Designation", employee.designation?.name],
              ["Joining date", employee.joinDate],
              ["Employment status", employee.status],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-zinc-400">{label}</dt>
                <dd className="mt-1 text-sm">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : !state.error ? (
        <p role="status" className="text-sm text-zinc-400">
          Loading your profile…
        </p>
      ) : null}
      <Link
        className="mt-4 inline-block text-sm text-[#82cde6] underline"
        href="/employee/profile"
      >
        Open my profile
      </Link>
    </Panel>
  );
}
