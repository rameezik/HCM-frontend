"use client";

import { Panel, Table } from "@/components/WorkspaceUI";
import { formatDateTime } from "@/components/workspace/shared/format";
import { useResource } from "@/components/workspace/shared/useWorkspaceData";
import Resource from "@/components/workspace/shared/Resource";

export default function AuditLog({ compact = false }) {
  const auditEntries = useResource("/audit");
  return (
    <Panel title="Audit log">
      <Resource resource={auditEntries}>
        <Table
          rows={auditEntries.data?.slice(0, compact ? 5 : 200)}
          columns={[
            {
              key: "createdAt",
              label: "When (UTC)",
              render: (row) => formatDateTime(row.createdAt),
            },
            { key: "actor", render: (row) => row.actor?.name || "System" },
            { key: "action" },
            { key: "entity" },
            ...(!compact
              ? [
                  {
                    key: "changes",
                    render: (row) => (
                      <details>
                        <summary className="cursor-pointer text-[#82cde6]">
                          Before / after
                        </summary>
                        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs">
                          {JSON.stringify(
                            { before: row.before, after: row.after },
                            null,
                            2,
                          )}
                        </pre>
                      </details>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Resource>
    </Panel>
  );
}
