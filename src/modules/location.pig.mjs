async function getDistanceToLocation(fakeLat, fakeLon) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Geolocation is not supported by this browser."));
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        const distance = getDistanceFromLatLonInKm(
          userLat,
          userLon,
          fakeLat,
          fakeLon,
        );

        try {
          resolve({
            distanceKm: distance,
            fakeCoords: { latitude: fakeLat, longitude: fakeLon },
            userCoords: { latitude: userLat, longitude: userLon },
          });
        } catch (error) {
          reject(
            new Error(
              "Failed to reverse geocode fake location: " + error.message,
            ),
          );
        }
      },
      (err) => {
        reject(new Error("Failed to retrieve user location: " + err.message));
      },
    );
  });
}

// Distance formula using Haversine
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

export default getDistanceToLocation;
