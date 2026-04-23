import { CATEGORIES } from './data/categories.js';

let allProducts = [];

let currentCategory = null;
let currentSubcategory = null;

document.addEventListener("DOMContentLoaded", async () => {

  await loadProducts();

  document.getElementById("searchInput").addEventListener("input", applyFilters);
  document.getElementById("filterSelect").addEventListener("change", applyFilters);

  renderCategories();
});


// =============================
// LOAD
// =============================

async function loadProducts(){
  try {
    const res = await fetch("/api/products");
    const products = await res.json();

    allProducts = products;
    renderProducts(products);

  } catch (err){
    console.error("Error cargando productos", err);
  }
}


// =============================
// RENDER PRODUCTOS
// =============================

function renderProducts(products){

  const container = document.getElementById("productsContainer");
  const emptyState = document.getElementById("emptyState");

  container.innerHTML = "";

  if(products.length === 0){
    emptyState.classList.remove("hidden");
    return;
  } else {
    emptyState.classList.add("hidden");
  }

  products.forEach(p => {

    const div = document.createElement("div");

    div.className = `
      bg-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden
    `;

    div.innerHTML = `
      <div class="h-40 bg-gray-100 flex items-center justify-center">
        <img src="${p.image_url || '/img/default.png'}"
          class="max-h-full max-w-full object-contain">
      </div>

      <div class="p-3">
        <h3 class="font-semibold text-sm truncate">${p.name}</h3>

        <p class="text-orange-600 font-bold mt-1">
          ${window.renderPriceHTML(p)}
        </p>

        <p class="text-xs text-gray-500 mt-1">
          ${p.store_name || ""}
        </p>
      </div>
    `;

    div.addEventListener("click", () => {
      window.location.href = `/product/${p.id}`;
    });

    container.appendChild(div);
  });
}


// =============================
// FILTROS
// =============================

function applyFilters(){

  const search = document.getElementById("searchInput").value.toLowerCase();
  const filter = document.getElementById("filterSelect").value;

  let filtered = [...allProducts];

  // 🔍 BUSCAR
  if(search){
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search)
    );
  }

  // 🧠 CATEGORÍA
  if(currentCategory){
    filtered = filtered.filter(p =>
      p.category === currentCategory
    );
  }

  // 🧠 SUBCATEGORÍA
  if(currentSubcategory){
    filtered = filtered.filter(p =>
      p.subcategory_id === currentSubcategory
    );
  }

  // 🎯 ORDEN
  switch(filter){

    case "cheap":
      filtered.sort((a,b) => a.price - b.price);
      break;

    case "expensive":
      filtered.sort((a,b) => b.price - a.price);
      break;

    case "best":
      filtered.sort((a,b) => (b.rating_avg || 0) - (a.rating_avg || 0));
      break;
  }

  renderProducts(filtered);
}


// =============================
// CATEGORÍAS
// =============================

function renderCategories(){

  const container = document.getElementById("productCategories");

  const icons = {
    "Gastronomía": "🍔",
    "Alimentos": "🛒",
    "Belleza": "💄",
    "Salud": "➕",
    "Servicios": "🛠",
    "Automotor": "🚗",
    "Hogar": "🏠"
  };

  container.innerHTML = Object.keys(CATEGORIES).map(cat => `
    <button
      onclick="selectCategory('${cat}')"
      class="px-4 py-2 bg-white border rounded-full text-sm hover:bg-orange-600 hover:text-white transition whitespace-nowrap">
      ${icons[cat] || "📍"} ${cat}
    </button>
  `).join("");
}


// =============================
// SELECT CATEGORY
// =============================

window.selectCategory = function(cat){

  if(currentCategory === cat) return;

  currentCategory = cat;
  currentSubcategory = null;

  renderSubcategories(cat);
  applyFilters();
};


// =============================
// SUBCATEGORÍAS
// =============================

function renderSubcategories(cat){

  const subContainer = document.getElementById("subcategoriesContainer");
  const subList = document.getElementById("subcategoriesList");

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


// =============================
// SELECT SUBCATEGORY
// =============================

window.selectSubcategory = function(cat, subId){

  currentCategory = cat;
  currentSubcategory = subId;

  applyFilters();
};
