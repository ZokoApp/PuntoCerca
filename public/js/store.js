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
    loadHighlights(store.id);
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

    const pizarras = await res.json();
    if (!pizarras.length) return;

    window._storePizarras = pizarras;

    const logoEl = document.getElementById('storeLogo');
    if (!logoEl) return;

    logoEl.style.boxShadow = '0 0 0 3px white, 0 0 0 6px #ea580c';
    logoEl.style.cursor = 'pointer';
    logoEl.style.transition = 'box-shadow 0.2s ease';

    if (pizarras.length > 1) {
      const parent = logoEl.parentElement;
      if (parent && parent.style.position !== 'relative') {
        parent.style.position = 'relative';
      }
      const badge = document.createElement('div');
      badge.style.cssText = `
        position:absolute;bottom:-2px;right:-2px;
        background:#ea580c;color:white;border-radius:999px;
        font-size:10px;font-weight:800;padding:2px 6px;
        border:2px solid white;pointer-events:none;z-index:10;
      `;
      badge.textContent = pizarras.length;
      parent.appendChild(badge);
    }

    logoEl.onmouseenter = () => {
      logoEl.style.boxShadow = '0 0 0 3px white, 0 0 0 7px #f97316';
    };
    logoEl.onmouseleave = () => {
      logoEl.style.boxShadow = '0 0 0 3px white, 0 0 0 6px #ea580c';
    };

    logoEl.onclick = () => openPizarraStory(0);

  } catch (err) {
    console.error('Error pizarra perfil:', err);
  }
}  

function openPizarraStory(index) {
  const pizarras = window._storePizarras || [];
  if (!pizarras.length || index < 0 || index >= pizarras.length) {
    closePizarraStory();
    return;
  }

  const pizarra = pizarras[index];
  const DURATION = 5000;

  const existing = document.getElementById('pizarraStoryModal');
  if (existing) existing.remove();
  if (pizarraStoryTimer) { clearTimeout(pizarraStoryTimer); pizarraStoryTimer = null; }

  const modal = document.createElement('div');
  modal.id = 'pizarraStoryModal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    background:black;display:flex;flex-direction:column;
    align-items:center;justify-content:center;
    animation:pizarraFadeIn 0.2s ease;
  `;

  const bars = pizarras.map((_, i) => `
    <div style="flex:1;height:3px;background:rgba(255,255,255,0.3);
      border-radius:999px;overflow:hidden;">
      <div id="pizarraBar_${i}" style="
        height:100%;background:white;border-radius:999px;
        width:${i < index ? '100%' : '0%'};
        ${i === index ? `transition:width ${DURATION}ms linear;` : ''}
      "></div>
    </div>
  `).join('');

  modal.innerHTML = `
    <style>
      @keyframes pizarraFadeIn {
        from{opacity:0;transform:scale(0.97);}
        to{opacity:1;transform:scale(1);}
      }
    </style>

    <div style="position:absolute;top:12px;left:12px;right:12px;display:flex;gap:4px;">
      ${bars}
    </div>

    <div style="position:absolute;top:28px;left:14px;right:14px;
      display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:38px;height:38px;border-radius:50%;border:2px solid white;
          background:url('${storeData?.logo_url || ''}') center/cover no-repeat,#ea580c;
          flex-shrink:0;"></div>
        <div>
          <div style="color:white;font-size:13px;font-weight:700;line-height:1.2;">
            ${storeData?.name || ''}
          </div>
          <div style="color:rgba(255,255,255,0.65);font-size:11px;">
            🖊️ La Pizarra de Hoy · ${index + 1}/${pizarras.length}
          </div>
        </div>
      </div>
      <button id="closePizarraBtn" style="
        background:rgba(255,255,255,0.15);border:none;border-radius:50%;
        width:34px;height:34px;color:white;font-size:18px;cursor:pointer;
        display:flex;align-items:center;justify-content:center;
      ">✕</button>
    </div>

    <img src="${pizarra.image_url}"
      style="max-width:100%;max-height:100vh;object-fit:contain;border-radius:4px;"
    />

    ${pizarra.caption ? `
      <div style="position:absolute;bottom:36px;left:20px;right:20px;
        background:rgba(0,0,0,0.65);backdrop-filter:blur(8px);
        border-radius:14px;padding:14px 18px;color:white;
        font-size:15px;text-align:center;line-height:1.5;">
        ${pizarra.caption}
      </div>
    ` : ''}

    <div style="position:absolute;inset:0;display:flex;top:80px;">
      <div style="flex:1;cursor:pointer;" onclick="navigatePizarra(${index - 1})"></div>
      <div style="flex:1;cursor:pointer;" onclick="navigatePizarra(${index + 1})"></div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const bar = document.getElementById(`pizarraBar_${index}`);
      if (bar) bar.style.width = '100%';
    });
  });

  pizarraStoryTimer = setTimeout(() => {
    navigatePizarra(index + 1);
  }, DURATION);

  document.getElementById('closePizarraBtn').onclick = closePizarraStory;
}

