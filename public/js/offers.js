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

  const grid = document.getElementById("offersGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!products.length) {
    grid.innerHTML = "<p>No hay ofertas disponibles</p>";
    return;
  }

  products.forEach(p => {

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="img-box">
        <img src="${p.image_url || '/img/default.png'}" />
      </div>

      <div class="card-body">

        <div class="product-name">
          🔥 ${p.product_name}
        </div>

        <div class="store">
          ${p.store_name}
        </div>

        <div class="price-row">

          ${p.old_price ? `
            <span class="old-price">
              $${parseFloat(p.old_price).toLocaleString()}
            </span>
          ` : ""}

          <span class="price">
            $${parseFloat(p.price).toLocaleString()}
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

  const searchEl = document.getElementById("searchInput");
  const storeEl = document.getElementById("storeFilter");
  const sortEl = document.getElementById("sortPrice");

  const search = searchEl ? searchEl.value.toLowerCase() : "";
  const store = storeEl ? storeEl.value : "";
  const sort = sortEl ? sortEl.value : "";

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
  if (!select) return;

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

  const search = document.getElementById("searchInput");
  const store = document.getElementById("storeFilter");
  const sort = document.getElementById("sortPrice");

  if (search) search.addEventListener("input", applyFilters);
  if (store) store.addEventListener("change", applyFilters);
  if (sort) sort.addEventListener("change", applyFilters);

});
