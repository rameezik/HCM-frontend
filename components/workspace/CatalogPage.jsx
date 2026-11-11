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
import {
  useResource,
  useAction,
} from "@/components/workspace/shared/useWorkspaceData";
import Resource from "@/components/workspace/shared/Resource";
import employeeFormValues from "@/components/workspace/employees/employeeFormValues";

export default function CatalogPage({ kind, user }) {
  const catalog = useResource(`/${kind}`),
    [editingRecord, setEditingRecord] = useState(null),
    [selectedDepartment, setSelectedDepartment] = useState(null),
    [recordToDelete, setRecordToDelete] = useState(null);
  const canManage =
    user.role === "admin" ||
    (user.role === "hr" && ["departments", "designations"].includes(kind));
  const action = useAction(() => {
    catalog.refresh();
    setRecordToDelete(null);
  });
  const departmentMembers = useResource(
    kind === "departments" && selectedDepartment
      ? `/employees?department=${selectedDepartment._id}&limit=100`
      : null,
  );
  const employeeOptions = useResource(
    kind === "departments" && selectedDepartment && canManage
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
            editingRecord
              ? "Edit record"
              : kind === "departments"
                ? "Create department"
                : "Add record"
          }
        >
          <Form
            key={editingRecord?._id || "new"}
            fields={fields}
            initial={editingRecord || {}}
            onCancel={editingRecord ? () => setEditingRecord(null) : undefined}
            submitLabel={
              editingRecord
                ? "Save changes"
                : kind === "departments"
                  ? "Create department"
                  : "Create record"
            }
            onSubmit={async (body) => {
              await api(
                `/${kind}${editingRecord ? `/${editingRecord._id}` : ""}`,
                { method: editingRecord ? "PUT" : "POST", body },
              );
              setEditingRecord(null);
              catalog.refresh();
            }}
          />
        </Panel>
      )}
      <Panel title={kind.replaceAll("-", " ")}>
        <Message error={action.error} success={action.success} />
        <Resource resource={catalog}>
          <Table
            rows={catalog.data}
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
                          <Button
                            secondary
                            onClick={() => setEditingRecord(row)}
                          >
                            Edit
                          </Button>
                          {kind === "departments" && (
                            <Button
                              secondary
                              onClick={() => setSelectedDepartment(row)}
                            >
                              View employees
                            </Button>
                          )}
                          {["departments", "designations"].includes(kind) && (
                            <Button
                              secondary
                              disabled={action.busy}
                              onClick={() => setRecordToDelete(row)}
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
      {recordToDelete && (
        <Panel title={`Remove ${recordToDelete.name}?`}>
          <p className="mb-4 text-sm text-zinc-400">
            Only unused organization records can be removed. Employees and their
            history are preserved.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={action.busy}
              onClick={() =>
                action.act(`/${kind}/${recordToDelete._id}`, "DELETE")
              }
            >
              Confirm removal
            </Button>
            <Button secondary onClick={() => setRecordToDelete(null)}>
              Cancel
            </Button>
          </div>
        </Panel>
      )}
      {kind === "departments" && selectedDepartment && (
        <Panel
          title={`Department employees · ${selectedDepartment.name}`}
          action={
            <Button secondary onClick={() => setSelectedDepartment(null)}>
              Close
            </Button>
          }
        >
          <Resource resource={departmentMembers}>
            <Table
              rows={departmentMembers.data?.items}
              columns={[
                { key: "name" },
                { key: "code", label: "Employee ID" },
                { key: "email" },
                { key: "status", render: (row) => tag(row.status) },
              ]}
            />
            <p className="mt-4 text-sm text-zinc-400">
              {departmentMembers.data?.total ?? "—"} employees in this
              department. Up to 100 records are shown; use Employees to search
              the full directory.
            </p>
          </Resource>
          {canManage && (
            <div className="mt-6 border-t border-white/10 pt-5">
              <h3 className="mb-4 font-medium">
                Assign employee to this department
              </h3>
              <Message error={employeeOptions.error} />
              <Form
                key={selectedDepartment._id}
                fields={[
                  {
                    name: "employee",
                    label: "Employee",
                    options: (employeeOptions.data?.items || [])
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
                  const employee = employeeOptions.data?.items.find(
                    (row) => row._id === body.employee,
                  );
                  if (!employee)
                    throw new Error("Choose an available employee.");
                  await api(`/employees/${employee._id}`, {
                    method: "PATCH",
                    body: {
                      ...employeeFormValues(employee),
                      department: selectedDepartment._id,
                    },
                  });
                  catalog.refresh();
                  departmentMembers.refresh();
                  employeeOptions.refresh();
                }}
              />
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
