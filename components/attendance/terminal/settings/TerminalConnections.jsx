import { Button, Form, Panel, Table } from "@/components/WorkspaceUI";

const formatTime = (value) => (value ? new Date(value).toLocaleString() : "—");

export function TerminalLinkPanel({ pairing, onCreate, onCopy, onHideLink }) {
  return (
    <Panel title="Connect an attendance device">
      <Form
        fields={[{ name: "label", label: "Device name", maxLength: 80 }]}
        submitLabel="Create terminal link"
        successMessage=""
        onSubmit={onCreate}
      />
      {pairing && (
        <div className="mt-5 space-y-3 rounded-xl border border-cyan-300/20 p-4">
          <p className="font-medium">{pairing.label}</p>
          <label className="block text-sm text-zinc-300">
            Terminal connection link
            <input
              aria-label="Terminal connection link"
              readOnly
              value={pairing.url}
              onFocus={(event) => event.target.select()}
              className="input-field mt-2 w-full text-xs"
            />
          </label>
          <p className="text-sm text-zinc-400">
            This link works until {formatTime(pairing.expiresAt)} or until you
            disconnect the device. Share it only with your company.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button secondary onClick={() => onCopy(pairing.url)}>
              Copy terminal link
            </Button>
            <a
              href={pairing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-[#007ba7] px-4 py-2.5 text-sm text-white"
            >
              Connect this device
            </a>
            <Button secondary onClick={() => onHideLink()}>
              Hide link
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
}

export function ConnectedTerminalList({ devices, revoking, onDisconnect }) {
  return (
    <Panel title="Connected devices">
      {devices && (
        <Table
          rows={devices}
          columns={[
            { key: "label", label: "Device" },
            {
              key: "state",
              label: "Status",
              render: (device) =>
                ({
                  paired: "Connected",
                  pending: "Awaiting connection",
                  revoked: "Disconnected",
                })[device.state] || device.state,
            },
            {
              key: "credentialExpiresAt",
              label: "Access expires",
              render: (device) => formatTime(device.credentialExpiresAt),
            },
            {
              key: "actions",
              label: "Action",
              render: (device) =>
                device.state !== "revoked" && (
                  <Button
                    secondary
                    disabled={Boolean(revoking)}
                    onClick={() => onDisconnect(device)}
                  >
                    {revoking === String(device._id || device.id)
                      ? "Disconnecting…"
                      : "Disconnect device"}
                  </Button>
                ),
            },
          ]}
        />
      )}
    </Panel>
  );
}
