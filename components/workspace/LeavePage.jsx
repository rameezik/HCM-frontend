"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import {
  Panel,
  Form,
  Message,
  Button,
  Table,
  tag,
} from "@/components/WorkspaceUI";
import { employeeNameColumn } from "@/components/workspace/shared/format";
import { useResource } from "@/components/workspace/shared/useWorkspaceData";
import Resource from "@/components/workspace/shared/Resource";
import DecisionForm from "@/components/workspace/shared/DecisionForm";
import AiAvailability from "@/components/workspace/shared/AiAvailability";

export default function LeavePage({ user }) {
  const ai = useResource("/ai/status");
  const leaveRequests = useResource("/leave"),
    leaveTypes = useResource("/leave-types"),
    leaveBalance = useResource(
      user.employee && user.role !== "admin" ? "/leave/balance" : null,
    );
  const [draft, setDraft] = useState(null),
    [decision, setDecision] = useState(null);
  return (
    <div className="space-y-6">
      {user.role !== "admin" && (
        <>
          <Panel title="Leave balance">
            <Resource resource={leaveBalance}>
              <Table
                rows={leaveBalance.data}
                columns={[
                  { key: "name" },
                  {
                    key: "quota",
                    render: (row) => (row.unpaid ? "Unlimited" : row.quota),
                  },
                  { key: "used" },
                  { key: "pending" },
                  {
                    key: "remaining",
                    render: (row) => (row.unpaid ? "Unlimited" : row.remaining),
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
                  options: (leaveTypes.data || []).map((t) => ({
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
                leaveRequests.refresh();
                leaveBalance.refresh();
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
        <Resource resource={leaveRequests}>
          <Table
            rows={leaveRequests.data}
            columns={[
              employeeNameColumn,
              { key: "type", render: (row) => row.type?.name },
              { key: "start" },
              { key: "end" },
              { key: "days", render: (row) => row.days.length },
              { key: "status", render: (row) => tag(row.status) },
              { key: "reason" },
              { key: "comment" },
              {
                key: "actions",
                label: "",
                render: (row) => (
                  <div className="flex gap-2">
                    {["admin", "hr"].includes(user.role) &&
                      row.status === "pending" &&
                      String(row.employee?._id) !== String(user.employee) && (
                        <Button
                          secondary
                          onClick={() =>
                            setDecision({ ...row, cancellation: false })
                          }
                        >
                          Review
                        </Button>
                      )}
                    {String(row.employee?._id) === String(user.employee) &&
                      ["pending", "approved"].includes(row.status) && (
                        <Button
                          secondary
                          onClick={() =>
                            setDecision({ ...row, cancellation: true })
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
          <DecisionForm
            cancellation={decision.cancellation}
            onCancel={() => setDecision(null)}
            onSubmit={async (body) => {
              await api(`/leave/${decision._id}`, { method: "PATCH", body });
              setDecision(null);
              leaveRequests.refresh();
              leaveBalance.refresh();
            }}
          />
        </Panel>
      )}
    </div>
  );
}
