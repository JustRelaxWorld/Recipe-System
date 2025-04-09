const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create the `db_images` directory if it does not exist
const uploadDir = path.join(__dirname, './db_images');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Add file extension handling
        const fileExt = path.extname(file.originalname).toLowerCase();
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Improved file type checking
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (!mimetype || !extname) {
            return cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed!'), false);
        }
        cb(null, true);
    }
});

// Helper function to delete image
const deleteImage = async (filename) => {
    if (!filename) return;

    const imagePath = path.join(uploadDir, filename);
    try {
        if (fs.existsSync(imagePath)) {
            await fs.promises.unlink(imagePath);
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
};

module.exports = { upload, deleteImage };
