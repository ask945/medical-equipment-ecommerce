import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ChevronLeft, ShoppingBag, Truck, MapPin,
    User, Phone, Mail, Calendar, Hash,
    Clock, CheckCircle, AlertCircle, Trash2,
    Copy, ExternalLink, Package, CreditCard,
    ArrowRight, Printer, Download
} from 'lucide-react';
import AdminOrderService, { ORDER_STATUSES, SHIPPING_CARRIERS } from '../../utils/adminOrderService';
import { formatCurrency } from '../../utils/formatUtils';
import { Button, LoadingSpinner, Input, Badge, Card } from '../../components/ui';
import { toast } from 'react-toastify';

const AdminOrderDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchOrder = useCallback(async () => {
        setLoading(true);
        const result = await AdminOrderService.getOrderById(id);
        if (result.success) {
            setOrder(result.order);
        } else {
            toast.error("Failed to fetch order details");
            navigate('/admin/orders');
        }
        setLoading(false);
    }, [id, navigate]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    const handleStatusUpdate = async (newStatus) => {
        if (!order) return;
        setIsUpdating(true);
        try {
            const result = await AdminOrderService.updateOrderStatus(order.id, newStatus);
            if (result.success) {
                toast.success(`Order set to ${newStatus}`);
                fetchOrder();
            } else {
                console.error('Status update failed:', result.error);
                toast.error(`Status update failed: ${result.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Status update exception:', err);
            toast.error(`Status update error: ${err.message}`);
        }
        setIsUpdating(false);
    };


    const copyToClipboard = (text, label) => {
        navigator.clipboard.writeText(text);
        toast.info(`${label} copied!`, { autoClose: 1000 });
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="xl" text="Retrieving detailed order info..." />
            </div>
        );
    }

    if (!order) return null;

    const StatusIcon = ({ status }) => {
        switch (status) {
            case 'Placed': return <Clock className="w-5 h-5 text-orange-500" />;
            case 'Processing': return <Package className="w-5 h-5 text-blue-500" />;
            case 'Shipped': return <Truck className="w-5 h-5 text-purple-500" />;
            case 'Delivered': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'Cancelled':
            case 'Declined': return <AlertCircle className="w-5 h-5 text-red-500" />;
            default: return <Clock className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStatusTheme = (status) => {
        const themes = {
            'Placed': 'bg-orange-50 text-orange-600 border-orange-100',
            'Processing': 'bg-blue-50 text-blue-600 border-blue-100',
            'Shipped': 'bg-purple-50 text-purple-600 border-purple-100',
            'Delivered': 'bg-green-50 text-green-600 border-green-100',
            'Cancelled': 'bg-red-50 text-red-600 border-red-100',
            'Declined': 'bg-red-50 text-red-600 border-red-100',
        };
        return themes[status] || 'bg-gray-50 text-gray-600 border-gray-100';
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-12">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .no-print, button, nav, header, footer { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white !important; padding: 0 !important; }
                    .max-w-6xl { max-width: 100% !important; margin: 0 !important; }
                    .shadow-sm, .shadow-xl { shadow: none !important; border: 1px solid #eee !important; }
                    .bg-slate-50\/50, .bg-slate-50 { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
                }
            ` }} />
            {/* Navigation Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="p-2.5 rounded-xl bg-white border border-gray-100 hover:border-blue-100 hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all no-print"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-black text-slate-900">
                                Order #{order.orderId || order.id.substring(0, 8).toUpperCase()}
                            </h1>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusTheme(order.status)}`}>
                                {order.status}
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">
                            Placed on {new Date(order.orderDate).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 no-print">
                    <Button variant="outline" onClick={handlePrint} className="h-11 px-5 font-bold border-gray-200 text-slate-600 flex items-center gap-2">
                        <Printer className="w-4 h-4" /> Print Invoice
                    </Button>
                    <Button variant="outline" onClick={handlePrint} className="h-11 px-5 font-bold border-gray-200 text-slate-600 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Download PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content: Items and Billing */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Items Card */}
                    <Card className="border-none shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-blue-600" /> Order Items ({order.items?.length || 0})
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {(order.items || []).map((item, idx) => (
                                <div key={idx} className="p-6 flex items-center gap-6 group hover:bg-slate-50/50 transition-colors">
                                    {!(item.category === 'Services' || item.type === 'Services' || (item.id && String(item.id).startsWith('service-'))) && (
                                        <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 relative">
                                            <img
                                                src={item.image || 'https://via.placeholder.com/100'}
                                                alt=""
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                            {item.name || item.title || 'Product Item'}
                                        </h4>
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                            {item.brand || 'MedEquip'} • {item.type || 'Diagnostics'}
                                        </p>
                                        <div className="flex items-center gap-4 mt-3">
                                            <span className="text-[13px] font-bold py-1 px-3 bg-slate-100 text-slate-600 rounded-lg">
                                                Qty: {item.quantity || item.qty || 1}
                                            </span>
                                            <span className="text-[13px] font-bold text-blue-600">
                                                {formatCurrency(item.price || 0)} each
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-900">
                                            {formatCurrency((item.price || 0) * (item.quantity || item.qty || 1))}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Summary Section */}
                        <div className="bg-slate-50/50 p-6 space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Subtotal</span>
                                <span className="text-slate-900 font-bold">{formatCurrency(order.total || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Shipping & Handling</span>
                                <span className="text-green-600 font-bold">Free</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 font-medium">Estimated Tax</span>
                                <span className="text-slate-900 font-bold">{formatCurrency(0)}</span>
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-lg font-black text-slate-900">Order Totals</span>
                                <span className="text-3xl font-black text-blue-600">{formatCurrency(order.total || 0)}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Quick Controls */}
                    <Card className="p-6 border-none shadow-sm no-print">
                        <h3 className="font-bold text-slate-900 mb-6">Manage Order Status</h3>
                        <div className="flex flex-wrap gap-3">
                            {Object.values(ORDER_STATUSES).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusUpdate(status)}
                                    disabled={isUpdating || order.status === status}
                                    className={`px-5 py-3 rounded-xl text-[13px] font-bold transition-all border flex items-center gap-2
                                        ${order.status === status
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                                            : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/30'
                                        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${order.status === status ? 'bg-white' : 'bg-slate-300'}`} />
                                    {status}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Sidebar: Customer Info & Tracking */}
                <div className="space-y-8">
                    {/* Customer Detail */}
                    <Card className="p-6 border-none shadow-sm space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Customer Profile</h3>
                            <button onClick={() => copyToClipboard(order.userEmail, 'Email')} className="text-slate-400 hover:text-blue-600 transition-colors">
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 text-lg font-black">
                                {(order.userName || order.shippingAddress?.firstName || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-[16px] mb-1">
                                    {order.userName || 
                                     (order.shippingAddress?.firstName && order.shippingAddress?.lastName 
                                        ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}` 
                                        : order.shippingAddress?.name) || 
                                     'Guest Customer'}
                                </h4>
                                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider
                                    ${(order.userType === 'Institutional' || order.isInstitutional) ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {(order.userType === 'Institutional' || order.isInstitutional) ? 'Institutional Account' : 'Individual Account'}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-3 text-slate-600">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span className="text-[13px] font-medium">{order.userEmail}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span className="text-[13px] font-medium">{order.userPhone || order.shippingAddress?.phone || 'No phone provided'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <CreditCard className="w-4 h-4 text-slate-400" />
                                <span className="text-[13px] font-medium capitalize">Payment Method: {order.paymentMethod || 'Razorpay Online'}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Delivery Address */}
                    <Card className="p-6 border-none shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest">Shipping Address</h3>
                            <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                                {typeof order.shippingAddress === 'string' ? (
                                    order.shippingAddress
                                ) : (
                                    <>
                                        {(order.shippingAddress?.firstName && order.shippingAddress?.lastName) && (
                                            <p className="font-bold mb-1">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                                        )}
                                        {order.shippingAddress?.streetAddress || order.shippingAddress?.street || order.shippingAddress?.addressLine1 || order.shippingAddress?.name || 'N/A'}<br />
                                        {[
                                            order.shippingAddress?.city,
                                            order.shippingAddress?.state,
                                            order.shippingAddress?.zipCode || order.shippingAddress?.zip
                                        ].filter(Boolean).join(', ')}
                                        {order.shippingAddress?.country && <><br />{order.shippingAddress.country}</>}
                                        {order.shippingAddress?.phone && <><br />Phone: {order.shippingAddress.phone}</>}
                                    </>
                                )}
                            </p>
                        </div>
                        <button
                            className="w-full text-center py-2 text-[12px] font-bold text-blue-600 hover:underline flex items-center justify-center gap-1"
                            onClick={() => {
                                const addr = typeof order.shippingAddress === 'string'
                                    ? order.shippingAddress
                                    : [
                                        order.shippingAddress?.street || order.shippingAddress?.addressLine1 || '',
                                        order.shippingAddress?.city || '',
                                        order.shippingAddress?.state || '',
                                        order.shippingAddress?.country || ''
                                    ].filter(Boolean).join(', ');
                                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`, '_blank');
                            }}
                        >
                            Open in Google Maps <ExternalLink className="w-3 h-3" />
                        </button>
                    </Card>

                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetailPage;
