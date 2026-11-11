import { Button, Panel } from "@/components/WorkspaceUI";
import { getReadinessIssues } from "./readinessMessages";

export default function TerminalReadiness({
  missingConfiguration,
  loading,
  onRecheck,
}) {
  const issues = getReadinessIssues(missingConfiguration);

  return (
    <Panel
      title="Face attendance unavailable"
      action={
        <Button secondary disabled={loading} onClick={onRecheck}>
          {loading ? "Checking…" : "Recheck readiness"}
        </Button>
      }
    >
      <p className="text-sm leading-6 text-zinc-300">
        The recognition service is not ready on the deployed server. Resolve the
        items below, then recheck readiness. Employee records and manual
        attendance remain available.
      </p>
      <ul className="mt-4 space-y-3">
        {issues.map((issue) => (
          <li
            key={issue.code}
            className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4"
          >
            <p className="text-sm font-medium text-amber-100">{issue.title}</p>
            <code className="mt-1 block break-all text-xs text-amber-100/80">
              {issue.code}
            </code>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {issue.message}
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
