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
      card.className = "product-card";

      card.innerHTML = `
        <div class="relative">
          <img src="${product.image_url}" class="w-full h-36 object-cover rounded-t-xl">
        </div>

        <div class="p-2">

          <h3 class="text-[13px] font-semibold leading-tight min-h-[38px]">
            ${product.name}
          </h3>

          <p class="text-[12px] text-gray-500 mt-1 leading-tight">
            ${product.store_name || ""}
          </p>

          <div class="mt-1 text-[13px] leading-tight">
            ${window.renderPriceHTML(product)}
          </div>

          <p class="text-yellow-500 text-[11px] mt-1 leading-tight">
            ${
              product.rating_avg
                ? `⭐ ${parseFloat(product.rating_avg).toFixed(1)} (${product.rating_count || 0})`
                : "Sin valoraciones"
            }
          </p>

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
        <div class="relative">
          <img src="${offer.image_url}" 
               class="w-full h-32 object-cover rounded-t-xl">

          <div class="absolute top-2 left-2 bg-orange-500 text-white text-[11px] px-2 py-1 rounded-md leading-none">
            🔥 Oferta
          </div>
        </div>

        <div class="p-2">

          <h3 class="text-[13px] font-semibold leading-tight min-h-[38px]">
            ${offer.product_name}
          </h3>

          <p class="text-[12px] text-gray-500 mt-1 leading-tight">
            ${offer.store_name || ""}
          </p>

          <div class="mt-1 text-[13px] leading-tight">
            ${window.renderPriceHTML({
              price: offer.price,
              old_price: offer.old_price,
              is_offer: true
            })}
          </div>

          <p class="text-yellow-500 text-[11px] mt-1 leading-tight">
            ${
              offer.rating_avg
                ? `⭐ ${parseFloat(offer.rating_avg).toFixed(1)} (${offer.rating_count || 0})`
                : "Sin valoraciones"
            }
          </p>

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
