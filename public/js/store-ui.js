function renderStore(store){

  document.getElementById("storeName").innerText = store.name;

  document.getElementById("storeDescription").innerText =
    store.description || "";

  if(store.cover_url){
    document.getElementById("storeCover").style.backgroundImage =
      `url('${store.cover_url}')`;
  }

  if(store.logo_url){
    document.getElementById("storeLogo").style.backgroundImage =
      `url('${store.logo_url}')`;
  }

}

document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("productModal");
  const openBtn = document.getElementById("addProductBtn");
  const closeBtn = document.getElementById("closeModal");

  if(openBtn){
    openBtn.addEventListener("click", () => {
      modal.classList.remove("hidden");
    });
  }

  if(closeBtn){
    closeBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }

});