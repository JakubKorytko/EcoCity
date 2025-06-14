async function json(req) {
  let body = "";

  try {
    for await (const chunk of req) {
      body += chunk;
    }
    body = JSON.parse(body);
  } catch {
    body = {};
  }

  return body;
}

function generateRandomPolishGeoLocation() {
  const lat = (Math.random() * (54.9 - 49.0) + 49.0).toFixed(6);
  const lon = (Math.random() * (24.2 - 14.1) + 14.1).toFixed(6);
  return {
    latitude: parseFloat(lat),
    longitude: parseFloat(lon),
  };
}

async function getCityNameFromCoords(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Nominatim request failed: ${response.status}`);
  }

  const data = await response.json();
  const address = data.address;

  return (
    address?.city ||
    address?.town ||
    address?.village ||
    address?.hamlet ||
    "Unknown"
  );
}

export { json, getCityNameFromCoords, generateRandomPolishGeoLocation };
