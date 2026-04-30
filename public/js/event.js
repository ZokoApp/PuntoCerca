const id = window.location.pathname.split("/")[2];

async function loadEvent(){
  try {
    const res = await fetch(`/api/events/${id}`);
    const event = await res.json();

    document.getElementById("eventImage").src = event.image_url;
    document.getElementById("eventTitle").innerText = event.title;
    document.getElementById("eventDesc").innerText = event.description;

    const date = new Date(event.start_at);

    document.getElementById("eventDate").innerText =
      date.toLocaleString("es-AR");

    document.getElementById("goStore").onclick = () => {
      window.location.href = `/${event.store_slug}`;
    };

  } catch (err){
    console.error(err);
  }
}

loadEvent();
