// config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'TLKLan',            // Đổi 'root' thành 'TLKLan' theo đúng tài khoản trên máy bạn
  password: 'UnicornFC2007', // Điền mật khẩu bạn dùng để đăng nhập vào MySQL Workbench
  database: 'ecommerce_order_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test thử kết nối
pool.getConnection()
  .then(conn => {
    console.log('Đã kết nối thành công tới MySQL database!');
    conn.release();
  })
  .catch(err => {
    console.error('Lỗi kết nối MySQL:', err.message);
  });

module.exports = pool;