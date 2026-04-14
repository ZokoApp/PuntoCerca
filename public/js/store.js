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
      gap:6px;
      margin-top:6px;
      font-weight:500;
      font-size:14px;
      color:${open ? '#16a34a' : '#dc2626'};
    ">
      <span style="
        width:8px;
        height:8px;
        border-radius:50%;
        background:${open ? '#16a34a' : '#dc2626'};
        display:inline-block;
      "></span>
      ${open ? 'Abierto ahora' : 'Cerrado'}
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
  storeId = pathParts[2]?.split("?")[0]; // 🔥 FIX
} else {
  const possibleSlug = pathParts[1];

  if (possibleSlug && isNaN(possibleSlug)) {
    storeSlug = possibleSlug;
  }
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
} else if (storeSlug && isNaN(storeSlug)) {
  res = await fetch(`/api/stores/slug/${storeSlug}`);
} else {
  console.error("ID/Slug inválido");
  return;
}

    const store = await res.json();

     if (!store || store.error) {
  console.error("Error cargando tienda:", store);
  return;
}

    storeData = store;

    if(currentUser && store.user_id === currentUser.id){
      isOwner = true;
    }

    renderStore(store);
setupMap(store);
handleUIByRole(store);

// 🔥 asegurar carga de productos
setTimeout(() => {
  if (window.initStoreProducts) {
    window.initStoreProducts(store);
  } else {
    console.error("initStoreProducts no está disponible");
  }
}, 100);

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
            const res = await fetch(`/api/stores/${store.id}/status`, {
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

    if (followBtn) {

  if (!currentUser) {
    followBtn.style.display = "none";
    return;
  }

  // usuario logueado
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
 if (store.cover_url) {
  cover.style.backgroundImage = `url('${store.cover_url}')`;
  cover.style.backgroundSize = "cover";
  cover.style.backgroundPosition = "center";
  cover.style.backgroundRepeat = "no-repeat";
} else {
  cover.style.background = "linear-gradient(135deg,#ff6a00,#ff8c42)";
}
   

  if(store.logo_url){
    document.getElementById("storeLogo").style.backgroundImage =
      `url('${store.logo_url}')`;
  }

  document.getElementById("storeName").innerText = store.name;

  // 🔥 STATUS separado
  updateStoreStatus(store);

  document.getElementById("storeCategory").innerText = store.category || "";
 const address = store.street?.trim();

document.getElementById("storeAddress").innerText =
  address || "Sin dirección";

  document.getElementById("storeDescription").innerText =
    store.description || "";

  const stats = document.getElementById("storeStats");

// estrellas visuales
function renderStars(avg) {
  const rating = Math.round(avg || 0);
  let stars = "";

  for (let i = 1; i <= 5; i++) {
    stars += i <= rating ? "★" : "☆";
  }

  return stars;
}

stats.innerHTML = `
  <div style="display:flex; gap:12px; align-items:center; margin-top:6px; font-size:14px;">
    <span style="color:#f59e0b;">
     ${renderStars(Number(store.rating_avg))}
    </span>
    <span style="color:#666;">
      (${store.rating_count || 0})
    </span>
    <span id="followersCount" style="color:#666;"></span>
  </div>
`;

fetch(`/api/store-followers/${store.id}`)
  .then(res => res.json())
  .then(data => {
    document.getElementById("followersCount").innerText =
      `${data.count} seguidores`;
  });
}
