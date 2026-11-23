import { map } from './map.js';
import { storeMarkers, activeCard } from './stores.js';

export function focusStore(storeId){

    const marker = storeMarkers[storeId];
    const card = document.querySelector(`.card[data-id='${storeId}']`);

    if(marker){

        const latLng = marker.getLatLng();

        map.flyTo(latLng, 17, { duration: 1.2 });

        marker.openPopup();

        document.getElementById("map").scrollIntoView({
            behavior:'smooth',
            block:'center'
        });

        if(activeCard){
            activeCard.style.boxShadow = "0 5px 15px rgba(0,0,0,0.08)";
        }

        if(card){
            card.style.boxShadow = "0 10px 25px rgba(255,106,0,0.5)";
        }

        marker.setZIndexOffset(1000);
        setTimeout(() => marker.setZIndexOffset(0), 1500);
    }
}

export function viewStore(id){
    window.location.href = `/store/${id}`;
}

export function initSliders(){

    const storesSlider = document.getElementById("stores");
    const prevStores = document.getElementById("prevStores");
    const nextStores = document.getElementById("nextStores");

    if(nextStores){
        nextStores.addEventListener("click", () => {
            storesSlider.scrollBy({ left:300, behavior:'smooth' });
        });
    }

    if(prevStores){
        prevStores.addEventListener("click", () => {
            storesSlider.scrollBy({ left:-300, behavior:'smooth' });
        });
    }

    const productsSlider = document.getElementById("products");
    const prevProducts = document.getElementById("prevProducts");
    const nextProducts = document.getElementById("nextProducts");

    if(nextProducts){
        nextProducts.addEventListener("click", () => {
            productsSlider.scrollBy({ left:300, behavior:'smooth' });
        });
    }

    if(prevProducts){
        prevProducts.addEventListener("click", () => {
            productsSlider.scrollBy({ left:-300, behavior:'smooth' });
        });
    }
}

window.renderPriceHTML = function(product){

  const price = parseFloat(product.price);
  const oldPrice = product.old_price !== null && product.old_price !== undefined
    ? parseFloat(product.old_price)
    : null;

  const format = (n) => "$" + n.toLocaleString("es-AR");

  // 👉 SIN PRECIO → CONSULTAR
  if (price === null || isNaN(price)) {
    return `<span style="font-weight:600;">Consultar</span>`;
  }

  // 👉 SIN DESCUENTO
  if (oldPrice === null || oldPrice <= price) {
    return `<span style="font-weight:600;">${format(price)}</span>`;
  }

  // 👉 CON DESCUENTO
  const discount = Math.round(((oldPrice - price) / oldPrice) * 100);

  return `
    <span style="text-decoration:line-through;color:#999;font-size:13px;">
      ${format(oldPrice)}
    </span>
    <br/>
    <span style="color:#ef4444;font-weight:700;">
      ${format(price)}
    </span>
    <span style="background:#ef4444;color:#fff;font-size:12px;padding:2px 6px;border-radius:6px;margin-left:6px;">
      -${discount}%
    </span>
  `;
};
