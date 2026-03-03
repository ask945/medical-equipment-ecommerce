import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, ShieldCheck, Headphones } from 'lucide-react';
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
              { icon: Phone, title: 'Call Us', detail: '1-800-MED-EQUIP', sub: 'Mon–Fri, 8am–8pm EST' },
              { icon: Mail, title: 'Email Us', detail: 'support@medequippro.com', sub: 'Response within 24 hours' },
              { icon: MapPin, title: 'Visit Us', detail: '100 Health Ave, San Francisco', sub: 'CA 94102, USA' },
              { icon: Clock, title: 'Business Hours', detail: 'Mon–Fri: 8am – 8pm EST', sub: 'Sat: 9am – 5pm EST' },
            ].map((card, i) => (
              <div
                key={i}
                className="group flex items-start gap-4 bg-white rounded-2xl border border-border p-6 hover:shadow-xl transition-all duration-300"
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

              {submitted ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send size={32} className="text-success" />
                  </div>
                  <p className="text-xl font-semibold text-text-primary mb-2">
                    Message Sent Successfully!
                  </p>
                  <p className="text-sm text-text-secondary">
                    Our support team will get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 relative">

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
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
                        required
                        placeholder="Doe"
                        className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Subject
                    </label>
                    <select className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition">
                      <option>Product Question</option>
                      <option>Order Status</option>
                      <option>Returns & Refunds</option>
                      <option>Auto-Refill Help</option>
                      <option>Business / Bulk Orders</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      required
                      placeholder="How can we assist you today?"
                      className="w-full px-4 py-3 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition"
                    />
                  </div>

                  <Button variant="primary" size="lg" icon={Send} type="submit">
                    Send Message
                  </Button>

                  {/* reassurance text */}
                  <p className="text-xs text-text-secondary mt-4">
                    Your information is kept secure and confidential. We do not share your data.
                  </p>

                </form>
              )}
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}