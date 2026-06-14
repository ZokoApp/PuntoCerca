window._carState = {};
window._carSwiped = false;

window.buildCarousel = function(images, altText, height) {
  const h = height || 120;
  const imgs = Array.isArray(images) ? images.filter(Boolean) : [];

  if (imgs.length <= 1) {
    return `<img src="${imgs[0] || '/img/default.png'}" alt="${altText || ''}"
      style="width:100%;height:${h}px;object-fit:contain;background:#f8f8f8;display:block;"
      onerror="this.src='/img/default.png'">`;
  }

  const id = 'car_' + Math.random().toString(36).slice(2, 8);

  const slides = imgs.map(url => `
    <div style="min-width:100%;height:${h}px;flex-shrink:0;background:#f8f8f8;">
      <img src="${url}" alt="${altText || ''}" onerror="this.src='/img/default.png'"
        style="width:100%;height:${h}px;object-fit:contain;display:block;">
    </div>
  `).join('');

  const dots = imgs.map((_, i) => `
    <div data-i="${i}" data-car="${id}" style="
      width:${i===0?'16px':'6px'};height:6px;border-radius:999px;
      background:${i===0?'white':'rgba(255,255,255,0.5)'};
      transition:all 0.2s;cursor:pointer;flex-shrink:0;">
    </div>
  `).join('');

  return `
    <div id="${id}" data-car-total="${imgs.length}"
      style="position:relative;overflow:hidden;height:${h}px;cursor:grab;user-select:none;">
      <div class="car-inner-${id}"
        style="display:flex;height:${h}px;transition:transform 0.3s ease;will-change:transform;">
        ${slides}
      </div>
      <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);
        display:flex;gap:4px;align-items:center;
        background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);
        padding:4px 8px;border-radius:999px;z-index:3;">
        ${dots}
      </div>
    </div>
  `;
};

window.carouselGo = function(id, idx) {
  const el = document.getElementById(id);
  if (!el) return;
  const inner = el.querySelector('.car-inner-' + id);
  if (!inner) return;
  idx = Math.max(0, Math.min(idx, inner.children.length - 1));
  window._carState[id] = idx;
  inner.style.transform = `translateX(-${idx * 100}%)`;
  el.querySelectorAll('[data-i]').forEach((d, i) => {
    d.style.width = i === idx ? '16px' : '6px';
    d.style.background = i === idx ? 'white' : 'rgba(255,255,255,0.5)';
  });
};

window.initCarousels = function() {
  document.querySelectorAll('[data-car-total]').forEach(el => {
    if (el._carInit) return;
    el._carInit = true;

    const id = el.id;
    const total = parseInt(el.dataset.carTotal);
    let startX = null;
    let isDragging = false;

    // dots
    el.querySelectorAll('[data-i]').forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        carouselGo(id, parseInt(dot.dataset.i));
      });
    });

    // TOUCH
    el.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      if (startX === null) return;
      if (Math.abs(startX - e.touches[0].clientX) > 8) {
        e.preventDefault(); // bloquea scroll horizontal del padre
      }
    }, { passive: false });

    el.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const diff = startX - e.changedTouches[0].clientX;
      startX = null;
      if (Math.abs(diff) < 30) return;
      window._carSwiped = true;
      setTimeout(() => { window._carSwiped = false; }, 300);
      const cur = window._carState[id] || 0;
      carouselGo(id, diff > 0 ? Math.min(cur+1, total-1) : Math.max(cur-1, 0));
    }, { passive: true });

    // MOUSE desktop
    el.addEventListener('mousedown', (e) => {
      startX = e.clientX;
      isDragging = true;
      el.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mouseup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      el.style.cursor = 'grab';
      const diff = startX - e.clientX;
      startX = null;
      if (Math.abs(diff) < 30) return;
      window._carSwiped = true;
      setTimeout(() => { window._carSwiped = false; }, 300);
      const cur = window._carState[id] || 0;
      carouselGo(id, diff > 0 ? Math.min(cur+1, total-1) : Math.max(cur-1, 0));
    });

    // bloquear navegación del card al swipear
    el.addEventListener('click', (e) => {
      if (window._carSwiped) { e.stopPropagation(); e.preventDefault(); }
    });
  });
};
