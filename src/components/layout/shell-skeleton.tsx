/** Shown for the instant it takes to read the session: the AppShell's shape, no content. */
export function ShellSkeleton() {
  return (
    <div className="min-h-dvh bg-canvas lg:pl-(--sidebar-width)" aria-busy="true" aria-label="Loading">
      <div data-theme="dark" className="fixed inset-y-0 left-0 hidden w-(--sidebar-width) border-r border-line bg-canvas lg:block">
        <div className="m-5 h-11 w-32 rounded-control bg-surface-2" />
        <div className="mx-3 grid gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-11 rounded-control bg-surface-2/50" />
          ))}
        </div>
      </div>
      <div className="h-(--topbar-height) border-b border-line" />
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:px-8 lg:py-8">
        <div className="h-28 rounded-card bg-surface-2" />
        <div className="h-48 rounded-card bg-surface-2/70" />
      </div>
    </div>
  );
}
