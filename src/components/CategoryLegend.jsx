export default function CategoryLegend({
  legendOpen,
  setLegendOpen,
  categories,
  enabled,
  countsByCat,
  onToggle,
  onSelectAll,
  onClear,
}) {
  return (
    <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1000 }}>
      {!legendOpen && (
        <button
          onClick={() => setLegendOpen(true)}
          aria-expanded={false}
          aria-controls="legend-panel"
          style={badgeBtn}
          title="Show filters"
        >
          🔎 Filters
          <span style={pill}>
            {Array.from(enabled).length}/{categories.length}
          </span>
        </button>
      )}

      {legendOpen && (
        <div
          id="legend-panel"
          role="dialog"
          aria-label="Disaster category filters"
          style={panel}
        >
          <div style={panelHead}>
            <strong>Filters</strong>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onSelectAll} style={ctrlBtn}>Select all</button>
              <button onClick={onClear} style={ctrlBtn}>Clear</button>
              <button onClick={() => setLegendOpen(false)} aria-label="Close" style={ctrlBtn}>✕</button>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories.map((c) => {
              const on = enabled.has(c.id);
              const count = countsByCat.get(c.id) ?? 0;
              return (
                <button
                  key={c.id}
                  onClick={() => onToggle(c.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid " + (on ? "#0a84ff" : "#d0d7de"),
                    background: on ? "#e7f2ff" : "#fff",
                    cursor: "pointer",
                  }}
                  aria-pressed={on}
                  title={c.name}
                >
                  <img src={c.iconUrl} alt="" width={18} height={18} />
                  <span style={{ fontSize: 12 }}>{c.name}</span>
                  <span style={countPill} aria-label={`${count} events`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const badgeBtn = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #d0d7de",
  background: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  cursor: "pointer",
  fontSize: 14,
};
const pill = {
  marginLeft: 6,
  fontSize: 12,
  padding: "2px 8px",
  borderRadius: 999,
  background: "#e7f2ff",
  border: "1px solid #0a84ff",
};
const panel = {
  background: "rgba(255,255,255,0.95)",
  borderRadius: 12,
  padding: 10,
  boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
  maxWidth: 380,
  minWidth: 280,
};
const panelHead = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8,
};
const ctrlBtn = {
  border: "1px solid #d0d7de",
  padding: "4px 8px",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
};
const countPill = {
  marginLeft: 4,
  fontSize: 11,
  padding: "0 6px",
  borderRadius: 999,
  background: "#f2f4f7",
  border: "1px solid #e5e7eb",
};