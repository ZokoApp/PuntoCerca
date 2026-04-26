  const param = window.location.pathname.split("/").pop();

function safeJSON(value, fallback) {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
}

if (!param) {
  alert("Producto inválido");
  throw new Error("Parámetro no encontrado");
}
  
  let isLogged = false;

 function timeAgo(dateString) {

  const date = new Date(dateString);
  const now = new Date();

  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Hace unos segundos";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} días`;

  const weeks = Math.floor(days / 7);
  return `Hace ${weeks} semanas`;
}
  
  // 🔐 CHECK LOGIN PRIMERO
  async function checkAuth() {
    try {
      const res = await fetch('/api/me', {
        credentials: 'include'
      });
  
      if (res.ok) isLogged = true;
  
    } catch {}
  }
  
  async function init() {

  await checkAuth();

  // 🔥 detectar si es ID o SLUG
  const isId = !isNaN(param);

  const url = isId
    ? `/api/products/${param}`
    : `/api/products/slug/${param}`;

  const res = await fetch(url);

  if (!res.ok) {
    alert("Producto no encontrado");
    return;
  }

  const product = await res.json();

  // 🔁 redirección si cambia slug
  if (product.redirect_slug && param !== product.redirect_slug) {
    window.location.replace(`/product/${product.redirect_slug}`);
    return;
  }

  const specsContainer = document.getElementById("productSpecs");
  if (!specsContainer) return;

  let specsHTML = "";

  let extraData = {};

  if (product.extra) {
    try {
      extraData = typeof product.extra === "string"
        ? JSON.parse(product.extra)
        : product.extra;
    } catch (e) {
      console.error("Error parseando extra", e);
    }
  }

  function addSpec(label, value) {
    if (!value || value === "" || value.length === 0) return;

    specsHTML += `
      <div>
        <strong>${label}:</strong> ${value}
      </div>
    `;
  }

  addSpec("Modelo", extraData.model);
  addSpec("SKU", extraData.sku);
  addSpec("Material", extraData.material);
  addSpec("Talles", product.size);
  addSpec("Categoría", product.category);

  let colors = [];

  try {
    colors = typeof product.colors === "string"
      ? JSON.parse(product.colors)
      : product.colors || [];
  } catch {
    colors = [];
  }

  if (colors.length > 0) {
    const colorsHTML = colors.map(c => `
      <span style="
        display:inline-block;
        width:14px;
        height:14px;
        border-radius:50%;
        background:${c.toLowerCase()};
        margin-right:5px;
      "></span>
    `).join("");

    specsHTML += `
      <div>
        <strong>Color:</strong> ${colorsHTML}
      </div>
    `;
  }

  if (specsHTML.trim() === "") {
    specsContainer.style.display = "none";
  } else {
    specsContainer.innerHTML = specsHTML;
  }

  const isFavorite = product.is_favorite;

  renderStars(
    parseFloat(product.rating_avg) || 0,
    product.user_rating || 0
  );

  updateRatingInfo(
    product.rating_avg || 0,
    product.rating_count || 0,
    product.user_rating || 0
  );

  const loginMessage = document.getElementById("loginMessage");
  const commentBox = document.getElementById("commentBox");

  if (isLogged) {
    commentBox.classList.remove("hidden");
  } else {
    loginMessage.classList.remove("hidden");
  }

  document.getElementById("productImage").src = product.image_url;
  document.getElementById("productName").innerText = product.name;
  document.getElementById("productPrice").innerHTML =
    window.renderPriceHTML(product);

    if (product.is_offer && product.offer_expires_at) {
  document.getElementById("productPrice").innerHTML += `
    <div class="offer-timer" data-expire="${product.offer_expires_at}"></div>
  `;
}

  let description = "Sin descripción";
  const extraParsed = safeJSON(product.extra, {});

  if (extraParsed.description) {
    description = extraParsed.description;
  }

  document.getElementById("productDescription").innerText = description;

  const storeLink = document.getElementById("storeLink");
  storeLink.innerText = product.store_name;
  storeLink.href = `/${product.store_slug}`;

  const mainImage = document.getElementById("productImage");
  const thumbsContainer = document.getElementById("thumbsContainer");

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.image_url];

  mainImage.src = images[0];
  thumbsContainer.innerHTML = "";

  images.forEach((imgUrl) => {
    const thumb = document.createElement("img");

    thumb.src = imgUrl;
    thumb.className = "w-16 h-16 object-cover rounded-lg border cursor-pointer bg-white p-1";

    thumb.onclick = () => {
      mainImage.src = imgUrl;
    };

    thumbsContainer.appendChild(thumb);
  });

  fetch(`/api/product-view/${product.id}`, { method: "POST" });

  document.getElementById("productViews").innerText =
    ` ${product.views || 0} vistas`;

  const favBtn = document.getElementById("favBtn");

  favBtn.innerText = isFavorite ? "Guardado" : "Guardar";

  favBtn.addEventListener("click", async () => {

    if (!isLogged) {
      alert("Iniciá sesión primero");
      return window.location.href = "/login";
    }

    try {

      const isSaved = favBtn.innerText === "Guardado";

      if (isSaved) {

        const res = await fetch(`/api/product-favorite/${product.id}`, {
          method: "DELETE",
          credentials: "include"
        });

        if (!res.ok) throw new Error();

        favBtn.innerText = "Guardar";

      } else {

        const res = await fetch(`/api/product-favorite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ product_id: product.id })
        });

        if (!res.ok) throw new Error();

        favBtn.innerText = "Guardado";
      }

    } catch (err) {
      console.error(err);
      alert("Error");
    }
  });

  const contactBtn = document.getElementById("contactBtn");

  contactBtn.innerText = isLogged
    ? "Consultar"
    : "Registrate para consultar";

  contactBtn.addEventListener("click", (e) => {

    e.preventDefault();

    if (!isLogged) {
      window.location.href = "/register";
      return;
    }

    if (!product.store_phone) {
      alert("Esta tienda no tiene teléfono cargado");
      return;
    }

    const telefono = product.store_phone.replace(/\D/g, "");

    const mensaje = `Hola! Quiero consultar por este producto:

${product.name}
$${parseFloat(product.price).toLocaleString()}

¿Está disponible?

${window.location.href}`;

    window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, "_blank");

  });

  loadComments(product.id);
  loadRelated(product);
    startOfferTimers();
}
  
    const sendBtn = document.getElementById("sendComment");
  
    if (sendBtn) {
      sendBtn.addEventListener("click", async () => {
  
        if (!isLogged) {
          alert("Tenés que iniciar sesión");
          return window.location.href = "/login";
        }
  
        const content = document.getElementById("commentInput").value;
        if (!content) return;
  
        try {
          await fetch(`/api/products/${product.id}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ content })
          });
  
          location.reload();
  
        } catch {
          alert("Error al comentar");
        }
  
      });
    }
  
    function renderStars(avg = 0, userRating = 0) {
    const container = document.getElementById("ratingStars");
    container.innerHTML = "";
  
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("span");
  
      const active = userRating ? i <= userRating : i <= Math.round(avg);
  
      star.innerHTML = active ? "⭐" : "☆";
  
      star.style.cursor = "pointer";
      star.style.fontSize = "22px";
      star.style.transition = "0.2s";
  
      if (userRating && i <= userRating) {
        star.style.transform = "scale(1.15)";
      }
  
      star.addEventListener("click", () => {
  
        if (!isLogged) {
          alert("Iniciá sesión para votar");
          window.location.href = "/login";
          return;
        }
  
        rateProduct(i);
      });
  
      star.addEventListener("mouseover", () => {
    highlightStars(i);
  });
  
      
  
      star.addEventListener("mouseleave", () => {
        renderStars(avg, userRating);
      });
  
      container.appendChild(star);
    }
  }
  
  function highlightStars(rating) {
    const stars = document.getElementById("ratingStars").children;
  
    for (let i = 0; i < stars.length; i++) {
      stars[i].innerHTML = i < rating ? "⭐" : "☆";
    }
  }
  
  function updateRatingInfo(avg, count, userRating = 0) {
    const info = document.getElementById("ratingInfo");
  
    const avgNumber = parseFloat(avg) || 0;
  
    let text = `⭐ ${avgNumber.toFixed(1)} (${count} votos)`;
  
    if (userRating) {
      text += ` • Tu voto: ${userRating}⭐`;
    }
  
    info.innerText = text;
  }
  
  let isRating = false;
  
 async function rateProduct(value) {

  if (isRating) return;
  isRating = true;

  try {

    const productId = param;

    const res = await fetch(`/api/products/${productId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ rating: value })
    });

    if (!res.ok) throw new Error();

    const data = await res.json(); // 🔥 FALTABA ESTO TAMBIÉN

    renderStars(
      parseFloat(data.avg) || 0,
      value
    );

    updateRatingInfo(
      parseFloat(data.avg) || 0,
      data.count,
      value
    );

  } catch (err) {
    console.error(err);
    alert("Error al votar");
  }

  isRating = false;
}
    
  
  // =============================
  // FUNCIONES
  // =============================
  async function loadComments(productId) {

  try {
    const res = await fetch(`/api/products/${productId}/comments`);

    if (!res.ok) return;

    const comments = await res.json();

    const container = document.getElementById("commentsContainer");
    container.innerHTML = "";

    if (!comments.length) {
      container.innerHTML = `
        <p style="color:#888;font-size:14px;">
          No hay comentarios todavía
        </p>
      `;
      return;
    }

    comments.forEach(c => {

      const div = document.createElement("div");

      div.className = "flex gap-3 border-b pb-3 mb-3 items-start";

      div.innerHTML = `
  <img 
    src="${c.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(c.name)}" 
    style="width:40px;height:40px;border-radius:50%;object-fit:cover;"
  />

  <div style="flex:1;">
    <div style="display:flex;align-items:center;gap:8px;">
  <strong style="font-size:14px;">${c.name}</strong>
  <span style="font-size:12px;color:#888;">
    ${timeAgo(c.created_at)}
  </span>
</div>

      ${isLogged ? `
        <div style="display:flex;gap:10px;">
          <button onclick="editComment(${c.id}, '${c.content.replace(/'/g, "\\'")}')" style="font-size:12px;">
            Editar
          </button>

          <button onclick="deleteComment(${c.id})" style="font-size:12px;color:red;">
            Eliminar
          </button>
        </div>
      ` : ""}
    </div>

    <p id="comment-${c.id}" style="margin-top:4px;font-size:14px;color:#444;">
      ${c.content}
    </p>
  </div>
`;

      window.editComment = function(id, content) {

  const p = document.getElementById(`comment-${id}`);

  p.innerHTML = `
    <textarea id="edit-input-${id}" style="width:100%;padding:6px;">${content}</textarea>
    
    <div style="margin-top:5px;display:flex;gap:5px;">
<button type="button" onclick="saveComment(${id})">Guardar</button>
     <button type="button" onclick="location.reload()">Cancelar</button>
    </div>
  `;
};

      window.editComment = function(id, content) {

  const p = document.getElementById(`comment-${id}`);

  p.innerHTML = `
    <textarea id="edit-input-${id}" style="width:100%;padding:6px;">${content}</textarea>
    
    <div style="margin-top:5px;display:flex;gap:5px;">
      <button onclick="saveComment(${id})">Guardar</button>
      <button onclick="location.reload()">Cancelar</button>
    </div>
  `;
};

      window.saveComment = async function(id) {

  const newContent = document.getElementById(`edit-input-${id}`).value;

  if (!newContent.trim()) return alert("Comentario vacío");

  try {

    const res = await fetch(`/api/comments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content: newContent })
    });

    if (!res.ok) throw new Error();

    location.reload();

  } catch (err) {
    console.error(err);
    alert("Error al editar");
  }
};
      window.deleteComment = async function(id) { 

  if (!confirm("¿Eliminar comentario?")) return;

  try {
    const res = await fetch(`/api/comments/${id}`, {
      method: "DELETE",
      credentials: "include"
    });

    if (!res.ok) throw new Error();

    location.reload();

  } catch (err) {
    alert("Error al eliminar");
  }
}

      container.appendChild(div);
    });

  } catch (err) {
    console.error(err);
  }
}
  
  async function loadRelated(product) {
  
    const res = await fetch(`/api/stores/${product.store_id}/products`);
    const products = await res.json();
  
    const container = document.getElementById("relatedProducts");
  
    const filtered = products
      .filter(p => p.id !== product.id)
      .slice(0, 8);
  
    filtered.forEach(p => {
  
      const card = document.createElement("div");
      card.className = "bg-white rounded-2xl border shadow-sm overflow-hidden cursor-pointer hover:shadow-lg";
  
      card.innerHTML = `
        <div class="bg-gray-100 h-40 flex items-center justify-center">
          <img src="${p.image_url}" class="max-h-full object-contain">
        </div>
  
        <div class="p-3">
          <h3 class="text-sm font-semibold">${p.name}</h3>
          <p class="text-orange-600 font-bold">$${parseFloat(p.price).toLocaleString()}</p>
        </div>
      `;
  
      card.onclick = () => {
    window.location.href = `/product/${p.slug}`;
  };
  
      container.appendChild(card);
    });
  }
  
  // INIT
  init();
  
  function startOfferTimers() {
  const timers = document.querySelectorAll(".offer-timer");

  timers.forEach(timer => {

    const expire = new Date(timer.dataset.expire);

    function update() {
      const now = new Date();
      const diff = expire - now;

      if (diff <= 0) {
        timer.innerHTML = "⛔ Oferta finalizada";
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      timer.innerHTML = `⏳ ${hours}h ${minutes}m ${seconds}s`;
    }

    update();
    setInterval(update, 1000);
  });
}
  
  // =============================
  // ZOOM
  // =============================
  const zoomContainer = document.getElementById("zoomContainer");
  const img = document.getElementById("productImage");
  
  zoomContainer.addEventListener("mousemove", (e) => {
    const rect = zoomContainer.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 100;
    const y = (e.clientY - rect.top) / rect.height * 100;
  
    img.style.transformOrigin = `${x}% ${y}%`;
    img.style.transform = "scale(2)";
  });
  
  zoomContainer.addEventListener("mouseleave", () => {
    img.style.transform = "scale(1)";
  });
