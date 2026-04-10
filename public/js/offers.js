async function loadOffers() {
  try {
    const res = await fetch('/api/daily-offers');

    if (!res.ok) throw new Error();

    const products = await res.json();

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
          <div>
            ${p.product_name}
            <span class="badge">OFERTA</span>
          </div>

          <div class="price">$${parseFloat(p.price).toLocaleString()}</div>

          <div class="store">${p.store_name}</div>
        </div>
      `;

      card.onclick = () => {
        window.location.href = `/product/${p.product_id}`;
      };

      grid.appendChild(card);
    });

  } catch (err) {
    console.error(err);
  }
}

loadOffers();
