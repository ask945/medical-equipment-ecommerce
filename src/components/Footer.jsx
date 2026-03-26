import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#1a1a2e] text-white mt-16">
      <div className="container-main py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold">
                MedEquip<span className="text-primary">Pro</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Your trusted online store for FDA-cleared health and medical
              equipment. Helping individuals and healthcare providers stay
              healthy, every day.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin size={14} />
              <span>San Francisco, CA 94102</span>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Shop</h4>
            <ul className="space-y-2.5">
              <li><Link to="/products" className="text-sm text-gray-400 hover:text-primary transition-colors">All Products</Link></li>
              <li><Link to="/services" className="text-sm text-gray-400 hover:text-primary transition-colors">Services</Link></li>
              <li><Link to="/blog" className="text-sm text-gray-400 hover:text-primary transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Help & Info */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Help &amp; Info</h4>
            <ul className="space-y-2.5">
              <li><Link to="/about" className="text-sm text-gray-400 hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-sm text-gray-400 hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/#faqs" className="text-sm text-gray-400 hover:text-primary transition-colors">FAQs</Link></li>
              <li><Link to="/contact?subject=Request%20a%20Quote" className="text-sm text-gray-400 hover:text-primary transition-colors">Request a Quote</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Phone size={14} className="text-primary" />
                +91 7718837352
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail size={14} className="text-primary" />
                support@medequippro.com
              </li>
            </ul>
            <div className="mt-6">
              <h5 className="text-xs uppercase tracking-wider text-gray-500 mb-2">We Accept</h5>
              <div className="flex gap-2">
                {['Visa', 'MC', 'AMEX', 'FSA', 'HSA'].map((method) => (
                  <span
                    key={method}
                    className="px-2 py-1 text-[10px] font-bold bg-white/10 rounded border border-white/20"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>&copy; 2026 MedEquip Pro. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <Link
              to="/admin"
              className="px-2.5 py-1 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:border-primary/50 hover:text-primary transition-all duration-300"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
