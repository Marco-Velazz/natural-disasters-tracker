import { useMemo, useState, useCallback } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";

const containerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 37.7749, lng: -122.4194 };

const mapOptions = {
  minZoom: 3,
  restriction: {
    latLngBounds: { north: 85, south: -85, west: -180, east: 180 },
    strictBounds: true,
  },
};

const ALL_CATEGORIES = [
  { id: 6,  name: 'Drought',              iconUrl: 'https://img.icons8.com/?size=80&id=NwYR4CioTprP&format=png' },
  { id: 7,  name: 'Dust and Haze',        iconUrl: 'https://img.icons8.com/?size=80&id=11639&format=png' },
  { id: 8,  name: 'Wildfires',            iconUrl: 'https://img.icons8.com/color/48/000000/fire-element.png' },
  { id: 9,  name: 'Floods',               iconUrl: 'https://img.icons8.com/?size=40&id=39381&format=png' },
  { id: 10, name: 'Severe Storms',        iconUrl: 'https://img.icons8.com/?size=80&id=Htj5Mil1IpAa&format=png' },
  { id: 12, name: 'Volcanoes',            iconUrl: 'https://img.icons8.com/?size=48&id=y2kv0CrYSX7w&format=png' },
  { id: 13, name: 'Water Color',          iconUrl: 'https://img.icons8.com/?size=80&id=59791&format=png' },
  { id: 14, name: 'Landslides',           iconUrl: 'https://img.icons8.com/?size=48&id=OedcKsGgfldo&format=png' },
  { id: 15, name: 'Sea and Lake Ice',     iconUrl: 'https://img.icons8.com/?size=48&id=24355&format=png' },
  { id: 16, name: 'Earthquakes',          iconUrl: 'https://img.icons8.com/?size=80&id=rLrsZbGIEoHL&format=png' },
  { id: 17, name: 'Snow',                 iconUrl: 'https://img.icons8.com/?size=48&id=602&format=png' },
  { id: 18, name: 'Temperature Extremes', iconUrl: 'https://img.icons8.com/?size=80&id=GxwXbwxSlzps&format=png' },
  { id: 19, name: 'Manmade',              iconUrl: 'https://img.icons8.com/?size=80&id=13677&format=png' },
];

const CATEGORY_CONFIG = ALL_CATEGORIES;

