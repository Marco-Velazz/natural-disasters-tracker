import { useEffect, useRef, useState } from "react";

export default function useOpenMeteo(lat, lng) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef(null);

  useEffect(() => {
    if (lat == null || lng == null) return;
    setLoading(true);
    setErr(null);
    setData(null);

    if (ctrlRef.current) ctrlRef.current.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", lat.toFixed(4));
    url.searchParams.set("longitude", lng.toFixed(4));
    url.searchParams.set("hourly", "temperature_2m,precipitation_probability,wind_speed_10m,wind_direction_10m");
    url.searchParams.set("forecast_days", "2");
    url.searchParams.set("timezone", "auto");

    fetch(url.toString(), { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setData)
      .catch(e => {
        if (e.name !== "AbortError") setErr(e);
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [lat, lng]);

  return { data, err, loading };
}