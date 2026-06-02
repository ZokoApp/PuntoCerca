let currentUser = null;
let myStore = null;
import { showToast } from "/js/utils/toast.js";

document.addEventListener("DOMContentLoaded", async () => {
  await loadUser();
  await loadStore();
  await loadProducts();
  await loadFollowers();
  loadFollowingStores();
  loadDeliveries();
});

/* ================================
   USER
================================ */

async function loadUser(){
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if(!res.ok){ window.location.href = "/login"; return; }
    currentUser = await res.json();
    document.getElementById("dashboardUserName").innerText = currentUser.name;
  } catch (err){
    window.location.href = "/login";
  }
}

function renderPrice(price) {
  if (price === null || price === undefined || price === "") return "Consultar";
  const num = Number(price);
  if (isNaN(num)) return "Consultar";
  return "$" + num.toLocaleString("es-AR");
}

/* ================================
   STORE
================================ */

async function loadStore(){
  try {
    const res = await fetch("/api/my-store", { credentials: "include" });
    if(res.status === 404){ window.location.href = "/edit-store"; return; }
    if(!res.ok){ throw new Error("Error cargando tienda"); }
    myStore = await res.json();
    document.getElementById("metricStoreName").innerText = myStore.name || "-";
    document.getElementById("metricViews").innerText = myStore.views || 0;
    const editLink = document.getElementById("editStoreLink");
    const quickEdit = document.getElementById("quickEditStore");
    const viewStore = document.getElementById("quickViewStore");
    if(editLink) editLink.href = `/edit-store?id=${myStore.id}`;
    if(quickEdit) quickEdit.href = `/edit-store?id=${myStore.id}`;
    if(viewStore) viewStore.href = `/store/${myStore.id}`;
  } catch (err){ console.error(err); }
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
          <div class="dashboard-product-price">${renderPrice(product.price)}</div>
          <div class="dashboard-product-meta">${product.views || 0} vistas</div>
          ${product.is_offer ? `<div style="color:red;font-size:12px;">En oferta</div>` : ""}
        </div>
      `;
      card.querySelector(".btn-edit").addEventListener("click", (e) => {
        e.stopPropagation();
        window.location.href = `/edit-product/${product.id}`;
      });
      card.querySelector(".btn-delete").addEventListener("click", async (e) => {
        e.stopPropagation();
        const confirmDelete = confirm("¿Eliminar este producto?");
        if (!confirmDelete) return;
        try {
          const res = await fetch(`/api/products/${product.id}`, { method: "DELETE", credentials: "include" });
          if (!res.ok) throw new Error();
          showToast("Producto eliminado", "success");
          loadProducts();
        } catch (err) {
          console.error(err);
          showToast("Error eliminando producto", "error");
        }
      });
      card.addEventListener("click", () => { window.location.href = `/product/${product.id}`; });
      container.appendChild(card);
    });
  } catch (err){ console.error("Error cargando productos", err); }
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
  } catch (err){ console.error("Error cargando seguidores", err); }
}

async function loadFollowingStores(){
  try {
    const res = await fetch("/api/following", { credentials: "include" });
    if(!res.ok) return;
    const stores = await res.json();
    const container = document.getElementById("followingStores");
    if(!container) return;
    if(!stores.length){ container.innerHTML = "<p>No seguís ninguna tienda todavía.</p>"; return; }
    container.innerHTML = stores.map(store => `
      <div class="follow-card">
        <img src="${store.logo_url || '/img/default.png'}">
        <div><strong>${store.name}</strong><br><span>${store.category || ''}</span></div>
        <a href="/store/${store.id}">Ver</a>
      </div>
    `).join("");
  } catch(err){ console.error("Error cargando seguidos", err); }
}

/* ================================
   PDF CATALOG MODAL
================================ */

const catalogModal = document.getElementById("catalogModal");
const openCatalogModal = document.getElementById("openCatalogModal");
const closeCatalogModal = document.getElementById("closeCatalogModal");

if(openCatalogModal && catalogModal){
  openCatalogModal.addEventListener("click", () => { catalogModal.classList.remove("hidden"); });
}
if(closeCatalogModal && catalogModal){
  closeCatalogModal.addEventListener("click", () => { catalogModal.classList.add("hidden"); });
}
if(catalogModal){
  catalogModal.addEventListener("click", (e) => { if(e.target === catalogModal) catalogModal.classList.add("hidden"); });
}

const catalogForm = document.getElementById("catalogForm");
if(catalogForm){
  catalogForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById("catalogPdf");
    const file = fileInput.files[0];
    if(!file){ alert("Seleccioná un PDF"); return; }
    const submitBtn = catalogForm.querySelector(".catalog-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Subiendo PDF...";
    try {
      const formData = new FormData();
      formData.append("catalog", file);
      const res = await fetch("/api/store-catalog", { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || "Error subiendo PDF");
      showToast("Catálogo subido correctamente", "success");
      catalogModal.classList.add("hidden");
      catalogForm.reset();
    } catch(err){
      console.error(err);
      showToast(err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Guardar catálogo";
    }
  });
}

/* ================================
   DELIVERIES
================================ */

let deliveryMap = null;
let deliveryMarker = null;
let selectedDestLat = null;
let selectedDestLng = null;
let selectedDestAddress = null;

async function loadDeliveries() {
  const container = document.getElementById("deliveriesList");
  if (!container) return;

  try {
    const res = await fetch("/api/deliveries", { credentials: "include" });
    if (!res.ok) return;

    const deliveries = await res.json();

    if (!deliveries.length) {
      container.innerHTML = `
        <div class="delivery-empty">
          <svg xmlns="http://www.w3.org/2000/svg" style="width:40px;height:40px;display:block;" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#9ca3af">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <p>No hay envíos activos</p>
          <span>Creá un nuevo envío para generar los links de seguimiento</span>
        </div>
      `;
      return;
    }

    container.innerHTML = deliveries.map(d => {
      const linkRepartidor = `${window.location.origin}/delivery/repartidor/${d.token_repartidor}`;
      const linkCliente = `${window.location.origin}/delivery/cliente/${d.token_cliente}`;
      const statusMap = {
        pending:   { label: 'Pendiente',  cls: 'pending',   dot: '#ea580c' },
        active:    { label: 'En camino',  cls: 'active',    dot: '#16a34a' },
        delivered: { label: 'Entregado',  cls: 'delivered', dot: '#64748b' }
      };
      const st = statusMap[d.status] || statusMap.pending;
      const created = new Date(d.created_at).toLocaleString("es-AR", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
      });

      return `
        <div class="delivery-item">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
            <div>
              <span class="delivery-status ${st.cls}">
                <span style="width:6px;height:6px;border-radius:50%;background:${st.dot};display:inline-block;"></span>
                ${st.label}
              </span>
              <span style="font-size:12px;color:#9ca3af;margin-left:10px;">${created}</span>
            </div>
            ${d.dest_address ? `
              <div style="display:flex;align-items:center;gap:5px;font-size:12px;color:#6b7280;">
                <svg xmlns="http://www.w3.org/2000/svg" style="width:13px;height:13px;color:#ea580c;flex-shrink:0;" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.dest_address}</span>
              </div>
            ` : ''}
          </div>

          <div style="display:grid;gap:8px;">
            <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;">
              <div style="font-size:10px;font-weight:800;color:#9ca3af;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.06em;">
                Link del repartidor
              </div>
              <div class="delivery-link-row">
                <span class="delivery-link-text">${linkRepartidor}</span>
                <button class="delivery-btn-copy" onclick="copyLink('${linkRepartidor}', this)">Copiar</button>
                <button class="delivery-btn-wa" onclick="shareWhatsApp('${linkRepartidor}', 'repartidor')">WhatsApp</button>
              </div>
            </div>

            <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;">
              <div style="font-size:10px;font-weight:800;color:#9ca3af;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.06em;">
                Link del cliente
              </div>
              <div class="delivery-link-row">
                <span class="delivery-link-text">${linkCliente}</span>
                <button class="delivery-btn-copy" onclick="copyLink('${linkCliente}', this)">Copiar</button>
                <button class="delivery-btn-wa" onclick="shareWhatsApp('${linkCliente}', 'cliente')">WhatsApp</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error("Error cargando envíos", err);
  }
}

