console.log("OFERTAS JS CARGADO");

async function loadOffers() {
  console.log("Ejecutando loadOffers");

  try {
    const grid = document.getElementById("offersGrid");

    if (!grid) {
      console.error("No existe #offersGrid");
      return;
    }

    const res = await fetch('/api/daily-offers');
    console.log("Status /api/daily-offers:", res.status);

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}`);
    }

    const products = await res.json();
    console.log("Ofertas recibidas:", products);

    grid.innerHTML = "";

    if (!Array.isArray(products) || products.length === 0) {
      grid.innerHTML = "<p>No hay ofertas disponibles</p>";
      return;
    }

    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <div class="img-box">
          <img src="${p.image_url || ''}" alt="${p.product_name || 'Producto'}" />
        </div>

        <div class="card-body">
          <div>
            ${p.product_name || 'Sin nombre'}
            <span class="badge">OFERTA</span>
          </div>

          <div class="price">
            $${p.price ? parseFloat(p.price).toLocaleString() : '0'}
          </div>

          <div class="store">${p.store_name || ''}</div>
        </div>
      `;

      card.onclick = () => {
        window.location.href = `/product/${p.product_id}`;
      };

      grid.appendChild(card);
    });
  } catch (err) {
    console.error("ERROR EN OFFERS:", err);
  }
}

loadOffers();
