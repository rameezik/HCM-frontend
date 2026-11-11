"use client";

import EmployeePhoto from "@/components/EmployeePhoto";
import { Panel, Button, Table } from "@/components/WorkspaceUI";
import { useResource } from "@/components/workspace/shared/useWorkspaceData";
import Resource from "@/components/workspace/shared/Resource";

export default function EmployeeDetails({ id, onClose, user, onChanged }) {
  const resource = useResource(`/employees/${id}`);
  return (
    <Panel
      title="Employee 360"
      action={
        <Button secondary onClick={onClose}>
          Close
        </Button>
      }
    >
      <Resource resource={resource}>
        {resource.data && (
          <>
            <EmployeePhoto
              employee={resource.data.employee}
              canEdit={
                user.role === "admin" ||
                String(user.employee) === String(id) ||
                (user.role === "hr" &&
                  resource.data.employee.user?.role === "employee")
              }
              onChanged={() => {
                resource.refresh();
                onChanged?.();
              }}
            />
            <dl className="mb-6 grid gap-3 sm:grid-cols-2">
              {Object.entries(resource.data.employee)
                .filter(
                  ([fieldName]) =>
                    ![
                      "_id",
                      "__v",
                      "user",
                      "photoBuffer",
                      "photoUpdatedAt",
                    ].includes(fieldName),
                )
                .map(([fieldName, value]) => (
                  <div key={fieldName}>
                    <dt className="text-xs uppercase text-zinc-500">
                      {fieldName}
                    </dt>
                    <dd className="text-sm">
                      {value?.name || String(value ?? "—")}
                    </dd>
                  </div>
                ))}
            </dl>
            <h3 className="my-4 font-medium">Recent attendance</h3>
            <Table
              rows={resource.data.attendance}
              columns={[{ key: "date" }, { key: "status" }, { key: "hours" }]}
            />
            <h3 className="my-4 font-medium">Leave history</h3>
            <Table
              rows={resource.data.leaves}
              columns={[
                { key: "start" },
                { key: "end" },
                { key: "type", render: (row) => row.type?.name },
                { key: "status" },
              ]}
            />
          </>
        )}
      </Resource>
    </Panel>
  );
}
