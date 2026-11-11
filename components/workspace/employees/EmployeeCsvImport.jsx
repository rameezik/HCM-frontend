"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwordPolicy";
import { Panel, Form, Table } from "@/components/WorkspaceUI";

export default function EmployeeCsvImport({ onImported }) {
  const [result, setResult] = useState(null);
  return (
    <Panel title="Employee CSV">
      <a
        download
        href="/api/employees/export"
        className="mb-5 inline-block text-sm text-[#82cde6] underline"
      >
        Export employees
      </a>
      <p className="mb-5 text-sm text-zinc-400">
        Columns:
        code,name,email,department,designation,joinDate,exitDate,status,gender,basic,phone,address.
        Use department and designation IDs shown in organization lists. Dry-run
        before importing. A temporary password is required only for import.
      </p>
      <Form
        fields={[
          {
            name: "csv",
            label: "CSV content",
            type: "textarea",
            wide: true,
            maxLength: 500000,
          },
          {
            name: "dryRun",
            label: "Validate only (dry run)",
            type: "checkbox",
            defaultValue: true,
          },
          {
            name: "password",
            label: "Initial password for imported accounts",
            type: "password",
            minLength: MIN_PASSWORD_LENGTH,
            optional: true,
          },
        ]}
        submitLabel="Process CSV"
        successMessage="CSV processed. Review the results below."
        onSubmit={async (body) => {
          const output = await api("/employees/import", {
            method: "POST",
            body,
          });
          setResult(output);
          if (output.imported) onImported();
        }}
      />
      {result && (
        <>
          <p className="my-4 text-sm">
            {result.imported !== undefined
              ? `Imported ${result.imported} employees.`
              : `${result.valid} of ${result.rows} rows valid.`}
          </p>
          <Table
            rows={result.errors}
            columns={[{ key: "row" }, { key: "field" }, { key: "reason" }]}
            empty="No validation errors."
          />
        </>
      )}
    </Panel>
  );
}
