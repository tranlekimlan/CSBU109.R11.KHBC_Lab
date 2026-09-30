INSERT INTO orders (user_id, total_amount, status) VALUES
( 1, 27400000.00, 'completed' ),
( 2, 1800000.00, 'pending' ),
( 1, 8500000.00, 'completed' );

INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
( 1, 1, 1, 25000000.00 ),
( 1, 2, 1, 2400000.00 ),
( 2, 3, 1, 1800000.00 );