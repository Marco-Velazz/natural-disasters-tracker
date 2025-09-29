import { useEffect, useRef, useState } from "react";

/* NWS alerts near a point (US-only) */
export default function useAlerts(point, { debug = false } = {}) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const ctrlRef = useRef(null);

  const lat = point?.lat ?? null;
  const lng = point?.lng ?? null;

  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

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
        // 1) point query (US-only; returns 400 if outside coverage)
        const pUrl = new URL(`${base}/alerts/active`);
        pUrl.searchParams.set("point", `${lat},${lng}`);
        pUrl.searchParams.set("status", "actual");
        pUrl.searchParams.set("message_type", "alert,update");
        log("GET", pUrl.toString());

        const r = await fetch(pUrl.toString(), { signal: ctrl.signal, headers });

        if (!r.ok) {
          if (r.status === 400) {
            // Friendly, typed error for UI
            setErr({ code: "OUTSIDE_US", message: "Location outside of the United States. NWS alerts are US-only." });
            setLoading(false);
            return;
          }
          throw new Error(`NWS alerts point HTTP ${r.status}`);
        }

        const j = await r.json();
        let feats = j?.features ?? [];
        log("point features:", feats.length);

        // 2) Fallbacks (zones/state) Only if we’re still inside US but got 0 features
        if (!feats.length) {
          const ptsUrl = `${base}/points/${lat},${lng}`;
          log("GET", ptsUrl);
          const pr = await fetch(ptsUrl, { signal: ctrl.signal, headers });

          if (pr.ok) {
            const pj = await pr.json();
            const props = pj?.properties || {};
            const zones = [props.forecastZone, props.fireWeatherZone, props.county].filter(Boolean);
            const state = props?.relativeLocation?.properties?.state;

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

            if (!feats.length && state) {
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
        if (e.name !== "AbortError") setErr(e);
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [lat, lng, debug]);

  return { alerts, loading, err };
}