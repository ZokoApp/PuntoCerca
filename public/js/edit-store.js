const CATEGORY_MAP = {
  "Gastronomía": [
    { id: 1, name: "Restaurante" },
    { id: 2, name: "Pizzería" },
    { id: 3, name: "Bar" },
    { id: 4, name: "Cafetería" },
    { id: 5, name: "Heladería" }
  ],
  "Comercio": [
  { id: 6, name: "Ropa" },
  { id: 7, name: "Electrónica" },
  { id: 8, name: "Ferretería" },
  { id: 9, name: "Librería" },
  { id: 46, name: "Verdulería" },
  { id: 47, name: "Almacén" },
  { id: 48, name: "Kiosco" },
  { id: 49, name: "Supermercado" },
  { id: 50, name: "Carnicería" },
  { id: 51, name: "Panadería" },
  { id: 52, name: "Fiambrería" },
  { id: 53, name: "Dietética" },
  { id: 54, name: "Bebidas" },
  { id: 55, name: "Mayorista" }
],
  "Belleza": [
    { id: 10, name: "Peluquería" },
    { id: 11, name: "Barbería" },
    { id: 12, name: "Estética" },
    { id: 13, name: "Spa" }
  ],
  "Salud": [
    { id: 14, name: "Clínica" },
    { id: 15, name: "Odontología" },
    { id: 16, name: "Farmacia" },
    { id: 17, name: "Psicología" }
  ],
  "Servicios": [
    { id: 18, name: "Electricista" },
    { id: 19, name: "Plomería" },
    { id: 20, name: "Gasista" },
    { id: 21, name: "Técnico PC" },
    { id: 22, name: "Reparaciones" }
  ],
  "Automotor": [
    { id: 23, name: "Taller mecánico" },
    { id: 24, name: "Lavadero" },
    { id: 25, name: "Gomería" },
    { id: 26, name: "Repuestos" }
  ],
  "Educación": [
    { id: 27, name: "Instituto" },
    { id: 28, name: "Clases particulares" },
    { id: 29, name: "Academia" }
  ],
  "Deportes": [
    { id: 30, name: "Gimnasio" },
    { id: 31, name: "Escuela deportiva" },
    { id: 32, name: "Club" }
  ],
  "Mascotas": [
    { id: 33, name: "Veterinaria" },
    { id: 34, name: "Pet Shop" },
    { id: 35, name: "Peluquería canina" }
  ],
  "Hogar": [
    { id: 36, name: "Mueblería" },
    { id: 37, name: "Decoración" },
    { id: 38, name: "Construcción" }
  ],
  "Profesionales": [
    { id: 39, name: "Abogado" },
    { id: 40, name: "Contador" },
    { id: 41, name: "Arquitecto" },
    { id: 42, name: "Marketing" }
  ],
  "Eventos": [
    { id: 43, name: "Salón de eventos" },
    { id: 44, name: "Catering" },
    { id: 45, name: "Fotografía" }
  ]
};

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

  store = await res.json();

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

  document.getElementById("name").value = store.name || "";
  // setear categoría
categorySelect.value = store.category || "";

// cargar subcategorías + seleccionar la correcta
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

  // 🔥 SI VIENE "2153 Rosa Silvestre" → lo invertimos
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

  // =============================
  // PREVIEW INICIAL
  // =============================

  document.getElementById("logoPreview").src =
    store.logo_url || "/img/default.png";

  document.getElementById("coverPreview").src =
    store.cover_url || "/img/default-cover.jpg";

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
  // GUARDAR
  // =============================

   // =============================
// MAPA
// =============================

let map = null;
let marker = null;
let selectedLat = store.lat || null;
let selectedLng = store.lng || null;

const mapModal = document.getElementById("mapModal");
const openMapBtn = document.getElementById("openMap");
const closeMapBtn = document.getElementById("closeMap");
const saveLocationBtn = document.getElementById("saveLocation");
const searchAddressInput = document.getElementById("searchAddress");

