import { Circle, Marker } from "@react-google-maps/api";

/* Visual + Textual impact summary */
export default function ImpactPanel({
  center,
  bufferKm = 50,
  pop, popLoading, popErr,
  infra, infraLoading, infraErr,
}) {
  const radiusM = bufferKm * 1000;
  return (
    <>
      {center && (
        <>
          <Circle
            center={center}
            radius={radiusM}
            options={{
              strokeColor: "#2563eb",
              strokeOpacity: 0.9,
              strokeWeight: 2,
              fillColor: "#2563eb",
              fillOpacity: 0.06,
              clickable: false,
            }}
          />
          {/* Render infra POIs */}
          {infra?.map((e) => (
            <Marker
              key={e.id}
              position={{ lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon }}
              title={e.tags?.name || Object.keys(e.tags || {})[0] || "POI"}
              // Default Icon
              optimized={true}
            />
          ))}
        </>
      )}

      <div style={panel}>
        <strong style={{ display: "block", marginBottom: 6 }}>Impact Estimate</strong>
        <div style={row}>
          <div style={label}>Buffer</div>
          <div style={val}>{bufferKm} km radius</div>
        </div>
        <div style={row}>
          <div style={label}>Population (rough)</div>
          <div style={val}>
            {popLoading ? "Loading…" : popErr ? "—" : pop?.toLocaleString() ?? "—"}
          </div>
        </div>
        <div style={row}>
          <div style={label}>Hospitals/Airports/Power</div>
          <div style={val}>
            {infraLoading ? "Loading…" : infraErr ? "—" : infra?.length ?? 0}
          </div>
        </div>
        {(popErr || infraErr) && (
          <div style={{ marginTop: 6, color: "#b00", fontSize: 12 }}>
            {popErr && <div>Population: {String(popErr.message || popErr)}</div>}
            {infraErr && <div>Infrastructure: {String(infraErr.message || infraErr)}</div>}
          </div>
        )}
      </div>
    </>
  );
}

const panel = {
  position: "absolute",
  bottom: 12,
  right: 12,
  zIndex: 1000,
  background: "rgba(255,255,255,0.95)",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 10,
  minWidth: 260,
  boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
};
const row = { display: "flex", justifyContent: "space-between", padding: "4px 0", borderTop: "1px solid #f3f4f6" };
const label = { fontSize: 12, color: "#555" };
const val = { fontSize: 12, fontWeight: 600 };