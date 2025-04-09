-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS recipe_db;
USE recipe_db;

-- Create user with password and grant privileges
CREATE USER IF NOT EXISTS 'root'@'localhost';
GRANT ALL PRIVILEGES ON recipe_db.* TO 'root'@'localhost';
FLUSH PRIVILEGES;

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL UNIQUE
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
    recipe_id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_name VARCHAR(255) NOT NULL,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    prep_time INT DEFAULT 0,
    cook_time INT DEFAULT 0,
    servings INT DEFAULT 1,
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
    recipe_image VARCHAR(255),
    category_id INT NOT NULL,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Insert default categories
INSERT IGNORE INTO categories (category_name) VALUES
    ('Breakfast'),
    ('Lunch'),
    ('Dinner'),
    ('Appetizers'),
    ('Soups'),
    ('Salads'),
    ('Main Dishes'),
    ('Side Dishes'),
    ('Desserts'),
    ('Beverages'),
    ('Snacks'),
    ('Baked Goods');
