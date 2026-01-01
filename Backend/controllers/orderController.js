const Order = require("../models/orderModel");
const Product = require("../models/productModel");

// Create New Order
exports.newOrder = async (req, res, next) => {
  try {
    const {
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;

    const order = await Order.create({
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paidAt: Date.now(),
      user: req.user._id,
    });
    
    // --- 🔥 SOCKET.IO NOTIFICATION ---
    // Poore server me broadcast karein ki naya order aaya hai
    const io = req.app.get("io");
    if(io) {
        io.emit("new_order_notification", { 
            message: "New Order Placed", 
            orderId: order._id 
        });
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Order
exports.getSingleOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Logged in User Orders
exports.myOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- ADMIN CONTROLLERS ---

// Get All Orders (Admin)
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().populate("user", "name email");
    let totalAmount = 0;
    orders.forEach((order) => { totalAmount += order.totalPrice; });

    res.status(200).json({ success: true, totalAmount, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Order Status (Admin)
exports.updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.orderStatus === "Delivered") {
      return res.status(400).json({ message: "You have already delivered this order" });
    }

    order.orderStatus = req.body.status;
    if (req.body.status === "Delivered") {
      order.deliveredAt = Date.now();
      // Optional: Yahan aap stock update logic bhi laga sakte hain
    }

    await order.save({ validateBeforeSave: false });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Order (Admin)
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    await order.deleteOne();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};