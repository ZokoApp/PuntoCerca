let myStoreId = null;

// cargar tienda del usuario
async function loadMyStore() {
  try {
    const res = await fetch("/api/my-store", {
      credentials: "include"
    });

    if (!res.ok) throw new Error();

    const store = await res.json();
    myStoreId = store.id;

    console.log("Mi tienda:", myStoreId);

  } catch (err) {
    alert("No tenés tienda creada");
  }
}

// llamar al cargar
loadMyStore();

document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!myStoreId) {
    alert("Error: tienda no cargada");
    return;
  }

  const formData = new FormData();

  formData.append("name", document.getElementById("name").value);
formData.append("price", document.getElementById("price").value);
formData.append("brand", document.getElementById("brand").value);
formData.append("size", document.getElementById("size").value);
formData.append("stock", document.getElementById("stock").value);
formData.append("extra", document.getElementById("extra").value);
formData.append("category", document.getElementById("category").value);
formData.append("is_offer", document.getElementById("isOffer").checked);

  //  obtener colores seleccionados
  const selectedColors = Array.from(
    document.getElementById("colors").selectedOptions
  ).map(option => option.value);

  // 🔥 enviar colores como JSON
  formData.append("colors", JSON.stringify(selectedColors));

  // tienda
  formData.append("store_id", myStoreId);

  // imágenes
  const files = document.getElementById("productImages").files;

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

    if (!res.ok) throw new Error();

    alert("Producto creado 🚀");

    window.location.href = "/dashboard";

  } catch (err) {
    console.error(err);
    alert("Error creando producto");
  }
});