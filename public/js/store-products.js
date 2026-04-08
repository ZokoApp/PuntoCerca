window.isOwner = window.isOwner || false;
window.allProducts = window.allProducts || [];

document.addEventListener("DOMContentLoaded", init);

async function waitForStore() {
  return new Promise(resolve => {
    const interval = setInterval(() => {
      if (window.storeData?.id) {
        clearInterval(interval);
        resolve(window.storeData);
      }
    }, 50);
  });
}

async function init() {

  // 🔥 esperar a que store.js cargue la tienda
  const store = await waitForStore();
  const storeId = store.id;

  // 🔐 verificar si es dueño
  try {
    const resUser = await fetch('/api/me', { credentials: 'include' });

    if (resUser.ok) {
      const user = await resUser.json();

      if (store.user_id === user.id) {
        isOwner = true;
      }
    }
  } catch {}

  // 📦 cargar productos
  try {
    const res = await fetch(`/api/stores/${storeId}/products`);
    allProducts = await res.json();

    if (!Array.isArray(allProducts)) {
      allProducts = [];
    }

    renderProducts(allProducts);

  } catch (err) {
    console.error("Error cargando productos:", err);
  }
}

function renderProducts(products) {

  const container = document.getElementById("storeProducts");
  container.innerHTML = "";

  products.forEach(p => {

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div style="position:relative">

        ${
          isOwner
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

    // 👉 ir al producto
    card.onclick = () => {
      window.location.href = `/product/${p.id}`;
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

        allProducts = allProducts.filter(prod => prod.id !== p.id);
        renderProducts(allProducts);

      } catch {
        alert("Error eliminando");
      }
    });

    container.appendChild(card);
  });
}

// 🔍 buscador
document.getElementById("searchProducts")?.addEventListener("input", (e) => {

  const value = e.target.value.toLowerCase();

  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(value)
  );

  renderProducts(filtered);
});
