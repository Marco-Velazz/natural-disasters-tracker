import { useEffect, useRef, useState } from "react";

/* NWS alerts near a point (US-only) */
export default function useAlerts(point, { debug = false } = {}) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const ctrlRef = useRef(null);

  useEffect(() => {
    if (!point || !isFinite(point.lat) || !isFinite(point.lng)) return;

    setLoading(true);
    setErr(null);
    setAlerts([]);

    if (ctrlRef.current) ctrlRef.current.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    const base = "https://api.weather.gov";
    const headers = {
      Accept: "application/geo+json",
      "User-Agent": "natural-disasters-tracker/1.0 (student project)",
    };

    const log = (...args) => debug && console.log("[useAlerts]", ...args);

    (async () => {
      try {
        // 1) Try point query
        const pUrl = new URL(`${base}/alerts/active`);
        pUrl.searchParams.set("point", `${point.lat},${point.lng}`);
        // Reduce noise to current actionable alerts
        pUrl.searchParams.set("status", "actual");
        pUrl.searchParams.set("message_type", "alert,update");
        log("GET", pUrl.toString());
        let r = await fetch(pUrl.toString(), { signal: ctrl.signal, headers });
        if (!r.ok) throw new Error(`NWS alerts point HTTP ${r.status}`);
        let j = await r.json();
        let feats = j?.features ?? [];
        log("point features:", feats.length);

        if (feats.length === 0) {
          // 2) Resolve zones for the point
          const ptsUrl = `${base}/points/${point.lat},${point.lng}`;
          log("GET", ptsUrl);
          const pr = await fetch(ptsUrl, { signal: ctrl.signal, headers });
          if (pr.ok) {
            const pj = await pr.json();
            const props = pj?.properties || {};
            const zones = [
              props.forecastZone,
              props.fireWeatherZone,
              props.county,
            ].filter(Boolean);

            const state = props?.relativeLocation?.properties?.state;
            log("zones:", zones, "state:", state);

            // Try each zone in order
            for (const zHref of zones) {
              const zoneId = String(zHref).split("/").pop();
              if (!zoneId) continue;
              const zUrl = new URL(`${base}/alerts/active`);
              zUrl.searchParams.set("zone", zoneId);
              zUrl.searchParams.set("status", "actual");
              zUrl.searchParams.set("message_type", "alert,update");
              log("GET", zUrl.toString());
              const zr = await fetch(zUrl.toString(), { signal: ctrl.signal, headers });
              if (zr.ok) {
                const zj = await zr.json();
                feats = zj?.features ?? [];
                log(`zone ${zoneId} features:`, feats.length);
                if (feats.length) break;
              }
            }

            // 3) Last fallback: state area
            if (feats.length === 0 && state) {
              const aUrl = new URL(`${base}/alerts/active`);
              aUrl.searchParams.set("area", state);
              aUrl.searchParams.set("status", "actual");
              aUrl.searchParams.set("message_type", "alert,update");
              log("GET", aUrl.toString());
              const ar = await fetch(aUrl.toString(), { signal: ctrl.signal, headers });
              if (ar.ok) {
                const aj = await ar.json();
                feats = aj?.features ?? [];
                log(`area ${state} features:`, feats.length);
              }
            }
          }
        }

        setAlerts(feats);
      } catch (e) {
        if (e.name !== "AbortError") {
          setErr(e);
          log("error:", e);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [point?.lat, point?.lng, debug]);

  return { alerts, loading, err };
}