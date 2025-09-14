import { useState } from "react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";

const containerStyle = { width: "100vw", height: "100vh" };
const defaultCenter = { lat: 37.7749, lng: -122.4194 };
const WILDFIRE_CATEGORY = 8;

function Map({ events }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const wildfireEvents = events
    .filter(ev => ev.categories.some(cat => cat.id === WILDFIRE_CATEGORY))
    .map(ev => {
      const latestGeo = ev.geometry[ev.geometry.length - 1];
      return { ...ev, latestGeo };
    });

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <GoogleMap mapContainerStyle={containerStyle} center={defaultCenter} zoom={4}>
        {wildfireEvents.map(ev => (
          <Marker
            key={ev.id}
            position={{
              lat: ev.latestGeo.coordinates[1],
              lng: ev.latestGeo.coordinates[0],
            }}
            icon={{
              url: "https://img.icons8.com/color/48/000000/fire-element.png",
              scaledSize: { width: 40, height: 40 },
            }}
            onClick={() => setSelectedEvent(ev)}
          />
        ))}

        {selectedEvent && (
          <InfoWindow
            position={{
              lat: selectedEvent.latestGeo.coordinates[1],
              lng: selectedEvent.latestGeo.coordinates[0],
            }}
            onCloseClick={() => setSelectedEvent(null)}
          >
            <div>
              <h3>{selectedEvent.title}</h3>
              <p>ID: {selectedEvent.id}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
}

export default Map;
