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
    const myStoreLink = document.getElementById("myStoreLink");

    const meRes = await fetch("/api/me", {
      credentials: "include"
    });

    if (!meRes.ok) return;

    const me = await meRes.json();

    if (me.role !== "seller") {
      myStoreLink.textContent = "Mi perfil";
      myStoreLink.href = "/profile";
      return;
    }

    const res = await fetch("/api/my-store", {
      credentials: "include"
    });

    if (res.status === 404) {
      myStoreLink.textContent = "Mi tienda";
      myStoreLink.href = "/dashboard";
      return;
    }

    if (!res.ok) throw new Error("Error");

    const store = await res.json();

    myStoreLink.textContent = "Mi tienda";
    myStoreLink.href = `/store/${store.id}?edit=true`;

  } catch (error) {
    console.log("Error cargando menú");
  }
}

// ===============================
// LOGOUT
// ===============================

const logoutBtn = document.getElementById("logoutBtn");

if(logoutBtn){
  logoutBtn.addEventListener("click", async () => {
    try {
      const csrfToken = await getCsrfToken();

      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "x-csrf-token": csrfToken
        }
      });

      window.location.href = "/";
    } catch (error) {
      console.error("Error en logout:", error);
    }
  });
}

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
