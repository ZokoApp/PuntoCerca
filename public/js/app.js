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
const categories = {
  "Comercio": [
    { name: "Ropa", id: 6 },
    { name: "Electrónica", id: 7 },
    { name: "Ferretería", id: 8 },
    { name: "Librería", id: 9 }
  ],
  "Gastronomía": [
    { name: "Restaurante", id: 1 },
    { name: "Pizzería", id: 2 },
    { name: "Bar", id: 3 },
    { name: "Cafetería", id: 4 },
    { name: "Heladería", id: 5 }
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
  ],
  "Automotor": [
    { name: "Taller mecánico", id: 23 },
    { name: "Lavadero", id: 24 },
    { name: "Gomería", id: 25 },
    { name: "Repuestos", id: 26 }
  ],
  "Educación": [
    { name: "Instituto", id: 27 },
    { name: "Clases particulares", id: 28 },
    { name: "Academia", id: 29 }
  ],
  "Deportes": [
    { name: "Gimnasio", id: 30 },
    { name: "Escuela deportiva", id: 31 },
    { name: "Club", id: 32 }
  ],
  "Mascotas": [
    { name: "Veterinaria", id: 33 },
    { name: "Pet Shop", id: 34 },
    { name: "Peluquería canina", id: 35 }
  ],
  "Hogar": [
    { name: "Mueblería", id: 36 },
    { name: "Decoración", id: 37 },
    { name: "Construcción", id: 38 }
  ],
  "Profesionales": [
    { name: "Abogado", id: 39 },
    { name: "Contador", id: 40 },
    { name: "Arquitecto", id: 41 },
    { name: "Marketing", id: 42 }
  ],
  "Eventos": [
    { name: "Salón de eventos", id: 43 },
    { name: "Catering", id: 44 },
    { name: "Fotografía", id: 45 }
  ]
};

const subContainer = document.getElementById("subcategories");

document.querySelectorAll(".category-item").forEach(item => {
  item.addEventListener("mouseenter", () => {

    const cat = item.dataset.cat;
    const subs = CATEGORIES[cat];

    if (!subs) {
      subContainer.innerHTML = `<p class="text-gray-400">Sin subcategorías</p>`;
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

    // limpiar featured cuando cambia categoría
    document.getElementById("featuredStores").innerHTML = `
   
    `;
  });
});

window.showFeaturedStores = async function(subId) {

  const container = document.getElementById("featuredStores");

  try {

    const res = await fetch(`/api/stores?subcategory_id=${subId}`);
    const stores = await res.json();

    if (!stores.length) {
      container.innerHTML = `
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

    container.innerHTML = html;

  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <p class="text-red-400 text-sm">Error cargando tiendas</p>
    `;
  }
};
