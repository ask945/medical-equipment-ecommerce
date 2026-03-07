import { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingBag, RefreshCw, Settings, DollarSign, FileText, AlertTriangle, Clock, Search, Download, Eye, Loader2 } from 'lucide-react';
import { DashboardHeader } from '../components/Header';
import DashboardSidebar from '../components/DashboardSidebar';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import { getAllOrders } from '../services/orderService';

const menuItems = [
  { icon: LayoutDashboard, label: 'My Account', path: '/profile' },
  { icon: ShoppingBag, label: 'Order History', path: '/invoices' },
  { icon: RefreshCw, label: 'Auto-Refills', path: '/supplies' },
  { icon: Settings, label: 'Settings', path: '#' },
];

export default function InvoicePage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const data = await getAllOrders();
        setInvoices(data);
      } catch (err) {
        console.error('Error fetching invoices:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  const filtered = invoices.filter((inv) => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (searchQuery && !inv.id.toLowerCase().includes(searchQuery.toLowerCase()) && !(inv.customer || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const outstanding = invoices.filter((i) => i.status !== 'paid').reduce((s, i) => s + (i.amount || i.total || 0), 0);
  const overdue = invoices.filter((i) => i.status === 'overdue').length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Order History" breadcrumbs={[{ label: 'My Account', href: '/invoices' }, { label: 'Orders' }]} />
      <div className="flex">
        <DashboardSidebar menuItems={menuItems} />
        <main className="flex-1 p-6 animate-fade-in">
          {loading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <KPICard icon={DollarSign} label="Outstanding Balance" value={`$${outstanding.toLocaleString()}`} color="primary" trend="up" trendValue="12%" />
                <KPICard icon={FileText} label="Total Invoices" value={invoices.length} color="primary" />
                <KPICard icon={AlertTriangle} label="Overdue" value={overdue} color="danger" />
                <KPICard icon={Clock} label="Avg. Payment Time" value="18 days" color="success" trend="down" trendValue="3 days" />
              </div>

              <div className="bg-white rounded-xl border border-border p-4 mb-6">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search orders..." className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                  </div>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none cursor-pointer">
                    <option value="all">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                  <Button variant="secondary" size="sm" icon={Download}>Export CSV</Button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-border">
                        <th className="text-left px-5 py-3 font-semibold text-text-secondary">Order #</th>
                        <th className="text-left px-5 py-3 font-semibold text-text-secondary">Ordered By</th>
                        <th className="text-left px-5 py-3 font-semibold text-text-secondary">Date</th>
                        <th className="text-left px-5 py-3 font-semibold text-text-secondary">Due Date</th>
                        <th className="text-right px-5 py-3 font-semibold text-text-secondary">Amount</th>
                        <th className="text-center px-5 py-3 font-semibold text-text-secondary">Status</th>
                        <th className="text-center px-5 py-3 font-semibold text-text-secondary">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((inv) => (
                        <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4 font-medium text-primary">{inv.id}</td>
                          <td className="px-5 py-4 text-text-primary">{inv.customer || '—'}</td>
                          <td className="px-5 py-4 text-text-secondary">{inv.date}</td>
                          <td className="px-5 py-4 text-text-secondary">{inv.dueDate || '—'}</td>
                          <td className="px-5 py-4 text-right font-semibold">${(inv.amount || inv.total || 0).toLocaleString()}</td>
                          <td className="px-5 py-4 text-center"><StatusBadge status={inv.status} /></td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary-light transition-colors"><Eye size={16} /></button>
                              <button className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary-light transition-colors"><Download size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filtered.length === 0 && <div className="py-12 text-center text-text-secondary">No orders found.</div>}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
