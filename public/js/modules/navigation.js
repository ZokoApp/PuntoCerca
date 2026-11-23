/* ================================
   NAVEGACIÓN GPS — PuntoCerca
   OSRM (gratis, sin API key) + Leaflet + watchPosition
================================ */

window.PcNav = (() => {
  let routeLayer = null;
  let userMarker = null;
  let watchId = null;
  let destLat = null;
  let destLng = null;
  let destName = '';
  let lastUserPos = null;
  let recalcTimer = null;
  let isNavigating = false;
  const DEVIATION_METERS = 60;
  const OSRM = 'https://router.project-osrm.org/route/v1/driving';

  /* ── UTILIDADES ───────────────────────── */

  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 +
      Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function formatDist(m) {
    return m < 1000 ? `${Math.round(m)} m` : `${(m/1000).toFixed(1)} km`;
  }

  function formatTime(s) {
    if (s < 60) return `${Math.round(s)} seg`;
    const m = Math.round(s / 60);
    return m < 60 ? `${m} min` : `${Math.floor(m/60)}h ${m%60}min`;
  }

  function distToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    if (dx === 0 && dy === 0) return haversine(py, px, ay, ax);
    const t = Math.max(0, Math.min(1, ((px-ax)*dx + (py-ay)*dy) / (dx*dx + dy*dy)));
    return haversine(py, px, ay + t*dy, ax + t*dx);
  }

  function minDistToRoute(lat, lng, coords) {
    let min = Infinity;
    for (let i = 0; i < coords.length - 1; i++) {
      const d = distToSegment(lng, lat,
        coords[i][0], coords[i][1],
        coords[i+1][0], coords[i+1][1]);
      if (d < min) min = d;
    }
    return min;
  }

  /* ── OSRM ─────────────────────────────── */

  async function fetchRoute(fromLat, fromLng, toLat, toLng) {
    const url = `${OSRM}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok') throw new Error('Sin ruta');
    return data.routes[0];
  }

  /* ── DIBUJAR RUTA ─────────────────────── */

  function drawRoute(map, geojson) {
    if (routeLayer) map.removeLayer(routeLayer);
    const coords = geojson.coordinates.map(c => [c[1], c[0]]);
    routeLayer = L.polyline(coords, {
      color: '#3b82f6',
      weight: 6,
      opacity: 0.85,
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(map);
    return geojson.coordinates; // [lng, lat]
  }

  /* ── MARCADOR USUARIO ─────────────────── */

  function updateUserMarker(map, lat, lng) {
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:22px;height:22px;border-radius:50%;
        background:#3b82f6;border:3px solid white;
        box-shadow:0 0 0 4px rgba(59,130,246,0.3);
      "></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
    if (!userMarker) {
      userMarker = L.marker([lat, lng], { icon, zIndexOffset: 2000 }).addTo(map);
    } else {
      userMarker.setLatLng([lat, lng]);
    }
  }

  /* ── PANEL DE NAVEGACIÓN ──────────────── */

  function createPanel() {
    if (document.getElementById('pc-nav-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'pc-nav-panel';
    panel.style.cssText = `
      position:fixed;bottom:0;left:0;right:0;z-index:9999;
      background:white;border-radius:20px 20px 0 0;
      box-shadow:0 -4px 24px rgba(0,0,0,0.15);
      padding:16px 20px 24px;
      font-family:'Inter','Segoe UI',sans-serif;
      transition:transform 0.3s;
    `;
    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div>
          <div id="pc-nav-dest" style="font-size:15px;font-weight:700;color:#111;"></div>
          <div id="pc-nav-info" style="font-size:13px;color:#6b7280;margin-top:2px;"></div>
        </div>
        <button onclick="PcNav.stop()" style="
          background:#ef4444;color:white;border:none;border-radius:10px;
          padding:8px 16px;font-size:13px;font-weight:700;cursor:pointer;">
          Cancelar
        </button>
      </div>
      <div id="pc-nav-step" style="
        background:#eff6ff;border-radius:12px;padding:12px 14px;
        font-size:13px;color:#1d4ed8;font-weight:500;
        display:flex;align-items:center;gap:8px;
      ">
        <svg viewBox="0 0 24 24" style="width:20px;height:20px;flex-shrink:0;fill:#3b82f6;">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span id="pc-nav-step-text">Calculando ruta...</span>
      </div>
      <div id="pc-nav-recalc" style="
        display:none;margin-top:8px;
        background:#fef3c7;border-radius:10px;padding:8px 12px;
        font-size:12px;color:#92400e;font-weight:600;text-align:center;
      ">⚠️ Recalculando ruta...</div>
    `;
    document.body.appendChild(panel);
  }

  function updatePanel(dist, duration, step) {
    const info = document.getElementById('pc-nav-info');
    const stepEl = document.getElementById('pc-nav-step-text');
    const dest = document.getElementById('pc-nav-dest');
    if (dest) dest.textContent = `📍 ${destName}`;
    if (info) info.textContent = `${formatDist(dist)} · ${formatTime(duration)}`;
    if (stepEl && step) stepEl.textContent = step;
  }

  function showRecalc(show) {
    const el = document.getElementById('pc-nav-recalc');
    if (el) el.style.display = show ? 'block' : 'none';
  }

  function removePanel() {
    document.getElementById('pc-nav-panel')?.remove();
  }

  /* ── PRÓXIMO PASO ─────────────────────── */

  function getNextStep(steps, userLat, userLng) {
    let minDist = Infinity;
    let bestStep = null;
    for (const step of steps) {
      const [lng, lat] = step.maneuver.location;
      const d = haversine(userLat, userLng, lat, lng);
      if (d < minDist) { minDist = d; bestStep = step; }
    }
    if (!bestStep) return null;
    const instr = bestStep.maneuver.type;
    const name = bestStep.name || '';
    const dist = formatDist(bestStep.distance);
    const typeMap = {
      turn: 'Girar',
      'new name': 'Continuar por',
      depart: 'Partir hacia',
      arrive: '¡Llegaste!',
      merge: 'Incorporarse a',
      'on ramp': 'Tomar rampa',
      'off ramp': 'Salir',
      fork: 'Tomar bifurcación',
      roundabout: 'Ingresar a rotonda',
      continue: 'Continuar por',
      'end of road': 'Al final de'
    };
    const modifierMap = {
      left: '← izquierda',
      right: '→ derecha',
      'sharp left': '↰ giro brusco izquierda',
      'sharp right': '↱ giro brusco derecha',
      'slight left': '↖ leve izquierda',
      'slight right': '↗ leve derecha',
      straight: '↑ recto'
    };
    const type = typeMap[instr] || 'Continuar';
    const mod = modifierMap[bestStep.maneuver.modifier] || '';
    return `${type} ${mod}${name ? ' por ' + name : ''} — en ${dist}`;
  }

  /* ── INICIAR NAVEGACIÓN ───────────────── */

  async function start(map, toLat, toLng, name) {
    if (isNavigating) stop();
    destLat = toLat;
    destLng = toLng;
    destName = name || 'Destino';
    isNavigating = true;
    createPanel();

    // Obtener posición inicial
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true })
    );
    const { latitude: fromLat, longitude: fromLng } = pos.coords;
    lastUserPos = { lat: fromLat, lng: fromLng };

    updateUserMarker(map, fromLat, fromLng);
    map.setView([fromLat, fromLng], 16);

    // Calcular y dibujar ruta inicial
    let route, routeCoords, steps;
    try {
      route = await fetchRoute(fromLat, fromLng, toLat, toLng);
      routeCoords = drawRoute(map, route.geometry);
      steps = route.legs[0].steps;
      const nextStep = getNextStep(steps, fromLat, fromLng);
      updatePanel(route.distance, route.duration, nextStep);
    } catch (e) {
      document.getElementById('pc-nav-step-text').textContent = 'No se pudo calcular la ruta';
      return;
    }

    // Destino marker
    const destIcon = L.divIcon({
      className: '',
      html: `<div style="
        width:30px;height:30px;border-radius:50%;
        background:#ea580c;border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        display:flex;align-items:center;justify-content:center;
        font-size:14px;
      ">📍</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    L.marker([toLat, toLng], { icon: destIcon }).addTo(map).bindPopup(destName);

    // Ajustar vista para ver toda la ruta
    if (routeLayer) map.fitBounds(routeLayer.getBounds(), { padding: [60, 60] });

    // Tracking GPS
    watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        lastUserPos = { lat, lng };
        updateUserMarker(map, lat, lng);

        // ¿Llegué?
        const distToDest = haversine(lat, lng, toLat, toLng);
        if (distToDest < 30) {
          document.getElementById('pc-nav-step-text').textContent = '🎉 ¡Llegaste a tu destino!';
          document.getElementById('pc-nav-info').textContent = '';
          setTimeout(() => stop(), 4000);
          return;
        }

        // ¿Me desvié?
        const distToRoute = minDistToRoute(lat, lng, routeCoords);
        if (distToRoute > DEVIATION_METERS) {
          showRecalc(true);
          clearTimeout(recalcTimer);
          recalcTimer = setTimeout(async () => {
            try {
              route = await fetchRoute(lat, lng, toLat, toLng);
              routeCoords = drawRoute(map, route.geometry);
              steps = route.legs[0].steps;
              showRecalc(false);
            } catch {}
          }, 2000);
        } else {
          showRecalc(false);
        }

        // Actualizar panel
        const nextStep = getNextStep(steps, lat, lng);
        const remaining = haversine(lat, lng, toLat, toLng);
        const timeEst = route.duration * (remaining / route.distance);
        updatePanel(remaining, timeEst, nextStep);

        // Seguir con el mapa centrado
        map.setView([lat, lng], map.getZoom());
      },
      (err) => console.warn('GPS error:', err),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }

  /* ── DETENER ──────────────────────────── */

  function stop() {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    isNavigating = false;
    clearTimeout(recalcTimer);
    removePanel();
    if (routeLayer && window._pcMap) window._pcMap.removeLayer(routeLayer);
    if (userMarker && window._pcMap) window._pcMap.removeLayer(userMarker);
    routeLayer = null;
    userMarker = null;
    lastUserPos = null;
  }

  return { start, stop };
})();
