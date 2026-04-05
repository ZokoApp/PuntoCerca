// store.js

let currentUser = null;
let isOwner = false;
let storeData = null;

const storeId = window.location.pathname.split("/").pop();

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

  } catch (err){
    console.log("Usuario no logueado");
  }
}

/* ================================
   STORE
================================ */

async function loadStore(){

  try {

    const res = await fetch(`/api/stores/${storeId}`);
    const store = await res.json();

    storeData = store;

    // 🔐 detectar dueño
    if(currentUser && store.user_id === currentUser.id){
      isOwner = true;
    }

    renderStore(store);
    setupMap(store);
    handleUIByRole(store);

    // ✅ NUEVO: verificar si sigue la tienda
    if(currentUser && !isOwner){
      checkFollowing(store.id);
    }

  } catch (err){
    console.error("Error cargando tienda", err);
  }
}

/* ================================
   UI SEGÚN ROL
================================ */

function handleUIByRole(store){

  const addBtn = document.getElementById("addProductBtn");
  const whatsappBtn = document.getElementById("whatsappBtn");
  const mapBtn = document.getElementById("mapButton");
  const followBtn = document.getElementById("followBtn");
  const editBtn = document.getElementById("editStoreBtn");

  if(isOwner){

    // MOSTRAR NAV DE DUEÑO
const ownerActions = document.getElementById("ownerActions");

if(ownerActions){
  ownerActions.style.display = "flex";
}

const logoutBtn = document.getElementById("logoutBtn");

if(logoutBtn){
  logoutBtn.addEventListener("click", async () => {

    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include"  
      });

      window.location.href = "/";

    } catch {
      alert("Error cerrando sesión");
    }

  });
}



    //  OCULTAR botones de visitante
    if(whatsappBtn) whatsappBtn.style.display = "none";
    if(mapBtn) mapBtn.style.display = "none";
    if(followBtn) followBtn.style.display = "none";

  
    

  } else {

    // 👤 VISITANTE

    if(addBtn) addBtn.style.display = "none";
    if(editBtn) editBtn.style.display = "none";

    if(whatsappBtn){

  whatsappBtn.style.display = "inline-block";

  if(currentUser){

    // ✅ usuario logueado → comportamiento normal
    if(store.phone){
      whatsappBtn.href = `https://wa.me/${store.phone.replace(/\D/g,'')}`;
    }

  } else {

    // 🚫 NO logueado → bloquear y forzar login
    whatsappBtn.href = "#";

    whatsappBtn.addEventListener("click", (e) => {
      e.preventDefault();

      alert("Tenés que iniciar sesión para contactar con la tienda");

      // opcional: redirigir
      window.location.href = "/login";
    });

  }
}
    if(mapBtn){
      mapBtn.style.display = "inline-block";

      mapBtn.addEventListener("click", () => {
        document.getElementById("storeMap").scrollIntoView({
          behavior:'smooth'
        });
      });

    }
    

    if(followBtn){
  if(currentUser){
    followBtn.style.display = "inline-block";

    followBtn.onclick = async () => {
  try {

    if (followBtn.innerText === "Siguiendo") {
      const res = await fetch(`/api/follow/${store.id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!res.ok) throw new Error();

      followBtn.innerText = "Seguir";

    } else {
      const res = await fetch(`/api/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ store_id: store.id })
      });

      if (!res.ok) throw new Error();

      followBtn.innerText = "Siguiendo";
    }

  } catch (err) {
    console.error("Error siguiendo/dejando de seguir tienda:", err);
  }
};
  } else {
    followBtn.style.display = "none";
  }
}

    
  }
}



async function checkFollowing(storeId) {
  try {
    const res = await fetch(`/api/is-following/${storeId}`, {
      credentials: "include"
    });

    if (!res.ok) return;

    const data = await res.json();

    const btn = document.getElementById("followBtn");
    if (!btn) return;

    if (data.following) {
      btn.innerText = "Siguiendo";
    } else {
      btn.innerText = "Seguir";
    }

  } catch (err) {
    console.error("Error verificando follow:", err);
  }
}

/* ================================
   MAPA
================================ */

function setupMap(store){

  const lat = store.lat || -34.6037; // fallback
  const lng = store.lng || -58.3816;

  const map = L.map('storeMap').setView([lat, lng], 16);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & Carto',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);
  L.marker([lat, lng])
    .addTo(map)
    .bindPopup(store.name)
    .openPopup();

  // 🔥 FIX típico leaflet
  setTimeout(() => {
    map.invalidateSize();
  }, 300);
}

/* ================================
   RENDER
================================ */

function renderStore(store){

  if(store.error){
    alert("Tienda no encontrada");
    return;
  }

  // COVER
  const cover = document.getElementById("storeCover");
  if(store.cover_url){
    cover.style.backgroundImage = `url('${store.cover_url}')`;
  } else {
    cover.style.background = "linear-gradient(135deg,#ff6a00,#ff8c42)";
  }

  // LOGO
  if(store.logo_url){
    document.getElementById("storeLogo").style.backgroundImage =
      `url('${store.logo_url}')`;
  }

  // INFO
  document.getElementById("storeName").innerText = store.name;
  document.getElementById("storeCategory").innerText = store.category || "";
  document.getElementById("storeAddress").innerText =
  store.street || "Sin dirección";

  document.getElementById("storeDescription").innerText =
    store.description || "";

  document.getElementById("storeStats").innerText =
    `⭐ ${store.rating_avg || 0} (${store.rating_count || 0}) • 👁 ${store.views || 0} visitas`;

  // seguidores
  fetch(`/api/store-followers/${storeId}`)
    .then(res => res.json())
    .then(data => {
      const stats = document.getElementById("storeStats");
      stats.innerText += ` • ${data.count} seguidores`;
    });

}