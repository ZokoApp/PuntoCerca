let map = null;

// 🔥 SOLO inicializa si existe mapa y Leaflet
if (typeof L !== "undefined" && document.getElementById("map")) {

  map = L.map('map', {
    maxZoom: 22
  });

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
  maxNativeZoom: 16,
    maxZoom: 22
  }).addTo(map);

  // GEOLOCALIZACIÓN
  let userMarker = null;
  let accuracyCircle = null;
  let firstLocation = true;

  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      function(position) {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        const userPosition = [userLat, userLng];

        const userIcon = L.divIcon({
          className: "",
          html: `<div class="user-location-dot"></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        if (!userMarker) {
          userMarker = L.marker(userPosition, { icon: userIcon }).addTo(map);
        } else {
          userMarker.setLatLng(userPosition);
        }

        if (!accuracyCircle) {
          accuracyCircle = L.circle(userPosition, {
            radius: accuracy,
            color: "#2563eb",
            fillColor: "#2563eb",
            fillOpacity: 0.12,
            weight: 1
          }).addTo(map);
        } else {
          accuracyCircle.setLatLng(userPosition);
          accuracyCircle.setRadius(accuracy);
        }

        if (firstLocation) {
          map.setView(userPosition, 18);
          firstLocation = false;
        }
      },
      function(error) {
        console.warn("No se pudo obtener ubicación:", error);
        map.setView([-32.9442, -60.6505], 13);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );
  } else {
    map.setView([-32.9442, -60.6505], 13);
  }

}

// export seguro
export { map };
