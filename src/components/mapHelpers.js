export const buildIcon = (url) =>
  window.google ? { url, scaledSize: new window.google.maps.Size(40, 40) } : { url };

export const clampCenter = (map) => {
  if (!map) return;
  const c = map.getCenter();
  const lat = Math.max(-85, Math.min(85, c.lat()));
  const lng = ((c.lng() + 180) % 360) - 180;
  if (lat !== c.lat() || lng !== c.lng()) map.setCenter({ lat, lng });
};

export const groupEventsByCategory = (events, categories) =>
  categories.map((cat) => {
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

export const countByCategory = (events, categories) => {
  const out = new Map();
  for (const cat of categories) {
    const n = (events || []).filter(e => e.categories?.some(c => c.id === cat.id)).length;
    out.set(cat.id, n);
  }
  return out;
};

export const getFrames = (event) =>
  (event?.geometry || [])
    .map(g =>
      Array.isArray(g.coordinates) && g.coordinates.length >= 2
        ? { date: g.date, lat: g.coordinates[1], lng: g.coordinates[0] }
        : null
    )
    .filter(Boolean);