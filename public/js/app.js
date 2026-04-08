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

window.goToProduct = (id) => {
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
