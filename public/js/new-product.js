import { CATEGORIES } from './data/categories.js';

let myStoreId = null;

// =============================
// CARGAR TIENDA DEL USUARIO
// =============================
async function loadMyStore() {
  try {
    const res = await fetch("/api/my-store", {
      credentials: "include"
    });

    if (!res.ok) throw new Error("No se pudo cargar la tienda");

    const store = await res.json();
    myStoreId = store.id;

  } catch (err) {
    console.error(err);
    alert("No tenés tienda creada");
  }
}

// =============================
// CAMPOS DINÁMICOS
// =============================
function toggleField(checkId, fieldId) {
  const check = document.getElementById(checkId);
  const field = document.getElementById(fieldId);

  if (!check || !field) return;

  const sync = () => {
    field.classList.toggle("hidden", !check.checked);
  };

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
      alert("Error: tienda no cargada");
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

    // ⚠️ VALIDACIONES IMPORTANTES
    if (!name) return alert("Ingresá el nombre");
    if (!price) return alert("Ingresá el precio");
    if (!category) return alert("Seleccioná una categoría");
    if (!subcategory) return alert("Seleccioná una subcategoría");

    // dinámicos
    const sizes = document.getElementById("checkSizes")?.checked
      ? document.getElementById("sizes")?.value.trim()
      : "";

    const colors = document.getElementById("checkColors")?.checked
      ? Array.from(document.getElementById("colors").selectedOptions).map(o => o.value)
      : [];

    const sku = document.getElementById("checkSKU")?.checked
      ? document.getElementById("sku")?.value.trim()
      : "";

    const material = document.getElementById("checkMaterial")?.checked
      ? document.getElementById("material")?.value.trim()
      : "";

    // =============================
    // APPEND DATA
    // =============================

    formData.append("name", name);
    formData.append("price", price);
    formData.append("brand", brand);
    formData.append("category", category);
    formData.append("subcategory_id", subcategory); // 🔥 CLAVE
    formData.append("store_id", myStoreId);
    formData.append("is_offer", isOffer);
    formData.append("image_url", imageUrl || "");

    formData.append("extra", JSON.stringify({
      model,
      sku,
      material,
      description,
      sizes
    }));

    formData.append("colors", JSON.stringify(colors));

    // imágenes
    const files = document.getElementById("productImages")?.files || [];

    if (files.length > 5) {
      return alert("Máximo 5 imágenes");
    }

    for (let file of files) {
      formData.append("images", file);
    }

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

      alert("Producto creado 🚀");
      window.location.href = "/dashboard";

    } catch (err) {
      console.error(err);
      alert(err.message);
    }

  });

});


// =============================
// CATEGORÍAS + SUBCATEGORÍAS
// =============================
function initCategories(){

  const categorySelect = document.getElementById("category");
  const subcategorySelect = document.getElementById("subcategory");

  if (!categorySelect || !subcategorySelect) return;

  // cargar categorías
  categorySelect.innerHTML = `
    <option value="">Seleccionar categoría</option>
    ${Object.keys(CATEGORIES).map(cat => `
      <option value="${cat}">${cat}</option>
    `).join("")}
  `;

  // cambio de categoría
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
