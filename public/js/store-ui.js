

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
