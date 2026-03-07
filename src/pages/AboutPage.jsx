import { Shield, Users, Award, Heart, Truck, Clock, CheckCircle } from 'lucide-react';
import Button from '../components/Button';

export default function AboutPage() {
  return (
    <div className="animate-fade-in">

      {/* HERO SECTION — More Engaging */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(19,91,236,0.08),transparent_60%)]" />

        <div className="container-main relative py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-sm font-medium mb-6 border border-primary/15 text-primary">
                <Shield size={14} />
                Trusted Nationwide
              </span>

              <h1 className="text-4xl lg:text-5xl font-extrabold text-text-primary mb-6 leading-tight">
                About <span className="text-primary">Bluecare Pharma</span>
              </h1>

              <p className="text-lg text-text-secondary leading-relaxed mb-6">
                We're redefining how healthcare products are purchased online — making it simpler,
                safer, and more affordable for patients and healthcare professionals alike.
              </p>

              <div className="flex gap-4">
                <Button variant="primary" size="lg" href="/products">
                  Shop Products
                </Button>
                <Button variant="secondary" size="lg" href="/contact">
                  Contact Support
                </Button>
              </div>
            </div>

            <div className="hidden lg:block relative">
              <div className="rounded-2xl overflow-hidden shadow-xl border border-border">
                <img
                  src="https://www.rgcirc.org/wp-content/uploads/2023/12/MRI-10-1024x683.jpg"
                  alt="Healthcare professional assisting patient"
                  className="w-full h-[450px] object-cover"
                />
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border border-border">
                <p className="text-2xl font-bold text-primary">500K+</p>
                <p className="text-xs text-text-secondary">Happy Customers</p>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* STATS SECTION */}
      <section className="bg-white border-y border-border">
        <div className="container-main py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "500K+", label: "Customers Served" },
              { number: "4.8★", label: "Average Rating" },
              { number: "2–4 Days", label: "Fast Delivery" },
              { number: "30 Days", label: "Easy Returns" },
            ].map((item, i) => (
              <div key={i}>
                <p className="text-3xl font-bold text-primary">{item.number}</p>
                <p className="text-sm text-text-secondary mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* VALUES SECTION — More Premium Cards */}
      <section className="container-main py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text-primary mb-3">
            Our Core Values
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            Everything we do is built around safety, trust, and long-term relationships.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: 'FDA Cleared Products', desc: 'Every product is clinically validated and sourced from certified manufacturers.' },
            { icon: Heart, title: 'Patient First Approach', desc: 'We curate products that genuinely improve daily health management.' },
            { icon: Truck, title: 'Fast & Free Delivery', desc: 'Free shipping on $35+ and same-day dispatch on most orders.' },
            { icon: Users, title: 'Trusted by Professionals', desc: 'Doctors, clinics, and healthcare providers rely on us.' },
            { icon: Award, title: 'Quality Guarantee', desc: '30-day hassle-free returns and 100% satisfaction promise.' },
            { icon: Clock, title: 'Auto-Refill Convenience', desc: 'Never run out — flexible subscriptions with easy skip/cancel.' },
          ].map((item, i) => (
            <div key={i} className="group bg-white p-6 rounded-2xl border border-border hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 rounded-lg bg-primary-light flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                <item.icon size={22} className="text-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">{item.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* OUR STORY — With Better Layout */}
      <section className="bg-blue-50 py-16">
        <div className="container-main grid lg:grid-cols-2 gap-12 items-center">

          <div>
            <h2 className="text-3xl font-bold text-text-primary mb-6">
              Our Story
            </h2>

            <p className="text-text-secondary leading-relaxed mb-4">
              Bluecare Pharma  started with a simple frustration: buying healthcare products online
              shouldn't feel risky, overpriced, or confusing.
            </p>

            <p className="text-text-secondary leading-relaxed mb-4">
              We saw patients paying excessive prices and small clinics struggling to find
              reliable vendors. So we built a platform focused on transparency,
              clinical validation, and fair pricing.
            </p>

            <p className="text-text-secondary leading-relaxed mb-6">
              Today, we proudly serve hundreds of thousands nationwide — from individuals managing chronic conditions at home to healthcare professionals stocking their practices.
            </p>

            <div className="flex items-center gap-2 text-primary font-medium">
              <CheckCircle size={18} />
              FSA/HSA Eligible
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-lg border border-border">
            <img
              src="https://tediselmedical.com/wp-content/uploads/2023/09/equipamiento_hospitalario_areas_criticas_pic01_20230906_tedisel_medical.jpg"
              alt="Medical supplies and equipment"
              className="w-full h-[400px] object-cover"
            />
          </div>

        </div>
      </section>


      {/* FINAL CTA SECTION */}
      <section className="container-main py-16 text-center">
        <div className="bg-gradient-to-r from-primary to-[#0e47c1] rounded-2xl p-12 text-white relative overflow-hidden">

          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Take Control of Your Health?
          </h2>

          <p className="text-white/80 max-w-xl mx-auto mb-8">
            Shop trusted medical equipment and supplies with confidence — backed by clinical validation and nationwide delivery.
          </p>

          <Button variant="white" size="lg" href="/products">
            Browse Products
          </Button>

        </div>
      </section>

    </div>
  );
}