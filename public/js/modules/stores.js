  import { map } from './map.js';

const SUBCATEGORY_MAP = {
  1: "Restaurante",
  2: "Pizzería",
  3: "Bar",
  4: "Cafetería",
  5: "Heladería",
  6: "Ropa",
  7: "Electrónica",
  8: "Ferretería",
  9: "Librería",
  10: "Peluquería",
  11: "Barbería",
  12: "Estética",
  13: "Spa",
  14: "Clínica",
  15: "Odontología",
  16: "Farmacia",
  17: "Psicología",
  18: "Electricista",
  19: "Plomería",
  20: "Gasista",
  21: "Técnico PC",
  22: "Reparaciones",
  23: "Taller mecánico",
  24: "Lavadero",
  25: "Gomería",
  26: "Repuestos",
  27: "Instituto",
  28: "Clases particulares",
  29: "Academia",
  30: "Gimnasio",
  31: "Escuela deportiva",
  32: "Club",
  33: "Veterinaria",
  34: "Pet Shop",
  35: "Peluquería canina",
  36: "Mueblería",
  37: "Decoración",
  38: "Construcción",
  39: "Abogado",
  40: "Contador",
  41: "Arquitecto",
  42: "Marketing",
43: "Salón de eventos",
44: "Catering",
45: "Fotografía",

46: "Verdulería",
47: "Almacén",
48: "Kiosco",
49: "Supermercado",
50: "Carnicería",
51: "Panadería",
52: "Fiambrería",
53: "Dietética",
54: "Bebidas",
55: "Mayorista"
};

  export let storeMarkers = {};
  export let activeCard = null;

  const usedPositions = {};
function isStoreOpen(store) {
  if (!store.is_open) return false;
  if (!store.opening_time || !store.closing_time) return false;

  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();

  const [oh, om] = store.opening_time.split(":").map(Number);
  const [ch, cm] = store.closing_time.split(":").map(Number);

  const open = oh * 60 + om;
  const close = ch * 60 + cm;

  return current >= open && current <= close;
}

function getPositionKey(lat, lng) {
  return `${Number(lat).toFixed(5)}_${Number(lng).toFixed(5)}`;
}

