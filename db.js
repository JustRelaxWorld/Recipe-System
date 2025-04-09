const mysql = require('mysql2');

// Updated MySQL connection details
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    //password: 'Alstede@2480',
    database: 'recipe_db'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
        process.exit(1); // Exit process if connection fails
    }
    console.log('Connected to the MySQL database');
});

// Create tables after connection is established
const initializeTables = () => {
    // Categories table
    const addCategoriesToTableQuery = `
        CREATE TABLE IF NOT EXISTS categories (
            category_id INT AUTO_INCREMENT PRIMARY KEY,
            category_name VARCHAR(255) NOT NULL UNIQUE
        );`;

    db.query(addCategoriesToTableQuery, (err, result) => {
        if (err) {
            console.error("Error creating categories table:", err);
        } else {
            console.log("Categories table created or already exists.");
            // Insert default categories if needed
            insertDefaultCategories();
        }
    });

    // Users table
    const addUsersToDbQuery = `
        CREATE TABLE IF NOT EXISTS users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`;

    db.query(addUsersToDbQuery, (err, result) => {
        if (err) {
            console.error("Error creating users table:", err);
        } else {
            console.log("Users table created or already exists.");
        }
    });

    // Recipes table
    const createRecipesTableQuery = `
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
            FOREIGN KEY (category_id) REFERENCES categories(category_id),
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        );`;

    db.query(createRecipesTableQuery, (err, result) => {
        if (err) {
            console.error("Error creating recipes table:", err);
        } else {
            console.log("Recipes table created or already exists.");
        }
    });
};

// Function to insert default categories
const insertDefaultCategories = () => {
    const categories = [
        'Breakfast',
        'Lunch',
        'Dinner',
        'Appetizers',
        'Soups',
        'Salads',
        'Main Dishes',
        'Side Dishes',
        'Desserts',
        'Beverages',
        'Snacks',
        'Baked Goods'
    ];

    const insertQuery = `
        INSERT IGNORE INTO categories (category_name)
        VALUES ${categories.map(cat => `(?)`).join(',')}
    `;

    db.query(insertQuery, categories, (err, result) => {
        if (err) {
            console.error("Error inserting default categories:", err);
        } else if (result.affectedRows > 0) {
            console.log(`Inserted ${result.affectedRows} default categories.`);
        }
    });
};

// Initialize tables
initializeTables();

// Export the db connection for use in other parts of your app
module.exports = db;
