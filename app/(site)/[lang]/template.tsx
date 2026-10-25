// Re-mounts on every page change, so each new page settles in gently.
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
