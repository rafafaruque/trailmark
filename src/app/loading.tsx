export default function Loading() {
  return (
    <div className="loading-view" role="status" aria-label="Loading workspace">
      <div className="skeleton skeleton-heading" />
      <div className="skeleton skeleton-subtitle" />
      <div className="skeleton-metrics">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton skeleton-row" />
      ))}
      <span className="sr-only">Loading workspace…</span>
    </div>
  );
}
