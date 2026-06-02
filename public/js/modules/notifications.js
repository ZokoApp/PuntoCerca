let notifications = [];
let isOpen = false;
let isOpenMobile = false;

// ===============================
// INIT
// ===============================
window.initNotifications = async function() {

  // ===== DESKTOP =====
  const btn = document.getElementById("notifBtn");
  const dropdown = document.getElementById("notifDropdown");
  const list = document.getElementById("notifList");
  const countEl = document.getElementById("notifCount");

  // ===== MOBILE =====
  const btnMobile = document.getElementById("notifBtnMobile");
  const dropdownMobile = document.getElementById("notifDropdownMobile");
  const listMobile = document.getElementById("notifListMobile");
  const countMobile = document.getElementById("notifCountMobile");

  // verificar sesión
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if (!res.ok) {
      const wrapper = document.getElementById("notifWrapper");
      if (wrapper) wrapper.style.display = "none";
      return;
    }
  } catch {
    const wrapper = document.getElementById("notifWrapper");
    if (wrapper) wrapper.style.display = "none";
    return;
  }

  // cargar datos
  await loadNotifications(list, listMobile);
  await loadUnreadCount(countEl, countMobile);

  // ===== EVENTOS DESKTOP =====
  if (btn && dropdown) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      isOpen = !isOpen;
      dropdown.classList.toggle("hidden", !isOpen);
    });

    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target) && e.target !== btn) {
        dropdown.classList.add("hidden");
        isOpen = false;
      }
    });
  }

  // ===== EVENTOS MOBILE =====
  if (btnMobile && dropdownMobile) {
    btnMobile.addEventListener("click", (e) => {
      e.stopPropagation();
      isOpenMobile = !isOpenMobile;
      dropdownMobile.classList.toggle("hidden", !isOpenMobile);
    });

    document.addEventListener("click", (e) => {
      if (!dropdownMobile.contains(e.target) && e.target !== btnMobile) {
        dropdownMobile.classList.add("hidden");
        isOpenMobile = false;
      }
    });
  }
};

// ===============================
// LOAD
// ===============================
async function loadNotifications(list, listMobile) {
  try {
    const res = await fetch("/api/notifications", { credentials: "include" });
    if (!res.ok) return;
    notifications = await res.json();
    if (list) renderNotifications(list);
    if (listMobile) renderNotifications(listMobile);
  } catch (err) {
    console.error("Error cargando notificaciones", err);
  }
}

async function loadUnreadCount(countEl, countMobile) {
  try {
    const res = await fetch("/api/notifications/unread-count", { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    if (data.count > 0) {
      if (countEl) {
        countEl.innerText = data.count;
        countEl.classList.remove("hidden");
      }
      if (countMobile) {
        countMobile.innerText = data.count;
        countMobile.style.display = "flex";
      }
    }
  } catch (err) {
    console.error(err);
  }
}

// ===============================
// RENDER
// ===============================
function renderNotifications(list) {
  if (!notifications.length) {
    list.innerHTML = `<div class="p-4 text-sm text-gray-500">No hay notificaciones</div>`;
    return;
  }
  list.innerHTML = notifications.map(n => `
    <div 
      class="p-3 hover:bg-gray-100 cursor-pointer ${n.is_read ? '' : 'bg-orange-50'}"
      onclick="openNotification(${n.id}, '${n.link || ''}')"
    >
      <div class="font-semibold text-sm">${n.title}</div>
      <div class="text-xs text-gray-500 mt-1">${n.message}</div>
    </div>
  `).join('');
}

// ===============================
// ACTIONS
// ===============================
window.openNotification = async function(id, link) {
  try {
    await fetch(`/api/notifications/${id}/read`, {
      method: "PUT",
      credentials: "include"
    });
  } catch {}
  if (link) window.location.href = link;
};
