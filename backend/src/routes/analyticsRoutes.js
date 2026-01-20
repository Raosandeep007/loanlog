/**
 * Analytics Routes
 */

const express = require('express');
const router = express.Router();

router.get('/cashflow', (req, res) => {
  res.json({ success: true, message: 'Analytics routes - implementation pending' });
});

module.exports = router;
