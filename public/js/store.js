// store.js

import { SUBCATEGORY_MAP } from "./data/categories.js";
import "./store-products.js";
import "./store-ui.js";

let currentUser = null;
let isOwner = false;
let storeData = null;
let storeIdGlobal = null;



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

export function isStoreOpen(store) {

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
  const current = now.getHours() * 60 + now.getMinutes();

  const daysMap = ["sun","mon","tue","wed","thu","fri","sat"];

  const todayKey = daysMap[now.getDay()];
  const yesterdayKey = daysMap[(now.getDay() + 6) % 7];

  function checkRanges(dayData, checkPreviousDay = false) {
    if (!dayData || dayData.closed) return false;

    const ranges = Array.isArray(dayData) ? dayData : [dayData];

    for (const range of ranges) {
      if (!range.open || !range.close) continue;

      const [oh, om] = range.open.split(":").map(Number);
      const [ch, cm] = range.close.split(":").map(Number);

      const openTime = oh * 60 + om;
      const closeTime = ch * 60 + cm;

      // horario normal: 09:00 -> 18:00
      if (openTime <= closeTime) {
        if (!checkPreviousDay && current >= openTime && current <= closeTime) {
          return true;
        }
      }

      // horario nocturno: 18:00 -> 03:00
      if (openTime > closeTime) {
        if (!checkPreviousDay && current >= openTime) {
          return true;
        }

        if (checkPreviousDay && current <= closeTime) {
          return true;
        }
      }
    }

    return false;
  }

  // 1. revisar horario de hoy
  if (checkRanges(hours[todayKey], false)) return true;

  // 2. revisar si ayer abrió y cerraba hoy de madrugada
  if (checkRanges(hours[yesterdayKey], true)) return true;

  return false;
}

