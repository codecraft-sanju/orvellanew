import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, AlertTriangle, PackageCheck } from "lucide-react";

const OrderSuccess = ({ onClose, onContinueShopping, orderDetails }) => {
  // Fix: Render nothing if details missing
  if (!orderDetails) return null;

  // Check payment method safely
  const method = orderDetails?.method?.toLowerCase() || "";
  const isCOD = method === 'cod';
  const isManualPayment = method === 'upi_manual';

  return (
    // Z-INDEX 9999: Taaki yeh Checkout aur Navbar sabke upar dikhe
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
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

        {/* --- DYNAMIC ICON & TITLE --- */}
        <div className="relative mb-6 flex justify-center items-center">
            <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.2 }}
                className="absolute w-32 h-32 rounded-full bg-[#D4AF37] blur-xl"
            />
            
            {/* Show Checkmark for COD, Clock/Alert for Manual Payment */}
            {isCOD ? (
                 <motion.div
                    initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", duration: 1 }}
                 >
                    <PackageCheck size={80} className="text-[#D4AF37] relative z-10" />
                 </motion.div>
            ) : (
                <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 1 }}
                 >
                    <Clock size={80} className="text-[#D4AF37] relative z-10" />
                 </motion.div>
            )}
        </div>

        <motion.h2 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="text-3xl font-serif text-white mb-2 tracking-wide uppercase"
        >
            {isCOD ? "Order Confirmed" : "Verification Pending"}
        </motion.h2>
        
        {/* --- DYNAMIC DESCRIPTION --- */}
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-gray-400 text-sm mb-6 leading-relaxed font-light"
        >
            {isCOD ? (
                <>
                    Your request has been received securely.<br />
                    <span className="text-[#D4AF37] font-bold mt-2 block">CASH ON DELIVERY</span>
                    <p className="mt-2 text-xs text-gray-500">Please ensure you have the cash amount ready upon arrival.</p>
                </>
            ) : (
                <>
                    Your transaction ID is being processed.<br />
                    Payment Mode: <span className="text-white font-bold uppercase">UPI (Manual)</span>
                </>
            )}
            
            {/* --- WARNING BOX FOR UPI ONLY --- */}
            {isManualPayment && (
                <div className="mt-6 mx-auto bg-[#1a1a1a] border border-red-500/30 p-4 rounded text-xs text-left shadow-lg relative overflow-hidden group">
                    <div className="absolute left-0 top-0 h-full w-1 bg-[#D4AF37]" />
                    <div className="flex items-center gap-2 mb-2 text-[#D4AF37] font-bold uppercase tracking-wider">
                        <AlertTriangle size={14} className="animate-pulse" /> Verification Required
                    </div>
                    <p className="text-gray-300 leading-5">
                        Your order will be <b>Cancelled Automatically</b> if the provided Transaction ID is incorrect or fake.
                    </p>
                    <p className="text-gray-500 mt-2 italic border-t border-white/5 pt-2">
                        Admin will verify the amount before processing.
                    </p>
                </div>
            )}
        </motion.div>

        {/* --- ORDER ID --- */}
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-2 mb-8 rounded inline-block px-6"
        >
             <p className="text-[#D4AF37] font-mono text-xs tracking-widest">ORDER ID: #ORV-{Math.floor(1000 + Math.random() * 9000)}</p>
        </motion.div>

        {/* --- ACTION BUTTON --- */}
        <motion.button 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
            onClick={onContinueShopping} 
            className="w-full py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-sm shadow-[0_0_20px_rgba(212,175,55,0.4)]"
        >
            Continue Shopping
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default OrderSuccess;