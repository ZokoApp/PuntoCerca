const productId = window.location.pathname.split("/").pop();

// cargar producto
async function loadProduct() {
  const res = await fetch(`/api/products/${productId}`);
  const product = await res.json();

  document.getElementById("name").value = product.name;
  document.getElementById("price").value = product.price;
  document.getElementById("old_price").value = product.old_price || "";
  document.getElementById("brand").value = product.brand || "";
  document.getElementById("size").value = product.size || "";
  document.getElementById("stock").value = product.stock || "";
  document.getElementById("extra").value = product.extra || "";
  document.getElementById("category").value = product.category || "";
  document.getElementById("isOffer").checked = product.is_offer;
}

loadProduct();

// submit
document.getElementById("editProductForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();

  formData.append("name", document.getElementById("name").value);
  formData.append("price", document.getElementById("price").value);
  formData.append("old_price", document.getElementById("old_price").value);
  formData.append("brand", document.getElementById("brand").value);
  formData.append("size", document.getElementById("size").value);
  formData.append("stock", document.getElementById("stock").value);
  formData.append("extra", document.getElementById("extra").value);
  formData.append("category", document.getElementById("category").value);
  formData.append("is_offer", document.getElementById("isOffer").checked);

  const files = document.getElementById("images").files;

  for (let i = 0; i < files.length; i++) {
    formData.append("images", files[i]);
  }

  const res = await fetch(`/api/products/${productId}`, {
    method: "PUT",
    credentials: "include",
    body: formData
  });

  if (res.ok) {
    alert("Producto actualizado ✅");
    window.location.href = "/dashboard";
  } else {
    alert("Error actualizando producto");
  }
});
