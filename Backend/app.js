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
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

//  CORS FIX (OPTIONS INCLUDED)
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));



// --- Route Imports ---
const product = require("./routes/productRoute");
const user = require("./routes/userRoute");
const order = require("./routes/orderRoute");
const payment = require("./routes/paymentRoute");
const newsletterRoutes = require("./routes/newsletterRoutes");

// --- Mount Routes ---
app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment);
app.use("/api/newsletter", newsletterRoutes);

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.log(err.stack);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
