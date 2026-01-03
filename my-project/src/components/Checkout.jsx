import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, QrCode, Banknote, ArrowRight, Copy, Check } from "lucide-react";
import { useShop } from "./ShopContext"; 
import { useNavigate } from "react-router-dom";

const Checkout = ({ cart, subtotal, onClose, onOrderSuccess }) => {
  const { processOrder, user } = useShop(); 
  const navigate = useNavigate();

  // --- CONFIG ---
  const UPI_ID = "9520615500@ibl"; 
  const SHIPPING_COST = 60; // Fixed Shipping
  const COD_FEE = 50;       // Fixed COD Fee

  // --- STATE ---
  const [step, setStep] = useState(1); 
  const [formData, setFormData] = useState({
    address: "", city: "", state: "", pinCode: "",
    phoneNo: user?.phone || "",
  });
  const [transactionId, setTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState('upi_manual'); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // --- CALCULATIONS ---
  const numericSubtotal = Number(subtotal) || 0;
  
  const finalTotal = paymentMethod === 'cod' 
    ? numericSubtotal + SHIPPING_COST + COD_FEE 
    : numericSubtotal + SHIPPING_COST;

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleNextStep = () => {
    if (!formData.address || !formData.city || !formData.state || !formData.pinCode || !formData.phoneNo) {
        setError("Please fill in all shipping details.");
        return;
    }
    setStep(2);
  };

  const handleCopyUPI = () => {
      navigator.clipboard.writeText(UPI_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'upi_manual' && !transactionId) {
        setError("Please enter the Transaction ID / UTR Number.");
        return;
    }

    setIsProcessing(true);
    
    const shippingInfo = {
        address: formData.address, city: formData.city,
        state: formData.state, country: "India",
        pinCode: formData.pinCode, phoneNo: formData.phoneNo,
    };

    const paymentDetails = {
        method: paymentMethod,
        txnId: paymentMethod === 'upi_manual' ? transactionId : 'COD',
        amount: finalTotal, 
        shippingCost: SHIPPING_COST,
        isCodFeeApplied: paymentMethod === 'cod'
    };

    await processOrder(paymentDetails, shippingInfo, navigate);
    
    setTimeout(() => { 
        setIsProcessing(false); 
        if (onOrderSuccess) onOrderSuccess(paymentMethod);
    }, 2000);
  };

  return (
    // Z-INDEX 9999: Ensures it stays ON TOP of Navbar and everything else
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center sm:p-4"
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative z-10 bg-[#0a0a0a] border-t md:border border-[#D4AF37]/30 w-full max-w-2xl md:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl max-h-[85vh] md:max-h-[90vh]"
      >
        
        {/* Mobile Drag Handle Visual */}
        <div className="md:hidden w-full flex justify-center pt-3 pb-1" onClick={onClose}>
            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>

        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-[#050505] shrink-0">
            <h3 className="text-[#D4AF37] font-serif text-xl tracking-wide">
                {step === 1 ? "Shipping Details" : "Secure Payment"}
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-white p-2"><X size={22}/></button>
        </div>

        {/* CONTENT AREA */}
        <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar pb-10">
            {isProcessing ? (
                 <div className="h-[300px] flex flex-col items-center justify-center text-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mb-6">
                        <Loader2 size={50} className="text-[#D4AF37]" />
                    </motion.div>
                    <h3 className="text-xl font-serif text-white mb-2">Processing Order</h3>
                    <p className="text-gray-400 text-xs tracking-widest uppercase">Do not close this window</p>
                 </div>
            ) : (
                <>
                    {/* --- STEP 1: ADDRESS --- */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div className="space-y-4">
                                {/* TEXT-BASE prevents iOS Zoom */}
                                <textarea name="address" placeholder="Full Address (House, Street, Area)" value={formData.address} onChange={handleInputChange} className="w-full bg-[#121212] border border-white/10 p-4 text-white focus:border-[#D4AF37] outline-none rounded-lg h-24 resize-none text-base transition-colors focus:bg-white/5" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleInputChange} className="w-full bg-[#121212] border border-white/10 p-3 text-white focus:border-[#D4AF37] outline-none rounded-lg text-base transition-colors focus:bg-white/5" />
                                    <input type="text" name="state" placeholder="State" value={formData.state} onChange={handleInputChange} className="w-full bg-[#121212] border border-white/10 p-3 text-white focus:border-[#D4AF37] outline-none rounded-lg text-base transition-colors focus:bg-white/5" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" name="pinCode" placeholder="Pincode" value={formData.pinCode} onChange={handleInputChange} className="w-full bg-[#121212] border border-white/10 p-3 text-white focus:border-[#D4AF37] outline-none rounded-lg text-base transition-colors focus:bg-white/5" />
                                    <input type="number" name="phoneNo" placeholder="Phone Number" value={formData.phoneNo} onChange={handleInputChange} className="w-full bg-[#121212] border border-white/10 p-3 text-white focus:border-[#D4AF37] outline-none rounded-lg text-base transition-colors focus:bg-white/5" />
                                </div>
                            </div>
                            
                            {error && <p className="text-red-500 text-xs bg-red-500/10 p-2 rounded border border-red-500/20 text-center">{error}</p>}
                            
                            <button onClick={handleNextStep} className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-[#D4AF37] transition-all rounded-lg flex items-center justify-center gap-2 mt-4 shadow-lg">
                                Next Step <ArrowRight size={18}/>
                            </button>
                        </div>
                    )}

                    {/* --- STEP 2: PAYMENT --- */}
                    {step === 2 && (
                        <div className="flex flex-col gap-6">
                            
                            {/* Bill Summary (Phone Friendly) */}
                            <div className="bg-[#121212] p-4 rounded-xl border border-white/5">
                                <div className="flex justify-between text-gray-400 text-sm mb-1">
                                    <span>Subtotal</span><span>₹{numericSubtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-400 text-sm mb-1">
                                    <span>Shipping</span>
                                    <span className={SHIPPING_COST === 0 ? "text-green-500" : "text-white"}>
                                        {SHIPPING_COST === 0 ? "FREE" : `₹${SHIPPING_COST}`}
                                    </span>
                                </div>
                                {paymentMethod === 'cod' && (
                                    <div className="flex justify-between text-[#D4AF37] text-sm mb-1 animate-pulse">
                                        <span>COD Fee</span><span>+₹{COD_FEE}</span>
                                    </div>
                                )}
                                <div className="border-t border-white/10 pt-3 mt-2 flex justify-between text-white font-bold text-lg">
                                    <span>Total Pay</span>
                                    <span className="text-[#D4AF37]">₹{finalTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Address Preview - Quick Edit */}
                            <div className="flex justify-between items-center bg-[#121212] p-3 rounded-lg border border-white/5">
                                <p className="text-gray-400 text-xs truncate max-w-[80%]">{formData.address}, {formData.city}</p>
                                <button onClick={() => setStep(1)} className="text-[#D4AF37] text-xs font-bold underline">Edit</button>
                            </div>

                            {/* Payment Methods */}
                            <div className="space-y-3">
                                {/* UPI Option */}
                                <div 
                                    onClick={() => setPaymentMethod('upi_manual')}
                                    className={`border rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'upi_manual' ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/10 hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <QrCode size={20} className="text-white"/>
                                        <span className="text-white font-bold text-sm">Pay via UPI (QR Code)</span>
                                    </div>

                                    {paymentMethod === 'upi_manual' && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 overflow-hidden">
                                            <div className="bg-black/50 p-4 rounded-lg border border-white/10 mb-4 flex flex-col items-center">
                                                <div className="bg-white p-2 rounded-lg mb-3 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                                    <img src="/qr-code.jpeg" alt="QR" className="w-40 h-40 object-contain" />
                                                </div>
                                                <div onClick={handleCopyUPI} className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-full border border-white/10 cursor-pointer active:scale-95 transition-transform">
                                                    <span className="text-[#D4AF37] font-mono text-xs">{UPI_ID}</span>
                                                    {copied ? <Check size={12} className="text-green-500"/> : <Copy size={12} className="text-gray-500"/>}
                                                </div>
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="Enter Transaction ID / UTR" 
                                                value={transactionId}
                                                onChange={(e) => setTransactionId(e.target.value)}
                                                className="w-full bg-black border border-white/20 p-3 text-white text-base rounded-lg focus:border-[#D4AF37] outline-none"
                                            />
                                        </motion.div>
                                    )}
                                </div>

                                {/* COD Option */}
                                <div 
                                    onClick={() => setPaymentMethod('cod')}
                                    className={`border rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/10 hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Banknote size={20} className="text-white"/>
                                            <span className="text-white font-bold text-sm">Cash on Delivery</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded border border-[#D4AF37]/20">+₹{COD_FEE}</span>
                                    </div>
                                </div>
                            </div>

                            {error && <p className="text-red-500 text-xs text-center animate-pulse">{error}</p>}

                            <button onClick={handlePlaceOrder} className="w-full py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-white transition-all rounded-lg shadow-lg shadow-[#D4AF37]/20 mt-2">
                                {paymentMethod === 'upi_manual' 
                                    ? "Verify & Pay" 
                                    : "Place Order"}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Checkout;