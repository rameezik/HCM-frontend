export default function FadeIn({ children, className = "" }) {
  return <div className={`hcm-fade-in ${className}`}>{children}</div>;
}
