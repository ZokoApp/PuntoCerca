// store.js

let currentUser = null;
let isOwner = false;
let storeData = null;

/* ================================
   STATUS
================================ */

function isStoreOpen(store) {
  if (!store.is_open) return false;

  if (!store.opening_time || !store.closing_time) return store.is_open;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = store.opening_time.split(":").map(Number);
  const [closeH, closeM] = store.closing_time.split(":").map(Number);

  const openTime = openH * 60 + openM;
  const closeTime = closeH * 60 + closeM;

  return currentTime >= openTime && currentTime <= closeTime;
}

function updateStoreStatus(store) {
  const open = isStoreOpen(store);

  const statusHTML = `
    <div style="
      display:flex;
      align-items:center;
      justify-content:center;
      gap:8px;
      margin-top:6px;
      font-weight:bold;
      color:${open ? '#16a34a' : '#dc2626'};
    ">
      <span style="
        width:10px;
        height:10px;
        border-radius:50%;
        background:${open ? '#16a34a' : '#dc2626'};
        box-shadow:0 0 12px ${open ? 'rgba(22,163,74,.7)' : 'rgba(220,38,38,.7)'};
        display:inline-block;
      "></span>
      ${open ? 'Abierto' : 'Cerrado'}
    </div>
  `;

  document.getElementById("storeStatus").innerHTML = statusHTML;
}

/* ================================
   DETECTAR ID / SLUG
================================ */

const pathParts = window.location.pathname.split("/");

let storeId = null;
let storeSlug = null;

if (pathParts[1] === "store") {
  storeId = pathParts[2];
} else {
  storeSlug = pathParts[1];
}

/* ================================
   INIT
================================ */

document.addEventListener("DOMContentLoaded", async () => {
  await loadUser();
  await loadStore();
});

/* ================================
   USER
================================ */

async function loadUser(){
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if(res.ok){
      currentUser = await res.json();
    }
  } catch {}
}

/* ================================
   STORE
================================ */

async function loadStore(){

  try {

    let res;

    if (storeId) {
      res = await fetch(`/api/stores/${storeId}`);
    } else if (storeSlug) {
      res = await fetch(`/api/stores/slug/${storeSlug}`);
    } else {
      return;
    }

    const store = await res.json();

    storeData = store;

    if(currentUser && store.user_id === currentUser.id){
      isOwner = true;
    }

    renderStore(store);
    setupMap(store);
    handleUIByRole(store);

    if(currentUser && !isOwner){
      checkFollowing(store.id);
    }

  } catch (err){
    console.error("Error cargando tienda", err);
  }
}

/* ================================
   UI POR ROL
================================ */

function handleUIByRole(store){

  const whatsappBtn = document.getElementById("whatsappBtn");
  const mapBtn = document.getElementById("mapButton");
  const followBtn = document.getElementById("followBtn");

  if(isOwner){

    // NAV OWNER
    const ownerActions = document.getElementById("ownerActions");
    if(ownerActions) ownerActions.style.display = "flex";

    const logoutBtn = document.getElementById("logoutBtn");
    if(logoutBtn){
      logoutBtn.onclick = async () => {
        await fetch("/api/logout", { method:"POST", credentials:"include" });
        window.location.href = "/";
      };
    }

    // OCULTAR VISITANTE
    if(whatsappBtn) whatsappBtn.style.display = "none";
    if(mapBtn) mapBtn.style.display = "none";
    if(followBtn) followBtn.style.display = "none";

    // 👉 CONTROL ABIERTO/CERRADO
    const ownerControl = document.getElementById("ownerStatusControl");

    if(ownerControl){
      ownerControl.style.display = "block";

      const select = document.getElementById("storeStatusSelect");

      if(select){
        select.value = store.is_open ? "true" : "false";

        select.onchange = async () => {
          const newValue = select.value === "true";

          try {
            const res = await fetch(`/api/stores/${store.id}`, {
              method: "PUT",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ is_open: newValue })
            });

            if(res.ok){
              store.is_open = newValue;
              updateStoreStatus(store);
            } else {
              alert("Error actualizando estado");
            }

          } catch {
            alert("Error de conexión");
          }
        };
      }
    }

  } else {

    // VISITANTE

    if(whatsappBtn){
      whatsappBtn.style.display = "inline-block";

      if(currentUser){
        if(store.phone){
          whatsappBtn.href = `https://wa.me/${store.phone.replace(/\D/g,'')}`;
        }
      } else {
        whatsappBtn.onclick = (e) => {
          e.preventDefault();
          window.location.href = "/login";
        };
      }
    }

    if(mapBtn){
      mapBtn.onclick = () => {
        document.getElementById("storeMap").scrollIntoView({ behavior:'smooth' });
      };
    }

    if(followBtn && currentUser){
      followBtn.style.display = "inline-block";

      followBtn.onclick = async () => {
        const isFollowing = followBtn.innerText === "Siguiendo";

        await fetch(`/api/follow${isFollowing ? "/" + store.id : ""}`, {
          method: isFollowing ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: isFollowing ? null : JSON.stringify({ store_id: store.id })
        });

        followBtn.innerText = isFollowing ? "Seguir" : "Siguiendo";
      };
    }
  }
}

/* ================================
   FOLLOW
================================ */

async function checkFollowing(storeId) {
  const res = await fetch(`/api/is-following/${storeId}`, {
    credentials: "include"
  });

  if (!res.ok) return;

  const data = await res.json();
  const btn = document.getElementById("followBtn");

  if (btn) {
    btn.innerText = data.following ? "Siguiendo" : "Seguir";
  }
}

/* ================================
   MAPA
================================ */

function setupMap(store){

  const lat = store.lat || -34.6037;
  const lng = store.lng || -58.3816;

  const map = L.map('storeMap').setView([lat, lng], 16);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);

  L.marker([lat, lng]).addTo(map).bindPopup(store.name);

  setTimeout(() => map.invalidateSize(), 300);
}

/* ================================
   RENDER
================================ */

function renderStore(store){

  if(store.error){
    alert("Tienda no encontrada");
    return;
  }

  const cover = document.getElementById("storeCover");
  cover.style.background = store.cover_url
    ? `url('${store.cover_url}')`
    : "linear-gradient(135deg,#ff6a00,#ff8c42)";

  if(store.logo_url){
    document.getElementById("storeLogo").style.backgroundImage =
      `url('${store.logo_url}')`;
  }

  document.getElementById("storeName").innerText = store.name;

  // 🔥 STATUS separado
  updateStoreStatus(store);

  document.getElementById("storeCategory").innerText = store.category || "";
  document.getElementById("storeAddress").innerText =
    `${store.street || ''} ${store.local || ''}`.trim() || "Sin dirección";

  document.getElementById("storeDescription").innerText =
    store.description || "";

  const stats = document.getElementById("storeStats");

  stats.innerText =
    `⭐ ${store.rating_avg || 0} (${store.rating_count || 0})`;

  fetch(`/api/store-followers/${store.id}`)
    .then(res => res.json())
    .then(data => {
      stats.innerText += ` • ${data.count} seguidores`;
    });
}
