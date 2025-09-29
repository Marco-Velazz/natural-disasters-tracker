export async function handler(event) {
  const { lat, lng, radiusKm = 50, maxRows = 50 } = event.queryStringParameters || {};
  const username = process.env.GEONAMES_USER || process.env.REACT_APP_GEONAMES_USER;

  if (!lat || !lng || !username) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing lat/lng or username" }) };
    }

  const url = new URL("https://api.geonames.org/findNearbyPlaceNameJSON");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lng", String(lng));
  url.searchParams.set("radius", String(radiusKm));
  url.searchParams.set("maxRows", String(maxRows));
  url.searchParams.set("style", "FULL");
  url.searchParams.set("username", username);

  try {
    const r = await fetch(url.toString());
    const text = await r.text();
    if (!r.ok) {
      return { statusCode: r.status, body: JSON.stringify({ error: `GeoNames HTTP ${r.status}`, raw: text }) };
    }
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
      body: text,
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "Upstream fetch failed", detail: String(e) }) };
  }
}