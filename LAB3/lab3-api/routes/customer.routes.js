// routes/customer.routes.js
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');

// Route lấy lịch sử mua hàng
router.get('/:id/order-history', customerController.getCustomerOrderHistory);

module.exports = router;