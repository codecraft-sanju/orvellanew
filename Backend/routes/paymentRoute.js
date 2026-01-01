const express = require("express");
const { processPayment, sendRazorpayApiKey } = require("../controllers/paymentController");
const { isAuthenticatedUser } = require("../middleware/auth");

const router = express.Router();

// Payment process karne ke liye login zaroori hai
router.route("/payment/process").post(isAuthenticatedUser, processPayment);

// Frontend ko API Key bhejne ke liye
router.route("/payment/razorpaykey").get(isAuthenticatedUser, sendRazorpayApiKey);

module.exports = router;