function getAdjustedLatLng(lat, lng) {
  const baseLat = Number(lat);
  const baseLng = Number(lng);

  const key = getPositionKey(baseLat, baseLng);

  if (!usedPositions[key]) {
    usedPositions[key] = 0;
    return [baseLat, baseLng];
  }

  usedPositions[key]++;

  const index = usedPositions[key];
  const distance = 0.00008;
  const angle = index * 45 * (Math.PI / 180);

  const offsetLat = Math.sin(angle) * distance;
  const offsetLng = Math.cos(angle) * distance;

  return [baseLat + offsetLat, baseLng + offsetLng];
}


  export function focusStore(storeId){

    const marker = storeMarkers[storeId];
    const card = document.querySelector(`.card[data-id='${storeId}']`);

    if(marker){

      const latLng = marker.getLatLng();

      map.flyTo(latLng, 21, {
  duration: 1.5
});

// aseguramos foco fino después del movimiento
setTimeout(() => {
  map.setView(latLng, 22);
}, 1600);

      marker.openPopup();

      document.getElementById("map").scrollIntoView({
        behavior:'smooth',
        block:'center'
      });

      // resaltar card
      if(activeCard){
        activeCard.style.boxShadow = "0 5px 15px rgba(0,0,0,0.08)";
      }

      if(card){
        card.style.boxShadow = "0 10px 25px rgba(255,106,0,0.5)";
        activeCard = card;
      }

      marker.setZIndexOffset(1000);
      setTimeout(() => {
        marker.setZIndexOffset(0);
      }, 1500);
    }
  }

  export async function loadStores(category = null, subcategory_id = null) {

  // 🔥 si no viene del menú, leer selects (si existen)
  if (!category) {
    const select = document.getElementById("filterCategory");
    if (select && select.value) {
      category = select.value;
    }
  }

  if (!subcategory_id) {
    const subSelect = document.getElementById("filterSubcategory");
    if (subSelect && subSelect.value) {
      subcategory_id = subSelect.value;
    }
  }

      Object.values(storeMarkers).forEach(marker => {
          map.removeLayer(marker);
      });

      storeMarkers = {};

      for (const key in usedPositions) {
  delete usedPositions[key];
}

      const container = document.getElementById("stores");
      container.innerHTML = "";

      let url = '/api/stores';
      const params = new URLSearchParams();

      if(category) params.append("category", category);
      if(subcategory_id) params.append("subcategory_id", subcategory_id);

      if(params.toString()){
          url += "?" + params.toString();
      }

      const res = await fetch(url);
      const stores = await res.json();

      const bounds = [];

      stores.forEach(store => {

          const adjustedLatLng = getAdjustedLatLng(store.lat, store.lng);

bounds.push(adjustedLatLng);

          let markerOptions = {};

          if(store.logo_url){
              markerOptions.icon = L.divIcon({
                  className: "custom-store-marker",
                  html: `<div class="store-marker-logo" style="background-image:url('${store.logo_url}')"></div>`,
                  iconSize: [56, 56],
                  iconAnchor: [28, 56],
                  popupAnchor: [0, -50]
              });
          }

          let subcategories = "";

if (store.subcategory_ids) {
  try {
    const ids = Array.isArray(store.subcategory_ids)
      ? store.subcategory_ids
      : JSON.parse(store.subcategory_ids);

    subcategories = ids.map(id => SUBCATEGORY_MAP[id]).join(", ");
  } catch (e) {
    console.error("Error parseando subcategorías", e);
  }
} else if (store.subcategory_id) {
  subcategories = SUBCATEGORY_MAP[store.subcategory_id];
}

const marker = L.marker(adjustedLatLng, markerOptions)
    .addTo(map)
    .bindPopup(`
<b>${store.name}</b><br>
${subcategories}
`);

              marker.on('click', () => {
      showStorePreview(store);
  });


          storeMarkers[store.id] = marker;

          const card = document.createElement("div");
        const open = isStoreOpen(store);
card.className = "card";
card.setAttribute("data-id", store.id);

card.innerHTML = `
  <img src="${store.logo_url || 'https://source.unsplash.com/300x200/?store'}" />

  <div class="card-content">

    <h3>${store.name}</h3>

    <div class="status-badge ${store.is_open ? 'open' : 'closed'}">
      <span class="dot"></span>
      ${store.is_open ? 'Abierto' : 'Cerrado'}
    </div>

    <p>${store.street || "Sin dirección"}</p>

    <p>
      ${
        store.rating_count > 0
          ? `⭐ ${parseFloat(store.rating_avg).toFixed(1)} (${store.rating_count})`
          : "Sin valoraciones"
      }
    </p>

  </div>

  <div class="card-buttons">
    <button class="btn-view">Ver tienda</button>
    <button class="btn-map">Ver en mapa</button>
  </div>
`;

  const viewBtn = card.querySelector(".btn-view");
  const mapBtn = card.querySelector(".btn-map");

  viewBtn.addEventListener("click", () => {
     window.location.href = store.slug 
  ? `/${store.slug}` 
  : `/store/${store.id}`;
  });

  mapBtn.addEventListener("click", () => {
      focusStore(store.id);
      showStorePreview(store);
  });

          container.appendChild(card);
      });

      if(bounds.length){
          map.fitBounds(bounds, {
              padding: [50,50],
              maxZoom: 16
          });
      }
  }

  async function showStorePreview(store){

    const preview = document.getElementById("storePreview");
    const res = await fetch(`/api/stores/${store.id}/products`);
  const products = await res.json();


  const productsHTML = products.length
    ? products.slice(0,3).map(p => `
        <div class="mini-product">
          <img src="${p.image_url}" />
          <span>$${p.price}</span>
        </div>
      `).join('') 
    : `<span style="font-size:12px;color:#888;">Sin productos</span>`;

    preview.innerHTML = `
    <button class="close-preview">✕</button>
    <img src="${store.cover_url || store.logo_url || 'https://source.unsplash.com/600x300/?store'}" />

    

    <div class="store-preview-content">

      <h3>${store.name}</h3>

      <p class="store-description">
  ${store.description || ''}
</p>

<p class="store-address">
  📍 ${store.street || 'Sin dirección'}
</p>

      ${(() => {
  let subcats = "";

if (store.subcategory_ids) {
  try {
    const ids = Array.isArray(store.subcategory_ids)
      ? store.subcategory_ids
      : JSON.parse(store.subcategory_ids);

    subcats = ids
      .map(id => SUBCATEGORY_MAP[id])
      .filter(Boolean)
      .join(" · ");
  } catch (e) {
    console.error("Error parseando subcategorías", e);
    subcats = "";
  }
} else if (store.subcategory_id) {
  subcats = SUBCATEGORY_MAP[store.subcategory_id];
}

  return `
    <div class="store-meta">
      ${
        store.rating_count > 0
          ? `⭐ ${store.rating_avg}`
          : "Sin valoraciones"
      }
      · ${subcats || store.category}
    </div>
  `;
})()}

      <div class="store-products">
        ${productsHTML}
      </div>

      <a href="/${store.slug}" class="btn-primary">
  Ver tienda
</a>

    </div>
  `;
  const closeBtn = preview.querySelector(".close-preview");

  closeBtn.addEventListener("click", () => {
    preview.classList.add("hidden");
  });

  setTimeout(() => {
    document.addEventListener("click", handleOutsideClick);
  }, 0);

  function handleOutsideClick(e){
    if(!preview.contains(e.target)){
      preview.classList.add("hidden");
      document.removeEventListener("click", handleOutsideClick);
    }
  }

    preview.classList.remove("hidden");
    
  }

