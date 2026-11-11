"use client";

import EmployeePhoto from "@/components/EmployeePhoto";
import { api } from "@/lib/api";
import { Panel, Form, Message } from "@/components/WorkspaceUI";
import { useResource } from "@/components/workspace/shared/useWorkspaceData";
import Resource from "@/components/workspace/shared/Resource";

export default function ProfilePage({ user }) {
  const profile = useResource(
    user.employee ? `/employees/${user.employee}` : null,
  );
  if (!user.employee)
    return <Message error="Your login has no linked employee profile." />;
  return (
    <Panel title="My profile">
      <Resource resource={profile}>
        {profile.data && (
          <>
            <EmployeePhoto
              employee={profile.data.employee}
              canEdit
              onChanged={profile.refresh}
            />
            <p className="mb-5 text-zinc-400">
              {profile.data.employee.name} · {profile.data.employee.code} ·{" "}
              {profile.data.employee.department?.name}
            </p>
            <Form
              initial={profile.data.employee}
              fields={[
                { name: "phone", label: "Phone" },
                { name: "address", label: "Address" },
              ]}
              onSubmit={async (body) => {
                await api(`/employees/${user.employee}`, {
                  method: "PATCH",
                  body,
                });
                profile.refresh();
              }}
            />
          </>
        )}
      </Resource>
    </Panel>
  );
}
