(function () {
  'use strict';

  let feedData = [];
  let currentStore = 0;
  let currentPizarra = 0;
  let storyTimer = null;

  async function loadStories() {
    try {
      const res = await fetch('/api/feed/pizarras', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.length) return;
      feedData = data;
      renderStrip(data);
    } catch (_) {}
  }

  function renderStrip(stores) {
    const section = document.getElementById('storiesSection');
    const strip   = document.getElementById('storiesStrip');
    if (!section || !strip) return;

    section.style.display = 'block';

    strip.innerHTML = stores.map((store, i) => `
      <div onclick="openFeedStory(${i})" style="
        display:flex;flex-direction:column;align-items:center;
        gap:6px;cursor:pointer;flex-shrink:0;width:68px;
      ">
        <div style="
          width:60px;height:60px;border-radius:50%;
          background:linear-gradient(135deg,#ea580c,#f97316,#fbbf24);
          padding:2.5px;
          box-shadow:0 2px 10px rgba(234,88,12,0.3);
        ">
          <div style="
            width:100%;height:100%;border-radius:50%;
            border:2.5px solid white;
            background:url('${store.logo_url || '/img/default.png'}')
              center/cover no-repeat, #f1f5f9;
          "></div>
        </div>
        <span style="
          font-size:10px;color:#374151;font-weight:600;
          text-align:center;width:68px;
          overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
        ">${store.store_name}</span>
      </div>
    `).join('');
  }

  window.openFeedStory = function (storeIdx, pizarraIdx = 0) {
    const store   = feedData[storeIdx];
    if (!store) return;
    const pizarras = store.pizarras;
    const pizarra  = pizarras[pizarraIdx];
    if (!pizarra) return;

    currentStore   = storeIdx;
    currentPizarra = pizarraIdx;

    const DURATION = 5000;

    const existing = document.getElementById('feedStoryModal');
    if (existing) existing.remove();
    if (storyTimer) { clearTimeout(storyTimer); storyTimer = null; }

    const modal = document.createElement('div');
    modal.id = 'feedStoryModal';
    modal.style.cssText = `
      position:fixed;inset:0;z-index:99999;
      background:black;display:flex;flex-direction:column;
      align-items:center;justify-content:center;
    `;

    const bars = pizarras.map((_, i) => `
      <div style="flex:1;height:3px;background:rgba(255,255,255,0.3);
        border-radius:999px;overflow:hidden;">
        <div id="feedBar_${i}" style="
          height:100%;background:white;border-radius:999px;
          width:${i < pizarraIdx ? '100%' : '0%'};
          ${i === pizarraIdx ? `transition:width ${DURATION}ms linear;` : ''}
        "></div>
      </div>
    `).join('');

    modal.innerHTML = `
      <div style="position:absolute;top:12px;left:12px;right:12px;
        display:flex;gap:4px;">${bars}</div>

      <div style="position:absolute;top:28px;left:14px;right:14px;
        display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <a href="/${store.store_slug}" style="
            width:38px;height:38px;border-radius:50%;
            border:2px solid white;flex-shrink:0;display:block;
            background:url('${store.logo_url || ''}') center/cover no-repeat,#ea580c;
          "></a>
          <div>
            <a href="/${store.store_slug}" style="
              color:white;font-size:13px;font-weight:700;
              line-height:1.2;text-decoration:none;display:block;
            ">${store.store_name}</a>
            <div style="color:rgba(255,255,255,0.65);font-size:11px;">
              🖊️ La Pizarra de Hoy · ${pizarraIdx + 1}/${pizarras.length}
            </div>
          </div>
        </div>
        <button id="closeFeedStoryBtn" style="
          background:rgba(255,255,255,0.15);border:none;border-radius:50%;
          width:34px;height:34px;color:white;font-size:18px;
          cursor:pointer;display:flex;align-items:center;justify-content:center;
        ">✕</button>
      </div>

      <img src="${pizarra.image_url}"
        style="max-width:100%;max-height:100vh;object-fit:contain;border-radius:4px;">

      ${pizarra.caption ? `
        <div style="position:absolute;bottom:36px;left:20px;right:20px;
          background:rgba(0,0,0,0.65);backdrop-filter:blur(8px);
          border-radius:14px;padding:14px 18px;color:white;
          font-size:15px;text-align:center;line-height:1.5;">
          ${pizarra.caption}
        </div>
      ` : ''}

      <div style="position:absolute;inset:0;display:flex;top:80px;">
        <div style="flex:1;cursor:pointer;"
          onclick="navigateFeedStory('prev')"></div>
        <div style="flex:1;cursor:pointer;"
          onclick="navigateFeedStory('next')"></div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const bar = document.getElementById(`feedBar_${pizarraIdx}`);
        if (bar) bar.style.width = '100%';
      });
    });

    storyTimer = setTimeout(() => navigateFeedStory('next'), DURATION);
    document.getElementById('closeFeedStoryBtn').onclick = closeFeedStory;
    modal.onclick = (e) => { if (e.target === modal) closeFeedStory(); };
  };

  window.navigateFeedStory = function (dir) {
    const store = feedData[currentStore];
    if (!store) { closeFeedStory(); return; }

    if (dir === 'next') {
      if (currentPizarra < store.pizarras.length - 1) {
        openFeedStory(currentStore, currentPizarra + 1);
      } else if (currentStore < feedData.length - 1) {
        openFeedStory(currentStore + 1, 0);
      } else {
        closeFeedStory();
      }
    } else {
      if (currentPizarra > 0) {
        openFeedStory(currentStore, currentPizarra - 1);
      } else if (currentStore > 0) {
        const prev = feedData[currentStore - 1];
        openFeedStory(currentStore - 1, prev.pizarras.length - 1);
      }
    }
  };

  window.closeFeedStory = function () {
    const modal = document.getElementById('feedStoryModal');
    if (modal) {
      modal.style.opacity = '0';
      modal.style.transition = 'opacity 0.2s';
      setTimeout(() => modal.remove(), 200);
    }
    document.body.style.overflow = '';
    if (storyTimer) { clearTimeout(storyTimer); storyTimer = null; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadStories);
  } else {
    loadStories();
  }
})();
