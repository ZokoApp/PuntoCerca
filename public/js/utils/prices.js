window.renderPriceHTML = function(product){

  // 👉 CASO CONSULTAR
  if (product.price === null || product.price === "" || product.price === undefined) {
    return `<strong style="color:#666;">Consultar</strong>`;
  }

  const price = parseFloat(product.price);

  // 👉 SI NO HAY PRECIO ANTERIOR
  if(!product.old_price){
    return `<strong>$${price.toLocaleString()}</strong>`;
  }

  const oldPrice = parseFloat(product.old_price);

  const discount = Math.round(((oldPrice - price) / oldPrice) * 100);

  return `
    <div style="display:flex;flex-direction:column;gap:2px;">
      
      <span style="text-decoration:line-through;color:#999;font-size:12px;">
        $${oldPrice.toLocaleString()}
      </span>

      <div style="display:flex;align-items:center;gap:6px;">
        <strong style="color:#dc2626;">
          $${price.toLocaleString()}
        </strong>

        <span style="
          background:#dc2626;
          color:white;
          font-size:11px;
          padding:2px 6px;
          border-radius:6px;
          font-weight:bold;
        ">
          -${discount}%
        </span>
      </div>

    </div>
  `;
};
