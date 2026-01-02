import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import io from 'socket.io-client';
import { 
  LayoutDashboard, ShoppingBag, Users, Package, Search, 
  CheckCircle, X, Edit, Trash2, DollarSign, LogOut, 
  Loader2, Banknote, QrCode, ChevronRight,
  TrendingUp, Menu, Save, Shield, Plus 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer 
} from 'recharts';

// --- API CONFIGURATION ---
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api/v1`; 
const socket = io(BACKEND_URL); 

// --- UTILITY COMPONENTS ---
const NoiseOverlay = () => (
  <div className="fixed inset-0 z-[0] pointer-events-none opacity-[0.03] mix-blend-overlay">
    <svg className="w-full h-full">
      <filter id="noiseFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noiseFilter)" />
    </svg>
  </div>
);

const StatCard = ({ title, value, subValue, icon: Icon, color }) => (
    <div className="min-w-[160px] md:min-w-[200px] bg-[#121212] border border-white/5 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden snap-center shrink-0">
        <div className={`absolute -right-2 -top-2 opacity-10 ${color}`}>
            <Icon size={60} />
        </div>
        <div className="flex items-center gap-2 mb-3">
            <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
                <Icon size={16} />
            </div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{title}</span>
        </div>
        <div>
            <h3 className="text-xl font-serif text-white">{value}</h3>
            {subValue && <p className="text-[10px] text-gray-500 mt-1">{subValue}</p>}
        </div>
    </div>
);

const PaymentBadge = ({ method, status, id }) => {
    const isCOD = id === 'cod';
    const isManualUPI = !isCOD && !id.startsWith('pay_');

    if (isCOD) {
        return (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold uppercase">
                <Banknote size={10} /> COD
            </span>
        );
    }
    if (isManualUPI) {
        return (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold uppercase">
                <QrCode size={10} /> UPI Check
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase">
            Paid
        </span>
    );
};

// --- MAIN COMPONENT ---
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); 
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]); 
  const [customers, setCustomers] = useState([]);
  
  // Action/Loading States
  const [actionLoading, setActionLoading] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // UI Interaction States
  const [showOrderSheet, setShowOrderSheet] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false); // Used for Add & Edit
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false); // New State to track mode

  // Product Form State
  const [productForm, setProductForm] = useState({
    _id: null,
    name: "Orvella The Golden Root", 
    price: "120",
    description: "Crafted with a secret chemical formula for the elite. A scent that doesn't just linger, it commands attention.",
    longDescription: "", // ADDED: New field for detailed description
    stock: 100,
    imageUrl: "/orvella.jpeg",
    category: "Luxury"
  });

  // --- DATA FETCHING ---
  const fetchData = async () => {
    try {
      const { data: orderData } = await axios.get(`${API_URL}/admin/orders`, { withCredentials: true });
      setOrders(orderData.orders);
      const { data: productData } = await axios.get(`${API_URL}/products`);
      setProducts(productData.products);
      const { data: userData } = await axios.get(`${API_URL}/admin/users`, { withCredentials: true });
      setCustomers(userData.users);
      setLoading(false);
    } catch (error) { console.error(error); setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    socket.on("new_order_notification", () => {
        showNotification("New Order Received!");
        fetchData(); 
    });
    return () => socket.off("new_order_notification");
  }, []);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- STATS LOGIC ---
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((acc, o) => acc + o.totalPrice, 0);
    const codOrders = orders.filter(o => o.paymentInfo?.id === 'cod'); 
    return { 
        totalRevenue, 
        pendingCod: codOrders.filter(o => o.orderStatus !== 'Delivered').reduce((acc, o) => acc + o.totalPrice, 0),
        codCount: codOrders.length 
    };
  }, [orders]);

  const chartData = useMemo(() => {
    if(orders.length === 0) return [{ name: 'Mon', sales: 0 }];
    return orders.slice(-7).map(o => ({
        name: new Date(o.createdAt).toLocaleDateString('en-US', { weekday: 'short' }),
        sales: o.totalPrice
    }));
  }, [orders]);

  // --- ORDER ACTIONS ---
  const cycleStatus = async (id, currentStatus, e) => {
    e?.stopPropagation();
    setActionLoading({ id, type: 'status' });
    const statuses = ["Pending", "Shipped", "Delivered", "Cancelled"];
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
    
    try {
        await axios.put(`${API_URL}/admin/order/${id}`, { status: nextStatus }, { withCredentials: true });
        setOrders(orders.map(o => o._id === id ? { ...o, orderStatus: nextStatus } : o));
        if(showOrderSheet?._id === id) setShowOrderSheet(prev => ({...prev, orderStatus: nextStatus})); 
        showNotification(`Order: ${nextStatus}`);
    } catch (e) { showNotification("Failed"); } 
    finally { setActionLoading(null); }
  };

  const deleteOrder = async (id) => {
    if(!window.confirm("Delete order?")) return;
    setActionLoading({ id, type: 'delete' });
    try {
        await axios.delete(`${API_URL}/admin/order/${id}`, { withCredentials: true });
        setOrders(orders.filter(o => o._id !== id));
        setShowOrderSheet(null);
        showNotification("Deleted");
    } catch (e) { showNotification("Failed"); } 
    finally { setActionLoading(null); }
  };

  // --- USER ROLE MANAGEMENT ---
  const toggleUserRole = async (user) => {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      if(!window.confirm(`Are you sure you want to change ${user.name}'s role to ${newRole.toUpperCase()}?`)) return;
      
      setActionLoading({ id: user._id, type: 'role' });
      try {
          await axios.put(`${API_URL}/admin/user/${user._id}`, { role: newRole }, { headers: { "Content-Type": "application/json" }, withCredentials: true });
          setCustomers(customers.map(u => u._id === user._id ? { ...u, role: newRole } : u));
          showNotification(`User is now ${newRole.toUpperCase()}`);
      } catch (error) { showNotification("Failed to update role"); }
      finally { setActionLoading(null); }
  };

  // --- PRODUCT MANAGEMENT (EDIT & CREATE) ---
  const openEditModal = () => {
    if (products.length === 0) return;
    const currentProduct = products[0]; 
    setIsEditingMode(true);
    setProductForm({
        _id: currentProduct._id,
        name: currentProduct.name,
        price: currentProduct.price,
        description: currentProduct.description,
        longDescription: currentProduct.longDescription || currentProduct.description, // UPDATED: Fallback logic
        stock: currentProduct.stock,
        imageUrl: currentProduct.images?.[0]?.url || "",
        category: currentProduct.category || "Luxury"
    });
    setShowEditModal(true);
  };

  const openAddModal = () => {
    setIsEditingMode(false);
    setProductForm({
        _id: null,
        name: "Orvella The Golden Root",
        price: "120",
        description: "Crafted with a secret chemical formula for the elite.",
        longDescription: "Here you can write the detailed story about the perfume...", // UPDATED: Default value
        stock: 100,
        imageUrl: "/orvella.jpeg",
        category: "Luxury"
    });
    setShowEditModal(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Prepare image object structure
    const imagePayload = { public_id: "img_" + Date.now(), url: productForm.imageUrl };

    // Prepare payload object
    const productDataPayload = {
        name: productForm.name,
        price: productForm.price,
        description: productForm.description,
        longDescription: productForm.longDescription, // UPDATED: Included in payload
        stock: productForm.stock,
        category: productForm.category,
        images: [imagePayload]
    };

    try {
        if (isEditingMode && productForm._id) {
            // --- UPDATE EXISTING PRODUCT ---
            const { data } = await axios.put(`${API_URL}/admin/product/${productForm._id}`, productDataPayload, {
                headers: { "Content-Type": "application/json" }, withCredentials: true
            });
            setProducts([data.product]); // Assuming single product logic for now
            showNotification("Product Updated!");
        } else {
            // --- CREATE NEW PRODUCT ---
            const { data } = await axios.post(`${API_URL}/admin/product/new`, productDataPayload, {
                headers: { "Content-Type": "application/json" }, withCredentials: true
            });
            
            setProducts([data.product]); // Update state
            showNotification("Product Created!");
        }
        setShowEditModal(false);
    } catch (error) { 
        console.error(error);
        showNotification(isEditingMode ? "Update Failed" : "Creation Failed"); 
    } 
    finally { setIsSubmitting(false); }
  };

  // --- FILTERING ---
  const filteredOrders = orders.filter(o => {
    const match = (o.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || o._id.includes(searchQuery);
    if (!match) return false;
    if (filterStatus === 'COD') return o.paymentInfo?.id === 'cod'; 
    if (filterStatus === 'Online') return o.paymentInfo?.id !== 'cod';
    if (filterStatus === 'Pending') return o.orderStatus === 'Pending';
    return true;
  });

  if (loading) return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center text-[#D4AF37]">
          <Loader2 className="animate-spin" size={32} />
          <p className="mt-4 text-[10px] tracking-[0.2em] uppercase">Loading Admin...</p>
      </div>
  );

  const masterProduct = products.length > 0 ? products[0] : null;

  return (
    <div className="h-screen bg-[#050505] text-[#E0E0E0] font-sans overflow-hidden flex flex-col selection:bg-[#D4AF37] selection:text-black">
      <NoiseOverlay />

      {/* --- MOBILE HEADER --- */}
      <header className="h-16 flex items-center justify-between px-4 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-[#D4AF37] rounded flex items-center justify-center text-black font-serif font-bold text-lg">O</div>
             <div>
                 <h1 className="font-serif text-lg text-white leading-none">ORVELLA</h1>
                 <p className="text-[9px] text-gray-500 tracking-widest uppercase">Admin Console</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="w-9 h-9 rounded-full bg-[#121212] border border-white/10 flex items-center justify-center text-[#D4AF37]">
                  <Menu size={18} />
              </button>
          </div>
      </header>

      {/* --- MOBILE MENU OVERLAY --- */}
      <AnimatePresence>
        {showMobileMenu && (
            <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="absolute top-16 right-4 z-50 bg-[#121212] border border-[#D4AF37]/20 rounded-xl p-4 shadow-2xl w-48">
                <Link to="/" className="flex items-center gap-3 text-red-400 hover:bg-white/5 p-2 rounded transition-colors text-sm">
                    <LogOut size={16}/> Logout
                </Link>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- NOTIFICATION TOAST --- */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ opacity: 0 }} className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] bg-[#D4AF37] text-black px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 text-xs">
            <CheckCircle size={14} /> {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN SCROLLABLE CONTENT --- */}
      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        
        {/* VIEW: DASHBOARD */}
        {activeTab === 'dashboard' && (
            <div className="p-4 space-y-6">
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
                    <StatCard title="Total Sales" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} color="text-[#D4AF37]" />
                    <StatCard title="Pending COD" value={`₹${stats.pendingCod.toLocaleString()}`} icon={Banknote} color="text-orange-400" />
                    <StatCard title="Total Orders" value={orders.length} icon={ShoppingBag} color="text-purple-400" />
                </div>

                <div className="bg-[#121212] border border-white/5 p-4 rounded-xl">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-[#D4AF37]"/> Sales Trend</h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/><stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} itemStyle={{ color: '#D4AF37' }} />
                                <Area type="monotone" dataKey="sales" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 px-1">Recent Activity</h3>
                    <div className="space-y-3">
                        {orders.length > 0 ? orders.slice(0, 5).map(order => (
                            <div key={order._id} onClick={() => setShowOrderSheet(order)} className="bg-[#121212] border border-white/5 p-3 rounded-xl flex items-center justify-between active:scale-[0.98] transition-transform">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                                        <ShoppingBag size={18}/>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{order.user?.name || "Guest"}</p>
                                        <p className="text-[10px] text-gray-500">#{order._id.slice(-6)} • {new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[#D4AF37] font-serif">₹{order.totalPrice}</p>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${order.orderStatus === 'Delivered' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>{order.orderStatus}</span>
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-xs text-center py-4">No recent orders.</p>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* VIEW: ORDERS */}
        {activeTab === 'orders' && (
            <div className="p-4 space-y-4">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Search by Name or ID..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white focus:border-[#D4AF37] outline-none"
                    />
                    <Search className="absolute left-3 top-3.5 text-gray-500" size={16} />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {['All', 'Pending', 'COD', 'Online'].map(f => (
                        <button 
                            key={f} 
                            onClick={() => setFilterStatus(f)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${filterStatus === f ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-transparent border-white/10 text-gray-400'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <div className="space-y-3 pb-20">
                    {filteredOrders.length > 0 ? filteredOrders.map(order => (
                        <div key={order._id} onClick={() => setShowOrderSheet(order)} className="bg-[#121212] border border-white/5 p-4 rounded-xl shadow-lg relative overflow-hidden active:bg-white/5 transition-colors">
                             <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-[#D4AF37]">#{order._id.slice(-6)}</span>
                                        <PaymentBadge id={order.paymentInfo?.id} status={order.paymentInfo?.status} />
                                    </div>
                                    <h4 className="text-white font-bold">{order.user?.name || "Guest"}</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-serif text-white">₹{order.totalPrice}</p>
                                    <p className="text-[10px] text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                             </div>
                             
                             <div className="flex items-center justify-between border-t border-white/10 pt-3">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${order.orderStatus === 'Delivered' ? 'bg-green-500' : order.orderStatus === 'Cancelled' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                    <span className="text-xs text-gray-300 font-medium">{order.orderStatus}</span>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    Details <ChevronRight size={12} />
                                </div>
                             </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-gray-500 text-sm">No orders found.</div>
                    )}
                </div>
            </div>
        )}

        {/* VIEW: INVENTORY - Modified to support Add Product */}
        {activeTab === 'inventory' && (
            <div className="p-4 flex flex-col h-full justify-center">
                 {masterProduct ? (
                     <div className="bg-[#121212] border border-[#D4AF37]/30 rounded-2xl overflow-hidden shadow-2xl">
                         <div className="aspect-square bg-[#050505] relative flex items-center justify-center p-6">
                            <img src={masterProduct.images[0]?.url} className="w-full h-full object-contain drop-shadow-xl" />
                            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white text-xs px-2 py-1 rounded border border-white/10">
                                Stock: {masterProduct.stock}
                            </div>
                         </div>
                         <div className="p-5">
                            <h2 className="text-xl font-serif text-white">{masterProduct.name}</h2>
                            <p className="text-[#D4AF37] font-serif text-lg mt-1 mb-4">₹{masterProduct.price}</p>
                            <button 
                                onClick={openEditModal}
                                className="w-full py-3 bg-[#D4AF37] text-black font-bold rounded-xl flex items-center justify-center gap-2 text-sm uppercase tracking-wide hover:bg-white transition-colors"
                            >
                                <Edit size={16}/> Edit Product
                            </button>
                         </div>
                     </div>
                 ) : (
                    <div className="text-center text-gray-500 flex flex-col items-center">
                        <Package size={48} className="mb-4 opacity-20"/>
                        <p className="mb-6">No Product Found in Database</p>
                        <button 
                            onClick={openAddModal}
                            className="px-6 py-3 bg-[#D4AF37] text-black font-bold rounded-xl flex items-center gap-2 uppercase tracking-wider"
                        >
                            <Plus size={18}/> Add First Product
                        </button>
                    </div>
                 )}
            </div>
        )}

        {/* VIEW: CUSTOMERS */}
        {activeTab === 'customers' && (
            <div className="p-4 space-y-3">
                {customers.map(u => (
                    <div key={u._id} className="bg-[#121212] border border-white/5 p-4 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-black ${u.role === 'admin' ? 'bg-purple-500' : 'bg-[#D4AF37]'}`}>
                                {u.name[0]}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-white font-bold text-sm flex items-center gap-2">
                                    {u.name}
                                    {u.role === 'admin' && <Shield size={12} className="text-purple-400" fill="currentColor"/>}
                                </p>
                                <p className="text-gray-500 text-xs truncate">{u.email}</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => toggleUserRole(u)}
                            disabled={actionLoading?.id === u._id}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-colors ${
                                u.role === 'admin' 
                                ? 'border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20' 
                                : 'border-purple-500/30 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20'
                            }`}
                        >
                            {actionLoading?.id === u._id && actionLoading?.type === 'role' ? <Loader2 className="animate-spin" size={12}/> : (
                                u.role === 'admin' ? 'Demote' : 'Promote'
                            )}
                        </button>
                    </div>
                ))}
            </div>
        )}

      </main>

      {/* --- BOTTOM NAVIGATION BAR (MOBILE) --- */}
      <nav className="h-[70px] bg-[#0a0a0a]/90 backdrop-blur-md border-t border-white/5 fixed bottom-0 left-0 w-full z-30 flex items-center justify-around px-2 pb-2">
        {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
            { id: 'orders', icon: ShoppingBag, label: 'Orders', badge: orders.filter(o => o.orderStatus === 'Pending').length },
            { id: 'inventory', icon: Package, label: 'Products' },
            { id: 'customers', icon: Users, label: 'Clients' }
        ].map(item => (
            <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id)} 
                className={`flex flex-col items-center justify-center w-16 h-full transition-all relative ${activeTab === item.id ? 'text-[#D4AF37]' : 'text-gray-500'}`}
            >
                {item.badge > 0 && (
                    <span className="absolute top-3 right-3 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-black z-10">
                        {item.badge}
                    </span>
                )}
                <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} className="mb-1" />
                <span className="text-[9px] font-medium tracking-wide">{item.label}</span>
                {activeTab === item.id && <motion.div layoutId="nav-indicator" className="absolute top-0 w-8 h-0.5 bg-[#D4AF37] rounded-b-full" />}
            </button>
        ))}
      </nav>

      {/* --- ORDER DETAILS SHEET --- */}
      <AnimatePresence>
        {showOrderSheet && (
            <>
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowOrderSheet(null)} className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm" />
                <motion.div 
                    initial={{y: "100%"}} animate={{y: 0}} exit={{y: "100%"}} transition={{type: "spring", damping: 25, stiffness: 200}}
                    className="fixed bottom-0 left-0 w-full bg-[#121212] border-t border-[#D4AF37]/30 rounded-t-3xl z-50 h-[85vh] flex flex-col shadow-2xl"
                >
                    <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#121212] rounded-t-3xl sticky top-0 z-10">
                        <div>
                            <span className="text-[#D4AF37] text-xs font-mono">ORDER #{showOrderSheet._id.slice(-6)}</span>
                            <h2 className="text-xl font-serif text-white">Order Details</h2>
                        </div>
                        <button onClick={() => setShowOrderSheet(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"><X size={18}/></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="bg-[#050505] p-4 rounded-xl border border-white/10">
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-400 text-xs uppercase font-bold">Current Status</span>
                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${showOrderSheet.orderStatus === 'Delivered' ? 'text-green-500 bg-green-500/10' : 'text-yellow-500 bg-yellow-500/10'}`}>{showOrderSheet.orderStatus}</span>
                             </div>
                             <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
                                {['Pending', 'Shipped', 'Delivered'].map((step, i) => {
                                    const currentIdx = ['Pending', 'Shipped', 'Delivered'].indexOf(showOrderSheet.orderStatus);
                                    const stepIdx = ['Pending', 'Shipped', 'Delivered'].indexOf(step);
                                    return (
                                        <div key={step} className={`flex-1 h-1 rounded-full ${stepIdx <= currentIdx ? 'bg-[#D4AF37]' : 'bg-white/10'}`} />
                                    )
                                })}
                             </div>
                        </div>

                        <div>
                            <h4 className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-2"><Users size={12}/> Customer</h4>
                            <div className="bg-[#050505] p-4 rounded-xl border border-white/10">
                                <p className="text-white font-bold">{showOrderSheet.shippingInfo?.address}</p>
                                <p className="text-gray-400 text-xs mt-1">{showOrderSheet.shippingInfo?.city}, {showOrderSheet.shippingInfo?.state} - {showOrderSheet.shippingInfo?.pinCode}</p>
                                <p className="text-[#D4AF37] text-xs mt-2 font-mono">{showOrderSheet.shippingInfo?.phoneNo}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-2 flex items-center gap-2"><Package size={12}/> Items</h4>
                            <div className="space-y-2">
                                {showOrderSheet.orderItems.map((item, i) => (
                                    <div key={i} className="flex gap-3 bg-[#050505] p-3 rounded-xl border border-white/5">
                                        <img src={item.image} className="w-12 h-12 rounded object-cover bg-white/5" />
                                        <div className="flex-1">
                                            <p className="text-white text-sm font-medium line-clamp-1">{item.name}</p>
                                            <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="text-white font-serif">₹{item.price * item.quantity}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center mt-4 border-t border-white/10 pt-4">
                                <span className="text-gray-400 text-sm">Total Amount</span>
                                <span className="text-xl font-serif text-[#D4AF37]">₹{showOrderSheet.totalPrice}</span>
                            </div>
                        </div>

                         <div className="bg-[#1a1a1a] p-4 rounded-xl border border-[#D4AF37]/20">
                            <h4 className="text-[#D4AF37] text-xs font-bold uppercase mb-2">Payment Details</h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <p className="text-gray-500">Method</p>
                                    <p className="text-white font-bold capitalize">{showOrderSheet.paymentInfo?.id === 'cod' ? 'Cash on Delivery' : 'Online / UPI'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Status</p>
                                    <p className={showOrderSheet.paymentInfo?.status === 'succeeded' ? 'text-green-500 font-bold' : 'text-orange-500 font-bold'}>
                                        {showOrderSheet.paymentInfo?.status === 'succeeded' ? 'Paid' : 'Pending'}
                                    </p>
                                </div>
                                {showOrderSheet.paymentInfo?.id !== 'cod' && (
                                    <div className="col-span-2 bg-black p-2 rounded border border-white/10 mt-1">
                                        <p className="text-gray-600 text-[10px] uppercase">Transaction ID (UTR)</p>
                                        <p className="text-white font-mono select-all">{showOrderSheet.paymentInfo?.id}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="h-20" />
                    </div>

                    <div className="absolute bottom-0 left-0 w-full bg-[#121212] border-t border-white/10 p-4 flex gap-3 pb-8">
                        <button 
                            onClick={() => deleteOrder(showOrderSheet._id)}
                            className="flex-1 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-colors"
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                        <button 
                            onClick={(e) => cycleStatus(showOrderSheet._id, showOrderSheet.orderStatus, e)}
                            className="flex-[2] py-3 bg-[#D4AF37] text-black font-bold rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-colors shadow-lg shadow-[#D4AF37]/20"
                        >
                            {actionLoading?.id === showOrderSheet._id ? <Loader2 className="animate-spin" size={16}/> : (
                                <>{showOrderSheet.orderStatus === 'Delivered' ? 'Completed' : 'Update Status'} <ChevronRight size={16}/></>
                            )}
                        </button>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* --- ADD / EDIT PRODUCT MODAL --- */}
      <AnimatePresence>
        {showEditModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
                <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-[#121212] border border-[#D4AF37]/50 w-full max-w-lg rounded-2xl p-6 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto">
                    <h2 className="text-xl font-serif text-[#D4AF37] mb-6 flex items-center gap-2">
                        {isEditingMode ? <><Edit size={20}/> Edit Product</> : <><Plus size={20}/> Add New Product</>}
                    </h2>
                    <form onSubmit={handleProductSubmit} className="space-y-4">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Product Name</label>
                            <input type="text" placeholder="Name" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full bg-[#050505] border border-white/20 p-3 rounded-xl text-white focus:border-[#D4AF37] outline-none mt-1"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Price (₹)</label>
                                <input type="number" placeholder="Price" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full bg-[#050505] border border-white/20 p-3 rounded-xl text-white focus:border-[#D4AF37] outline-none mt-1"/>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Stock Qty</label>
                                <input type="number" placeholder="Stock" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} className="w-full bg-[#050505] border border-white/20 p-3 rounded-xl text-white focus:border-[#D4AF37] outline-none mt-1"/>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Image URL</label>
                            <input type="text" placeholder="Image URL (e.g., /orvella.jpeg)" value={productForm.imageUrl} onChange={e => setProductForm({...productForm, imageUrl: e.target.value})} className="w-full bg-[#050505] border border-white/20 p-3 rounded-xl text-white focus:border-[#D4AF37] outline-none text-xs mt-1"/>
                        </div>
                        
                        {/* UPDATED DESCRIPTION FIELDS */}
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Short Description (Hero Section)</label>
                            <textarea 
                                placeholder="Short intro for top banner..." 
                                value={productForm.description} 
                                onChange={e => setProductForm({...productForm, description: e.target.value})} 
                                className="w-full bg-[#050505] border border-white/20 p-3 rounded-xl text-white focus:border-[#D4AF37] outline-none h-24 resize-none mt-1"
                            />
                        </div>

                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-4 block">Long Description (Details Section)</label>
                            <textarea 
                                placeholder="Detailed story for the bottom section..." 
                                value={productForm.longDescription} 
                                onChange={e => setProductForm({...productForm, longDescription: e.target.value})} 
                                className="w-full bg-[#050505] border border-white/20 p-3 rounded-xl text-white focus:border-[#D4AF37] outline-none h-32 resize-none mt-1"
                            />
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 bg-white/5 text-gray-400 font-bold uppercase rounded-xl hover:bg-white/10 transition-colors">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#D4AF37] text-black font-bold uppercase py-3 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2">
                                {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <><Save size={16}/> {isEditingMode ? 'Save Changes' : 'Create Product'}</>}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
   
    </div>
  );
}