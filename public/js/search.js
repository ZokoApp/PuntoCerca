// ==========================
// QUERY
// ==========================
const params = new URLSearchParams(window.location.search);
const query = params.get("q");

const title = document.getElementById("searchTitle");
const productsContainer = document.getElementById("productsResults");
const storesContainer = document.getElementById("storesResults");

title.textContent = `Resultados para: "${query}"`;

// ==========================
// NAV HELPERS
// ==========================
function goToStore(item){
  if (item.slug) {
    window.location.href = `/${item.slug}`;
  } else {
    console.warn("⚠️ Store sin slug:", item);
    window.location.href = `/store/${item.id}`;
  }
}

function goToProduct(item){
  window.location.href = `/product/${item.slug || item.id}`;
}

// ==========================
// STORE STATUS (🔥 CLAVE)
// ==========================
function isStoreOpen(store){

  if (!store.is_open) return false;

  if (!store.opening_hours) return store.is_open;

  let hours = store.opening_hours;

  if (typeof hours === "string") {
    try {
      hours = JSON.parse(hours);
    } catch {
      return store.is_open;
    }
  }

  if (hours.always_open) return true;

  const now = new Date();
  const daysMap = ["sun","mon","tue","wed","thu","fri","sat"];
  const today = hours[daysMap[now.getDay()]];

  if (!today || today.closed) return false;

  const current = now.getHours() * 60 + now.getMinutes();

  const [oh, om] = (today.open || "0:0").split(":").map(Number);
  const [ch, cm] = (today.close || "0:0").split(":").map(Number);

  const openTime = oh * 60 + om;
  const closeTime = ch * 60 + cm;

  return current >= openTime && current <= closeTime;
}

// ==========================
// SEARCH
// ==========================
async function search(){

  try{

    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    productsContainer.innerHTML = "";
    storesContainer.innerHTML = "";

    if(!data.length){
      productsContainer.innerHTML = "<p>No se encontraron productos</p>";
      storesContainer.innerHTML = "<p>No se encontraron tiendas</p>";
      return;
    }

    data.forEach(item => {

      const card = document.createElement("div");

      // ==========================
      // PRODUCTOS
      // ==========================
      if(item.type === "product"){

        card.className = "bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden cursor-pointer flex flex-col";

        card.innerHTML = `
          <div class="h-56 bg-gray-100 flex items-center justify-center">
            <img 
              src="${item.image || 'https://source.unsplash.com/300x200/?product'}" 
              class="max-h-full max-w-full object-contain"
            >
          </div>

          <div class="p-4 flex flex-col gap-1 min-h-[140px]">

            <h3 class="font-semibold text-lg leading-tight min-h-[48px]">
              ${item.name}
            </h3>

            <p class="text-sm text-gray-500">
              ${item.store_name || 'Sin tienda'}
            </p>

            <p class="text-xs text-yellow-600">
              ${
                item.rating_avg
                  ? `⭐ ${Number(item.rating_avg).toFixed(1)} (${item.rating_count || 0})`
                  : 'Sin valoraciones'
              }
            </p>

            ${
              item.brand 
                ? `<p class="text-xs text-gray-400">Marca: ${item.brand}</p>` 
                : ''
            }

            ${
              item.size 
                ? `<p class="text-xs text-gray-400">Talle: ${item.size}</p>` 
                : ''
            }

            <p class="text-orange-600 font-bold text-lg mt-2">
              ${
                item.price > 0
                  ? `Desde $${item.price}`
                  : 'Consultar'
              }
            </p>

          </div>
        `;

        card.onclick = () => goToProduct(item);
        productsContainer.appendChild(card);
      }

      // ==========================
      // TIENDAS (🔥 PRO)
      // ==========================
      else {

        const open = isStoreOpen(item);

        let hours = item.opening_hours;

        if (typeof hours === "string") {
          try { hours = JSON.parse(hours); } catch {}
        }

        const is24 = hours?.always_open;

        card.className = "store-card";

        card.innerHTML = `
          <div class="store-image">

            <img src="${item.image || 'https://source.unsplash.com/300x200/?store'}">

            <div class="store-status ${open ? 'open' : 'closed'}">
              ${
                is24
                  ? 'Abierto 24hs'
                  : (open ? 'Abierto' : 'Cerrado')
              }
            </div>

          </div>

          <div class="store-content">

            <h3 class="store-name">${item.name}</h3>

            <p class="store-meta">
              📍 ${item.address || item.street || 'Sin dirección'}
            </p>

            <p class="store-meta">
              ${item.category || 'Tienda'}
            </p>

            <div class="store-rating">
              ${
                item.rating_avg
                  ? `⭐ ${Number(item.rating_avg).toFixed(1)} (${item.rating_count || 0})`
                  : 'Sin valoraciones'
              }
            </div>

          </div>
        `;

        card.onclick = () => goToStore(item);
        storesContainer.appendChild(card);
      }

    });

  }catch(error){
    console.error("💥 Error en búsqueda:", error);
  }

}

search();
