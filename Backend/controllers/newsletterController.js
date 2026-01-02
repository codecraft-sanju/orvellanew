const Newsletter = require("../models/Newsletter");

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter
// @access  Public
const subscribeNewsletter = async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Validation
    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "Please enter a valid email." });
    }

    // 2. Check if already exists
    const existingSubscriber = await Newsletter.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({ message: "You are already subscribed." });
    }

    // 3. Save to Database
    const newSubscriber = new Newsletter({ email });
    await newSubscriber.save();

    res.status(201).json({ 
      success: true, 
      message: "Welcome to the inner circle." 
    });

  } catch (error) {
    console.error("Newsletter Error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

module.exports = { subscribeNewsletter };