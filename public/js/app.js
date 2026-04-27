import { loadStores, focusStore } from './modules/stores.js';
import { initSliders } from './modules/ui.js';
import { loadProducts, loadOffers } from './modules/offers.js';
import { CATEGORIES } from './data/categories.js';

// =============================
// ESTADO
// =============================

let currentCategory = null;
let currentSubcategory = null;

// =============================
// GLOBAL
// =============================

window.loadStores = loadStores;

window.viewStore = function(id){
  window.location.href = `/store/${id}`;
};

window.goToProduct = (product) => {
  window.location.href = `/product/${product.slug || product.id}`;
};

window.focusStore = focusStore;

// =============================
// INIT
// =============================

loadStores();
loadProducts();
loadOffers();
initSliders();

// =============================
// BUSCADOR
// =============================

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

searchInput?.addEventListener("input", async (e) => {

  const query = e.target.value.trim();

  const resultsBox = document.getElementById("searchResults");

  if (!query) {
    resultsBox.classList.add("hidden");
    return;
  }

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (!data.length) {
      resultsBox.innerHTML = `<div style="padding:10px;">Sin resultados</div>`;
      resultsBox.classList.remove("hidden");
      return;
    }

    resultsBox.innerHTML = data.map(item => `
      <div 
        class="p-3 hover:bg-gray-100 cursor-pointer flex gap-3 items-center"
        onclick="${item.type === 'store' 
          ? `window.location.href='/${item.slug || item.id}'`
          : `window.location.href='/product/${item.id}'`
        }"
      >
        <img src="${item.image || '/img/default.png'}"
             style="width:40px;height:40px;border-radius:8px;object-fit:cover;">

        <div>
          <div style="font-weight:600">${item.name}</div>
          <div style="font-size:12px;color:#666;">
            ${item.type === 'store' ? 'Tienda' : 'Producto'}
          </div>
        </div>
      </div>
    `).join("");

    resultsBox.classList.remove("hidden");

  } catch (err) {
    console.error(err);
  }

});
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
// CATEGORÍAS
// =============================

const categoriesContainer = document.getElementById("categoriesContainer");
const subContainer = document.getElementById("subcategoriesContainer");
const subList = document.getElementById("subcategoriesList");

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

// =============================
// ACCIONES
// =============================

window.selectCategory = function(cat){

  if (currentCategory === cat && !currentSubcategory) return;

  currentCategory = cat;
  currentSubcategory = null;

  console.log("CATEGORIA:", cat);

  loadStores(cat);
  renderSubcategories(cat);
};

window.selectSubcategory = function(cat, subId){

  if (currentCategory === cat && currentSubcategory === subId) return;

  currentCategory = cat;
  currentSubcategory = subId;

  console.log("SUBCATEGORIA:", cat, subId);

  loadStores(cat, subId);
};

// =============================
// RENDER SUBCATEGORÍAS
// =============================

function renderSubcategories(cat){

  const subs = CATEGORIES[cat];

  if (!subs || subs.length === 0){
    subContainer.classList.add("hidden");
    return;
  }

  subContainer.classList.remove("hidden");

  subList.innerHTML = `
    <button
      onclick="resetFilters()"
      class="px-4 py-2 bg-gray-200 rounded-full text-sm whitespace-nowrap">
      Ver todo
    </button>
  ` + subs.map(sub => `
    <button
      onclick="selectSubcategory('${cat}', ${sub.id})"
      class="px-4 py-2 bg-white border rounded-full text-sm hover:bg-orange-600 hover:text-white transition whitespace-nowrap">
      ${sub.name}
    </button>
  `).join("");
}

// =============================
// RESET
// =============================

window.resetFilters = function(){

  currentCategory = null;
  currentSubcategory = null;

  console.log("RESET FILTROS");

  loadStores();

  subContainer.classList.add("hidden");
};
