export function SkeletonRow() {
  return (
    <div className="doc-row card" style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: "60%", height: 14, marginBottom: 6 }} />
          <div className="skeleton" style={{ width: "30%", height: 10 }} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonCard({ height = 100 }) {
  return <div className="skeleton card" style={{ height, border: "none" }} />;
}
