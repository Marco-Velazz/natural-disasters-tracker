import React, { useCallback, useMemo, useState } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow, Polyline } from "@react-google-maps/api";

import { containerStyle, defaultCenter, mapOptions, CATEGORY_CONFIG } from "./constants";
import { buildIcon, clampCenter, groupEventsByCategory, countByCategory, getFrames } from "./mapHelpers";
import PredictedTrail from "./PredictedTrail";
import EventTimelinePanel from "./EventTimelinePanel";
import CategoryLegend from "./CategoryLegend";

import useAlerts from "./useAlerts";
import AlertsPanel from "./AlertsPanel";
import useOverpass from "./useOverpass";
import usePopulationNearby from "./usePopulationNearby";
import ImpactPanel from "./ImpactPanel";
import { computeSeverity } from "./severity";

function DisasterMap({ events }) {
  const [selected, setSelected] = useState(null);
  const [frameIdx, setFrameIdx] = useState(0);
  const [legendOpen, setLegendOpen] = useState(false);

  // Filters
  const allIds = useMemo(() => CATEGORY_CONFIG.map(c => c.id), []);
  const [enabled, setEnabled] = useState(() => new Set(allIds));
  const toggle = (id) =>
    setEnabled(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const selectAll = () => setEnabled(new Set(allIds));
  const clearAll = () => setEnabled(new Set());

  const countsByCat = useMemo(() => countByCategory(events, CATEGORY_CONFIG), [events]);
  const eventsByCategory = useMemo(() => {
    const enabledCats = CATEGORY_CONFIG.filter(c => enabled.has(c.id));
    return groupEventsByCategory(events, enabledCats);
  }, [events, enabled]);

  // Map lifecycle
  const [mapRef, setMapRef] = useState(null);
  const onLoad = useCallback((map) => setMapRef(map), []);

  // Timeline frame (for storms)
  const currentFrame = useMemo(() => {
    if (!selected?.event?.geometry) return null;
    const frames = getFrames(selected.event);
    if (!frames.length) return null;
    const idx = Math.min(Math.max(frameIdx, 0), Math.max(frames.length - 1, 0));
    return { idx, total: frames.length, point: frames[idx] };
  }, [selected, frameIdx]);

  // InfoWindow options
  const infoOptions = useMemo(() => {
    if (!window.google) return {};
    return {
      pixelOffset: new window.google.maps.Size(0, -35),
      maxWidth: 280,
      disableAutoPan: true,
    };
  }, []);

  // Feature flags & selected metadata
  const showTimeline = !!(selected && selected.category?.id === 10); // Severe Storms
  const selectedPoint = selected?.event?.position || null;
  const lastUpdateISO =
    selected?.event?.latestGeo?.date ||
    selected?.event?.geometry?.[selected?.event?.geometry.length - 1]?.date;
  const ageHours = lastUpdateISO
    ? Math.max(0, (Date.now() - new Date(lastUpdateISO).getTime()) / 36e5)
    : null;

  // Alerts / Impact hooks
  const { alerts, loading: alertsLoading, err: alertsErr } = useAlerts(selectedPoint, { debug: false });

  const POP_RADIUS_KM = 50;
  const { totalPop, loading: popLoading, err: popErr } = usePopulationNearby({
    lat: selectedPoint?.lat ?? null,
    lng: selectedPoint?.lng ?? null,
    radiusKm: POP_RADIUS_KM,
  });

  const OVERPASS_TAGS = useMemo(
    () => ["amenity=hospital", "aeroway=aerodrome", "power=plant"],
    []
  );

  const INFRA_RADIUS_M = 50000;
  const {
    features: infra,
    loading: infraLoading,
    err: infraErr,
  } = useOverpass({
    lat: selectedPoint?.lat ?? null,
    lng: selectedPoint?.lng ?? null,
    radiusM: INFRA_RADIUS_M,
    tags: OVERPASS_TAGS,
  });

  // Severity calculation
  const pathLenKm = useMemo(() => {
    if (!showTimeline || !selected?.event?.geometry) return 0;
    const pts = (selected.event.geometry || [])
      .map(g =>
        Array.isArray(g.coordinates) && g.coordinates.length >= 2
          ? { lat: g.coordinates[1], lng: g.coordinates[0] }
          : null
      )
      .filter(Boolean);
    if (pts.length < 2) return 0;
    let sum = 0;
    for (let i = 1; i < pts.length; i++) sum += haversineKm(pts[i - 1], pts[i]);
    return sum;
  }, [showTimeline, selected]);

  const severity = computeSeverity({
    categoryId: selected?.category?.id ?? 0,
    ageHours: ageHours ?? 72,
    pathLenKm,
    population: totalPop ?? 0,
    infraCount: infra?.length ?? 0,
  });

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <div style={{ position: "relative", marginTop: "60px", width: "100vw", height: "calc(100vh - 60px)" }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={4}
          options={mapOptions}
          onLoad={onLoad}
        >
          {/* Event markers */}
          {eventsByCategory.flatMap((cat) =>
            cat.events.map((ev) => (
              <Marker
                key={`${cat.id}-${ev.id}`}
                position={ev.position}
                icon={buildIcon(cat.iconUrl)}
                onClick={() => {
                  setSelected({ event: ev, category: cat });
                  setFrameIdx(Math.max(0, (ev.geometry?.length ?? 1) - 1));
                }}
                optimized={true}
              />
            ))
          )}

          {/* Storm path + predicted trail + moving marker */}
          {selected && showTimeline && (
            <>
              <Polyline
                path={(selected.event.geometry || [])
                  .map((g) => {
                    if (!Array.isArray(g.coordinates) || g.coordinates.length < 2) return null;
                    const [lng, lat] = g.coordinates;
                    return { lat, lng };
                  })
                  .filter(Boolean)}
                options={{ strokeOpacity: 0.9, strokeWeight: 3 }}
              />
              <PredictedTrail event={selected.event} />
              {currentFrame?.point && (
                <Marker
                  position={{ lat: currentFrame.point.lat, lng: currentFrame.point.lng }}
                  title={`Frame ${currentFrame.idx + 1}/${currentFrame.total}`}
                  optimized={true}
                />
              )}
            </>
          )}

          {/* Alerts overlays + panel */}
          {selectedPoint && (
            <AlertsPanel
              alerts={alerts}
              loading={alertsLoading}
              err={alertsErr}
            />
          )}

          {/* Impact (buffer, POIs, numbers) */}
          {selectedPoint && (
            <ImpactPanel
              center={selectedPoint}
              bufferKm={POP_RADIUS_KM}
              pop={totalPop}
              popLoading={popLoading}
              popErr={popErr}
              infra={infra}
              infraLoading={infraLoading}
              infraErr={infraErr}
            />
          )}

          {/* Info about the selected event */}
          {selected && (
            <InfoWindow
              position={selected.event.position}
              options={infoOptions}
              onCloseClick={() => setSelected(null)}
            >
              <div style={{ maxWidth: 260 }}>
                <h3 style={{ margin: 0 }}>{selected.event.title}</h3>
                <p style={{ margin: "4px 0" }}><strong>Category:</strong> {selected.category.name}</p>
                <p style={{ margin: "4px 0" }}><strong>Event ID:</strong> {selected.event.id}</p>
                {selected.event.latestGeo?.date && (
                  <p style={{ margin: "4px 0" }}>
                    <strong>Last Update:</strong> {new Date(selected.event.latestGeo.date).toLocaleString()}
                  </p>
                )}
                <p style={{ margin: "4px 0" }}>
                  <strong>Severity (proto):</strong> {severity}/100
                </p>
                {selected.event.link && (
                  <p style={{ margin: "4px 0" }}>
                    <a href={selected.event.link} target="_blank" rel="noreferrer">View on EONET</a>
                  </p>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

        {/* Timeline panel */}
        {showTimeline && selected && (
          <EventTimelinePanel
            event={selected.event}
            frameIdx={frameIdx}
            setFrameIdx={setFrameIdx}
            onClose={() => setSelected(null)}
          />
        )}

        {/* Filters / legend */}
        <CategoryLegend
          legendOpen={legendOpen}
          setLegendOpen={setLegendOpen}
          categories={CATEGORY_CONFIG}
          enabled={enabled}
          countsByCat={countsByCat}
          onToggle={toggle}
          onSelectAll={selectAll}
          onClear={clearAll}
        />
      </div>
    </LoadScript>
  );
}

export default DisasterMap;

// Local Helper
function haversineKm(a, b) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin, c = Math.cos;
  const A = s(dLat / 2) ** 2 + c(toRad(a.lat)) * c(toRad(b.lat)) * s(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(A));
}