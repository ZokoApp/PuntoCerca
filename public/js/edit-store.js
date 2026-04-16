import { CATEGORIES } from './data/categories.js';

const CATEGORY_MAP = CATEGORIES;
let store = null;

document.addEventListener("DOMContentLoaded", async () => {


  // =============================
  // TRAER STORE
  // =============================

  const res = await fetch("/api/my-store", {
    credentials: "include"
  });

  if (res.status === 404) {
  console.log("Modo creación de tienda");
  store = null; // 🔥 IMPORTANTE
} else if (!res.ok) {
  alert("Error cargando tienda");
  return;
} else {
  store = await res.json();
}

  

  // =============================
// CATEGORÍAS (LOAD)
// =============================

const categorySelect = document.getElementById("category");
const subcategoryContainer = document.getElementById("subcategoryContainer");
let selectedSubcategories = [];

// cargar categorías
Object.keys(CATEGORY_MAP).forEach(cat => {
  const option = document.createElement("option");
  option.value = cat;
  option.textContent = cat;
  categorySelect.appendChild(option);
});

// =============================
// SUBCATEGORÍAS
// =============================
function loadSubcategories(category, selectedIds = []) {
  subcategoryContainer.innerHTML = "";

  selectedSubcategories = selectedIds.map(String);

  const subs = CATEGORY_MAP[category] || [];

  subs.forEach(sub => {
    const chip = document.createElement("div");
    chip.className = "subcategory-chip";
    chip.textContent = sub.name;
    chip.dataset.id = sub.id;

    if (selectedSubcategories.includes(String(sub.id))) {
      chip.classList.add("active");
    }

    chip.addEventListener("click", () => {
      const id = String(sub.id);

      if (selectedSubcategories.includes(id)) {
        selectedSubcategories = selectedSubcategories.filter(s => s !== id);
        chip.classList.remove("active");
      } else {
        selectedSubcategories.push(id);
        chip.classList.add("active");
      }
    });

    subcategoryContainer.appendChild(chip);
  });
}
// cuando cambia categoría
categorySelect.addEventListener("change", () => {
  loadSubcategories(categorySelect.value);
});

 // =============================
// CARGAR DATOS
// =============================

if (store) {

  // ✏️ EDITAR TIENDA

  document.getElementById("name").value = store.name || "";
  categorySelect.value = store.category || "";

  let selectedSubs = [];

  if (store.subcategory_ids) {
    try {
      selectedSubs = typeof store.subcategory_ids === "string"
        ? JSON.parse(store.subcategory_ids)
        : store.subcategory_ids;
    } catch {
      selectedSubs = [];
    }
  } else if (store.subcategory_id) {
    selectedSubs = [parseInt(store.subcategory_id)];
  }

  loadSubcategories(store.category, selectedSubs);

  document.getElementById("phone").value = store.phone || "";
  document.getElementById("city").value = store.city || "";

  const streetDisplay = document.getElementById("streetDisplay");

  if (store.street) {
    const parts = store.street.split(",");
    let streetPart = parts[0].trim();

    if (/^\d+/.test(streetPart)) {
      const [number, ...rest] = streetPart.split(" ");
      streetPart = `${rest.join(" ")} ${number}`;
    }

    streetDisplay.textContent = streetPart;
    streetDisplay.dataset.fullAddress = store.street;
  } else {
    streetDisplay.textContent = "Seleccionar ubicación";
  }

  document.getElementById("description").value = store.description || "";
  document.getElementById("local").value = store.local || "";
  document.getElementById("apartment").value = store.apartment || "";
  document.getElementById("references").value = store.reference_notes || "";

  // previews
  document.getElementById("logoPreview").src =
    store.logo_url || "/img/default.png";

  document.getElementById("coverPreview").src =
    store.cover_url || "/img/default-cover.jpg";

} else {

  // 🆕 CREAR TIENDA

  console.log("Modo creación limpio");

  loadSubcategories(categorySelect.value);

  document.getElementById("logoPreview").src = "/img/default.png";
  document.getElementById("coverPreview").src = "/img/default-cover.jpg";
}
  
  // =============================
  // CLICK EN CAJAS
  // =============================

  document.getElementById("logoBox").onclick = () => {
    document.getElementById("logoFile").click();
  };

  document.getElementById("coverBox").onclick = () => {
    document.getElementById("coverFile").click();
  };

  // =============================
  // PREVIEW AL CAMBIAR
  // =============================

  const logoInput = document.getElementById("logoFile");
  const coverInput = document.getElementById("coverFile");

  const logoPreview = document.getElementById("logoPreview");
  const coverPreview = document.getElementById("coverPreview");

  logoInput.addEventListener("change", () => {
    const file = logoInput.files[0];
    if(file){
      logoPreview.src = URL.createObjectURL(file);
    }
  });

  coverInput.addEventListener("change", () => {
    const file = coverInput.files[0];
    if(file){
      coverPreview.src = URL.createObjectURL(file);
    }
  });

  

  // =============================
// MAPA GOOGLE
// =============================

let map = null;
let marker = null;
let autocomplete = null;
let googleMapsLoaded = false;

let selectedLat = store ? Number(store.lat) : null;
let selectedLng = store ? Number(store.lng) : null;

const mapModal = document.getElementById("mapModal");
const openMapBtn = document.getElementById("openMap");
const closeMapBtn = document.getElementById("closeMap");
const saveLocationBtn = document.getElementById("saveLocation");
const searchAddressInput = document.getElementById("searchAddress");

async function loadGoogleMapsScript() {
  if (googleMapsLoaded && window.google?.maps) return;

  const res = await fetch("/api/google-maps-key");
  const data = await res.json();

  if (!data.key) {
    throw new Error("No se encontró la API key de Google Maps");
  }

  await new Promise((resolve, reject) => {
    if (document.getElementById("googleMapsScript")) {
      googleMapsLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = "googleMapsScript";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleMapsLoaded = true;
      resolve();
    };
    script.onerror = reject;

    document.body.appendChild(script);
  });
}

async function reverseGeocodeGoogle(lat, lng) {
  const geocoder = new google.maps.Geocoder();

  return new Promise((resolve, reject) => {
    geocoder.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === "OK" && results[0]) {
          const fullAddress = results[0].formatted_address;

          let shortAddress = fullAddress;
          const firstPart = fullAddress.split(",")[0]?.trim();
          if (firstPart) shortAddress = firstPart;

          document.getElementById("streetDisplay").textContent = shortAddress;
          document.getElementById("streetDisplay").dataset.fullAddress = fullAddress;
          searchAddressInput.value = fullAddress;

          resolve(results[0]);
        } else {
          reject(status);
        }
      }
    );
  });
}

