window.isOwner = false;
window.allProducts = [];

function formatPrice(value) {
  const price = parseFloat(value);

  if (isNaN(price) || price <= 0) {
    return "Consultar";
  }

  return `$${price.toLocaleString("es-AR")}`;
}

window.initStoreProducts = async function (store) {
  const storeId = store?.id;

  if (!storeId) {
    console.error("Store ID inválido");
    return;
  }

  // Detectar si es el dueño
  try {
    const resUser = await fetch("/api/me", {
      credentials: "include"
    });

    if (resUser.ok) {
      const user = await resUser.json();

      if (store.user_id === user.id) {
        window.isOwner = true;
      }
    }
  } catch {}

  // Cargar productos
  try {
    const res = await fetch(`/api/stores/${storeId}/products`);
    const data = await res.json();

    window.allProducts = Array.isArray(data) ? data : [];
    renderProducts(window.allProducts);

  } catch (err) {
    console.error("Error cargando productos:", err);
  }
};

function renderProducts(products) {
  const container = document.getElementById("storeProducts");

  if (!container) {
    console.error("No existe #storeProducts");
    return;
  }

  container.innerHTML = "";

  if (!products.length) {
    container.innerHTML = `
      <p style="color:#888;">Esta tienda todavía no tiene productos.</p>
    `;
    return;
  }

  products.forEach((p) => {
    const image = p.image_url || "/img/no-image.png";
    const title = p.name || "Producto sin nombre";
    const price = formatPrice(p.price);

    const rating =
      p.rating_avg && parseFloat(p.rating_avg) > 0
        ? `⭐ ${parseFloat(p.rating_avg).toFixed(1)} (${p.rating_count || 0})`
        : "Sin valoraciones";

    const buttonText =
      p.price && parseFloat(p.price) > 0
        ? "Ver producto"
        : "Consultar";

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="card-image">
        <img src="${image}" alt="${title}">
      </div>

      <div class="card-body">
        <h3 class="card-title">${title}</h3>

        <div class="card-price">${price}</div>

        <div class="card-rating">${rating}</div>

        <button class="card-btn">${buttonText}</button>
      </div>
    `;

    // Click en toda la tarjeta
    card.addEventListener("click", () => {
      window.location.href = `/product/${p.slug || p.id}`;
    });

    // Click en el botón
    const btn = card.querySelector(".card-btn");
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        window.location.href = `/product/${p.slug || p.id}`;
      });
    }

    container.appendChild(card);
  });
}
