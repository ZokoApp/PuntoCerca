/* ================================
   CAROUSEL REUTILIZABLE
================================ */

window._carState = {};

window.buildCarousel = function(images, altText) {
  const imgs = Array.isArray(images) ? images.filter(Boolean) : [];
  
  if (imgs.length <= 1) {
    return `<img src="${imgs[0] || '/img/default.png'}" alt="${altText || ''}"
      style="width:100%;height:200px;object-fit:cover;display:block;"
      onerror="this.src='/img/default.png'">`;
  }

  const id = 'car_' + Math.random().toString(36).slice(2, 8);

  const slides = imgs.map(url => `
    <div style="min-width:100%;height:200px;flex-shrink:0;">
      <img src="${url}" alt="${altText || ''}"
        onerror="this.src='/img/default.png'"
        style="width:100%;height:200px;object-fit:cover;display:block;">
    </div>
  `).join('');

  const dots = imgs.map((_, i) => `
    <div data-i="${i}" onclick="event.stopPropagation();carouselGo('${id}',${i})" style="
      width:${i===0?'16px':'6px'};height:6px;border-radius:999px;
      background:${i===0?'white':'rgba(255,255,255,0.6)'};
      transition:all 0.2s;cursor:pointer;flex-shrink:0;
    "></div>
  `).join('');

  return `
    <div id="${id}" style="position:relative;overflow:hidden;touch-action:pan-y;">
      <div class="car-inner-${id}" style="display:flex;transition:transform 0.3s ease;will-change:transform;">
        ${slides}
      </div>
      <!-- dots -->
      <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);
        display:flex;gap:5px;align-items:center;pointer-events:all;">
        ${dots}
      </div>
      <!-- touch overlay -->
      <div style="position:absolute;inset:0;"
        ontouchstart="carTouchStart(event,'${id}')"
        ontouchend="carTouchEnd(event,'${id}',${imgs.length})">
      </div>
    </div>
  `;
};

window.carouselGo = function(id, idx) {
  const el = document.getElementById(id);
  if (!el) return;
  const inner = el.querySelector(`.car-inner-${id}`);
  if (!inner) return;
  const total = inner.children.length;
  idx = Math.max(0, Math.min(idx, total - 1));
  window._carState[id] = idx;
  inner.style.transform = `translateX(-${idx * 100}%)`;
  el.querySelectorAll('[data-i]').forEach((d, i) => {
    d.style.width = i === idx ? '16px' : '6px';
    d.style.background = i === idx ? 'white' : 'rgba(255,255,255,0.6)';
  });
};

window.carTouchStart = function(e, id) {
  window._carState[id + '_x'] = e.touches[0].clientX;
};

window.carTouchEnd = function(e, id, total) {
  const startX = window._carState[id + '_x'];
  if (startX == null) return;
  const diff = startX - e.changedTouches[0].clientX;
  if (Math.abs(diff) < 40) return;
  const cur = window._carState[id] || 0;
  const next = diff > 0 ? Math.min(cur + 1, total - 1) : Math.max(cur - 1, 0);
  carouselGo(id, next);
};
