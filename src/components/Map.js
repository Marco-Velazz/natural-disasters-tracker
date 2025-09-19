import { useMemo, useState, useCallback } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";

const containerStyle = { width: "100vw", height: "100vh" };
const defaultCenter = { lat: 37.7749, lng: -122.4194 };

const mapOptions = {
  minZoom: 3,
  restriction: {
    latLngBounds: { north: 85, south: -85, west: -180, east: 180 },
    strictBounds: true,
  },
};


const CATEGORY_CONFIG = [
  { id: 6,  name: 'Drought',          iconUrl: "https://img.icons8.com/?size=80&id=NwYR4CioTprP&format=png" },
  { id: 8,  name: 'Wildfires',        iconUrl: "https://img.icons8.com/color/48/000000/fire-element.png" },
  { id: 9,  name: 'Floods',           iconUrl: "https://img.icons8.com/?size=40&id=39381&format=png" },
  { id: 10, name: "Severe Storms",    iconUrl: "https://img.icons8.com/?size=80&id=Htj5Mil1IpAa&format=png"},
  { id: 12, name: 'Volcanoes',        iconUrl: "https://img.icons8.com/?size=48&id=y2kv0CrYSX7w&format=png" },
  { id: 14, name: 'Landslides',       iconUrl: "https://img.icons8.com/?size=48&id=OedcKsGgfldo&format=png" },
  { id: 15, name: 'Sea and Lake Ice', iconUrl: "https://img.icons8.com/?size=48&id=24355&format=png" },
  { id: 16, name: 'Earthquakes',      iconUrl: "https://img.icons8.com/?size=80&id=rLrsZbGIEoHL&format=png" },
];

function Map({ events }) {
  const [selected, setSelected] = useState(null);

  // Helper so scaledSize works after Maps JS has loaded
  const buildIcon = (url) =>
    window.google? { url, scaledSize: new window.google.maps.Size(40, 40) }
    : { url };

  const eventsByCategory = useMemo(() => {
    return CATEGORY_CONFIG.map((cat) => {
      const catEvents = (events || [])
      .filter((ev) => ev.categories?.some((c) => c.id === cat.id))
      .map((ev) => {
        const latestGeo = ev.geometry?.[ev.geometry.length - 1];
        // If guard
        if (
          !latestGeo ||
          !Array.isArray(latestGeo.coordinates) ||
          latestGeo.coordinates.length < 2
        ) {
          return null;
        }
        const [lng, lat] = latestGeo.coordinates;
        return {
          ...ev,
          latestGeo,
          position: { lat, lng },
        };
      })
      .filter(Boolean);
    return { ...cat, events: catEvents };
    });
  }, [events]);

  const [mapRef, setMapRef] = useState(null);
  const onLoad = useCallback((map) => setMapRef(map), []);
  const onIdle = useCallback(() => {
    if (!mapRef) return;
    const c = mapRef.getCenter();

    // keep latitude sane so users can’t drag to the poles
    const lat = Math.max(-85, Math.min(85, c.lat()));
    // normalize longitude into [-180, 180] while allowing infinite horizontal pan
    const lng = ((c.lng() + 180) % 360) - 180;

    if (lat !== c.lat() || lng !== c.lng()) {
      mapRef.setCenter({ lat, lng });
    }
  }, [mapRef]);

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <GoogleMap mapContainerStyle={containerStyle} center={defaultCenter} zoom={4}
      options={mapOptions} onLoad={onLoad} onIdle={onIdle}>
        {eventsByCategory.map((cat) =>
          cat.events.map((ev) => (
          <Marker
            key={`${cat.id}-${ev.id}`}
            position={ev.position}
            icon={buildIcon(cat.iconUrl)}
            onClick={() => setSelected({ event: ev, category: cat})}
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
              <h3 style={{margin: 0 }}>{selected.event.title}</h3>
              <p style={{ margin: "4px 0"}}>
                <strong>Name:</strong> {selected.event.title}
              </p>
              <p style={{ margin: "4px 0"}}>
                <strong>Event ID:</strong> {selected.event.id}
              </p>
              {selected.event.latestGeo?.date && (
                <p style={{ margin: "4px 0" }}>
                  <strong>Last Update:</strong>{" "}
                  {new Date(selected.event.latestGeo.date).toLocaleString()}
                </p>
              )}
              {selected.event.link && (
                <p style={{ margin: "4px 0"}}>
                  <a href={selected.event.link} target="_blank" rel="noreferrer">
                    View on EONET
                  </a>
                </p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
}

export default Map;
