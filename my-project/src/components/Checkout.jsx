import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, QrCode, Banknote, ArrowRight, MapPin, Phone, Copy, Check } from "lucide-react";
import { useShop } from "./ShopContext"; 
import { useNavigate } from "react-router-dom";

const Checkout = ({ cart, subtotal, onClose }) => {
  const { processOrder, user } = useShop(); 
  const navigate = useNavigate();

  // --- CONFIG (Dynamic Values) ---
  const UPI_ID = "9520615500@ibl"; 
  const SHIPPING_COST = 0; // Future me agar shipping charge lagana ho to yaha change karna
  const COD_FEE = 50;      // COD ka extra charge

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

  // --- DYNAMIC TOTAL CALCULATION ---
  // Ensure subtotal is a number
  const numericSubtotal = Number(subtotal) || 0;
  
  // Calculate Final Total based on Payment Method
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
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: "India",
        pinCode: formData.pinCode,
        phoneNo: formData.phoneNo,
    };

    const paymentDetails = {
        method: paymentMethod,
        txnId: paymentMethod === 'upi_manual' ? transactionId : 'COD',
        amount: finalTotal, // Backend ko final amount bhejna zaruri hai
        isCodFeeApplied: paymentMethod === 'cod'
    };

    await processOrder(paymentDetails, shippingInfo, navigate);
    // Note: Timeout hata diya hai kyunki processOrder successful hone par modal waise bhi band ho jayega ya redirect hoga
    setTimeout(() => { setIsProcessing(false); }, 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-4"
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        className="relative z-10 bg-[#0a0a0a] border-t md:border border-[#D4AF37]/30 w-full max-w-2xl md:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center p-5 border-b border-white/10 bg-[#050505] shrink-0">
            <h3 className="text-[#D4AF37] font-serif text-xl tracking-wide">
                {step === 1 ? "Shipping Details" : "Secure Payment"}
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-white p-2"><X size={20}/></button>
        </div>

        {/* CONTENT AREA (Scrollable) */}
        <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar">
            {isProcessing ? (
                 <div className="h-[300px] flex flex-col items-center justify-center text-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mb-6">
                        <Loader2 size={50} className="text-[#D4AF37]" />
                    </motion.div>
                    <h3 className="text-xl font-serif text-white mb-2">Processing Order</h3>
                    <p className="text-gray-400 text-xs tracking-widest uppercase">Please do not close this window</p>
                 </div>
            ) : (
                <>
                    {/* --- STEP 1: ADDRESS FORM --- */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Address</label>
                                    <textarea name="address" placeholder="House No, Building, Street Area" value={formData.address} onChange={handleInputChange} className="w-full bg-[#121212] border border-white/10 p-4 text-white focus:border-[#D4AF37] outline-none rounded-lg h-24 resize-none text-sm transition-colors focus:bg-white/5" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">City</label>
                                        <input type="text" name="city" placeholder="Mumbai" value={formData.city} onChange={handleInputChange} className="w-full bg-[#121212] border border-white/10 p-3 text-white focus:border-[#D4AF37] outline-none rounded-lg text-sm transition-colors focus:bg-white/5" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">State</label>
                                        <input type="text" name="state" placeholder="Maharashtra" value={formData.state} onChange={handleInputChange} className="w-full bg-[#121212] border border-white/10 p-3 text-white focus:border-[#D4AF37] outline-none rounded-lg text-sm transition-colors focus:bg-white/5" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Pincode</label>
                                        <input type="number" name="pinCode" placeholder="400001" value={formData.pinCode} onChange={handleInputChange} className="w-full bg-[#121212] border border-white/10 p-3 text-white focus:border-[#D4AF37] outline-none rounded-lg text-sm transition-colors focus:bg-white/5" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Mobile</label>
                                        <input type="number" name="phoneNo" placeholder="9876543210" value={formData.phoneNo} onChange={handleInputChange} className="w-full bg-[#121212] border border-white/10 p-3 text-white focus:border-[#D4AF37] outline-none rounded-lg text-sm transition-colors focus:bg-white/5" />
                                    </div>
                                </div>
                            </div>
                            
                            {error && <p className="text-red-500 text-xs bg-red-500/10 p-2 rounded border border-red-500/20 text-center">{error}</p>}
                            
                            <button onClick={handleNextStep} className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-[#D4AF37] transition-all rounded-lg flex items-center justify-center gap-2 mt-4">
                                Continue <ArrowRight size={18}/>
                            </button>
                        </div>
                    )}

                    {/* --- STEP 2: PAYMENT --- */}
                    {step === 2 && (
                        <div className="flex flex-col md:flex-row gap-8">
                            
                            {/* Left: Dynamic Bill Summary */}
                            <div className="md:w-5/12 space-y-4 order-2 md:order-1">
                                <div className="bg-[#121212] p-5 rounded-xl border border-white/5">
                                    <h4 className="text-gray-500 text-xs uppercase tracking-widest mb-3 font-bold">Bill Summary</h4>
                                    <div className="space-y-2 text-sm">
                                        {/* Subtotal */}
                                        <div className="flex justify-between text-gray-400">
                                            <span>Subtotal</span>
                                            <span>₹{numericSubtotal.toLocaleString()}</span>
                                        </div>
                                        
                                        {/* Shipping (Dynamic) */}
                                        <div className="flex justify-between text-gray-400">
                                            <span>Shipping</span>
                                            <span className={SHIPPING_COST === 0 ? "text-green-500" : "text-white"}>
                                                {SHIPPING_COST === 0 ? "FREE" : `₹${SHIPPING_COST}`}
                                            </span>
                                        </div>

                                        {/* COD Fee Logic */}
                                        <AnimatePresence>
                                            {paymentMethod === 'cod' && (
                                                <motion.div 
                                                    initial={{ opacity: 0, height: 0 }} 
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="flex justify-between text-[#D4AF37] overflow-hidden"
                                                >
                                                    <span>COD Handling Fee</span>
                                                    <span>+₹{COD_FEE}</span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Final Total */}
                                        <div className="border-t border-white/10 pt-3 mt-2 flex justify-between text-white font-bold text-lg">
                                            <span>Total Amount</span>
                                            <motion.span 
                                                key={finalTotal} // Key change triggers animation
                                                initial={{ scale: 1.1 }} 
                                                animate={{ scale: 1 }}
                                                className="text-[#D4AF37]"
                                            >
                                                ₹{finalTotal.toLocaleString()}
                                            </motion.span>
                                        </div>
                                    </div>
                                </div>

                                {/* Address Preview */}
                                <div className="bg-[#121212] p-4 rounded-xl border border-white/5 text-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-white font-bold">{formData.address}</p>
                                            <p className="text-gray-500 text-xs mt-1">{formData.city}, {formData.state} - {formData.pinCode}</p>
                                            <p className="text-gray-500 text-xs">{formData.phoneNo}</p>
                                        </div>
                                        <button onClick={() => setStep(1)} className="text-[#D4AF37] text-xs hover:underline">Edit</button>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Payment Method */}
                            <div className="md:w-7/12 order-1 md:order-2">
                                <div className="space-y-3">
                                    {/* Option 1: Manual UPI */}
                                    <div 
                                        onClick={() => setPaymentMethod('upi_manual')}
                                        className={`border rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'upi_manual' ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/10 hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${paymentMethod === 'upi_manual' ? 'border-[#D4AF37]' : 'border-gray-500'}`}>
                                                {paymentMethod === 'upi_manual' && <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                                            </div>
                                            <span className="text-white font-bold text-sm flex items-center gap-2"><QrCode size={16}/> UPI QR (Scan & Pay)</span>
                                        </div>

                                        {paymentMethod === 'upi_manual' && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 pl-0 md:pl-7 overflow-hidden">
                                                <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-6 flex flex-col items-center justify-center text-center mb-4">
                                                    
                                                    {/* QR IMAGE */}
                                                    <div className="bg-white p-3 rounded-xl shadow-[0_0_25px_rgba(255,255,255,0.1)] mb-4">
                                                        <img src="/qr-code.jpeg" alt="Scan QR" className="w-48 h-48 md:w-56 md:h-56 object-contain" />
                                                    </div>

                                                    {/* COPY UPI ID */}
                                                    <div onClick={handleCopyUPI} className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-full border border-white/10 cursor-pointer hover:border-[#D4AF37]/50 transition-colors group mb-4">
                                                        <span className="text-[#D4AF37] font-mono font-bold tracking-wider text-sm">{UPI_ID}</span>
                                                        {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14} className="text-gray-500 group-hover:text-white"/>}
                                                    </div>

                                                    <p className="text-xs text-gray-400">Scan using GPay, PhonePe or Paytm</p>
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <label className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider">Enter Transaction ID (UTR)</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="e.g. 405819XXXXXX" 
                                                        value={transactionId}
                                                        onChange={(e) => setTransactionId(e.target.value)}
                                                        className="w-full bg-black border border-white/20 p-3 text-white text-sm focus:border-[#D4AF37] outline-none rounded-lg placeholder:text-gray-700"
                                                    />
                                                    <p className="text-[10px] text-gray-500">*Order will be processed after payment verification.</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Option 2: COD */}
                                    <div 
                                        onClick={() => setPaymentMethod('cod')}
                                        className={`border rounded-xl p-4 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/10 hover:bg-white/5'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${paymentMethod === 'cod' ? 'border-[#D4AF37]' : 'border-gray-500'}`}>
                                                    {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                                                </div>
                                                <div>
                                                    <span className="text-white font-bold text-sm flex items-center gap-2"><Banknote size={16}/> Cash on Delivery</span>
                                                    <p className="text-[10px] text-gray-500 ml-0 md:ml-6 mt-0.5">Pay in cash upon delivery</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded shrink-0">+₹{COD_FEE}</span>
                                        </div>
                                    </div>
                                </div>

                                {error && <p className="text-red-500 text-xs mt-4 text-center animate-pulse">{error}</p>}

                                <button onClick={handlePlaceOrder} className="mt-6 w-full py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-white transition-all rounded-lg shadow-lg shadow-[#D4AF37]/20">
                                    {paymentMethod === 'upi_manual' 
                                        ? `Pay ₹${finalTotal.toLocaleString()}` 
                                        : `Place Order - ₹${finalTotal.toLocaleString()}`}
                                </button>
                            </div>
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