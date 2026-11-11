"use client";

import { useState } from "react";
import Link from "next/link";
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

export default function UserAccountsPage({ user }) {
  const accounts = useResource("/users"),
    employeeProfiles = useResource("/employees?limit=100");
  const [accountToReset, setAccountToReset] = useState(null),
    [accountToEditRole, setAccountToEditRole] = useState(null),
    action = useAction(accounts.refresh);
  return (
    <div className="space-y-6">
      <Panel title="Create HR or Admin login">
        <p className="mb-4 text-sm text-zinc-400">
          Create a staff login or promote an existing employee account. To
          create an HR account with a complete employee profile, use{" "}
          <Link href="/admin/employees" className="text-[#82cde6] underline">
            Employees
          </Link>{" "}
          and select the HR role. Share credentials securely. Password changes
          are optional unless you explicitly require one below.
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
              label: "Initial password",
            },
            {
              name: "requirePasswordChange",
              type: "checkbox",
              defaultValue: false,
              optional: true,
              label: "Require a password change at first sign-in",
            },
            {
              name: "employee",
              label: "Link existing employee",
              optional: true,
              options: (employeeProfiles.data?.items || [])
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
            accounts.refresh();
            employeeProfiles.refresh();
          }}
        />
      </Panel>
      <Panel title="HR management and login access">
        <Message
          error={action.error || employeeProfiles.error}
          success={action.success}
        />
        <Resource resource={accounts}>
          <Table
            rows={accounts.data}
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
                label: "Password policy",
                render: (row) =>
                  row.mustChangePassword
                    ? "First password change required"
                    : row.passwordChangeRecommended
                      ? "Change recommended"
                      : "Optional change",
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
                      <Button
                        secondary
                        onClick={() => setAccountToEditRole(row)}
                      >
                        Change role
                      </Button>
                      <Button secondary onClick={() => setAccountToReset(row)}>
                        Reset access
                      </Button>
                    </div>
                  ),
              },
            ]}
          />
        </Resource>
      </Panel>
      {accountToEditRole && (
        <Panel title={`Change role · ${accountToEditRole.name}`}>
          <Form
            initial={{ role: accountToEditRole.role }}
            fields={[
              {
                name: "role",
                label: "Account role",
                options: ["admin", "hr", "employee"],
              },
            ]}
            submitLabel="Save role"
            onCancel={() => setAccountToEditRole(null)}
            onSubmit={async (body) => {
              await api(`/users/${accountToEditRole._id}`, {
                method: "PATCH",
                body,
              });
              setAccountToEditRole(null);
              accounts.refresh();
            }}
          />
        </Panel>
      )}
      {accountToReset && (
        <Panel title={`Reset access · ${accountToReset.name}`}>
          <p className="mb-5 text-sm text-zinc-400">
            Set and securely deliver a new password. Previous sessions are
            revoked. Requiring a password change at next sign-in is optional.
          </p>
          <Form
            key={accountToReset._id}
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
            onCancel={() => setAccountToReset(null)}
            onSubmit={async (body) => {
              await api(`/users/${accountToReset._id}`, {
                method: "PATCH",
                body,
              });
              setAccountToReset(null);
              accounts.refresh();
            }}
          />
        </Panel>
      )}
    </div>
  );
}
