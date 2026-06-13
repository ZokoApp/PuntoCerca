// ============================
// PRODUCTOS DESTACADOS
// ============================
export function loadProducts() {
  fetch('/api/products?featured=true')
  .then(res => res.json())
  .then(products => {
    const container = document.getElementById("products");
    if (!container) return;
    container.innerHTML = "";

    products.forEach(product => {
      // normalizar imágenes
      let imgs = [];
      if (Array.isArray(product.images) && product.images.length) {
        imgs = product.images;
      } else if (typeof product.images === 'string') {
        try { imgs = JSON.parse(product.images); } catch { imgs = []; }
      }
      if (!imgs.length && product.image_url) imgs = [product.image_url];
      imgs = [...new Set(imgs)].filter(Boolean);

      const card = document.createElement("div");
      card.className = "pc-card";

      card.innerHTML = `
        <div class="pc-card-img" style="overflow:hidden;border-radius:12px 12px 0 0;">
          ${window.buildCarousel ? window.buildCarousel(imgs, product.name) : `<img src="${imgs[0] || '/img/default.png'}" style="width:100%;height:200px;object-fit:cover;">`}
        </div>

        <div class="pc-card-body">
          <div>
            <div class="pc-title">${product.name}</div>
            <div class="pc-store">${product.store_name || ""}</div>
          </div>
          <div>
            <div class="pc-price">
              ${window.renderPriceHTML(product)}
            </div>
            <div class="pc-rating">
              ${product.rating_avg
                ? `⭐ ${parseFloat(product.rating_avg).toFixed(1)} (${product.rating_count || 0})`
                : "Sin valoraciones"}
            </div>
          </div>
        </div>
      `;

      card.addEventListener("click", () => {
        window.location.href = `/product/${product.slug || product.id}`;
      });

      container.appendChild(card);
    });
  })
  .catch(err => console.error("Error cargando productos:", err));
}
function startOfferTimers() {
  const timers = document.querySelectorAll(".offer-timer");

  timers.forEach(timer => {

    const expire = new Date(timer.dataset.expire);

    function update() {
      const now = new Date();
      const diff = expire - now;

      if (diff <= 0) {
        timer.innerHTML = "⛔ Oferta finalizada";
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      timer.innerHTML = `⏳ ${hours}h ${minutes}m ${seconds}s`;
    }

    update();
    setInterval(update, 1000);
  });
}

// ============================
// OFERTAS DEL DÍA
// ============================
export function loadOffers(){

  fetch('/api/daily-offers')
  .then(res => res.json())
  .then(offers => {

    const container = document.getElementById("dailyOffers");
    if(!container) return;

    container.innerHTML = "";

if (!offers.length) {
  document.getElementById("ofertas").style.display = "none";
  return;
}

offers.forEach(offer => {

      const card = document.createElement("div");
      card.className = "product-card";

      card.innerHTML = `
  <div class="product-image">
    <img src="${offer.image_url}">
  </div>

  <div class="product-info">
    <div class="product-title">${offer.product_name}</div>
    <div class="product-store">${offer.store_name || ""}</div>

    <div class="product-price">
  ${window.renderPriceHTML({
    price: offer.price,
    old_price: offer.old_price,
    is_offer: true
  })}
</div>

${offer.offer_expires_at ? `
  <div class="offer-timer" data-expire="${offer.offer_expires_at}"></div>
` : ""}

    <div class="product-rating">
      ${
        offer.rating_avg
          ? `⭐ ${parseFloat(offer.rating_avg).toFixed(1)} (${offer.rating_count || 0})`
          : "Sin valoraciones"
      }
    </div>
  </div>
`;

      card.addEventListener("click", () => {
        window.location.href = `/product/${offer.slug || offer.product_id}`;
      });

      container.appendChild(card);
    });
    startOfferTimers();

  })
  .catch(err => console.error("Error cargando ofertas:", err));
}