window.navigatePizarra = function(index) {
  const pizarras = window._storePizarras || [];
  if (index < 0 || index >= pizarras.length) {
    closePizarraStory();
    return;
  }
  openPizarraStory(index);
};

function closePizarraStory() {
  const modal = document.getElementById('pizarraStoryModal');
  if (modal) {
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.2s';
    setTimeout(() => modal.remove(), 200);
  }
  document.body.style.overflow = '';
  if (pizarraStoryTimer) { clearTimeout(pizarraStoryTimer); pizarraStoryTimer = null; }
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

    const slides = videos
      .map(v => buildStoreEmbed(v.url, v.platform))
      .filter(Boolean)
      .map(embed => `<div style="flex-shrink:0;width:320px;">${embed}</div>`)
      .join('');

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;
        margin-bottom:14px;padding:0 4px;">
        <h3 style="font-size:16px;font-weight:700;color:#111827;margin:0;">
          🎬 Videos del local
        </h3>
        <a href="/${storeData?.slug}/videos" style="
          font-size:13px;font-weight:600;color:#ea580c;
          text-decoration:none;border:1px solid #fed7aa;
          border-radius:8px;padding:5px 12px;
        ">Ver todos (${videos.length}) →</a>
      </div>

      <div style="position:relative;padding:0 20px;">
        <button onclick="scrollVideos(-1)" style="
          position:absolute;left:0;top:40%;transform:translateY(-50%);
          z-index:10;background:white;border:1px solid #e5e7eb;
          border-radius:50%;width:36px;height:36px;cursor:pointer;
          font-size:20px;display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 8px rgba(0,0,0,0.1);color:#374151;
        ">‹</button>

        <div id="storeVideosSlider" style="
          display:flex;overflow-x:auto;gap:16px;
          padding:4px 0 12px;scrollbar-width:none;
          -webkit-overflow-scrolling:touch;scroll-behavior:smooth;
        ">
          ${slides}
        </div>

        <button onclick="scrollVideos(1)" style="
          position:absolute;right:0;top:40%;transform:translateY(-50%);
          z-index:10;background:white;border:1px solid #e5e7eb;
          border-radius:50%;width:36px;height:36px;cursor:pointer;
          font-size:20px;display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 8px rgba(0,0,0,0.1);color:#374151;
        ">›</button>
      </div>

      <style>#storeVideosSlider::-webkit-scrollbar{display:none}</style>
    `;

    window.scrollVideos = function(dir) {
      const slider = document.getElementById('storeVideosSlider');
      if (slider) slider.scrollBy({ left: dir * 340, behavior: 'smooth' });
    };

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
      <div style="width:100%;aspect-ratio:16/9;
        border-radius:14px;overflow:hidden;background:#000;
        box-shadow:0 4px 16px rgba(0,0,0,0.12);">
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
      <blockquote
        class="instagram-media"
        data-instgrm-permalink="${url}"
        data-instgrm-version="14"
        style="
          background:#fff;border:0;border-radius:12px;
          box-shadow:0 0 1px 0 rgba(0,0,0,.5),0 1px 10px 0 rgba(0,0,0,.15);
          margin:0;padding:0;width:100%;min-width:280px;
        "
      ></blockquote>`;
  }

  return null;
}

/* ================================
   HIGHLIGHTS — DESTACADOS
================================ */

let _currentHighlight = null;
let _currentItemIndex = 0;

