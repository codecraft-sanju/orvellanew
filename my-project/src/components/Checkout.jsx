import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CreditCard, Banknote, ArrowRight, MapPin, Phone, User } from "lucide-react";
import { useShop } from "./ShopContext"; 
import { useNavigate } from "react-router-dom";

const CheckoutModal = ({ cart, subtotal, onClose }) => {
  const { processOrder, user } = useShop(); 
  const navigate = useNavigate();

  // --- STEPS STATE (1: Address, 2: Payment) ---
  const [step, setStep] = useState(1); 

  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    state: "",
    pinCode: "",
    phoneNo: user?.phone || "", // Agar user profile me phone hai toh auto-fill
  });

  const [paymentMethod, setPaymentMethod] = useState('online');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  
  const COD_FEE = 50;
  const finalTotal = paymentMethod === 'cod' ? subtotal + COD_FEE : subtotal;

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error on typing
  };

  const handleNextStep = () => {
    // Basic Validation
    if (!formData.address || !formData.city || !formData.state || !formData.pinCode || !formData.phoneNo) {
        setError("Please fill in all shipping details.");
        return;
    }
    if (formData.phoneNo.length < 10) {
        setError("Please enter a valid phone number.");
        return;
    }
    setStep(2); // Go to Payment
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    // 🔥 Form Data Prepare Karo
    const shippingInfo = {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: "India", 
        pinCode: formData.pinCode,
        phoneNo: formData.phoneNo,
    };

    // Context function call karo (Address ke saath)
    await processOrder(paymentMethod, shippingInfo, navigate);
    
    // Loader band karo (Agar error aaya toh)
    setTimeout(() => {
       setIsProcessing(false);
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
        className="relative z-10 bg-[#0a0a0a] border border-[#D4AF37]/30 w-full max-w-2xl rounded-sm overflow-hidden flex flex-col shadow-[0_0_80px_rgba(212,175,55,0.2)]"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-[#050505]">
            <h3 className="text-[#D4AF37] font-serif text-xl tracking-wide">
                {step === 1 ? "Shipping Details" : "Payment Method"}
            </h3>
            <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20}/></button>
        </div>

        {isProcessing ? (
             <div className="w-full h-[400px] flex flex-col items-center justify-center p-12 text-center">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mb-6"
                >
                    <Loader2 size={64} className="text-[#D4AF37]" />
                </motion.div>
                <h3 className="text-2xl font-serif text-white mb-2">Processing Securely</h3>
                <p className="text-gray-400 text-sm tracking-widest uppercase">Do not close this window</p>
             </div>
        ) : (
            <div className="flex flex-col md:flex-row">
                
                {/* --- STEP 1: ADDRESS FORM --- */}
                {step === 1 && (
                    <div className="w-full p-8 space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            {/* Address Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={14}/> Street Address
                                </label>
                                <textarea 
                                    name="address"
                                    placeholder="House No, Building, Street Area"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-[#D4AF37] transition-colors rounded-sm h-24 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">City</label>
                                    <input 
                                        type="text" name="city" placeholder="Mumbai"
                                        value={formData.city} onChange={handleInputChange}
                                        className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors rounded-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">State</label>
                                    <input 
                                        type="text" name="state" placeholder="Maharashtra"
                                        value={formData.state} onChange={handleInputChange}
                                        className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors rounded-sm"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pincode</label>
                                    <input 
                                        type="number" name="pinCode" placeholder="400001"
                                        value={formData.pinCode} onChange={handleInputChange}
                                        className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors rounded-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Phone size={14}/> Phone
                                    </label>
                                    <input 
                                        type="number" name="phoneNo" placeholder="9876543210"
                                        value={formData.phoneNo} onChange={handleInputChange}
                                        className="w-full bg-white/5 border border-white/10 p-3 text-white focus:outline-none focus:border-[#D4AF37] transition-colors rounded-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <button 
                            onClick={handleNextStep}
                            className="w-full py-4 bg-white/10 text-white font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            Proceed to Payment <ArrowRight size={18}/>
                        </button>
                    </div>
                )}

                {/* --- STEP 2: PAYMENT & SUMMARY --- */}
                {step === 2 && (
                    <>
                        {/* Order Summary (Left/Top) */}
                        <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-white/10 bg-[#050505]">
                            <h4 className="text-gray-400 text-sm uppercase tracking-widest mb-4">Delivery To:</h4>
                            <div className="bg-white/5 p-4 rounded mb-6 text-sm text-gray-300">
                                <p className="text-white font-bold mb-1">{user?.name}</p>
                                <p>{formData.address}</p>
                                <p>{formData.city}, {formData.state} - {formData.pinCode}</p>
                                <p className="mt-2 text-[#D4AF37] flex items-center gap-2"><Phone size={12}/> {formData.phoneNo}</p>
                                <button onClick={() => setStep(1)} className="text-xs text-gray-500 underline mt-2 hover:text-white">Edit Address</button>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Shipping</span>
                                    <span className="text-green-500">FREE</span>
                                </div>
                                {paymentMethod === 'cod' && (
                                     <div className="flex justify-between text-[#D4AF37]">
                                        <span>COD Fee</span>
                                        <span>+₹{COD_FEE}</span>
                                     </div>
                                )}
                                <div className="flex justify-between text-white text-lg font-bold border-t border-white/10 pt-4 mt-2">
                                    <span>Total</span>
                                    <span>₹{finalTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Options (Right/Bottom) */}
                        <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
                            <div className="space-y-4">
                                <label 
                                    className={`flex items-center gap-4 p-4 border rounded cursor-pointer transition-all duration-300 ${
                                        paymentMethod === 'online' ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10 hover:border-white/30'
                                    }`}
                                    onClick={() => setPaymentMethod('online')}
                                >
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'online' ? 'border-[#D4AF37]' : 'border-gray-500'}`}>
                                        {paymentMethod === 'online' && <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 text-white font-bold text-sm">Online Payment <CreditCard size={16} className="text-gray-400"/></div>
                                        <p className="text-xs text-gray-500 mt-1">UPI, Cards, Netbanking</p>
                                    </div>
                                </label>

                                <label 
                                    className={`flex items-center gap-4 p-4 border rounded cursor-pointer transition-all duration-300 ${
                                        paymentMethod === 'cod' ? 'border-[#D4AF37] bg-[#D4AF37]/10' : 'border-white/10 hover:border-white/30'
                                    }`}
                                    onClick={() => setPaymentMethod('cod')}
                                >
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'cod' ? 'border-[#D4AF37]' : 'border-gray-500'}`}>
                                        {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 text-white font-bold text-sm">Cash on Delivery <Banknote size={16} className="text-gray-400"/></div>
                                        <p className="text-xs text-gray-500 mt-1">Pay cash upon arrival (+₹50)</p>
                                    </div>
                                </label>
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
            </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CheckoutModal;