require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabaseAndData(pool) {
    console.log('--- KHỞI TẠO DATABASE VÀ DỮ LIỆU MẪU ---');
    
    // Tạo bảng
    await pool.query(`CREATE TABLE IF NOT EXISTS customers (id INT AUTO_INCREMENT PRIMARY KEY, full_name VARCHAR(100), balance DECIMAL(12,2))`);
    await pool.query(`CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, product_name VARCHAR(150), price DECIMAL(12,2), stock INT)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS orders (id INT AUTO_INCREMENT PRIMARY KEY, customer_id INT, total_amount DECIMAL(12,2), created_at DATETIME, FOREIGN KEY (customer_id) REFERENCES customers(id))`);
    await pool.query(`CREATE TABLE IF NOT EXISTS order_items (id INT AUTO_INCREMENT PRIMARY KEY, order_id INT, product_id INT, quantity INT, price DECIMAL(12,2), FOREIGN KEY (order_id) REFERENCES orders(id), FOREIGN KEY (product_id) REFERENCES products(id))`);

    // Xóa dữ liệu cũ
    await pool.query('SET FOREIGN_KEY_CHECKS = 0;');
    await pool.query('TRUNCATE TABLE order_items;');
    await pool.query('TRUNCATE TABLE orders;');
    await pool.query('TRUNCATE TABLE products;');
    await pool.query('TRUNCATE TABLE customers;');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1;');

    // Chèn dữ liệu mẫu
    await pool.query(`INSERT INTO customers (full_name, balance) VALUES ('Tran Van A', 500000.00), ('Le Thi B', 50000.00)`);
    await pool.query(`INSERT INTO products (product_name, price, stock) VALUES ('Bàn phím cơ', 150000.00, 10), ('Chuột không dây', 80000.00, 2)`);
    
    console.log('-> Dữ liệu mẫu đã sẵn sàng!\n');
}

async function processOrder(pool, customerId, productId, quantityPurchased) {
    // Mở một kết nối (connection) riêng biệt từ pool để chạy Transaction
    const conn = await pool.getConnection();
    
    try {
        console.log(`Đang xử lý đơn hàng: KH (ID: ${customerId}) mua SP (ID: ${productId}) x${quantityPurchased}`);
        
        // Bắt đầu Transaction
        await conn.beginTransaction(); 

        // Lấy thông tin khách hàng và sản phẩm (dùng FOR UPDATE để khóa dòng, tránh đụng độ dữ liệu)
        const [customers] = await conn.execute('SELECT balance FROM customers WHERE id = ? FOR UPDATE', [customerId]);
        const [products] = await conn.execute('SELECT price, stock FROM products WHERE id = ? FOR UPDATE', [productId]);
        
        if (customers.length === 0 || products.length === 0) throw new Error("Không tìm thấy khách hàng hoặc sản phẩm.");

        const customer = customers[0];
        const product = products[0];
        const totalAmount = product.price * quantityPurchased;

        // BƯỚC 1: Kiểm tra số dư (balance) và tồn kho (stock)
        console.log(`- Bước 1: Check số dư (${customer.balance}) >= tổng tiền (${totalAmount}) VÀ tồn kho (${product.stock}) >= SL mua (${quantityPurchased})`);
        if (customer.balance < totalAmount) {
            throw new Error(`Số dư không đủ! (Cần ${totalAmount}, hiện có ${customer.balance})`);
        }
        if (product.stock < quantityPurchased) {
            throw new Error(`Kho không đủ hàng! (Cần ${quantityPurchased}, hiện còn ${product.stock})`);
        }

        // BƯỚC 2: Trừ tiền khách hàng
        console.log('- Bước 2: Trừ tiền khách hàng');
        await conn.execute('UPDATE customers SET balance = balance - ? WHERE id = ?', [totalAmount, customerId]);

        // BƯỚC 3: Trừ số lượng tồn kho
        console.log('- Bước 3: Trừ tồn kho sản phẩm');
        await conn.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [quantityPurchased, productId]);

        // BƯỚC 4: Tạo record đơn hàng mới
        console.log('- Bước 4: Tạo đơn hàng mới (orders)');
        const [orderResult] = await conn.execute(
            'INSERT INTO orders (customer_id, total_amount, created_at) VALUES (?, ?, NOW())',
            [customerId, totalAmount]
        );
        const orderId = orderResult.insertId;

        // BƯỚC 5: Tạo chi tiết đơn hàng
        console.log('- Bước 5: Lưu chi tiết đơn (order_items)');
        await conn.execute(
            'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
            [orderId, productId, quantityPurchased, product.price]
        );

        // NẾU TẤT CẢ ĐỀU ỔN -> COMMIT ĐỂ LƯU VÀO DB
        await conn.commit();
        console.log('=> THÀNH CÔNG: Giao dịch đã được Commit!\n');

    } catch (error) {
        // NẾU CÓ BẤT KỲ LỖI NÀO -> ROLLBACK ĐỂ HỦY BỎ MỌI THAO TÁC Ở TRÊN
        await conn.rollback();
        console.error(`=> THẤT BẠI: Giao dịch bị Rollback. Lý do: ${error.message}\n`);
    } finally {
        // Phải luôn giải phóng kết nối trả lại cho pool
        conn.release();
    }
}

async function runHomework() {
    // 1. Kết nối tạm để tạo Database nếu chưa có
    const initConn = await mysql.createConnection({
        host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, port: process.env.DB_PORT
    });
    await initConn.query('CREATE DATABASE IF NOT EXISTS store_transaction_db');
    await initConn.end();

    // 2. Tạo Pool kết nối chính thức vào store_transaction_db
    const pool = mysql.createPool({
        host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, port: process.env.DB_PORT,
        database: 'store_transaction_db'
    });

    try {
        await setupDatabaseAndData(pool);

        // Test Case 1: Khách hàng A (500k) mua 2 Bàn phím (150k x2 = 300k) -> Dư tiền, đủ kho -> Giao dịch THÀNH CÔNG
        console.log('--- TEST CASE 1: ĐỦ TIỀN VÀ ĐỦ HÀNG ---');
        await processOrder(pool, 1, 1, 2); 

        // Test Case 2: Khách hàng B (50k) mua 1 Bàn phím (150k) -> Thiếu tiền -> ROLLBACK
        console.log('--- TEST CASE 2: THIẾU TIỀN (ROLLBACK) ---');
        await processOrder(pool, 2, 1, 1);

        // Test Case 3: Khách hàng A (còn 200k) mua 10 Chuột (80k x10) -> Hết kho -> ROLLBACK
        console.log('--- TEST CASE 3: KHÔNG ĐỦ HÀNG TRONG KHO (ROLLBACK) ---');
        await processOrder(pool, 1, 2, 10);

    } finally {
        await pool.end();
    }
}

runHomework();