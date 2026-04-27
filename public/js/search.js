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
    console.warn("⚠️ Store sin slug, fallback a ID:", item);
    window.location.href = `/store/${item.id}`;
  }
}

function goToProduct(item){
  window.location.href = `/product/${item.slug || item.id}`;
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
      card.className = "bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden cursor-pointer flex flex-col";

      // ==========================
      // PRODUCTOS
      // ==========================
      if(item.type === "product"){

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
                  ? `⭐ ${Number(item.rating_avg).toFixed(1)}${item.rating_count ? ` (${item.rating_count})` : ''}`
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

        card.addEventListener("click", () => {
          goToProduct(item);
        });

        productsContainer.appendChild(card);

      } 
      
      // ==========================
      // TIENDAS
      // ==========================
      else {

        card.innerHTML = `
          <div class="h-56 bg-gray-100 flex items-center justify-center">
            <img 
              src="${item.image || 'https://source.unsplash.com/300x200/?store'}" 
              class="w-full h-full object-cover"
            >
          </div>

          <div class="p-4 flex flex-col gap-1 min-h-[120px]">
            <h3 class="font-semibold text-lg leading-tight min-h-[56px]">
              ${item.name}
            </h3>

            <p class="text-sm text-gray-500">
              Tienda
            </p>
          </div>
        `;

        card.addEventListener("click", () => {
          goToStore(item);
        });

        storesContainer.appendChild(card);
      }

    });

  }catch(error){
    console.error(error);
  }

}

search();
