// controllers/order.controller.js
const pool = require('../config/db');

exports.createOrder = async (req, res, next) => {
    const { customerId, items } = req.body;

    // 1. Validate payload: items phải là mảng không rỗng, quantity phải là số nguyên dương
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Items must be a non-empty array' });
    }
    for (let item of items) {
        if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity <= 0) {
            return res.status(400).json({ success: false, message: 'Every quantity must be a positive integer' });
        }
    }

    // Lấy connection từ pool để bắt đầu Transaction
    const conn = await pool.getConnection();
    
    try {
        await conn.beginTransaction();

        // 2. Kiểm tra customerId có tồn tại không -> 404
        const [customers] = await conn.query('SELECT id FROM customers WHERE id = ?', [customerId]);
        if (customers.length === 0) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        let total_amount = 0;
        const productIds = items.map(item => item.productId);

        // 3. Khóa các dòng sản phẩm đang được mua để tránh đụng độ (SELECT FOR UPDATE)
        const [products] = await conn.query(
            'SELECT id, price, stock, product_name FROM products WHERE id IN (?) FOR UPDATE',
            [productIds]
        );

        // 4. Kiểm tra từng sản phẩm và tồn kho
        for (let item of items) {
            const product = products.find(p => p.id === item.productId);
            if (!product) {
                await conn.rollback();
                return res.status(404).json({ success: false, message: `Product ID ${item.productId} not found` });
            }
            if (product.stock < item.quantity) {
                await conn.rollback();
                return res.status(400).json({ success: false, message: `Product '${product.product_name}' is out of stock` });
            }
            // Cộng dồn tổng tiền
            total_amount += parseFloat(product.price) * item.quantity;
        }

        // 5. Insert vào bảng orders
        const [orderResult] = await conn.query(
            'INSERT INTO orders (customer_id, status, total_amount) VALUES (?, ?, ?)',
            [customerId, 'pending', total_amount]
        );
        const orderId = orderResult.insertId;

        // 6. Insert vào bảng order_items và trừ kho products
        for (let item of items) {
            const product = products.find(p => p.id === item.productId);
            
            await conn.query(
                'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                [orderId, item.productId, item.quantity, product.price]
            );
            
            await conn.query(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.productId]
            );
        }

        // 7. Hoàn tất giao dịch (Commit)
        await conn.commit();
        
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: { orderId, customerId, total_amount, status: 'pending' }
        });

    } catch (error) {
        // Nếu có lỗi bất ngờ, rollback toàn bộ
        await conn.rollback();
        next(error);
    } finally {
        // Luôn nhớ trả lại connection cho pool
        conn.release();
    }
};

// Lấy danh sách đơn hàng (Có JOIN, lọc và phân trang)
exports.getAllOrders = async (req, res, next) => {
    try {
        const { status, customerId } = req.query;
        // Xử lý phân trang (mặc định page = 1, limit = 5)
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.max(Number(req.query.limit) || 5, 1);
        const offset = (page - 1) * limit;

        let whereClauses = [];
        let queryParams = [];

        // Xử lý điều kiện lọc
        if (status) {
            whereClauses.push('o.status = ?');
            queryParams.push(status);
        }
        if (customerId) {
            whereClauses.push('o.customer_id = ?');
            queryParams.push(customerId);
        }

        const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        // Đếm tổng số đơn hàng để chia trang
        const [countResult] = await pool.query(
            `SELECT COUNT(DISTINCT o.id) as total FROM orders o ${whereSQL}`,
            queryParams
        );
        const totalOrders = countResult[0].total;

        // Câu truy vấn chính: JOIN 3 bảng và đếm tổng số sản phẩm (SUM quantity)
        const sql = `
            SELECT 
                o.id AS order_id, 
                c.full_name AS customer_name, 
                c.email, 
                o.status, 
                o.total_amount, 
                COALESCE(SUM(oi.quantity), 0) AS total_items_count, 
                o.created_at
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            ${whereSQL}
            GROUP BY o.id
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        const [orders] = await pool.query(sql, [...queryParams, limit, offset]);

        res.status(200).json({
            success: true,
            count: orders.length,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalOrders / limit),
                totalOrders
            },
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

// Lấy chi tiết 1 đơn hàng theo ID
exports.getOrderById = async (req, res, next) => {
    try {
        const orderId = req.params.id;

        // 1. Lấy thông tin chung của đơn hàng và khách hàng
        const [orders] = await pool.query(`
            SELECT 
                o.id AS order_id, o.status, o.total_amount, o.created_at,
                c.id AS customer_id, c.full_name, c.email, c.phone
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE o.id = ?
        `, [orderId]);

        // Trả về 404 nếu không tìm thấy đơn hàng
        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const order = orders[0];

        // 2. Lấy danh sách các sản phẩm bên trong đơn hàng đó
        const [items] = await pool.query(`
            SELECT 
                p.product_name, 
                oi.quantity, 
                oi.unit_price, 
                (oi.quantity * oi.unit_price) AS subtotal
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [orderId]);

        // 3. Format lại cấu trúc dữ liệu thành JSON lồng nhau (Nested JSON)
        res.status(200).json({
            success: true,
            data: {
                order_id: order.order_id,
                status: order.status,
                total_amount: order.total_amount,
                created_at: order.created_at,
                customer: {
                    id: order.customer_id,
                    full_name: order.full_name,
                    email: order.email,
                    phone: order.phone
                },
                items: items // Đưa mảng sản phẩm vào trong object data
            }
        });

    } catch (error) {
        next(error);
    }
};

