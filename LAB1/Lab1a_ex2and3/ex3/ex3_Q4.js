db.orders.aggregate([
  { $match: { status: "completed" } },
  { $group: { _id: null, totalRevenue: { $sum: "$total_amount" } } }
]);

db.orders.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
]);