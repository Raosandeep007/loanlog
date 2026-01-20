/**
 * User Routes
 */

const express = require('express');
const router = express.Router();

router.get('/me', (req, res) => {
  res.json({ success: true, message: 'User routes - implementation pending' });
});

module.exports = router;
