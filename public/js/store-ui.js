document.addEventListener("DOMContentLoaded", () => {

  // ==========================================
  // MODAL DE PRODUCTOS
  // ==========================================
  const modal = document.getElementById("productModal");
  const openBtn = document.getElementById("addProductBtn");
  const closeBtn = document.getElementById("closeModal");

  if (openBtn && modal) {
    openBtn.addEventListener("click", () => {
      modal.classList.remove("hidden");
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }

  // ==========================================
  // COMPARTIR CATÁLOGO
  // ==========================================
  const shareBtn = document.getElementById("shareCatalogBtn");

  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {

      const storeName =
        document.getElementById("storeName")?.textContent?.trim() ||
        "Catálogo de PuntoCerca";

      const url = window.location.href;

      const shareData = {
        title: storeName,
        text: `Mirá el catálogo de ${storeName} en PuntoCerca`,
        url: url
      };

      try {
        // En celulares abre el menú nativo de compartir
        if (navigator.share) {
          await navigator.share(shareData);
          return;
        }

        // Fallback para PC: copiar enlace
        await navigator.clipboard.writeText(url);
        alert("Enlace del catálogo copiado al portapapeles.");

      } catch (error) {
        console.error("Error al compartir catálogo:", error);
      }

    });
  }

});
