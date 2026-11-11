"use client";

import { Form } from "@/components/WorkspaceUI";
import { todayIso, currentMonth } from "@/components/workspace/shared/format";

export default function DateFilters({ onChange, initial = {} }) {
  return (
    <Form
      key={JSON.stringify(initial)}
      initial={{ start: `${currentMonth()}-01`, end: todayIso(), ...initial }}
      fields={[
        { name: "start", label: "From (UTC)", type: "date" },
        { name: "end", label: "Through (UTC)", type: "date" },
        ...(initial.department !== undefined
          ? [{ name: "department", label: "Department ID", optional: true }]
          : []),
      ]}
      submitLabel="Apply filters"
      successMessage="Filters applied."
      onSubmit={async (body) => onChange(body)}
    />
  );
}
