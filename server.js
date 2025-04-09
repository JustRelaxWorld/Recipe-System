const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // For JWT
const db = require('./db'); // Import database connection
const cors = require('cors'); // Optional, for cross-origin requests
const path = require('path');
const fs = require('fs');
const { upload, deleteImage } = require('./upload');

const app = express();
const PORT = 3000;

// Secret key for JWT
const JWT_SECRET = '2003';

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header

    console.log('Token:', token);
    if (!token) {
        return res.status(403).json({ message: 'Token is required' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        req.user = decoded; // Store the decoded user data in the request object
        next();
    });
};

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Allow requests from different origins (if frontend is on a different domain)

// Routes

// **1. User Registration**
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;

        db.query(query, [username, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    if (err.sqlMessage.includes('email')) {
                        return res.status(400).json({ message: 'Email already exists' });
                    }
                    if (err.sqlMessage.includes('username')) {
                        return res.status(400).json({ message: 'Username already exists' });
                    }
                }
                console.error('Error inserting user:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            /*res.status(201).json({
                message: 'User registered successfully',
                userId: result.insertId
            });
            */
           res.json(result);
        });
    } catch (error) {
        console.error('Error in registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// **2. User Login with JWT**
app.post('/api/login', (req, res) => {
    const { identifier, password } = req.body; // Using `identifier` instead of `email`

    // Query to check both username and email
    const query = `SELECT * FROM users WHERE email = ? OR username = ?`;

    db.query(query, [identifier, identifier], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = results[0];
        const isPasswordValid = bcrypt.compareSync(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.user_id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '1h' } // Token expires in 1 hour
        );
        console.log(token);

        res.json({
            message: 'Login successful',
            token,
            username: user.username, // Include username in the response
        });
    });
});


// **3. Protected Route Example**
app.get('/api/protected', (req, res) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // Token is valid, send protected data
        res.json({ message: 'Protected data', user: decoded });
    });
});

// **4. Fetch All Categories**
app.get('/api/categories', (req, res) => {
    const query = `SELECT * FROM categories`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});


// const { upload, deleteImage } = require('./upload');


app.post('/api/recipes/submit-recipe', verifyToken, upload.single('recipeImage'), async (req, res) => {
    try {
        const { recipeName, ingredients, instructions, prepTime, cookTime, servings, difficulty, category } = req.body;
        const userId = req.user.userId; // Make sure this matches your JWT payload
        const recipeImage = req.file ? req.file.filename : null;

        const query = `
            INSERT INTO recipes (
                recipe_name, ingredients, instructions, prep_time,
                cook_time, servings, difficulty, category_id,
                user_id, recipe_image
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(query, [
            recipeName, ingredients, instructions, prepTime,
            cookTime, servings, difficulty, category,
            userId, recipeImage
        ], (err, result) => {
            if (err) {
                // If database insert fails, delete the uploaded image
                if (recipeImage) {
                    deleteImage(recipeImage).catch(console.error);
                }
                console.error('Error inserting recipe:', err);
                return res.status(500).json({ message: 'Error saving recipe' });
            }
            res.status(201).json({
                message: 'Recipe added successfully',
                recipeId: result.insertId,
                imageUrl: recipeImage ? `/api/images/${recipeImage}` : null
            });
        });
    } catch (error) {
        if (req.file) {
            deleteImage(req.file.filename).catch(console.error);
        }
        res.status(500).json({ message: 'Error processing request' });
    }
});

// CREATE - Already implemented in your registration endpoint
// READ - Get all users
app.get('/api/users', verifyToken, (req, res) => {
    const query = 'SELECT user_id, username, email, created_at FROM users';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});

// READ - Get single user
app.get('/api/users/:id', verifyToken, (req, res) => {
    const query = 'SELECT user_id, username, email, created_at FROM users WHERE user_id = ?';
    db.query(query, [req.params.id], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(results[0]);
    });
});

app.get('/users-gender', verifyToken, async(req, res) => {
    let sql = "SELECT * FROM users ORDER BY Gender";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching users:", err);
            return res.status(500).send("Database error");
        }
        res.json(results);
    });
});




// UPDATE
app.put('/api/users/:id', verifyToken, (req, res) => {
    const { username, email } = req.body;
    // Only allow users to update their own profile
    if (req.user.userId != req.params.id) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    const query = 'UPDATE users SET username = ?, email = ? WHERE user_id = ?';
    db.query(query, [username, email, req.params.id], (err, result) => {
        if (err) {
            console.error('Error updating user:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json({ message: 'User updated successfully' });
    });
});

// DELETE
app.delete('/api/users/:id', verifyToken, (req, res) => {
    // Only allow users to delete their own profile
    if (req.user.userId != req.params.id) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    const query = 'DELETE FROM users WHERE user_id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json({ message: 'User deleted successfully' });
    });
});

// CREATE - Already implemented in your submit-recipe endpoint

// READ - Get all recipes
app.get('/api/recipes/:user', verifyToken, (req, res) => {
    const query = `
        SELECT r.*, u.username, c.category_name
        FROM recipes r
        LEFT JOIN users u ON r.user_id = u.user_id
        LEFT JOIN categories c ON r.category_id = c.category_id
        WHERE r.user_id = ?
    `;

    db.query(query, [req.user.userId], (err, results) => {
        if (err) {
            console.error('Error fetching user recipes:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});

// READ - Get all recipes
app.get('/api/recipes', (req, res) => {
    const query = `
        SELECT r.*, u.username, c.category_name
        FROM recipes r
        LEFT JOIN users u ON r.user_id = u.user_id
        LEFT JOIN categories c ON r.category_id = c.category_id
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching recipes:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});

// READ - Get single recipe
app.get('/api/recipes/:id', (req, res) => {
    const recipeId = req.params.id;
    const query = `
        SELECT r.*, u.username, c.category_name
        FROM recipes r
        LEFT JOIN users u ON r.user_id = u.user_id
        LEFT JOIN categories c ON r.category_id = c.category_id
        WHERE r.recipe_id = ?
    `;

    db.query(query, [recipeId], (err, results) => {
        if (err) {
            console.error('Error fetching recipe:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Recipe not found' });
        }
        res.json(results[0]);
    });
});

