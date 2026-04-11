export function showToast(message, type = "success") {

  const colors = {
    success: "#22c55e",
    error: "#ef4444",
    warning: "#eab308",
    info: "#3b82f6"
  };

  const toast = document.createElement("div");

  toast.style.background = colors[type] || "#333";
  toast.style.color = "#fff";
  toast.style.padding = "12px 16px";
  toast.style.borderRadius = "10px";
  toast.style.boxShadow = "0 10px 20px rgba(0,0,0,0.2)";
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.gap = "10px";
  toast.style.minWidth = "200px";
  toast.style.fontSize = "14px";

  toast.innerHTML = `
    <span>${message}</span>
    <button style="margin-left:auto;font-weight:bold;">✕</button>
  `;

  const container = document.getElementById("toastContainer");

  if (!container) {
    console.error("No existe toastContainer");
    return;
  }

  container.appendChild(toast);

  // cerrar manual
  toast.querySelector("button").onclick = () => {
    toast.remove();
  };

  // auto remove
  setTimeout(() => {
    toast.remove();
  }, 4000);
}
