import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Context
import { ShopProvider } from './components/ShopContext'; 

// Import Pages
import Home from './components/Home';
import AdminDashboard from './components/AdminDashboard';
import AuthPage from './components/AuthPage'; 
import OrderSuccess from './components/OrderSuccess';
import Checkout from './components/Checkout';

// --- NEW IMPORTS (Policy Pages) ---
import { 
  PrivacyPolicy, TermsConditions, RefundPolicy, ShippingPolicy, ContactPage 
} from './components/LegalPages';

function App() {
  return (
    <ShopProvider>
      <Router>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<Home />} />
          
          {/* Auth Page (Login/Register) */}
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Admin Dashboard */}
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Checkout & Success Routes */}
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/success" element={<OrderSuccess />} />

          {/* --- LEGAL ROUTES (For Razorpay KYC) --- */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/refund" element={<RefundPolicy />} />
          <Route path="/shipping" element={<ShippingPolicy />} />
          <Route path="/contact" element={<ContactPage />} />

        </Routes>
      </Router>
    </ShopProvider>
  );
}

export default App;