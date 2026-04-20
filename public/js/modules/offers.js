export function loadProducts(){

    fetch('/api/products?featured=true')
    .then(res => res.json())
    .then(products => {

        const container = document.getElementById("products");
        container.innerHTML = "";

        products.forEach(product => {

            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <img src="${product.image_url}" />
                <h3>${product.name}</h3>
                <p>${product.store_name}</p>

               <p>${window.renderPriceHTML(product)}</p>

                <p style="color:#f59e0b;font-size:12px;margin-top:4px;">
                  ${
                    product.rating_avg
                      ? `⭐ ${parseFloat(product.rating_avg).toFixed(1)} (${product.rating_count || 0})`
                      : "Sin valoraciones"
                  }
                </p>
            `;

            // ✅ FIX: usar slug
            card.addEventListener("click", () => {
                window.location.href = `/product/${product.slug || product.id}`;
            });

            container.appendChild(card);
        });
    });
}

export function loadOffers(){

  fetch('/api/daily-offers')
  .then(res => res.json())
  .then(offers => {

    const container = document.getElementById("dailyOffers");
    if(!container) return;

    container.innerHTML = "";

    offers.forEach(offer => {

      const card = document.createElement("div");

      card.className = `
        min-w-[160px] 
        max-w-[160px]
        flex-shrink-0
        bg-white rounded-xl shadow hover:shadow-lg 
        overflow-hidden transition cursor-pointer
      `;

      card.innerHTML = `
        <div class="relative">
          <img src="${offer.image_url}" 
               class="w-full h-32 object-cover rounded-t-xl">

          <div class="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-md">
            🔥 Oferta
          </div>
        </div>

        <div class="p-2">

          <h3 class="text-xs font-semibold line-clamp-2">
            ${offer.product_name}
          </h3>

          <p class="text-xs text-gray-500 mt-1">
            ${offer.store_name || ""}
          </p>

          <div class="mt-1 text-xs">
            ${window.renderPriceHTML({
              price: offer.price,
              old_price: offer.old_price,
              is_offer: true
            })}
          </div>

          <p class="text-yellow-500 text-[11px] mt-1">
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
  });
}
