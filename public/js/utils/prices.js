export function renderPriceHTML(product){

  const price = parseFloat(product.price || 0);
  const oldPrice = product.old_price ? parseFloat(product.old_price) : null;

  if(!oldPrice){
    return `<strong>$${price.toLocaleString()}</strong>`;
  }

  return `
    <span style="text-decoration:line-through;color:#999;font-size:12px;">
      $${oldPrice.toLocaleString()}
    </span><br>

    <strong style="color:#dc2626;">
      $${price.toLocaleString()}
    </strong>
  `;
}
