export default function Navbar({ title = "Human Capital Management" }) {
  return (
    <header className="flex min-h-16 items-center justify-between border-b border-white/10 px-6">
      <p className="text-sm font-medium text-white/75">{title}</p>
      <span aria-label="Workspace status" className="size-2 rounded-full bg-[#FF2D95]" />
    </header>
  );
}