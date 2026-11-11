"use client";

import { useEffect, useState } from "react";
import AttendanceAnalytics from "@/components/attendance/AttendanceAnalytics";
import FaceVerification from "@/components/attendance/FaceVerification";
import {
  CompanyOverview,
  EmployeeOverview,
  WorkspaceActions,
} from "@/components/CompanyOverview";
import { api } from "@/lib/api";
import { Panel, Message, Button, Table, money } from "@/components/WorkspaceUI";
import { todayIso, currentMonth } from "@/components/workspace/shared/format";
import { useResource } from "@/components/workspace/shared/useWorkspaceData";
import Resource from "@/components/workspace/shared/Resource";
import DateFilters from "@/components/workspace/shared/DateFilters";
import AttendanceButtons from "@/components/workspace/AttendanceButtons";
import Announcements from "@/components/workspace/Announcements";
import AuditLog from "@/components/workspace/AuditLog";
import AttendanceTrend from "@/components/workspace/AttendanceTrend";
import AiAvailability from "@/components/workspace/shared/AiAvailability";

export default function DashboardPage({ user }) {
  const ai = useResource("/ai/status");
  const [filters, setFilters] = useState({
    start: `${currentMonth()}-01`,
    end: todayIso(),
    ...(user.role !== "employee" ? { department: "" } : {}),
  });
  const stats = useResource(
    `/dashboard?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value))}`,
  );
  const [summary, setSummary] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const dashboardData = stats.data;
  const refreshStats = stats.refresh;
  useEffect(() => {
    const refresh = () => refreshStats();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 15000);
    window.addEventListener("attendance-updated", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("attendance-updated", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [refreshStats]);
  return (
    <div className="space-y-6">
      <WorkspaceActions user={user} />
      {user.role === "employee" ? (
        <>
          <EmployeeOverview user={user} />
          <Panel title="Face-verified attendance">
            <FaceVerification user={user} onRecorded={stats.refresh} />
          </Panel>
        </>
      ) : (
        <Resource resource={stats}>
          <CompanyOverview summary={dashboardData?.companySummary} />
        </Resource>
      )}
      <AttendanceAnalytics user={user} />
      <Panel title="Reporting period">
        <DateFilters initial={filters} onChange={setFilters} />
      </Panel>
      <Resource resource={stats}>
        {dashboardData && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(user.role === "employee"
                ? [
                    ["Hours this week / 40", dashboardData.weeklyHours || 0],
                    ["Late count", dashboardData.lateCount],
                    ["Attendance rate", `${dashboardData.attendanceRate}%`],
                    [
                      "Latest payslip",
                      dashboardData.lastPayslip
                        ? money(dashboardData.lastPayslip.net)
                        : "No payslip yet",
                    ],
                  ]
                : user.role === "admin"
                  ? [
                      ["Headcount", dashboardData.headcount],
                      ["Attrition YTD", `${dashboardData.attritionYTD}%`],
                      ["Payroll gross", money(dashboardData.payrollGross)],
                      ["Average salary", money(dashboardData.averageSalary)],
                    ]
                  : [
                      ["Headcount", dashboardData.headcount],
                      ["Present today", dashboardData.presentToday],
                      ["On leave today", dashboardData.onLeaveToday],
                      ["Late today", dashboardData.lateToday],
                      ["Pending approvals", dashboardData.pendingApprovals],
                      ["Attendance rate", `${dashboardData.attendanceRate}%`],
                      ["Absenteeism", `${dashboardData.absenteeism}%`],
                      ["Late percentage", `${dashboardData.latePercent}%`],
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
                  <AttendanceButtons onChange={stats.refresh} />
                </Panel>
                <Panel title="Leave remaining">
                  <Table
                    rows={dashboardData.leaveBalance}
                    columns={[
                      { key: "name", label: "Type" },
                      {
                        key: "remaining",
                        render: (row) =>
                          row.unpaid ? "Unlimited" : row.remaining,
                      },
                      { key: "used" },
                      { key: "pending" },
                    ]}
                  />
                </Panel>
              </>
            )}
            <Panel title="Attendance trend">
              <AttendanceTrend rows={dashboardData.trend} />
              <Table
                rows={dashboardData.trend}
                columns={["date", "present", "late", "absent", "onLeave"].map(
                  (key) => ({ key }),
                )}
              />
            </Panel>
            {user.role !== "employee" && (
              <>
                <Panel title="Headcount and salary by department">
                  <Table
                    rows={dashboardData.byDepartment}
                    columns={[
                      { key: "name" },
                      { key: "count", label: "Headcount" },
                      {
                        key: "averageSalary",
                        render: (row) => money(row.averageSalary),
                      },
                    ]}
                  />
                </Panel>
                <Panel title="Attendance by department">
                  <Table
                    rows={dashboardData.departmentAttendance}
                    columns={[
                      { key: "name" },
                      { key: "expectedDays" },
                      { key: "absent" },
                      { key: "leaveDays" },
                      { key: "late" },
                      {
                        key: "absenteeism",
                        render: (row) => `${row.absenteeism}%`,
                      },
                      {
                        key: "latePercent",
                        render: (row) => `${row.latePercent}%`,
                      },
                    ]}
                  />
                </Panel>
                <Panel title="Leave utilization">
                  <Table
                    rows={dashboardData.leaveUtilization}
                    columns={[
                      { key: "name" },
                      { key: "department" },
                      { key: "approvedDays" },
                      { key: "quota", label: "Quota per employee" },
                      {
                        key: "utilization",
                        render: (row) =>
                          row.utilization === null
                            ? "Unlimited"
                            : `${row.utilization}%`,
                      },
                    ]}
                  />
                </Panel>
                <Panel title="Top five late-comers">
                  <Table
                    rows={dashboardData.topLateComers}
                    columns={[
                      { key: "name" },
                      { key: "code" },
                      { key: "count" },
                    ]}
                  />
                </Panel>
                <Panel title="Payroll by month and department">
                  <Table
                    rows={dashboardData.payroll}
                    columns={[
                      { key: "month", render: (row) => row._id.month },
                      {
                        key: "department",
                        render: (row) => row._id.department,
                      },
                      { key: "gross", render: (row) => money(row.gross) },
                      { key: "net", render: (row) => money(row.net) },
                    ]}
                  />
                </Panel>
                <Panel title="Salary by designation">
                  <Table
                    rows={dashboardData.byDesignation}
                    columns={[
                      { key: "name" },
                      { key: "count" },
                      {
                        key: "averageSalary",
                        render: (row) => money(row.averageSalary),
                      },
                    ]}
                  />
                </Panel>
                <div className="grid gap-5 md:grid-cols-2">
                  <Panel title="Gender distribution">
                    <Table
                      rows={dashboardData.gender}
                      columns={[
                        { key: "_id", label: "Gender" },
                        { key: "count" },
                      ]}
                    />
                  </Panel>
                  <Panel title="Tenure (years; lower bound)">
                    <Table
                      rows={dashboardData.tenure}
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
                        } catch (error) {
                          setError(error.message);
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
      {user.role === "admin" && <AuditLog compact />}
    </div>
  );
}
