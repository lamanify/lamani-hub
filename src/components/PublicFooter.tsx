import { Link } from "react-router-dom";

const LOGO_URL = "https://www.lamanify.com/wp-content/uploads/2025/10/LamaniHub.webp";

export default function PublicFooter() {
  return (
    <footer className="bg-[hsl(220,20%,97%)] text-gray-600 pt-16 pb-8">
      <div className="container mx-auto px-6 grid md:grid-cols-4 gap-8">
        {/* About */}
        <div>
          <img src={LOGO_URL} alt="LamaniHub Logo" className="h-12 mb-4" />
          <p className="text-sm">
            The all-in-one CRM designed to help Malaysian healthcare clinics grow, get organized, and stay compliant.
          </p>
        </div>
        
        {/* Product */}
        <div>
          <h4 className="font-semibold text-black mb-4">Product</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/#features" className="hover:text-black transition-colors">Features</Link></li>
            <li><Link to="/#pricing" className="hover:text-black transition-colors">Pricing</Link></li>
            <li><Link to="/#compliance" className="hover:text-black transition-colors">PDPA Compliance</Link></li>
            <li><Link to="/product" className="hover:text-black transition-colors">Security</Link></li>
            <li><Link to="/help" className="hover:text-black transition-colors">Help Center</Link></li>
          </ul>
        </div>
        
        {/* Company */}
        <div>
          <h4 className="font-semibold text-black mb-4">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-black transition-colors">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-black transition-colors">Contact Us</Link></li>
            <li><Link to="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-black transition-colors">Terms of Service</Link></li>
          </ul>
        </div>
        
        {/* Contact Info */}
        <div>
          <h4 className="font-semibold text-black mb-4">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li>hello@lamanihub.com</li>
            <li>+60 3 1234 5678</li>
            <li>Kuala Lumpur, Malaysia</li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-6 mt-12 pt-8 border-t border-gray-400 text-center text-sm">
        <p>&copy; 2025 LamaniHub. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
