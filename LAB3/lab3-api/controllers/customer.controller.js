// controllers/customer.controller.js
const pool = require('../config/db');

exports.getCustomerOrderHistory = async (req, res, next) => {
    try {
        const customerId = req.params.id;

        // 1. Kiểm tra khách hàng có tồn tại không -> Trả về 404 nếu không
        const [customers] = await pool.query('SELECT id, full_name, email FROM customers WHERE id = ?', [customerId]);
        if (customers.length === 0) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }
        
        const customer = customers[0];

        // 2. Lấy toàn bộ lịch sử đơn hàng của khách hàng này
        const [orders] = await pool.query(
            'SELECT id AS order_id, status, total_amount, created_at FROM orders WHERE customer_id = ? ORDER BY created_at DESC', 
            [customerId]
        );

        // 3. Tính tổng số tiền khách đã tiêu (chỉ cộng các đơn 'completed')
        let totalLifetimeSpent = 0;
        orders.forEach(order => {
            if (order.status === 'completed') {
                totalLifetimeSpent += parseFloat(order.total_amount);
            }
        });

        // 4. Trả về kết quả
        res.status(200).json({
            success: true,
            data: {
                customer: customer,
                totalLifetimeSpent: totalLifetimeSpent,
                orders: orders
            }
        });

    } catch (error) {
        next(error);
    }
};