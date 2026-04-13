import { loadStores, focusStore } from './modules/stores.js';
import { initSliders } from './modules/ui.js';
import { loadProducts, loadOffers } from './modules/offers.js';


// GLOBAL (para HTML onclick)
window.loadStores = loadStores;

window.viewStore = (id) => {
  window.location.href = `/store/${id}`;
};


window.viewStore = function(id){
    window.location.href = `/store/${id}`;
}

window.goToProduct = (product) => {
  window.location.href = `/product/${product.slug || product.id}`;
};

window.focusStore = focusStore;

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

// click botón
if(searchBtn){
  searchBtn.addEventListener("click", goToSearch);
}

// enter en input
if(searchInput){
  searchInput.addEventListener("keydown", (e) => {
    if(e.key === "Enter"){
      goToSearch();
    }
  });
}

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

  // cerrar manual
  toast.querySelector("button").onclick = () => {
    toast.remove();
  };

  // auto remove
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

const categoriesBtn = document.getElementById("categoriesBtn");
const megaMenu = document.getElementById("megaMenu");
const subcategoriesDiv = document.getElementById("subcategories");

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

// DATA REAL
const categoriesData = {
  "Gastronomía": [
    { name: "Restaurante", id: 1 },
    { name: "Pizzería", id: 2 },
    { name: "Bar", id: 3 },
    { name: "Cafetería", id: 4 },
    { name: "Heladería", id: 5 }
  ],
  "Comercio": [
    { name: "Ropa", id: 6 },
    { name: "Electrónica", id: 7 },
    { name: "Ferretería", id: 8 },
    { name: "Librería", id: 9 }
  ],
  "Belleza": [
    { name: "Peluquería", id: 10 },
    { name: "Barbería", id: 11 },
    { name: "Estética", id: 12 },
    { name: "Spa", id: 13 }
  ],
  "Salud": [
    { name: "Clínica", id: 14 },
    { name: "Odontología", id: 15 },
    { name: "Farmacia", id: 16 },
    { name: "Psicología", id: 17 }
  ],
  "Servicios": [
    { name: "Electricista", id: 18 },
    { name: "Plomería", id: 19 },
    { name: "Gasista", id: 20 },
    { name: "Técnico PC", id: 21 },
    { name: "Reparaciones", id: 22 }
  ]
};

document.querySelectorAll(".category-item").forEach(item => {
  item.addEventListener("mouseenter", () => {

    const cat = item.dataset.cat;
    const subs = categoriesData[cat] || [];

    subcategoriesDiv.innerHTML = `
      <h3 class="col-span-2 font-bold text-lg mb-4">${cat}</h3>
      ${subs.map(sub => `
        <div 
          class="cursor-pointer hover:text-orange-600"
          onclick="loadStores('${cat}', ${sub.id})"
        >
          ${sub.name}
        </div>
      `).join("")}
    `;
  });
});
