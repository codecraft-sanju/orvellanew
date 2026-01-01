import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, CreditCard, Banknote } from "lucide-react";
import { useShop } from "./ShopContext"; // Import useShop
import { useNavigate } from "react-router-dom";

const CheckoutModal = ({ cart, subtotal, onClose }) => {
  // Context se processOrder function nikalo
  const { processOrder } = useShop(); 
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('online');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const COD_FEE = 50;
  const finalTotal = paymentMethod === 'cod' ? subtotal + COD_FEE : subtotal;

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    // Call the Main Logic in Context
    // Yeh ab Razorpay kholega ya COD order place karega
    await processOrder(paymentMethod, navigate);
    
    // Note: Agar online payment cancel hoti hai, toh loader band karna padega manually
    // But for simplicity, we assume flow completes or user closes modal.
    setTimeout(() => {
       setIsProcessing(false);
       // Agar successful hua toh modal Context dwara close hoga
    }, 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 bg-[#0a0a0a] border border-[#D4AF37]/30 w-full max-w-2xl rounded-sm overflow-hidden flex flex-col md:flex-row shadow-[0_0_80px_rgba(212,175,55,0.2)]"
      >
        {isProcessing ? (
             <div className="w-full h-[500px] flex flex-col items-center justify-center p-12 text-center">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mb-6"
                >
                    <Loader2 size={64} className="text-[#D4AF37]" />
                </motion.div>
                <h3 className="text-2xl font-serif text-white mb-2">Processing Payment</h3>
                <p className="text-gray-400 text-sm tracking-widest uppercase">
                    {paymentMethod === 'online' ? "Connecting to Razorpay Secure..." : "Confirming Order..."}
                </p>
             </div>
        ) : (
            <>
                {/* Left Side: Order Summary */}
                <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-white/10 bg-[#050505]">
                    <h3 className="text-[#D4AF37] font-serif text-xl mb-6 tracking-wide">Order Summary</h3>
                    <div className="space-y-4 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                        {cart.map((item) => (
                            <div key={item._id} className="flex justify-between items-center text-sm">
                                <span className="text-gray-300">{item.name} <span className="text-gray-500">x{item.qty}</span></span>
                                <span className="text-white font-mono">₹{item.price * item.qty}</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-white/10 space-y-3 text-sm">
                        <div className="flex justify-between text-gray-400">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Shipping</span>
                            <span className="text-green-500">FREE</span>
                        </div>
                        {paymentMethod === 'cod' && (
                             <motion.div 
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                className="flex justify-between text-[#D4AF37]"
                             >
                                <span>COD Fee</span>
                                <span>+₹{COD_FEE}</span>
                             </motion.div>
                        )}
                        <div className="flex justify-between text-white text-lg font-bold border-t border-white/10 pt-4 mt-2">
                            <span>Total</span>
                            <span>₹{finalTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Payment Method */}
                <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-serif text-xl">Payment Method</h3>
                            <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20}/></button>
                        </div>

                        <div className="space-y-4">
                            <label 
                                className={`flex items-center gap-4 p-4 border rounded cursor-pointer transition-all duration-300 clickable ${
                                    paymentMethod === 'online' ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10 hover:border-white/30'
                                }`}
                                onClick={() => setPaymentMethod('online')}
                            >
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'online' ? 'border-[#D4AF37]' : 'border-gray-500'}`}>
                                    {paymentMethod === 'online' && <div className="w-3 h-3 rounded-full bg-[#D4AF37]" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-bold text-sm">Online Payment</span>
                                        <CreditCard size={18} className="text-gray-400"/>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">UPI, Credit Card, Net Banking</p>
                                </div>
                            </label>

                            <label 
                                className={`flex items-center gap-4 p-4 border rounded cursor-pointer transition-all duration-300 clickable ${
                                    paymentMethod === 'cod' ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10 hover:border-white/30'
                                }`}
                                onClick={() => setPaymentMethod('cod')}
                            >
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${paymentMethod === 'cod' ? 'border-[#D4AF37]' : 'border-gray-500'}`}>
                                    {paymentMethod === 'cod' && <div className="w-3 h-3 rounded-full bg-[#D4AF37]" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-bold text-sm">Cash on Delivery</span>
                                        <Banknote size={18} className="text-gray-400"/>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Pay with cash upon arrival (+₹50)</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <button 
                        onClick={handlePlaceOrder}
                        className="mt-8 w-full py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-sm shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                    >
                        {paymentMethod === 'online' ? `Pay ₹${finalTotal}` : `Place Order ₹${finalTotal}`}
                    </button>
                </div>
            </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CheckoutModal;