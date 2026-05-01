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

function getEventStatus(event) {
  const now = new Date();
  const start = new Date(event.start_at);
  const end = new Date(event.end_at);

  const diffToStart = start - now;
  const diffToEnd = end - now;

  if (now >= start && now <= end) {
    const minutesLeft = Math.floor(diffToEnd / (1000 * 60));

    if (minutesLeft <= 30) {
      return {
        text: "Finalizando",
        color: "#dc2626",
        className: "ending",
        buttonText: "Ver evento"
      };
    }

    return {
      text: "En curso",
      color: "#16a34a",
      className: "live",
      buttonText: "Ver ahora"
    };
  }

  if (diffToStart > 0) {
    const minutes = Math.floor(diffToStart / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (minutes <= 60) {
      return {
        text: `Empieza en ${minutes} min`,
        color: "#ef4444",
        className: "soon",
        buttonText: "Ver evento"
      };
    }

    if (hours < 24) {
      return {
        text: `Empieza en ${hours}h ${remainingMinutes}m`,
        color: "#f97316",
        className: "upcoming",
        buttonText: "Ver evento"
      };
    }

    return {
      text: "Próximo",
      color: "#f59e0b",
      className: "upcoming",
      buttonText: "Ver evento"
    };
  }

  return {
    text: "Finalizado",
    color: "#6b7280",
    className: "expired",
    buttonText: "Ver evento"
  };
}

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
    const statusA = getEventStatus(a);
    const statusB = getEventStatus(b);

    const priority = {
      live: 0,
      ending: 1,
      soon: 2,
      upcoming: 3,
      expired: 4
    };

    const priorityA = priority[statusA.className] ?? 99;
    const priorityB = priority[statusB.className] ?? 99;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return new Date(a.start_at) - new Date(b.start_at);
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

      const status = getEventStatus(event);

      const formattedDate = start.toLocaleString("es-AR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });

      const card = document.createElement("div");
card.className = `card event-card ${status.className}`;

card.innerHTML = `
  <div class="event-image">
    <img src="${event.image_url}" />

    <div class="event-badge ${status.className}" style="background:${status.color}">
  ${status.text}
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

<div class="event-timer" id="timer-${event.id}">
  Cargando...
</div>

   <p class="event-desc">
  ${(event.description || "").slice(0, 80)}...
</p>

  </div>

  <div class="card-buttons">
  <button 
    class="event-btn ${status.className}"
    onclick="window.location.href='/event.html?id=${event.id}'"
  >
    ${status.buttonText}
  </button>
</div>
`;
      container.appendChild(card);
      startEventTimer(event);
    });

  } catch (err) {
    console.error("Error cargando eventos:", err);
    container.innerHTML = `<p style="color:#888;">Error cargando eventos</p>`;
  }
}

function startEventTimer(event) {
  const el = document.getElementById(`timer-${event.id}`);
  if (!el) return;

  function update() {
    const now = new Date();
    const start = new Date(event.start_at);

    const diff = start - now;

    if (diff <= 0) {
      el.innerText = "🔥 En curso";
      el.style.color = "#16a34a";
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    el.innerText = `⏳ Empieza en ${hours}h ${minutes}m`;
    el.style.color = "#f97316";
  }

  update();
  setInterval(update, 60000);
}