// Cập nhật trạng thái đơn hàng (và hoàn lại kho nếu hủy)
exports.updateOrderStatus = async (req, res, next) => {
    const orderId = req.params.id;
    const { status } = req.body;

    // 1. Kiểm tra giá trị status hợp lệ (chỉ nhận 1 trong 3 giá trị ENUM)
    const validStatuses = ['pending', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
            success: false, 
            message: "Invalid status value. Must be 'pending', 'completed', or 'cancelled'" 
        });
    }

    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // 2. Lấy trạng thái hiện tại của đơn hàng (Dùng FOR UPDATE để khóa dòng, tránh đụng độ)
        const [orders] = await conn.query('SELECT status FROM orders WHERE id = ? FOR UPDATE', [orderId]);
        
        if (orders.length === 0) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const currentStatus = orders[0].status;

        // 3. Nếu đơn hàng đã bị hủy trước đó thì không cho phép đổi sang trạng thái khác
        if (currentStatus === 'cancelled') {
            await conn.rollback();
            return res.status(400).json({ 
                success: false, 
                message: 'Order is already cancelled and cannot be changed' 
            });
        }

        // 4. Nếu trạng thái truyền lên là 'cancelled' -> Tiến hành hoàn lại kho
        if (status === 'cancelled') {
            // Lấy danh sách sản phẩm và số lượng từ chi tiết đơn
            const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
            
            // Cộng lại số lượng vào bảng products
            for (let item of items) {
                await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
            }
        }

        // 5. Cập nhật trạng thái mới cho đơn hàng
        await conn.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);

        await conn.commit();
        
        res.status(200).json({ 
            success: true, 
            message: `Order status updated successfully to '${status}'` 
        });

    } catch (error) {
        await conn.rollback();
        next(error);
    } finally {
        conn.release();
    }
};

// Xóa đơn hàng (và hoàn lại kho nếu đơn chưa bị hủy)
exports.deleteOrder = async (req, res, next) => {
    const orderId = req.params.id;
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Kiểm tra đơn hàng có tồn tại không và lấy trạng thái (khóa dòng để an toàn)
        const [orders] = await conn.query('SELECT status FROM orders WHERE id = ? FOR UPDATE', [orderId]);
        
        if (orders.length === 0) {
            await conn.rollback();
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const currentStatus = orders[0].status;

        // 2. Nếu đơn chưa bị hủy ('pending' hoặc 'completed'), phải trả lại hàng về kho
        if (currentStatus !== 'cancelled') {
            const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
            
            for (let item of items) {
                await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
            }
        }

        // 3. Xóa đơn hàng. Bảng order_items sẽ tự động bị xóa theo nhờ ON DELETE CASCADE
        await conn.query('DELETE FROM orders WHERE id = ?', [orderId]);

        await conn.commit();
        
        res.status(200).json({ 
            success: true, 
            message: 'Order deleted successfully' 
        });

    } catch (error) {
        await conn.rollback();
        next(error);
    } finally {
        conn.release();
    }
};

// Phân tích doanh thu và top sản phẩm bán chạy
exports.getSalesSummary = async (req, res, next) => {
    try {
        // 1. Tính tổng doanh thu, số đơn và trung bình cộng của các đơn 'completed'
        const [summaryResult] = await pool.query(`
            SELECT 
                COALESCE(SUM(total_amount), 0) AS totalRevenue,
                COUNT(id) AS completedOrdersCount,
                COALESCE(AVG(total_amount), 0) AS averageOrderValue
            FROM orders
            WHERE status = 'completed'
        `);

        // 2. Tìm Top 3 sản phẩm bán chạy nhất (nằm trong các đơn 'completed')
        const [topProducts] = await pool.query(`
            SELECT 
                p.product_name, 
                SUM(oi.quantity) AS total_quantity_sold
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE o.status = 'completed'
            GROUP BY p.id, p.product_name
            ORDER BY total_quantity_sold DESC
            LIMIT 3
        `);

        res.status(200).json({
            success: true,
            data: {
                totalRevenue: parseFloat(summaryResult[0].totalRevenue),
                completedOrdersCount: summaryResult[0].completedOrdersCount,
                averageOrderValue: parseFloat(summaryResult[0].averageOrderValue),
                topSellingProducts: topProducts.map(p => ({
                    product_name: p.product_name,
                    total_sold: Number(p.total_quantity_sold)
                }))
            }
        });

    } catch (error) {
        next(error);
    }
};