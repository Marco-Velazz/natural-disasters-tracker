export const containerStyle = { width: "100%", height: "100%" };

export const defaultCenter = { lat: 37.7749, lng: -122.4194 };

export const mapOptions = {
  minZoom: 3,
  restriction: {
    latLngBounds: { north: 85, south: -85, west: -180, east: 180 },
    strictBounds: true,
  },
};

export const CATEGORY_CONFIG = [
  { id: 6,  name: "Drought",              iconUrl: "https://img.icons8.com/?size=80&id=NwYR4CioTprP&format=png" },
  { id: 7,  name: "Dust and Haze",        iconUrl: "https://img.icons8.com/?size=96&id=19565&format=png" },
  { id: 8,  name: "Wildfires",            iconUrl: "https://img.icons8.com/color/48/000000/fire-element.png" },
  { id: 9,  name: "Floods",               iconUrl: "https://img.icons8.com/?size=160&id=EW3BfZ02fr1d&format=png" },
  { id: 10, name: "Severe Storms",        iconUrl: "https://img.icons8.com/?size=96&id=vkVqvWmxmEkA&format=png" },
  { id: 12, name: "Volcanoes",            iconUrl: "https://img.icons8.com/?size=48&id=y2kv0CrYSX7w&format=png" },
  { id: 13, name: "Water Color",          iconUrl: "https://img.icons8.com/?size=96&id=UC01sKb4gLlw&format=png" },
  { id: 14, name: "Landslides",           iconUrl: "https://img.icons8.com/?size=48&id=OedcKsGgfldo&format=png" },
  { id: 15, name: "Sea and Lake Ice",     iconUrl: "https://img.icons8.com/?size=48&id=24355&format=png" },
  { id: 16, name: "Earthquakes",          iconUrl: "https://img.icons8.com/?size=80&id=rLrsZbGIEoHL&format=png" },
  { id: 17, name: "Snow",                 iconUrl: "https://img.icons8.com/?size=128&id=66780&format=png" },
  { id: 18, name: "Temperature Extremes", iconUrl: "https://img.icons8.com/?size=120&id=6yomF9LAoWai&format=png" },
  { id: 19, name: "Manmade",              iconUrl: "https://img.icons8.com/?size=96&id=lOpR2t8Ke7gs&format=png" },
];

// Small table styles + util
export const th = {
  textAlign: "left",
  padding: "6px 8px",
  borderBottom: "1px solid #eee",
  position: "sticky",
  top: 0,
  background: "#f6f8fa",
  zIndex: 1,
};
export const td = {
  padding: "6px 8px",
  borderBottom: "1px solid #f0f0f0",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
export const fmt = (v) => (v ?? v === 0 ? Math.round(v) : "—");