import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  FileText,
  Settings,
  RefreshCw,
  LogOut,
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'My Account', path: '/invoices' },
  { icon: ShoppingBag, label: 'Order History', path: '/invoices' },
  { icon: RefreshCw, label: 'Auto-Refills', path: '/supplies' },
  { icon: Settings, label: 'Settings', path: '#' },
];

export default function DashboardSidebar() {
  const location = useLocation();

  return (
    <aside className="w-60 bg-white border-r border-border min-h-[calc(100vh-64px)] p-4 hidden lg:block shrink-0">
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-light text-primary'
                  : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-gray-50 hover:text-danger transition-colors w-full">
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
