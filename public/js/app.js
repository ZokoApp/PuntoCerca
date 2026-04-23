import { loadStores, focusStore } from './modules/stores.js';
import { initSliders } from './modules/ui.js';
import { loadProducts, loadOffers } from './modules/offers.js';
import { CATEGORIES } from './data/categories.js';

let currentCategory = null;
let currentSubcategory = null;

window.selectCategory = function(cat){
  console.log("CLICK CATEGORIA:", cat);

  if (typeof loadStores !== "function") {
    console.error("loadStores no está disponible");
    return;
  }

  loadStores(cat);
};

// GLOBAL
window.loadStores = loadStores;

window.viewStore = function(id){
  window.location.href = `/store/${id}`;
};

window.goToProduct = (product) => {
  window.location.href = `/product/${product.slug || product.id}`;
};

window.focusStore = focusStore;

window.selectSubcategory = function(cat, subId){
  currentCategory = cat;
  currentSubcategory = subId;

  loadStores(currentCategory, currentSubcategory);
};

// INIT
loadStores();
loadProducts();
loadOffers();
initSliders();



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
if (categoriesBtn && megaMenu) {

  categoriesBtn.addEventListener("click", () => {
    megaMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!categoriesBtn.contains(e.target) && !megaMenu.contains(e.target)) {
      megaMenu.classList.add("hidden");
    }
  });

}



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
       onclick="selectSubcategory('${cat}', ${sub.id}); return false;"
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

    const res = await fetch("/api/stores");
    const stores = await res.json();

    let html = `<h4 class="text-sm font-semibold mb-3">Tiendas recomendadas</h4>`;
    html += `<div class="flex gap-4 overflow-x-auto pb-2">`;

    stores.slice(0, 6).forEach(store => {
     html += `
  <div class="min-w-[220px] bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer"
       onclick="viewStore(${store.id})">

    <!-- IMAGEN CONTROLADA -->
    <div class="w-full h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
      <img src="${store.logo_url || 'https://via.placeholder.com/150'}"
           class="max-h-full max-w-full object-contain">
    </div>

    <!-- INFO -->
    <div class="p-3">

      <p class="text-sm font-semibold truncate">
        ${store.name}
      </p>

      <p class="text-xs text-gray-500">
        ${store.category || 'Comercio'}
      </p>

    </div>

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

// =============================
// RENDER CATEGORÍAS (DINÁMICO)
// =============================

const categoriesContainer = document.getElementById("categoriesContainer");

if (categoriesContainer) {

  const mainCategories = [
    "Gastronomía",
    "Alimentos",
    "Belleza",
    "Salud",
    "Servicios",
    "Automotor",
    "Hogar"
  ];

  const icons = {
    "Gastronomía": "🍔",
    "Alimentos": "🛒",
    "Belleza": "💄",
    "Salud": "➕",
    "Servicios": "🛠",
    "Automotor": "🚗",
    "Hogar": "🏠"
  };

  categoriesContainer.innerHTML = mainCategories.map(cat => `
    <div 
      onclick="selectCategory('${cat}')"
      class="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer text-center">

      <div class="text-3xl mb-2">
        ${icons[cat] || "📍"}
      </div>

      <p class="font-medium text-gray-700">
        ${cat}
      </p>

    </div>
  `).join("");

}

const subContainer = document.getElementById("subcategoriesContainer");
const subList = document.getElementById("subcategoriesList");

window.selectCategory = function(cat){

  currentCategory = cat;
  currentSubcategory = null;

  console.log("CATEGORIA:", cat);

  loadStores(cat);

  // 🔥 mostrar subcategorías
  renderSubcategories(cat);
};

function renderSubcategories(cat){

  const subs = CATEGORIES[cat];

  if (!subs || subs.length === 0){
    subContainer.classList.add("hidden");
    return;
  }

  subContainer.classList.remove("hidden");

  subList.innerHTML = subs.map(sub => `
    <button
      onclick="selectSubcategory('${cat}', ${sub.id})"
      class="px-4 py-2 bg-white border rounded-full text-sm hover:bg-orange-600 hover:text-white transition whitespace-nowrap">
      ${sub.name}
    </button>
  `).join("");
}

