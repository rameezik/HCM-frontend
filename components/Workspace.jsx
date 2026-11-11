"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import BiometricEnrollment from "@/components/attendance/BiometricEnrollment";
import WebcamAttendance from "@/components/attendance/WebcamAttendance";
import Departments from "@/components/Departments";
import AttendanceGraph from "@/components/attendance/AttendanceGraph";
import AttendanceTerminalSettings from "@/components/attendance/AttendanceTerminalSettings";
import { api } from "@/lib/api";
import { requiresPasswordChange } from "@/lib/authPolicy";
import { Panel, Message, Button } from "@/components/WorkspaceUI";
import { useResource } from "@/components/workspace/shared/useWorkspaceData";
import PasswordForm from "@/components/workspace/shared/PasswordForm";
import DashboardPage from "@/components/workspace/DashboardPage";
import CatalogPage from "@/components/workspace/CatalogPage";
import CompanySettings from "@/components/workspace/CompanySettings";
import EmployeesPage from "@/components/workspace/employees/EmployeesPage";
import ProfilePage from "@/components/workspace/ProfilePage";
import AttendancePage from "@/components/workspace/AttendancePage";
import LeavePage from "@/components/workspace/LeavePage";
import PayrollPage from "@/components/workspace/PayrollPage";
import UserAccountsPage from "@/components/workspace/UserAccountsPage";
import Announcements from "@/components/workspace/Announcements";
import Notifications from "@/components/workspace/Notifications";
import AuditLog from "@/components/workspace/AuditLog";
import AssistantPage from "@/components/workspace/AssistantPage";

export default function Workspace({ role, view = "dashboard" }) {
  const router = useRouter(),
    identity = useResource("/auth/me", view);
  const user = identity.data;
  const passwordRequired = requiresPasswordChange(user);
  const [logoutError, setLogoutError] = useState("");
  useEffect(() => {
    window.addEventListener("focus", identity.refresh);
    return () => window.removeEventListener("focus", identity.refresh);
  }, [identity.refresh]);
  useEffect(() => {
    if (identity.errorStatus === 401) router.replace("/login");
    else if (user && user.role !== role)
      router.replace(`/${user.role}/dashboard`);
    else if (passwordRequired && view !== "password")
      router.replace(`/${user.role}/password`);
  }, [identity.errorStatus, user, passwordRequired, role, view, router]);
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
  if (!user || user.role !== role || (passwordRequired && view !== "password"))
    return (
      <p role="status" className="p-10">
        Opening your workspace…
      </p>
    );
  const content = {
    dashboard: <DashboardPage user={user} />,
    employees: <EmployeesPage user={user} />,
    profile: <ProfilePage user={user} />,
    attendance: <AttendancePage user={user} />,
    "face-enrollment": <BiometricEnrollment user={user} />,
    "face-scan": <WebcamAttendance user={user} />,
    "attendance-graphs": <AttendanceGraph user={user} />,
    "attendance-terminal": <AttendanceTerminalSettings />,
    leaves: <LeavePage user={user} />,
    payroll: <PayrollPage user={user} />,
    payslips: <PayrollPage user={user} />,
    users: <UserAccountsPage user={user} />,
    settings: <CompanySettings user={user} />,
    departments: <Departments user={user} />,
    designations: <CatalogPage kind="designations" user={user} />,
    "leave-types": <CatalogPage kind="leave-types" user={user} />,
    holidays: <CatalogPage kind="holidays" user={user} />,
    "audit-logs": <AuditLog />,
    announcements: <Announcements user={user} />,
    notifications: <Notifications />,
    assistant: <AssistantPage />,
    password: (
      <PasswordForm
        activation={passwordRequired}
        onChanged={(updated) => {
          identity.refresh();
          if (passwordRequired) router.replace(`/${updated.role}/dashboard`);
        }}
      />
    ),
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
            <Button
              secondary
              onClick={async () => {
                try {
                  await api("/auth/logout", { method: "POST" });
                  router.replace("/login");
                } catch (error) {
                  setLogoutError(error.message);
                }
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
        <Message error={logoutError} />
        {content[view] || <Message error="This page is unavailable." />}
      </div>
    </DashboardLayout>
  );
}
