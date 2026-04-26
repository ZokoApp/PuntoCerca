const map = L.map('mapFull').setView([-32.95, -60.66], 13); // Rosario default

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

let markers = [];

// 📍 cargar tiendas
async function loadMapStores() {

  try {
    const res = await fetch('/api/stores');
    const stores = await res.json();

    stores.forEach(store => {

  if (!store.lat || !store.lng) return;

  // 🔥 ESTADO ABIERTO / CERRADO
  const isOpen = store.is_open;
  const borderColor = isOpen ? "#22c55e" : "#ef4444";

  // 🔥 ICONO PERSONALIZADO
  const icon = L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width:50px;
        height:50px;
        border-radius:50%;
        overflow:hidden;
        border:3px solid ${borderColor};
        box-shadow:0 4px 10px rgba(0,0,0,0.3);
        background:#fff;
      ">
        <img src="${store.logo_url || '/img/default.png'}"
             style="width:100%;height:100%;object-fit:cover;">
      </div>
    `,
    iconSize: [50, 50],
    iconAnchor: [25, 50]
  });

  const marker = L.marker([store.lat, store.lng], { icon }).addTo(map);

  marker.on("click", () => showPreview(store));

});

  } catch (err) {
    console.error(err);
  }
}

function showPreview(store){

  const preview = document.getElementById("storePreview");

  const isOpen = store.is_open;
  const statusText = isOpen ? "🟢 Abierto ahora" : "🔴 Cerrado";
  const statusColor = isOpen ? "#22c55e" : "#ef4444";

  preview.innerHTML = `
    <div style="
      background:white;
      border-radius:18px;
      overflow:hidden;
      box-shadow:0 10px 30px rgba(0,0,0,0.25);
    ">

      <!-- COVER -->
      <div style="
        height:120px;
        background:url('${store.cover_url || "/img/hero.png"}') center/cover;
        position:relative;
      ">
        <div style="
          position:absolute;
          top:10px;
          left:10px;
          background:${statusColor};
          color:white;
          padding:4px 10px;
          border-radius:999px;
          font-size:12px;
        ">
          ${statusText}
        </div>
      </div>

      <!-- CONTENIDO -->
      <div style="padding:12px">

        <div style="display:flex;gap:10px;align-items:center;">
          <img src="${store.logo_url || '/img/default.png'}"
               style="width:50px;height:50px;border-radius:10px;object-fit:cover;">

          <div>
            <strong>${store.name}</strong><br>
            <span style="font-size:12px;color:#666;">
              ${store.category || ""}
            </span>
          </div>
        </div>

        <div style="margin-top:8px;font-size:13px;color:#555;">
          📍 ${store.street || "Sin dirección"}
        </div>

        <div style="margin-top:5px;font-size:13px;">
          ⭐ ${store.rating_avg || "0"} (${store.rating_count || 0})
        </div>

        <a href="/${store.slug}" 
           style="
            display:block;
            margin-top:12px;
            text-align:center;
            background:#ff6a00;
            color:white;
            padding:10px;
            border-radius:12px;
            font-weight:bold;
           ">
          Ver tienda
        </a>

      </div>
    </div>
  `;

  preview.classList.remove("hidden");
}

loadMapStores();
