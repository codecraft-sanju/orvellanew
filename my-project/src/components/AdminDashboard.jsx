import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import io from 'socket.io-client';
import { 
  LayoutDashboard, ShoppingBag, Users, ArrowLeft, 
  TrendingUp, Package, Search, Bell, CheckCircle, Clock, X, 
  Save, Edit, Trash2, Calendar, Star, AlertTriangle, Menu,
  Filter, ChevronRight, DollarSign, LogOut, Loader2,
  CreditCard, Banknote, Truck, MapPin, QrCode
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

// --- API CONFIGURATION ---
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api/v1`; 
const socket = io(BACKEND_URL); 

// --- COMPONENTS ---

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

function StatCard({ title, value, subValue, icon: Icon, color, delay }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay * 0.1 }}
            className="bg-[#121212]/80 backdrop-blur-md border border-white/5 p-5 rounded-2xl relative overflow-hidden group hover:border-[#D4AF37]/30 transition-colors"
        >
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon size={80} />
            </div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-gray-500 text-[10px] md:text-xs uppercase tracking-wider font-bold">{title}</p>
                    <h3 className="text-2xl md:text-3xl font-serif text-white mt-2">{value}</h3>
                    {subValue && <p className="text-xs text-gray-400 mt-1 font-mono">{subValue}</p>}
                </div>
                <div className={`p-3 bg-white/5 rounded-xl ${color} shadow-lg shadow-black/50`}>
                    <Icon size={20}/>
                </div>
            </div>
        </motion.div>
    );
}

// 🔥 UPDATED PAYMENT BADGE FOR MANUAL UPI
const PaymentBadge = ({ method, status, id }) => {
    const isCOD = id === 'cod';
    const isPaid = status === 'succeeded';
    const isManualUPI = !isCOD && !id.startsWith('pay_'); // Agar Razorpay ID nahi hai aur COD nahi hai

    if (isCOD) {
        return (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold tracking-wider uppercase">
                <Banknote size={12} /> COD {isPaid ? '(Settled)' : '(Due)'}
            </span>
        );
    }
    
    if (isManualUPI) {
        return (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold tracking-wider uppercase">
                <QrCode size={12} /> UPI Verification Pending
            </span>
        );
    }

    return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold tracking-wider uppercase">
            <CreditCard size={12} /> Online (Paid)
        </span>
    );
};

// --- MAIN DASHBOARD ---
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); 
  const [notification, setNotification] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Action States
  const [actionLoading, setActionLoading] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data States
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]); 
  const [customers, setCustomers] = useState([]);
  
  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(null); 

  const navigate = useNavigate();

  // Single Product Form
  const [productForm, setProductForm] = useState({
    _id: null,
    name: "",
    price: "",
    description: "",
    category: "Signature Scent",
    stock: 0,
    imageUrl: "" 
  });

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      const { data: orderData } = await axios.get(`${API_URL}/admin/orders`, { withCredentials: true });
      setOrders(orderData.orders);

      const { data: productData } = await axios.get(`${API_URL}/products`);
      setProducts(productData.products);

      const { data: userData } = await axios.get(`${API_URL}/admin/users`, { withCredentials: true });
      setCustomers(userData.users);

      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
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

  // --- CALCULATED STATS ---
  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((acc, o) => acc + o.totalPrice, 0);
    const codOrders = orders.filter(o => o.paymentInfo?.id === 'cod'); 
    const pendingCodAmount = codOrders
        .filter(o => o.orderStatus !== 'Delivered') 
        .reduce((acc, o) => acc + o.totalPrice, 0);
    
    return { totalRevenue, pendingCodAmount, codCount: codOrders.length };
  }, [orders]);

  const chartData = useMemo(() => {
    if(orders.length === 0) return [{ name: 'Mon', sales: 0 }];
    const data = orders.reduce((acc, order) => {
        const date = new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
        const existing = acc.find(item => item.name === date);
        if (existing) existing.sales += order.totalPrice;
        else acc.push({ name: date, sales: order.totalPrice });
        return acc;
    }, []);
    return data.slice(-7); 
  }, [orders]);

  // --- PRODUCT LOGIC ---
  const initializeProduct = async () => {
    setIsSubmitting(true);
    const defaultData = {
        name: "Orvella The Golden Root",
        price: 5999, 
        description: "Crafted with a secret chemical formula for the elite.",
        category: "Signature Scent",
        stock: 50,
        images: [{ public_id: "init", url: "/orvella.jpeg" }]
    };
    try {
        await axios.post(`${API_URL}/admin/product/new`, defaultData, { 
            headers: { "Content-Type": "application/json" }, withCredentials: true 
        });
        showNotification("Orvella Product Initialized!");
        fetchData(); 
    } catch (error) { showNotification("Failed to initialize"); } 
    finally { setIsSubmitting(false); }
  };

  const openEditModal = () => {
      if (products.length === 0) return;
      const currentProduct = products[0]; 
      setProductForm({
          _id: currentProduct._id,
          name: currentProduct.name,
          price: currentProduct.price,
          description: currentProduct.description,
          category: currentProduct.category,
          stock: currentProduct.stock,
          imageUrl: currentProduct.images?.[0]?.url || ""
      });
      setShowEditModal(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        const updateData = {
            ...productForm,
            images: [{ public_id: "update_" + Date.now(), url: productForm.imageUrl }]
        };
        const { data } = await axios.put(`${API_URL}/admin/product/${productForm._id}`, updateData, {
            headers: { "Content-Type": "application/json" }, withCredentials: true
        });
        setProducts([data.product]); 
        showNotification("Product Updated Successfully!");
        setShowEditModal(false);
    } catch (error) { showNotification("Update Failed"); } 
    finally { setIsSubmitting(false); }
  };

  // --- ORDER ACTIONS ---
  const cycleStatus = async (id, currentStatus, e) => {
    e?.stopPropagation();
    if (actionLoading?.id === id) return;
    setActionLoading({ id, type: 'status' });
    const statuses = ["Pending", "Shipped", "Delivered", "Cancelled"];
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
    
    try {
        await axios.put(`${API_URL}/admin/order/${id}`, { status: nextStatus }, { withCredentials: true });
        setOrders(orders.map(o => o._id === id ? { ...o, orderStatus: nextStatus } : o));
        showNotification(`Order Marked: ${nextStatus}`);
    } catch (e) { showNotification("Failed to update"); } 
    finally { setActionLoading(null); }
  };

  const deleteOrder = async (id, e) => {
    e?.stopPropagation();
    if(!window.confirm("Delete this order?")) return;
    setActionLoading({ id, type: 'delete' });
    try {
        await axios.delete(`${API_URL}/admin/order/${id}`, { withCredentials: true });
        setOrders(orders.filter(o => o._id !== id));
        showNotification("Order deleted");
    } catch (e) { 
        showNotification("Failed delete"); 
        setActionLoading(null);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    if(!window.confirm(`Make user ${newRole}?`)) return;
    setActionLoading({ id: userId, type: 'role' });
    try {
        await axios.put(`${API_URL}/admin/user/${userId}`, { role: newRole }, { headers: { "Content-Type": "application/json" }, withCredentials: true });
        setCustomers(customers.map(u => u._id === userId ? { ...u, role: newRole } : u));
        showNotification("Role Updated");
    } catch (e) { showNotification("Failed update"); } 
    finally { setActionLoading(null); }
  };

  // --- FILTERED DATA ---
  const filteredOrders = orders.filter(o => {
    const matchesSearch = (o.user?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || o._id.includes(searchQuery);
    if (!matchesSearch) return false;
    if (filterStatus === 'All') return true;
    if (filterStatus === 'COD') return o.paymentInfo?.id === 'cod'; 
    if (filterStatus === 'Online') return o.paymentInfo?.id !== 'cod';
    if (filterStatus === 'Pending') return o.orderStatus === 'Pending';
    return true;
  });

  if (loading) return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#D4AF37]">
          <Loader2 className="animate-spin" size={40} />
          <p className="mt-4 text-xs tracking-widest uppercase">Syncing Dashboard...</p>
      </div>
  );

  const masterProduct = products.length > 0 ? products[0] : null;

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] flex font-sans selection:bg-[#D4AF37] selection:text-black overflow-hidden relative">
      <NoiseOverlay />

      <AnimatePresence>
        {notification && (
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ opacity: 0, y: -20 }} className="fixed top-0 left-1/2 -translate-x-1/2 z-[150] bg-[#D4AF37] text-black px-6 py-3 rounded-b-xl font-bold shadow-2xl flex items-center gap-2">
            <CheckCircle size={18} /> {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden" />
        )}
      </AnimatePresence>

      <aside className={`fixed md:relative z-50 w-[280px] h-full bg-[#0a0a0a] border-r border-white/5 flex flex-col transition-transform duration-300 shadow-2xl md:shadow-none ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-8 flex justify-between items-center border-b border-white/5">
             <div className="flex flex-col">
                <h1 className="text-2xl font-serif font-bold text-[#D4AF37] tracking-widest">ORVELLA</h1>
                <span className="text-[10px] text-gray-500 font-sans tracking-[0.4em] uppercase">Admin Console</span>
             </div>
             <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {[
                { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
                { id: 'orders', icon: ShoppingBag, label: 'Orders', badge: orders.filter(o => o.orderStatus === 'Pending').length },
                { id: 'inventory', icon: Package, label: 'Products' }, 
                { id: 'customers', icon: Users, label: 'Clients' },
            ].map(item => (
                <button 
                    key={item.id} 
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} 
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all duration-300 group ${activeTab === item.id ? "bg-[#D4AF37] text-black font-bold shadow-lg" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                >
                    <div className="flex items-center gap-3">
                        <item.icon size={20} className={activeTab === item.id ? "text-black" : "text-[#D4AF37]"} /> 
                        <span className="tracking-wide text-sm">{item.label}</span>
                    </div>
                    {item.badge > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === item.id ? "bg-black text-[#D4AF37]" : "bg-[#D4AF37] text-black"}`}>
                            {item.badge}
                        </span>
                    )}
                </button>
            ))}
        </nav>
        
        <div className="p-6 border-t border-white/5">
             <Link to="/" className="flex items-center gap-3 text-sm text-gray-500 hover:text-white transition-colors p-3 rounded-lg hover:bg-white/5">
                <LogOut size={18} /> Exit Console
             </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 md:px-10 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-white p-2 -ml-2"><Menu size={24} /></button>
                <h2 className="text-xl font-serif text-white capitalize tracking-wide hidden md:block">{activeTab === 'inventory' ? 'Product Management' : activeTab}</h2>
                <h2 className="text-lg font-serif text-[#D4AF37] md:hidden">ORVELLA</h2>
            </div>
            
            <div className="flex items-center gap-4">
                {activeTab === 'orders' && (
                    <div className="relative group hidden md:block">
                        <input type="text" placeholder="Search orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-[#121212] border border-white/10 rounded-full px-4 py-2 pl-10 text-sm focus:border-[#D4AF37] w-64 outline-none transition-all text-white placeholder:text-gray-600" />
                        <Search className="absolute left-3 top-2.5 text-gray-500 group-focus-within:text-[#D4AF37]" size={14} />
                    </div>
                )}
                <div className="w-10 h-10 rounded-full bg-[#121212] border border-white/10 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors">
                    <Bell size={18} />
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
            
            {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fade-in-up">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} subValue={`Includes ₹${stats.pendingCodAmount.toLocaleString()} Pending COD`} icon={DollarSign} color="text-[#D4AF37]" delay={1} />
                        <StatCard title="COD Orders" value={stats.codCount} subValue="Cash handling required" icon={Banknote} color="text-orange-400" delay={2} />
                        <StatCard title="Total Orders" value={orders.length} icon={ShoppingBag} color="text-purple-400" delay={3} />
                        <StatCard title="Active Clients" value={customers.length} icon={Users} color="text-blue-400" delay={4} />
                    </div>

                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="bg-[#121212]/50 border border-white/5 rounded-2xl p-6 md:p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><TrendingUp size={18} className="text-[#D4AF37]"/> Sales Trends</h3>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/><stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#D4AF37' }} />
                                    <Area type="monotone" dataKey="sales" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>
            )}

            {(activeTab === 'orders' || activeTab === 'dashboard') && activeTab !== 'dashboard' && (
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                             <h3 className="text-lg font-bold text-white">All Orders</h3>
                             <p className="text-xs text-gray-500">{filteredOrders.length} records found</p>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
                            {['All', 'COD', 'Online', 'Pending'].map(status => (
                                <button 
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border whitespace-nowrap ${filterStatus === status ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "bg-transparent border-white/10 text-gray-400 hover:text-white"}`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="hidden md:block bg-[#121212] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-[#1a1a1a] text-xs uppercase font-bold text-gray-300">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Payment</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Fulfillment</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredOrders.map(order => (
                                    <tr key={order._id} onClick={() => setShowOrderModal(order)} className="hover:bg-white/5 transition-colors cursor-pointer group">
                                        <td className="px-6 py-4 font-mono text-xs text-[#D4AF37] group-hover:underline">#{order._id.slice(-6)}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white">{order.user?.name || "Guest"}</div>
                                            <div className="text-xs text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <PaymentBadge method={order.paymentInfo?.id === 'cod' ? 'cod' : 'online'} status={order.paymentInfo?.status} id={order.paymentInfo?.id} />
                                        </td>
                                        <td className="px-6 py-4 text-white font-mono">₹{order.totalPrice}</td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={(e) => cycleStatus(order._id, order.orderStatus, e)} 
                                                disabled={actionLoading?.id === order._id}
                                                className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-2 w-max transition-all ${
                                                    order.orderStatus === 'Delivered' ? 'border-green-500/20 bg-green-500/10 text-green-500' : 
                                                    order.orderStatus === 'Cancelled' ? 'border-red-500/20 bg-red-500/10 text-red-500' :
                                                    'border-yellow-500/20 bg-yellow-500/10 text-yellow-500'
                                                }`}
                                            >
                                                {actionLoading?.id === order._id && actionLoading?.type === 'status' ? <Loader2 className="animate-spin" size={12} /> : 
                                                <><span className={`w-1.5 h-1.5 rounded-full ${order.orderStatus === 'Delivered' ? 'bg-green-500' : 'bg-yellow-500'}`}></span> {order.orderStatus}</>}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={(e) => deleteOrder(order._id, e)} disabled={actionLoading?.id === order._id} className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-lg">
                                                {actionLoading?.id === order._id && actionLoading?.type === 'delete' ? <Loader2 className="animate-spin text-red-500" size={16}/> : <Trash2 size={16}/>}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARD */}
                    <div className="md:hidden grid gap-4">
                        {filteredOrders.map(order => (
                            <motion.div 
                                key={order._id} 
                                onClick={() => setShowOrderModal(order)}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="bg-[#121212] border border-white/5 rounded-xl p-5 shadow-lg relative overflow-hidden active:scale-[0.98] transition-transform"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[#D4AF37] font-mono text-xs">#{order._id.slice(-6)}</span>
                                            <PaymentBadge method={order.paymentInfo?.id === 'cod' ? 'cod' : 'online'} status={order.paymentInfo?.status} id={order.paymentInfo?.id} />
                                        </div>
                                        <h4 className="text-white font-bold text-lg">{order.user?.name || "Guest"}</h4>
                                        <p className="text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-xl font-serif text-white">₹{order.totalPrice}</div>
                                </div>
                                
                                <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-2">
                                    <button 
                                        onClick={(e) => cycleStatus(order._id, order.orderStatus, e)}
                                        disabled={actionLoading?.id === order._id}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-2 min-w-[110px] justify-center ${
                                            order.orderStatus === 'Delivered' ? 'border-green-500/20 bg-green-500/10 text-green-500' : 
                                            order.orderStatus === 'Cancelled' ? 'border-red-500/20 bg-red-500/10 text-red-500' :
                                            'border-yellow-500/20 bg-yellow-500/10 text-yellow-500'
                                        }`}
                                    >
                                        {actionLoading?.id === order._id && actionLoading?.type === 'status' ? <Loader2 className="animate-spin" size={12} /> : <>{order.orderStatus} <Edit size={12} /></>}
                                    </button>
                                    <button onClick={(e) => deleteOrder(order._id, e)} className="text-gray-500 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    {filteredOrders.length === 0 && <div className="text-center py-10 text-gray-500">No orders found.</div>}
                </div>
            )}

            {activeTab === 'inventory' && (
                <div className="max-w-4xl mx-auto pb-10">
                    {!masterProduct ? (
                        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-white/10 rounded-2xl bg-[#121212]/50 text-center px-4">
                            <AlertTriangle size={32} className="text-[#D4AF37] mb-4" />
                            <h3 className="text-2xl text-white font-serif mb-2">Database Empty</h3>
                            <button onClick={initializeProduct} disabled={isSubmitting} className="bg-[#D4AF37] text-black font-bold px-8 py-3 rounded-lg hover:bg-white transition-all mt-4">
                                {isSubmitting ? "Initializing..." : "Initialize Master Product"}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-[#121212] border border-[#D4AF37]/30 rounded-2xl overflow-hidden shadow-2xl grid md:grid-cols-2">
                            <div className="bg-[#050505] p-8 flex items-center justify-center relative">
                                <img src={masterProduct.images[0]?.url} alt="Orvella" className="max-h-[300px] object-contain drop-shadow-xl" />
                            </div>
                            <div className="p-8 flex flex-col justify-center">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[#D4AF37] uppercase tracking-widest text-xs font-bold">Master Product</span>
                                    <span className="text-xs font-bold text-green-500 border border-green-500/30 px-2 py-1 rounded bg-green-500/5">{masterProduct.stock} UNITS</span>
                                </div>
                                <h2 className="text-3xl font-serif text-white mb-2">{masterProduct.name}</h2>
                                <p className="text-2xl text-[#D4AF37] font-serif mb-6">₹{masterProduct.price}</p>
                                <button onClick={openEditModal} className="w-full bg-[#D4AF37] text-black py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2">
                                    <Edit size={18} /> Edit Product
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'customers' && (
                <div className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-[#1a1a1a] text-xs uppercase font-bold text-gray-300">
                                <tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Joined</th></tr>
                            </thead>
                            <tbody>
                                {customers.map(u => (
                                    <tr key={u._id} className="border-t border-white/5 hover:bg-white/5">
                                        <td className="p-4 flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-[#D4AF37] text-black flex items-center justify-center font-bold">{u.name[0]}</div> {u.name}</td>
                                        <td className="p-4">{u.email}</td>
                                        <td className="p-4">
                                            <select value={u.role} onChange={(e) => updateUserRole(u._id, e.target.value)} className="bg-black border border-white/20 rounded px-2 py-1 text-xs outline-none focus:border-[#D4AF37]">
                                                <option value="user">USER</option><option value="admin">ADMIN</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-xs font-mono">{new Date(u.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>

        <AnimatePresence>
            {showEditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEditModal(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
                    <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-[#121212] border border-[#D4AF37]/50 w-full max-w-lg rounded-2xl p-6 relative z-10 shadow-2xl">
                        <h2 className="text-xl font-serif text-[#D4AF37] mb-6">Edit Master Product</h2>
                        <form onSubmit={handleUpdateSubmit} className="space-y-4">
                            <input type="text" placeholder="Name" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full bg-[#050505] border border-white/20 p-3 rounded text-white focus:border-[#D4AF37] outline-none"/>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" placeholder="Price" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full bg-[#050505] border border-white/20 p-3 rounded text-white focus:border-[#D4AF37] outline-none"/>
                                <input type="number" placeholder="Stock" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} className="w-full bg-[#050505] border border-white/20 p-3 rounded text-white focus:border-[#D4AF37] outline-none"/>
                            </div>
                            <input type="text" placeholder="Image URL" value={productForm.imageUrl} onChange={e => setProductForm({...productForm, imageUrl: e.target.value})} className="w-full bg-[#050505] border border-white/20 p-3 rounded text-white focus:border-[#D4AF37] outline-none text-xs"/>
                            <textarea placeholder="Description" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="w-full bg-[#050505] border border-white/20 p-3 rounded text-white focus:border-[#D4AF37] outline-none h-24 resize-none"/>
                            <button type="submit" disabled={isSubmitting} className="w-full bg-[#D4AF37] text-black font-bold uppercase py-3 rounded hover:bg-white transition-colors">
                                {isSubmitting ? "Saving..." : "Save Updates"}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* --- ORDER DETAILS MODAL (MANUAL UPI OPTIMIZED) --- */}
        <AnimatePresence>
            {showOrderModal && (
                <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center sm:p-4">
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowOrderModal(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
                     <motion.div 
                        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} 
                        className="bg-[#121212] border-t md:border border-[#D4AF37]/30 w-full max-w-2xl md:rounded-2xl rounded-t-2xl p-6 md:p-8 relative z-10 shadow-2xl max-h-[85vh] overflow-y-auto"
                     >
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                            <div>
                                <span className="text-[#D4AF37] font-mono text-xs block">ORDER #{showOrderModal._id}</span>
                                <h2 className="text-2xl font-serif text-white mt-1">Order Details</h2>
                            </div>
                            <button onClick={() => setShowOrderModal(null)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 text-white"><X size={20}/></button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-3 flex items-center gap-2"><MapPin size={14}/> Shipping Address</h4>
                                    <div className="bg-[#050505] p-4 rounded-lg border border-white/10 text-sm text-gray-300 leading-relaxed">
                                        <p className="text-white font-bold mb-1">{showOrderModal.shippingInfo?.address}</p>
                                        <p>{showOrderModal.shippingInfo?.city}, {showOrderModal.shippingInfo?.state}</p>
                                        <p>{showOrderModal.shippingInfo?.country} - <span className="text-[#D4AF37]">{showOrderModal.shippingInfo?.pinCode}</span></p>
                                        <p className="mt-2 text-xs text-gray-500">Phone: {showOrderModal.shippingInfo?.phoneNo}</p>
                                    </div>
                                </div>
                                
                                {/* 🔥 PAYMENT INFO SECTION - SHOW UTR HERE */}
                                <div>
                                    <h4 className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-3 flex items-center gap-2"><CreditCard size={14}/> Payment Info</h4>
                                    <div className="bg-[#050505] p-4 rounded-lg border border-white/10 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <p className="text-white text-sm font-bold capitalize">
                                                {showOrderModal.paymentInfo?.id === 'cod' ? 'Cash on Delivery' : 'Online / UPI'}
                                            </p>
                                            {showOrderModal.paymentInfo?.id === 'cod' ? <Banknote className="text-orange-500" size={24}/> : <CreditCard className="text-green-500" size={24}/>}
                                        </div>
                                        
                                        {/* SHOW UTR IF NOT COD */}
                                        {showOrderModal.paymentInfo?.id !== 'cod' && (
                                            <div className="bg-[#1a1a1a] p-3 rounded border border-[#D4AF37]/30 mt-2">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Transaction ID (UTR)</p>
                                                <p className="text-[#D4AF37] font-mono font-bold text-lg select-all">{showOrderModal.paymentInfo?.id}</p>
                                                <p className="text-[10px] text-gray-600 mt-1">Verify this ID in your bank statement.</p>
                                            </div>
                                        )}

                                        <p className={`text-xs font-bold mt-2 ${showOrderModal.paymentInfo?.status === 'succeeded' ? 'text-green-500' : 'text-orange-500'}`}>
                                            Status: {showOrderModal.paymentInfo?.status === 'succeeded' ? 'PAID' : 'PAYMENT PROCESSING'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-3 flex items-center gap-2"><Package size={14}/> Order Items</h4>
                                <div className="space-y-3">
                                    {showOrderModal.orderItems?.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 items-center bg-[#050505] p-3 rounded-lg border border-white/5">
                                            <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover border border-white/10" />
                                            <div className="flex-1">
                                                <p className="text-white text-sm font-bold line-clamp-1">{item.name}</p>
                                                <p className="text-xs text-gray-500">Qty: {item.quantity} x ₹{item.price}</p>
                                            </div>
                                            <div className="text-[#D4AF37] font-mono text-sm">₹{item.price * item.quantity}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 border-t border-white/10 pt-4 flex justify-between items-center">
                                    <span className="text-gray-400">Total Amount</span>
                                    <span className="text-2xl font-serif text-[#D4AF37]">₹{showOrderModal.totalPrice}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-end gap-3">
                            <button onClick={() => deleteOrder(showOrderModal._id)} className="px-4 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all">
                                Delete Order
                            </button>
                            <button onClick={(e) => { cycleStatus(showOrderModal._id, showOrderModal.orderStatus, e); setShowOrderModal(null); }} className="px-6 py-3 bg-[#D4AF37] text-black hover:bg-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                                {showOrderModal.orderStatus === 'Delivered' ? 'Mark Completed' : 'Update Status'}
                            </button>
                        </div>
                     </motion.div>
                </div>
            )}
        </AnimatePresence>

      </main>
    </div>
  );
}