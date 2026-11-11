"use client";

import { api } from "@/lib/api";
import { Panel, Form } from "@/components/WorkspaceUI";
import { formatDateTime } from "@/components/workspace/shared/format";
import { useResource } from "@/components/workspace/shared/useWorkspaceData";
import Resource from "@/components/workspace/shared/Resource";

export default function Announcements({ user, compact = false }) {
  const announcements = useResource("/announcements");
  return (
    <Panel title="Company announcements">
      {!compact && user.role !== "employee" && (
        <div className="mb-6">
          <Form
            fields={[
              { name: "title", label: "Title" },
              { name: "body", type: "textarea", label: "Message", wide: true },
            ]}
            submitLabel="Publish announcement"
            onSubmit={async (body) => {
              await api("/announcements", { method: "POST", body });
              announcements.refresh();
            }}
          />
        </div>
      )}
      <Resource resource={announcements}>
        {announcements.data?.length ? (
          announcements.data.slice(0, compact ? 5 : 100).map((row) => (
            <article
              key={row._id}
              className="border-b border-white/10 py-4 last:border-0"
            >
              <h3 className="font-medium">{row.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-400">
                {row.body}
              </p>
              <p className="mt-3 text-xs text-zinc-500">
                {row.actor?.name} · {formatDateTime(row.createdAt)} UTC
              </p>
            </article>
          ))
        ) : (
          <p className="text-sm text-zinc-400">No announcements yet.</p>
        )}
      </Resource>
    </Panel>
  );
}
