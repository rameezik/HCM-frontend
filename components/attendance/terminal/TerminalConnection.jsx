import { Button, Panel } from "@/components/WorkspaceUI";

export default function TerminalConnection({ terminal }) {
  const {
    connect,
    pairingToken,
    setPairingToken,
    busy,
    loading,
    retryConnection,
  } = terminal;
  return (
    <Panel title="Connect this terminal">
      <p className="mb-5 text-sm leading-6 text-zinc-400">
        Open the connection link from your company administrator. This device
        only needs to be connected once.
      </p>
      <form onSubmit={connect} className="space-y-4">
        <label className="block text-sm text-zinc-300">
          Connection code
          <input
            className="input-field mt-2"
            type="password"
            autoComplete="off"
            value={pairingToken}
            onChange={(event) => setPairingToken(event.target.value)}
            maxLength={200}
            required
          />
        </label>
        <Button disabled={busy || !pairingToken.trim()} type="submit">
          {busy ? "Connecting…" : "Connect terminal"}
        </Button>
      </form>
      <div className="mt-4">
        <Button secondary disabled={busy || loading} onClick={retryConnection}>
          Retry connection
        </Button>
      </div>
    </Panel>
  );
}
