window.renderPriceHTML = function(product){

  const price = parseFloat(product.price || 0);
  const oldPrice = product.old_price ? parseFloat(product.old_price) : null;

  if(!oldPrice){
    return `<strong>$${price.toLocaleString()}</strong>`;
  }

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
