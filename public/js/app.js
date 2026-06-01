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
  "Gastronomía": `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /><path stroke-linecap="round" stroke-linejoin="round" d="M3 12h18M3 6h18M3 18h18" /></svg>`,
  "Alimentos": `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>`,
  "Belleza": `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>`,
  "Salud": `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
  "Servicios": `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" /></svg>`,
  "Automotor": `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>`,
  "Hogar": `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-7 h-7"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>`
};

const colors = {
  "Gastronomía": { bg: "bg-orange-100", text: "text-orange-600" },
  "Alimentos":   { bg: "bg-green-100",  text: "text-green-600"  },
  "Belleza":     { bg: "bg-pink-100",   text: "text-pink-600"   },
  "Salud":       { bg: "bg-blue-100",   text: "text-blue-600"   },
  "Servicios":   { bg: "bg-yellow-100", text: "text-yellow-600" },
  "Automotor":   { bg: "bg-gray-100",   text: "text-gray-600"   },
  "Hogar":       { bg: "bg-purple-100", text: "text-purple-600" }
};

categoriesContainer.innerHTML = mainCategories.map(cat => `
  <div 
    onclick="selectCategory('${cat}')"
    class="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer text-center flex flex-col items-center gap-3">

    <div class="w-14 h-14 rounded-2xl flex items-center justify-center ${colors[cat].bg} ${colors[cat].text}">
      ${icons[cat]}
    </div>

    <p class="font-semibold text-gray-700 text-sm">
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
    const days = Math.floor(minutes / (60 * 24));
const hours = Math.floor((minutes % (60 * 24)) / 60);
const mins = minutes % 60;

    if (minutes <= 60) {
      return {
        text: `Empieza en ${minutes} min`,
        color: "#ef4444",
        className: "soon",
        buttonText: "Ver evento"
      };
    }

   if (days > 0) {
  return {
    text: `Empieza en ${days}d ${hours}h`,
    color: "#f97316",
    className: "upcoming",
    buttonText: "Ver evento"
  };
}

return {
  text: `Empieza en ${hours}h ${mins}m`,
  color: "#f97316",
  className: "upcoming",
  buttonText: "Ver evento"
};

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
  minute: "2-digit",
  hour12: false
});

      const card = document.createElement("div");
card.className = `card event-card ${status.className}`;

card.innerHTML = `
  <div class="event-image">
    <img src="${event.image_url}" />

    <div 
  class="event-badge ${status.className}" 
  id="badge-${event.id}"
  style="background:${status.color}">
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
      startLiveTimer(event);
    });

  } catch (err) {
    console.error("Error cargando eventos:", err);
    container.innerHTML = `<p style="color:#888;">Error cargando eventos</p>`;
  }
}

function startLiveTimer(event) {
  const el = document.getElementById(`badge-${event.id}`);
  if (!el) return;

  function update() {
    const now = new Date();
    const start = new Date(event.start_at);

    const diff = start - now;

    if (diff <= 0) {
      el.innerText = "🔥 En curso";
      el.style.background = "#16a34a";
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);

    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let text = "Empieza en ";

    if (days > 0) text += `${days}d `;
    if (hours > 0 || days > 0) text += `${hours}h `;
    if (minutes > 0 || hours > 0) text += `${minutes}m `;

    text += `${seconds}s`;

    el.innerText = text;
  }

  update();
  setInterval(update, 1000);
}
