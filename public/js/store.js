// store.js


let currentUser = null;
let isOwner = false;
let storeData = null;
let storeIdGlobal = null;

const CATEGORY_MAP = {
  "Gastronomía": [
    { id: 1, name: "Restaurante" },
    { id: 2, name: "Pizzería" },
    { id: 3, name: "Bar" },
    { id: 4, name: "Cafetería" },
    { id: 5, name: "Heladería" }
  ],
  "Comercio": [
    { id: 6, name: "Ropa" },
    { id: 7, name: "Electrónica" },
    { id: 8, name: "Ferretería" },
    { id: 9, name: "Librería" },
    { id: 46, name: "Verdulería" },
    { id: 47, name: "Almacén" },
    { id: 48, name: "Kiosco" },
    { id: 49, name: "Supermercado" },
    { id: 50, name: "Carnicería" },
    { id: 51, name: "Panadería" },
    { id: 52, name: "Fiambrería" },
    { id: 53, name: "Dietética" },
    { id: 54, name: "Bebidas" },
    { id: 55, name: "Mayorista" }
  ],
  "Servicios": [
    { id: 18, name: "Electricista" },
    { id: 19, name: "Plomería" },
    { id: 20, name: "Gasista" },
    { id: 21, name: "Técnico PC" },
    { id: 22, name: "Reparaciones" }
  ],
  "Automotor": [
    { id: 23, name: "Taller mecánico" },
    { id: 24, name: "Lavadero" },
    { id: 25, name: "Gomería" },
    { id: 26, name: "Repuestos" }
  ]
};

