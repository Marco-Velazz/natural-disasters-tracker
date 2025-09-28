import React, { useCallback, useMemo, useState } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow, Polyline } from "@react-google-maps/api";

import { containerStyle, defaultCenter, mapOptions, CATEGORY_CONFIG } from "./constants";
import { buildIcon, clampCenter, groupEventsByCategory, countByCategory, getFrames } from "./mapHelpers";
import PredictedTrail from "./PredictedTrail";
import EventTimelinePanel from "./EventTimelinePanel";
import CategoryLegend from "./CategoryLegend";

function DisasterMap({ events }) {
  const [selected, setSelected] = useState(null);
  const [frameIdx, setFrameIdx] = useState(0);
  const [legendOpen, setLegendOpen] = useState(false);

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

  const [mapRef, setMapRef] = useState(null);
  const onLoad = useCallback((map) => setMapRef(map), []);
  const onIdle = useCallback(() => clampCenter(mapRef), [mapRef]);

  const currentFrame = useMemo(() => {
    if (!selected?.event?.geometry) return null;
    const frames = getFrames(selected.event);
    if (!frames.length) return null;
    const idx = Math.min(Math.max(frameIdx, 0), Math.max(frames.length - 1, 0));
    return { idx, total: frames.length, point: frames[idx] };
  }, [selected, frameIdx]);

  const infoOptions = useMemo(() => {
    if (!window.google) return {};
    return {
      pixelOffset: new window.google.maps.Size(0, -35),
      maxWidth: 280,
      disableAutoPan: true,
    };
  }, []);

  const showTimeline = !!(selected && selected.category?.id === 10);

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <div style={{ position: "relative", marginTop: "60px", width: "100vw", height: "calc(100vh - 60px)" }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={4}
          options={mapOptions}
          onLoad={onLoad}
          onIdle={onIdle}
        >
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

          {selected && (
            <>
              {showTimeline && (
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
                  {selected.event.link && (
                    <p style={{ margin: "4px 0" }}>
                      <a href={selected.event.link} target="_blank" rel="noreferrer">View on EONET</a>
                    </p>
                  )}
                </div>
              </InfoWindow>
            </>
          )}
        </GoogleMap>

        {showTimeline && selected && (
          <EventTimelinePanel
            event={selected.event}
            frameIdx={frameIdx}
            setFrameIdx={setFrameIdx}
            onClose={() => setSelected(null)}
          />
        )}

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