// UPDATE
app.put('/api/recipes/:id', verifyToken, upload.single('recipeImage'), async (req, res) => {
    try {
        const recipeId = req.params.id;
        const {
            recipeName, ingredients, instructions,
            prepTime, cookTime, servings, difficulty, category
        } = req.body;

        // First check if the user owns this recipe and get the old image
        const checkQuery = 'SELECT user_id, recipe_image FROM recipes WHERE recipe_id = ?';
        db.query(checkQuery, [recipeId], async (err, results) => {
            if (err) {
                if (req.file) {
                    await deleteImage(req.file.filename);
                }
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (results.length === 0) {
                if (req.file) {
                    await deleteImage(req.file.filename);
                }
                return res.status(404).json({ message: 'Recipe not found' });
            }

            if (results[0].user_id !== req.user.userId) {
                if (req.file) {
                    await deleteImage(req.file.filename);
                }
                return res.status(403).json({ message: 'Unauthorized' });
            }

            const oldImage = results[0].recipe_image;
            const newImage = req.file ? req.file.filename : oldImage;

            const updateQuery = `
                UPDATE recipes
                SET recipe_name = ?,
                    ingredients = ?,
                    instructions = ?,
                    prep_time = ?,
                    cook_time = ?,
                    servings = ?,
                    difficulty = ?,
                    category_id = ?,
                    recipe_image = ?
                WHERE recipe_id = ?
            `;

            db.query(updateQuery, [
                recipeName, ingredients, instructions,
                prepTime, cookTime, servings,
                difficulty, category, newImage, recipeId
            ], async (updateErr) => {
                if (updateErr) {
                    if (req.file) {
                        await deleteImage(req.file.filename);
                    }
                    return res.status(500).json({ message: 'Error updating recipe' });
                }

                // Delete old image if it was replaced
                if (oldImage && req.file) {
                    await deleteImage(oldImage);
                }

                res.json({
                    message: 'Recipe updated successfully',
                    imageUrl: newImage ? `/api/images/${newImage}` : null
                });
            });
        });
    } catch (error) {
        if (req.file) {
            await deleteImage(req.file.filename);
        }
        res.status(500).json({ message: 'Error processing request' });
    }
});

// DELETE
app.delete('/api/recipes/:id', verifyToken, (req, res) => {
    const recipeId = req.params.id;

    // First check if the user owns this recipe
    db.query('SELECT user_id, recipe_image FROM recipes WHERE recipe_id = ?', [recipeId], (err, results) => {
        if (err) {
            console.error('Error checking recipe ownership:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        if (results[0].user_id !== req.user.userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Delete the recipe image if it exists
        if (results[0].recipe_image) {
            const imagePath = path.join(__dirname, 'db_images', results[0].recipe_image);
            try {
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            } catch (err) {
                console.error('Error deleting recipe image:', err);
            }
        }

        // Delete the recipe
        db.query('DELETE FROM recipes WHERE recipe_id = ?', [recipeId], (err, result) => {
            if (err) {
                console.error('Error deleting recipe:', err);
                return res.status(500).json({ message: 'Error deleting recipe' });
            }
            res.json({ message: 'Recipe deleted successfully' });
        });
    });
});

// Add an endpoint to serve images
app.get('/api/images/:filename', (req, res) => {
    const filename = req.params.filename;
    const imagePath = path.join(__dirname, 'db_images', filename);

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
        return res.status(404).json({ message: 'Image not found' });
    }

    // Send the file with proper content type
    res.sendFile(imagePath);
});

app.get('/', (req, res) => {
    res.send('Server is running');
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
