import { useEffect, useState, useRef, useMemo } from "react";

/* Query Overpass for POIs within a radius (meters) */
export default function useOverpass({ lat, lng, radiusM = 50000, tags = [] }) {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const ctrlRef = useRef(null);

  // Stable key for dependency
  const tagsKey = useMemo(() => (Array.isArray(tags) ? tags.join("|") : ""), [tags]);

  useEffect(() => {
    if (lat == null || lng == null || !tagsKey) return;

    setLoading(true);
    setErr(null);
    setFeatures([]);

    if (ctrlRef.current) ctrlRef.current.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    const qTags = tags
      .map(t => `node[${t}](around:${radiusM},${lat},${lng});`)
      .join("");

    const query = `
      [out:json][timeout:25];
      (
        ${qTags}
      );
      out center;`;

    fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      headers: { "Content-Type": "text/plain" },
      signal: ctrl.signal
    })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(json => setFeatures(json?.elements ?? []))
      .catch(e => { if (e.name !== "AbortError") setErr(e); })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [lat, lng, radiusM, tagsKey]);

  return { features, loading, err };
}