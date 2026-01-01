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

// Import Helper
import AdminRoute from './components/AdminRoute'; // <--- YE IMPORT KARO

// Import Policy Pages
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
          
          {/* Auth Page */}
          <Route path="/auth" element={<AuthPage />} />
          
          {/* 🔥 PROTECTED ADMIN ROUTE 🔥 */}
          {/* Ab AdminDashboard tabhi khulega jab AdminRoute allow karega */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          
          {/* Checkout & Success */}
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/success" element={<OrderSuccess />} />

          {/* Legal Routes */}
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