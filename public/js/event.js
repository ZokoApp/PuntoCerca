const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  document.body.innerHTML = "<h1 style='padding:20px'>Evento inválido</h1>";
  throw new Error("ID no encontrado");
}

// =============================
// LOAD EVENT
// =============================
async function loadEvent() {
  try {
    console.log("Cargando evento ID:", id);

    const res = await fetch(`/api/events/${id}`);

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ Backend respondió:", res.status, text);
      throw new Error("Evento no encontrado");
    }

    const event = await res.json();

    console.log("✅ EVENT:", event);

    // =============================
    // IMAGEN
    // =============================
    const mainImage = document.getElementById("mainImage");
    mainImage.src = event.image_url || "/img/default.png";

    // =============================
    // TEXTO
    // =============================
    document.getElementById("eventTitle").innerText =
      event.title || "Evento";

    document.getElementById("eventDesc").innerText =
      event.description || "Sin descripción";

    const date = new Date(event.start_at);

    document.getElementById("eventDate").innerText =
      date.toLocaleString("es-AR", {
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });

    document.getElementById("eventStore").innerText =
      event.store_name || "Tienda";

    // =============================
    // STATUS
    // =============================
    const statusEl = document.getElementById("eventStatus");

    const now = new Date();
    const start = new Date(event.start_at);
    const end = new Date(event.end_at);

    if (now >= start && now <= end) {
      statusEl.innerText = "🔥 En curso";
      statusEl.style.background = "#16a34a";
    } else if (now < start) {
      statusEl.innerText = "Próximo evento";
      statusEl.style.background = "#f97316";
    } else {
      statusEl.innerText = "Finalizado";
      statusEl.style.background = "#6b7280";
    }

    // =============================
    // TIENDA
    // =============================
    document.getElementById("goStore").onclick = () => {
      if (event.store_slug) {
        window.location.href = `/${event.store_slug}`;
      }
    };

    // =============================
    // WHATSAPP
    // =============================
    // =============================
// WHATSAPP (FIX REAL)
// =============================
const btn = document.getElementById("ctaWhatsApp");

if (btn) {
  btn.onclick = () => {

    const phone = event.store_phone;

    if (!phone) {
      alert("Este comercio no tiene WhatsApp disponible");
      return;
    }

    let clean = phone.replace(/\D/g, "");

    // 🇦🇷 normalización Argentina
    if (clean.startsWith("0")) {
      clean = clean.substring(1);
    }

    if (!clean.startsWith("54")) {
      clean = "54" + clean;
    }

    if (clean.length < 10) {
      alert("Número inválido");
      return;
    }

    const text = encodeURIComponent(
      `Hola! 👋 Vi el evento "${event.title}" en PuntoCerca. ¿Me pasás info?`
    );

    const url = `https://wa.me/${clean}?text=${text}`;

    window.open(url, "_blank");
  };
}

    // =============================
    // RECORDATORIO
    // =============================
    document.getElementById("ctaReminder").onclick = () => {
      const startDate = new Date(event.start_at);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

      const format = d =>
        d.toISOString().replace(/-|:|\.\d+/g, "");

      const url = `https://www.google.com/calendar/render?action=TEMPLATE
&text=${encodeURIComponent(event.title)}
&dates=${format(startDate)}/${format(endDate)}
&details=${encodeURIComponent(event.description || "")}`;

      window.open(url, "_blank");
    };

    // =============================
    // RELACIONADOS (ARREGLADO)
    // =============================
    loadRelatedEvents(event.store_id, event.id);

  } catch (err) {
    console.error("🔥 ERROR FINAL:", err);

    document.body.innerHTML = `
      <div style="padding:40px; text-align:center">
        <h1 style="font-size:22px;">Error cargando el evento</h1>
        <p style="color:#666;">Puede que haya sido eliminado o no exista.</p>
        <p style="margin-top:10px;color:#999;">ID: ${id}</p>
      </div>
    `;
  }
}

// =============================
// RELACIONADOS (FIX REAL)
// =============================
async function loadRelatedEvents(storeId, currentId) {
  try {
    const res = await fetch(`/api/events`);
    const events = await res.json();

    const container = document.getElementById("relatedEvents");
    if (!container) return;

    container.innerHTML = "";

    events
      .filter(e => e.store_id === storeId && e.id !== currentId)
      .slice(0, 3)
      .forEach(e => {

        const card = document.createElement("div");

        card.className =
          "bg-gray-50 rounded-xl overflow-hidden shadow hover:shadow-lg transition cursor-pointer";

        card.innerHTML = `
          <img src="${e.image_url || "/img/default.png"}" 
               class="w-full h-40 object-cover">

          <div class="p-3">
            <h3 class="font-semibold text-sm">${e.title}</h3>
          </div>
        `;

        card.onclick = () => {
          window.location.href = `/event.html?id=${e.id}`;
        };

        container.appendChild(card);
      });

  } catch (err) {
    console.error("Error related events:", err);
  }
}

// =============================
loadEvent();
