require('dotenv').config();
const mysql = require('mysql2/promise');

// 1. Khởi tạo Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 2. Hàm Setup Database và Dữ liệu mẫu (Từ đề bài)
async function setupDatabaseAndSeedData(pool) {
    console.log('--- ĐANG KHỞI TẠO BẢNG VÀ DỮ LIỆU MẪU ---');
    
    // Tạo bảng categories
    await pool.query(`
        CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Tạo bảng items
    await pool.query(`
        CREATE TABLE IF NOT EXISTS items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category_id INT NOT NULL,
            item_name VARCHAR(150) NOT NULL,
            price DECIMAL(12,2) NOT NULL,
            quantity INT DEFAULT 0,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
        );
    `);

    // Xóa dữ liệu cũ để tránh lỗi trùng lặp khi chạy nhiều lần
    await pool.query('SET FOREIGN_KEY_CHECKS = 0;');
    await pool.query('TRUNCATE TABLE items;');
    await pool.query('TRUNCATE TABLE categories;');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1;');

    // Chèn dữ liệu categories
    await pool.query(`
        INSERT INTO categories (name, description) VALUES
        ('Food', 'Daily essentials and groceries'),
        ('Electronics', 'Gadgets, phones and computers'),
        ('Clothing', 'Apparel and fashion items'),
        ('Books', 'Educational and entertainment books'),
        ('Home & Living', 'Furniture and home appliances'),
        ('Sports & Outdoors', 'Sporting goods and outdoor equipment');
    `);

    // Chèn dữ liệu items
    await pool.query(`
        INSERT INTO items (category_id, item_name, price, quantity) VALUES
        (1, 'Apple', 25000.00, 100),
        (1, 'Milk', 32000.00, 50),
        (1, 'Bread', 15000.00, 30),
        (2, 'Smartphone', 5500000.00, 15),
        (2, 'Wireless Mouse', 250000.00, 40),
        (3, 'T-Shirt', 120000.00, 60),
        (3, 'Jeans', 350000.00, 25),
        (4, 'Node.js Programming', 180000.00, 20),
        (5, 'Desk Lamp', 150000.00, 35),
        (5, 'Coffee Mug', 45000.00, 80);
    `);
    console.log('-> Cấu trúc bảng và dữ liệu mẫu đã sẵn sàng!\n');
}

// 3. Thực thi Q1 đến Q4
async function runQueries() {
    try {
        // Chạy setup trước
        await setupDatabaseAndSeedData(pool);

        // ==========================================
        // Q1 (Filter & sort): Sản phẩm giá >= 500k VÀ số lượng > 0, xếp giá giảm dần
        // ==========================================
        console.log('--- Q1: SẢN PHẨM GIÁ >= 500,000 VÀ CÒN HÀNG ---');
        const [q1Result] = await pool.execute(`
            SELECT * FROM items 
            WHERE price >= 500000 AND quantity > 0 
            ORDER BY price DESC
        `);
        console.log(q1Result);

        // ==========================================
        // Q2 (Wildcard / LIKE search): Tìm từ khóa "Gaming" hoặc "Wireless"
        // ==========================================
        console.log('\n--- Q2: TÌM KIẾM TỪ KHÓA "Gaming" HOẶC "Wireless" ---');
        const [q2Result] = await pool.execute(`
            SELECT * FROM items 
            WHERE item_name LIKE ? OR item_name LIKE ?
        `, ['%Gaming%', '%Wireless%']);
        console.log(q2Result);

        // ==========================================
        // Q3 (Aggregate functions): Tính tổng kho, giá TB, tổng số mặt hàng
        // ==========================================
        console.log('\n--- Q3: THỐNG KÊ TỔNG QUAN (SUM, AVG, COUNT) ---');
        const [q3Result] = await pool.execute(`
            SELECT 
                SUM(quantity) AS TotalStock, 
                AVG(price) AS AveragePrice, 
                COUNT(*) AS TotalItems 
            FROM items
        `);
        console.log(q3Result);

        // ==========================================
        // Q4 (Category statistics - GROUP BY & HAVING): Thống kê theo danh mục, lọc > 10,000,000
        // ==========================================
        console.log('\n--- Q4: THỐNG KÊ DANH MỤC CÓ TỔNG VỐN > 10,000,000 ---');
        const [q4Result] = await pool.execute(`
            SELECT 
                c.name AS CategoryName, 
                COUNT(i.id) AS TotalItems, 
                SUM(i.price * i.quantity) AS TotalInventoryValue 
            FROM categories c
            JOIN items i ON c.id = i.category_id
            GROUP BY c.id, c.name
            HAVING TotalInventoryValue > 10000000
        `);
        console.log(q4Result);

    } catch (error) {
        console.error('Lỗi MySQL:', error.message);
    } finally {
        await pool.end(); // Đóng kết nối
    }
}

// Chạy chương trình
runQueries();