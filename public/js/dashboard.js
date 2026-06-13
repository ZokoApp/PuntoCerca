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
  loadPizarra();
  loadStoreVideos();
  loadHighlightStats();
  loadSucursales();
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

    // QR del catálogo
    const qrUrl = `${window.location.origin}/catalogo/${myStore.slug}`;
    const qrImg = document.getElementById('catalogQR');
    if (qrImg) {
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;
      qrImg.style.display = 'block';
      document.getElementById('catalogQRUrl').textContent = qrUrl;
    }

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

            <div style="margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9;">
              ${d.observaciones ? `
                <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:10px 12px;margin-bottom:8px;">
                  <div style="font-size:10px;font-weight:800;color:#ea580c;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.06em;">Observaciones</div>
                  <p style="font-size:13px;color:#374151;line-height:1.5;">${d.observaciones}</p>
                </div>
              ` : ''}
              <button onclick="editarObservaciones('${d.id}', \`${d.observaciones || ''}\`)"
                style="background:#f8fafc;border:1px solid #e5e7eb;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;color:#374151;">
                ${d.observaciones ? 'Editar observaciones' : '+ Agregar observaciones'}
              </button>
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

window.descargarQR = function() {
  const img = document.getElementById('catalogQR');
  if (!img || !img.src) return;
  const a = document.createElement('a');
  a.href = img.src;
  a.download = 'qr-catalogo-puntocerca.png';
  a.click();
};

let currentDeliveryId = null;

window.editarObservaciones = function(deliveryId, observacionesActuales) {
  currentDeliveryId = deliveryId;
  document.getElementById('obsModalTexto').value = observacionesActuales || '';
  const modal = document.getElementById('obsModal');
  modal.style.display = 'flex';
};

window.cerrarObsModal = function() {
  document.getElementById('obsModal').style.display = 'none';
  currentDeliveryId = null;
};

window.guardarObservaciones = function() {
  const texto = document.getElementById('obsModalTexto').value.trim();

  fetch(`/api/deliveries/${currentDeliveryId}/observaciones`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ observaciones: texto })
  })
  .then(res => {
    if (!res.ok) throw new Error();
    showToast('Observaciones actualizadas', 'success');
    cerrarObsModal();
    loadDeliveries();
  })
  .catch(() => showToast('Error actualizando observaciones', 'error'));
};

// cerrar clickando afuera
document.getElementById('obsModal')?.addEventListener('click', (e) => {
  if (e.target === document.getElementById('obsModal')) cerrarObsModal();
});
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
          dest_address: selectedDestAddress,
          observaciones: document.getElementById('deliveryObservaciones')?.value.trim() || null
        })
      });
      if (!res.ok) throw new Error();
      showToast("Envío creado correctamente", "success");
      deliveryModal.style.display = "none";
      const obsField = document.getElementById('deliveryObservaciones');
      if (obsField) obsField.value = '';
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

/* ================================
   PIZARRA
================================ */

/* ================================
   PIZARRA
================================ */

function getTimeRemaining(expiresAt) {
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return 'Expirada';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return hours > 0 ? `Expira en ${hours}h ${minutes}m` : `Expira en ${minutes}m`;
}

async function loadPizarra() {
  if (!myStore) return;
  const container = document.getElementById('pizarraContent');
  if (!container) return;

  try {
    const res = await fetch(`/api/pizarra/${myStore.id}`);

    if (res.status === 404) {
      renderPizarraUpload(container);
      return;
    }

    if (!res.ok) return;

    const pizarras = await res.json();
    renderPizarraActive(container, pizarras);

  } catch (err) {
    console.error('Error cargando pizarra', err);
    renderPizarraUpload(container);
  }
}