window.copyLink = function(url, btn) {
  navigator.clipboard.writeText(url).then(() => {
    const original = btn.textContent;
    btn.textContent = "¡Copiado!";
    btn.style.background = "#ecfdf5";
    btn.style.color = "#16a34a";
    setTimeout(() => {
      btn.textContent = original;
      btn.style.background = "";
      btn.style.color = "";
    }, 2000);
  });
};

window.shareWhatsApp = function(url, tipo) {
  const msg = tipo === 'repartidor'
    ? `Hola! Acá está tu link para iniciar el recorrido: ${url}`
    : `Hola! Podés seguir tu pedido en tiempo real acá: ${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
};

/* ================================
   MODAL NUEVO ENVÍO
================================ */

const btnNewDelivery = document.getElementById("btnNewDelivery");
const deliveryModal = document.getElementById("deliveryModal");
const closeDeliveryModal = document.getElementById("closeDeliveryModal");
const btnConfirmDelivery = document.getElementById("btnConfirmDelivery");
const deliveryAddress = document.getElementById("deliveryAddress");

if (btnNewDelivery) {
  btnNewDelivery.addEventListener("click", async () => {
    deliveryModal.style.display = "flex";
    selectedDestLat = null;
    selectedDestLng = null;
    selectedDestAddress = null;
    deliveryAddress.value = "";
    document.getElementById("selectedAddressBox").style.display = "none";
    btnConfirmDelivery.disabled = true;
    btnConfirmDelivery.style.opacity = "0.5";
    await initDeliveryMap();
  });
}

if (closeDeliveryModal) {
  closeDeliveryModal.addEventListener("click", () => { deliveryModal.style.display = "none"; });
}

deliveryModal?.addEventListener("click", (e) => {
  if (e.target === deliveryModal) deliveryModal.style.display = "none";
});

async function initDeliveryMap() {
  if (deliveryMap) {
    setTimeout(() => deliveryMap.invalidateSize(), 100);
    return;
  }

  const keyRes = await fetch("/api/google-maps-key");
  const keyData = await keyRes.json();

  if (!document.getElementById("gmapsDelivery")) {
    await new Promise((resolve) => {
      const script = document.createElement("script");
      script.id = "gmapsDelivery";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${keyData.key}&libraries=places`;
      script.async = true;
      script.onload = resolve;
      document.body.appendChild(script);
    });
  }

  if (!deliveryMap) {
    deliveryMap = L.map('deliveryMap', { zoomControl: true, attributionControl: false })
      .setView([-32.9442, -60.6505], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19
    }).addTo(deliveryMap);

    deliveryMap.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      setDeliveryDestination(lat, lng, null);
      await reverseGeocode(lat, lng);
    });
  }

  setTimeout(() => deliveryMap.invalidateSize(), 200);

  const autocomplete = new google.maps.places.Autocomplete(deliveryAddress, {
    types: ["address"],
    componentRestrictions: { country: "ar" }
  });

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const address = place.formatted_address || place.name;
    setDeliveryDestination(lat, lng, address);
    deliveryMap.setView([lat, lng], 16);
  });
}

