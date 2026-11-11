"use client";

export default function AiAvailability({ resource }) {
  if (resource.loading)
    return (
      <p className="mb-3 text-sm text-zinc-400" role="status">
        Checking optional AI availability…
      </p>
    );
  if (resource.data?.configured) return null;
  return (
    <p
      className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-400"
      role="status"
    >
      AI assistance is currently unavailable. Regular forms and reports remain
      available.
    </p>
  );
}
