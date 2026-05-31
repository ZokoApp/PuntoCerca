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

const loginLinkMobile = document.getElementById("loginLinkMobile");
const registerLinkMobile = document.getElementById("registerLinkMobile");
  const userMenuMobile = document.getElementById("userMenuMobile");
const userNameMobile = document.getElementById("userNameMobile");

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

if (userNameMobile) {
  userNameMobile.textContent = user.name;
}
   if (loginLink) loginLink.style.display = "none";
if (registerLink) registerLink.style.display = "none";

if (loginLinkMobile) loginLinkMobile.style.display = "none";
if (registerLinkMobile) registerLinkMobile.style.display = "none";

   if (userMenu) userMenu.classList.remove("hidden");

if (userMenuMobile) {
  userMenuMobile.classList.remove("hidden");
}

  }catch (err) {
    console.log("Error auth:", err);

    // fallback → mostrar como deslogueado
   if (userMenu) userMenu.classList.add("hidden");

if (userMenuMobile) {
  userMenuMobile.classList.add("hidden");
}
   if (loginLink) loginLink.style.display = "inline-block";
if (registerLink) registerLink.style.display = "inline-block";

if (loginLinkMobile) loginLinkMobile.style.display = "inline-block";
if (registerLinkMobile) registerLinkMobile.style.display = "inline-block";
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
async function renderAuthUI() {
  try {
    const res = await fetch("/api/me", { credentials: "include" });

    const loginLink = document.getElementById("loginLink");
    const registerLink = document.getElementById("registerLink");
    const userMenu = document.getElementById("userMenu");
    const userName = document.getElementById("userName");
    const loginLinkMobile = document.getElementById("loginLinkMobile");
    const registerLinkMobile = document.getElementById("registerLinkMobile");
    const userMenuMobile = document.getElementById("userMenuMobile");
    const userNameMobile = document.getElementById("userNameMobile");

    if (res.ok) {
      const user = await res.json();

      // Desktop — mostrar user menu, ocultar login/register
      if (loginLink) loginLink.style.display = "none";
      if (registerLink) registerLink.style.display = "none";
      if (userMenu) userMenu.classList.remove("hidden");
      if (userName) userName.textContent = user.name || "Mi cuenta";

      // Mobile — mostrar avatar, ocultar login/register
      if (loginLinkMobile) loginLinkMobile.style.display = "none";
      if (registerLinkMobile) registerLinkMobile.style.display = "none";
      if (userMenuMobile) userMenuMobile.classList.remove("hidden");
      if (userNameMobile) userNameMobile.textContent = user.name || "";

      // Dropdown desktop
      const dropdown = document.getElementById("userDropdown");
      if (dropdown) {
        let storeLink = "/dashboard";
        if (user.role === "seller") {
          try {
            const storeRes = await fetch("/api/my-store", { credentials: "include" });
            if (storeRes.ok) {
              const store = await storeRes.json();
              storeLink = `/${store.slug}`;
            }
          } catch {}
        }

        dropdown.innerHTML = user.role === "seller" ? `
          <a href="${storeLink}" class="flex items-center gap-2 px-3 py-2.5 hover:bg-orange-50 rounded-xl text-sm font-medium text-gray-700 hover:text-orange-600 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>
            Ver mi tienda
          </a>
          <a href="/dashboard" class="flex items-center gap-2 px-3 py-2.5 hover:bg-orange-50 rounded-xl text-sm font-medium text-gray-700 hover:text-orange-600 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
            Dashboard
          </a>
          <div class="border-t border-gray-100 my-1"></div>
          <button id="logoutBtn" class="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-red-50 rounded-xl text-sm font-medium text-red-500 hover:text-red-600 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
            Cerrar sesión
          </button>
        ` : `
          <a href="/profile" class="flex items-center gap-2 px-3 py-2.5 hover:bg-orange-50 rounded-xl text-sm font-medium text-gray-700 hover:text-orange-600 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            Mi perfil
          </a>
          <a href="/dashboard-user" class="flex items-center gap-2 px-3 py-2.5 hover:bg-orange-50 rounded-xl text-sm font-medium text-gray-700 hover:text-orange-600 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
            Dashboard
          </a>
          <div class="border-t border-gray-100 my-1"></div>
          <button id="logoutBtn" class="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-red-50 rounded-xl text-sm font-medium text-red-500 hover:text-red-600 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
            Cerrar sesión
          </button>
        `;

        setTimeout(() => {
          document.getElementById("logoutBtn")?.addEventListener("click", logout);
        }, 50);
      }

    } else {
      // No logueado
      if (loginLink) loginLink.style.display = "";
      if (registerLink) registerLink.style.display = "";
      if (userMenu) userMenu.classList.add("hidden");
      if (loginLinkMobile) loginLinkMobile.style.display = "";
      if (registerLinkMobile) registerLinkMobile.style.display = "";
      if (userMenuMobile) userMenuMobile.classList.add("hidden");
    }

  } catch (err) {
    console.error("Error auth UI:", err);
  }
}

async function logout() {
  try {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include"
    });

    location.reload();

  } catch (err) {
    console.error(err);
  }
}

// document.addEventListener("DOMContentLoaded", renderAuthUI);
