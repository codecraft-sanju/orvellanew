import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const ShopContext = createContext();

export const useShop = () => useContext(ShopContext);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api/v1`;

export const ShopProvider = ({ children }) => {
  const [products, setProducts] = useState([]); 
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  // --- LOAD DATA ---
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load Products
        const { data: productData } = await axios.get(`${API_URL}/products`);
        setProducts(productData.products);

        // Load User Profile
        try {
            const { data: userData } = await axios.get(`${API_URL}/me`, { withCredentials: true });
            setUser(userData.user);
        } catch (authError) { setUser(null); }

      } catch (error) { 
        console.error("Error loading data:", error); 
      } finally { 
        setLoading(false); 
      }
    };
    loadData();
  }, []);

  // --- CART ACTIONS ---
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) return prev.map((item) => item._id === product._id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
    setIsCartOpen(true);
    showNotification(`Added ${product.name} to cart`);
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((item) => item._id !== id));
  
  const updateQty = (id, delta) => {
    setCart((prev) => prev.map((item) => {
        if (item._id === id) return { ...item, qty: Math.max(1, item.qty + delta) };
        return item;
      })
    );
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  // --- 🔥 ORDER PROCESSING LOGIC (Manual UPI & COD) ---
  
  const processOrder = async (paymentDetails, shippingDetails, navigate) => {
    if (!user) {
        showNotification("Please login to place an order");
        navigate("/auth");
        return;
    }

    const { method, txnId } = paymentDetails;
    const shippingInfo = shippingDetails;

    // 1. Prepare Order Items
    const orderItems = cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.qty,
        image: item.images[0].url,
        product: item._id
    }));

    // 2. Calculate Costs
    const itemsPrice = cartTotal;
    const taxPrice = itemsPrice * 0.18; // 18% Tax Example
    const shippingPrice = itemsPrice > 5000 ? 0 : 200;
    const COD_FEE = method === 'cod' ? 50 : 0;
    const totalPrice = itemsPrice + taxPrice + shippingPrice + COD_FEE;

    const config = { headers: { "Content-Type": "application/json" }, withCredentials: true };

    try {
        // 3. Prepare Payment Info
        let paymentInfo = {};

        if (method === 'cod') {
            paymentInfo = { 
                id: "cod", 
                status: "pending" // Cash pending
            };
        } else {
            // MANUAL UPI LOGIC
            paymentInfo = { 
                id: txnId || "manual_upi_missing", // User ka UTR
                status: "processing" // Hum ise 'processing' rakhenge taaki Admin Panel me verify karein
            };
        }

        // 4. Final Order Data Structure
        const orderData = {
            shippingInfo,
            orderItems,
            itemsPrice,
            taxPrice,
            shippingPrice,
            totalPrice,
            paymentInfo // Pass the Manual Info
        };
        
        // 5. Send to Backend (No Razorpay call needed now)
        await axios.post(`${API_URL}/order/new`, orderData, config);
        
        // 6. Success Handling
        setCart([]); // Clear Cart
        setIsCartOpen(false); // Close Drawer
        setShowOrderSuccess(true); // Show Success Modal
        navigate("/"); // Go Home

    } catch (error) {
        console.error("Order Failed:", error);
        showNotification(error.response?.data?.message || "Order Creation Failed");
    }
  };

  // --- AUTH ACTIONS ---
  const logout = async () => {
      try {
          await axios.get(`${API_URL}/logout`, { withCredentials: true });
          setUser(null);
          showNotification("Logged out successfully");
      } catch (error) { console.error("Logout failed", error); }
  };

  const manualLogin = (userData) => { setUser(userData); };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <ShopContext.Provider
      value={{
        products, loading, cart, isCartOpen, setIsCartOpen,
        addToCart, removeFromCart, updateQty, cartTotal, cartCount,
        notification, showNotification, user, logout, manualLogin,
        processOrder, // <-- UPDATED FUNCTION
        showOrderSuccess, setShowOrderSuccess
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};