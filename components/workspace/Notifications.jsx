"use client";

import { Panel, Message, Button, Table } from "@/components/WorkspaceUI";
import { formatDateTime } from "@/components/workspace/shared/format";
import {
  useResource,
  useAction,
} from "@/components/workspace/shared/useWorkspaceData";
import Resource from "@/components/workspace/shared/Resource";

export default function Notifications() {
  const notifications = useResource("/notifications"),
    action = useAction(notifications.refresh);
  return (
    <Panel title="My notifications">
      <Message error={action.error} />
      <Resource resource={notifications}>
        <Table
          rows={notifications.data}
          columns={[
            { key: "message" },
            {
              key: "createdAt",
              render: (row) => formatDateTime(row.createdAt),
            },
            {
              key: "read",
              render: (row) =>
                row.read ? (
                  "Read"
                ) : (
                  <Button
                    secondary
                    disabled={action.busy}
                    onClick={() =>
                      action.act(`/notifications/${row._id}`, "PATCH")
                    }
                  >
                    Mark read
                  </Button>
                ),
            },
          ]}
        />
      </Resource>
    </Panel>
  );
}
