db.orders.updateOne(
  { order_code: "ORD-2026-002" },
  { 
    $push: { items: { product_name: "XL Gaming Mouse Pad", quantity: 1, price: 200000 } },
    $inc: { total_amount: 200000 }
  }
);