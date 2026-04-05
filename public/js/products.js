let allProducts = [];

document.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();

  document.getElementById("searchInput").addEventListener("input", applyFilters);
  document.getElementById("filterSelect").addEventListener("change", applyFilters);
});

async function loadProducts(){
  try {
    const res = await fetch("/api/products");
    const products = await res.json();

    allProducts = products;
    renderProducts(products);

  } catch (err){
    console.error("Error cargando productos", err);
  }
}

function renderProducts(products){

  const container = document.getElementById("productsContainer");
  container.innerHTML = "";

  products.forEach(p => {

    const div = document.createElement("div");
    div.className = "product-card";

    div.innerHTML = `
  <div class="product-card-inner">

    <div class="product-image">
      <img src="${p.image_url || '/img/default.png'}" />
    </div>

    <div class="product-info">
      <h3 class="product-title">${p.name}</h3>

      <p class="product-price">$${Number(p.price).toLocaleString()}</p>

      <p class="product-store">${p.store_name || ""}</p>
    </div>

  </div>
`;

    div.addEventListener("click", () => {
      window.location.href = `/product/${p.id}`;
    });

    container.appendChild(div);
  });
}

function applyFilters(){

  const search = document.getElementById("searchInput").value.toLowerCase();
  const filter = document.getElementById("filterSelect").value;

  let filtered = [...allProducts];

  // 🔍 BUSCAR
  if(search){
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search)
    );
  }

  // 🎯 FILTROS
  switch(filter){

    case "cheap":
      filtered.sort((a,b) => a.price - b.price);
      break;

    case "expensive":
      filtered.sort((a,b) => b.price - a.price);
      break;

    case "best":
      filtered.sort((a,b) => (b.rating_avg || 0) - (a.rating_avg || 0));
      break;

    case "worst":
      filtered.sort((a,b) => (a.rating_avg || 0) - (b.rating_avg || 0));
      break;

    case "near":
      filtered.sort((a,b) => (a.distance || 0) - (b.distance || 0));
      break;
  }

  renderProducts(filtered);
}