import { Polyline } from "@react-google-maps/api";
import { getFrames } from "./mapHelpers";

export default function PredictedTrail({ event, steps = 6 }) {
  const pts = getFrames(event).map(f => ({ t: new Date(f.date).getTime(), ...f }));
  if (pts.length < 2) return null;

  const p1 = pts[pts.length - 2];
  const p2 = pts[pts.length - 1];
  const dt = (p2.t - p1.t) || 1;
  const vLat = (p2.lat - p1.lat) / dt;
  const vLng = (p2.lng - p1.lng) / dt;

  const horizon = dt;
  const pred = [];
  for (let i = 1; i <= steps; i++) {
    pred.push({
      lat: p2.lat + vLat * (i * horizon),
      lng: p2.lng + vLng * (i * horizon),
    });
  }

  const arrow = window.google?.maps?.SymbolPath?.FORWARD_CLOSED_ARROW;

  return (
    <Polyline
      path={[{ lat: p2.lat, lng: p2.lng }, ...pred]}
      options={{
        strokeOpacity: 0.7,
        strokeWeight: 2,
        ...(arrow ? { icons: [{ icon: { path: arrow }, offset: "0", repeat: "30px" }] } : {}),
      }}
    />
  );
}