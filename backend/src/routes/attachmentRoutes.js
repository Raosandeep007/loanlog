/**
 * Attachment Routes
 */

const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Attachment routes - implementation pending' });
});

module.exports = router;
