(function () {
  'use strict';

  const POLL_MS = 15000;
  const WIDGET_ID = 'pc-delivery-monitor';
  const STORAGE_KEY = 'pcDeliveryMinimized';

  let minimized = sessionStorage.getItem(STORAGE_KEY) === 'true';
  let deliveries = [];
  let widgetEl = null;

  // ============================
  // CREAR CONTENEDOR
  // ============================
  function createWidget() {
    if (document.getElementById(WIDGET_ID)) {
      widgetEl = document.getElementById(WIDGET_ID);
      return;
    }
    widgetEl = document.createElement('div');
    widgetEl.id = WIDGET_ID;
    widgetEl.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'right:24px',
      'z-index:999999',
      "font-family:'Segoe UI',Arial,sans-serif",
      'transition:all 0.25s ease',
      'display:none'
    ].join(';');
    document.body.appendChild(widgetEl);
  }

  // ============================
  // STATUS MAP
  // ============================
  function getStatus(s) {
    return {
      pending:   { label: 'Pendiente',   color: '#ea580c', pulse: false, icon: '&#9679;' },
      active:    { label: 'En camino',   color: '#16a34a', pulse: true,  icon: '&#9679;' },
      delivered: { label: 'Entregado',   color: '#64748b', pulse: false, icon: '&#10003;' }
    }[s] || { label: s, color: '#9ca3af', pulse: false, icon: '&#9679;' };
  }

  // ============================
  // RENDER
  // ============================
  function render() {
    if (!widgetEl) return;

    const visible = deliveries.filter(d => {
      if (d.status === 'active' || d.status === 'pending') return true;
      if (d.status === 'delivered' && d.updated_at) {
        return Date.now() - new Date(d.updated_at).getTime() < 5 * 60 * 1000;
      }
      return false;
    });

    if (!visible.length) {
      widgetEl.style.display = 'none';
      return;
    }

    widgetEl.style.display = 'block';

    if (minimized) {
      renderMinimized(visible);
    } else {
      renderExpanded(visible);
    }
  }

  function renderMinimized(list) {
    const active = list.filter(d => d.status === 'active').length;
    const total = list.length;
    const label = active > 0
      ? `${active} en camino`
      : `${total} pendiente${total > 1 ? 's' : ''}`;

    widgetEl.innerHTML = `
      <style>
        #pc-delivery-monitor button:hover { opacity:0.88; }
      </style>
      <button id="pcToggleBtn" style="
        background:linear-gradient(135deg,#ea580c,#f97316);
        border:none;
        border-radius:999px;
        padding:11px 18px;
        color:white;
        font-weight:800;
        font-size:13px;
        cursor:pointer;
        display:flex;
        align-items:center;
        gap:8px;
        box-shadow:0 6px 24px rgba(234,88,12,0.38);
        white-space:nowrap;
        letter-spacing:-0.01em;
      ">
        <svg width="16" height="16" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
        </svg>
        PuntoEnv&iacute;o &mdash; ${label}
        <span style="background:rgba(255,255,255,0.22);border-radius:999px;padding:2px 9px;font-size:11px;">&#9650;</span>
      </button>
    `;
    widgetEl.querySelector('#pcToggleBtn').onclick = toggle;
  }

  function renderExpanded(list) {
    const items = list.map(d => {
      const st = getStatus(d.status);
      const addr = d.dest_address
        ? `<div style="font-size:11px;color:#9ca3af;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.dest_address}</div>`
        : '';
      const pulse = st.pulse
        ? 'animation:pcPulse 1.4s ease-in-out infinite;'
        : '';
      return `
        <div style="padding:11px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;">
          <span style="
            width:8px;height:8px;border-radius:50%;
            background:${st.color};flex-shrink:0;
            ${pulse}
          "></span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:700;color:#111827;">${st.label}</div>
            ${addr}
          </div>
        </div>
      `;
    }).join('');

    const countLabel = `${list.length} env&iacute;o${list.length > 1 ? 's' : ''} activo${list.length > 1 ? 's' : ''}`;

    widgetEl.innerHTML = `
      <style>
        @keyframes pcPulse {
          0%,100%{opacity:1;transform:scale(1)}
          50%{opacity:0.35;transform:scale(1.7)}
        }
        #pc-delivery-monitor button:hover{opacity:0.85;}
      </style>
      <div style="
        background:white;
        border-radius:20px;
        box-shadow:0 20px 56px rgba(0,0,0,0.14);
        border:1px solid #e5e7eb;
        width:272px;
        overflow:hidden;
      ">
        <div style="
          background:linear-gradient(135deg,#111827,#1f2937);
          padding:14px 16px;
          display:flex;
          align-items:center;
          justify-content:space-between;
        ">
          <div style="display:flex;align-items:center;gap:9px;">
            <div style="
              width:34px;height:34px;
              background:linear-gradient(135deg,#ea580c,#f97316);
              border-radius:10px;
              display:flex;align-items:center;justify-content:center;flex-shrink:0;
            ">
              <svg width="18" height="18" fill="none" stroke="white" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
              </svg>
            </div>
            <div>
              <div style="color:white;font-size:14px;font-weight:900;letter-spacing:-0.02em;">
                Punto<span style="color:#f97316;">Env&iacute;o</span>
              </div>
              <div style="color:#6b7280;font-size:10px;margin-top:1px;">${countLabel}</div>
            </div>
          </div>
          <button id="pcMinBtn" style="
            background:rgba(255,255,255,0.10);
            border:1px solid rgba(255,255,255,0.15);
            border-radius:8px;
            padding:5px 10px;
            color:white;
            cursor:pointer;
            font-size:11px;
            font-weight:700;
            letter-spacing:0.02em;
          ">&#9660; Min</button>
        </div>

        <div style="max-height:220px;overflow-y:auto;">
          ${items}
        </div>

        <div style="padding:10px 14px;">
          <a href="/dashboard" style="
            display:block;text-align:center;
            font-size:12px;font-weight:700;color:#ea580c;
            text-decoration:none;padding:8px;
            background:#fff7ed;border-radius:10px;
          ">Ver todos los env&iacute;os &#8594;</a>
        </div>
      </div>
    `;
    widgetEl.querySelector('#pcMinBtn').onclick = toggle;
  }

  // ============================
  // TOGGLE
  // ============================
  function toggle() {
    minimized = !minimized;
    sessionStorage.setItem(STORAGE_KEY, minimized);
    render();
  }

  // ============================
  // POLL
  // ============================
  async function poll() {
    try {
      const res = await fetch('/api/deliveries', { credentials: 'include' });
      if (!res.ok) return;
      deliveries = await res.json();
      render();
    } catch (_) {}
  }

  // ============================
  // INIT
  // ============================
  function init() {
    createWidget();
    poll();
    setInterval(poll, POLL_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
