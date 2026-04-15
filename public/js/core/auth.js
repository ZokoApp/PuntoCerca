// ===============================
// MENU USUARIO
// ===============================

const userMenuBtn = document.getElementById("userMenuBtn");
const userDropdown = document.getElementById("userDropdown");

if(userMenuBtn){
  userMenuBtn.addEventListener("click", () => {
    userDropdown.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
      userDropdown.classList.add("hidden");
    }
  });
}

// ===============================
// CSRF
// ===============================

async function getCsrfToken() {
  const response = await fetch("/api/csrf-token", {
    credentials: "include"
  });
  const data = await response.json();
  return data.csrfToken;
}

// ===============================
// AUTH CHECK
// ===============================

async function checkAuth() {
  const userMenu = document.getElementById("userMenu");
  const nameEl = document.getElementById("userName");
  const loginLink = document.getElementById("loginLink");
  const registerLink = document.getElementById("registerLink");

  try {
    const response = await fetch("/api/me", {
      credentials: "include"
    });

    // 🔥 NO LOGUEADO
    if (!response.ok) {
      if (userMenu) userMenu.classList.add("hidden");
      if (loginLink) loginLink.style.display = "inline-block";
      if (registerLink) registerLink.style.display = "inline-block";
      return;
    }

    const user = await response.json();

    // 🔥 LOGUEADO
    if (nameEl) nameEl.textContent = user.name;

    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";

    if (userMenu) userMenu.classList.remove("hidden");

  } catch (err) {
    console.log("Error auth:", err);

    // fallback → mostrar como deslogueado
    if (userMenu) userMenu.classList.add("hidden");
    if (loginLink) loginLink.style.display = "inline-block";
    if (registerLink) registerLink.style.display = "inline-block";
  }
}

// ===============================
// CONFIG MENU
// ===============================

async function setupUserMenu() {
  try {
    const res = await fetch("/api/me", {
      credentials: "include"
    });

    if (!res.ok) return;

    const user = await res.json();

    const dropdown = document.getElementById("userDropdown");
    if (!dropdown) return;

    let html = "";

    // 🔥 SI ES SELLER → BUSCAR SU TIENDA REAL
    if (user.role === "seller") {

      let storeLink = "#";

      try {
        const storeRes = await fetch("/api/my-store", {
          credentials: "include"
        });

        if (storeRes.ok) {
          const store = await storeRes.json();
          storeLink = `/store/${store.id}`;
        }
      } catch {}

      html = `
        <a href="${storeLink}" class="block px-3 py-2 hover:bg-gray-100 rounded">
          Ver mi tienda
        </a>

        <a href="/dashboard" class="block px-3 py-2 hover:bg-gray-100 rounded">
          Dashboard
        </a>

        <button id="logoutBtn" class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-red-500">
          Logout
        </button>
      `;

    } else {

      html = `
        <a href="/profile" class="block px-3 py-2 hover:bg-gray-100 rounded">
          Ver mi perfil
        </a>

        <a href="/dashboard-user" class="block px-3 py-2 hover:bg-gray-100 rounded">
          Dashboard
        </a>

        <button id="logoutBtn" class="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-red-500">
          Logout
        </button>
      `;
    }

    dropdown.innerHTML = html;

    // 🔥 LOGOUT dinámico
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        const csrfToken = await getCsrfToken();

        await fetch("/api/logout", {
          method: "POST",
          credentials: "include",
          headers: {
            "x-csrf-token": csrfToken
          }
        });

        window.location.href = "/";
      });
    }

  } catch (err) {
    console.error(err);
  }
}
// ===============================
// LOGOUT
// ===============================



// ===============================
// INIT
// ===============================



async function setupDashboardLink() {

  try {
    const res = await fetch('/api/me', {
      credentials: 'include'
    });

    if (!res.ok) return;

    const user = await res.json();

    const link = document.getElementById("dashboardLink");

    if (!link) return;

    if (user.role === "seller") {
      link.href = "/dashboard";
    } else {
      link.href = "/dashboard-user";
    }

  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  setupUserMenu();
  setupDashboardLink();
});
