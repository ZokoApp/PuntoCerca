let notifications = [];
let isOpen = false;

const btn = document.getElementById("notifBtn");
const dropdown = document.getElementById("notifDropdown");
const list = document.getElementById("notifList");
const countEl = document.getElementById("notifCount");

// ===============================
// INIT
// ===============================

export async function initNotifications(){

  if (!btn) return;

  await loadNotifications();
  await loadUnreadCount();

  btn.addEventListener("click", toggleDropdown);

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== btn){
      dropdown.classList.add("hidden");
      isOpen = false;
    }
  });
}

// ===============================
// LOAD
// ===============================

async function loadNotifications(){
  try {
    const res = await fetch("/api/notifications", {
      credentials: "include"
    });

    if (!res.ok) return;

    notifications = await res.json();
    renderNotifications();

  } catch (err){
    console.error("Error cargando notificaciones", err);
  }
}

async function loadUnreadCount(){
  try {
    const res = await fetch("/api/notifications/unread-count", {
      credentials: "include"
    });

    if (!res.ok) return;

    const data = await res.json();

    if (data.count > 0){
      countEl.innerText = data.count;
      countEl.classList.remove("hidden");
    }

  } catch (err){
    console.error(err);
  }
}

// ===============================
// RENDER
// ===============================

function renderNotifications(){

  if (!notifications.length){
    list.innerHTML = `
      <div class="p-4 text-gray-500">
        No hay notificaciones
      </div>
    `;
    return;
  }

  list.innerHTML = notifications.map(n => `
    <div 
      class="p-3 hover:bg-gray-100 cursor-pointer ${n.is_read ? '' : 'bg-orange-50'}"
      onclick="openNotification(${n.id}, '${n.link || ''}')"
    >
      <div class="font-semibold">${n.title}</div>
      <div class="text-xs text-gray-600">${n.message}</div>
    </div>
  `).join('');
}

// ===============================
// ACTIONS
// ===============================

window.openNotification = async function(id, link){

  try {
    await fetch(`/api/notifications/${id}/read`, {
      method: "PUT",
      credentials: "include"
    });
  } catch {}

  if (link){
    window.location.href = link;
  }
};

function toggleDropdown(){
  isOpen = !isOpen;

  if (isOpen){
    dropdown.classList.remove("hidden");
  } else {
    dropdown.classList.add("hidden");
  }
}