function createStoreIcon() {
  return L.icon({
    iconUrl: store.logo_url || "/img/default.png",
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -36],
    className: "custom-pin"
  });
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );

    const data = await res.json();

    if (data.address) {
      const road = data.address.road || "";
      const houseNumber = data.address.house_number || "";

      const shortAddress = `${road} ${houseNumber}`.trim();

      // 👉 FRONT (simple)
      document.getElementById("streetDisplay").textContent = shortAddress;
      searchAddressInput.value = shortAddress;

      // 👉 BACKEND (completa)
      document.getElementById("streetDisplay").dataset.fullAddress = data.display_name;
    }

  } catch (err) {
    console.error("Error obteniendo dirección", err);
  }
}
async function searchAddress(query) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}`
    );

    const data = await res.json();

    if (!data.length) return;

    const result = data[0];

    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    selectedLat = lat;
    selectedLng = lng;

    map.setView([lat, lng], 16);

    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng], { icon: createStoreIcon() }).addTo(map);
    }

    // 🔥 ACA ESTÁ LA CLAVE
    const address = result.address || {};

    const road =
      address.road ||
      address.pedestrian ||
      address.suburb ||
      address.neighbourhood ||
      "";

    const houseNumber = address.house_number || "";

    let shortAddress = `${road} ${houseNumber}`.trim();

    // fallback inteligente
    if (!shortAddress) {
      shortAddress = result.display_name.split(",").slice(0, 2).join(" ");
    }

    // ✅ FRONT (lo que ves)
    document.getElementById("streetDisplay").textContent = shortAddress;

    // ✅ BACKEND (opcional completo)
    document.getElementById("streetDisplay").dataset.fullAddress =
      result.display_name;

    // input del buscador
    searchAddressInput.value = shortAddress;

  } catch (err) {
    console.error("Error buscando dirección", err);
  }
}

function initMapAt(lat, lng) {
  if (!map) {
    map = L.map("map").setView([lat, lng], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & Carto',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

    marker = L.marker([lat, lng], { icon: createStoreIcon() }).addTo(map);

    map.on("click", async (e) => {
      selectedLat = e.latlng.lat;
      selectedLng = e.latlng.lng;

      marker.setLatLng([selectedLat, selectedLng]);

      await reverseGeocode(selectedLat, selectedLng);
    });
  } else {
    map.setView([lat, lng], 15);

    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat, lng], { icon: createStoreIcon() }).addTo(map);
    }
  }

  setTimeout(() => {
    map.invalidateSize();
  }, 200);
}

openMapBtn.addEventListener("click", () => {
  mapModal.classList.remove("hidden");

  searchAddressInput.value =
  document.getElementById("streetDisplay").textContent || "";

  if (selectedLat && selectedLng) {
    initMapAt(selectedLat, selectedLng);
    return;
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        selectedLat = position.coords.latitude;
        selectedLng = position.coords.longitude;

        initMapAt(selectedLat, selectedLng);
        await reverseGeocode(selectedLat, selectedLng);
      },
      () => {
        selectedLat = -34.6037;
        selectedLng = -58.3816;
        initMapAt(selectedLat, selectedLng);
      }
    );
  } else {
    selectedLat = -34.6037;
    selectedLng = -58.3816;
    initMapAt(selectedLat, selectedLng);
  }
});

closeMapBtn.addEventListener("click", () => {
  mapModal.classList.add("hidden");
});

saveLocationBtn.addEventListener("click", () => {
  mapModal.classList.add("hidden");
});

searchAddressInput.addEventListener("change", async () => {
  const query = searchAddressInput.value.trim();
  if (!query) return;

  await searchAddress(query);
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
  streetDisplay.textContent
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

      if(res.ok){
        alert("Tienda actualizada 🚀");
        window.location.href = `/store/${store.id}`; // 🔥 ya corregido
      } else {
        alert("Error al guardar");
      }

    } catch (err){
      console.error(err);
      alert("Error de conexión");
    }

   

  });

});
