const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const queryController = require('../controllers/query.controller');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'query_' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Route to execute queries
router.post('/execute-queries', queryController.executeQueries.bind(queryController));

// Route to execute queries from uploaded file
router.post('/execute-file', upload.single('file'), queryController.executeQueryFromFile.bind(queryController));

// Route to download results
router.get('/download-results', queryController.downloadResults.bind(queryController));

// Route to save query file
router.post('/save', queryController.saveQueryFile.bind(queryController));

module.exports = router; 