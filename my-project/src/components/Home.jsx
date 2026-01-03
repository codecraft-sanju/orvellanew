import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useTransform, useScroll, AnimatePresence } from "framer-motion";
import { 
  ShoppingBag, Menu, X, Star, ShieldCheck, Truck, 
  Instagram, Twitter, Facebook, Plus, Minus, Trash2, LogOut, ArrowRight,
  Timer 
} from "lucide-react";

// --- IMPORTS ---
import { useShop } from "./ShopContext"; 
import CheckoutModal from "./Checkout";           
import OrderSuccessModal from "./OrderSuccess";  
import {                              
  NoiseOverlay, CustomCursor, AnimatedTitle, 
  RevealOnScroll, TiltCard 
} from "./MotionComponents";


export default function Home() {
  const { 
    products, addToCart, cart, isCartOpen, setIsCartOpen, 
    removeFromCart, updateQty, cartTotal, cartCount, notification,
    loading, user, logout,
    showOrderSuccess, setShowOrderSuccess
  } = useShop();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  
  // --- STATE FOR CHECKOUT ---
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState(null);

  // --- STATE FOR OFFER TIMER ---
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // --- STATE FOR NEWSLETTER ---
  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeMsg, setSubscribeMsg] = useState("");

  const navigate = useNavigate();
  const { scrollY } = useScroll();
  
  // Mobile Optimized Parallax: Movement range kam kar diya hai taaki phone pe content bhaage nahi
  const yHeroText = useTransform(scrollY, [0, 500], [0, 100]);
  const yHeroImage = useTransform(scrollY, [0, 500], [0, -30]);

  // Smooth Scroll Listener
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- TIMER LOGIC ---
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(now);
      target.setHours(24, 0, 0, 0); 
      
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ hours: 23, minutes: 59, seconds: 59 });
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft(); 

    return () => clearInterval(timer);
  }, []);

  // Body Scroll Lock & Back Button Handling
  useEffect(() => {
    if (mobileMenuOpen || showOrderSuccess || selectedProduct || isCheckoutOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'unset';
    }

    const handlePopState = (event) => {
        if (showOrderSuccess) {
            event.preventDefault();
            setShowOrderSuccess(false);
        } else if (isCheckoutOpen) {
            event.preventDefault();
            setIsCheckoutOpen(false);
        } else if (selectedProduct) {
            event.preventDefault();
            setSelectedProduct(null);
        } else if (mobileMenuOpen) {
            event.preventDefault();
            setMobileMenuOpen(false);
        }
    };

    if (showOrderSuccess || selectedProduct || mobileMenuOpen || isCheckoutOpen) {
        window.history.pushState(null, null, window.location.pathname);
        window.addEventListener('popstate', handlePopState);
    }

    return () => {
        window.removeEventListener('popstate', handlePopState);
        document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen, showOrderSuccess, selectedProduct, isCheckoutOpen, setShowOrderSuccess]);

  // --- NEWSLETTER HANDLER ---
  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
        setSubscribeMsg("Please enter a valid email.");
        return;
    }

    setSubscribing(true);
    setSubscribeMsg("");

    try {
       const response = await fetch("https://orvellanew.onrender.com/api/v1/newsletter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
           throw new Error("Server error: Response was not JSON");
        }

        const data = await response.json();

        if (response.ok) {
            setSubscribeMsg("Welcome to the inner circle.");
            setEmail(""); 
        } else {
            setSubscribeMsg(data.message || "Something went wrong.");
        }
    } catch (error) {
        setSubscribeMsg("Server connection failed.");
    } finally {
        setSubscribing(false);
        setTimeout(() => setSubscribeMsg(""), 3000);
    }
  };

  const DEFAULT_PRODUCT = {
    _id: "orvella-golden-root-main", 
    name: "Orvella The Golden Root",
    price: 120, 
    description: "Crafted with a secret chemical formula for the elite. A scent that doesn't just linger, it commands attention.",
    longDescription: "Crafted with a secret chemical formula for the elite. A scent that doesn't just linger, it commands attention. Experience the scent that defines luxury. This masterpiece is created using rare ingredients sourced from the depths of the Amazon...",
    images: [{ url: "/orvella.jpeg" }], 
    category: "Signature Scent",
    stock: 100, 
    tag: "Premium Edition"
  };

  const heroProduct = products.length > 0 ? products[0] : DEFAULT_PRODUCT;

  // --- PRICE LOGIC FOR OFFER ---
  const originalPrice = heroProduct.price;
  const offerPrice = originalPrice - 20;

  // --- UPDATED BUY FUNCTION ---
  const handleBuy = (product, isOffer = false) => {
    if (product._id === "orvella-golden-root-main") {
        alert("⚠️ SYSTEM NOTICE: Please check database connection.");
        return; 
    }
    
    if (product) {
      let productToAdd = product;
      if (isOffer) {
        productToAdd = {
            ...product,
            _id: `${product._id}-offer`,
            price: offerPrice,
            name: `${product.name} (Limited Deal)`,
            tag: "Flash Sale"
        };
      }
      addToCart(productToAdd);
      setIsCartOpen(true); 
      setSelectedProduct(null); 
    }
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; 
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  const handleInitiateCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };


  const handleConfirmOrder = (method) => {
   setLastOrderDetails({ method: method }); 
   setIsCheckoutOpen(false); 
   setShowOrderSuccess(true);   
  };

  const handleContinueShopping = () => {
    setShowOrderSuccess(false);
    setLastOrderDetails(null);
    navigate("/");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- LOADING SCREEN (Highest Z-Index) ---
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#050505] z-[9999] flex flex-col items-center justify-center overflow-hidden">
        <NoiseOverlay />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} 
          className="text-[#D4AF37] font-serif text-5xl md:text-7xl tracking-widest font-bold z-10"
        >
          ORVELLA
        </motion.div>
        <motion.div 
          initial={{ width: 0 }} animate={{ width: 250 }} 
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="h-[1px] bg-[#D4AF37] mt-6 z-10"
        />
        <p className="text-gray-500 mt-4 text-xs tracking-[0.5em] uppercase animate-pulse z-10">Initializing Luxury</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-[#E0E0E0] font-sans selection:bg-[#D4AF37] selection:text-black overflow-x-hidden cursor-none-md">
      
      {/* GLOBAL EFFECTS */}
      <NoiseOverlay />
      <CustomCursor />

      {/* --- TOAST NOTIFICATION (Z-Index High) --- */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 mx-auto w-max max-w-[90%] z-[200] bg-[#D4AF37] text-black px-6 py-3 rounded-b-lg font-bold shadow-[0_0_30px_rgba(212,175,55,0.4)] backdrop-blur-md text-center text-sm"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CHECKOUT MODAL (Z-Index Highest) --- */}
      <AnimatePresence>
        {isCheckoutOpen && (
            <CheckoutModal 
                cart={cart}
                subtotal={cartTotal}
                onClose={() => setIsCheckoutOpen(false)}
                onOrderSuccess={handleConfirmOrder}
            />
        )}
      </AnimatePresence>

      {/* --- ORDER SUCCESS MODAL --- */}
      <AnimatePresence>
        {showOrderSuccess && (
            <OrderSuccessModal 
                onClose={() => setShowOrderSuccess(false)} 
                onContinueShopping={handleContinueShopping}
                orderDetails={lastOrderDetails}
            />
        )}
      </AnimatePresence>

      {/* --- CART DRAWER (Z-Index 90: Above Navbar) --- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]"
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-[#0a0a0a] border-l border-[#D4AF37]/20 z-[100] p-6 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                <h2 className="text-xl font-serif text-[#D4AF37]">Your Bag ({cartCount})</h2>
                <button onClick={() => setIsCartOpen(false)} className="hover:rotate-90 transition-transform duration-300 p-2"><X className="text-white hover:text-[#D4AF37]" size={24} /></button>
              </div>

              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                  <ShoppingBag size={48} className="mb-4 opacity-20" />
                  <p>Your bag is empty.</p>
                  <button onClick={() => setIsCartOpen(false)} className="mt-4 text-[#D4AF37] hover:underline uppercase tracking-widest text-xs">Start Shopping</button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                  {cart.map(item => (
                    <div key={item._id} className="flex gap-4 border-b border-white/5 pb-6 group">
                      <img 
                        src={item.images && item.images[0] ? item.images[0].url : "/orvella.jpeg"} 
                        alt={item.name} 
                        className="w-20 h-24 object-cover rounded bg-[#050505] border border-white/5" 
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-serif text-lg text-white group-hover:text-[#D4AF37] transition-colors line-clamp-1">{item.name}</h4>
                          <button onClick={() => removeFromCart(item._id)} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                        <p className="text-[#D4AF37] text-sm mt-1 font-mono">₹{item.price}</p>
                        <div className="flex items-center gap-4 mt-4 bg-white/5 w-max px-2 py-1 rounded-full">
                          <button onClick={() => updateQty(item._id, -1)} className="p-1 hover:text-[#D4AF37] transition-colors"><Minus size={14}/></button>
                          <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item._id, 1)} className="p-1 hover:text-[#D4AF37] transition-colors"><Plus size={14}/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 border-t border-white/10 pt-6">
                <div className="flex justify-between text-xl font-serif mb-6">
                  <span>Subtotal</span>
                  <span className="text-[#D4AF37]">₹{cartTotal.toLocaleString()}</span>
                </div>
                <button 
                  disabled={cart.length === 0}
                  onClick={handleInitiateCheckout}
                  className="w-full bg-[#D4AF37] text-black py-4 font-bold uppercase tracking-widest hover:bg-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Checkout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- PRODUCT DETAIL MODAL (Z-Index 80) --- */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center md:px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="relative bg-[#0a0a0a] border border-[#D4AF37]/30 w-full md:max-w-5xl rounded-t-2xl md:rounded-sm overflow-hidden grid md:grid-cols-2 shadow-[0_0_100px_rgba(212,175,55,0.15)] z-[90] max-h-[90vh] overflow-y-auto md:overflow-visible"
            >
              {/* Mobile Close Button */}
              <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full md:hidden text-white"><X size={20} /></button>

              <div className="h-[300px] md:h-[600px] bg-[#050505] p-8 flex items-center justify-center relative overflow-hidden group">
                 <img 
                   src={selectedProduct.images && selectedProduct.images[0] ? selectedProduct.images[0].url : "/orvella.jpeg"} 
                   alt={selectedProduct.name} 
                   className="h-[90%] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] z-10" 
                 />
              </div>
              <div className="p-8 md:p-16 flex flex-col justify-center relative">
                <button onClick={() => setSelectedProduct(null)} className="hidden md:block absolute top-6 right-6 text-gray-500 hover:text-white hover:rotate-90 transition-all"><X size={24} /></button>
                <span className="text-[#D4AF37] uppercase tracking-[0.3em] text-xs font-bold mb-4">{selectedProduct.tag || "Premium Edition"}</span>
                <h2 className="text-3xl md:text-5xl font-serif text-white mb-6 leading-tight">{selectedProduct.name}</h2>
                <p className="text-gray-400 leading-relaxed mb-8 text-sm md:text-base border-l-2 border-[#D4AF37]/30 pl-6">{selectedProduct.description}</p>
                <div className="text-3xl text-[#D4AF37] font-serif mb-10">₹{selectedProduct.price}</div>
                <button 
                  onClick={() => handleBuy(selectedProduct)}
                  className="w-full bg-[#D4AF37] text-black py-4 font-bold uppercase tracking-widest hover:bg-white transition-all duration-300"
                >
                  Add to Collection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- NAVBAR (Z-Index 40: Standard Layer) --- */}
      <nav 
        className={`fixed w-full z-40 top-0 transition-all duration-500 ${
          mobileMenuOpen 
            ? "bg-transparent py-4" 
            : isScrolled 
              ? "bg-[#050505]/90 backdrop-blur-lg border-b border-white/5 py-3" 
              : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="text-2xl md:text-3xl font-serif font-bold text-[#D4AF37] tracking-[0.2em] hover:text-white transition-colors relative z-[41]">
            ORVELLA
          </Link>
          
          <div className="hidden md:flex items-center space-x-12 text-xs font-bold tracking-[0.2em] uppercase text-gray-400">
            <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-[#D4AF37] transition-colors hover:scale-110 transform duration-300">Home</button>
            <button onClick={() => scrollToSection('details')} className="hover:text-[#D4AF37] transition-colors hover:scale-110 transform duration-300">The Scent</button>
            <button onClick={() => scrollToSection('offer')} className="hover:text-[#D4AF37] transition-colors hover:scale-110 transform duration-300">Offers</button>
          </div>
          
          <div className="flex items-center space-x-6 relative z-[41]">
             {user ? (
               <div className="hidden md:flex items-center gap-6">
                 {user.role === 'admin' ? (
                    <Link to="/admin" className="text-[#D4AF37] text-xs font-bold tracking-wider border border-[#D4AF37] px-4 py-2 hover:bg-[#D4AF37] hover:text-black transition-all">ADMIN</Link>
                 ) : (
                    <span className="text-white text-xs tracking-widest">HI, {user.name.split(' ')[0].toUpperCase()}</span>
                 )}
                 <button onClick={logout} className="text-gray-500 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
               </div>
            ) : (
              <Link to="/auth" className="hidden md:block text-xs font-bold tracking-widest hover:text-[#D4AF37] transition-colors">LOGIN</Link>
            )}

            <button className="relative group p-1" onClick={() => setIsCartOpen(true)}>
              <ShoppingBag className="text-white group-hover:text-[#D4AF37] transition-colors duration-300" size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D4AF37] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            
            {/* MOBILE TOGGLE */}
            <button 
              className="md:hidden text-white hover:text-[#D4AF37] transition-colors p-1" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={26} className="text-[#D4AF37]" /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* --- MOBILE OVERLAY MENU (Z-Index 50: Above Navbar content) --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 top-0 left-0 w-full h-[100dvh] bg-[#050505] z-[39] flex flex-col justify-center px-8 md:hidden overflow-hidden"
          >
            <NoiseOverlay />
            
            <div className="space-y-8 relative z-10">
              {[
                { l: "Home", action: () => { window.scrollTo({top:0, behavior:'smooth'}); setMobileMenuOpen(false); } },
                { l: "The Scent", action: () => scrollToSection('details') },
                { l: "Offers", action: () => scrollToSection('offer') },
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                >
                  <button onClick={item.action} className="text-4xl font-serif text-white hover:text-[#D4AF37] transition-colors text-left w-full block">
                    {item.l}
                  </button>
                </motion.div>
              ))}

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="pt-8 border-t border-white/10 mt-8">
                {user ? (
                    <div className="space-y-4">
                      <p className="text-[#D4AF37] text-xl font-serif">Welcome, {user.name}</p>
                      {user.role === 'admin' && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block text-white">Admin Dashboard</Link>}
                      <button onClick={() => {logout(); setMobileMenuOpen(false);}} className="text-red-500 text-lg">Logout</button>
                    </div>
                ) : (
                    <Link onClick={() => setMobileMenuOpen(false)} to="/auth" className="text-2xl font-serif text-white hover:text-[#D4AF37]">Login / Register</Link>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex items-center pt-24 pb-12 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#D4AF37]/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center w-full relative z-10">
          
          {/* Text Content */}
          <motion.div style={{ y: yHeroText }} className="space-y-6 text-center md:text-left order-2 md:order-1">
            <motion.div 
              initial={{ opacity: 0, letterSpacing: "1em" }} animate={{ opacity: 1, letterSpacing: "0.4em" }} transition={{ duration: 1.5 }}
              className="text-[#D4AF37] text-xs md:text-sm uppercase font-bold pl-1"
            >
              Premium Edition 2026
            </motion.div>
            
            <AnimatedTitle text="The Golden Root" className="text-5xl md:text-8xl lg:text-9xl font-serif font-bold text-white leading-[1] md:leading-[0.9] justify-center md:justify-start" />
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 1 }}
              className="text-gray-400 text-base md:text-lg max-w-lg mx-auto md:mx-0 font-light leading-relaxed"
            >
              {heroProduct.description}
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              className="pt-6 flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
            >
              <button 
                onClick={() => handleBuy(heroProduct)} 
                className="group px-8 py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-white transition-all duration-500 relative overflow-hidden"
              >
                <span className="relative z-10">Shop Now</span>
              </button>
              
              <button 
                onClick={() => { if(heroProduct) setSelectedProduct(heroProduct); }} 
                className="px-8 py-4 border border-white/20 text-white font-bold uppercase tracking-widest hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all"
              >
                View Notes
              </button>
            </motion.div>
          </motion.div>

          {/* Image - Mobile Optimized (Smaller height, clean stacking) */}
          <motion.div 
            style={{ y: yHeroImage }}
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative h-[350px] md:h-[800px] w-full flex justify-center items-center order-1 md:order-2"
          >
             <TiltCard>
               <motion.img 
                 src={heroProduct.images[0].url} 
                 alt="Orvella Perfume Bottle" 
                 className="h-full object-contain drop-shadow-[0_20px_50px_rgba(212,175,55,0.15)] z-20"
                 animate={{ y: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
               />
             </TiltCard>
          </motion.div>
        </div>
      </section>

      {/* --- INFINITE BRAND TICKER (Clean Loop) --- */}
      <div className="py-6 bg-[#D4AF37] border-y border-white/10 overflow-hidden relative z-20">
        <div className="flex whitespace-nowrap">
          <motion.div 
            animate={{ x: "-50%" }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="flex gap-8 md:gap-16 text-black font-bold tracking-[0.2em] uppercase text-xs md:text-lg items-center"
          >
            {Array(10).fill(null).map((_, i) => (
              <React.Fragment key={i}>
                <span>Orvella • Luxury Fragrance •</span>
                <Star size={14} fill="black" />
              </React.Fragment>
            ))}
          </motion.div>
        </div>
      </div>

      {/* --- DETAILS SECTION --- */}
      <section id="details" className="py-24 bg-[#050505] relative">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
                <RevealOnScroll>
                    <div className="relative bg-[#0a0a0a] p-10 md:p-16 border border-white/5 rounded-sm overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />
                      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50" />
                      <img 
                          src={heroProduct.images[0].url} 
                          alt="Orvella Detail" 
                          className="w-full h-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]"
                      />
                    </div>
                </RevealOnScroll>

                <div className="space-y-8 text-center md:text-left">
                    <RevealOnScroll delay={0.2}>
                        <span className="text-[#D4AF37] uppercase tracking-[0.3em] font-bold text-xs flex items-center justify-center md:justify-start gap-4">
                          <span className="w-12 h-[1px] bg-[#D4AF37] hidden md:block"></span> The Masterpiece
                        </span>
                        <h2 className="mt-6 text-4xl md:text-6xl font-serif text-white">Unveiling The <br/> <span className="italic text-[#D4AF37]">Golden Root</span></h2>
                    </RevealOnScroll>
                    
                    <RevealOnScroll delay={0.3}>
                      <p className="text-gray-400 leading-loose text-base md:text-lg whitespace-pre-line">
                          {heroProduct.longDescription || heroProduct.description}
                      </p>
                    </RevealOnScroll>

                    <RevealOnScroll delay={0.5}>
                      <div className="flex flex-col md:flex-row items-center gap-6 pt-4">
                          <div className="text-3xl text-[#D4AF37] font-serif">₹{heroProduct.price}</div>
                          <button 
                              onClick={() => handleBuy(heroProduct)}
                              className="w-full md:w-auto px-10 py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] flex items-center justify-center gap-2"
                          >
                              Add to Bag <ArrowRight size={18}/>
                          </button>
                      </div>
                    </RevealOnScroll>
                </div>
            </div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="py-24 bg-[#0a0a0a] border-t border-white/5 relative">
         <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-6">
            {[
                { icon: <Star className="text-[#D4AF37]" size={32}/>, title: "Exquisite Scent", desc: "Rare ingredients blended to perfection." },
                { icon: <ShieldCheck className="text-[#D4AF37]" size={32}/>, title: "Certified Quality", desc: "Dermatologically tested and safe." },
                { icon: <Truck className="text-[#D4AF37]" size={32}/>, title: "Express Delivery", desc: "Secure shipping across India in 3 days." },
            ].map((f, idx) => (
                <RevealOnScroll key={idx} delay={idx * 0.1}>
                  <div className="p-8 md:p-12 border border-white/5 bg-[#050505] transition-all hover:border-[#D4AF37]/30 text-center">
                      <div className="mb-6 flex justify-center p-4 bg-white/5 rounded-full w-max mx-auto text-[#D4AF37]">{f.icon}</div>
                      <h3 className="text-xl font-serif text-white mb-3">{f.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </RevealOnScroll>
            ))}
        </div>
      </section>

      {/* --- EXCLUSIVE OFFER SECTION --- */}
      <section id="offer" className="relative py-24 bg-[#050505] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
            <RevealOnScroll>
              <div className="grid md:grid-cols-2 bg-[#0a0a0a] border border-[#D4AF37]/20 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.05)]">
                  
                  {/* Left: Product & Visuals */}
                  <div className="relative p-10 flex items-center justify-center bg-gradient-to-br from-[#121212] to-[#050505]">
                      <span className="absolute top-4 left-4 bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full animate-pulse">
                        Flash Sale
                      </span>
                      <img 
                          src={heroProduct.images[0].url} 
                          className="w-[60%] drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]"
                          alt="Offer Product"
                      />
                  </div>

                  {/* Right: Content & Timer */}
                  <div className="p-8 md:p-12 flex flex-col justify-center border-l border-white/5">
                      <div className="flex gap-3 mb-6 justify-center md:justify-start">
                          {['hours', 'minutes', 'seconds'].map((unit, i) => (
                              <div key={i} className="flex flex-col items-center">
                                  <div className="w-12 h-12 bg-[#1a1a1a] border border-[#D4AF37]/30 rounded flex items-center justify-center text-lg font-mono text-[#D4AF37]">
                                      {String(timeLeft[unit]).padStart(2, '0')}
                                  </div>
                                  <span className="text-[10px] text-gray-500 uppercase mt-2">{unit.charAt(0)}</span>
                              </div>
                          ))}
                      </div>

                      <h2 className="text-3xl font-serif text-white mb-2 text-center md:text-left">
                        Daily <span className="text-[#D4AF37] italic">Deal</span>
                      </h2>
                      
                      <div className="flex items-end gap-4 mb-8 justify-center md:justify-start">
                          <span className="text-gray-500 line-through text-lg">₹{originalPrice}</span>
                          <span className="text-4xl text-[#D4AF37] font-serif">₹{offerPrice}</span>
                      </div>

                      <button 
                        onClick={() => handleBuy(heroProduct, true)} 
                        className="w-full py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-white transition-all shadow-lg"
                      >
                          Claim Offer
                      </button>
                  </div>
              </div>
            </RevealOnScroll>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#020202] border-t border-white/10 pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-12 mb-16 text-center md:text-left">
                <div className="col-span-1 md:col-span-2 space-y-6">
                    <h2 className="text-3xl font-serif text-[#D4AF37] tracking-widest">ORVELLA</h2>
                    <p className="text-gray-500 max-w-sm mx-auto md:mx-0 text-sm">
                        Defining luxury through scent. The Golden Root is crafted for those who leave a mark.
                    </p>
                    <div className="flex justify-center md:justify-start gap-6">
                        <Instagram className="text-gray-500 hover:text-[#D4AF37] cursor-pointer" size={20} />
                        <Twitter className="text-gray-500 hover:text-[#D4AF37] cursor-pointer" size={20} />
                        <Facebook className="text-gray-500 hover:text-[#D4AF37] cursor-pointer" size={20} />
                    </div>
                </div>

                <div className="space-y-6">
                    <h4 className="text-white font-bold uppercase tracking-widest text-xs">Newsletter</h4>
                    <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address" 
                            className="bg-white/5 border border-white/10 px-4 py-3 text-white text-xs placeholder:text-gray-600"
                        />
                        <button type="submit" className="bg-[#D4AF37] text-black px-4 py-3 text-xs font-bold uppercase tracking-widest">
                            {subscribing ? "..." : "Subscribe"}
                        </button>
                        {subscribeMsg && <p className="text-[#D4AF37] text-xs">{subscribeMsg}</p>}
                    </form>
                </div>
            </div>

            <div className="border-t border-white/5 pt-8 text-center text-xs text-gray-700 font-mono">
                <p>&copy; 2026 Orvella. All Rights Reserved.</p>
            </div>
        </div>
      </footer>
    </main>
  );
}