document.getElementById("eventForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const start = new Date(document.getElementById("start_at").value);
  const end = new Date(document.getElementById("end_at").value);

  // 🔥 VALIDACIÓN REAL
  if (end <= start) {
    alert("La fecha de fin debe ser mayor a la de inicio");
    return;
  }

  const formData = new FormData();

  formData.append("title", document.getElementById("title").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("start_at", start.toISOString());
  formData.append("end_at", end.toISOString());
  formData.append("image", document.getElementById("image").files[0]);

  try {
    const res = await fetch("/api/events", {
      method: "POST",
      credentials: "include",
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error creando evento");
      return;
    }

    showToast("Evento creado 🚀", "success");

    window.location.href = "/dashboard.html";

  } catch (err) {
    console.error(err);
    alert("Error de conexión");
  }
});
