let userLat = null;
let userLng = null;

let allStores = [];


navigator.geolocation.getCurrentPosition(
  pos => {
    userLat = pos.coords.latitude;
    userLng = pos.coords.longitude;
    applyFilters();
  },
  err => {
    console.warn("Geolocalización denegada");
  }
);

// ==========================
// CARGAR TIENDAS
// ==========================
async function loadStores(){

  const category = document.getElementById("filterCategory").value;

  let url = '/api/stores';

  if(category){
    url += `?category=${encodeURIComponent(category)}`;
  }

  try {

    const res = await fetch(url);

    if (!res.ok) {
      const text = await res.text();
      console.error("🔥 ERROR BACKEND:", text);
      allStores = [];
      renderStores([]);
      return;
    }

    const stores = await res.json();

    if (!Array.isArray(stores)) {
      console.error("❌ NO ES ARRAY:", stores);
      allStores = [];
      renderStores([]);
      return;
    }

    allStores = stores;
    applyFilters();

  } catch (err) {
    console.error("💥 ERROR FETCH:", err);
    allStores = [];
    renderStores([]);
  }
}
// ==========================
// RENDER
// ==========================
function renderStores(stores){

  const container = document.getElementById("storesContainer");
  container.innerHTML = "";

  stores.forEach(store => {

    const card = document.createElement("div");
    card.className = "bg-white rounded-xl shadow hover:shadow-lg cursor-pointer overflow-hidden transition";

    card.innerHTML = `
      <img src="${store.logo_url || 'https://source.unsplash.com/300x200/?store'}" 
           class="w-full h-40 object-cover">

      <div class="p-3">

        <h3 class="font-semibold">${store.name}</h3>

        <p class="text-sm text-gray-500">
          ${store.category || ''}
        </p>

        <p class="text-yellow-600 text-sm mt-1">
          ${
            store.rating_avg
              ? `⭐ ${Number(store.rating_avg).toFixed(1)} (${store.rating_count || 0})`
              : 'Sin valoraciones'
          }
        </p>

      </div>
    `;

    card.onclick = () => {
      window.location.href = `/store/${store.id}`;
    };

    container.appendChild(card);
  });
}

function applyFilters(){

  const search = document.getElementById("searchStore").value.toLowerCase().trim();
  const sort = document.getElementById("filterSort").value;

  let filtered = [...allStores];

  // 🔍 BUSCADOR
  if(search){
    filtered = filtered.filter(store =>
      (store.name || "").toLowerCase().includes(search) ||
      (store.category || "").toLowerCase().includes(search)
    );
  }

  // ⭐ ORDEN POR RATING
  if(sort === "rating"){
    filtered.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
  }

  // 🟢 ABIERTOS PRIMERO
  if(sort === "open"){
    filtered.sort((a, b) => {
      const aOpen = a.is_open ? 1 : 0;
      const bOpen = b.is_open ? 1 : 0;
      return bOpen - aOpen;
    });
  }

  // 📍 DISTANCIA
  if(sort === "distance"){
   filtered = filtered.map(store => {
  let distance = 999999;

  if(userLat && userLng && store.lat && store.lng){
    distance = Math.sqrt(
      Math.pow(Number(store.lat) - userLat, 2) +
      Math.pow(Number(store.lng) - userLng, 2)
    );
  }

  return { ...store, distance };
});

    filtered.sort((a, b) => (a.distance || 999999) - (b.distance || 999999));
  }

  renderStores(filtered);
}

// ==========================
// CARGAR CATEGORÍAS
// ==========================
async function loadCategories(){

  const res = await fetch('/api/categories');
  const categories = await res.json();

  const select = document.getElementById("filterCategory");

  categories.forEach(c => {

    const option = document.createElement("option");
    option.value = c.category;

    // 👉 Capitalizar
    option.textContent =
      c.category.charAt(0).toUpperCase() + c.category.slice(1);

    select.appendChild(option);
  });
}

// ==========================
// EVENTOS
// ==========================
document.getElementById("filterCategory")
  .addEventListener("change", loadStores);

document.getElementById("filterSort")
  .addEventListener("change", applyFilters);

document.getElementById("searchStore")
  .addEventListener("input", applyFilters);

// ==========================
// INIT
// ==========================
loadCategories();
loadStores();