function renderPizarraActive(container, pizarras) {
  const items = pizarras.map(p => `
    <div style="
      display:flex;gap:12px;align-items:center;
      padding:10px 12px;background:#f8fafc;
      border-radius:12px;border:1px solid #e5e7eb;margin-bottom:8px;
    ">
      <img src="${p.image_url}"
        style="width:72px;height:72px;object-fit:cover;border-radius:10px;flex-shrink:0;">
      <div style="flex:1;min-width:0;">
        ${p.caption ? `<p style="font-size:13px;color:#374151;margin-bottom:6px;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">"${p.caption}"</p>` : ''}
        <span style="font-size:11px;color:#16a34a;font-weight:700;">
          ● ${getTimeRemaining(p.expires_at)}
        </span>
      </div>
      <button onclick="deleteSinglePizarra(${p.id})" style="
        background:none;border:none;color:#dc2626;
        cursor:pointer;font-size:20px;padding:4px;flex-shrink:0;
      ">✕</button>
    </div>
  `).join('');

  container.innerHTML = `
    <div style="
      display:inline-flex;align-items:center;gap:6px;
      background:#f0fdf4;border:1px solid #bbf7d0;
      border-radius:999px;padding:6px 14px;
      font-size:12px;font-weight:700;color:#16a34a;margin-bottom:16px;
    ">
      <span style="width:7px;height:7px;border-radius:50%;
        background:#16a34a;display:inline-block;"></span>
      ${pizarras.length} estado${pizarras.length > 1 ? 's' : ''} activo${pizarras.length > 1 ? 's' : ''} hoy
    </div>

    ${items}

    <div style="margin-top:14px;border-top:1px solid #f1f5f9;padding-top:14px;">
      <input id="pizarraCaption" type="text"
        placeholder="Texto opcional para el próximo estado..."
        style="width:100%;padding:10px 14px;border:1px solid #e5e7eb;
          border-radius:10px;font-size:14px;margin-bottom:10px;box-sizing:border-box;">
      <label for="pizarraFileInput" style="
        display:block;
        background:linear-gradient(135deg,#ea580c,#f97316);
        color:white;padding:12px;border-radius:12px;
        font-size:14px;font-weight:800;cursor:pointer;text-align:center;
      ">📷 Agregar estado</label>
      <input type="file" id="pizarraFileInput" accept="image/*"
        style="display:none;" onchange="uploadPizarra(this)">
    </div>
  `;
}

function renderPizarraUpload(container) {
  container.innerHTML = `
    <div style="border:2px dashed #e5e7eb;border-radius:16px;padding:32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">🖊️</div>
      <p style="font-size:15px;font-weight:700;color:#111827;margin-bottom:6px;">
        Todavía no publicaste ningún estado hoy
      </p>
      <p style="font-size:13px;color:#9ca3af;margin-bottom:20px;">
        Subí fotos del menú, precios o novedades. Desaparecen solas a medianoche.
      </p>
      <div style="max-width:320px;margin:0 auto;">
        <input id="pizarraCaption" type="text"
          placeholder="Texto opcional (ej: Menú del día $2500)"
          style="width:100%;padding:10px 14px;border:1px solid #e5e7eb;
            border-radius:10px;font-size:14px;margin-bottom:12px;box-sizing:border-box;">
        <label for="pizarraFileInput" style="
          display:block;
          background:linear-gradient(135deg,#ea580c,#f97316);
          color:white;padding:13px;border-radius:12px;
          font-size:14px;font-weight:800;cursor:pointer;
        ">📷 Subir primer estado del día</label>
        <input type="file" id="pizarraFileInput" accept="image/*"
          style="display:none;" onchange="uploadPizarra(this)">
      </div>
    </div>
  `;
}

window.triggerPizarraUpload = function() {
  document.getElementById('pizarraFileInput')?.click();
};

window.uploadPizarra = async function(input) {
  const file = input.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);
  const caption = document.getElementById('pizarraCaption')?.value;
  if (caption) formData.append('caption', caption);

  const container = document.getElementById('pizarraContent');
  container.innerHTML = `
    <div style="text-align:center;padding:32px;color:#9ca3af;">
      <div style="font-size:32px;margin-bottom:8px;">⏳</div>
      Subiendo estado...
    </div>
  `;

  try {
    const res = await fetch('/api/pizarra', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || 'Error subiendo estado', 'error');
      loadPizarra();
      return;
    }

    showToast('¡Estado publicado!', 'success');
    loadPizarra();

  } catch (err) {
    console.error(err);
    showToast('Error de conexión', 'error');
    loadPizarra();
  }
};

