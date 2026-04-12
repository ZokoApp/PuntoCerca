import { showToast } from "/js/utils/toast.js";

const deleteBtn = document.getElementById("deleteBtn");
const confirmInput = document.getElementById("confirmInput");

deleteBtn.addEventListener("click", async () => {

  const confirmText = confirmInput.value.trim();

  if (confirmText !== "ELIMINAR") {
    showToast("Debes escribir ELIMINAR para confirmar", "warning");
    return;
  }

  const confirmAction = confirm("¿Seguro que querés eliminar tu tienda?");
  if (!confirmAction) return;

  try {

    const res = await fetch("/api/my-store", {
      method: "DELETE",
      credentials: "include"
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Error eliminando tienda", "error");
      return;
    }

    showToast("Tienda eliminada correctamente", "success");

    setTimeout(() => {
      window.location.href = "/";
    }, 1500);

  } catch (err) {
    console.error(err);
    showToast("Error de conexión", "error");
  }

});
