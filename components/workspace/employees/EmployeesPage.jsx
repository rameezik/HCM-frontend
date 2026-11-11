"use client";

import { useState } from "react";
import Link from "next/link";
import EmployeePhoto from "@/components/EmployeePhoto";
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
import {
  useResource,
  useAction,
} from "@/components/workspace/shared/useWorkspaceData";
import Resource from "@/components/workspace/shared/Resource";
import employeeFormValues from "@/components/workspace/employees/employeeFormValues";
import EmployeeDetails from "@/components/workspace/employees/EmployeeDetails";
import EmployeeCsvImport from "@/components/workspace/employees/EmployeeCsvImport";

export default function EmployeesPage({ user }) {
  const [filters, setFilters] = useState({
    search: "",
    department: "",
    page: 1,
  });
  const employees = useResource(
    `/employees?${new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== ""))}`,
  );
  const departments = useResource("/departments"),
    designations = useResource("/designations");
  const [editingEmployee, setEditingEmployee] = useState(null),
    [selectedEmployeeId, setSelectedEmployeeId] = useState(null),
    [showCreate, setShowCreate] = useState(false),
    [employeeToReset, setEmployeeToReset] = useState(null);
  const canManage = ["admin", "hr"].includes(user.role),
    action = useAction(employees.refresh);
  const fields = [
    { name: "name", label: "Full name" },
    { name: "email", type: "email", label: "Work email" },
    { name: "code", label: "Employee ID" },
    {
      name: "department",
      label: "Department",
      options: (departments.data || []).map((row) => ({
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
    ...(!editingEmployee
      ? [
          {
            name: "password",
            type: "password",
            minLength: 12,
            autoComplete: "new-password",
            label: "Initial password",
          },
          ...(user.role === "admin"
            ? [
                {
                  name: "requirePasswordChange",
                  type: "checkbox",
                  defaultValue: false,
                  optional: true,
                  label: "Require a password change at first sign-in",
                },
              ]
            : []),
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
                setEditingEmployee(null);
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
              options: (departments.data || []).map((row) => ({
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
        error={departments.error || designations.error || action.error}
        success={action.success}
      />
      {(showCreate || editingEmployee) && canManage && (
        <Panel
          title={
            editingEmployee
              ? "Edit employee account"
              : "Create employee account"
          }
        >
          {editingEmployee && (
            <EmployeePhoto
              key={editingEmployee._id}
              employee={editingEmployee}
              canEdit
              onChanged={(result) => {
                setEditingEmployee((current) =>
                  current?._id === editingEmployee._id
                    ? { ...current, photoUpdatedAt: result.photoUpdatedAt }
                    : current,
                );
                employees.refresh();
              }}
            />
          )}
          <p className="mb-5 text-sm text-zinc-400">
            Share credentials securely with the account holder. Password changes
            are optional unless explicitly required by the Admin below.
          </p>
          {(!departments.data?.length || !designations.data?.length) && (
            <p className="mb-5 rounded-xl border border-amber-300/20 p-4 text-sm text-amber-100">
              Create a department and designation first using the links above.
            </p>
          )}
          <Form
            key={editingEmployee?._id || "new"}
            fields={fields}
            initial={
              editingEmployee
                ? {
                    ...employeeFormValues(editingEmployee),
                    role: editingEmployee.user?.role || "employee",
                  }
                : {}
            }
            disabled={!departments.data?.length || !designations.data?.length}
            submitLabel={
              editingEmployee ? "Save employee changes" : "Create account"
            }
            onCancel={() => {
              setShowCreate(false);
              setEditingEmployee(null);
            }}
            onSubmit={async (body) => {
              await api(
                `/employees${editingEmployee ? `/${editingEmployee._id}` : ""}`,
                { method: editingEmployee ? "PATCH" : "POST", body },
              );
              setEditingEmployee(null);
              setShowCreate(false);
              employees.refresh();
            }}
          />
        </Panel>
      )}
      <Panel title="Employee directory">
        <Resource resource={employees}>
          <Table
            rows={employees.data?.items}
            columns={[
              {
                key: "name",
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <EmployeePhoto employee={row} compact />
                    <span>{row.name}</span>
                  </div>
                ),
              },
              { key: "code", label: "Employee ID" },
              { key: "email" },
              { key: "department", render: (row) => row.department?.name },
              { key: "designation", render: (row) => row.designation?.name },
              {
                key: "role",
                label: "Role",
                render: (row) =>
                  row.user?.role ? tag(row.user.role) : "No linked login",
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
                      : row.user?.mustChangePassword &&
                          row.user?.passwordChangeEnforced
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
                    <Button
                      secondary
                      onClick={() => setSelectedEmployeeId(row._id)}
                    >
                      360° profile
                    </Button>
                    {(user.role === "admin" ||
                      (user.role === "hr" &&
                        row.user?.role === "employee")) && (
                      <Button
                        secondary
                        onClick={() => {
                          setEditingEmployee(row);
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
                          <Button
                            secondary
                            onClick={() => setEmployeeToReset(row)}
                          >
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
              Page {employees.data?.page || 1} · {employees.data?.total || 0}{" "}
              employees
            </span>
            <Button
              secondary
              disabled={filters.page >= (employees.data?.pages || 1)}
              onClick={() =>
                setFilters((value) => ({ ...value, page: value.page + 1 }))
              }
            >
              Next
            </Button>
          </div>
        </Resource>
      </Panel>
      {selectedEmployeeId && (
        <EmployeeDetails
          id={selectedEmployeeId}
          user={user}
          onChanged={employees.refresh}
          onClose={() => setSelectedEmployeeId(null)}
        />
      )}
      {employeeToReset && (
        <Panel title={`Reset access · ${employeeToReset.name}`}>
          <p className="mb-5 text-sm text-zinc-400">
            Set a new password and deliver it through a secure channel. Existing
            sessions are revoked. A password change at next sign-in is optional
            unless you explicitly require it below.
          </p>
          <Form
            key={employeeToReset._id}
            fields={[
              {
                name: "password",
                label: "New password",
                type: "password",
                minLength: 12,
                autoComplete: "new-password",
              },
              {
                name: "requirePasswordChange",
                type: "checkbox",
                defaultValue: false,
                optional: true,
                label: "Require a password change at first sign-in",
              },
            ]}
            submitLabel="Reset access"
            onCancel={() => setEmployeeToReset(null)}
            onSubmit={async (body) => {
              await api(`/users/${employeeToReset.user._id}`, {
                method: "PATCH",
                body,
              });
              setEmployeeToReset(null);
              employees.refresh();
            }}
          />
        </Panel>
      )}
      {["admin", "hr"].includes(user.role) && (
        <EmployeeCsvImport onImported={employees.refresh} />
      )}
    </div>
  );
}
