const params = new URLSearchParams(window.location.search);
const id = params.get("id");

async function loadEvent() {
  try {
    const res = await fetch(`/api/events/${id}`);
    const event = await res.json();

    // 🔥 IMÁGENES (soporte múltiple)
    const images = event.images?.length
      ? event.images
      : [event.image_url];

    document.getElementById("mainImage").src = images[0];

    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    images.forEach(img => {
      const thumb = document.createElement("img");
      thumb.src = img;
      thumb.className = "w-24 h-16 object-cover rounded cursor-pointer opacity-80 hover:opacity-100";

      thumb.onclick = () => {
        document.getElementById("mainImage").src = img;
      };

      gallery.appendChild(thumb);
    });

    // TEXTOS
    document.getElementById("eventTitle").innerText = event.title;
    document.getElementById("eventDesc").innerText = event.description;

    const date = new Date(event.start_at);

    document.getElementById("eventDate").innerText =
      date.toLocaleString("es-AR", {
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });

    document.getElementById("goStore").onclick = () => {
      window.location.href = `/${event.store_slug}`;
    };

    // 🔥 RELACIONADOS
    loadRelatedEvents(event.store_id, event.id);

  } catch (err) {
    console.error(err);
  }
}

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
        card.className = "bg-gray-50 rounded-xl overflow-hidden shadow hover:shadow-lg transition cursor-pointer";

        card.innerHTML = `
          <img src="${e.image_url}" class="w-full h-40 object-cover">
          <div class="p-3">
            <h3 class="font-semibold text-sm mb-1">${e.title}</h3>
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

loadEvent();
