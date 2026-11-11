"use client";

import { Message } from "@/components/WorkspaceUI";

export default function Resource({ resource, children }) {
  return resource.error ? (
    <Message error={resource.error} />
  ) : resource.loading ? (
    <p role="status" className="py-6 text-zinc-400">
      Loading records…
    </p>
  ) : (
    children
  );
}