function initGoogleMap(lat, lng) {
  const center = { lat, lng };

  if (!map) {
    map = new google.maps.Map(document.getElementById("map"), {
  center,
  zoom: 16,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,

  styles: [
    { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },

    {
      featureType: "poi",
      stylers: [{ visibility: "off" }]
    },

    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#ffffff" }]
    },

    {
      featureType: "road.arterial",
      elementType: "labels.text.fill",
      stylers: [{ color: "#757575" }]
    },

    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#dadada" }]
    },

    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#c9c9c9" }]
    }
  ]
});

    marker = new google.maps.Marker({
  position: center,
  map,
  draggable: true,
  icon: {
    url: "https://maps.google.com/mapfiles/ms/icons/orange-dot.png"
  }
});

    marker.addListener("dragend", async () => {
      const pos = marker.getPosition();
      selectedLat = pos.lat();
      selectedLng = pos.lng();

      try {
        await reverseGeocodeGoogle(selectedLat, selectedLng);
      } catch (err) {
        console.error("Error geocoding", err);
      }
    });

    map.addListener("click", async (e) => {
      selectedLat = e.latLng.lat();
      selectedLng = e.latLng.lng();

      marker.setPosition({
        lat: selectedLat,
        lng: selectedLng
      });

      try {
        await reverseGeocodeGoogle(selectedLat, selectedLng);
      } catch (err) {
        console.error("Error geocoding", err);
      }
    });

    autocomplete = new google.maps.places.Autocomplete(searchAddressInput, {
  fields: ["formatted_address", "geometry", "name"],
  componentRestrictions: { country: "ar" }
});
    autocomplete.bindTo("bounds", map);

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) return;

      selectedLat = place.geometry.location.lat();
      selectedLng = place.geometry.location.lng();

      map.setCenter({
        lat: selectedLat,
        lng: selectedLng
      });

      map.setZoom(17);

      marker.setPosition({
        lat: selectedLat,
        lng: selectedLng
      });

      const fullAddress = place.formatted_address || place.name || "";
      const shortAddress = fullAddress.split(",")[0]?.trim() || fullAddress;

      document.getElementById("streetDisplay").textContent = shortAddress;
      document.getElementById("streetDisplay").dataset.fullAddress = fullAddress;
      searchAddressInput.value = fullAddress;
    });

  } else {
    map.setCenter(center);
    map.setZoom(16);

    if (marker) {
      marker.setPosition(center);
    }
  }

  setTimeout(() => {
    google.maps.event.trigger(map, "resize");
    map.setCenter(center);
  }, 300);
}

