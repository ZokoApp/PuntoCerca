let notifications = [];
let isOpen = false;

// ===============================
// INIT
// ===============================
window.initNotifications = async function initNotifications() {

  const btn = document.getElementById("notifBtn");
  const dropdown = document.getElementById("notifDropdown");
  const list = document.getElementById("notifList");
  const countEl = document.getElementById("notifCount");

  if (!btn || !dropdown || !list || !countEl) return;

  // verificar sesión
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if (!res.ok) {
      btn.parentElement.style.display = "none";
      return;
    }
  } catch {
    btn.parentElement.style.display = "none";
    return;
  }

  await loadNotifications(list);
  await loadUnreadCount(countEl);

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

// ===============================
// LOAD
// ===============================
async function loadNotifications(list) {
  try {
    const res = await fetch("/api/notifications", { credentials: "include" });
    if (!res.ok) return;
    notifications = await res.json();
    renderNotifications(list);
  } catch (err) {
    console.error("Error cargando notificaciones", err);
  }
}

async function loadUnreadCount(countEl) {
  try {
    const res = await fetch("/api/notifications/unread-count", { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    if (data.count > 0) {
      countEl.innerText = data.count;
      countEl.classList.remove("hidden");
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