window.deleteSinglePizarra = async function(id) {
  if (!confirm('¿Eliminar este estado?')) return;

  try {
    const res = await fetch(`/api/pizarra/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!res.ok) { showToast('Error eliminando', 'error'); return; }

    showToast('Estado eliminado', 'success');
    loadPizarra();

  } catch (err) {
    showToast('Error de conexión', 'error');
  }
};

window.deletePizarra = async function() {
  if (!confirm('¿Eliminar la pizarra de hoy?')) return;

  try {
    const res = await fetch('/api/pizarra', {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!res.ok) { showToast('Error eliminando', 'error'); return; }

    showToast('Pizarra eliminada', 'success');
    loadPizarra();

  } catch (err) {
    console.error(err);
    showToast('Error de conexión', 'error');
  }
};
/* ================================
   VIDEOS
================================ */

async function loadStoreVideos() {
  if (!myStore) return;
  const container = document.getElementById('storeVideosList');
  if (!container) return;

  try {
    const res = await fetch(`/api/store-videos/${myStore.id}`);
    if (!res.ok) return;

    const videos = await res.json();

    if (!videos.length) {
      container.innerHTML = `
        <p style="color:#9ca3af;font-size:14px;text-align:center;padding:12px 0;">
          Todavía no agregaste videos.
        </p>`;
      return;
    }

    container.innerHTML = videos.map(v => `
      <div style="
        display:flex;align-items:center;gap:12px;
        padding:12px 14px;background:#f8fafc;
        border-radius:12px;margin-bottom:8px;
        border:1px solid #e5e7eb;
      ">
        <span style="font-size:20px;">${v.platform === 'youtube' ? '▶️' : '📸'}</span>
        <a href="${v.url}" target="_blank" style="
          flex:1;font-size:13px;color:#374151;
          text-decoration:none;overflow:hidden;
          text-overflow:ellipsis;white-space:nowrap;
        ">${v.url}</a>
        <button onclick="deleteStoreVideo(${v.id})" style="
          background:none;border:none;color:#dc2626;
          cursor:pointer;font-size:18px;padding:4px;
          flex-shrink:0;
        ">✕</button>
      </div>
    `).join('');

  } catch (err) {
    console.error('Error cargando videos', err);
  }
}

window.addStoreVideo = async function() {
  const input = document.getElementById('newVideoUrl');
  const url = input?.value.trim();
  if (!url) return;

  try {
    const res = await fetch('/api/store-videos', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || 'Error agregando video', 'error');
      return;
    }

    input.value = '';
    showToast('Video agregado', 'success');
    loadStoreVideos();

  } catch (err) {
    showToast('Error de conexión', 'error');
  }
};

window.deleteStoreVideo = async function(id) {
  if (!confirm('¿Eliminar este video?')) return;

  try {
    const res = await fetch(`/api/store-videos/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!res.ok) { showToast('Error eliminando', 'error'); return; }

    showToast('Video eliminado', 'success');
    loadStoreVideos();

  } catch (err) {
    showToast('Error de conexión', 'error');
  }
};
async function loadHighlightStats() {
  const container = document.getElementById('highlightStatsContainer');
  if (!container) return;

  try {
    const res = await fetch('/api/my-highlights/stats', { credentials: 'include' });
    if (!res.ok) return;

    const stats = await res.json();

// actualizar link siempre, independiente de si hay stats
const profileLink = document.getElementById('hlStatsProfileLink');
if (profileLink && myStore?.slug) {
  profileLink.href = `/${myStore.slug}`;
}

if (!stats.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:28px;color:#9ca3af;">
          <div style="font-size:36px;margin-bottom:10px;">📷</div>
          <p style="font-size:14px;">Todavía no creaste ningún destacado.</p>
          <a href="/${myStore?.slug}" style="display:inline-block;margin-top:12px;
            background:linear-gradient(135deg,#ea580c,#f97316);color:white;
            padding:10px 20px;border-radius:10px;font-size:13px;font-weight:700;
            text-decoration:none;">Ir a mi perfil a crear uno →</a>
        </div>
      `;
      return;
    }

    const totalViews     = stats.reduce((s,h) => s + h.total_views, 0);
    const totalReactions = stats.reduce((s,h) => s + h.total_reactions, 0);
    const totalComments  = stats.reduce((s,h) => s + h.total_comments, 0);
    const totalPhotos    = stats.reduce((s,h) => s + h.item_count, 0);

    container.innerHTML = `
      <!-- TOTALES -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;">
       ${[
  ['<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#6b7280"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>', totalViews, 'Vistas totales'],
  ['<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ea580c"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>', totalReactions, 'Reacciones'],
  ['<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#6b7280"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>', totalComments, 'Comentarios'],
  ['<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#6b7280"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>', totalPhotos, 'Fotos']
].map(([icon, val, label]) => `
  <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;padding:14px;text-align:center;">
    <div style="display:flex;justify-content:center;margin-bottom:4px;">${icon}</div>
    <div style="font-size:20px;font-weight:900;color:#111827;letter-spacing:-0.03em;">${val.toLocaleString('es-AR')}</div>
    <div style="font-size:11px;color:#9ca3af;font-weight:600;margin-top:2px;">${label}</div>
  </div>
`).join('')}
        
      </div>

      <!-- POR DESTACADO -->
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${stats.map(h => `
          <div style="display:flex;align-items:center;gap:14px;padding:14px 16px;
            background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;">
            <div style="width:48px;height:48px;border-radius:12px;flex-shrink:0;
              background:${h.cover_url ? `url('${h.cover_url}') center/cover no-repeat` : 'linear-gradient(135deg,#ea580c,#f97316)'};
              border:1px solid #e5e7eb;">
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:14px;font-weight:700;color:#111827;
                overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${h.title}</div>
              <div style="font-size:12px;color:#9ca3af;margin-top:2px;">${h.item_count} foto${h.item_count !== 1 ? 's' : ''}</div>
            </div>
            <div style="display:flex;gap:16px;flex-shrink:0;">
              <div style="text-align:center;">
                <div style="font-size:15px;font-weight:800;color:#111827;">${h.total_views.toLocaleString('es-AR')}</div>
                <div style="font-size:10px;color:#9ca3af;">vistas</div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:15px;font-weight:800;color:#ea580c;">${h.total_reactions}</div>
                <div style="font-size:10px;color:#9ca3af;">reacciones</div>
              </div>
              <div style="text-align:center;">
                <div style="font-size:15px;font-weight:800;color:#374151;">${h.total_comments}</div>
                <div style="font-size:10px;color:#9ca3af;">comentarios</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

  
  } catch(err) {
    console.error('Error stats highlights:', err);
    if (container) container.innerHTML = '<p style="color:#9ca3af;font-size:14px;">Error cargando estadísticas</p>';
  }
}

/* ================================
   SUCURSALES
================================ */

let sucursalMap = null;
let sucursalMarker = null;
let sucursalAutocomplete = null;

async function loadSucursales() {
  if (!myStore) return;
  const container = document.getElementById('sucursalesList');
  if (!container) return;

  try {
    const res = await fetch(`/api/stores/${myStore.id}/sucursales`);
    if (!res.ok) return;
    const sucursales = await res.json();

    if (!sucursales.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:28px;color:#9ca3af;">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="#d1d5db" style="display:block;margin:0 auto 12px;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72L4.318 3.44A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 2.189a3 3 0 0 1-.621 4.72m-13.5 8.65h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .415.336.75.75.75Z"/>
          </svg>
          <p style="font-size:14px;margin-bottom:4px;">Todavía no cargaste ninguna sucursal</p>
          <p style="font-size:12px;">Tu perfil principal ya aparece como ubicación principal</p>
        </div>`;
      return;
    }

    container.innerHTML = sucursales.map(s => `
      <div style="display:flex;align-items:center;gap:14px;padding:14px 16px;
        background:#f8fafc;border:1px solid #e5e7eb;border-radius:14px;margin-bottom:10px;">
        <div style="width:42px;height:42px;border-radius:12px;
          background:linear-gradient(135deg,#ea580c,#f97316);
          display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="white">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z"/>
          </svg>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:14px;font-weight:700;color:#111827;">${s.name}</div>
          ${s.street ? `<div style="font-size:12px;color:#6b7280;margin-top:2px;">
            ${s.street}${s.local ? ` · Local ${s.local}` : ''}${s.city ? ` · ${s.city}` : ''}
          </div>` : ''}
          ${s.phone ? `<div style="font-size:12px;color:#ea580c;font-weight:600;margin-top:2px;">${s.phone}</div>` : ''}
          ${s.lat && s.lng ? `<div style="font-size:11px;color:#9ca3af;margin-top:2px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="#16a34a" style="display:inline;vertical-align:middle;">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
            </svg>
            Ubicación en mapa confirmada
          </div>` : `<div style="font-size:11px;color:#f59e0b;margin-top:2px;">Sin ubicación en mapa</div>`}
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0;">
          <button onclick="openSucursalModal(${JSON.stringify(s).replace(/"/g, '&quot;')})"
            style="background:white;border:1px solid #e5e7eb;padding:7px 12px;
              border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;color:#374151;">
            Editar
          </button>
          <button onclick="deleteSucursal(${s.id})"
            style="background:none;border:none;color:#dc2626;cursor:pointer;padding:7px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    `).join('');

  } catch(err) {
    console.error('Error sucursales:', err);
  }
}

window.openSucursalModal = async function(sucursal = null) {
  const modal = document.getElementById('sucursalModal');
  modal.style.display = 'flex';

  // limpiar campos
  document.getElementById('sucursalId').value            = sucursal?.id     || '';
  document.getElementById('sucursalName').value          = sucursal?.name   || '';
  document.getElementById('sucursalAddressInput').value  = sucursal?.street || '';
  document.getElementById('sucursalLocal').value         = sucursal?.local  || '';
  document.getElementById('sucursalCity').value          = sucursal?.city   || '';
  document.getElementById('sucursalPhone').value         = sucursal?.phone  || '';
  document.getElementById('sucursalLat').value           = sucursal?.lat    || '';
  document.getElementById('sucursalLng').value           = sucursal?.lng    || '';
  document.getElementById('sucursalModalTitle').textContent = sucursal ? 'Editar sucursal' : 'Nueva sucursal';

  // mostrar dirección confirmada si ya tiene
  const confirm = document.getElementById('sucursalAddressConfirm');
  const confirmText = document.getElementById('sucursalAddressText');
  if (sucursal?.street && sucursal?.lat) {
    confirm.style.display = 'block';
    confirmText.textContent = sucursal.street;
  } else {
    confirm.style.display = 'none';
  }

  // inicializar mapa
  await initSucursalMap(
    sucursal?.lat ? parseFloat(sucursal.lat) : -32.9442,
    sucursal?.lng ? parseFloat(sucursal.lng) : -60.6505,
    sucursal?.street || null
  );
};

async function initSucursalMap(lat, lng, address) {
  // cargar Google Maps si no está
  if (!window.google?.maps) {
    const keyRes = await fetch('/api/google-maps-key');
    const keyData = await keyRes.json();

    if (!document.getElementById('gmapsSucursal')) {
      await new Promise((resolve) => {
        const script = document.createElement('script');
        script.id = 'gmapsSucursal';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${keyData.key}&libraries=places`;
        script.async = true;
        script.onload = resolve;
        document.body.appendChild(script);
      });
    }
  }

  // inicializar Leaflet
  setTimeout(() => {
    if (sucursalMap) {
      sucursalMap.setView([lat, lng], lat === -32.9442 ? 13 : 16);
      if (sucursalMarker) {
        sucursalMarker.setLatLng([lat, lng]);
      }
      sucursalMap.invalidateSize();
    } else {
      sucursalMap = L.map('sucursalMap', { zoomControl: true, attributionControl: false })
        .setView([lat, lng], lat === -32.9442 ? 13 : 16);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd', maxZoom: 19
      }).addTo(sucursalMap);

      sucursalMarker = L.marker([lat, lng], { draggable: true }).addTo(sucursalMap);

      sucursalMarker.on('dragend', async () => {
        const pos = sucursalMarker.getLatLng();
        document.getElementById('sucursalLat').value = pos.lat;
        document.getElementById('sucursalLng').value = pos.lng;
        await reverseSucursal(pos.lat, pos.lng);
      });

      sucursalMap.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        sucursalMarker.setLatLng([lat, lng]);
        document.getElementById('sucursalLat').value = lat;
        document.getElementById('sucursalLng').value = lng;
        await reverseSucursal(lat, lng);
      });
    }

    // autocomplete
    const input = document.getElementById('sucursalAddressInput');
    if (window.google?.maps && !sucursalAutocomplete) {
      sucursalAutocomplete = new google.maps.places.Autocomplete(input, {
        types: ['address'],
        componentRestrictions: { country: 'ar' }
      });

      sucursalAutocomplete.addListener('place_changed', () => {
        const place = sucursalAutocomplete.getPlace();
        if (!place.geometry) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const fullAddress = place.formatted_address || place.name;

        document.getElementById('sucursalLat').value = lat;
        document.getElementById('sucursalLng').value = lng;
        document.getElementById('sucursalAddressInput').value = fullAddress;

        // extraer ciudad
        const cityComp = place.address_components?.find(c =>
          c.types.includes('locality') || c.types.includes('administrative_area_level_2')
        );
        if (cityComp && !document.getElementById('sucursalCity').value) {
          document.getElementById('sucursalCity').value = cityComp.long_name;
        }

        sucursalMap.setView([lat, lng], 16);
        sucursalMarker.setLatLng([lat, lng]);

        const confirm = document.getElementById('sucursalAddressConfirm');
        document.getElementById('sucursalAddressText').textContent = fullAddress;
        confirm.style.display = 'block';
      });
    }

    if (address) {
      setTimeout(() => sucursalMap.invalidateSize(), 200);
    }
  }, 100);
}

async function reverseSucursal(lat, lng) {
  try {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const address = results[0].formatted_address;
        document.getElementById('sucursalAddressInput').value = address;
        document.getElementById('sucursalAddressText').textContent = address;
        document.getElementById('sucursalAddressConfirm').style.display = 'block';
      }
    });
  } catch(e) {}
}

window.closeSucursalModal = function() {
  document.getElementById('sucursalModal').style.display = 'none';
  sucursalAutocomplete = null;
  if (sucursalMap) {
    sucursalMap.remove();
    sucursalMap = null;
    sucursalMarker = null;
  }
};

window.saveSucursal = async function() {
  const btn  = document.getElementById('saveSucursalBtn');
  const id   = document.getElementById('sucursalId').value;
  const name = document.getElementById('sucursalName').value.trim();
  const lat  = document.getElementById('sucursalLat').value;
  const lng  = document.getElementById('sucursalLng').value;

  if (!name) { showToast('El nombre es obligatorio', 'error'); return; }

  const body = {
    store_id: myStore.id,
    name,
    street: document.getElementById('sucursalAddressInput').value.trim() || null,
    local:  document.getElementById('sucursalLocal').value.trim()        || null,
    city:   document.getElementById('sucursalCity').value.trim()         || null,
    phone:  document.getElementById('sucursalPhone').value.trim()        || null,
    lat:    lat  || null,
    lng:    lng  || null,
  };

  btn.textContent = 'Guardando...';
  btn.disabled = true;

  try {
    const res = await fetch(id ? `/api/sucursales/${id}` : '/api/sucursales', {
      method: id ? 'PUT' : 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) { showToast('Error guardando', 'error'); return; }

    showToast(id ? 'Sucursal actualizada' : 'Sucursal creada', 'success');
    closeSucursalModal();
    loadSucursales();

  } catch(e) {
    showToast('Error de conexión', 'error');
  } finally {
    btn.textContent = 'Guardar sucursal';
    btn.disabled = false;
  }
};

window.deleteSucursal = async function(id) {
  if (!confirm('¿Eliminar esta sucursal?')) return;
  try {
    await fetch(`/api/sucursales/${id}`, { method:'DELETE', credentials:'include' });
    showToast('Sucursal eliminada', 'success');
    loadSucursales();
  } catch(e) {
    showToast('Error eliminando', 'error');
  }
};