function showToast(message, type = "success") {

  const toast = document.createElement("div");

  toast.innerText = message;

  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.padding = "12px 18px";
  toast.style.borderRadius = "10px";
  toast.style.color = "#fff";
  toast.style.fontWeight = "500";
  toast.style.zIndex = "9999";
  toast.style.boxShadow = "0 5px 15px rgba(0,0,0,0.2)";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(20px)";
  toast.style.transition = "0.3s";

  if (type === "error") {
    toast.style.background = "#dc2626";
  } else {
    toast.style.background = "#16a34a";
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 50);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ================================
   STATUS
================================ */

function isStoreOpen(store) {

  if (!store.is_open) return false;

  if (!store.opening_hours) return store.is_open;

  let hours;

  try {
    hours = typeof store.opening_hours === "string"
      ? JSON.parse(store.opening_hours)
      : store.opening_hours;
  } catch {
    return store.is_open;
  }

  if (hours.always_open) return true;

  const now = new Date();
  const daysMap = ["sun","mon","tue","wed","thu","fri","sat"];
  const todayKey = daysMap[now.getDay()];

  const today = hours[todayKey];

  // ❌ no hay datos
  if (!today) return false;

  // 🔴 DÍA CERRADO (CLAVE)
  if (today.closed) return false;

  const current = now.getHours() * 60 + now.getMinutes();

  // 🔥 soporta uno o varios horarios
  const ranges = Array.isArray(today) ? today : [today];

  for (const range of ranges) {

    if (!range.open || !range.close) continue;

    const [oh, om] = range.open.split(":").map(Number);
    const [ch, cm] = range.close.split(":").map(Number);

    const openTime = oh * 60 + om;
    const closeTime = ch * 60 + cm;

    if (current >= openTime && current <= closeTime) {
      return true;
    }
  }

  return false;
}

function updateStoreStatus(store) {

  const statusEl = document.getElementById("storeStatus");
  if (!statusEl) return;

  let hours;

  try {
    hours = typeof store.opening_hours === "string"
      ? JSON.parse(store.opening_hours)
      : store.opening_hours;
  } catch {
    hours = null;
  }

  if (!hours) {
    renderStoreStatus("Sin horarios", "#6b7280");
    return;
  }

  if (hours.always_open) {
    renderStoreStatus("Abierto 24hs", "#16a34a");
    return;
  }

  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();

  const daysMap = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const todayKey = daysMap[now.getDay()];
  const today = hours[todayKey];

  if (!today || today.closed) {
    renderStoreStatus("Cerrado", "#dc2626");
    return;
  }

  const ranges = Array.isArray(today) ? today : [today];

  let isOpenNow = false;
  let nextClose = null;
  let nextOpen = null;

  for (const range of ranges) {

    if (!range.open || !range.close) continue;

    const [oh, om] = range.open.split(":").map(Number);
    const [ch, cm] = range.close.split(":").map(Number);

    const openTime = oh * 60 + om;
    const closeTime = ch * 60 + cm;

    if (current >= openTime && current <= closeTime) {
      isOpenNow = true;
      nextClose = range.close;
      break;
    }

    if (current < openTime && !nextOpen) {
      nextOpen = range.open;
    }
  }

  if (isOpenNow) {
    renderStoreStatus(`Abierto ahora · Cierra ${nextClose}`, "#16a34a");
    return;
  }

  if (nextOpen) {
    renderStoreStatus(`Cerrado · Abre ${nextOpen}`, "#dc2626");
    return;
  }

  renderStoreStatus("Cerrado", "#dc2626");
}

function renderStoreStatus(text, color) {
  const statusEl = document.getElementById("storeStatus");
  if (!statusEl) return;

  statusEl.innerHTML = `
    <div style="
      display:flex;
      align-items:center;
      gap:6px;
      margin-top:6px;
      font-weight:500;
      font-size:14px;
      color:${color};
    ">
      <span style="
        width:8px;
        height:8px;
        border-radius:50%;
        background:${color};
        display:inline-block;
      "></span>
      ${text}
    </div>
  `;
}
/* ================================
   DETECTAR ID / SLUG
================================ */

const pathParts = window.location.pathname.split("/");


let storeId = null;
let storeSlug = null;

if (pathParts[1] === "store") {
  storeId = pathParts[2]?.split("?")[0];
} else if (pathParts[1] && isNaN(pathParts[1])) {
  storeSlug = pathParts[1].split("?")[0];
}
/* ================================
   INIT
================================ */

document.addEventListener("DOMContentLoaded", async () => {

  // 🟣 MODAL COMENTARIOS
const openModalBtn = document.getElementById("openStoreCommentsModal");
const closeModalBtn = document.getElementById("closeStoreCommentsModal");
const modal = document.getElementById("storeCommentsModal");

if (openModalBtn && modal) {
  openModalBtn.onclick = () => {
    modal.classList.remove("hidden");
  };
}
  // 🔔 AUTO ABRIR MODAL DESDE NOTIFICACIÓN
 const hash = window.location.hash;

if (hash.startsWith("#comment-")) {

  const commentId = hash.replace("#comment-", "");

  const tryOpen = () => {
    if (openModalBtn && modal) {

      modal.classList.remove("hidden");

      setTimeout(() => {

        const commentEl = document.getElementById(`comment-${commentId}`);

        if (commentEl) {

          // 🔥 scroll
          commentEl.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });

          // 🔥 highlight
          commentEl.style.background = "#fff3cd";
          commentEl.style.transition = "0.3s";

          setTimeout(() => {
            commentEl.style.background = "";
          }, 2000);

        }

      }, 400);

    } else {
      setTimeout(tryOpen, 100);
    }
  };

  tryOpen();
}

if (closeModalBtn && modal) {
  closeModalBtn.onclick = () => {
    modal.classList.add("hidden");
  };
}
  
  await loadUser();
  await loadStore();

  const btn = document.getElementById("sendStoreComment");
  if (btn) {
    btn.onclick = sendStoreComment;
  }
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

    let storeRes;

if (storeId) {
  storeRes = await fetch(`/api/stores/${storeId}`);
} else if (storeSlug) {
  storeRes = await fetch(`/api/stores/slug/${storeSlug}`);
} else {
  console.error("Ruta inválida");
  return;
}
    const store = await storeRes.json();

 // =============================
// SEO + LOCATION (PEGAR AQUÍ)
// =============================

// helper
const getProvinceFromStreet = (street) => {
  if (!street) return null;

  const parts = street.split(",");
  return parts.length >= 2 ? parts[parts.length - 2].trim() : null;
};

// location real
const province = store.province || getProvinceFromStreet(store.street);

const location =
  store.city && province
    ? `${store.city}, ${province}`
    : store.city || province || "Argentina";

// TITLE
document.title = `${store.name} en ${location} | PuntoCerca`;

// DESCRIPTION
let metaDesc = document.querySelector("meta[name='description']");
if (!metaDesc) {
  metaDesc = document.createElement("meta");
  metaDesc.name = "description";
  document.head.appendChild(metaDesc);
}

metaDesc.content = `
  ${store.name} en ${location}.
  ${store.description || "Negocio local con contacto directo por WhatsApp"}.
  ${store.street ? `Dirección: ${store.street}.` : ""}
`;

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

    // REVIEWS
    loadStoreRating(store.id);

    // COMENTARIOS
    await loadUser();
    loadStoreComments(store.id);

    // UI comentario
    const loginMsg = document.getElementById("storeLoginMessage");
    const commentBox = document.getElementById("storeCommentBox");

    if (currentUser) {
      if (commentBox) commentBox.classList.remove("hidden");
    } else {
      if (loginMsg) loginMsg.classList.remove("hidden");
    }

    // PRODUCTOS
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
   STORE REVIEWS (RATING + COMMENTS)
================================ */

async function loadStoreRating(storeId) {
  try {
    const res = await fetch(`/api/stores/${storeId}/rating`, {
      credentials: "include"
    });

    if (!res.ok) return;

    const data = await res.json();

    const avg = parseFloat(data.avg) || 0;
    const count = Number(data.count) || 0;
    const userRating = data.user_rating;

   
    const ratingToShow = userRating !== null ? userRating : avg;

    renderStoreStars(avg, userRating);
    updateStoreRatingInfo(avg, count, userRating);

  } catch (err) {
    console.error("Error rating tienda", err);
  }
}

function renderStoreStars(avg = 0, userRating = 0) {
  const container = document.getElementById("storeRatingStars");
  if (!container) return;

  container.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");

    const active = userRating !== null
  ? i <= userRating
  : i <= Math.round(avg);

    star.innerHTML = active ? "⭐" : "☆";
    star.style.cursor = "pointer";
    star.style.fontSize = "22px";
    star.style.marginRight = "4px";

    star.onclick = () => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }
      rateStore(i);
    };

    container.appendChild(star);
  }
}

