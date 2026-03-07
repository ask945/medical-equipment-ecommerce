import React, { useState, useEffect, useCallback } from 'react'
import {
    ShoppingBag, Filter, ChevronRight, Eye,
    Truck, Calendar, AlertCircle, Clock,
    Download, X, ListFilter, Pencil
} from 'lucide-react';
import AdminOrderService, { ORDER_STATUSES, SHIPPING_CARRIERS } from '../../utils/adminOrderService';
import { formatCurrency } from '../../utils/formatUtils';
import { Button, LoadingSpinner, Input, Modal } from '../../components/ui';
import { toast } from 'react-toastify';

const AdminOrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('view'); // 'view' or 'status' or 'tracking'
    const [trackingInfo, setTrackingInfo] = useState({ carrier: 'IndiaPost', trackingNumber: '' });

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        const result = await AdminOrderService.getAllOrders({
            status: statusFilter,
            searchTerm: searchTerm
        });
        if (result.success) {
            setOrders(result.orders);
        } else {
            toast.error("Failed to fetch orders");
        }
        setLoading(false);
    }, [statusFilter, searchTerm]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleStatusUpdate = async (orderId, newStatus) => {
        const result = await AdminOrderService.updateOrderStatus(orderId, newStatus);
        if (result.success) {
            toast.success(`Order ${newStatus} successfully`);
            fetchOrders();
            setIsModalOpen(false);
        } else {
            toast.error("Update failed");
        }
    };

    const handleTrackingUpdate = async (e) => {
        e.preventDefault();
        const result = await AdminOrderService.updateOrderStatus(selectedOrder.id, 'Shipped', {
            tracking: trackingInfo
        });
        if (result.success) {
            toast.success("Tracking information updated");
            fetchOrders();
            setIsModalOpen(false);
        } else {
            toast.error("Failed to update tracking");
        }
    };

    const OrderIDCell = ({ order }) => (
        <td className="py-6 px-10 font-bold text-[#2563eb] text-[14.5px]">
            #{order.orderId || (order.id && order.id.substring(0, 8).toUpperCase()) || 'N/A'}
        </td>
    );

    const CustomerCell = ({ order }) => (
        <td className="py-6 px-10">
            <div className="font-bold text-slate-900 text-[15px]">{order.userName || 'swastikchamp2'}</div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                {order.isInstitutional || order.type === 'institutional' ? 'Institutional' : 'Individual'} • {order.department || 'ICU DEPT.'}
            </div>
        </td>
    );

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
                        onClick={() => { }}
                    >
                        <Download className="w-4 h-4" /> Export to CSV
                    </Button>
                    <Button
                        variant="primary"
                        className="bg-[#2563eb] hover:bg-blue-700 text-white font-bold px-6 h-[48px] rounded-xl flex items-center gap-2 shadow-xl shadow-blue-200 transition-all active:scale-95 text-sm"
                        onClick={() => { }}
                    >
                        <X className="w-4 h-4 rotate-45" /> New Manual Order
                    </Button>
                </div>
            </div>

            {/* Filters Bar card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                        <div className="flex gap-1 bg-[#f1f5f9] p-1 rounded-xl w-fit flex-nowrap">
                            {['All Orders', 'Processing', 'Shipped', 'Delivered'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setStatusFilter(tab === 'All Orders' ? 'all' : tab)}
                                    className={`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all ${(statusFilter === tab || (statusFilter === 'all' && tab === 'All Orders'))
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="h-6 w-[1px] bg-slate-100 hidden sm:block" />

                        <div className="flex items-center gap-2 flex-nowrap">
                            <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-4 py-2 text-[12px] font-bold text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 whitespace-nowrap">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span>Oct 1 - Oct 31, 2023</span>
                                <ChevronRight className="w-4 h-4 rotate-90 text-slate-400" />
                            </div>
                            <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-4 py-2 text-[12px] font-bold text-slate-700 shadow-sm cursor-pointer hover:bg-slate-50 whitespace-nowrap">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <span>Advanced Filters</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-[12px] font-medium text-slate-400 whitespace-nowrap sm:ml-auto">
                        Sorted by: <span className="text-slate-900 font-bold">Recent</span>
                        <ListFilter className="w-4 h-4 text-slate-400 ml-1" />
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
                            <h3 className="text-xl font-bold text-slate-900">No orders found</h3>
                            <p className="text-slate-400 font-medium">Try adjusting your filters or search term</p>
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
                                            <div className="flex gap-4 justify-end items-center">
                                                <button
                                                    onClick={() => { setSelectedOrder(order); setModalMode('view'); setIsModalOpen(true); }}
                                                    className="text-slate-400 hover:text-blue-600 transition-colors"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => { setSelectedOrder(order); setModalMode('tracking'); setIsModalOpen(true); }}
                                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    <Pencil className="w-4.5 h-4.5" />
                                                </button>
                                            </div>
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
                title={modalMode === 'view' ? "Order Details" : modalMode === 'tracking' ? "Shipment Details" : "Update Status"}
                size={modalMode === 'view' ? 'lg' : 'md'}
            >
                {selectedOrder && (
                    <div className="space-y-6">
                        {modalMode === 'view' && (
                            <>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Customer</p>
                                        <p className="font-semibold">{selectedOrder.userName || 'Customer'}</p>
                                        <p className="text-sm text-gray-600">{selectedOrder.userEmail}</p>
                                        <p className="text-sm text-gray-600">{selectedOrder.userPhone || 'No phone'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Shipping Address</p>
                                        <p className="text-sm text-gray-600">
                                            {selectedOrder.shippingAddress?.addressLine1 || selectedOrder.shippingAddress || 'N/A'}<br />
                                            {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.zipCode}
                                        </p>
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
                                                    {item.image && <img src={item.image} alt="" className="w-12 h-12 rounded object-cover" />}
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

                        {modalMode === 'tracking' && (
                            <form onSubmit={handleTrackingUpdate} className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
                                    <p className="text-sm text-blue-800 flex items-center gap-2">
                                        <Truck className="w-4 h-4" />
                                        Adding tracking info will update status to <strong>Shipped</strong> automatically.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Carrier</label>
                                    <select
                                        className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                                        value={trackingInfo.carrier}
                                        onChange={(e) => setTrackingInfo({ ...trackingInfo, carrier: e.target.value })}
                                    >
                                        {Object.values(SHIPPING_CARRIERS).map(c => (
                                            <option key={c.code} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <Input
                                    label="Tracking Number"
                                    placeholder="Enter tracking ID/AWA number"
                                    value={trackingInfo.trackingNumber}
                                    onChange={(e) => setTrackingInfo({ ...trackingInfo, trackingNumber: e.target.value })}
                                    required
                                />
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" variant="primary">Update Shipment</Button>
                                </div>
                            </form>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminOrdersPage;
