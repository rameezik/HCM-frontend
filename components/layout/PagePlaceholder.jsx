export default function PagePlaceholder({ description, title }) {
  return (
    <section className="min-h-56">
      <p className="mb-2 text-xs font-semibold uppercase text-[#FF2D95]">Workspace</p>
      <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">{description}</p>
    </section>
  );
}