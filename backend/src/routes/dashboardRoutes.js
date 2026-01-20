/**
 * Dashboard Routes
 */

const express = require('express');
const router = express.Router();

router.get('/summary', (req, res) => {
  res.json({ success: true, message: 'Dashboard routes - implementation pending' });
});

module.exports = router;
