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
    const res = await fetch(`/api/events/${id}`);

    if (!res.ok) {
      throw new Error("Evento no encontrado");
    }

    const event = await res.json();

    // =============================
    // IMÁGENES
    // =============================
    const images = event.images?.length
      ? event.images
      : [event.image_url];

    const mainImage = document.getElementById("mainImage");
    mainImage.src = images[0] || "/img/default.png";

    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    images.forEach(img => {
      const thumb = document.createElement("img");
      thumb.src = img;
      thumb.className =
        "w-24 h-16 object-cover rounded-lg cursor-pointer opacity-70 hover:opacity-100 transition";

      thumb.onclick = () => {
        mainImage.src = img;
      };

      gallery.appendChild(thumb);
    });

    // =============================
    // TEXTOS
    // =============================
    document.getElementById("eventTitle").innerText = event.title || "Evento";

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
    // ESTADO (badge arriba)
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
    // CTA TIENDA
    // =============================
    document.getElementById("goStore").onclick = () => {
      window.location.href = `/${event.store_slug}`;
    };

    // =============================
    // CTA WHATSAPP
    // =============================
    document.getElementById("ctaWhatsApp").onclick = () => {
      const phone = event.phone || event.store_phone;

      if (!phone) {
        alert("Este evento no tiene contacto disponible");
        return;
      }

      const clean = phone.replace(/\D/g, "");

      const text = encodeURIComponent(
        `Hola! Vi el evento "${event.title}" en PuntoCerca. Quiero más info.`
      );

      window.open(`https://wa.me/${clean}?text=${text}`, "_blank");
    };

    // =============================
    // CTA RECORDATORIO
    // =============================
    document.getElementById("ctaReminder").onclick = () => {
      const startDate = new Date(event.start_at);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

      const format = d =>
        d.toISOString().replace(/-|:|\.\d+/g, "");

      const url = `
https://www.google.com/calendar/render?action=TEMPLATE
&text=${encodeURIComponent(event.title)}
&dates=${format(startDate)}/${format(endDate)}
&details=${encodeURIComponent(event.description || "")}
`;

      window.open(url, "_blank");
    };

    // =============================
    // RELACIONADOS
    // =============================
    loadRelatedEvents(event.store_id, event.id);

  } catch (err) {
    console.error(err);

    document.body.innerHTML = `
      <div style="padding:40px; text-align:center">
        <h1 style="font-size:22px; margin-bottom:10px;">Error cargando el evento</h1>
        <p style="color:#666;">Puede que haya sido eliminado o no exista.</p>
      </div>
    `;
  }
}

// =============================
// RELACIONADOS
// =============================
async function loadRelatedEvents(storeId, currentId) {
  try {
    const res = await fetch(`/api/events?store_id=${storeId}`);
    const events = await res.json();

    const container = document.getElementById("relatedEvents");
    container.innerHTML = "";

    events
      .filter(e => e.id !== currentId)
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
