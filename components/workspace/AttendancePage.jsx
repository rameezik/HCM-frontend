"use client";

import { useState } from "react";
import Link from "next/link";
import AttendanceAnalytics from "@/components/attendance/AttendanceAnalytics";
import FaceVerification from "@/components/attendance/FaceVerification";
import { api } from "@/lib/api";
import { Panel, Form, Button, Table, tag } from "@/components/WorkspaceUI";
import {
  todayIso,
  currentMonth,
  employeeNameColumn,
  formatDateTime,
} from "@/components/workspace/shared/format";
import { useResource } from "@/components/workspace/shared/useWorkspaceData";
import Resource from "@/components/workspace/shared/Resource";
import DateFilters from "@/components/workspace/shared/DateFilters";
import AttendanceButtons from "@/components/workspace/AttendanceButtons";
import DecisionForm from "@/components/workspace/shared/DecisionForm";

export default function AttendancePage({ user }) {
  const [filters, setFilters] = useState({
    start: `${currentMonth()}-01`,
    end: todayIso(),
    ...(user.role !== "employee" ? { department: "" } : {}),
  });
  const attendance = useResource(
    `/attendance?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value))}`,
  );
  const corrections = useResource("/corrections"),
    [decision, setDecision] = useState(null);
  return (
    <div className="space-y-6">
      {user.role !== "admin" && (
        <Panel title="Verified face attendance">
          <Link
            href={`/${user.role}/face-scan`}
            className="mb-5 inline-flex rounded-xl bg-[#007ba7] px-4 py-3 text-sm font-medium text-white hover:brightness-110"
          >
            Open webcam face scan
          </Link>
          <FaceVerification user={user} onRecorded={attendance.refresh} />
        </Panel>
      )}
      {user.role !== "admin" && (
        <Panel title="Authorized attendance without face">
          <AttendanceButtons onChange={attendance.refresh} />
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
        <Resource resource={attendance}>
          <Table
            rows={attendance.data}
            columns={[
              employeeNameColumn,
              { key: "date" },
              {
                key: "checkIn",
                label: "Check in (UTC)",
                render: (row) => formatDateTime(row.checkIn),
              },
              {
                key: "checkOut",
                label: "Check out (UTC)",
                render: (row) => formatDateTime(row.checkOut),
              },
              { key: "status", render: (row) => tag(row.status) },
              { key: "hours", render: (row) => Number(row.hours).toFixed(2) },
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
              employeeNameColumn,
              { key: "date" },
              { key: "reason" },
              { key: "status" },
              { key: "comment" },
              ...(["admin", "hr"].includes(user.role)
                ? [
                    {
                      key: "actions",
                      label: "",
                      render: (row) =>
                        row.status === "pending" &&
                        String(row.employee?._id) !== String(user.employee) && (
                          <Button secondary onClick={() => setDecision(row)}>
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
          <DecisionForm
            onCancel={() => setDecision(null)}
            onSubmit={async (body) => {
              await api(`/corrections/${decision._id}`, {
                method: "PATCH",
                body,
              });
              setDecision(null);
              corrections.refresh();
              attendance.refresh();
              window.dispatchEvent(new Event("attendance-updated"));
            }}
          />
        </Panel>
      )}
    </div>
  );
}
