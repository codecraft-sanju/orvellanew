const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

// --- Config Environment Variables ---
if (process.env.NODE_ENV !== "PRODUCTION") {
  
require("dotenv").config();
}

// --- Middlewares ---
app.use(express.json()); // JSON data handle karne ke liye
app.use(cookieParser()); // Token cookies read karne ke liye
app.use(bodyParser.urlencoded({ extended: true }));

// --- CORS Configuration (Bahut Important) ---
// Iske bina Frontend API call nahi kar payega
app.use(cors({
    origin: [process.env.CLIENT_URL], 
    credentials: true, 
    methods: ["GET", "POST", "PUT", "DELETE"],
}));

// --- Route Imports ---
const product = require("./routes/productRoute");
const user = require("./routes/userRoute");
const order = require("./routes/orderRoute");
const payment = require("./routes/paymentRoute"); // Razorpay ke liye

// --- Mount Routes ---
app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment);

// --- Error Handling Middleware (Basic) ---
// Agar koi route nahi mila ya server error aayi
app.use((err, req, res, next) => {
    console.log(err.stack); // Console me error dikhaye
    
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        message: message,
    });
});

module.exports = app;