function updateStoreRatingInfo(avg, count, userRating = 0) {
  const el = document.getElementById("storeRatingInfo");
  if (!el) return;

  let text = `⭐ ${avg.toFixed(1)} (${count} votos)`;

  if (userRating !== null) {
  text += ` • Tu voto: ${userRating}⭐`;
}

  el.innerText = text;
}

async function rateStore(value) {
  try {
    const res = await fetch(`/api/stores/${storeData.id}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ rating: value })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ BACKEND ERROR:", data);
      alert(data.detail || data.error);
      return;
    }

    renderStoreStars(parseFloat(data.avg) || 0, value);
    updateStoreRatingInfo(parseFloat(data.avg) || 0, Number(data.count) || 0, value);

  } catch (err) {
    console.error(err);
  }
}


/* ================================
   COMMENTS
================================ */

async function sendStoreComment() {
  const input = document.getElementById("storeCommentInput");
  if (!input) return;

  const content = input.value.trim();
  if (!content) return;

  try {
    const res = await fetch(`/api/stores/${storeData.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    input.value = "";

    // 🔥 recargar usuario + comentarios
    await loadUser();
    loadStoreComments(storeData.id);

  } catch (err) {
    console.error(err);
  }
}

async function loadStoreComments(storeId) {
  try {
    const res = await fetch(`/api/stores/${storeId}/comments`);
    if (!res.ok) return;

    const comments = await res.json();
    const container = document.getElementById("storeCommentsContainer");
const countEl = document.getElementById("commentsCount");

if (countEl) {
  countEl.innerText = comments.length;
}

    if (!container) return;

    container.innerHTML = "";

    if (!comments.length) {
      container.innerHTML = `<p style="color:#888;">Todavía no hay opiniones</p>`;
      return;
    }

   comments.forEach(c => {

  const isMine = currentUser && String(currentUser.id) === String(c.user_id);

 const div = document.createElement("div");
div.id = `comment-${c.id}`;

  div.innerHTML = `
    <div style="
      display:flex;
      gap:10px;
      margin-bottom:15px;
      padding:10px;
      border-radius:10px;
      background:#f9fafb;
    ">
      <img 
        src="${c.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(c.name)}"
        style="width:40px;height:40px;border-radius:50%;object-fit:cover;"
      />

      <div style="flex:1;">
        <strong>${c.name}</strong>
        <div style="font-size:12px;color:#888;">
          ${new Date(c.created_at).toLocaleDateString()}
        </div>

        <p style="margin:5px 0;">
          ${c.content}
        </p>

        ${
          isMine
          ? `
          <div style="display:flex; gap:10px; margin-top:5px;">
            <button onclick="deleteComment(${c.id})" style="color:red;">
              Eliminar
            </button>
          </div>
          `
          : ""
        }

      </div>
    </div>
  `;

  container.appendChild(div);
});

  } catch (err) {
    console.error("Error cargando comentarios:", err);
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

function getSubcategoryNames(ids) {
  if (!ids) return [];

  let parsed = ids;

  if (typeof ids === "string") {
    try {
      parsed = JSON.parse(ids);
    } catch {
      return [];
    }
  }

  const names = [];

  Object.values(CATEGORY_MAP).forEach(subs => {
    subs.forEach(sub => {
      if (parsed.includes(sub.id)) {
        names.push(sub.name);
      }
    });
  });

  return names;
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

  let subcategoryText = "";

if (store.subcategory_ids) {
  try {
    const subs = typeof store.subcategory_ids === "string"
      ? JSON.parse(store.subcategory_ids)
      : store.subcategory_ids;

    if (Array.isArray(subs) && subs.length > 0) {
      subcategoryText = subs[0];
    }
  } catch (error) {
    console.error("Error leyendo subcategorías:", error);
  }
}

const subNames = getSubcategoryNames(store.subcategory_ids);

document.getElementById("storeCategory").innerText =
  subNames.length > 0
    ? subNames.join(" • ")
    : "";
const addressParts = [];

if (store.street) {
  addressParts.push(store.street);
}

if (store.local) {
  addressParts.push(`Local ${store.local}`);
}

if (store.apartment) {
  addressParts.push(`Piso/Dpto ${store.apartment}`);
}

const fullAddress = addressParts.join(" · ");

document.getElementById("storeAddress").innerText =
  fullAddress || "Sin dirección";

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

async function deleteComment(commentId) {
  if (!confirm("¿Eliminar comentario?")) return;

  try {
    const res = await fetch(`/api/stores/comments/${commentId}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (!res.ok) {
      alert("Error eliminando");
      return;
    }

    loadStoreComments(storeData.id);

  } catch (err) {
    console.error(err);
  }
}


