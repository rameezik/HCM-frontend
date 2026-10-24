"use client";
import { useId, useState } from "react";
export function Panel({ title, children, action }) {
  return (
    <section className="glass-card p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Message({ error, success }) {
  return (
    <>
      {error && (
        <p
          role="alert"
          className="my-3 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200"
        >
          {error}
        </p>
      )}
      {success && (
        <p
          role="status"
          className="my-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-sm text-cyan-200"
        >
          {success}
        </p>
      )}
    </>
  );
}
export function Button({ children, secondary = false, ...props }) {
  return (
    <button
      type="button"
      className={`rounded-xl px-4 py-2.5 text-sm font-medium transition hover:brightness-125 ${secondary ? "border border-white/15 bg-white/5" : "bg-[#007ba7] text-white"}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function Form({
  fields,
  initial = {},
  onSubmit,
  submitLabel = "Save",
  successMessage = "Saved successfully.",
  onCancel,
  disabled = false,
}) {
  const formId = useId();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (disabled || busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    for (const f of fields) {
      if (f.type === "number")
        data[f.name] = data[f.name] === "" ? undefined : Number(data[f.name]);
      if (f.type === "checkbox") data[f.name] = data[f.name] === "on";
      if (f.optional && data[f.name] === "") delete data[f.name];
    }
    try {
      await onSubmit(data);
      setSuccess(successMessage);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <label
            key={f.name}
            className={`block text-sm text-zinc-300 ${f.wide ? "sm:col-span-2" : ""}`}
          >
            <span id={`${formId}-${f.name}-label`} className="mb-2 block">
              {f.label || f.name}
              {f.optional ? " (optional)" : ""}
            </span>
            {f.options ? (
              <select
                aria-labelledby={`${formId}-${f.name}-label`}
                name={f.name}
                defaultValue={initial[f.name] ?? f.defaultValue ?? ""}
                className="input-field"
                required={!f.optional}
              >
                <option value="">Choose…</option>
                {f.options.map((o) => (
                  <option key={o.value ?? o} value={o.value ?? o}>
                    {o.label ?? o}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                aria-labelledby={`${formId}-${f.name}-label`}
                name={f.name}
                defaultValue={initial[f.name] ?? ""}
                className="input-field min-h-28"
                required={!f.optional}
                maxLength={f.maxLength || 5000}
              />
            ) : f.type === "checkbox" ? (
              <input
                aria-labelledby={`${formId}-${f.name}-label`}
                type="checkbox"
                name={f.name}
                defaultChecked={Boolean(initial[f.name] ?? f.defaultValue)}
              />
            ) : (
              <input
                aria-labelledby={`${formId}-${f.name}-label`}
                name={f.name}
                type={f.type || "text"}
                defaultValue={initial[f.name] ?? f.defaultValue ?? ""}
                className="input-field"
                required={!f.optional}
                minLength={f.minLength}
                maxLength={f.maxLength || (f.type === "password" ? 128 : 200)}
                min={f.min}
                max={f.max}
                step={f.step || (f.type === "number" ? "any" : undefined)}
                autoComplete={f.autoComplete}
              />
            )}
          </label>
        ))}
      </div>
      <Message error={error} success={success} />
      <div className="flex gap-3">
        <Button type="submit" disabled={busy || disabled}>
          {busy ? "Saving…" : submitLabel}
        </Button>
        {onCancel && (
          <Button secondary onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
export function Table({ rows, columns, empty = "No records yet." }) {
  if (!rows?.length)
    return (
      <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-400">
        {empty}
      </p>
    );
  return (
    <div className="overflow-x-auto">
      <table className="hcm-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col">
                {c.label ||
                  c.key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (s) => s.toUpperCase())}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r._id || (r.employee?._id && r.date ? `${r.employee._id}:${r.date}` : r.date || i)}>
              {columns.map((c) => (
                <td key={c.key}>
                  {c.render ? c.render(r) : String(r[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export const money = (value) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(value || 0);
export const tag = (value) => <span className="hcm-tag">{value}</span>;
