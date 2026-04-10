let userLat = null;
let userLng = null;

let allStores = [];


navigator.geolocation.getCurrentPosition(pos => {
  userLat = pos.coords.latitude;
  userLng = pos.coords.longitude;
});

// ==========================
// CARGAR TIENDAS
// ==========================
async function loadStores(){

  const category = document.getElementById("filterCategory").value;
  const sort = document.getElementById("filterSort").value;

  let url = '/api/stores';

  if(category){
    url += `?category=${category}`;
  }

  const res = await fetch(url);
  let stores = await res.json();

  // ⭐ ORDEN POR RATING
  if(sort === "rating"){
    stores.sort((a,b) => (b.rating_avg || 0) - (a.rating_avg || 0));
  }

  // 📍 ORDEN POR DISTANCIA
  if(sort === "distance" && userLat && userLng){

    stores.forEach(store => {
      if(store.lat && store.lng){
        store.distance = Math.sqrt(
          Math.pow(store.lat - userLat, 2) +
          Math.pow(store.lng - userLng, 2)
        );
      } else {
        store.distance = 999;
      }
    });

    stores.sort((a,b) => a.distance - b.distance);
  }

  allStores = stores;
applyFilters();
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

  const search = document.getElementById("searchStore").value.toLowerCase();
  const sort = document.getElementById("filterSort").value;

  let filtered = [...allStores];

  // 🔍 BUSCADOR
  if(search){
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(search)
    );
  }

  // ⭐ ORDEN
  if(sort === "rating"){
    filtered.sort((a,b) => (b.rating_avg || 0) - (a.rating_avg || 0));
  }

  if(sort === "distance" && userLat && userLng){
    filtered.sort((a,b) => (a.distance || 999) - (b.distance || 999));
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
