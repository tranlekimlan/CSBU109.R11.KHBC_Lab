CREATE DATABASE IF NOT EXISTS library_db;
USE library_db;

CREATE TABLE IF NOT EXISTS authors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    author_name VARCHAR(100) NOT NULL,
    nationality VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author_id INT NOT NULL,
    category VARCHAR(50),
    publish_year INT,
    FOREIGN KEY (author_id) REFERENCES authors(id)
);

CREATE TABLE IF NOT EXISTS borrow_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    borrower_name VARCHAR(100) NOT NULL,
    borrow_date DATE,
    return_date DATE,
    FOREIGN KEY (book_id) REFERENCES books(id)
);

INSERT INTO authors (author_name, nationality) VALUES
('Nguyen Nhat Anh', 'Vietnam'),
('J.K. Rowling', 'UK'),
('George Orwell', 'UK');

INSERT INTO books (title, author_id, category, publish_year) VALUES
('Mat Biec', 1, 'Romance', 1990),
('Harry Potter and the Sorcerer''s Stone', 2, 'Fantasy', 1997),
('1984', 3, 'Dystopian', 1949);

INSERT INTO borrow_records (book_id, borrower_name, borrow_date, return_date) VALUES
(1, 'Tran Van A', '2026-10-01', '2026-10-15'),
(2, 'Le Thi B', '2026-10-05', NULL),
(3, 'Pham Van C', '2026-10-08', '2026-10-20');

SELECT 
    b.title AS 'Book Title', 
    a.author_name AS 'Author Name', 
    br.borrower_name AS 'Borrower Name', 
    br.borrow_date AS 'Borrow Date'
FROM borrow_records br
INNER JOIN books b ON br.book_id = b.id
INNER JOIN authors a ON b.author_id = a.id;