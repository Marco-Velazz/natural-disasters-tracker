import ForecastCard from "./ForecastCard";
import { getFrames } from "./mapHelpers";

export default function EventTimelinePanel({ event, frameIdx, setFrameIdx, onClose }) {
  const frames = getFrames(event);
  const idx = Math.min(Math.max(frameIdx, 0), Math.max(frames.length - 1, 0));
  const current = frames[idx] || null;

  return (
    <div
      style={{
        position: "absolute",
        left: 12,
        bottom: 12,
        zIndex: 1100,
        borderRadius: 12,
        background: "rgba(255,255,255,0.96)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        padding: 10,
        width: "min(520px, 92vw)",
        display: "grid",
        gridTemplateColumns: "1fr 240px",
        gap: 10,
      }}
      role="dialog"
      aria-label="Event timeline"
    >
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong>Timeline</strong>
          <button
            onClick={onClose}
            style={{ border: "1px solid #d0d7de", background: "#fff", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}
            aria-label="Close timeline"
          >
            ✕
          </button>
        </div>

        <div style={{ marginTop: 10 }}>
          <input
            type="range"
            min={0}
            max={Math.max(frames.length - 1, 0)}
            value={idx}
            onChange={(e) => setFrameIdx(parseInt(e.target.value, 10))}
            style={{ width: "100%" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 6 }}>
            <span>{frames[0] ? new Date(frames[0].date).toLocaleString() : "—"}</span>
            <span>{current ? new Date(current.date).toLocaleString() : "—"}</span>
            <span>{frames[frames.length - 1] ? new Date(frames[frames.length - 1].date).toLocaleString() : "—"}</span>
          </div>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button onClick={() => setFrameIdx(0)}   style={btn}>⏮ Start</button>
          <button onClick={() => setFrameIdx(Math.max(idx - 1, 0))} style={btn}>◀ Prev</button>
          <button onClick={() => setFrameIdx(Math.min(idx + 1, Math.max(frames.length - 1, 0)))} style={btn}>Next ▶</button>
          <button onClick={() => setFrameIdx(Math.max(frames.length - 1, 0))} style={btn}>⏭ End</button>
        </div>
      </div>

      <div>
        <strong>Local Forecast (Open-Meteo)</strong>
        {current ? (
          <ForecastCard lat={current.lat} lng={current.lng} />
        ) : (
          <p style={{ fontSize: 14, color: "#666", marginTop: 8 }}>Select a frame to view a local forecast.</p>
        )}
      </div>
    </div>
  );
}

const btn = {
  border: "1px solid #d0d7de",
  background: "#fff",
  borderRadius: 6,
  padding: "4px 8px",
  cursor: "pointer",
};