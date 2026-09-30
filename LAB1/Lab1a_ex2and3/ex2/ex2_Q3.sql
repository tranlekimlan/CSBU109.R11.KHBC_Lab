SELECT 
    o.id AS 'Order ID', 
    u.full_name AS 'Customer Name', 
    p.title AS 'Product Name', 
    oi.quantity AS 'Quantity', 
    oi.price AS 'Unit Price', 
    o.status AS 'Order Status'
FROM orders o
INNER JOIN users u ON o.user_id = u.id
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id;