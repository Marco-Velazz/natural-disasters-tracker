import { useEffect, useState } from "react";
import { Polygon } from "@react-google-maps/api";

/* Render alert polygons on the map + a small list panel */
export default function AlertsPanel({ alerts, loading, err }) {
  const [showLoading, setShowLoading] = useState(false);
  useEffect(() => {
    if (!loading) return setShowLoading(false);
    const t = setTimeout(() => setShowLoading(true), 250);
    return () => clearTimeout(t);
  }, [loading]);

  const polys = alerts
    .map(a => {
      const g = a?.geometry;
      if (!g || !g.coordinates || !g.type) return null;
      if (g.type === "Polygon") return [g.coordinates];
      if (g.type === "MultiPolygon") return g.coordinates;
      return null;
    })
    .filter(Boolean);

  const isOutsideUS = err && err.code === "OUTSIDE_US";

  return (
    <>
      {polys.flatMap((polyGroup, i) =>
        polyGroup.map((ring, j) => {
          const path = ring[0].map(([lng, lat]) => ({ lat, lng }));
          return (
            <Polygon
              key={`alert-poly-${i}-${j}`}
              paths={path}
              options={{
                strokeOpacity: 0.9,
                strokeWeight: 2,
                strokeColor: "#b20000",
                fillColor: "#b20000",
                fillOpacity: 0.08,
                clickable: false,
              }}
            />
          );
        })
      )}

      {/* Floating list */}
      <div style={panel}>
        <strong style={{ display: "block", marginBottom: 6 }}>Active Alerts (US Only)</strong>

        {/* Custom outside-US message */}
        {isOutsideUS && (
          <div style={muted}>
            Location outside of the United States. Please select an icon within the US.
          </div>
        )}

        {/* Generic error (only if not outside-US) */}
        {!isOutsideUS && err && (
          <div style={errStyle}>
            {err.message ? String(err.message) : String(err)}
          </div>
        )}

        {!err && showLoading && (
          <div style={muted}>Searching active alerts… please wait.</div>
        )}

        {!err && !loading && alerts.length === 0 && (
          <div style={muted}>No active alerts at this location.</div>
        )}

        {!err && !loading && alerts.length > 0 && alerts.slice(0, 6).map((a, i) => (
          <div key={i} style={row}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>
              {a?.properties?.event ?? "Alert"}
            </div>
            <div style={{ fontSize: 11, color: "#555" }}>
              {a?.properties?.headline ?? a?.properties?.description?.slice(0, 90)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const panel = {
  position: "absolute",
  top: 64,
  left: 12,
  zIndex: 1000,
  background: "rgba(255,255,255,0.95)",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 10,
  maxWidth: 360,
  boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
};
const row = { padding: "6px 0", borderTop: "1px solid #f0f0f0" };
const muted = { fontSize: 12, color: "#666" };
const errStyle = { fontSize: 12, color: "#b00" };