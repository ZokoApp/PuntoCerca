let allProducts = [];

async function loadOffers() {
  try {
    const res = await fetch('/api/daily-offers');
    if (!res.ok) throw new Error();

    const products = await res.json();
    allProducts = products;

    renderProducts(products);
    loadStoreFilter(products);

  } catch (err) {
    console.error(err);
  }
}

function renderProducts(products) {

  const grid = document.getElementById("dailyOffers");
  grid.innerHTML = "";

  if (!products.length) {
    grid.innerHTML = "<p>No hay ofertas disponibles</p>";
    return;
  }

  products.forEach(p => {

    const card = document.createElement("div");

 card.className = `
  min-w-[160px] 
  max-w-[160px]
  flex-shrink-0
  bg-white rounded-xl shadow hover:shadow-lg 
  overflow-hidden transition cursor-pointer
`;

    card.innerHTML = `
      <div class="relative">
        <img src="${p.image_url}" 
             class="w-full h-40 object-cover">

        <div class="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-md">
          🔥 Oferta
        </div>
      </div>

      <div class="p-3">

        <h3 class="text-sm font-semibold line-clamp-2">
          ${p.product_name}
        </h3>

        <p class="text-xs text-gray-500 mt-1">
          ${p.store_name}
        </p>

        <div class="mt-2">
          ${p.old_price ? `
            <span class="text-gray-400 line-through text-xs mr-1">
              $${parseFloat(p.old_price).toLocaleString()}
            </span>
          ` : ""}

          <span class="text-orange-600 font-bold">
            ${window.renderPriceHTML(p)}
          </span>
        </div>

      </div>
    `;

    card.onclick = () => {
      window.location.href = `/product/${p.slug}`;
    };

    grid.appendChild(card);
  });
}

/* =========================
   FILTROS
========================= */

function applyFilters() {

  let filtered = [...allProducts];

  const search = document.getElementById("searchInput").value.toLowerCase();
  const store = document.getElementById("storeFilter").value;
  const sort = document.getElementById("sortPrice").value;

  // 🔍 BUSCADOR
  if (search) {
    filtered = filtered.filter(p =>
      p.product_name.toLowerCase().includes(search)
    );
  }

  // 🏪 FILTRO TIENDA
  if (store) {
    filtered = filtered.filter(p => p.store_name === store);
  }

  // 💰 ORDEN PRECIO
  if (sort === "asc") {
    filtered.sort((a,b) => a.price - b.price);
  }

  if (sort === "desc") {
    filtered.sort((a,b) => b.price - a.price);
  }

  renderProducts(filtered);
}

/* =========================
   CARGAR TIENDAS
========================= */

function loadStoreFilter(products) {

  const select = document.getElementById("storeFilter");

  const stores = [...new Set(products.map(p => p.store_name))];

  stores.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.innerText = s;
    select.appendChild(opt);
  });
}

/* =========================
   EVENTS
========================= */

document.addEventListener("DOMContentLoaded", () => {

  loadOffers();

  document.getElementById("searchInput")
    .addEventListener("input", applyFilters);

  document.getElementById("storeFilter")
    .addEventListener("change", applyFilters);

  document.getElementById("sortPrice")
    .addEventListener("change", applyFilters);

});
