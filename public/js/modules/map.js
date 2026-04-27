export const map = L.map('map', {
  maxZoom: 22
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & Carto',
  subdomains: 'abcd',
  maxZoom: 22
}).addTo(map);

// GEOLOCALIZACIÓN PRO
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    function(position) {

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      // 🔥 ZOOM CERCANO (tipo Google Maps)
      map.setView([userLat, userLng], 18);

      // 🔵 AURA DE PRECISIÓN
      L.circle([userLat, userLng], {
        radius: accuracy, // precisión real del GPS
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.15,
        weight: 2
      }).addTo(map);

      // 🔵 PUNTO CENTRAL (usuario)
      const userIcon = L.divIcon({
        className: "",
        html: `
          <div style="
            width:20px;
            height:20px;
            background:#3b82f6;
            border-radius:50%;
            border:3px solid white;
            box-shadow:0 0 20px rgba(59,130,246,0.9);
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      L.marker([userLat, userLng], { icon: userIcon }).addTo(map);

    },
    function() {

      // fallback Rosario
      map.setView([-32.9442, -60.6505], 14);

    },
    {
      enableHighAccuracy: true, // 🔥 IMPORTANTE
      timeout: 10000,
      maximumAge: 0
    }
  );
} else {
  map.setView([-32.9442, -60.6505], 13);
}