function setDeliveryDestination(lat, lng, address) {
  selectedDestLat = lat;
  selectedDestLng = lng;
  selectedDestAddress = address;

  if (deliveryMarker) deliveryMap.removeLayer(deliveryMarker);

  deliveryMarker = L.marker([lat, lng], {
    icon: L.divIcon({
      html: `
        <div style="
          width:36px;height:36px;
          background:linear-gradient(135deg,#ea580c,#f97316);
          border-radius:50%;
          border:3px solid white;
          box-shadow:0 4px 12px rgba(234,88,12,0.4);
          display:flex;align-items:center;justify-content:center;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" style="width:18px;height:18px;" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="white">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      className: 'leaflet-div-icon-clean'
    })
  }).addTo(deliveryMap);

  if (address) {
    document.getElementById("selectedAddressBox").style.display = "block";
    document.getElementById("selectedAddressText").textContent = address;
    deliveryAddress.value = address;
  }

  btnConfirmDelivery.disabled = false;
  btnConfirmDelivery.style.opacity = "1";
}

async function reverseGeocode(lat, lng) {
  try {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        const address = results[0].formatted_address;
        selectedDestAddress = address;
        document.getElementById("selectedAddressBox").style.display = "block";
        document.getElementById("selectedAddressText").textContent = address;
        deliveryAddress.value = address;
      }
    });
  } catch (err) { console.error(err); }
}

if (btnConfirmDelivery) {
  btnConfirmDelivery.addEventListener("click", async () => {
    if (!selectedDestLat || !selectedDestLng) return;
    btnConfirmDelivery.disabled = true;
    btnConfirmDelivery.textContent = "Generando...";
    try {
      const res = await fetch("/api/deliveries", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dest_lat: selectedDestLat,
          dest_lng: selectedDestLng,
          dest_address: selectedDestAddress
        })
      });
      if (!res.ok) throw new Error();
      showToast("Envío creado correctamente", "success");
      deliveryModal.style.display = "none";
      await loadDeliveries();
    } catch (err) {
      showToast("Error creando envío", "error");
    } finally {
      btnConfirmDelivery.disabled = false;
      btnConfirmDelivery.textContent = "Generar links de envío";
      btnConfirmDelivery.style.opacity = "1";
    }
  });
}
