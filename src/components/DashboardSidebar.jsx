import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, X } from 'lucide-react';
import SidebarProfile from './SidebarProfile';

export default function DashboardSidebar({
  menuItems = [],
  isOpen = true,
  onClose,
  isMobile = false
}) {
  const location = useLocation();

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Bluecare Pharma</h2>
              {!isMobile && (
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin Panel</p>
              )}
            </div>
          </div>
          {isMobile && onClose && (
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto font-sans">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={isMobile ? onClose : undefined}
              className={`
                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group
                                ${isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }
                            `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-900'}`} />
              <span className="font-semibold text-sm">{item.label}</span>
              {isActive && !isMobile && (
                <div className="absolute left-0 w-1.5 h-6 bg-blue-600 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <SidebarProfile />
    </>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 flex flex-col shadow-2xl lg:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          exit={{ x: -280 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="hidden lg:flex w-72 bg-white border-r border-gray-100 flex-col z-30 shrink-0"
        >
          {sidebarContent}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
