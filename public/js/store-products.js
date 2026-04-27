window.isOwner = false;
window.allProducts = [];

window.initStoreProducts = async function(store) {

  const storeId = store?.id;

  if (!storeId) {
    console.error("Store ID inválido");
    return;
  }

  // 🔐 detectar dueño
  try {
    const resUser = await fetch('/api/me', { credentials: 'include' });

    if (resUser.ok) {
      const user = await resUser.json();

      if (store.user_id === user.id) {
        window.isOwner = true;
      }
    }
  } catch {}

  // 📦 cargar productos
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
    container.innerHTML = `<p style="color:#888;">Esta tienda todavía no tiene productos</p>`;
    return;
  }

  products.forEach(p => {

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="card-image">

        ${p.is_offer ? `<span class="badge-offer">OFERTA</span>` : ""}

        <img src="${p.image_url}" />

        ${
          window.isOwner
            ? `
            <div class="card-actions">
              <button class="edit-btn">✏️</button>
              <button class="delete-btn">🗑️</button>
            </div>
          `
            : ""
        }

      </div>

      <div class="card-body">

        <h3 class="card-title">${p.name}</h3>

        <div class="card-price">
          ${
            p.old_price
              ? `<span class="old-price">$${parseFloat(p.old_price).toLocaleString()}</span>`
              : ""
          }
          <span class="new-price">$${parseFloat(p.price || 0).toLocaleString()}</span>
        </div>

        <div class="card-rating">
          ${
            p.rating_avg
              ? `⭐ ${parseFloat(p.rating_avg).toFixed(1)} (${p.rating_count || 0})`
              : "Sin valoraciones"
          }
        </div>

      </div>
    `;

    // 👉 click card
    card.onclick = () => {
      window.location.href = `/product/${p.slug || p.id}`;
    };

    // ✏️ editar
    card.querySelector(".edit-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = `/edit-product/${p.id}`;
    });

    // 🗑️ eliminar
    card.querySelector(".delete-btn")?.addEventListener("click", async (e) => {
      e.stopPropagation();

      if (!confirm("¿Eliminar producto?")) return;

      try {
        const res = await fetch(`/api/products/${p.id}`, {
          method: "DELETE",
          credentials: "include"
        });

        if (!res.ok) throw new Error();

        window.allProducts = window.allProducts.filter(prod => prod.id !== p.id);
        renderProducts(window.allProducts);

      } catch {
        alert("Error eliminando");
      }
    });

    container.appendChild(card);
  });
}
