import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, QrCode, Banknote, ArrowRight, MapPin, Phone, CheckCircle } from "lucide-react";
import { useShop } from "./ShopContext"; 
import { useNavigate } from "react-router-dom";

const CheckoutModal = ({ cart, subtotal, onClose }) => {
  const { processOrder, user } = useShop(); 
  const navigate = useNavigate();

  const [step, setStep] = useState(1); 

  const [formData, setFormData] = useState({
    address: "", city: "", state: "", pinCode: "",
    phoneNo: user?.phone || "",
  });

  // Naya State: Transaction ID ke liye
  const [transactionId, setTransactionId] = useState("");
  
  const [paymentMethod, setPaymentMethod] = useState('upi_manual'); // Default UPI
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  
  const COD_FEE = 50;
  const finalTotal = paymentMethod === 'cod' ? subtotal + COD_FEE : subtotal;

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

  const handlePlaceOrder = async () => {
    // UPI Validation
    if (paymentMethod === 'upi_manual' && !transactionId) {
        setError("Please enter the Transaction ID / UTR Number after payment.");
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

    // Extra Details for UPI
    const paymentDetails = {
        method: paymentMethod,
        txnId: paymentMethod === 'upi_manual' ? transactionId : 'COD',
    };

    await processOrder(paymentDetails, shippingInfo, navigate);
    
    setTimeout(() => { setIsProcessing(false); }, 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 bg-[#0a0a0a] border border-[#D4AF37]/30 w-full max-w-2xl rounded-sm overflow-hidden flex flex-col shadow-[0_0_80px_rgba(212,175,55,0.2)]"
      >
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-[#050505]">
            <h3 className="text-[#D4AF37] font-serif text-xl tracking-wide">{step === 1 ? "Shipping Details" : "Payment"}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20}/></button>
        </div>

        {isProcessing ? (
             <div className="w-full h-[400px] flex flex-col items-center justify-center p-12 text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mb-6">
                    <Loader2 size={64} className="text-[#D4AF37]" />
                </motion.div>
                <h3 className="text-2xl font-serif text-white mb-2">Placing Order</h3>
                <p className="text-gray-400 text-sm tracking-widest uppercase">Please wait...</p>
             </div>
        ) : (
            <div className="flex flex-col md:flex-row">
                
                {/* --- STEP 1: ADDRESS FORM (Same as before) --- */}
                {step === 1 && (
                    <div className="w-full p-8 space-y-6">
                        <div className="space-y-4">
                            <textarea name="address" placeholder="Address (House No, Street)" value={formData.address} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 p-4 text-white focus:border-[#D4AF37] outline-none rounded-sm h-24 resize-none" />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-[#D4AF37] outline-none rounded-sm" />
                                <input type="text" name="state" placeholder="State" value={formData.state} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-[#D4AF37] outline-none rounded-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" name="pinCode" placeholder="Pincode" value={formData.pinCode} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-[#D4AF37] outline-none rounded-sm" />
                                <input type="number" name="phoneNo" placeholder="Phone No" value={formData.phoneNo} onChange={handleInputChange} className="w-full bg-white/5 border border-white/10 p-3 text-white focus:border-[#D4AF37] outline-none rounded-sm" />
                            </div>
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button onClick={handleNextStep} className="w-full py-4 bg-white/10 text-white font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all flex items-center justify-center gap-2">Next <ArrowRight size={18}/></button>
                    </div>
                )}

                {/* --- STEP 2: MANUAL PAYMENT --- */}
                {step === 2 && (
                    <div className="w-full flex flex-col md:flex-row">
                        {/* Summary */}
                        <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-white/10 bg-[#050505]">
                            <h4 className="text-gray-400 text-sm uppercase tracking-widest mb-4">Total Amount</h4>
                            <div className="text-4xl text-[#D4AF37] font-serif mb-6">₹{finalTotal.toLocaleString()}</div>
                            
                            <div className="bg-white/5 p-4 rounded text-sm text-gray-300">
                                <p className="text-white font-bold">{user?.name}</p>
                                <p>{formData.address}, {formData.city}</p>
                                <p className="text-gray-500 mt-1">{formData.phoneNo}</p>
                                <button onClick={() => setStep(1)} className="text-xs text-[#D4AF37] underline mt-2">Change Address</button>
                            </div>
                        </div>

                        {/* Payment Options */}
                        <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
                            <div className="space-y-4">
                                {/* Option 1: UPI Manual */}
                                <label className={`block p-4 border rounded cursor-pointer transition-all ${paymentMethod === 'upi_manual' ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10 hover:border-white/30'}`} onClick={() => setPaymentMethod('upi_manual')}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'upi_manual' ? 'border-[#D4AF37]' : 'border-gray-500'}`}>
                                            {paymentMethod === 'upi_manual' && <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                                        </div>
                                        <span className="text-white font-bold text-sm flex items-center gap-2"><QrCode size={16}/> Direct UPI (Scan & Pay)</span>
                                    </div>
                                    
                                    {paymentMethod === 'upi_manual' && (
                                        <div className="mt-4 pl-7">
                                            {/* 🔥 APNA QR CODE KA IMAGE YAHAN LAGAO */}
                                            <div className="bg-white p-2 w-32 h-32 mb-4">
                                                <img src="/qr-code.png" alt="Scan to Pay" className="w-full h-full object-contain" />
                                            </div>
                                            <p className="text-xs text-gray-400 mb-2">1. Scan QR & Pay <b>₹{finalTotal}</b></p>
                                            <p className="text-xs text-gray-400 mb-2">2. Enter Transaction ID / UTR below:</p>
                                            <input 
                                                type="text" 
                                                placeholder="Example: 405819XXXXXX" 
                                                value={transactionId}
                                                onChange={(e) => setTransactionId(e.target.value)}
                                                className="w-full bg-black border border-white/20 p-2 text-white text-xs focus:border-[#D4AF37] outline-none rounded"
                                            />
                                        </div>
                                    )}
                                </label>

                                {/* Option 2: COD */}
                                <label className={`flex items-center gap-4 p-4 border rounded cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10 hover:border-white/30'}`} onClick={() => setPaymentMethod('cod')}>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'cod' ? 'border-[#D4AF37]' : 'border-gray-500'}`}>
                                        {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 text-white font-bold text-sm">Cash on Delivery <Banknote size={16} className="text-gray-400"/></div>
                                        <p className="text-xs text-gray-500 mt-1">Extra fee ₹{COD_FEE} added</p>
                                    </div>
                                </label>
                            </div>

                            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

                            <button onClick={handlePlaceOrder} className="mt-6 w-full py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all rounded-sm shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                                {paymentMethod === 'upi_manual' ? `Confirm Payment` : `Place Order`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CheckoutModal;