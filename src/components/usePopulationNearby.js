import { useEffect, useState, useRef } from "react";

/* Rough population estimate using GeoNames "nearby place names" */
export default function usePopulationNearby({ lat, lng, radiusKm = 50, maxRows = 50, username }) {
  const [totalPop, setTotalPop] = useState(null);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const ctrlRef = useRef(null);

  const user = username || process.env.REACT_APP_GEONAMES_USER;

  useEffect(() => {
    // need valid point
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (!user) { setErr(new Error("GeoNames username missing")); return; }

    setLoading(true); setErr(null); setCities([]); setTotalPop(null);

    if (ctrlRef.current) ctrlRef.current.abort();
    const ctrl = new AbortController(); 
    ctrlRef.current = ctrl;

    const url = new URL("/.netlify/functions/geonames", window.location.origin);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lng", String(lng));
    url.searchParams.set("radiusKm", String(radiusKm));
    url.searchParams.set("maxRows", String(maxRows));

    fetch(url.toString(), { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(json => {
      const list = json?.geonames ?? [];
      setCities(list);
      const sum = list.reduce((acc, c) => acc + (c.population || 0), 0);
      setTotalPop(sum || 0);
    })
    .catch(e => { if (e.name !== "AbortError") setErr(e); })
    .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [lat, lng, radiusKm, maxRows, user]);

  return { totalPop, cities, loading, err };
}