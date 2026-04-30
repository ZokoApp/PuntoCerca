import { loadStores, focusStore } from './modules/stores.js';
import { initSliders } from './modules/ui.js';
import { loadProducts, loadOffers } from './modules/offers.js';
import { CATEGORIES } from './data/categories.js';
import { initNotifications } from './modules/notifications.js';

// =============================
// ESTADO
// =============================

let currentCategory = null;
let currentSubcategory = null;

// =============================
// GLOBAL
// =============================

window.loadStores = loadStores;

window.viewStore = function(slug){
  window.location.href = `/${slug}`;
};

window.goToProduct = (product) => {
  window.location.href = `/product/${product.slug}`;
};

window.focusStore = focusStore;

// 👉 NUEVO: navegación centralizada (IMPORTANTE)
window.handleSearchClick = function(type, value){
  if(type === "store"){
    window.location.href = `/${value}`;
  } else {
    window.location.href = `/product/${value}`;
  }
};

// =============================
// INIT
// =============================

loadStores();
loadProducts();
loadOffers();
initSliders();
initNotifications();
loadEvents();
// =============================
// BUSCADOR
// =============================

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsBox = document.getElementById("searchResults");

let searchTimeout;

if (searchInput && resultsBox) {

  searchInput.addEventListener("input", (e) => {

    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(async () => {

      const query = e.target.value.trim();

      if (!query) {
        resultsBox.classList.add("hidden");
        return;
      }

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (!data.length) {
          resultsBox.innerHTML = `<div class="p-3 text-sm text-gray-500">Sin resultados</div>`;
          resultsBox.classList.remove("hidden");
          return;
        }

        resultsBox.innerHTML = data.map(item => `
          <div 
            class="p-3 hover:bg-gray-100 cursor-pointer flex gap-3 items-center"
            onclick="handleSearchClick('${item.type}', '${item.slug}')"
          >
            <img src="${item.image || '/img/default.png'}"
                 class="w-10 h-10 rounded-lg object-cover">

            <div>
              <div class="font-semibold">${item.name}</div>
              <div class="text-xs text-gray-500">
                ${item.type === 'store' ? 'Tienda' : 'Producto'}
              </div>
            </div>
          </div>
        `).join("");

        resultsBox.classList.remove("hidden");

      } catch (err) {
        console.error("Error búsqueda:", err);
      }

    }, 300);
  });

  // ENTER → búsqueda completa
  searchInput.addEventListener("keydown", (e) => {
    if(e.key === "Enter"){
      const query = searchInput.value.trim();
      if(query){
        window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
      }
    }
  });
}

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

  loadStores(cat);
  renderSubcategories(cat);
};

window.selectSubcategory = function(cat, subId){

  if (currentCategory === cat && currentSubcategory === subId) return;

  currentCategory = cat;
  currentSubcategory = subId;

  loadStores(cat, subId);
};

// =============================
// SUBCATEGORÍAS
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
  data-cat="${cat}" 
  data-sub="${sub.id}"
  class="sub-btn px-4 py-2 bg-white border rounded-full text-sm hover:bg-orange-600 hover:text-white transition whitespace-nowrap">
  ${sub.name}
</button>
  `).join("");
}
document.addEventListener("click", (e) => {
  if(e.target.classList.contains("sub-btn")){
    const cat = e.target.dataset.cat;
    const sub = e.target.dataset.sub;

    selectSubcategory(cat, sub);
  }
});

// =============================
// RESET
// =============================

window.resetFilters = function(){

  currentCategory = null;
  currentSubcategory = null;

  loadStores();

  subContainer.classList.add("hidden");
};

// =============================
// CERRAR BUSCADOR
// =============================

document.addEventListener("click", (e) => {
  if (!resultsBox || !searchInput) return;

  if (!resultsBox.contains(e.target) && e.target !== searchInput) {
    resultsBox.classList.add("hidden");
  }
});

async function loadEvents() {
  const container = document.getElementById("eventsContainer");
  if (!container) return;

  container.innerHTML = "";

  try {
    const res = await fetch("/api/events");

    if (!res.ok) {
      container.innerHTML = `<p style="color:#888;">No se pudieron cargar los eventos</p>`;
      return;
    }

    const events = await res.json();

    const now = new Date();

    // 🔥 ORDEN + FILTRO REAL
    const sortedEvents = events
      .filter(e => new Date(e.end_at) > now)
      .sort((a, b) => {
        const aStart = new Date(a.start_at);
        const bStart = new Date(b.start_at);

        const aActive = now >= aStart && now <= new Date(a.end_at);
        const bActive = now >= bStart && now <= new Date(b.end_at);

        // activos primero
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;

        // luego por fecha
        return aStart - bStart;
      })
      .slice(0, 10);

    if (!sortedEvents.length) {
      container.innerHTML = `<p style="color:#888;">No hay eventos próximos</p>`;
      return;
    }

    sortedEvents.forEach(event => {

      const start = new Date(event.start_at);
      const end = new Date(event.end_at);

      const isActive = now >= start && now <= end;

      const statusText = isActive ? "En curso" : "Próximo";
      const statusColor = isActive ? "#16a34a" : "#f59e0b";

      const formattedDate = start.toLocaleString("es-AR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });

      const card = document.createElement("div");
card.className = "card event-card";

card.innerHTML = `
  <div class="event-image">
    <img src="${event.image_url}" />

    <div class="event-badge" style="background:${statusColor}">
      ${statusText}
    </div>
  </div>

  <div class="card-content">

    <h3 class="event-title">
      ${event.title}
    </h3>

    <div class="event-meta">
      <span>📅 ${formattedDate}</span>
      <span>🏪 ${event.store_name}</span>
    </div>

    <p class="event-desc">
      ${event.description || ""}
    </p>

  </div>

  <div class="card-buttons">
    <button onclick="window.location.href='/${event.store_slug}'">
      Ver tienda
    </button>
  </div>
`;
      container.appendChild(card);
    });

  } catch (err) {
    console.error("Error cargando eventos:", err);
    container.innerHTML = `<p style="color:#888;">Error cargando eventos</p>`;
  }
}