async function loadHighlights(storeId) {
  try {
    const res = await fetch(`/api/stores/${storeId}/highlights`);
    if (!res.ok) return;

    const highlights = await res.json();
    const section = document.getElementById('highlightsSection');
    const strip = document.getElementById('highlightsStrip');
    if (!section || !strip) return;

    const visible = isOwner
      ? highlights
      : highlights.filter(h => h.items && h.items.length > 0);

    if (!visible.length && !isOwner) return;

    section.style.display = 'block';
    strip.innerHTML = '';

    // círculo "+" para el dueño
    if (isOwner) {
      const addBtn = document.createElement('div');
      addBtn.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;flex-shrink:0;width:70px;';
      addBtn.onclick = openCreateHighlight;
      addBtn.innerHTML = `
        <div style="width:64px;height:64px;border-radius:50%;border:2px dashed #d1d5db;
          display:flex;align-items:center;justify-content:center;background:#f8fafc;transition:all 0.15s;"
          onmouseenter="this.style.borderColor='#ea580c';this.style.background='#fff7ed'"
          onmouseleave="this.style.borderColor='#d1d5db';this.style.background='#f8fafc'">
          <span style="font-size:26px;color:#9ca3af;">+</span>
        </div>
        <span style="font-size:11px;color:#9ca3af;font-weight:600;text-align:center;">Nuevo</span>
      `;
      strip.appendChild(addBtn);
    }

    // círculos existentes
    highlights.forEach(h => {
      if (!isOwner && (!h.items || !h.items.length)) return;

      const hasItems = h.items && h.items.length > 0;
      const coverImg = h.cover_url || (hasItems ? h.items[0].image_url : '');

      const circle = document.createElement('div');
      circle.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;flex-shrink:0;width:70px;';
      circle.onclick = () => openHighlightViewer(h);
      circle.innerHTML = `
        <div style="position:relative;">
          <div style="width:64px;height:64px;border-radius:50%;
            background:${coverImg ? `url('${coverImg}') center/cover no-repeat` : 'linear-gradient(135deg,#ea580c,#f97316)'};
            border:2.5px solid ${hasItems ? '#e5e7eb' : '#d1d5db'};
            box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:transform 0.15s;
            ${!hasItems ? 'opacity:0.5;' : ''}"
            onmouseenter="this.style.transform='scale(1.06)'"
            onmouseleave="this.style.transform='scale(1)'">
          </div>
          ${hasItems ? `<div style="position:absolute;bottom:1px;right:1px;background:#ea580c;color:white;
            font-size:9px;font-weight:800;padding:1px 5px;border-radius:999px;
            border:1.5px solid white;">${h.items.length}</div>` : ''}
        </div>
        <span style="font-size:11px;color:#374151;font-weight:600;text-align:center;
          width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${h.title}</span>
        ${isOwner ? `<button onclick="event.stopPropagation();deleteHighlight(${h.id})"
          style="background:none;border:none;font-size:10px;color:#dc2626;cursor:pointer;
          padding:0;line-height:1;">Eliminar</button>` : ''}
      `;
      strip.appendChild(circle);
    });

  } catch (err) {
    console.error('Error highlights:', err);
  }
}

function openHighlightViewer(highlight) {
  _currentHighlight = highlight;
  _currentItemIndex = 0;
  renderHighlightViewer();
}

function renderHighlightViewer() {
  const existing = document.getElementById('highlightViewerModal');
  if (existing) existing.remove();

  const h = _currentHighlight;
  if (!h) return;

  const items = h.items || [];
  const idx = _currentItemIndex;
  const item = items[idx];

  // registrar vista
  if (item) fetch(`/api/highlight-items/${item.id}/view`, { method: 'POST' }).catch(()=>{});

  const modal = document.createElement('div');
  modal.id = 'highlightViewerModal';
  modal.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    background:rgba(0,0,0,0.95);
    display:flex;flex-direction:column;
    overflow-y:auto;
  `;

  if (!items.length) {
    modal.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;text-align:center;padding:40px;">
        <div style="font-size:48px;margin-bottom:16px;">📷</div>
        <p style="font-size:16px;font-weight:700;margin-bottom:8px;">${h.title}</p>
        <p style="font-size:14px;color:rgba(255,255,255,0.5);">Todavía no hay fotos</p>
        ${isOwner ? `<label style="display:inline-block;margin-top:20px;background:linear-gradient(135deg,#ea580c,#f97316);color:white;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;">
          📷 Agregar primera foto
          <input type="file" accept="image/*" style="display:none;" onchange="uploadHighlightItem(${h.id},this)">
        </label>` : ''}
      </div>
      <button onclick="closeHighlightViewer()" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,0.15);border:none;border-radius:50%;width:36px;height:36px;color:white;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    modal.onclick = (e) => { if (e.target === modal) closeHighlightViewer(); };
    return;
  }

  const dots = items.map((_, i) => `
    <div onclick="navHighlight(${i - idx})" style="
      width:${i===idx?'20px':'6px'};height:6px;border-radius:999px;cursor:pointer;
      background:${i===idx?'white':'rgba(255,255,255,0.35)'};transition:all 0.2s;
    "></div>
  `).join('');

  modal.innerHTML = `
    <!-- HEADER -->
    <div style="position:sticky;top:0;z-index:10;padding:14px 18px;display:flex;align-items:center;
      justify-content:space-between;background:linear-gradient(to bottom,rgba(0,0,0,0.85),transparent);">
      <div style="display:flex;align-items:center;gap:10px;">
        <div>
          <div style="color:white;font-size:15px;font-weight:700;">${h.title}</div>
          <div style="color:rgba(255,255,255,0.5);font-size:12px;">${idx+1} / ${items.length}</div>
        </div>
        ${isOwner ? `<button onclick="openEditHighlightTitle(${h.id}, this)" data-title="${h.title}"
          style="background:rgba(255,255,255,0.12);border:none;border-radius:8px;
            color:rgba(255,255,255,0.75);font-size:11px;font-weight:600;padding:5px 10px;cursor:pointer;">
          ✏️ Renombrar
        </button>` : ''}
      </div>
      <button onclick="closeHighlightViewer()" style="background:rgba(255,255,255,0.12);border:none;
        border-radius:50%;width:36px;height:36px;color:white;font-size:18px;cursor:pointer;
        display:flex;align-items:center;justify-content:center;flex-shrink:0;">✕</button>
    </div>

    <!-- IMAGEN -->
    <div style="display:flex;align-items:center;justify-content:center;padding:0 44px;flex:1;">
      <div style="position:relative;max-width:500px;width:100%;">
        <img src="${item.image_url}" style="width:100%;max-height:55vh;object-fit:contain;border-radius:16px;display:block;"/>
        ${idx > 0 ? `<button onclick="navHighlight(-1)" style="position:absolute;left:-40px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.12);border:none;border-radius:50%;width:34px;height:34px;color:white;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;">‹</button>` : ''}
        ${idx < items.length-1 ? `<button onclick="navHighlight(1)" style="position:absolute;right:-40px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.12);border:none;border-radius:50%;width:34px;height:34px;color:white;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;">›</button>` : ''}
      </div>
    </div>

    <!-- CAPTION + DOTS -->
    ${item.caption ? `<p style="text-align:center;color:rgba(255,255,255,0.85);font-size:14px;padding:10px 24px 4px;line-height:1.5;">${item.caption}</p>` : ''}
    <div style="display:flex;gap:5px;align-items:center;justify-content:center;padding:10px 0 14px;">${dots}</div>

    <!-- ACCIONES DUEÑO -->
    ${isOwner ? `
      <div style="display:flex;gap:8px;justify-content:center;padding:0 16px 14px;flex-wrap:wrap;">
        <label style="background:rgba(255,255,255,0.12);color:white;padding:8px 14px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;">
          🔄 Cambiar foto
          <input type="file" accept="image/*" style="display:none;" onchange="replaceHighlightItemPhoto(${item.id},this)">
        </label>
        <label style="background:rgba(255,255,255,0.12);color:white;padding:8px 14px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;">
          + Agregar foto
          <input type="file" accept="image/*" style="display:none;" onchange="uploadHighlightItem(${h.id},this)">
        </label>
        <button onclick="deleteHighlightItem(${item.id})" style="background:rgba(220,38,38,0.2);border:1px solid rgba(220,38,38,0.35);color:#fca5a5;padding:8px 14px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;">
          🗑 Eliminar foto
        </button>
      </div>
    ` : ''}

    <!-- REACCIONES -->
    <div style="background:rgba(255,255,255,0.06);border-top:1px solid rgba(255,255,255,0.1);padding:16px 20px;">
      <div id="hlReactionsBar" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:4px;">
        <div style="color:rgba(255,255,255,0.4);font-size:13px;">Cargando...</div>
      </div>
    </div>

    <!-- COMENTARIOS -->
    <div style="background:rgba(0,0,0,0.3);padding:16px 20px 24px;">
      <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.6);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.06em;">
        💬 Comentarios
      </div>
      <div id="hlCommentsList" style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;">
        <div style="color:rgba(255,255,255,0.3);font-size:13px;">Cargando...</div>
      </div>
      ${currentUser ? `
        <div style="display:flex;gap:8px;align-items:flex-end;">
          <img src="${currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=ea580c&color=fff`}"
            style="width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;margin-bottom:2px;">
          <div style="flex:1;background:rgba(255,255,255,0.1);border-radius:14px;padding:2px 4px 2px 12px;display:flex;align-items:center;gap:8px;">
            <input id="hlCommentInput" placeholder="Comentá..." maxlength="200"
              style="flex:1;background:none;border:none;outline:none;color:white;font-size:14px;padding:9px 0;font-family:inherit;"
              onkeydown="if(event.key==='Enter')submitHlComment(${item.id})">
            <button onclick="submitHlComment(${item.id})" style="background:linear-gradient(135deg,#ea580c,#f97316);border:none;border-radius:10px;color:white;font-weight:700;font-size:12px;padding:7px 12px;cursor:pointer;flex-shrink:0;">
              Enviar
            </button>
          </div>
        </div>
      ` : `<p style="font-size:13px;color:rgba(255,255,255,0.4);text-align:center;">
          <a href="/login" style="color:#f97316;font-weight:600;">Iniciá sesión</a> para comentar
        </p>`}
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  modal.addEventListener('click', (e) => { if (e.target === modal) closeHighlightViewer(); });

  // cargar reacciones y comentarios
  loadItemInteractions(item.id);
}
window.navHighlight = function(dir) {
  const items = _currentHighlight?.items || [];
  const newIdx = _currentItemIndex + dir;
  if (newIdx >= 0 && newIdx < items.length) {
    _currentItemIndex = newIdx;
    renderHighlightViewer();
  }
};

window.closeHighlightViewer = function() {
  const m = document.getElementById('highlightViewerModal');
  if (m) { m.style.opacity='0'; m.style.transition='opacity 0.2s'; setTimeout(()=>m.remove(),200); }
  document.body.style.overflow = '';
  _currentHighlight = null;
  _currentItemIndex = 0;
}

function openCreateHighlight() {
  const existing = document.getElementById('createHighlightModal');
  if (existing) existing.remove();

  const ICONS = [
    { key: 'camera', label: 'Fotos', svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />` },
    { key: 'star', label: 'Destacado', svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />` },
    { key: 'menu', label: 'Menú', svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5A2.25 2.25 0 0012.75 4.5h-1.5A2.25 2.25 0 009 6.75v1.5M3 13.125c0-.621.504-1.125 1.125-1.125h15.75c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 19.875v-6.75z" />` },
    { key: 'bag', label: 'Productos', svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />` },
    { key: 'users', label: 'Clientes', svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />` },
    { key: 'pin', label: 'Ubicación', svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />` },
    { key: 'calendar', label: 'Eventos', svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />` },
    { key: 'bolt', label: 'Ofertas', svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />` },
    { key: 'briefcase', label: 'Servicios', svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />` },
    { key: 'box', label: 'Catálogo', svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />` },
    { key: 'store', label: 'Local', svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 2.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />` },
    { key: 'heart', label: 'Favoritos', svg: `<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />` },
  ];

  const modal = document.createElement('div');
  modal.id = 'createHighlightModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;padding:16px;';

  modal.innerHTML = `
    <div style="background:white;border-radius:24px;padding:28px;width:100%;max-width:420px;
      box-shadow:0 20px 60px rgba(0,0,0,0.2);animation:hlModalIn 0.2s ease;">
      <style>@keyframes hlModalIn{from{opacity:0;transform:scale(0.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}</style>

      <h3 style="font-size:17px;font-weight:800;color:#111827;margin:0 0 6px;">Nuevo destacado</h3>
      <p style="font-size:13px;color:#9ca3af;margin:0 0 20px;">Creá una colección de fotos para tu perfil</p>

      <div style="margin-bottom:18px;">
        <label style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:10px;">Ícono</label>
        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;">
          ${ICONS.map((icon, i) => `
            <button type="button" data-icon-key="${icon.key}" onclick="selectHighlightIcon(this)" title="${icon.label}" style="
              width:100%;aspect-ratio:1;border-radius:12px;cursor:pointer;
              border:2px solid ${i===0?'#ea580c':'#e5e7eb'};
              background:${i===0?'#fff7ed':'white'};
              display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
              transition:all 0.15s;padding:8px 4px;
              color:${i===0?'#ea580c':'#6b7280'};
            ">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                ${icon.svg}
              </svg>
              <span style="font-size:9px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;text-align:center;">${icon.label}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div style="margin-bottom:24px;">
        <label style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:8px;">Nombre</label>
        <input id="hlTitleInput" type="text" placeholder="ej: Menú, Fotos del local, Clientes..."
          maxlength="30"
          style="width:100%;padding:12px 16px;border:1.5px solid #e5e7eb;border-radius:14px;
            font-size:15px;font-family:inherit;outline:none;box-sizing:border-box;transition:border-color 0.15s;"
          onfocus="this.style.borderColor='#ea580c'"
          onblur="this.style.borderColor='#e5e7eb'"/>
        <div style="font-size:11px;color:#9ca3af;margin-top:5px;text-align:right;">
          <span id="hlCharCount">0</span>/30
        </div>
      </div>

      <div style="display:flex;gap:10px;">
        <button onclick="document.getElementById('createHighlightModal').remove()"
          style="flex:1;padding:13px;border:1.5px solid #e5e7eb;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;background:white;color:#374151;">
          Cancelar
        </button>
        <button id="hlCreateBtn" onclick="confirmCreateHighlight()"
          style="flex:2;padding:13px;border:none;border-radius:14px;font-size:14px;font-weight:700;cursor:pointer;color:white;
            background:linear-gradient(135deg,#ea580c,#f97316);box-shadow:0 4px 14px rgba(234,88,12,0.3);">
          Crear destacado →
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  window._selectedHighlightIcon = ICONS[0].key;

  const input = document.getElementById('hlTitleInput');
  input.focus();
  input.addEventListener('input', () => {
    document.getElementById('hlCharCount').textContent = input.value.length;
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirmCreateHighlight(); });
}

window.selectHighlightIcon = function(btn) {
  document.querySelectorAll('#createHighlightModal [data-icon-key]').forEach(b => {
    b.style.border = '2px solid #e5e7eb';
    b.style.background = 'white';
    b.style.color = '#6b7280';
  });
  btn.style.border = '2px solid #ea580c';
  btn.style.background = '#fff7ed';
  btn.style.color = '#ea580c';
  window._selectedHighlightIcon = btn.dataset.iconKey;
};

window.confirmCreateHighlight = function() {
  const input = document.getElementById('hlTitleInput');
  const title = input?.value.trim();
  if (!title) {
    input.style.borderColor = '#dc2626';
    input.placeholder = 'El nombre es obligatorio';
    setTimeout(() => { input.style.borderColor = '#e5e7eb'; }, 1500);
    return;
  }

  const btn = document.getElementById('hlCreateBtn');
  btn.textContent = 'Creando...';
  btn.disabled = true;

  fetch('/api/highlights', {
    method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  })
  .then(r => r.json())
  .then(d => {
    if (d.error) { showToast(d.error, 'error'); btn.textContent = 'Crear destacado →'; btn.disabled = false; return; }
    document.getElementById('createHighlightModal')?.remove();
    showToast('Destacado creado', 'success');
    loadHighlights(storeData.id);
  })
  .catch(() => { showToast('Error de conexión', 'error'); btn.textContent = 'Crear destacado →'; btn.disabled = false; });
};
window.uploadHighlightItem = async function(highlightId, inputEl) {
  const file = inputEl.files[0];
  if (!file) return;

  // preview URL
  const previewUrl = URL.createObjectURL(file);

  const existing = document.getElementById('uploadHighlightModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'uploadHighlightModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:16px;';

  modal.innerHTML = `
    <div style="background:white;border-radius:24px;padding:24px;width:100%;max-width:420px;
      box-shadow:0 20px 60px rgba(0,0,0,0.25);animation:hlModalIn 0.2s ease;">

      <h3 style="font-size:16px;font-weight:800;color:#111827;margin:0 0 18px;">Agregar foto al destacado</h3>

      <!-- Preview -->
      <div style="width:100%;aspect-ratio:1;border-radius:16px;overflow:hidden;
        background:#f1f5f9;margin-bottom:18px;position:relative;">
        <img src="${previewUrl}" style="width:100%;height:100%;object-fit:cover;display:block;"/>
      </div>

      <!-- Caption -->
      <div style="margin-bottom:22px;">
        <label style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;
          letter-spacing:0.05em;display:block;margin-bottom:8px;">Caption <span style="color:#d1d5db;font-weight:400;">(opcional)</span></label>
        <textarea id="hlCaptionInput" placeholder="Describí la foto..."
          rows="2" maxlength="150"
          style="width:100%;padding:12px 16px;border:1.5px solid #e5e7eb;border-radius:14px;
            font-size:14px;font-family:inherit;outline:none;resize:none;box-sizing:border-box;
            transition:border-color 0.15s;line-height:1.5;"
          onfocus="this.style.borderColor='#ea580c'"
          onblur="this.style.borderColor='#e5e7eb'"
        ></textarea>
        <div style="font-size:11px;color:#9ca3af;margin-top:4px;text-align:right;">
          <span id="captionCount">0</span>/150
        </div>
      </div>

      <!-- Botones -->
      <div style="display:flex;gap:10px;">
        <button onclick="document.getElementById('uploadHighlightModal').remove()"
          style="flex:1;padding:13px;border:1.5px solid #e5e7eb;border-radius:14px;
            font-size:14px;font-weight:700;cursor:pointer;background:white;color:#374151;">
          Cancelar
        </button>
        <button id="hlUploadBtn" onclick="confirmUploadHighlightItem(${highlightId})"
          style="flex:2;padding:13px;border:none;border-radius:14px;
            font-size:14px;font-weight:700;cursor:pointer;color:white;
            background:linear-gradient(135deg,#ea580c,#f97316);
            box-shadow:0 4px 14px rgba(234,88,12,0.3);">
          📷 Subir foto
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  // guardar referencia al archivo
  window._pendingHighlightFile = file;

  document.getElementById('hlCaptionInput').addEventListener('input', function() {
    document.getElementById('captionCount').textContent = this.value.length;
  });
};

window.confirmUploadHighlightItem = async function(highlightId) {
  const file = window._pendingHighlightFile;
  if (!file) return;

  const caption = document.getElementById('hlCaptionInput')?.value.trim() || '';
  const btn = document.getElementById('hlUploadBtn');
  btn.textContent = 'Subiendo...';
  btn.disabled = true;

  const fd = new FormData();
  fd.append('image', file);
  if (caption) fd.append('caption', caption);

  try {
    const res = await fetch(`/api/highlights/${highlightId}/items`, {
      method: 'POST', credentials: 'include', body: fd
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Error', 'error'); btn.textContent = '📷 Subir foto'; btn.disabled = false; return; }

    document.getElementById('uploadHighlightModal')?.remove();
    showToast('Foto agregada', 'success');
    window._pendingHighlightFile = null;

    const hlRes = await fetch(`/api/stores/${storeData.id}/highlights`);
    const highlights = await hlRes.json();
    const updated = highlights.find(h => h.id === highlightId);
    if (updated) {
      _currentHighlight = updated;
      _currentItemIndex = updated.items.length - 1;
      renderHighlightViewer();
    }
    loadHighlights(storeData.id);
  } catch {
    showToast('Error de conexión', 'error');
    btn.textContent = '📷 Subir foto';
    btn.disabled = false;
  }
};

window.deleteHighlightItem = async function(itemId) {
  if (!confirm('¿Eliminar esta foto?')) return;
  try {
    await fetch(`/api/highlight-items/${itemId}`, { method: 'DELETE', credentials: 'include' });
    showToast('Foto eliminada', 'success');
    const hlRes = await fetch(`/api/stores/${storeData.id}/highlights`);
    const highlights = await hlRes.json();
    const updated = highlights.find(h => h.id === _currentHighlight?.id);
    if (updated && updated.items.length > 0) {
      _currentHighlight = updated;
      _currentItemIndex = Math.min(_currentItemIndex, updated.items.length - 1);
      renderHighlightViewer();
    } else {
      closeHighlightViewer();
    }
    loadHighlights(storeData.id);
  } catch { showToast('Error eliminando', 'error'); }
};

window.deleteHighlight = async function(id) {
  if (!confirm('¿Eliminar este destacado y todas sus fotos?')) return;
  try {
    await fetch(`/api/highlights/${id}`, { method: 'DELETE', credentials: 'include' });
    showToast('Destacado eliminado', 'success');
    loadHighlights(storeData.id);
  } catch { showToast('Error', 'error'); }
};
/* ================================
   HIGHLIGHT — INTERACCIONES
================================ */

const HL_EMOJIS = ['🔥','❤️','👏','😍','🤤'];

async function loadItemInteractions(itemId) {
  try {
    const [reactRes, commRes] = await Promise.all([
      fetch(`/api/highlight-items/${itemId}/reactions`),
      fetch(`/api/highlight-items/${itemId}/comments`)
    ]);
    const reactions = reactRes.ok ? await reactRes.json() : [];
    const comments  = commRes.ok  ? await commRes.json()  : [];

    renderReactionsBar(reactions, itemId);
    renderCommentsList(comments, itemId);
  } catch(e) { console.error(e); }
}

function renderReactionsBar(reactions, itemId) {
  const bar = document.getElementById('hlReactionsBar');
  if (!bar) return;

  // contar por emoji
  const countMap = {};
  reactions.forEach(r => { countMap[r.emoji] = (countMap[r.emoji]||0) + r.count; });

  const userEmoji = reactions.find(r => r.user_emoji)?.user_emoji || null;

  bar.innerHTML = HL_EMOJIS.map(e => {
    const count = countMap[e] || 0;
    const isActive = userEmoji === e;
    return `
      <button onclick="reactToHlItem(${itemId},'${e}')" style="
        display:flex;align-items:center;gap:5px;
        background:${isActive ? 'rgba(234,88,12,0.25)' : 'rgba(255,255,255,0.08)'};
        border:1px solid ${isActive ? 'rgba(234,88,12,0.5)' : 'rgba(255,255,255,0.12)'};
        border-radius:999px;padding:6px 12px;cursor:pointer;
        font-size:18px;transition:all 0.15s;
      ">
        ${e}
        ${count > 0 ? `<span style="font-size:12px;font-weight:700;color:${isActive?'#f97316':'rgba(255,255,255,0.7)'};">${count}</span>` : ''}
      </button>
    `;
  }).join('');
}

function renderCommentsList(comments, itemId) {
  const list = document.getElementById('hlCommentsList');
  if (!list) return;

  if (!comments.length) {
    list.innerHTML = `<p style="color:rgba(255,255,255,0.35);font-size:13px;text-align:center;padding:8px 0;">Sé el primero en comentar</p>`;
    return;
  }

  list.innerHTML = comments.map(c => {
    const isMine = currentUser && String(currentUser.id) === String(c.user_id);
    const avatar = c.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=374151&color=fff`;
    const time = new Date(c.created_at).toLocaleString('es-AR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
    return `
      <div style="display:flex;gap:9px;align-items:flex-start;">
        <img src="${avatar}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;flex-shrink:0;margin-top:2px;">
        <div style="flex:1;background:rgba(255,255,255,0.08);border-radius:12px;padding:9px 12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:3px;">
            <span style="font-size:12px;font-weight:700;color:white;">${c.name}</span>
            <span style="font-size:10px;color:rgba(255,255,255,0.35);">${time}</span>
          </div>
          <p style="font-size:13px;color:rgba(255,255,255,0.85);margin:0;line-height:1.5;">${c.content}</p>
          ${isMine ? `<button onclick="deleteHlComment(${c.id},${itemId})"
            style="background:none;border:none;color:rgba(220,38,38,0.7);font-size:11px;cursor:pointer;margin-top:4px;padding:0;">
            Eliminar
          </button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

window.reactToHlItem = async function(itemId, emoji) {
  if (!currentUser) { window.location.href = '/login'; return; }
  try {
    await fetch(`/api/highlight-items/${itemId}/react`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji })
    });
    const reactRes = await fetch(`/api/highlight-items/${itemId}/reactions`);
    const reactions = await reactRes.json();
    renderReactionsBar(reactions, itemId);
  } catch(e) { showToast('Error', 'error'); }
};

window.submitHlComment = async function(itemId) {
  const input = document.getElementById('hlCommentInput');
  const content = input?.value.trim();
  if (!content) return;
  input.value = '';
  try {
    const res = await fetch(`/api/highlight-items/${itemId}/comments`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (!res.ok) { showToast('Error', 'error'); return; }
    const commRes = await fetch(`/api/highlight-items/${itemId}/comments`);
    const comments = await commRes.json();
    renderCommentsList(comments, itemId);
    // scroll al final
    const list = document.getElementById('hlCommentsList');
    if (list) list.scrollTop = list.scrollHeight;
  } catch(e) { showToast('Error de conexión', 'error'); }
};

window.deleteHlComment = async function(commentId, itemId) {
  if (!confirm('¿Eliminar comentario?')) return;
  try {
    await fetch(`/api/highlight-comments/${commentId}`, { method: 'DELETE', credentials: 'include' });
    const commRes = await fetch(`/api/highlight-items/${itemId}/comments`);
    const comments = await commRes.json();
    renderCommentsList(comments, itemId);
  } catch(e) { showToast('Error', 'error'); }
};

window.openEditHighlightTitle = function(highlightId, btn) {
  const currentTitle = btn.dataset.title || '';
  const clean = currentTitle.replace(/^[\p{Emoji}\s]+/u, '').trim();

  const modal = document.createElement('div');
  modal.id = 'editHlTitleModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:16px;';
  modal.innerHTML = `
    <div style="background:white;border-radius:20px;padding:24px;width:100%;max-width:360px;">
      <h3 style="font-size:16px;font-weight:800;color:#111827;margin:0 0 16px;">Renombrar destacado</h3>
      <input id="editHlTitleInput" value="${clean}" maxlength="30"
        style="width:100%;padding:12px 14px;border:1.5px solid #e5e7eb;border-radius:12px;
          font-size:15px;font-family:inherit;outline:none;box-sizing:border-box;"
        onfocus="this.style.borderColor='#ea580c'"
        onblur="this.style.borderColor='#e5e7eb'">
      <div style="display:flex;gap:8px;margin-top:16px;">
        <button onclick="document.getElementById('editHlTitleModal').remove()"
          style="flex:1;padding:11px;border:1.5px solid #e5e7eb;border-radius:11px;font-size:14px;font-weight:600;cursor:pointer;background:white;">
          Cancelar
        </button>
        <button onclick="confirmEditHlTitle(${highlightId})"
          style="flex:2;padding:11px;border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;color:white;background:linear-gradient(135deg,#ea580c,#f97316);">
          Guardar
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  const input = document.getElementById('editHlTitleInput');
  input.focus();
  input.select();
  input.onkeydown = (e) => { if (e.key === 'Enter') confirmEditHlTitle(highlightId); };
};

window.confirmEditHlTitle = async function(highlightId) {
  const input = document.getElementById('editHlTitleInput');
  const title = input?.value.trim();
  if (!title) return;

  try {
    const res = await fetch(`/api/highlights/${highlightId}/title`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    if (!res.ok) { showToast('Error', 'error'); return; }
    document.getElementById('editHlTitleModal')?.remove();
    showToast('Nombre actualizado', 'success');
    if (_currentHighlight) _currentHighlight.title = title;
    loadHighlights(storeData.id);
  } catch(e) { showToast('Error', 'error'); }
};

window.replaceHighlightItemPhoto = async function(itemId, input) {
  const file = input.files[0];
  if (!file) return;
  const previewUrl = URL.createObjectURL(file);

  const modal = document.createElement('div');
  modal.id = 'replacePhotoModal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:16px;';
  modal.innerHTML = `
    <div style="background:white;border-radius:20px;padding:22px;width:100%;max-width:380px;">
      <h3 style="font-size:15px;font-weight:800;color:#111827;margin:0 0 14px;">Reemplazar foto</h3>
      <img src="${previewUrl}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:14px;margin-bottom:16px;">
      <div style="display:flex;gap:8px;">
        <button onclick="document.getElementById('replacePhotoModal').remove()"
          style="flex:1;padding:11px;border:1.5px solid #e5e7eb;border-radius:11px;font-size:14px;font-weight:600;cursor:pointer;background:white;">
          Cancelar
        </button>
        <button id="confirmReplaceBtn" onclick="confirmReplacePhoto(${itemId})"
          style="flex:2;padding:11px;border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;color:white;background:linear-gradient(135deg,#ea580c,#f97316);">
          Reemplazar
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  window._replacePhotoFile = file;
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
};

window.confirmReplacePhoto = async function(itemId) {
  const file = window._replacePhotoFile;
  if (!file) return;
  const btn = document.getElementById('confirmReplaceBtn');
  btn.textContent = 'Subiendo...'; btn.disabled = true;

  const fd = new FormData();
  fd.append('image', file);
  try {
    const res = await fetch(`/api/highlight-items/${itemId}`, {
      method: 'PUT', credentials: 'include', body: fd
    });
    if (!res.ok) { showToast('Error', 'error'); return; }
    document.getElementById('replacePhotoModal')?.remove();
    showToast('Foto reemplazada', 'success');
    window._replacePhotoFile = null;
    const hlRes = await fetch(`/api/stores/${storeData.id}/highlights`);
    const highlights = await hlRes.json();
    const updated = highlights.find(hh => hh.id === _currentHighlight?.id);
    if (updated) { _currentHighlight = updated; renderHighlightViewer(); }
    loadHighlights(storeData.id);
  } catch(e) { showToast('Error de conexión', 'error'); }
};
