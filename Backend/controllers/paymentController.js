const Razorpay = require("razorpay");

// Process Payment (Create Order in Razorpay)
exports.processPayment = async (req, res, next) => {
  try {
    
    console.log("------------------------------------------");
    console.log("RAZORPAY DEBUG START");
    console.log("1. Backend Key ID Loaded:", process.env.RAZORPAY_API_KEY ? "YES (" + process.env.RAZORPAY_API_KEY.slice(0, 8) + "...)" : "NO (Undefined)");
    console.log("2. Backend Key Secret Loaded:", process.env.RAZORPAY_API_SECRET ? "YES" : "NO (Undefined)");
    
    // Check if keys are missing
    if(!process.env.RAZORPAY_API_KEY || !process.env.RAZORPAY_API_SECRET) {
        throw new Error("Razorpay Keys are missing in .env file");
    }

    const instance = new Razorpay({
        key_id: process.env.RAZORPAY_API_KEY,
        key_secret: process.env.RAZORPAY_API_SECRET,
    });

    const options = {
      amount: req.body.amount, 
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    console.log("3. Creating Order with Options:", options);

    const myPayment = await instance.orders.create(options);

    console.log("4. Order Created Successfully. Order ID:", myPayment.id);
    console.log("------------------------------------------");

    res.status(200).json({
      success: true,
      order_id: myPayment.id,
      amount: myPayment.amount,
    });
  } catch (error) {
    console.error("❌ RAZORPAY ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send API Key to Frontend
exports.sendRazorpayApiKey = async (req, res, next) => {
  // Frontend ko Key bhejte waqt bhi log karo taaki match kar sakein
  console.log("👉 Sending Key to Frontend:", process.env.RAZORPAY_API_KEY);
  res.status(200).json({ razorpayApiKey: process.env.RAZORPAY_API_KEY });
};