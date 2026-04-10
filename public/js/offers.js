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
    <img src="${p.image_url}" />
  </div>

  <div class="card-body">
    <div class="product-name">
      ${p.product_name}
      <span class="badge">OFERTA</span>
    </div>

  <div class="price-row">

  ${p.old_price ? `
    <span class="old-price">
      $${parseFloat(p.old_price).toLocaleString()}
    </span>
  ` : ""}

  <div class="price">
    $${parseFloat(p.price).toLocaleString()}
  </div>

</div>

    <div class="store">
      ${p.store_name}
    </div>
  </div>
`;

    card.onclick = () => {
      window.location.href = `/product/${p.product_id}`;
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
