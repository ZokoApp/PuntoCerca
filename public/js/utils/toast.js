export function showToast(message, type = "success") {

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500"
  };

  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");

  toast.className = `
    ${colors[type]} 
    text-white px-5 py-3 rounded-lg shadow-lg 
    flex items-center gap-3
    transition transform duration-300 ease-out
  `;

  toast.style.transform = "translateX(100%)";

  toast.innerHTML = `
    <span>${message}</span>
    <button class="ml-auto font-bold">✕</button>
  `;

  container.appendChild(toast);

  // animación entrada
  setTimeout(() => {
    toast.style.transform = "translateX(0)";
  }, 50);

  // cerrar
  toast.querySelector("button").onclick = () => {
    toast.remove();
  };

  // auto remove
  setTimeout(() => {
    toast.remove();
  }, 4000);
}
