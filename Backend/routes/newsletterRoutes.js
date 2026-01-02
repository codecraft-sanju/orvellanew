const express = require("express");
const router = express.Router();
const { subscribeNewsletter } = require("../controllers/newsletterController");

// POST request aayegi /api/newsletter par
router.post("/", subscribeNewsletter);

module.exports = router;