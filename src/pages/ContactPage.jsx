import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Phone, Mail, MapPin, Clock, Send, ShieldCheck, Headphones, CheckCircle, X } from 'lucide-react';
import Button from '../components/Button';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';

export default function ContactPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const getInitialSubject = () => {
    const fromUrl = searchParams.get('subject');
    if (!fromUrl) return 'Product Question';

    // Normalize and match
    const options = [
      'Product Question', 'Order Status', 'Returns & Refunds',
      'Auto-Refill Help', 'Business/Bulk Orders', 'Request Quote', 'Other'
    ];

    const matched = options.find(opt =>
      opt.toLowerCase().replace(/\s+/g, '') === fromUrl.toLowerCase().replace(/\s+/g, '') ||
      opt.toLowerCase() === fromUrl.toLowerCase()
    );

    return matched || 'Product Question';
  };
  const [subject, setSubject] = useState(getInitialSubject());
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Autofill from logged-in user
  useEffect(() => {
    if (user) {
      const names = (user.name || '').split(' ');
      setFormData(prev => ({
        ...prev,
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const collectionName = subject === 'Request Quote' ? 'quotes' : 'inquiries';
      const docData = {
        ...formData,
        subject,
        createdAt: serverTimestamp(),
        status: 'pending'
      };

      await addDoc(collection(db, collectionName), docData);
      setSubmitted(true);
      setFormData(prev => ({
        firstName: user ? prev.firstName : '',
        lastName: user ? prev.lastName : '',
        email: user ? prev.email : '',
        phone: user ? prev.phone : '',
        message: ''
      }));
    } catch (error) {
      console.error("Error saving inquiry:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setSubmitted(false);
    setSubject('Product Question');
  };

  return (
    <div className="animate-fade-in">

      {/* Success Dialog Overlay */}
      {submitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center relative">
            <button
              onClick={handleCloseSuccess}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
            >
              <X size={20} />
            </button>
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">
              Message Sent Successfully!
            </h3>
            <p className="text-sm text-text-secondary mb-6">
              Our support team will get back to you within 24 hours.
            </p>
            <Button variant="primary" size="lg" onClick={handleCloseSuccess}>
              OK
            </Button>
          </div>
        </div>
      )}

      {/* HERO — More Engaging */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(19,91,236,0.08),transparent_60%)]" />

        <div className="container-main relative py-16 lg:py-24 text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-sm font-medium mb-6 border border-primary/15 text-primary">
            <Headphones size={14} />
            Expert Support Available
          </span>

          <h1 className="text-4xl lg:text-5xl font-extrabold text-text-primary mb-4">
            We're Here to Help
          </h1>

          <p className="text-lg text-text-secondary leading-relaxed">
            Whether you have a product question, need order support, or want help
            setting up auto-refills — our licensed specialists are ready to assist you.
          </p>

          {/* Quick reassurance badges */}
          <div className="flex justify-center gap-6 mt-8 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-primary" />
              Secure & Confidential
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-primary" />
              24hr Response Time
            </span>
          </div>
        </div>
      </section>

      {/* MAIN SECTION */}
      <section className="container-main py-16">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* CONTACT INFO CARDS — Upgraded */}
          <div className="space-y-6">
            {[
              { icon: Phone, title: 'Call Us', detail: '+91 77188 37352', sub: 'Mon–Fri, 8am–8pm EST' },
              { icon: Mail, title: 'Email Us', detail: 'support@medequippro.com', sub: 'Response within 24 hours' },
              { icon: MapPin, title: 'Visit Us', detail: '100 Health Ave, San Francisco', sub: 'CA 94102, USA' },
              { icon: Clock, title: 'Business Hours', detail: 'Mon–Fri: 8am – 8pm EST', sub: 'Sat: 9am – 5pm EST' },
            ].map((card, i) => (
              <div
                key={i}
                className="group flex items-start gap-4 bg-white rounded-2xl border border-border p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center group-hover:bg-primary transition-colors shrink-0">
                  <card.icon size={20} className="text-primary group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{card.title}</p>
                  <p className="text-sm font-medium text-text-primary">{card.detail}</p>
                  <p className="text-xs text-text-secondary mt-1">{card.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CONTACT FORM — More Premium */}
          <div className="lg:col-span-2">
            <div className="relative bg-white rounded-2xl border border-border p-8 shadow-sm">

              {/* subtle background accent */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

              <h2 className="text-2xl font-bold text-text-primary mb-6 relative">
                Send Us a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6 relative">

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="John"
                        className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Doe"
                        className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        readOnly={!!user?.email}
                        placeholder="john@example.com"
                        className={`w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition ${user?.email ? 'bg-gray-50 text-text-secondary cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Subject
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition cursor-pointer"
                    >
                      <option>Product Question</option>
                      <option>Order Status</option>
                      <option>Returns & Refunds</option>
                      <option>Auto-Refill Help</option>
                      <option>Business/Bulk Orders</option>
                      <option>Request Quote</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="How can we assist you today?"
                      className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition"
                    />
                  </div>

                  <Button variant="primary" size="lg" icon={Send} type="submit" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Message'}
                  </Button>

                  {/* reassurance text */}
                  <p className="text-xs text-text-secondary mt-4">
                    Your information is kept secure and confidential. We do not share your data.
                  </p>

                </form>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}