openMapBtn.addEventListener("click", async () => {
  try {
    mapModal.classList.remove("hidden");

    await loadGoogleMapsScript();

    searchAddressInput.value =
      document.getElementById("streetDisplay").dataset.fullAddress ||
      document.getElementById("streetDisplay").textContent ||
      "";

    if (selectedLat && selectedLng) {
      initGoogleMap(selectedLat, selectedLng);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          selectedLat = position.coords.latitude;
          selectedLng = position.coords.longitude;

          initGoogleMap(selectedLat, selectedLng);

          try {
            await reverseGeocodeGoogle(selectedLat, selectedLng);
          } catch (err) {
            console.error(err);
          }
        },
        async () => {
          selectedLat = -32.9442;
          selectedLng = -60.6505;

          initGoogleMap(selectedLat, selectedLng);

          try {
            await reverseGeocodeGoogle(selectedLat, selectedLng);
          } catch (err) {
            console.error(err);
          }
        }
      );
    } else {
      selectedLat = -32.9442;
      selectedLng = -60.6505;

      initGoogleMap(selectedLat, selectedLng);
    }

  } catch (err) {
    console.error(err);
    alert("Error cargando Google Maps");
  }
});

closeMapBtn.addEventListener("click", () => {
  mapModal.classList.add("hidden");
});

saveLocationBtn.addEventListener("click", () => {
  mapModal.classList.add("hidden");
});
  document.getElementById("editStoreForm").addEventListener("submit", async (e) => {


    e.preventDefault();

    const formData = new FormData();

    formData.append("name", document.getElementById("name").value);
    formData.append("category", document.getElementById("category").value);
    formData.append("subcategory_ids", JSON.stringify(selectedSubcategories));
    formData.append("phone", document.getElementById("phone").value);
    formData.append("city", document.getElementById("city").value);
    const streetDisplay = document.getElementById("streetDisplay");

formData.append(
  "street",
  streetDisplay.dataset.fullAddress || streetDisplay.textContent
);
    formData.append("description", document.getElementById("description").value);
    formData.append("local", document.getElementById("local").value);
    formData.append("apartment", document.getElementById("apartment").value);
    formData.append("reference_notes", document.getElementById("references").value);
    formData.append("lat", selectedLat || "");
    formData.append("lng", selectedLng || "");

    if(logoInput.files[0]){
      formData.append("logo", logoInput.files[0]);
    }

    if(coverInput.files[0]){
      formData.append("cover", coverInput.files[0]);
    }

    try {

      let res;

if (store && store.id) {
  // ✏️ EDITAR
  res = await fetch(`/api/stores/${store.id}`, {
    method: "PUT",
    credentials: "include",
    body: formData
  });
} else {
  // 🆕 CREAR
  res = await fetch(`/api/stores`, {
    method: "POST",
    credentials: "include",
    body: formData
  });
}

      if (res.ok) {
  const savedStore = await res.json();

  alert(store ? "Tienda actualizada 🚀" : "Tienda creada 🚀");

  window.location.href = `/${savedStore.slug}`;
} else {
  const errorData = await res.json().catch(() => ({}));
  alert(errorData.error || "Error al guardar");
}

    } catch (err){
      console.error(err);
      alert("Error de conexión");
    }

   

  });

});
