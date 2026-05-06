import { isStoreOpen } from "/js/store.js";
import { getStoreStatusInfo } from "/js/store.js";

const map = L.map("mapFull").setView([-32.95, -60.66], 13);

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  {
    maxZoom: 19
  }
).addTo(map);

const preview = document.getElementById("storePreview");
const previewContent = document.getElementById("storePreviewContent");
const closePreviewBtn = document.getElementById("closePreview");

// 🔥 cerrar tocando mapa
map.on("click", () => {
  closePreview();
});

// 🔥 cerrar botón
closePreviewBtn.addEventListener("click", closePreview);

function closePreview(){
  preview.classList.remove("active");
}

// 📍 cargar tiendas
async function loadMapStores(){

  try{

    const res = await fetch("/api/stores");
    const stores = await res.json();

    stores.forEach(store => {

      if (!store.lat || !store.lng) return;

      const isOpen = isStoreOpen(store);

      const icon = L.divIcon({
        className: "",
        html: `
          <div class="marker-pin ${isOpen ? "open-border" : "closed-border"}">
            <img src="${store.logo_url || "/img/default.png"}">
          </div>
        `,
        iconSize:[48,48],
        iconAnchor:[24,48]
      });

      const marker = L.marker(
        [store.lat, store.lng],
        { icon }
      ).addTo(map);

      marker.on("click", (e) => {

        // 🔥 evita que el mapa cierre instantáneamente
        L.DomEvent.stopPropagation(e);

        showPreview(store);
      });

    });

  } catch(err){
    console.error(err);
  }
}

function showPreview(store){

  const status = getStoreStatusInfo(store);

  const googleMapsUrl =
    `https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`;

  previewContent.innerHTML = `

    <!-- COVER -->
    <div style="
      height:160px;
      background:url('${store.cover_url || "/img/hero.png"}') center/cover;
      position:relative;
    ">

      <div style="
        position:absolute;
        left:14px;
        top:14px;
        background:${status.color};
        color:white;
        padding:6px 12px;
        border-radius:999px;
        font-size:12px;
        font-weight:600;
      ">
        ${status.text}
      </div>

    </div>

    <!-- CONTENT -->
    <div style="padding:16px;">

      <div style="
        display:flex;
        gap:12px;
        align-items:center;
      ">

        <img
          src="${store.logo_url || "/img/default.png"}"
          style="
            width:60px;
            height:60px;
            border-radius:16px;
            object-fit:cover;
          "
        >

        <div>

          <div style="
            font-size:20px;
            font-weight:700;
          ">
            ${store.name}
          </div>

          <div style="
            color:#666;
            font-size:14px;
            margin-top:2px;
          ">
            ${store.category || ""}
          </div>

        </div>

      </div>

      <div style="
        margin-top:14px;
        color:#555;
        font-size:14px;
        line-height:1.4;
      ">
        📍 ${store.street || "Sin dirección"}
      </div>

      <div style="
        margin-top:10px;
        font-size:14px;
        color:#444;
      ">
        ⭐ ${store.rating_avg || "0"} (${store.rating_count || 0})
      </div>

      <!-- BOTONES -->
      <div style="
        display:flex;
        gap:10px;
        margin-top:18px;
      ">

        <a
          href="/${store.slug}"
          class="action-btn view-btn"
        >
          Ver tienda
        </a>

        <a
          href="${googleMapsUrl}"
          target="_blank"
          class="action-btn route-btn"
        >
          Cómo llegar
        </a>

      </div>

    </div>
  `;

  preview.classList.add("active");
}

loadMapStores();
