export default function Card({ children, className = "", title }) {
  return (
    <section className={`rounded-md border border-white/10 bg-[#111] p-5 ${className}`}>
      {title ? <h2 className="mb-4 text-base font-semibold text-white">{title}</h2> : null}
      {children}
    </section>
  );
}