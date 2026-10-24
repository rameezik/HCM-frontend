export default function Input({
  className = "",
  error,
  id,
  label,
  name,
  ...props
}) {
  const inputId = id ?? name;

  return (
    <div className="grid gap-2">
      {label ? (
        <label className="text-sm font-medium text-white/85" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input
        aria-describedby={error ? `${inputId}-error` : undefined}
        aria-invalid={Boolean(error)}
        className={`min-h-10 rounded-md border border-white/15 bg-[#111] px-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#007BA7] ${className}`}
        id={inputId}
        name={name}
        {...props}
      />
      {error ? (
        <p className="text-sm text-[#FF2D95]" id={`${inputId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}