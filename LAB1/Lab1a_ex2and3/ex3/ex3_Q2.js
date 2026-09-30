db.orders.find({ 
  total_amount: { $gte: 5000000 }, 
  status: "completed" 
});

db.orders.find({ 
  "items.product_name": "Logitech MX Master 3S Mouse" 
});