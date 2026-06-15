// ============================
// VIDEO CARD
// ============================
function getYoutubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
  return m ? m[1] : null;
}

function getVideoPlatform(url) {
  if (!url) return null;
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/instagram\.com/.test(url)) return 'instagram';
  if (/tiktok\.com/.test(url)) return 'tiktok';
  return null;
}

const PLATFORM_BADGE = {
  youtube:   `<div style="position:absolute;top:8px;left:8px;background:#ff0000;color:white;font-size:9px;font-weight:800;padding:3px 7px;border-radius:6px;letter-spacing:0.03em;">▶ YouTube</div>`,
  instagram: `<div style="position:absolute;top:8px;left:8px;background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045);color:white;font-size:9px;font-weight:800;padding:3px 7px;border-radius:6px;">▶ Instagram</div>`,
  tiktok:    `<div style="position:absolute;top:8px;left:8px;background:#010101;color:white;font-size:9px;font-weight:800;padding:3px 7px;border-radius:6px;">♪ TikTok</div>`
};

function buildVideoCard(product) {
  const platform = getVideoPlatform(product.video_url);
  const ytId = platform === 'youtube' ? getYoutubeId(product.video_url) : null;
  const thumb = ytId
    ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
    : (product.image_url || '/img/default.png');
  const badge = PLATFORM_BADGE[platform] || '';

  const discount = product.old_price && product.price && product.old_price > product.price
    ? Math.round((1 - product.price / product.old_price) * 100)
    : null;

  const card = document.createElement('div');
  card.className = 'pc-card';
  card.style.cssText = 'height:300px;position:relative;overflow:hidden;cursor:pointer;';

  card.innerHTML = `
    <img src="${thumb}" onerror="this.src='/img/default.png'"
      style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">
    <div style="position:absolute;inset:0;
      background:linear-gradient(to bottom,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.55) 55%,rgba(0,0,0,0.82) 100%);">
    </div>
    <div style="position:absolute;top:42%;left:50%;transform:translate(-50%,-50%);
      width:46px;height:46px;background:rgba(255,255,255,0.92);border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 16px rgba(0,0,0,0.25);">
      <svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:#ea580c;margin-left:3px;">
        <path d="M8 5v14l11-7z"/>
      </svg>
    </div>
    <div style="position:absolute;bottom:0;left:0;right:0;
      background:white;border-radius:0 0 12px 12px;
      padding:8px 10px;display:flex;gap:8px;align-items:center;">
      <img src="${product.image_url || '/img/default.png'}" onerror="this.src='/img/default.png'"
        style="width:44px;height:44px;border-radius:8px;object-fit:cover;
        flex-shrink:0;border:1px solid #f0f0f0;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:11px;font-weight:700;color:#111;line-height:1.2;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${product.name}
        </div>
        <div style="display:flex;align-items:center;gap:5px;margin-top:3px;">
          <span style="font-size:13px;font-weight:800;color:#ea580c;">
            $${Number(product.price || 0).toLocaleString('es-AR')}
          </span>
          ${discount ? `<span style="background:#16a34a;color:white;font-size:9px;
            font-weight:800;padding:1px 5px;border-radius:4px;">${discount}% OFF</span>` : ''}
        </div>
      </div>
    </div>
  `;

  card.addEventListener('click', () => {
    if (window._carSwiped) return;
    window.location.href = `/product/${product.slug || product.id}`;
  });

  return card;
}

// ============================
// PRODUCTOS DESTACADOS
// ============================
export function loadProducts() {
  fetch('/api/products?featured=true')
  .then(res => res.json())
  .then(products => {
    const container = document.getElementById("products");
    if (!container) return;
    container.innerHTML = "";

  products.forEach(product => {
      // si tiene video → card especial
      if (product.video_url) {
        container.appendChild(buildVideoCard(product));
        return;
      }

      // normalizar imágenes
      let imgs = [];
      if (Array.isArray(product.images) && product.images.length) {
        imgs = product.images;
      } else if (typeof product.images === 'string') {
        try { imgs = JSON.parse(product.images); } catch { imgs = []; }
      }
      if (!imgs.length && product.image_url) imgs = [product.image_url];
      imgs = [...new Set(imgs)].filter(Boolean);

      const card = document.createElement("div");
      card.className = "pc-card";

      card.innerHTML = `
        <div class="pc-card-img" style="position:relative;height:220px;overflow:hidden;">
         ${window.buildCarousel ? window.buildCarousel(imgs, product.name, 120) : `<img src="${imgs[0] || '/img/default.png'}" alt="${product.name}">`}
        </div>

        <div class="pc-card-body">
          <div>
            <div class="pc-title">${product.name}</div>
            <div class="pc-store">${product.store_name || ""}</div>
          </div>
          <div>
            <div class="pc-price">
              ${window.renderPriceHTML(product)}
            </div>
            <div class="pc-rating">
              ${product.rating_avg
                ? `⭐ ${parseFloat(product.rating_avg).toFixed(1)} (${product.rating_count || 0})`
                : "Sin valoraciones"}
            </div>
          </div>
        </div>
      `;

     card.addEventListener("click", () => {
    if (window._carSwiped) return;
    window.location.href = `/product/${product.slug || product.id}`;
  });

      container.appendChild(card);
    });
     if (window.initCarousels) initCarousels();
  })
  .catch(err => console.error("Error cargando productos:", err));
}
function startOfferTimers() {
  const timers = document.querySelectorAll(".offer-timer");

  timers.forEach(timer => {

    const expire = new Date(timer.dataset.expire);

    function update() {
      const now = new Date();
      const diff = expire - now;

      if (diff <= 0) {
        timer.innerHTML = "⛔ Oferta finalizada";
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      timer.innerHTML = `⏳ ${hours}h ${minutes}m ${seconds}s`;
    }

    update();
    setInterval(update, 1000);
  });
}

// ============================
// OFERTAS DEL DÍA
// ============================
export function loadOffers(){

  fetch('/api/daily-offers')
  .then(res => res.json())
  .then(offers => {

    const container = document.getElementById("dailyOffers");
    if(!container) return;

    container.innerHTML = "";

if (!offers.length) {
  document.getElementById("ofertas").style.display = "none";
  return;
}

offers.forEach(offer => {

      const card = document.createElement("div");
      card.className = "product-card";

      card.innerHTML = `
  <div class="product-image">
    <img src="${offer.image_url}">
  </div>

  <div class="product-info">
    <div class="product-title">${offer.product_name}</div>
    <div class="product-store">${offer.store_name || ""}</div>

    <div class="product-price">
  ${window.renderPriceHTML({
    price: offer.price,
    old_price: offer.old_price,
    is_offer: true
  })}
</div>

${offer.offer_expires_at ? `
  <div class="offer-timer" data-expire="${offer.offer_expires_at}"></div>
` : ""}

    <div class="product-rating">
      ${
        offer.rating_avg
          ? `⭐ ${parseFloat(offer.rating_avg).toFixed(1)} (${offer.rating_count || 0})`
          : "Sin valoraciones"
      }
    </div>
  </div>
`;

      card.addEventListener("click", () => {
        window.location.href = `/product/${offer.slug || offer.product_id}`;
      });

      container.appendChild(card);
    });
    startOfferTimers();

  })
  .catch(err => console.error("Error cargando ofertas:", err));
}