function DisasterMap({ events }) {
  const [selected, setSelected] = useState(null);

  // Legend state
  const [legendOpen, setLegendOpen] = useState(false);

  // Enabled categories
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

  // Icon helper
  const buildIcon = (url) =>
    window.google ? { url, scaledSize: new window.google.maps.Size(40, 40) } : { url };

  // Counts for legend badges
  const countsByCat = useMemo(() => {
    const out = new window.Map();
    for (const cat of CATEGORY_CONFIG) {
      const n = (events || []).filter(e => e.categories?.some(c => c.id === cat.id)).length;
      out.set(cat.id, n);
    }
    return out;
  }, [events]);

  // Markers grouped by enabled categories
  const eventsByCategory = useMemo(() => {
    return CATEGORY_CONFIG
      .filter(cat => enabled.has(cat.id))
      .map((cat) => {
        const catEvents = (events || [])
          .filter((ev) => ev.categories?.some((c) => c.id === cat.id))
          .map((ev) => {
            const latestGeo = ev.geometry?.[ev.geometry.length - 1];
            if (!latestGeo || !Array.isArray(latestGeo.coordinates) || latestGeo.coordinates.length < 2) return null;
            const [lng, lat] = latestGeo.coordinates;
            return { ...ev, latestGeo, position: { lat, lng } };
          })
          .filter(Boolean);
        return { ...cat, events: catEvents };
      });
  }, [events, enabled]);

  // Infinite E/W wrap + clamp latitude
  const [mapRef, setMapRef] = useState(null);
  const onLoad = useCallback((map) => setMapRef(map), []);
  const onIdle = useCallback(() => {
    if (!mapRef) return;
    const c = mapRef.getCenter();
    const lat = Math.max(-85, Math.min(85, c.lat()));
    const lng = ((c.lng() + 180) % 360) - 180;
    if (lat !== c.lat() || lng !== c.lng()) mapRef.setCenter({ lat, lng });
  }, [mapRef]);

return (
  <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
    {/* Wrapper is below the header */}
    <div
      style={{
        position: "relative",
        marginTop: "60px",
        width: "100vw",
        height: "calc(100vh - 60px)",
      }}
    >
      <GoogleMap
        // Make the map fill the wrapper instead of the whole viewport
        mapContainerStyle={ containerStyle }
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
              onClick={() => setSelected({ event: ev, category: cat })}
              optimized={true}
            />
          ))
        )}

        {selected && (
          <InfoWindow
            position={selected.event.position}
            onCloseClick={() => setSelected(null)}
          >
            <div style={{ maxWidth: 260 }}>
              <h3 style={{ margin: 0 }}>{selected.event.title}</h3>
              <p style={{ margin: "4px 0" }}>
                <strong>Category:</strong> {selected.category.name}
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Event ID:</strong> {selected.event.id}
              </p>
              {selected.event.latestGeo?.date && (
                <p style={{ margin: "4px 0" }}>
                  <strong>Last Update:</strong>{" "}
                  {new Date(selected.event.latestGeo.date).toLocaleString()}
                </p>
              )}
              {selected.event.link && (
                <p style={{ margin: "4px 0" }}>
                  <a href={selected.event.link} target="_blank" rel="noreferrer">
                    View on EONET
                  </a>
                </p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Collapsible legend  */}
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1000 }}>
        {!legendOpen && (
          <button
            onClick={() => setLegendOpen(true)}
            aria-expanded={false}
            aria-controls="legend-panel"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid #d0d7de",
              background: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              cursor: "pointer",
              fontSize: 14,
            }}
            title="Show filters"
          >
            🔎 Filters
            <span
              style={{
                marginLeft: 6,
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 999,
                background: "#e7f2ff",
                border: "1px solid #0a84ff",
              }}
            >
              {Array.from(enabled).length}/{CATEGORY_CONFIG.length}
            </span>
          </button>
        )}

        {legendOpen && (
          <div
            id="legend-panel"
            role="dialog"
            aria-label="Disaster category filters"
            style={{
              background: "rgba(255,255,255,0.95)",
              borderRadius: 12,
              padding: 10,
              boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
              maxWidth: 380,
              minWidth: 280,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <strong>Filters</strong>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={selectAll}
                  style={{
                    border: "1px solid #d0d7de",
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Select all
                </button>
                <button
                  onClick={clearAll}
                  style={{
                    border: "1px solid #d0d7de",
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Clear
                </button>
                <button
                  onClick={() => setLegendOpen(false)}
                  aria-label="Close"
                  style={{
                    border: "1px solid #d0d7de",
                    padding: "4px 8px",
                    borderRadius: 6,
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CATEGORY_CONFIG.map((c) => {
                const on = enabled.has(c.id);
                const count = countsByCat.get(c.id) ?? 0;
                return (
                  <button
                    key={c.id}
                    onClick={() => toggle(c.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid " + (on ? "#0a84ff" : "#d0d7de"),
                      background: on ? "#e7f2ff" : "#fff",
                      cursor: "pointer",
                    }}
                    aria-pressed={on}
                    title={c.name}
                  >
                    <img src={c.iconUrl} alt="" width={18} height={18} />
                    <span style={{ fontSize: 12 }}>{c.name}</span>
                    <span
                      style={{
                        marginLeft: 4,
                        fontSize: 11,
                        padding: "0 6px",
                        borderRadius: 999,
                        background: "#f2f4f7",
                        border: "1px solid #e5e7eb",
                      }}
                      aria-label={`${count} events`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  </LoadScript>
  );
}
export default DisasterMap;
