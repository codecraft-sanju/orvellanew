import React from 'react';
import { Navigate } from 'react-router-dom';
import { useShop } from './ShopContext';
import { Loader2 } from 'lucide-react';

const AdminRoute = ({ children }) => {
  const { user, loading } = useShop();

  // 1. Jab tak data load ho raha hai, Loading Screen dikhao
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#050505] text-[#D4AF37]">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="text-xs uppercase tracking-widest">Verifying Access...</p>
      </div>
    );
  }

  // 2. Agar User nahi hai YA User ka role 'admin' nahi hai -> Home par bhej do
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // 3. Agar sab sahi hai, toh Admin Page dikhao
  return children;
};

export default AdminRoute;