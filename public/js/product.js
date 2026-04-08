  const param = window.location.pathname.split("/").pop();

if (!param) {
  alert("Producto inválido");
  throw new Error("Parámetro no encontrado");
}
  
  let isLogged = false;
  
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
  
    let res;

if (!isNaN(param)) {
  // 👉 ID
  res = await fetch(`/api/products/${param}`);
} else {
  // 👉 SLUG
  res = await fetch(`/api/products/slug/${param}`);
}
    
    if (!res.ok) throw new Error("Producto no encontrado");
  
    const product = await res.json();
  
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
  
   
  
    // =============================
    // UI LOGIN
    // =============================
    const loginMessage = document.getElementById("loginMessage");
    const commentBox = document.getElementById("commentBox");
  
    if (isLogged) {
      commentBox.classList.remove("hidden");
    } else {
      loginMessage.classList.remove("hidden");
    }
  
    // =============================
    // DATA PRODUCTO
    // =============================
    document.getElementById("productImage").src = product.image_url;
    document.getElementById("productName").innerText = product.name;
    document.getElementById("productPrice").innerText =
      "$" + parseFloat(product.price).toLocaleString();
  
    let description = "Sin descripción";
  
    if (typeof product.extra === "string") {
      description = product.extra;
    } else if (typeof product.extra === "object" && product.extra !== null) {
      description = Object.values(product.extra).join(" - ");
    }
  
    document.getElementById("productDescription").innerText = description;
  
    const storeLink = document.getElementById("storeLink");
    storeLink.innerText = product.store_name;
    storeLink.href = `/${product.store_slug}`;
  
    // =============================
  // GALERÍA DE IMÁGENES
  // =============================
  
  const mainImage = document.getElementById("productImage");
  const thumbsContainer = document.getElementById("thumbsContainer");
  
  // usamos images si existe, sino fallback a image_url
  const images = product.images && product.images.length > 0
    ? product.images
    : [product.image_url];
  
  // imagen principal inicial
  mainImage.src = images[0];
  
  // limpiar contenedor
  thumbsContainer.innerHTML = "";
  
  // crear thumbnails
  images.forEach((imgUrl, index) => {
  
    const thumb = document.createElement("img");
  
    thumb.src = imgUrl;
    thumb.className = "w-16 h-16 object-cover rounded-lg border cursor-pointer bg-white p-1";
  
    thumb.onclick = () => {
      mainImage.src = imgUrl;
    };
  
    thumbsContainer.appendChild(thumb);
  
  });
  
    // =============================
    // VIEWS + DETALLES
    // =============================
    fetch(`/api/product-view/${product.id}`, { method: "POST" });
  
    document.getElementById("productViews").innerText =
      ` ${product.views || 0} vistas`;
  
    document.getElementById("productSizes").innerText =
      product.size || "No especificado";
  
    document.getElementById("productColor").innerText =
      product.color || "No especificado";
  
    document.getElementById("productCategory").innerText =
      product.category || "General";
  
    // =============================
    // FAVORITOS
    // =============================
    const favBtn = document.getElementById("favBtn");
  
  // estado inicial
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
    // =============================
  // WHATSAPP
  // =============================
  document.getElementById("contactBtn").addEventListener("click", () => {
  
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
  
    // =============================
    // COMENTARIOS
    // =============================
    loadComments(product.id);
  
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
  
    if (isRating) return; // 🚫 evita spam
    isRating = true;
  
    try {
     const productId = product.id;
  
      const res = await fetch(`/api/products/${productId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating: value })
      });
  
      if (!res.ok) throw new Error();
  
      const data = await res.json();
  
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
    // RELACIONADOS
    // =============================
    loadRelated(product);
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
  
      comments.forEach(c => {
        const div = document.createElement("div");
        div.className = "border-b pb-2 text-sm";
        div.innerHTML = `
    <strong>${c.name}</strong><br>
    ${c.content}
  `;
        container.appendChild(div);
      });
  
    } catch {}
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
    window.location.href = `/product/${p.slug || p.id}`;
  };
  
      container.appendChild(card);
    });
  }
  
  // INIT
  init();
  
  
  
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
