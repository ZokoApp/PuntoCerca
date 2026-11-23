export async function geocodeAddressAndUpdateMap(address, map, marker) {
  if (!address || address.trim().length < 5) {
    return null;
  }

  if (!window.google || !google.maps) {
    console.error("Google Maps no está cargado");
    return null;
  }

  const geocoder = new google.maps.Geocoder();

  return new Promise((resolve) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status !== "OK" || !results.length) {
        console.warn("Dirección no encontrada:", address);
        resolve(null);
        return;
      }

      const location = results[0].geometry.location;

      const lat = location.lat();
      const lng = location.lng();

      map.setCenter({ lat, lng });
      map.setZoom(16);

      marker.setPosition({ lat, lng });

      resolve({
        lat,
        lng,
        formatted_address: results[0].formatted_address
      });
    });
  });
}
