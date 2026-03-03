import { Shield, Users, Award, Heart, Truck, Clock } from 'lucide-react';
import Button from '../components/Button';

export default function AboutPage() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16 lg:py-20">
        <div className="container-main text-center max-w-3xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-text-primary mb-4">About MedEquip Pro</h1>
          <p className="text-lg text-text-secondary leading-relaxed">
            We're on a mission to make quality healthcare products accessible to everyone — whether you're managing a chronic condition at home or equipping a clinic with reliable supplies.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="container-main py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: 'FDA Cleared Products', desc: 'Every product we sell is FDA cleared and sourced from certified manufacturers. Your safety is non-negotiable.' },
            { icon: Heart, title: 'Patient First', desc: 'We work with real patients and doctors to curate products that truly improve daily health management.' },
            { icon: Truck, title: 'Fast, Free Delivery', desc: 'Free shipping on orders over $35. Most orders ship same day and arrive within 2–4 business days.' },
            { icon: Users, title: '500K+ Customers', desc: 'Trusted by over half a million customers — from individual patients to healthcare facilities nationwide.' },
            { icon: Award, title: 'Quality Guarantee', desc: '30-day hassle-free returns and a satisfaction guarantee on every purchase. Period.' },
            { icon: Clock, title: 'Auto-Refill Convenience', desc: 'Never run out of supplies. Subscribe and save up to 15% with automatic deliveries on your schedule.' },
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary-light flex items-center justify-center mb-4">
                <item.icon size={22} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">{item.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-white py-16">
        <div className="container-main max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-6">Our Story</h2>
          <p className="text-text-secondary leading-relaxed mb-4">
            MedEquip Pro started with a simple frustration: buying healthcare products online shouldn't be confusing, overpriced, or risky. We saw patients paying premium prices for basic supplies, and small clinics struggling to find reliable vendors.
          </p>
          <p className="text-text-secondary leading-relaxed mb-4">
            Today, we serve both everyday consumers and healthcare professionals with the same commitment to quality, fair pricing, and expert support. Whether you need a glucose monitor for home use or want to stock your clinic with CPAP supplies, we've got you covered.
          </p>
          <p className="text-text-secondary leading-relaxed mb-8">
            Based in San Francisco and shipping nationwide, we're proud to be FSA/HSA eligible, and we accept most insurance reimbursement programs.
          </p>
          <Button variant="primary" size="lg" href="/products">Shop Products</Button>
        </div>
      </section>
    </div>
  );
}
