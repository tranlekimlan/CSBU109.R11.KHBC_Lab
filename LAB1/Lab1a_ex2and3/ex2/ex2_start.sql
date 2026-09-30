-- 1. Create the database
CREATE DATABASE IF NOT EXISTS ecommerce_db;
USE ecommerce_db;
-- 2. Create the users table (DDL)
CREATE TABLE IF NOT EXISTS users (
id INT AUTO_INCREMENT PRIMARY KEY,
full_name VARCHAR(100) NOT NULL,
email VARCHAR(100) NOT NULL UNIQUE,
password_hash VARCHAR(255) NOT NULL,
role ENUM('admin', 'user') DEFAULT 'user',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 3. Create the products table (DDL)
CREATE TABLE IF NOT EXISTS products (
id INT AUTO_INCREMENT PRIMARY KEY,
title VARCHAR(150) NOT NULL,
price DECIMAL(10, 2) NOT NULL,
stock INT DEFAULT 0,
category VARCHAR(50),created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create additional tables
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT CHECK (quantity > 0),
    price DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 5. Insert sample data (DML - INSERT)
INSERT INTO users (full_name, email, password_hash, role) VALUES
('Nguyen Van Admin', 'admin@gmail.com', 'hashed_pwd_123', 'admin'),
('Tran Thi User', 'user@gmail.com', 'hashed_pwd_456', 'user');
INSERT INTO products (title, price, stock, category) VALUES
('Laptop Dell XPS 15', 35000000.00, 10, 'Electronics'),
('Keychron K2', 2200000.00, 25, 'Accessories'),
('Logitech MX Master 3S', 2500000.00, 15, 'Accessories');
