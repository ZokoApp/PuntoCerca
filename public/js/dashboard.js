let currentUser = null;
let myStore = null;
import { showToast } from "/js/utils/toast.js";

document.addEventListener("DOMContentLoaded", async () => {
  await loadUser();
  await loadStore();
  await loadProducts();
  await loadFollowers();

  loadFollowingStores();
});

/* ================================
   USER
================================ */

async function loadUser(){
  try {
    const res = await fetch("/api/me", {
      credentials: "include"
    });

    if(!res.ok){
      window.location.href = "/login";
      return;
    }

    currentUser = await res.json();
    document.getElementById("dashboardUserName").innerText = currentUser.name;

  } catch (err){
    window.location.href = "/login";
  }
}

/* ================================
   STORE
================================ */

async function loadStore(){
  try {
    const res = await fetch("/api/my-store", {
      credentials: "include"
    });

    if(res.status === 404){
  // 🚨 NO tiene tienda → lo mandamos a crearla
  window.location.href = "/edit-store";
  return;
}

if(!res.ok){
  throw new Error("Error cargando tienda");
}

    myStore = await res.json();

    document.getElementById("metricStoreName").innerText = myStore.name || "-";
    document.getElementById("metricViews").innerText = myStore.views || 0;

    const editLink = document.getElementById("editStoreLink");
    const quickEdit = document.getElementById("quickEditStore");
    const viewStore = document.getElementById("quickViewStore");

    if(editLink){
      editLink.href = `/edit-store?id=${myStore.id}`;
    }

    if(quickEdit){
      quickEdit.href = `/edit-store?id=${myStore.id}`;
    }

    if(viewStore){
      viewStore.href = `/store/${myStore.id}`;
    }

  } catch (err){
    console.error(err);
  }
}

/* ================================
   PRODUCTS
================================ */

async function loadProducts(){
  if(!myStore) return;

  try {
    const res = await fetch(`/api/stores/${myStore.id}/products`);
    const products = await res.json();

    document.getElementById("metricProducts").innerText = products.length;

    const container = document.getElementById("dashboardProducts");
    container.innerHTML = "";

    if(!products.length){
      container.innerHTML = `<p>No tenés productos cargados todavía.</p>`;
      return;
    }

    products.forEach(product => {
      const card = document.createElement("article");
      card.className = "dashboard-product-card";

      card.innerHTML = `
  <div class="dashboard-product-actions">
    <button class="btn-edit">Editar</button>
    <button class="btn-delete">Eliminar</button>
  </div>

  <img src="${product.image_url}" alt="${product.name}">

  <div class="dashboard-product-body">
    <div class="dashboard-product-brand">${product.brand || ""}</div>
    <div class="dashboard-product-name">${product.name}</div>
    <div class="dashboard-product-price">$${parseFloat(product.price).toLocaleString()}</div>
    <div class="dashboard-product-meta">${product.views || 0} vistas</div>

    ${
      product.is_offer 
        ? `<div style="color:red;font-size:12px;">🔥 En oferta</div>` 
        : ""
    }
  </div>
`;
// 👉 botón editar
card.querySelector(".btn-edit").addEventListener("click", (e) => {
  e.stopPropagation();
  window.location.href = `/edit-product/${product.id}`;
});

// 👉 eliminar producto
card.querySelector(".btn-delete").addEventListener("click", async (e) => {
  e.stopPropagation();

  const confirmDelete = confirm("¿Eliminar este producto?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(`/api/products/${product.id}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (!res.ok) throw new Error();

    showToast("Producto eliminado", "success");

    loadProducts();

  } catch (err) {
    console.error(err);
    showToast("Error eliminando producto", "error");
  }
});

    
      // 👉 click ver producto
      card.addEventListener("click", () => {
        window.location.href = `/product/${product.id}`;
      });

      container.appendChild(card);
    });

  } catch (err){
    console.error("Error cargando productos", err);
  }
}

/* ================================
   FOLLOWERS
================================ */

async function loadFollowers(){
  if(!myStore) return;

  try {
    const res = await fetch(`/api/store-followers/${myStore.id}`);
    const data = await res.json();

    document.getElementById("metricFollowers").innerText = data.count || 0;

  } catch (err){
    console.error("Error cargando seguidores", err);
  }
}

async function loadFollowingStores(){
  try {
    const res = await fetch("/api/following", { 
      credentials: "include"
    });

    if(!res.ok) return;

    const stores = await res.json();

    const container = document.getElementById("followingStores");

    if(!container) return;

    if(!stores.length){
      container.innerHTML = "<p>No seguís ninguna tienda todavía.</p>";
      return;
    }

    container.innerHTML = stores.map(store => `
      <div class="follow-card">
        <img src="${store.logo_url || '/img/default.png'}">
        <div>
          <strong>${store.name}</strong><br>
          <span>${store.category || ''}</span>
        </div>
        <a href="/store/${store.id}">Ver</a>
      </div>
    `).join("");

  } catch(err){
    console.error("Error cargando seguidos", err);
  }
}
