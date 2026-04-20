// ============================
// PRODUCTOS DESTACADOS
// ============================
export function loadProducts(){

  fetch('/api/products?featured=true')
  .then(res => res.json())
  .then(products => {

    const container = document.getElementById("products");
    if(!container) return;

    container.innerHTML = "";

   products.forEach(product => {

  const card = document.createElement("div");
  card.className = "pc-card";

  card.innerHTML = `
    <div class="pc-card-img">
      <img src="${product.image_url}" alt="${product.name}">
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
          ${
            product.rating_avg
              ? `⭐ ${parseFloat(product.rating_avg).toFixed(1)} (${product.rating_count || 0})`
              : "Sin valoraciones"
          }
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

    offers.forEach(offer => {

      const card = document.createElement("div");
      card.className = "offer-card";

      card.innerHTML = `
        <div class="offer-image">
          <img src="${offer.image_url}" alt="${offer.product_name}">

          <div class="offer-badge">
            🔥 Oferta
          </div>
        </div>

        <div class="offer-info">

          <div class="offer-title">
            ${offer.product_name}
          </div>

          <div class="offer-store">
            ${offer.store_name || ""}
          </div>

          <div class="offer-price">
            ${window.renderPriceHTML({
              price: offer.price,
              old_price: offer.old_price,
              is_offer: true
            })}
          </div>

          <div class="offer-rating">
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

  })
  .catch(err => console.error("Error cargando ofertas:", err));
}
