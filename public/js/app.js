import { loadStores, focusStore } from './modules/stores.js';
import { initSliders } from './modules/ui.js';
import { loadProducts, loadOffers } from './modules/offers.js';
import { CATEGORIES } from './data/categories.js';

// GLOBAL
window.loadStores = loadStores;

window.viewStore = function(id){
  window.location.href = `/store/${id}`;
};

window.goToProduct = (product) => {
  window.location.href = `/product/${product.slug || product.id}`;
};

window.focusStore = focusStore;

// INIT
loadStores();
loadProducts();
loadOffers();
initSliders();
loadFeaturedStores(); 

// =============================
// TIENDAS DESTACADAS HOME
// =============================

async function loadFeaturedStores() {
  try {
    const res = await fetch("/api/stores");
    const stores = await res.json();

    const container = document.getElementById("featuredStoresSlider");

    if (!container) return;

    container.innerHTML = "";

    stores.slice(0, 12).forEach(store => {
      container.innerHTML += `
        <div class="min-w-[200px] bg-white shadow-lg rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition"
             onclick="viewStore(${store.id})">

          <div class="relative">
            <img src="${store.logo_url || 'https://source.unsplash.com/300x200/?store'}"
                 class="w-full h-32 object-cover">

            <span class="absolute top-2 left-2 bg-orange-600 text-white text-xs px-2 py-1 rounded">
              Destacado
            </span>
          </div>

          <div class="p-3">
            <h3 class="font-semibold text-sm truncate">${store.name}</h3>
            <p class="text-xs text-gray-500">${store.category || ''}</p>
          </div>
        </div>
      `;
    });

  } catch (err) {
    console.error("Error cargando destacadas", err);
  }
}

// =============================
// BUSCADOR
// =============================

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

function goToSearch(){
  const query = searchInput?.value.trim();

  if(!query){
    showToast("Escribe algo para buscar", "warning");
    return;
  }

  window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
}

searchBtn?.addEventListener("click", goToSearch);

searchInput?.addEventListener("keydown", (e) => {
  if(e.key === "Enter"){
    goToSearch();
  }
});

// =============================
// TOAST
// =============================

export function showToast(message, type = "success") {

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500"
  };

  const toast = document.createElement("div");

  toast.className = `
    ${colors[type]} 
    text-white px-5 py-3 rounded-lg shadow-lg 
    flex items-center gap-3 
    animate-slideIn
  `;

  toast.innerHTML = `
    <span>${message}</span>
    <button class="ml-auto font-bold">✕</button>
  `;

  document.getElementById("toastContainer").appendChild(toast);

  toast.querySelector("button").onclick = () => toast.remove();

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// =============================
// MEGA MENU
// =============================

const categoriesBtn = document.getElementById("categoriesBtn");
const megaMenu = document.getElementById("megaMenu");
const subContainer = document.getElementById("subcategories");
const featuredContainer = document.getElementById("featuredStores");

// toggle menú
categoriesBtn.addEventListener("click", () => {
  megaMenu.classList.toggle("hidden");
});

// cerrar afuera
document.addEventListener("click", (e) => {
  if (!categoriesBtn.contains(e.target) && !megaMenu.contains(e.target)) {
    megaMenu.classList.add("hidden");
  }
});

// render subcategorías
document.querySelectorAll(".category-item").forEach(item => {
  item.addEventListener("mouseenter", () => {

    const cat = item.dataset.cat;
    const subs = CATEGORIES[cat];

    if (!subs) {
  subContainer.innerHTML = `<p class="text-gray-400">Sin subcategorías</p>`;
  featuredContainer.innerHTML = ""; 
  return;
}

    let html = "";

    subs.forEach(sub => {
      html += `
        <a href="#" 
           onmouseenter="showFeaturedStores(${sub.id})"
           onclick="loadStores('${cat}', ${sub.id}); return false;"
           class="w-[45%] hover:text-orange-600">
           ${sub.name}
        </a>
      `;
    });

    subContainer.innerHTML = html;

    // limpiar recomendaciones
    featuredContainer.innerHTML = "";
  });
});

// =============================
// TIENDAS DESTACADAS (HOVER)
// =============================

window.showFeaturedStores = async function(subId) {

  try {

    const res = await fetch(`/api/stores?subcategory_id=${subId}`);
    const stores = await res.json();

    if (!stores.length) {
      featuredContainer.innerHTML = `
        <p class="text-gray-400 text-sm">No hay tiendas en esta subcategoría</p>
      `;
      return;
    }

    let html = `<h4 class="text-sm font-semibold mb-3">Tiendas recomendadas</h4>`;
    html += `<div class="flex gap-4 overflow-x-auto pb-2">`;

    stores.slice(0, 6).forEach(store => {
      html += `
        <div class="min-w-[120px] bg-white shadow rounded-lg p-2 text-center hover:scale-105 transition cursor-pointer"
             onclick="viewStore(${store.id})">

          <img src="${store.logo_url || 'https://source.unsplash.com/100x100/?store'}"
               class="w-full h-20 object-cover rounded mb-2">

          <p class="text-xs font-medium truncate">${store.name}</p>
        </div>
      `;
    });

    html += `</div>`;

    featuredContainer.innerHTML = html;

  } catch (err) {
    console.error(err);
    featuredContainer.innerHTML = `
      <p class="text-red-400 text-sm">Error cargando tiendas</p>
    `;
  }
  if (!subId) return;
};
