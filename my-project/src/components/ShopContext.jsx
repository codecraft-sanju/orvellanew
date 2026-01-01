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
        const { data: productData } = await axios.get(`${API_URL}/products`);
        setProducts(productData.products);
        try {
            const { data: userData } = await axios.get(`${API_URL}/me`, { withCredentials: true });
            setUser(userData.user);
        } catch (authError) { setUser(null); }
      } catch (error) { console.error("Error loading data:", error); } 
      finally { setLoading(false); }
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

  // --- 🔥 PAYMENT & ORDER LOGIC STARTS HERE ---

  // 1. Helper to Load Razorpay Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
  };

  // 2. Main Order Function (Called from Checkout.jsx)
  const processOrder = async (paymentMethod, navigate) => {
    if (!user) {
        showNotification("Please login to place an order");
        navigate("/auth");
        return;
    }

    // Dummy Address (Kyunki Checkout form me address input nahi tha, baad me form add karlena)
    const shippingInfo = {
        address: "123 Luxury Lane",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        pinCode: 400001,
        phoneNo: 9876543210
    };

    const orderItems = cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.qty,
        image: item.images[0].url,
        product: item._id
    }));

    const itemsPrice = cartTotal;
    const taxPrice = itemsPrice * 0.18; 
    const shippingPrice = itemsPrice > 5000 ? 0 : 200;
    const COD_FEE = paymentMethod === 'cod' ? 50 : 0; // Backend me add nahi kiya tha, toh frontend logic handle karega
    const totalPrice = itemsPrice + taxPrice + shippingPrice + COD_FEE;

    const config = { headers: { "Content-Type": "application/json" }, withCredentials: true };

    // --- CASE 1: CASH ON DELIVERY ---
    if (paymentMethod === 'cod') {
        try {
            const orderData = {
                shippingInfo, orderItems, itemsPrice, taxPrice, shippingPrice, totalPrice,
                paymentInfo: { id: "cod", status: "pending" }
            };
            
            await axios.post(`${API_URL}/order/new`, orderData, config);
            
            // Success
            setCart([]);
            setIsCartOpen(false);
            setShowOrderSuccess(true);
            navigate("/");
        } catch (error) {
            showNotification(error.response?.data?.message || "COD Order Failed");
        }
    } 
    
    // --- CASE 2: ONLINE PAYMENT (RAZORPAY) ---
    else {
        try {
            const res = await loadRazorpayScript();
            if (!res) {
                showNotification("Razorpay SDK failed to load. Are you online?");
                return;
            }

            // A. Create Order on Server (Get Order ID)
            // Razorpay amount paise me leta hai (multiply by 100)
            const paymentData = { amount: Math.round(totalPrice * 100) }; 
            
            const { data: orderData } = await axios.post(`${API_URL}/payment/process`, paymentData, config);

            // B. Get Key ID
            const { data: keyData } = await axios.get(`${API_URL}/payment/razorpaykey`, config);

            // C. Open Razorpay Popup
            const options = {
                key: keyData.razorpayApiKey,
                amount: orderData.amount,
                currency: "INR",
                name: "ORVELLA",
                description: "Luxury Fragrance Purchase",
                image: "/orvella.jpeg", // Logo path
                order_id: orderData.order_id, // Ye backend se aaya hua ID hai
                
                // D. Handler: Jab payment successful ho jaye
                handler: async function (response) {
                    try {
                        const finalOrderData = {
                            shippingInfo, orderItems, itemsPrice, taxPrice, shippingPrice, totalPrice,
                            paymentInfo: {
                                id: response.razorpay_payment_id,
                                status: "succeeded"
                            }
                        };

                        // E. Final Save to Database
                        await axios.post(`${API_URL}/order/new`, finalOrderData, config);

                        setCart([]);
                        setIsCartOpen(false);
                        setShowOrderSuccess(true);
                        navigate("/");
                    } catch (error) {
                        showNotification("Payment successful but order creation failed. Contact support.");
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: "9999999999" // User phone
                },
                theme: {
                    color: "#D4AF37"
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.open();

        } catch (error) {
            console.error(error);
            showNotification("Online Payment Initialization Failed");
        }
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
        processOrder, // <-- UPDATED FUNCTION NAME
        showOrderSuccess, setShowOrderSuccess
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};