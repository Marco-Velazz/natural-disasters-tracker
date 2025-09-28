import useOpenMeteo from "./useOpenMeteo";
import { th, td, fmt } from "./constants";

export default function ForecastCard({ lat, lng }) {
  const { data, err, loading } = useOpenMeteo(lat, lng);

  if (loading) return <p style={{ fontSize: 14 }}>Loading forecast…</p>;
  if (err) return <p style={{ color: "#b00", fontSize: 14 }}>Forecast error: {String(err)}</p>;
  if (!data?.hourly?.time?.length) return <p style={{ fontSize: 14 }}>No forecast data.</p>;

  const rows = [];
  for (let i = 0; i < Math.min(12, data.hourly.time.length); i++) {
    rows.push({
      time: data.hourly.time[i],
      temp: data.hourly.temperature_2m?.[i],
      wind: data.hourly.wind_speed_10m?.[i],
      windDir: data.hourly.wind_direction_10m?.[i],
      pop: data.hourly.precipitation_probability?.[i],
    });
  }

  return (
    <div style={{ marginTop: 8, maxHeight: 160, overflow: "auto", border: "1px solid #eee", borderRadius: 8 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, tableLayout: "fixed" }}>
        <thead>
          <tr style={{ background: "#f6f8fa" }}>
            <th style={{ ...th, width: "30%" }}>Time</th>
            <th style={{ ...th, width: "17.5%" }}>Temp (°C)</th>
            <th style={{ ...th, width: "17.5%" }}>Wind (m/s)</th>
            <th style={{ ...th, width: "17.5%" }}>Dir (°)</th>
            <th style={{ ...th, width: "17.5%" }}>POP (%)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={td}>{new Date(r.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
              <td style={td}>{fmt(r.temp)}</td>
              <td style={td}>{fmt(r.wind)}</td>
              <td style={td}>{fmt(r.windDir)}</td>
              <td style={td}>{fmt(r.pop)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}