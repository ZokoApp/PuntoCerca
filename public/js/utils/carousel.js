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
    <div data-i="${i}" onclick="event.stopPropagation();carouselGo('${id}',${i})" style="
      width:${i===0?'16px':'6px'};height:6px;border-radius:999px;
      background:${i===0?'white':'rgba(255,255,255,0.5)'};
      transition:all 0.2s;cursor:pointer;flex-shrink:0;">
    </div>
  `).join('');

  return `
    <div id="${id}" style="position:relative;overflow:hidden;height:${h}px;cursor:grab;"
      ontouchstart="carStart(event,'${id}')"
      ontouchmove="carMove(event,'${id}')"
      ontouchend="carEnd(event,'${id}',${imgs.length})"
      onmousedown="carStart(event,'${id}')"
      onmousemove="carMove(event,'${id}')"
      onmouseup="carEnd(event,'${id}',${imgs.length})"
      onmouseleave="window._carState['${id}_dragging']=false"
      onclick="event.stopPropagation()">

      <div class="car-inner-${id}" style="display:flex;height:${h}px;transition:transform 0.3s ease;will-change:transform;">
        ${slides}
      </div>

      <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);
        display:flex;gap:4px;align-items:center;
        background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);
        padding:4px 8px;border-radius:999px;pointer-events:all;z-index:3;">
        ${dots}
      </div>
    </div>
  `;
};

window.carStart = function(e, id) {
  const x = e.touches ? e.touches[0].clientX : e.clientX;
  window._carState[id + '_x'] = x;
  window._carState[id + '_dragging'] = true;
  window._carSwiped = false;
};

window.carMove = function(e, id) {
  if (!window._carState[id + '_dragging']) return;
  if (e.touches) e.preventDefault();
};

window.carEnd = function(e, id, total) {
  if (!window._carState[id + '_dragging']) return;
  window._carState[id + '_dragging'] = false;

  const startX = window._carState[id + '_x'];
  if (startX == null) return;

  const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
  const diff = startX - endX;

  if (Math.abs(diff) < 30) return;

  window._carSwiped = true;
  setTimeout(() => { window._carSwiped = false; }, 300);

  const cur = window._carState[id] || 0;
  const next = diff > 0 ? Math.min(cur + 1, total - 1) : Math.max(cur - 1, 0);
  carouselGo(id, next);
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
    d.style.background = i === idx ? 'white' : 'rgba(255,255,255,0.5)';
  });
};
