  import { showToast } from "/js/utils/toast.js";
  import { CATEGORIES } from "/js/data/categories.js";
  
  const param = window.location.pathname.split("/").pop();
  
  if (!param || param === "null") {
    showToast("ID de producto inválido", "error");
    throw new Error("ID inválido");
  }
  
  // 🔥 detectar ID o SLUG
  const isId = !isNaN(param);
  
  const GET_URL = isId
    ? `/api/products/${param}`
    : `/api/products/slug/${param}`;
  
  const UPDATE_URL = isId
    ? `/api/products/${param}`
    : `/api/products/${param}`;
  
  // ============================
  // ELEMENTOS (IMPORTANTE ARRIBA)
  // ============================
  
  const priceInput = document.getElementById("price");
  const checkbox = document.getElementById("priceOnRequest");
  
  // ============================
  // CATEGORÍAS DINÁMICAS
  // ============================
  
  function loadCategories(selectedCategory, selectedSub = null) {
    const catSelect = document.getElementById("category");
    const subSelect = document.getElementById("subcategory");
    const subContainer = document.getElementById("subcategoriesContainer");
  
    if (!catSelect) return;
  
    catSelect.innerHTML = `<option value="">Seleccionar categoría</option>`;
  
    Object.keys(CATEGORIES).forEach(cat => {
      const option = document.createElement("option");
      option.value = cat;
      option.textContent = cat;
  
      if (cat === selectedCategory) option.selected = true;
  
      catSelect.appendChild(option);
    });
  
    if (selectedCategory && CATEGORIES[selectedCategory]) {
      subContainer.classList.remove("hidden");
  
      subSelect.innerHTML = `<option value="">Subcategoría</option>`;
  
      CATEGORIES[selectedCategory].forEach(sub => {
        const option = document.createElement("option");
        option.value = sub.id;
        option.textContent = sub.name;
  
        if (sub.id == selectedSub) option.selected = true;
  
        subSelect.appendChild(option);
      });
    } else {
      subContainer.classList.add("hidden");
    }
  
    catSelect.addEventListener("change", () => {
      loadCategories(catSelect.value);
    });
  }
  
  // ============================
  // CARGAR PRODUCTO
  // ============================
  
  async function loadProduct() {
    try {
      const res = await fetch(GET_URL);
  
      if (!res.ok) {
        showToast("Error cargando producto", "error");
        return;
      }
  
      const product = await res.json();
  
      // título preview
      const titlePreview = document.getElementById("productTitlePreview");
      if (titlePreview) {
        titlePreview.innerText = product.name;
      }
  
      document.getElementById("name").value = product.name || "";
  
      // 🔥 PRECIO / CONSULTAR
      if (
  product.price === null ||
  product.price === undefined ||
  product.price === "" ||
  isNaN(product.price)
) {
  checkbox.checked = true;
  priceInput.disabled = true;
  priceInput.value = "";
} else {
  checkbox.checked = false;
  priceInput.disabled = false;
  priceInput.value = Number(product.price);
}
  
      document.getElementById("old_price").value = product.old_price || "";
      document.getElementById("brand").value = product.brand || "";
      document.getElementById("size").value = product.size || "";
      document.getElementById("stock").value = product.stock || "";
      document.getElementById("isOffer").checked = product.is_offer;
  
      // descripción
      let description = "";
  
      try {
        const parsed = typeof product.extra === "string"
          ? JSON.parse(product.extra)
          : product.extra;
  
        description = parsed?.description || product.extra || "";
      } catch {
        description = product.extra || "";
      }
  
      document.getElementById("extra").value = description;
  
      // categorías
      loadCategories(product.category, product.subcategory_id);
  
      // botón ver producto
      const viewBtn = document.getElementById("viewProductBtn");
      if (viewBtn) {
        viewBtn.href = `/product/${product.slug || product.id}`;
      }
  
    } catch (err) {
      console.error(err);
      showToast("Error cargando producto", "error");
    }
  }
  
  // ============================
  // CHECKBOX COMPORTAMIENTO
  // ============================
  
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      priceInput.value = "";
      priceInput.disabled = true;
    } else {
      priceInput.disabled = false;
    }
  });
  
  // ============================
  // SUBMIT
  // ============================
  
  document.getElementById("editProductForm").addEventListener("submit", async (e) => {
    e.preventDefault();
  
    const saveBtn = document.getElementById("saveBtn");
    const overlay = document.getElementById("loadingOverlay");
  
    try {
      saveBtn.disabled = true;
      overlay?.classList.remove("hidden");
  
      const formData = new FormData();
  
      formData.append("name", document.getElementById("name").value);
  
      // 🔥 PRECIO
   if (checkbox.checked) {
  formData.append("price", "null"); // 🔥 clave
} else {
  const priceValue = parseFloat(priceInput.value);

  if (isNaN(priceValue)) {
    showToast("Precio inválido", "error");
    return;
  }

  formData.append("price", priceValue);
}
  
      formData.append("old_price", document.getElementById("old_price").value);
      formData.append("brand", document.getElementById("brand").value);
      formData.append("size", document.getElementById("size").value);
      formData.append("stock", document.getElementById("stock").value);
  
      formData.append("extra", JSON.stringify({
        description: document.getElementById("extra").value
      }));
  
      formData.append("category", document.getElementById("category").value);
  
      const subcategory = document.getElementById("subcategory")?.value;
      if (subcategory) {
        formData.append("subcategory_id", subcategory);
      }
  
      formData.append("is_offer", document.getElementById("isOffer").checked);
  
      const files = document.getElementById("images").files;
  
      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }
  
      const res = await fetch(UPDATE_URL, {
        method: "PUT",
        credentials: "include",
        body: formData
      });
  
      if (!res.ok) throw new Error();
  
      showToast("Producto actualizado", "success");
  
      setTimeout(() => {
        window.location.href = `/product/${param}`;
      }, 1500);
  
    } catch (err) {
      console.error(err);
      showToast("Error actualizando producto", "error");
    } finally {
      saveBtn.disabled = false;
      overlay?.classList.add("hidden");
    }
  });
  
  // ============================
  // INIT
  // ============================
  
  loadProduct();
