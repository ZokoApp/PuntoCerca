import {
  isStoreOpen,
  getStoreStatusInfo
} from "/js/utils/store-status.js";

const map = L.map("mapFull", {
  zoomControl:true
}).setView([-32.95, -60.66], 13);

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  {
    maxZoom:19
  }
).addTo(map);

const preview = document.getElementById("storePreview");

let userMarker = null;

/* =========================
   USER LOCATION
========================= */

if (navigator.geolocation) {

  navigator.geolocation.watchPosition((pos) => {

    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    if (!userMarker) {

      userMarker = L.circleMarker([lat, lng], {
        radius:10,
        fillColor:"#2563eb",
        color:"#fff",
        weight:3,
        opacity:1,
        fillOpacity:1
      }).addTo(map);

      map.setView([lat, lng], 14);

    } else {
      userMarker.setLatLng([lat, lng]);
    }

  });

}

/* =========================
   CLOSE CARD
========================= */

map.on("click", () => {
  preview.classList.remove("active");
});

/* =========================
   LIVE BAR RANDOM
========================= */

const liveBar = document.getElementById("liveBar");

setInterval(() => {

  const n = Math.floor(Math.random() * 25) + 5;

  liveBar.innerHTML =
    `🔥 ${n} personas explorando esta zona`;

}, 7000);

/* =========================
   LOAD STORES
========================= */

async function loadMapStores(){

  try{

    const res = await fetch("/api/stores");
    const stores = await res.json();

    stores.forEach(store => {

      if(!store.lat || !store.lng) return;

      const open = isStoreOpen(store);

      const icon = L.divIcon({
        className:"",
        html:`

        <div class="marker-wrapper">

          ${
            open
            ? `<div class="marker-pulse open-pulse"></div>`
            : `<div class="marker-pulse closed-pulse"></div>`
          }

          <div class="marker-pin ${open ? "open-border" : "closed-border"}">

            <img src="${store.logo_url || "/img/default.png"}">

          </div>

        </div>
        `,
        iconSize:[58,58],
        iconAnchor:[29,58]
      });

      const marker = L.marker(
        [store.lat, store.lng],
        { icon }
      ).addTo(map);

      marker.on("click", (e) => {

        L.DomEvent.stopPropagation(e);

        showPreview(store);

      });

    });

  }catch(err){
    console.error(err);
  }

}

/* =========================
   CARD
========================= */

function showPreview(store){

  const status = getStoreStatusInfo(store);

  preview.innerHTML = `

  <div style="
    background:white;
    border-radius:24px;
    overflow:hidden;
    box-shadow:0 20px 40px rgba(0,0,0,0.25);
  ">

    <!-- COVER -->
    <div style="
      height:160px;
      background:url('${store.cover_url || "/img/hero.png"}') center/cover;
      position:relative;
    ">

      <div style="
        position:absolute;
        top:12px;
        left:12px;
        background:${status.color};
        color:white;
        padding:6px 12px;
        border-radius:999px;
        font-size:12px;
        font-weight:700;
      ">
        ${status.text}
      </div>

    </div>

    <!-- BODY -->
    <div style="padding:16px;">

      <div style="
        display:flex;
        gap:12px;
        align-items:center;
      ">

        <img
          src="${store.logo_url || "/img/default.png"}"
          style="
            width:64px;
            height:64px;
            border-radius:18px;
            object-fit:cover;
            box-shadow:0 5px 12px rgba(0,0,0,0.15);
          "
        >

        <div>

          <div style="
            font-size:20px;
            font-weight:800;
            color:#111827;
          ">
            ${store.name}
          </div>

          <div style="
            color:#6b7280;
            font-size:14px;
            margin-top:3px;
          ">
            ${store.category || ""}
          </div>

        </div>

      </div>

      <!-- ADDRESS -->
      <div style="
        margin-top:14px;
        font-size:14px;
        color:#4b5563;
        line-height:1.5;
      ">
        📍 ${store.street || "Sin dirección"}
      </div>

      <!-- RATING -->
      <div style="
        margin-top:10px;
        font-size:14px;
        color:#111827;
        font-weight:600;
      ">
        ⭐ ${store.rating_avg || "0"} (${store.rating_count || 0})
      </div>

      <!-- BUTTONS -->
      <div style="
        display:flex;
        gap:10px;
        margin-top:18px;
      ">

        <a
          href="/${store.slug}"
          class="card-btn btn-primary"
        >
          Ver tienda
        </a>

        <a
          href="https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}"
          target="_blank"
          class="card-btn btn-secondary"
        >
          Cómo llegar
        </a>

      </div>

    </div>

  </div>
  `;

  preview.classList.add("active");

}

/* =========================
   START
========================= */

loadMapStores();