export function getStoreStatusInfo(store) {

  let hours;

  try {
    hours = typeof store.opening_hours === "string"
      ? JSON.parse(store.opening_hours)
      : store.opening_hours;
  } catch {
    return { text: "Sin horarios", color: "#6b7280" };
  }

  if (!hours) {
    return { text: "Sin horarios", color: "#6b7280" };
  }

  if (hours.always_open) {
    return { text: "Abierto 24hs", color: "#16a34a" };
  }

  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();

  const daysMap = ["sun","mon","tue","wed","thu","fri","sat"];
  const todayKey = daysMap[now.getDay()];
  const today = hours[todayKey];

  if (!today || today.closed) {
    return { text: "Cerrado", color: "#dc2626" };
  }

  const ranges = Array.isArray(today) ? today : [today];

  let isOpen = false;
  let nextClose = null;
  let nextOpen = null;

  for (const r of ranges) {

    if (!r.open || !r.close) continue;

    const [oh, om] = r.open.split(":").map(Number);
    const [ch, cm] = r.close.split(":").map(Number);

    const openTime = oh * 60 + om;
    const closeTime = ch * 60 + cm;

    if (current >= openTime && current <= closeTime) {
      isOpen = true;
      nextClose = r.close;
      break;
    }

    if (current < openTime && !nextOpen) {
      nextOpen = r.open;
    }
  }

  if (isOpen) {
    return {
      text: `Abierto ahora · Cierra ${nextClose}`,
      color: "#16a34a"
    };
  }

  if (nextOpen) {
    return {
      text: `Cerrado · Abre ${nextOpen}`,
      color: "#dc2626"
    };
  }

  return { text: "Cerrado", color: "#dc2626" };
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

    // 🔥 horario normal
    if (openTime <= closeTime) {
      if (current >= openTime && current <= closeTime) {
        isOpenNow = true;
        nextClose = range.close;
        break;
      }
    }
    // 🔥 horario nocturno
    else {
      if (current >= openTime || current <= closeTime) {
        isOpenNow = true;
        nextClose = range.close;
        break;
      }
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

  const overlay = document.querySelector(".modal-overlay");

  if (overlay) {
    overlay.onclick = () => {
      document.getElementById("storeCommentsModal").classList.add("hidden");
    };
  }

  const goLoginBtn = document.getElementById("goLoginBtn");

  if (goLoginBtn) {
    goLoginBtn.onclick = () => {
      window.location.href = "/login";
    };
  }

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

            commentEl.scrollIntoView({ behavior: "smooth", block: "center" });

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

async function loadUser() {
  currentUser = null;

  try {
    const res = await fetch("/api/me", {
      credentials: "include",
      cache: "no-store"
    });

    if (res.ok) {
      currentUser = await res.json();
    } else {
      currentUser = null;
    }

  } catch {
    currentUser = null;
  }
}

/* ================================
   STORE
================================ */

async function loadStore() {

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
    // SEO + LOCATION
    // =============================

    const getProvinceFromStreet = (street) => {
      if (!street) return null;
      const parts = street.split(",");
      return parts.length >= 2 ? parts[parts.length - 2].trim() : null;
    };

    const province = store.province || getProvinceFromStreet(store.street);

    const location =
      store.city && province
        ? `${store.city}, ${province}`
        : store.city || province || "Argentina";

    document.title = `${store.name} en ${location} | PuntoCerca`;

    const seoContent = document.getElementById("seoContent");

    if (seoContent) {
      seoContent.innerText = `
        ${store.name} ubicado en ${location}.
        ${store.description || "Negocio local"}.
        ${store.street ? `Dirección: ${store.street}.` : ""}
        Encontrá productos, precios y contacto directo en PuntoCerca.
      `;
    }

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
    loadStoreEvents(store.id);

    if (currentUser && store.user_id === currentUser.id) {
      isOwner = true;
    }

   renderStore(store);
setupMap(store);
handleUIByRole(store);
loadPizarraForProfile(store.id);
loadStoreVideos(store.id);

    // REVIEWS — reemplaza el render inicial con datos frescos + voto del usuario
    loadStoreRating(store.id);

    // COMENTARIOS
    await loadUser();
    loadStoreComments(store.id);

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

    if (currentUser && !isOwner) {
      checkFollowing(store.id);
    }

  } catch (err) {
    console.error("Error cargando tienda", err);
  }
}

/* ================================
   UI POR ROL
================================ */

function handleUIByRole(store) {

  const whatsappBtn = document.getElementById("whatsappBtn");
  const mapBtn = document.getElementById("mapButton");
  const followBtn = document.getElementById("followBtn");

  if (isOwner) {

    const ownerActions = document.getElementById("ownerActions");
    if (ownerActions) ownerActions.style.display = "flex";

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        await fetch("/api/logout", { method: "POST", credentials: "include" });
        window.location.href = "/";
      };
    }

    if (whatsappBtn) whatsappBtn.style.display = "none";
    if (mapBtn) mapBtn.style.display = "none";
    if (followBtn) followBtn.style.display = "none";

    const ownerControl = document.getElementById("ownerStatusControl");

    if (ownerControl) {
      ownerControl.style.display = "block";

      const select = document.getElementById("storeStatusSelect");

      if (select) {
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

            if (res.ok) {
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

    if (whatsappBtn) {
      whatsappBtn.style.display = "inline-block";

      if (currentUser) {
        if (store.phone) {
          whatsappBtn.href = `https://wa.me/${store.phone.replace(/\D/g, "")}`;
        }
      } else {
        whatsappBtn.onclick = (e) => {
          e.preventDefault();
          window.location.href = "/login";
        };
      }
    }

    if (mapBtn) {
      mapBtn.onclick = () => {
        document.getElementById("storeMap").scrollIntoView({ behavior: "smooth" });
      };
    }

    if (followBtn) {

      if (!currentUser) {
        followBtn.style.display = "none";
        return;
      }

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

  // RESET fuerte Android
  if (btn) {
    btn.style.display = "none";
    btn.innerText = "Seguir";
    btn.onclick = null;
    btn.innerText = data.following ? "Siguiendo" : "Seguir";
    btn.style.display = "inline-block";
  }
}

/* ================================
   RATING
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
    const userRating = data.user_rating ?? null;

    // ★ Actualiza con datos frescos del servidor (sobreescribe el render inicial)
    renderStoreStars(avg, userRating);
    updateStoreRatingInfo(avg, count, userRating);

  } catch (err) {
    console.error("Error rating tienda", err);
  }
}

// ★ CAMBIO 1: usa "★" unicode con color en lugar de emoji ⭐
//             agrega hover que ilumina/apaga de forma fluida
function renderStoreStars(avg = 0, userRating = null) {
  const container = document.getElementById("storeRatingStars");
  if (!container) return;

  container.innerHTML = "";

  const currentActive = userRating !== null ? userRating : Math.round(avg);

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");

    star.textContent = "★";
    star.style.color = i <= currentActive ? "#f59e0b" : "#d1d5db";
    star.style.cursor = "pointer";
    star.style.fontSize = "26px";
    star.style.transition = "transform .15s, color .15s";
    star.style.userSelect = "none";

    // Hover: iluminar hasta esta estrella
    star.onmouseenter = () => {
      container.querySelectorAll("span").forEach((s, idx) => {
        s.style.color     = idx < i ? "#f59e0b" : "#d1d5db";
        s.style.transform = idx < i ? "scale(1.2)" : "scale(1)";
      });
    };

    // Hover out: volver al estado guardado
    star.onmouseleave = () => {
      const cur = userRating !== null ? userRating : Math.round(avg);
      container.querySelectorAll("span").forEach((s, idx) => {
        s.style.color     = idx < cur ? "#f59e0b" : "#d1d5db";
        s.style.transform = "scale(1)";
      });
    };

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

// ★ CAMBIO 2: texto consistente con "★" y sin emoji
function updateStoreRatingInfo(avg, count, userRating = null) {
  const el = document.getElementById("storeRatingInfo");
  if (!el) return;

  const votosLabel = count === 1 ? "voto" : "votos";
  let text = `★ ${avg.toFixed(1)} (${count} ${votosLabel})`;

  if (userRating !== null) {
    text += ` · Tu voto: ${userRating}★`;
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

    const newAvg   = parseFloat(data.avg)  || 0;
    const newCount = Number(data.count)    || 0;

    renderStoreStars(newAvg, value);
    updateStoreRatingInfo(newAvg, newCount, value);

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
    const countEl   = document.getElementById("commentsCount");

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
            src="${c.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(c.name)}"
            style="width:40px;height:40px;border-radius:50%;object-fit:cover;"
          />

          <div style="flex:1;">
            <strong>${c.name}</strong>
            <div style="font-size:12px;color:#888;">
              ${new Date(c.created_at).toLocaleDateString()}
            </div>

            <p style="margin:5px 0;">${c.content}</p>

            ${
              isMine
              ? `<div style="display:flex; gap:10px; margin-top:5px;">
                   <button onclick="deleteComment(${c.id})" style="color:red;">Eliminar</button>
                 </div>`
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

function setupMap(store) {

  const lat = store.lat || -34.6037;
  const lng = store.lng || -58.3816;

  const map = L.map("storeMap").setView([lat, lng], 16);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
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

  return parsed
    .map(id => SUBCATEGORY_MAP[id])
    .filter(Boolean);
}

function renderStore(store) {

  if (store.error) {
    alert("Tienda no encontrada");
    return;
  }

  /* COVER */
  const cover = document.getElementById("storeCover");

  if (store.cover_url) {
    cover.style.backgroundImage    = `url('${store.cover_url}')`;
    cover.style.backgroundSize     = "cover";
    cover.style.backgroundPosition = "center";
    cover.style.backgroundRepeat   = "no-repeat";
  } else {
    cover.style.background = "linear-gradient(135deg,#ff6a00,#ff8c42)";
  }

  /* LOGO */
  if (store.logo_url) {
    document.getElementById("storeLogo").style.backgroundImage = `url('${store.logo_url}')`;
  }

  /* INFO */
  document.getElementById("storeName").innerText = store.name;

  updateStoreStatus(store);

  const subNames = getSubcategoryNames(store.subcategory_ids);
  document.getElementById("storeCategory").innerText =
    subNames.length > 0 ? subNames.join(" • ") : "";

  const addressParts = [];
  if (store.street)    addressParts.push(store.street);
  if (store.local)     addressParts.push(`Local ${store.local}`);
  if (store.apartment) addressParts.push(`Piso/Dpto ${store.apartment}`);

  document.getElementById("storeAddress").innerText =
    addressParts.join(" · ") || "Sin dirección";

  document.getElementById("storeDescription").innerText =
    store.description || "";

  /* CATALOGO PDF */
  const catalogSection = document.getElementById("catalogSection");
  const openCatalogBtn = document.getElementById("openCatalogBtn");

  if (store.catalog_pdf_url && catalogSection && openCatalogBtn) {

    catalogSection.classList.remove("hidden");

    openCatalogBtn.onclick = () => {

      let modal = document.getElementById("pdfViewerModal");
      if (modal) modal.remove();

      modal = document.createElement("div");
      modal.id = "pdfViewerModal";

      modal.innerHTML = `
        <div class="pdf-modal-overlay"></div>
        <div class="pdf-modal-content">
          <button id="closePdfModal" class="pdf-close-btn">✕</button>
          <embed
            src="${store.catalog_pdf_url}"
            type="application/pdf"
            width="100%"
            height="100%"
            style="border:none;border-radius:20px;background:#fff;"
          />
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById("closePdfModal").onclick = () => modal.remove();
      modal.querySelector(".pdf-modal-overlay").onclick = () => modal.remove();
    };
  }

  /* ================================
     STATS — solo seguidores
     Las estrellas las maneja el bloque
     de RATING más abajo (renderStoreStars)
  ================================ */
  const stats = document.getElementById("storeStats");

  if (stats) {
    stats.innerHTML = `
      <div style="
        display:flex;
        gap:12px;
        align-items:center;
        margin-top:6px;
        font-size:14px;
        flex-wrap:wrap;
      ">
        <span id="followersCount" style="color:#666;"></span>
      </div>
    `;

    fetch(`/api/store-followers/${store.id}`)
      .then(res => res.json())
      .then(data => {
        const followersEl = document.getElementById("followersCount");
        if (followersEl) {
          followersEl.innerText = `${data.count} seguidores`;
        }
      });
  }

  // ★ Render inicial inmediato con datos del store
  //    (loadStoreRating() lo sobreescribirá con datos frescos + voto del usuario)
  renderStoreStars(Number(store.rating_avg) || 0, null);
  updateStoreRatingInfo(Number(store.rating_avg) || 0, Number(store.rating_count) || 0, null);

 

}

/* ================================
   DELETE COMMENT
================================ */

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

/* ================================
   EVENTS
================================ */

async function loadStoreEvents(storeId) {
  try {

    const res = await fetch(`/api/stores/${storeId}/events`);

    if (!res.ok) {
      console.error("ERROR HTTP:", res.status);
      return;
    }

    const events = await res.json();
    const container = document.getElementById("storeEvents");

    if (!events.length) {
      container.innerHTML = "<p>No hay eventos activos</p>";
      return;
    }

    container.innerHTML = events.map(event => {

      const now   = new Date();
      const start = new Date(event.start_at);
      const end   = new Date(event.end_at);

      const status = (now >= start && now <= end) ? "En curso" : "Próximo";

      return `
        <div
          onclick="window.location.href='/event.html?id=${event.id}'"
          style="
            position:relative;
            width:220px;
            min-width:220px;
            border-radius:14px;
            overflow:hidden;
            background:#fff;
            box-shadow:0 5px 15px rgba(0,0,0,0.1);
            cursor:pointer;
          "
        >
          ${
            isOwner ? `
              <div style="position:absolute;top:8px;right:8px;display:flex;gap:6px;z-index:10;">
                <button onclick="event.stopPropagation();editEvent(${event.id})"
                  style="background:#fff;padding:4px 8px;border-radius:6px;">✏️</button>
                <button onclick="event.stopPropagation();deleteEvent(${event.id})"
                  style="background:#fff;padding:4px 8px;border-radius:6px;color:red;">🗑</button>
              </div>
            ` : ""
          }

          <img src="${event.image_url}" style="width:100%;height:130px;object-fit:cover;" />

          <div style="padding:10px">
            <div style="font-size:12px;color:#16a34a;font-weight:600;margin-bottom:4px;">
              ${status === "En curso" ? "🔥 En curso" : "⏳ Próximo"}
            </div>
            <h3 style="font-size:14px;font-weight:600;margin:0 0 5px 0;">${event.title}</h3>
            <p style="font-size:12px;color:#666;margin:0;">
              ${new Date(event.start_at).toLocaleString()}
            </p>
          </div>
        </div>
      `;

    }).join("");

  } catch (err) {
    console.error("ERROR EVENTS:", err);
  }
}

async function deleteEvent(id) {
  if (!confirm("¿Eliminar evento?")) return;

  const res = await fetch(`/api/events/${id}`, {
    method: "DELETE",
    credentials: "include"
  });

  if (!res.ok) {
    alert("Error eliminando");
    return;
  }

  loadStoreEvents(storeData.id);
}

function editEvent(id) {
  window.location.href = `/edit-event.html?id=${id}`;
}

window.deleteEvent   = deleteEvent;
window.editEvent     = editEvent;
window.deleteComment = deleteComment;

/* ================================
   FIX ANDROID BACK/FORWARD CACHE
================================ */

window.addEventListener("pageshow", async () => {

  currentUser = null;
  isOwner     = false;

  await loadUser();

  if (storeData) {
    isOwner =
      currentUser &&
      String(storeData.user_id) === String(currentUser.id);

    handleUIByRole(storeData);
  }
});

/* ================================
   PIZARRA — RING + HISTORIA
================================ */

let pizarraStoryTimer = null;

async function loadPizarraForProfile(storeId) {
  try {
    const res = await fetch(`/api/pizarra/${storeId}`);
    if (!res.ok) return;

    const pizarra = await res.json();

    const logoEl = document.getElementById('storeLogo');
    if (!logoEl) return;

    // Anillo naranja estilo Instagram
    logoEl.style.boxShadow = '0 0 0 3px white, 0 0 0 6px #ea580c';
    logoEl.style.cursor = 'pointer';
    logoEl.style.transition = 'box-shadow 0.2s ease';

    logoEl.onmouseenter = () => {
      logoEl.style.boxShadow = '0 0 0 3px white, 0 0 0 7px #f97316';
    };
    logoEl.onmouseleave = () => {
      logoEl.style.boxShadow = '0 0 0 3px white, 0 0 0 6px #ea580c';
    };

    logoEl.onclick = () => openPizarraStory(pizarra);

  } catch (err) {
    console.error('Error pizarra perfil:', err);
  }
}

function openPizarraStory(pizarra) {
  const existing = document.getElementById('pizarraStoryModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'pizarraStoryModal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    background:black;
    display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    animation:pizarraFadeIn 0.25s ease;
  `;

  const DURATION = 8000;

  modal.innerHTML = `
    <style>
      @keyframes pizarraFadeIn {
        from { opacity:0; transform:scale(0.97); }
        to   { opacity:1; transform:scale(1); }
      }
    </style>

    <!-- BARRA DE PROGRESO -->
    <div style="
      position:absolute;top:12px;left:12px;right:12px;
      height:3px;background:rgba(255,255,255,0.25);
      border-radius:999px;overflow:hidden;
    ">
      <div id="pizarraProgressBar" style="
        height:100%;width:0%;background:white;
        border-radius:999px;
        transition:width ${DURATION}ms linear;
      "></div>
    </div>

    <!-- HEADER -->
    <div style="
      position:absolute;top:24px;left:14px;right:14px;
      display:flex;align-items:center;justify-content:space-between;
    ">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="
          width:38px;height:38px;border-radius:50%;
          border:2px solid white;
          background:url('${storeData?.logo_url || ''}') center/cover no-repeat, #ea580c;
          flex-shrink:0;
        "></div>
        <div>
          <div style="color:white;font-size:13px;font-weight:700;line-height:1.2;">
            ${storeData?.name || ''}
          </div>
          <div style="color:rgba(255,255,255,0.65);font-size:11px;">
            🖊️ La Pizarra de Hoy
          </div>
        </div>
      </div>
      <button id="closePizarraBtn" style="
        background:rgba(255,255,255,0.15);
        border:none;border-radius:50%;
        width:34px;height:34px;
        color:white;font-size:18px;
        cursor:pointer;display:flex;
        align-items:center;justify-content:center;
        line-height:1;
      ">✕</button>
    </div>

    <!-- IMAGEN -->
    <img
      src="${pizarra.image_url}"
      style="
        max-width:100%;
        max-height:100vh;
        object-fit:contain;
        border-radius:4px;
      "
    />

    ${pizarra.caption ? `
      <div style="
        position:absolute;bottom:36px;left:20px;right:20px;
        background:rgba(0,0,0,0.65);
        backdrop-filter:blur(8px);
        border-radius:14px;padding:14px 18px;
        color:white;font-size:15px;
        text-align:center;line-height:1.5;
      ">
        ${pizarra.caption}
      </div>
    ` : ''}
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  // Arrancar barra de progreso
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const bar = document.getElementById('pizarraProgressBar');
      if (bar) bar.style.width = '100%';
    });
  });

  // Auto-cerrar
  pizarraStoryTimer = setTimeout(closePizarraStory, DURATION);

  // Botón cerrar
  document.getElementById('closePizarraBtn').onclick = closePizarraStory;

  // Cerrar tocando fuera de la imagen
  modal.onclick = (e) => {
    if (e.target === modal) closePizarraStory();
  };
}

function closePizarraStory() {
  const modal = document.getElementById('pizarraStoryModal');
  if (modal) {
    modal.style.animation = 'none';
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.2s ease';
    setTimeout(() => modal.remove(), 200);
  }
  document.body.style.overflow = '';
  if (pizarraStoryTimer) {
    clearTimeout(pizarraStoryTimer);
    pizarraStoryTimer = null;
  }
}


/* ================================
   VIDEOS — PERFIL PÚBLICO
================================ */

async function loadStoreVideos(storeId) {
  try {
    const res = await fetch(`/api/store-videos/${storeId}`);
    if (!res.ok) return;

    const videos = await res.json();
    if (!videos.length) return;

    const container = document.getElementById('storeVideosSection');
    if (!container) return;

    container.style.display = 'block';

    container.innerHTML = `
      <h3 style="font-size:16px;font-weight:700;color:#111827;margin-bottom:16px;">
        🎬 Videos del local
      </h3>
      <div id="storeVideosGrid" style="display:flex;flex-direction:column;gap:16px;">
        ${videos.map(v => buildStoreEmbed(v.url, v.platform)).filter(Boolean).join('')}
      </div>
    `;

    // Script de Instagram si hace falta
    if (videos.some(v => v.platform === 'instagram')) {
  if (window.instgrm) {
    setTimeout(() => window.instgrm.Embeds.process(), 500);
  } else if (!document.getElementById('igScript')) {
    const s = document.createElement('script');
    s.id = 'igScript';
    s.src = '//www.instagram.com/embed.js';
    s.async = true;
    document.body.appendChild(s);
  }
}

  } catch (err) {
    console.error('Error cargando videos del perfil', err);
  }
}

function buildStoreEmbed(url, platform) {
  if (platform === 'youtube') {
    const yt = url.match(
      /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (!yt) return null;
    return `
      <div style="
        width:100%;max-width:560px;margin:0 auto;
        border-radius:14px;overflow:hidden;
        background:#000;aspect-ratio:16/9;
        box-shadow:0 4px 20px rgba(0,0,0,0.12);
      ">
        <iframe
          src="https://www.youtube.com/embed/${yt[1]}"
          style="width:100%;height:100%;border:none;"
          allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>`;
  }

if (platform === 'instagram') {
  return `
    <div style="display:flex;justify-content:center;max-width:480px;margin:0 auto;">
      <blockquote
        class="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink="${url}"
        data-instgrm-version="14"
        style="
          background:#fff;border:0;border-radius:12px;
          box-shadow:0 0 1px 0 rgba(0,0,0,.5),0 1px 10px 0 rgba(0,0,0,.15);
          margin:0;padding:0;width:100%;min-width:280px;
        "
      ></blockquote>
    </div>`;
}

  return null;
}
