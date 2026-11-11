"use client";

import { Form } from "@/components/WorkspaceUI";

export default function DecisionForm({
  onSubmit,
  onCancel,
  cancellation = false,
}) {
  return (
    <Form
      fields={[
        {
          name: "status",
          label: "Decision",
          options: cancellation ? ["cancelled"] : ["approved", "rejected"],
        },
        { name: "comment", label: "Comment" },
      ]}
      onSubmit={onSubmit}
      onCancel={onCancel}
      submitLabel="Confirm decision"
    />
  );
}
