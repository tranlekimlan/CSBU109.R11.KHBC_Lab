db.orders.insertMany([
  {
    order_code: "ORD-2026-003",
    customer_name: "Le Van C",
    customer_email: "levanc@gmail.com",
    total_amount: 15500000,
    status: "completed",
    items: [
      { product_name: "Keyboard", quantity: 1, price: 1500000 },
      { product_name: "24 Inches Monitor", quantity: 1, price: 4000000 }
    ],
    created_at: new Date()
  },
  {
    order_code: "ORD-2026-004",
    customer_name: "Hoang Thi D",
    customer_email: "hoangthid@gmail.com",
    total_amount: 500000,
    status: "cancelled",
    items: [
      { product_name: "Headphone", quantity: 1, price: 500000 }
    ],
    created_at: new Date()
  }
]);