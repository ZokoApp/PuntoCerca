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
    alert("Escribe algo para buscar");
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
