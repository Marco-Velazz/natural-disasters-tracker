import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const containerStyle = { width: "100vw", height: "100vh" };
const center = { lat: 37.7749, lng: -122.4194 };

function Map() {

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
        <Marker
          position={center}
          icon={{
            url: "https://img.icons8.com/color/48/000000/fire-element.png",
            scaledSize: { width: 40, height: 40 },
          }}
        />
      </GoogleMap>
    </LoadScript>
  );
}

export default Map;