export function buildInvoiceHTML(order: any, user: any): string {
  const itemsRows = order.items
    .map(
      (item: any) => `
        <tr>
          <td>${item.product.name}</td>
          <td>${item.size}</td>
          <td>${item.quantity}</td>
          <td>₹${item.price.toFixed(2)}</td>
          <td>₹${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Helvetica, Arial, sans-serif; color: #111; padding: 40px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .logo { font-size: 22px; font-weight: 600; }
        .invoice-meta { text-align: right; font-size: 13px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { text-align: left; font-size: 11px; text-transform: uppercase; color: #888; border-bottom: 1px solid #ddd; padding: 8px 0; }
        td { padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
        .totals { margin-top: 20px; text-align: right; font-size: 14px; }
        .totals .grand { font-size: 18px; font-weight: 600; margin-top: 8px; }
        .address { font-size: 13px; color: #444; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">EcommerceAI</div>
        <div class="invoice-meta">
          Invoice #${order._id.toString().slice(-8).toUpperCase()}<br/>
          ${new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>

      <div>Billed to: <strong>${user.name}</strong><br/>${user.email}</div>

      <table>
        <thead>
          <tr><th>Item</th><th>Size</th><th>Qty</th><th>Price</th><th>Total</th></tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>

      <div class="totals">
        <div>Subtotal: ₹${order.totalAmount.toFixed(2)}</div>
        ${order.discount ? `<div>Discount: −₹${order.discount.toFixed(2)}</div>` : ""}
        <div class="grand">Total Paid: ₹${(order.totalAmount - (order.discount ?? 0)).toFixed(2)}</div>
      </div>

      <div class="address">
        Shipping to:<br/>
        ${order.address.fullName}<br/>
        ${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.pincode}<br/>
        ${order.address.phone}
      </div>
    </body>
    </html>
  `;
}
