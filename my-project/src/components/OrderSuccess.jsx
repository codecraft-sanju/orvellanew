import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle } from "lucide-react";

const OrderSuccessModal = ({ onClose, onContinueShopping, orderDetails }) => {
  const isManualPayment = orderDetails?.method === 'upi_manual';

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center px-4"
    >
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={onClose} />
      
      <motion.div 
        initial={{ scale: 0.5, opacity: 0, y: 50 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", duration: 0.8, bounce: 0.3 }}
        className="relative z-10 bg-[#0a0a0a] border border-[#D4AF37] w-full max-w-md rounded-lg p-8 md:p-10 text-center shadow-[0_0_100px_rgba(212,175,55,0.3)] overflow-hidden"
      >
        {/* Rotating Background Effect */}
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,_transparent_0%,_#D4AF3710_25%,_transparent_50%,_#D4AF3710_75%,_transparent_100%)] animate-[spin_10s_linear_infinite] opacity-50" />

        {/* Animated Check Icon */}
        <div className="relative mb-6 flex justify-center items-center">
            <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.2 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="absolute w-32 h-32 rounded-full bg-[#D4AF37] blur-xl"
            />
            
            <svg width="120" height="120" viewBox="0 0 100 100" className="relative z-10">
                <motion.circle 
                    cx="50" cy="50" r="45" 
                    fill="none" stroke="#D4AF37" strokeWidth="2"
                    initial={{ pathLength: 0, rotate: -90, opacity: 0 }}
                    animate={{ pathLength: 1, rotate: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                />
                <motion.path 
                    d="M30 52 L43 65 L70 35" 
                    fill="none" stroke="#D4AF37" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.4, type: "spring" }}
                />
            </svg>
        </div>

        <motion.h2 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="text-3xl font-serif text-white mb-2 tracking-wide uppercase"
        >
            Order Placed
        </motion.h2>
        
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="text-gray-400 text-sm mb-6 leading-relaxed font-light"
        >
            Your legacy has been secured. <br/>
            Payment Mode: <span className="text-white font-bold uppercase">{isManualPayment ? 'Online (Verification Pending)' : 'Cash on Delivery'}</span>
            
            {/* 🔥 IMPORTANT DISCLAIMER FOR MANUAL UPI */}
            {isManualPayment && (
                <div className="mt-4 mx-auto bg-[#1a1a1a] border border-[#D4AF37]/40 p-4 rounded text-xs text-left shadow-lg">
                    <div className="flex items-center gap-2 mb-2 text-[#D4AF37] font-bold uppercase tracking-wider">
                        <AlertTriangle size={14} /> Important Note
                    </div>
                    <p className="text-gray-300 leading-5">
                        Your order is currently under <b>Verification</b>. It will be confirmed and processed <b>only if the Transaction ID matches</b> our records.
                    </p>
                    <p className="text-red-400 mt-2 italic">
                        *Invalid or fake transaction IDs will lead to automatic order cancellation.
                    </p>
                </div>
            )}

            {/* MESSAGE FOR COD */}
            {orderDetails?.method === 'cod' && (
                <p className="mt-4 text-xs text-gray-500 bg-white/5 p-2 rounded border border-white/10">
                    Please ensure cash availability at the time of delivery.
                </p>
            )}
        </motion.div>

        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-2 mb-8 rounded inline-block px-6"
        >
             <p className="text-[#D4AF37] font-mono text-xs tracking-widest">ORDER ID: #ORV-{Math.floor(1000 + Math.random() * 9000)}</p>
        </motion.div>

        <motion.button 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
            onClick={onContinueShopping} 
            className="w-full py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-sm shadow-[0_0_20px_rgba(212,175,55,0.4)]"
        >
            Continue Shopping
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default OrderSuccessModal;