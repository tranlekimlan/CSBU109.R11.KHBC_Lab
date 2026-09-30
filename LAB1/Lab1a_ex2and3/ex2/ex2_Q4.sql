-- 1. Sum of money
SELECT SUM(total_amount) AS 'Total Revenue'
FROM orders
WHERE status = 'completed';

-- 2. Count number of order by user
SELECT user_id, COUNT(id) AS 'Total Orders'
FROM orders
GROUP BY user_id;