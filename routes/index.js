const express = require('express');
const router = express.Router();
const queryRoutes = require('./query.routes');

// Query routes
router.use('/queries', queryRoutes);

// Add more route groups here as needed
// Example: router.use('/users', userRoutes);

module.exports = router; 