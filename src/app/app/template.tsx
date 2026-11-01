// Re-mounts on every navigation between sections, so each page fades in
// while the layout (rail, painted fern) stays in place.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
