import { CATEGORIES } from './data/categories.js';

let myStoreId = null;

// =============================
// TOAST
// =============================
function showToast(message, type = "success") {
  const bg = { success: "#22c55e", error: "#ef4444", warning: "#f59e0b" };
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.style.cssText = "position:fixed;top:20px;right:20px;z-index:999999;display:flex;flex-direction:column;gap:10px;";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.style.cssText = `background:${bg[type]};color:white;padding:14px 20px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.12);display:flex;align-items:center;gap:12px;font-size:14px;font-weight:500;min-width:260px;`;
  toast.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()" style="margin-left:auto;background:none;border:none;color:white;font-size:16px;cursor:pointer;">✕</button>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// =============================
// CARGAR TIENDA DEL USUARIO
// =============================
async function loadMyStore() {
  try {
    const res = await fetch("/api/my-store", { credentials: "include" });
    if (!res.ok) throw new Error("No se pudo cargar la tienda");
    const store = await res.json();
    myStoreId = store.id;
  } catch (err) {
    console.error(err);
    showToast("No tenés tienda creada", "error");
  }
}

// =============================
// CAMPOS DINÁMICOS
// =============================
function toggleField(checkId, fieldId) {
  const check = document.getElementById(checkId);
  const field = document.getElementById(fieldId);
  if (!check || !field) return;
  const sync = () => { field.classList.toggle("hidden", !check.checked); };
  check.addEventListener("change", sync);
  sync();
}

// =============================
// INIT
// =============================
document.addEventListener("DOMContentLoaded", async () => {

  await loadMyStore();

  toggleField("checkSizes", "sizesField");
  toggleField("checkColors", "colorsField");
  toggleField("checkSKU", "skuField");
  toggleField("checkMaterial", "materialField");

  initCategories();

  const form = document.getElementById("productForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!myStoreId) {
      showToast("Error: tienda no cargada", "error");
      return;
    }

    const formData = new FormData();

    const name = document.getElementById("name")?.value.trim();
    const price = document.getElementById("price")?.value.trim();
    const brand = document.getElementById("brand")?.value.trim();
    const model = document.getElementById("model")?.value.trim();
    const category = document.getElementById("category")?.value;
    const subcategory = document.getElementById("subcategory")?.value;
    const imageUrl = document.getElementById("image_url")?.value.trim();
    const description = document.getElementById("description")?.value.trim();
    const isOffer = document.getElementById("isOffer")?.checked;
    const priceOnRequest = document.getElementById("priceOnRequest")?.checked;

    // VALIDACIONES
    if (!name) { showToast("Ingresá el nombre del producto", "warning"); return; }
    if (!price && !priceOnRequest) { showToast("Ingresá el precio o marcá 'Precio a consultar'", "warning"); return; }
    if (!category) { showToast("Seleccioná una categoría", "warning"); return; }
    if (!subcategory) { showToast("Seleccioná una subcategoría", "warning"); return; }

    // dinámicos
    const sizes = document.getElementById("checkSizes")?.checked
      ? document.getElementById("sizes")?.value.trim() : "";

    const colors = document.getElementById("checkColors")?.checked
      ? Array.from(document.getElementById("colors").selectedOptions).map(o => o.value) : [];

    const sku = document.getElementById("checkSKU")?.checked
      ? document.getElementById("sku")?.value.trim() : "";

    const material = document.getElementById("checkMaterial")?.checked
      ? document.getElementById("material")?.value.trim() : "";

    // imágenes
    const files = document.getElementById("productImages")?.files || [];
    if (files.length > 5) {
      showToast("Máximo 5 imágenes permitidas", "warning");
      return;
    }

    // APPEND DATA
    const finalPrice = priceOnRequest ? "" : price;
    formData.append("name", name);
    formData.append("price", finalPrice);
    formData.append("brand", brand);
    formData.append("category", category);
    formData.append("subcategory_id", subcategory);
    formData.append("store_id", myStoreId);
    formData.append("is_offer", isOffer);
    formData.append("image_url", imageUrl || "");
    formData.append("extra", JSON.stringify({ model, sku, material, description, sizes }));
    formData.append("colors", JSON.stringify(colors));

    for (let file of files) {
      formData.append("images", file);
    }

    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Publicando...";

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error creando producto");
      }

      showToast("Producto creado 🚀", "success");
      setTimeout(() => { window.location.href = "/dashboard"; }, 1500);

    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "Publicar producto";
    }
  });
});

const priceInput = document.getElementById("price");
const priceCheckbox = document.getElementById("priceOnRequest");

if (priceInput && priceCheckbox) {
  priceCheckbox.addEventListener("change", () => {
    if (priceCheckbox.checked) {
      priceInput.value = "";
      priceInput.disabled = true;
    } else {
      priceInput.disabled = false;
    }
  });
}

// =============================
// CATEGORÍAS + SUBCATEGORÍAS
// =============================
function initCategories() {
  const categorySelect = document.getElementById("category");
  const subcategorySelect = document.getElementById("subcategory");
  if (!categorySelect || !subcategorySelect) return;

  categorySelect.innerHTML = `
    <option value="">Seleccionar categoría</option>
    ${Object.keys(CATEGORIES).map(cat => `
      <option value="${cat}">${cat}</option>
    `).join("")}
  `;

  categorySelect.addEventListener("change", () => {
    const cat = categorySelect.value;
    const subs = CATEGORIES[cat];
    if (!subs) {
      subcategorySelect.innerHTML = `<option value="">Sin subcategorías</option>`;
      return;
    }
    subcategorySelect.innerHTML = `
      <option value="">Seleccionar subcategoría</option>
      ${subs.map(sub => `
        <option value="${sub.id}">${sub.name}</option>
      `).join("")}
    `;
  });
}
