import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom';
import {
    ShoppingBag, ChevronRight, Eye, Truck, Plus,
    Calendar, AlertCircle, Clock,
    Download, X, ListFilter, Search
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { adminDb as db } from '../../adminFirebase';
import AdminOrderService, { ORDER_STATUSES } from '../../utils/adminOrderService';
import { formatCurrency } from '../../utils/formatUtils';
import { Button, LoadingSpinner, Input, Modal } from '../../components/ui';
import { toast } from 'react-toastify';
import { exportToCSV } from '../../utils/csvUtils';
import CreateOrderDrawer from '../../components/admin/CreateOrderDrawer';

const AdminOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('view'); // 'view' or 'status' or 'tracking'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');
    const [showCreateOrder, setShowCreateOrder] = useState(false);

    // Raw orders from real-time listener
    const [rawOrders, setRawOrders] = useState([]);

    // Real-time listener for orders collection
    useEffect(() => {
        setLoading(true);
        const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
            const allOrders = snapshot.docs.map(d => {
                const data = d.data();
                let orderDate = null;
                if (data.orderDate?.toDate) orderDate = data.orderDate.toDate();
                else if (data.createdAt?.toDate) orderDate = data.createdAt.toDate();
                else if (data.orderDate) orderDate = new Date(data.orderDate);
                else if (data.createdAt) orderDate = new Date(data.createdAt);

                return {
                    id: d.id,
                    ...data,
                    orderDate: orderDate ? orderDate.toISOString() : new Date().toISOString(),
                };
            });
            setRawOrders(allOrders);
            setLoading(false);
        }, (err) => {
            console.error("Error listening to orders:", err);
            toast.error("Failed to load orders");
            setLoading(false);
        });

        return () => unsubOrders();
    }, []);

    // Client-side filtering/sorting (applied whenever rawOrders or filters change)
    useEffect(() => {
        let filtered = [...rawOrders];

        // Status filter
        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter(o => o.status === statusFilter);
        }

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(o =>
                (o.orderId || o.id || '').toLowerCase().includes(term) ||
                (o.userName || '').toLowerCase().includes(term) ||
                (o.userEmail || '').toLowerCase().includes(term)
            );
        }

        // Date range filter
        if (startDate) {
            const start = new Date(startDate);
            filtered = filtered.filter(o => new Date(o.orderDate) >= start);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(o => new Date(o.orderDate) <= end);
        }

        // Sorting
        filtered.sort((a, b) => {
            let aVal, bVal;
            if (sortBy === 'amount') {
                aVal = a.total || 0;
                bVal = b.total || 0;
            } else {
                aVal = new Date(a.orderDate).getTime();
                bVal = new Date(b.orderDate).getTime();
            }
            return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
        });

        setOrders(filtered);
    }, [rawOrders, statusFilter, searchTerm, startDate, endDate, sortBy, sortDirection]);

    // For manual refresh and after status updates
    const fetchOrders = useCallback(() => {
        // No-op: real-time listener handles updates automatically
    }, []);

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            const result = await AdminOrderService.updateOrderStatus(orderId, newStatus);
            if (result.success) {
                toast.success(`Order ${newStatus} successfully`);
                fetchOrders();
                setIsModalOpen(false);
            } else {
                console.error('Status update failed:', result.error);
                toast.error(`Update failed: ${result.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Status update exception:', err);
            toast.error(`Update error: ${err.message}`);
        }
    };


    const handleExport = () => {
        if (!orders || orders.length === 0) {
            toast.warn("No orders to export");
            return;
        }

        const headers = [
            { key: 'orderId', label: 'Order ID' },
            { key: 'userName', label: 'Customer' },
            { key: 'userEmail', label: 'Email' },
            { key: 'orderDate', label: 'Date' },
            { key: 'total', label: 'Total Amount' },
            { key: 'status', label: 'Status' },
            { key: 'paymentMethod', label: 'Payment Method' }
        ];

        const exportData = orders.map(order => ({
            ...order,
            orderDate: order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A',
            userName: order.userName || (order.shippingAddress?.firstName ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}` : 'Guest')
        }));

        exportToCSV(exportData, `Orders_Export_${new Date().toISOString().split('T')[0]}.csv`, headers);
        toast.success("Orders exported to CSV");
    };

    const OrderIDCell = ({ order }) => (
        <td className="py-6 px-10 font-bold text-[#2563eb] text-[14.5px]">
            <Link to={`/admin/orders/${order.id}`} className="hover:underline">
                #{order.orderId || (order.id && order.id.substring(0, 8).toUpperCase()) || 'N/A'}
            </Link>
        </td>
    );

    const CustomerCell = ({ order }) => {
        const displayName = order.userName || 
            (order.shippingAddress?.firstName && order.shippingAddress?.lastName 
                ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}` 
                : order.shippingAddress?.name) || 
            'Guest Customer';
            
        const isInstitutional = order.userType === 'Institutional' || order.isInstitutional || order.type === 'institutional';

        return (
            <td className="py-6 px-10">
                <div className="font-bold text-slate-900 text-[15px]">{displayName}</div>
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                    {isInstitutional ? 'Institutional' : 'Individual'} {order.department ? `• ${order.department}` : ''}
                </div>
            </td>
        );
    };

    const StatusBadge = ({ status }) => {
        const config = {
            'Placed': { color: 'bg-orange-50 text-orange-600', dot: 'bg-orange-400' },
            'Processing': { color: 'bg-orange-50 text-orange-600', dot: 'bg-orange-400' },
            'Shipped': { color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-400' },
            'Delivered': { color: 'bg-[#f0fdf4] text-[#16a34a]', dot: 'bg-[#22c55e]' },
            'Cancelled': { color: 'bg-red-50 text-red-600', dot: 'bg-red-400' },
            'Declined': { color: 'bg-red-50 text-red-600', dot: 'bg-red-400' },
        };
        const style = config[status] || config['Placed'];
        return (
            <div className={`px-3 py-1.5 rounded-xl ${style.color} text-[10px] font-black flex items-center gap-2 w-fit uppercase tracking-widest`}>
                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                {status}
            </div>
        );
    };

    const StatMiniCard = ({ icon: Icon, title, value, badge, badgeColor, iconBg, iconColor }) => (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3 min-w-[200px] flex-1">
            <div className="flex justify-between items-start">
                <div className={`${iconBg} p-2 rounded-lg`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                {badge && (
                    <span className={`${badgeColor} text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                        {badge}
                    </span>
                )}
            </div>
            <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                <p className="text-2xl font-black text-gray-900">{value}</p>
            </div>
        </div>
    );

    const stats = React.useMemo(() => {
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        const pendingApproval = orders.filter(o => o.status === 'Placed').length;
        const activeShipments = orders.filter(o => o.status === 'Shipped').length;
        const flaggedOrders = orders.filter(o => ['Cancelled', 'Declined'].includes(o.status)).length;

        return {
            totalRevenue,
            pendingApproval,
            activeShipments,
            flaggedOrders
        };
    }, [orders]);

    return (
        <div className="space-y-8 pb-10 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div>
                    <h1 className="text-4xl font-black text-[#1e293b] tracking-tight mb-1">Orders Management</h1>
                    <p className="text-slate-500 font-medium">Review and manage institutional and individual medical supply orders.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        className="bg-white border border-slate-200 text-slate-700 font-bold px-5 h-[48px] rounded-xl flex items-center gap-2 shadow-sm hover:bg-slate-50 text-sm"
                        onClick={handleExport}
                    >
                        <Download className="w-4 h-4" /> Export to CSV
                    </Button>
                    <Button
                        variant="primary"
                        className="bg-[#2563eb] hover:bg-blue-700 text-white font-bold px-6 h-[48px] rounded-xl flex items-center gap-2 shadow-xl shadow-blue-200 transition-all active:scale-95 text-sm"
                        onClick={() => setShowCreateOrder(true)}
                    >
                        <Plus className="w-4 h-4" /> New Manual Order
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 space-y-3">
                    {/* Row 1: Search Bar — full width */}
                    <div className="flex items-center gap-2 bg-[#f1f5f9] rounded-xl px-4 py-2.5">
                        <Search className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, email, order ID..."
                            className="bg-transparent border-none outline-none text-[13px] font-medium text-slate-700 placeholder:text-slate-400 w-full"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-red-500">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Row 2: Status tabs + Date + Sort */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Status Tabs */}
                        <div className="flex gap-1 bg-[#f1f5f9] p-1 rounded-xl w-fit flex-nowrap">
                            {['All Orders', 'Processing', 'Shipped', 'Delivered', 'Cancelled/Declined'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setStatusFilter(tab === 'All Orders' ? 'all' : tab)}
                                    className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all whitespace-nowrap ${(statusFilter === tab || (statusFilter === 'all' && tab === 'All Orders'))
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Date + Sort */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Date Range */}
                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-bold text-slate-700 shadow-sm whitespace-nowrap">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent border-none outline-none text-[11px] w-24"
                                />
                                <span className="text-slate-300">to</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent border-none outline-none text-[11px] w-24"
                                />
                                {(startDate || endDate) && (
                                    <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-slate-400 hover:text-red-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            {/* Sort Dropdown */}
                            <div className="flex items-center gap-1.5">
                                <ListFilter className="w-4 h-4 text-slate-400" />
                                <span className="text-[12px] font-bold text-slate-500">Sort By</span>
                                <select
                                    value={`${sortBy}-${sortDirection}`}
                                    onChange={(e) => {
                                        const [field, dir] = e.target.value.split('-');
                                        setSortBy(field);
                                        setSortDirection(dir);
                                    }}
                                    className="text-[12px] font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none cursor-pointer focus:border-blue-400 shadow-sm"
                                >
                                    <option value="date-desc">Newest First</option>
                                    <option value="date-asc">Oldest First</option>
                                    <option value="amount-desc">Amount: High to Low</option>
                                    <option value="amount-asc">Amount: Low to High</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Container card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-0 overflow-x-auto lg:overflow-x-visible">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <LoadingSpinner size="lg" text="Fetching orders..." />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-20 mx-8 my-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900">
                                {statusFilter === 'all'
                                    ? "No orders found"
                                    : `No Orders pending for ${statusFilter}`}
                            </h3>
                            <p className="text-slate-400 font-medium">
                                {searchTerm
                                    ? `No results match your search "${searchTerm}"`
                                    : "Try adjusting your filters or status selection"}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[1000px] lg:min-w-0">
                            <thead className="bg-[#f8fafc]">
                                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                    <th className="py-4 px-8">Order ID</th>
                                    <th className="py-4 px-8">Customer / Hospital</th>
                                    <th className="py-4 px-8">Date</th>
                                    <th className="py-4 px-8">Amount</th>
                                    <th className="py-4 px-8">Status</th>
                                    <th className="py-4 px-8 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/30 transition-colors group">
                                        <OrderIDCell order={order} />
                                        <CustomerCell order={order} />
                                        <td className="py-6 px-8 text-[13px] font-bold text-slate-600 whitespace-nowrap">
                                            {order.orderDate ? (
                                                new Date(order.orderDate).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })
                                            ) : 'N/A'}
                                        </td>
                                        <td className="py-6 px-8 text-[14px] font-black text-slate-900 whitespace-nowrap">
                                            {formatCurrency(order.total || 0)}
                                        </td>
                                        <td className="py-6 px-8">
                                            <StatusBadge status={order.status || 'Placed'} />
                                        </td>
                                        <td className="py-6 px-8 text-right">
                                            <Link
                                                to={`/admin/orders/${order.id}`}
                                                className="text-slate-400 hover:text-blue-600 transition-colors"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Section */}
                <div className="px-10 py-6 bg-white flex items-center justify-between">
                    <p className="text-[13px] font-bold text-slate-400">
                        {orders.length > 0 ? `Showing 1-${orders.length} of ${orders.length} orders` : 'No orders to display'}
                    </p>
                    <div className="flex items-center gap-1">
                        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-50" disabled>
                            <ChevronRight className="w-5 h-5 rotate-180" />
                        </button>
                        <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#2563eb] text-white font-bold shadow-lg shadow-blue-100">1</button>
                        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-50" disabled>
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Summary Cards */}
            <div className="flex flex-wrap gap-6">
                <StatMiniCard
                    icon={ShoppingBag}
                    title="Total Revenue"
                    value={formatCurrency(stats.totalRevenue)}
                    badge="Gross"
                    badgeColor="bg-green-100 text-green-600"
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                />
                <StatMiniCard
                    icon={Clock}
                    title="Pending Approval"
                    value={stats.pendingApproval.toString()}
                    badge="Incoming"
                    badgeColor="bg-orange-100 text-orange-600"
                    iconBg="bg-orange-50"
                    iconColor="text-orange-600"
                />
                <StatMiniCard
                    icon={Truck}
                    title="Active Shipments"
                    value={stats.activeShipments.toString()}
                    badge="In Transit"
                    badgeColor="bg-blue-100 text-blue-600"
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                />
                <StatMiniCard
                    icon={AlertCircle}
                    title="Flagged Orders"
                    value={stats.flaggedOrders.toString()}
                    badge="Attention"
                    badgeColor="bg-red-100 text-red-600"
                    iconBg="bg-red-50"
                    iconColor="text-red-600"
                />
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalMode === 'view' ? "Order Details" : "Update Status"}
                size={modalMode === 'view' ? 'lg' : 'md'}
            >
                {selectedOrder && (
                    <div className="space-y-6">
                        {modalMode === 'view' && (
                            <>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Customer</p>
                                        <p className="font-semibold">{selectedOrder.userName || (selectedOrder.shippingAddress?.firstName ? `${selectedOrder.shippingAddress.firstName} ${selectedOrder.shippingAddress.lastName}` : 'Guest Customer')}</p>
                                        <p className="text-sm text-gray-600">{selectedOrder.userEmail}</p>
                                        <p className="text-sm text-gray-600">{selectedOrder.userPhone || 'No phone'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Shipping Address</p>
                                        <div className="text-sm text-gray-600">
                                            {typeof selectedOrder.shippingAddress === 'string' ? (
                                                selectedOrder.shippingAddress
                                            ) : (
                                                <>
                                                    <p>{selectedOrder.shippingAddress?.streetAddress || selectedOrder.shippingAddress?.addressLine1 || 'N/A'}</p>
                                                    <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode || selectedOrder.shippingAddress?.zip}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold mb-3 flex items-center gap-2">
                                        <ShoppingBag className="w-4 h-4 text-primary" />
                                        Order Items
                                    </h4>
                                    <div className="space-y-2">
                                        {(selectedOrder.items || []).map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    {item.image && !(item.category === 'Services' || item.type === 'Services' || (item.id && String(item.id).startsWith('service-'))) && (
                                                        <img src={item.image} alt="" className="w-12 h-12 rounded object-cover" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-sm">{item.name || item.title || 'Product'}</p>
                                                        <p className="text-xs text-gray-500">Qty: {item.quantity || item.qty || 1} × {formatCurrency(item.price || 0)}</p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-sm">{formatCurrency((item.price || 0) * (item.quantity || item.qty || 1))}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-4">
                                    <div className="flex justify-between items-center mb-6">
                                        <p className="text-lg font-bold">Total Amount</p>
                                        <p className="text-2xl font-black text-primary">{formatCurrency(selectedOrder.total || 0)}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {Object.values(ORDER_STATUSES).map((status) => (
                                            <Button
                                                key={status}
                                                variant={selectedOrder.status === status ? 'primary' : 'outline'}
                                                size="sm"
                                                onClick={() => handleStatusUpdate(selectedOrder.id, status)}
                                                disabled={selectedOrder.status === status}
                                            >
                                                {status}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                )}
            </Modal>

            {/* Create Order Drawer */}
            <CreateOrderDrawer
                open={showCreateOrder}
                onClose={() => setShowCreateOrder(false)}
                onOrderCreated={() => fetchOrders()}
            />
        </div>
    );
};

export default AdminOrdersPage;
