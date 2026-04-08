

window.isOwner = false;
window.allProducts = [];

window.initStoreProducts = async function(store) {



  const storeId = store?.id;

  if (!storeId) {
    console.error("Store ID inválido");
    return;
  }

  try {
    const resUser = await fetch('/api/me', { credentials: 'include' });

    if (resUser.ok) {
      const user = await resUser.json();

      if (store.user_id === user.id) {
        window.isOwner = true;
      }
    }
  } catch {}

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

  products.forEach(p => {

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div style="position:relative">
        ${
          window.isOwner
            ? `
            <div style="position:absolute;top:5px;right:5px;display:flex;gap:5px;">
              <button class="edit-btn">✏️</button>
              <button class="delete-btn">🗑️</button>
            </div>
          `
            : ""
        }
        <img src="${p.image_url}" />
      </div>

      <h3>${p.name}</h3>

      <p class="text-orange-600 font-bold">
        $${parseFloat(p.price || 0).toLocaleString()}
      </p>

      <p class="text-yellow-600 text-sm mt-1">
        ${
          p.rating_avg
            ? `⭐ ${parseFloat(p.rating_avg).toFixed(1)} (${p.rating_count || 0})`
            : "Sin valoraciones"
        }
      </p>
    `;

    card.onclick = () => {
      window.location.href = `/product/${p.slug || p.id}`;
    };

    card.querySelector(".edit-btn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = `/edit-product/${p.id}`;
    });

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
