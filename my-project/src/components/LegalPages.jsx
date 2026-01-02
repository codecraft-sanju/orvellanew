import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// --- Shared Layout for Policies ---
const PolicyLayout = ({ title, date, children }) => {
  // Scroll to top when page opens
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 font-sans selection:bg-[#D4AF37] selection:text-black pt-20 pb-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-[#D4AF37] hover:text-white transition-colors mb-8 text-sm font-bold uppercase tracking-widest">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        
        <h1 className="text-3xl md:text-5xl font-serif text-white mb-4">{title}</h1>
        <p className="text-gray-500 text-xs uppercase tracking-wider mb-12 border-b border-white/10 pb-8">Last Updated: {date}</p>
        
        <div className="space-y-8 leading-relaxed text-sm md:text-base">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- 1. PRIVACY POLICY ---
export const PrivacyPolicy = () => (
  <PolicyLayout title="Privacy Policy" date="January 01, 2026">
    <p>Welcome to Orvella. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website.</p>
    
    <h3 className="text-white font-bold text-xl mt-6">1. Information We Collect</h3>
    <p>We may collect personal identification information (Name, email address, phone number, etc.) when you visit our site, register, or place an order.</p>

    <h3 className="text-white font-bold text-xl mt-6">2. How We Use Your Data</h3>
    <p>We use your data to process orders, manage your account, and improve our services. We do not sell your data to third parties.</p>

    <h3 className="text-white font-bold text-xl mt-6">3. Security</h3>
    <p>We implement advanced security measures (SSL, Encryption) to maintain the safety of your personal information.</p>
  </PolicyLayout>
);

// --- 2. TERMS & CONDITIONS ---
export const TermsConditions = () => (
  <PolicyLayout title="Terms & Conditions" date="January 01, 2026">
    <p>By accessing this website, you agree to be bound by these Terms and Conditions of Use, all applicable laws, and regulations.</p>

    <h3 className="text-white font-bold text-xl mt-6">1. Intellectual Property</h3>
    <p>All content on this site (logos, text, images) is the property of Orvella and protected by copyright laws.</p>

    <h3 className="text-white font-bold text-xl mt-6">2. User Accounts</h3>
    <p>If you create an account, you are responsible for maintaining the confidentiality of your account and password.</p>

    <h3 className="text-white font-bold text-xl mt-6">3. Limitation of Liability</h3>
    <p>Orvella shall not be liable for any damages arising out of the use or inability to use the materials on our website.</p>
  </PolicyLayout>
);

// --- 3. REFUND POLICY ---
export const RefundPolicy = () => (
  <PolicyLayout title="Refund & Cancellation" date="January 01, 2026">
    <p>Our goal is to ensure you are completely satisfied with your luxury purchase.</p>

    <h3 className="text-white font-bold text-xl mt-6">1. Returns</h3>
    <p>We accept returns within 7 days of delivery if the product is unused, sealed, and in its original packaging. Opened perfumes cannot be returned due to hygiene reasons.</p>

    <h3 className="text-white font-bold text-xl mt-6">2. Refunds</h3>
    <p>Once your return is inspected, we will notify you of the approval. Refunds will be processed to your original method of payment within 5-7 business days.</p>

    <h3 className="text-white font-bold text-xl mt-6">3. Cancellations</h3>
    <p>Orders can be cancelled within 12 hours of placement. Once shipped, orders cannot be cancelled.</p>
  </PolicyLayout>
);

// --- 4. SHIPPING POLICY ---
export const ShippingPolicy = () => (
  <PolicyLayout title="Shipping Policy" date="January 01, 2026">
    <p>We are dedicated to delivering your luxury scents with care and speed.</p>

    <h3 className="text-white font-bold text-xl mt-6">1. Processing Time</h3>
    <p>All orders are processed within 1-2 business days.</p>

    <h3 className="text-white font-bold text-xl mt-6">2. Shipping Rates</h3>
    <p>We offer free standard shipping on all prepaid orders across India. A flat fee of ₹50 applies to Cash on Delivery orders.</p>

    <h3 className="text-white font-bold text-xl mt-6">3. Delivery Estimates</h3>
    <p>Standard delivery takes 3-5 business days depending on your location.</p>
  </PolicyLayout>
);

// --- 5. CONTACT US ---
export const ContactPage = () => (
  <PolicyLayout title="Contact Us" date="Always Open">
    <p>We would love to hear from you. For inquiries, support, or feedback, please reach out.</p>

    <div className="grid md:grid-cols-2 gap-8 mt-8 border border-white/10 p-8 rounded-lg bg-[#121212]">
        <div>
            <h4 className="text-[#D4AF37] font-bold uppercase tracking-widest text-xs mb-2">Customer Support</h4>
            <p className="text-white">support@orvellaperfumegmail.com</p>
            <p className="text-gray-500 text-sm mt-1">+91 7298317177</p>
        </div>
        <div>
            <h4 className="text-[#D4AF37] font-bold uppercase tracking-widest text-xs mb-2">Headquarters</h4>
            <p className="text-white">Orvella Pvt Ltd.</p>
            <p className="text-gray-500 text-sm mt-1">Bilsanda,Bareilly-UP - 262202</p>
        </div> 
    </div>
  </PolicyLayout>
);