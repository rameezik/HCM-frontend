"use client";

import { useState } from "react";
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
import { currentMonth } from "@/components/workspace/shared/format";
import {
  useResource,
  useAction,
} from "@/components/workspace/shared/useWorkspaceData";
import Resource from "@/components/workspace/shared/Resource";

export default function PayrollPage({ user }) {
  const payroll = useResource("/payroll"),
    [selectedRunId, setSelectedRunId] = useState(null);
  const action = useAction(payroll.refresh);
  const payrollRun = payroll.data?.find((row) => row._id === selectedRunId);
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
                defaultValue: currentMonth(),
              },
            ]}
            submitLabel="Generate / refresh draft"
            onSubmit={async (body) => {
              const result = await api("/payroll", { method: "POST", body });
              setSelectedRunId(result._id);
              payroll.refresh();
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
        <Resource resource={payroll}>
          <Table
            rows={payroll.data}
            columns={[
              { key: "month" },
              { key: "status", render: (row) => tag(row.status) },
              { key: "employees", render: (row) => row.slips.length },
              {
                key: "gross",
                render: (row) =>
                  money(
                    row.slips.reduce((total, slip) => total + slip.gross, 0),
                  ),
              },
              {
                key: "net",
                render: (row) =>
                  money(row.slips.reduce((total, slip) => total + slip.net, 0)),
              },
              {
                key: "actions",
                label: "",
                render: (row) => (
                  <Button secondary onClick={() => setSelectedRunId(row._id)}>
                    Review payslips
                  </Button>
                ),
              },
            ]}
          />
        </Resource>
      </Panel>
      {payrollRun && (
        <Panel
          title={`${payrollRun.month} · ${payrollRun.status}`}
          action={
            <Button secondary onClick={() => setSelectedRunId(null)}>
              Close
            </Button>
          }
        >
          <Table
            rows={payrollRun.slips}
            columns={[
              { key: "name" },
              { key: "basic", render: (row) => money(row.basic) },
              { key: "hra", render: (row) => money(row.hra) },
              { key: "medical", render: (row) => money(row.medical) },
              { key: "gross", render: (row) => money(row.gross) },
              { key: "workingDays" },
              { key: "eligibleDays" },
              { key: "absent" },
              { key: "unpaid" },
              { key: "halfDays" },
              { key: "deduction", render: (row) => money(row.deduction) },
              { key: "tax", render: (row) => money(row.tax) },
              { key: "net", render: (row) => money(row.net) },
              {
                key: "pdf",
                label: "",
                render: (row) =>
                  payrollRun.status === "finalized" ? (
                    <a
                      className="text-[#82cde6] underline"
                      href={`/api/payroll/${payrollRun._id}/payslip/${row.employee}`}
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
          {user.role === "admin" && payrollRun.status === "draft" && (
            <div className="mt-5">
              <p className="mb-3 text-sm text-zinc-400">
                Finalization permanently locks this payroll month.
              </p>
              <Form
                fields={[
                  {
                    name: "confirmation",
                    label: `Type ${payrollRun.month} to finalize`,
                  },
                ]}
                submitLabel="Finalize and lock month"
                onSubmit={async (body) => {
                  if (body.confirmation !== payrollRun.month)
                    throw new Error("Confirmation month does not match.");
                  await api(`/payroll/${payrollRun._id}/finalize`, {
                    method: "POST",
                  });
                  payroll.refresh();
                }}
              />
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
