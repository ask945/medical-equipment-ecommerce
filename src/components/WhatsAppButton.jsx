import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  const phoneNumber = "+917718837352"; // Placeholder India number
  const message = encodeURIComponent("Hello! I'm interested in your medical products and have a few questions. Could you please help me?");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-50 flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:bg-[#128C7E] transition-all duration-300 hover:scale-110 group animate-bounce-slow"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle size={32} className="group-hover:rotate-12 transition-transform" />

      {/* Tooltip */}
      <span className="absolute right-16 bg-white text-text-primary text-xs font-semibold px-3 py-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border pointer-events-none">
        Chat with Support
      </span>
    </a>
  );
};

export default WhatsAppButton;
