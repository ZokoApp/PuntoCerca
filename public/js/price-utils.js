window.renderPriceHTML = function(price, oldPrice) {
  const finalPrice = parseFloat(price || 0).toLocaleString();

  if (oldPrice && !isNaN(oldPrice) && Number(oldPrice) > Number(price)) {
    const previousPrice = parseFloat(oldPrice).toLocaleString();
    const discount = Math.round(((oldPrice - price) / oldPrice) * 100);

    return `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px;">
        <span style="text-decoration:line-through;color:#999;font-size:13px;">
          $${previousPrice}
        </span>

        <span style="color:#ff6600;font-weight:bold;font-size:18px;">
          $${finalPrice}
        </span>

        <span style="
          background:#e8fff0;
          color:#16a34a;
          font-size:11px;
          font-weight:700;
          padding:3px 7px;
          border-radius:999px;
        ">
          ${discount}% OFF
        </span>
      </div>
    `;
  }

  return `
    <div style="margin-top:6px;">
      <span style="color:#ff6600;font-weight:bold;font-size:18px;">
        $${finalPrice}
      </span>
    </div>
  `;
};
