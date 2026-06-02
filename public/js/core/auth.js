// ===============================
// CSRF
// ===============================
async function getCsrfToken() {
  const response = await fetch("/api/csrf-token", { credentials: "include" });
  const data = await response.json();
  return data.csrfToken;
}

// ===============================
// LOGOUT
// ===============================
async function logout() {
  try {
    const csrfToken = await getCsrfToken();
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
      headers: { "x-csrf-token": csrfToken }
    });
    location.reload();
  } catch (err) {
    console.error(err);
  }
}

// ===============================
// RENDER AUTH UI
// ===============================
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

      // Desktop
      if (loginLink) loginLink.style.display = "none";
      if (registerLink) registerLink.style.display = "none";
      if (userMenu) userMenu.classList.remove("hidden");
      if (userName) userName.textContent = user.name || "Mi cuenta";

      // Mobile
      if (loginLinkMobile) loginLinkMobile.style.display = "none";
      if (registerLinkMobile) registerLinkMobile.style.display = "none";
      if (userMenuMobile) {
  userMenuMobile.classList.remove("hidden");
  userMenuMobile.style.display = "flex";
}
      if (userNameMobile) userNameMobile.textContent = user.name || "";

      // Obtener link tienda
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

      // HTML del dropdown
      const dropdownHTML = user.role === "seller" ? `
        <a href="${storeLink}" class="flex items-center gap-2 px-3 py-2.5 hover:bg-orange-50 rounded-xl text-sm font-medium text-gray-700 hover:text-orange-600 transition">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>
          Ver mi tienda
        </a>
        <a href="/dashboard" class="flex items-center gap-2 px-3 py-2.5 hover:bg-orange-50 rounded-xl text-sm font-medium text-gray-700 hover:text-orange-600 transition">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
          Dashboard
        </a>
        <div class="border-t border-gray-100 my-1"></div>
        <button class="logout-btn w-full flex items-center gap-2 px-3 py-2.5 hover:bg-red-50 rounded-xl text-sm font-medium text-red-500 hover:text-red-600 transition">
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
        <button class="logout-btn w-full flex items-center gap-2 px-3 py-2.5 hover:bg-red-50 rounded-xl text-sm font-medium text-red-500 hover:text-red-600 transition">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
          Cerrar sesión
        </button>
      `;

      // Dropdown DESKTOP
      const dropdown = document.getElementById("userDropdown");
      if (dropdown) {
        dropdown.innerHTML = dropdownHTML;
        dropdown.querySelectorAll(".logout-btn").forEach(btn => {
          btn.addEventListener("click", logout);
        });
      }

      // Dropdown MOBILE
      const dropdownMobile = document.getElementById("userDropdownMobile");
      if (dropdownMobile) {
        dropdownMobile.innerHTML = dropdownHTML;
        dropdownMobile.querySelectorAll(".logout-btn").forEach(btn => {
          btn.addEventListener("click", logout);
        });
      }

      // Toggle DESKTOP
      const userMenuBtn = document.getElementById("userMenuBtn");
      if (userMenuBtn && dropdown) {
        userMenuBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          dropdown.classList.toggle("hidden");
        });
        document.addEventListener("click", (e) => {
          if (!dropdown.contains(e.target) && e.target !== userMenuBtn) {
            dropdown.classList.add("hidden");
          }
        });
      }

      // Toggle MOBILE
      const userMenuBtnMobile = document.getElementById("userMenuBtnMobile");
      if (userMenuBtnMobile && dropdownMobile) {
        userMenuBtnMobile.addEventListener("click", (e) => {
          e.stopPropagation();
          dropdownMobile.classList.toggle("hidden");
        });
        document.addEventListener("click", (e) => {
          if (!dropdownMobile.contains(e.target) && e.target !== userMenuBtnMobile) {
            dropdownMobile.classList.add("hidden");
          }
        });
      }

      // Notificaciones — iniciar después del render
      if (typeof initNotifications === "function") {
        initNotifications();
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

// ===============================
// DASHBOARD LINK
// ===============================
async function setupDashboardLink() {
  try {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (!res.ok) return;
    const user = await res.json();
    const link = document.getElementById("dashboardLink");
    if (!link) return;
    link.href = user.role === "seller" ? "/dashboard" : "/dashboard-user";
  } catch (err) {
    console.error(err);
  }
}

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  renderAuthUI();
  setupDashboardLink();
});
