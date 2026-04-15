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

    console.log("Mi tienda:", myStoreId);
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

  const form = document.getElementById("productForm");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!myStoreId) {
      alert("Error: tienda no cargada");
      return;
    }

    const formData = new FormData();

    const name = document.getElementById("name")?.value.trim() || "";
    const price = document.getElementById("price")?.value.trim() || "";
    const brand = document.getElementById("brand")?.value.trim() || "";
    const model = document.getElementById("model")?.value.trim() || "";
    const category = document.getElementById("category")?.value || "";
    const imageUrl = document.getElementById("image_url")?.value.trim() || "";
    const description = document.getElementById("description")?.value.trim() || "";
    const isOffer = document.getElementById("isOffer")?.checked || false;

    const checkSizes = document.getElementById("checkSizes")?.checked || false;
    const checkColors = document.getElementById("checkColors")?.checked || false;
    const checkSKU = document.getElementById("checkSKU")?.checked || false;
    const checkMaterial = document.getElementById("checkMaterial")?.checked || false;

    const sizes = checkSizes
      ? (document.getElementById("sizes")?.value.trim() || "")
      : "";

    const selectedColors = checkColors
      ? Array.from(document.getElementById("colors")?.selectedOptions || []).map(
          (option) => option.value
        )
      : [];

    const sku = checkSKU
      ? (document.getElementById("sku")?.value.trim() || "")
      : "";

    const material = checkMaterial
      ? (document.getElementById("material")?.value.trim() || "")
      : "";

    if (!name) {
      alert("Ingresá el nombre del producto");
      return;
    }

    if (!price) {
      alert("Ingresá el precio");
      return;
    }

    formData.append("name", name);
    formData.append("price", price);
    formData.append("brand", brand);
    formData.append("size", sizes);
    formData.append("category", category);
    formData.append("store_id", myStoreId);
    formData.append("is_offer", isOffer);
    formData.append("old_price", "");
    formData.append("image_url", imageUrl);

    // modelo + sku + material van dentro de extra
    const extraData = {
      model,
      sku,
      material,
      description
    };

    formData.append("extra", JSON.stringify(extraData));
    formData.append("colors", JSON.stringify(selectedColors));

    const files = document.getElementById("productImages")?.files || [];

    if (files.length > 5) {
      alert("Máximo 5 imágenes");
      return;
    }

    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
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
      alert(err.message || "Error creando producto");
    }
  });
});
