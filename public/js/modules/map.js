export const map = L.map('map', {
  maxZoom: 22
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 22
}).addTo(map);

// GEOLOCALIZACIÓN
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            map.setView([userLat, userLng], 14);

            L.marker([userLat, userLng])
                .addTo(map)
                .bindPopup("📍 Estás aquí")
                .openPopup();
        },
        function() {
            map.setView([-32.9442, -60.6505], 13);
        }
    );
} else {
    map.setView([-32.9442, -60.6505], 13);
}