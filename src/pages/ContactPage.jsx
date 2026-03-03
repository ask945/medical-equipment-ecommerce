import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';
import Button from '../components/Button';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16 lg:py-20">
        <div className="container-main text-center max-w-3xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-text-primary mb-4">Get in Touch</h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            Questions about a product, your order, or setting up auto-refills? We're here to help — reach out via phone, email, or the form below.
          </p>
        </div>
      </section>

      <section className="container-main py-16">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Contact Info Cards */}
          <div className="space-y-5">
            {[
              { icon: Phone, title: 'Call Us', detail: '1-800-MED-EQUIP', sub: 'Mon–Fri, 8am–8pm EST' },
              { icon: Mail, title: 'Email Us', detail: 'support@medequippro.com', sub: 'Response within 24 hours' },
              { icon: MapPin, title: 'Visit Us', detail: '100 Health Ave, San Francisco', sub: 'CA 94102, USA' },
              { icon: Clock, title: 'Business Hours', detail: 'Mon–Fri: 8am – 8pm EST', sub: 'Sat: 9am – 5pm EST' },
            ].map((card, i) => (
              <div key={i} className="flex items-start gap-4 bg-white rounded-xl border border-border p-5 hover:shadow-sm transition-shadow">
                <div className="w-11 h-11 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                  <card.icon size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{card.title}</p>
                  <p className="text-sm text-text-primary">{card.detail}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{card.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-border p-6 lg:p-8">
              <h2 className="text-xl font-bold text-text-primary mb-6">Send Us a Message</h2>
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send size={28} className="text-success" />
                  </div>
                  <p className="text-lg font-semibold text-text-primary mb-1">Message Sent!</p>
                  <p className="text-sm text-text-secondary">We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1.5">First Name</label>
                      <input type="text" required placeholder="John" className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-1.5">Last Name</label>
                      <input type="text" required placeholder="Doe" className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Email</label>
                    <input type="email" required placeholder="john@example.com" className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Subject</label>
                    <select className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                      <option>Product Question</option>
                      <option>Order Status</option>
                      <option>Returns & Refunds</option>
                      <option>Auto-Refill Help</option>
                      <option>Business / Bulk Orders</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Message</label>
                    <textarea rows={5} required placeholder="How can we help you?" className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                  </div>
                  <Button variant="primary" size="lg" icon={Send} type="submit">
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
