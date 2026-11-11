"use client";

import { api } from "@/lib/api";
import { Panel, Form } from "@/components/WorkspaceUI";
import { useResource } from "@/components/workspace/shared/useWorkspaceData";
import Resource from "@/components/workspace/shared/Resource";

export default function CompanySettings({ user }) {
  const company = useResource("/company");
  return (
    <Panel title="Company policy">
      <p className="mb-5 text-sm text-zinc-400">
        Attendance uses your company timezone and shift hours. Records retain
        their policy snapshot; stored timestamps remain UTC. Weekend numbers:
        Sunday 0 through Saturday 6.
      </p>
      <Resource resource={company}>
        {company.data &&
          (user.role === "admin" ? (
            <Form
              initial={{
                ...company.data,
                weekend: company.data.weekend.join(","),
              }}
              fields={[
                { name: "name", label: "Company name" },
                {
                  name: "officeStart",
                  label: "Office start (company timezone)",
                  type: "time",
                },
                {
                  name: "timezone",
                  label: "Company timezone (IANA)",
                  defaultValue: "UTC",
                },
                {
                  name: "officeEnd",
                  label: "Office end (company timezone)",
                  type: "time",
                  defaultValue: "17:00",
                },
                {
                  name: "maxShiftHours",
                  label: "Maximum shift duration (hours)",
                  type: "number",
                  min: 1,
                  max: 24,
                  defaultValue: 20,
                },
                {
                  name: "biometricRetentionDays",
                  label: "Biometric retention (days)",
                  type: "number",
                  min: 1,
                  max: 365,
                  defaultValue: 365,
                },
                {
                  name: "graceMinutes",
                  label: "Grace period (minutes)",
                  type: "number",
                  min: 0,
                  max: 180,
                },
                {
                  name: "halfDayHours",
                  label: "Half-day threshold (hours)",
                  type: "number",
                  min: 1,
                  max: 12,
                },
                {
                  name: "weekend",
                  label: "Weekend days, comma separated",
                  optional: true,
                },
                {
                  name: "latitude",
                  label: "Office latitude",
                  type: "number",
                  min: -90,
                  max: 90,
                  optional: true,
                },
                {
                  name: "longitude",
                  label: "Office longitude",
                  type: "number",
                  min: -180,
                  max: 180,
                  optional: true,
                },
                {
                  name: "radius",
                  label: "Office radius (meters)",
                  type: "number",
                  min: 1,
                  max: 10000,
                },
              ]}
              onSubmit={async (body) => {
                body.weekend = String(body.weekend || "")
                  .split(",")
                  .filter(Boolean)
                  .map(Number);
                await api("/company", { method: "PUT", body });
                company.refresh();
              }}
            />
          ) : (
            <dl className="grid gap-3 sm:grid-cols-2">
              {Object.entries(company.data)
                .filter(
                  ([fieldName]) =>
                    ![
                      "_id",
                      "__v",
                      "singleton",
                      "createdAt",
                      "updatedAt",
                    ].includes(fieldName),
                )
                .map(([fieldName, value]) => (
                  <div key={fieldName}>
                    <dt className="text-sm text-zinc-400">{fieldName}</dt>
                    <dd>{String(value)}</dd>
                  </div>
                ))}
            </dl>
          ))}
      </Resource>
    </Panel>
  );
}
