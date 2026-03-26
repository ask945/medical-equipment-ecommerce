import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { collection, query, getDocs, orderBy, limit, onSnapshot } from "firebase/firestore";
import { adminDb as db } from "../../adminFirebase";
import { formatCurrency } from "../../utils/formatUtils";
import {
    LayoutDashboard, Users, ShoppingBag, Layers, Image as ImageIcon,
    ShoppingCart, Menu, RefreshCw,
    UserPlus,
    FileText, Ticket, Megaphone,
    Banknote, ShieldCheck, Box, Mail, BookOpen, Stethoscope
} from "lucide-react";
import { Card, LoadingSpinner, Badge } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import DashboardSidebar from "../../components/DashboardSidebar";
import AdminLoginPage from "./AdminLoginPage";

// Recharts imports for ESM compatibility
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, Area, AreaChart
} from 'recharts';

const Charts = {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, Area, AreaChart
};

/**
 * Animated Stat Card Component
 */
const StatCard = ({ title, value, icon: Icon, loading }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between min-w-[240px]"
        >
            <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-sm font-medium mb-4">{title}</p>
                <div className="flex items-center gap-3">
                    {loading ? (
                        <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
                    ) : value !== undefined && value !== null ? (
                        <h3 className="text-2xl xl:text-3xl font-bold text-gray-900">{value}</h3>
                    ) : (
                        <h3 className="text-xl font-bold text-gray-400">N/A</h3>
                    )}
                </div>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-xl shrink-0 ml-4">
                <Icon className="w-5 h-5 text-blue-600" />
            </div>
        </motion.div>
    );
};

/**
 * Admin Dashboard Component
 */
const AdminDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [orderStats, setOrderStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        averageOrderValue: 0,
        recentOrders: []
    });
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [productPerformance, setProductPerformance] = useState([]);
    const [statusDistribution, setStatusDistribution] = useState([]);
    const [userStats, setUserStats] = useState({
        totalUsers: 0,
        newUsersThisMonth: 0
    });
    const [inquiryCount, setInquiryCount] = useState(0);
    const [quoteCount, setQuoteCount] = useState(0);
    const [chartPeriod, setChartPeriod] = useState('monthly');
    const [topCategories, setTopCategories] = useState([]);
    const [serviceRevenue, setServiceRevenue] = useState({ revenue: 0, orders: 0 });

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const STATUS_COLORS = {
        "Placed": "#F59E0B",
        "Approved": "#3B82F6",
        "Shipped": "#8B5CF6",
        "Delivered": "#10B981",
        "Declined": "#EF4444",
        "Cancelled": "#6B7280"
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchOrderStatistics(),
                    fetchMonthlyRevenue(chartPeriod),
                    fetchProductPerformance(),
                    fetchOrderStatusDistribution(),
                    fetchUserStatistics(),
                    fetchMessageStatistics(),
                    fetchTopCategories()
                ]);
            } catch (error) {
                console.error("Critical error loading dashboard:", error);
                toast.error("Dashboard failed to load completely. Some data may be missing.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const fetchOrderStatistics = async () => {
        try {
            const ordersRef = collection(db, "orders");
            const ordersSnapshot = await getDocs(ordersRef);

            let totalRevenue = 0;
            let monthlyRev = 0;
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const orders = ordersSnapshot.docs.map(doc => {
                const data = doc.data();
                // Robust total detection: total, totalAmount, amount, netAmount
                const orderTotal = data.total || data.totalAmount || data.amount || data.netAmount || 0;
                totalRevenue += orderTotal;

                // Robust date detection: orderDate, createdAt, date
                const rawDate = data.orderDate || data.createdAt || data.date;
                let orderDate = null;
                if (rawDate?.toDate) {
                    orderDate = rawDate.toDate();
                } else if (rawDate) {
                    orderDate = new Date(rawDate);
                }

                if (orderDate && orderDate >= firstDayOfMonth) {
                    monthlyRev += orderTotal;
                }

                return { 
                    id: doc.id, 
                    orderDateObj: orderDate || new Date(0), 
                    ...data,
                    total: orderTotal // Normalize total for consistency
                };
            });

            // Recent Orders (sort in-memory to bypass Firestore missing index errors)
            const sortedOrders = [...orders].sort((a, b) => b.orderDateObj - a.orderDateObj);
            const recentOrders = sortedOrders.slice(0, 5);

            setOrderStats({
                totalOrders: orders.length,
                totalRevenue: totalRevenue,
                monthlyRevenue: monthlyRev,
                averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
                recentOrders: recentOrders
            });
        } catch (error) {
            console.error("Error fetching order statistics:", error);
        }
    };

    const fetchMonthlyRevenue = async (period = 'monthly') => {
        try {
            const now = new Date();
            const ordersRef = collection(db, "orders");
            const ordersSnapshot = await getDocs(ordersRef);

            if (period === 'yearly') {
                // Last 5 years
                const yearlyData = {};
                for (let i = 0; i < 5; i++) {
                    const year = now.getFullYear() - i;
                    yearlyData[year] = { month: String(year), year, revenue: 0, orders: 0 };
                }

                ordersSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const rawDate = data.orderDate || data.createdAt || data.date;
                    let orderDate = rawDate?.toDate ? rawDate.toDate() : rawDate ? new Date(rawDate) : null;
                    if (orderDate && yearlyData[orderDate.getFullYear()]) {
                        const orderTotal = data.total || data.totalAmount || data.amount || data.netAmount || 0;
                        yearlyData[orderDate.getFullYear()].revenue += orderTotal;
                        yearlyData[orderDate.getFullYear()].orders += 1;
                    }
                });

                setMonthlyRevenue(Object.values(yearlyData).sort((a, b) => a.year - b.year));
            } else {
                // Last 5 months
                const fiveMonthsAgo = new Date();
                fiveMonthsAgo.setMonth(now.getMonth() - 5);
                fiveMonthsAgo.setDate(1);

                const monthlyData = {};
                for (let i = 0; i < 5; i++) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const monthKey = `${d.getFullYear()}-${d.getMonth() + 1}`;
                    monthlyData[monthKey] = { month: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), revenue: 0, orders: 0 };
                }

                ordersSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const rawDate = data.orderDate || data.createdAt || data.date;
                    let orderDate = rawDate?.toDate ? rawDate.toDate() : rawDate ? new Date(rawDate) : null;
                    if (orderDate && orderDate >= fiveMonthsAgo) {
                        const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}`;
                        const orderTotal = data.total || data.totalAmount || data.amount || data.netAmount || 0;
                        if (monthlyData[monthKey]) {
                            monthlyData[monthKey].revenue += orderTotal;
                            monthlyData[monthKey].orders += 1;
                        }
                    }
                });

                const monthlyArray = Object.values(monthlyData).sort((a, b) =>
                    a.year === b.year ? new Date(2000, new Date(`${a.month} 1`).getMonth()) - new Date(2000, new Date(`${b.month} 1`).getMonth()) : a.year - b.year
                );
                setMonthlyRevenue(monthlyArray);
            }
        } catch (error) {
            console.error("Error fetching revenue data:", error);
        }
    };

    const fetchProductPerformance = async () => {
        try {
            const ordersRef = collection(db, "orders");
            const ordersSnapshot = await getDocs(ordersRef);

            const productSales = {};

            ordersSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.items && Array.isArray(data.items)) {
                    data.items.forEach(item => {
                        const name = item.name || item.title || 'Product';
                        if (!productSales[name]) {
                            productSales[name] = {
                                name: name,
                                quantity: 0,
                                revenue: 0
                            };
                        }
                        const qty = item.quantity || item.qty || 1;
                        const price = item.price || 0;
                        productSales[name].quantity += qty;
                        productSales[name].revenue += (price * qty);
                    });
                }
            });

            const productArray = Object.values(productSales)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);

            setProductPerformance(productArray);
        } catch (error) {
            console.error("Error fetching product performance:", error);
        }
    };

    const fetchOrderStatusDistribution = async () => {
        try {
            const ordersRef = collection(db, "orders");
            const ordersSnapshot = await getDocs(ordersRef);

            const statusCounts = {};

            ordersSnapshot.docs.forEach(doc => {
                const data = doc.data();
                const status = data.status || "Placed";

                if (!statusCounts[status]) {
                    statusCounts[status] = { status, count: 0 };
                }
                statusCounts[status].count += 1;
            });

            const statusArray = Object.values(statusCounts);
            setStatusDistribution(statusArray);
        } catch (error) {
            console.error("Error fetching status distribution:", error);
        }
    };

    const fetchUserStatistics = async () => {
        try {
            const usersRef = collection(db, "users");
            const usersSnapshot = await getDocs(usersRef);

            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            let newUsersCount = 0;

            usersSnapshot.docs.forEach(doc => {
                const data = doc.data();
                const rawDate = data.createdAt || data.date;
                let createdAt = null;
                if (rawDate?.toDate) {
                    createdAt = rawDate.toDate();
                } else if (rawDate) {
                    createdAt = new Date(rawDate);
                }

                if (createdAt && createdAt >= firstDayOfMonth) {
                    newUsersCount++;
                }
            });

            setUserStats({
                totalUsers: usersSnapshot.docs.length,
                newUsersThisMonth: newUsersCount
            });
        } catch (error) {
            console.warn("User statistics restricted:", error.message);
            // Optionally set default values if permissions are missing
            setUserStats({ totalUsers: 0, newUsersThisMonth: 0 });
        }
    };

    const fetchMessageStatistics = async () => {
        try {
            const [inqSnap, quoteSnap] = await Promise.all([
                getDocs(collection(db, "inquiries")),
                getDocs(collection(db, "quotes"))
            ]);
            setInquiryCount(inqSnap.docs.filter(d => d.data().status === 'pending').length);
            setQuoteCount(quoteSnap.docs.filter(d => d.data().status === 'pending').length);
        } catch (error) {
            if (error.code === 'permission-denied') {
                console.warn("Firebase: Missing permissions for inquiries or quotes collections. Review security rules.");
            } else {
                console.error("Message stats failed:", error);
            }
        }
    };

    const fetchTopCategories = async () => {
        try {
            // Fetch category labels to map slugs → display names
            const catSnapshot = await getDocs(collection(db, "categories"));
            const categoryLabels = {};
            catSnapshot.docs.forEach(d => {
                const data = d.data();
                categoryLabels[d.id] = data.label || d.id;
                if (data.docID) categoryLabels[data.docID] = data.label || data.docID;
            });

            const ordersRef = collection(db, "orders");
            const ordersSnapshot = await getDocs(ordersRef);
            const categoryData = {};
            let totalRevenue = 0;
            let svcRevenue = 0;
            let svcOrders = 0;

            ordersSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.items && Array.isArray(data.items)) {
                    data.items.forEach(item => {
                        const rawCat = item.category;
                        if (!rawCat) return;
                        const rev = (item.price || 0) * (item.quantity || item.qty || 1);

                        // Separate Services from product categories
                        if (rawCat === 'Services' || String(item.id || '').startsWith('service-')) {
                            svcRevenue += rev;
                            svcOrders += 1;
                            return;
                        }

                        const displayName = categoryLabels[rawCat] || rawCat;
                        totalRevenue += rev;
                        if (!categoryData[displayName]) {
                            categoryData[displayName] = { name: displayName, revenue: 0, orders: 0 };
                        }
                        categoryData[displayName].revenue += rev;
                        categoryData[displayName].orders += 1;
                    });
                }
            });

            setServiceRevenue({ revenue: svcRevenue, orders: svcOrders });

            const colors = ['bg-blue-600', 'bg-blue-500', 'bg-blue-400', 'bg-blue-300', 'bg-blue-200'];
            const sorted = Object.values(categoryData)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 5)
                .map((cat, i) => ({
                    ...cat,
                    percentage: totalRevenue > 0 ? Math.round((cat.revenue / totalRevenue) * 100) : 0,
                    color: colors[i] || 'bg-gray-300',
                }));

            setTopCategories(sorted);
        } catch (error) {
            console.error("Error fetching top categories:", error);
        }
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 shadow-xl rounded-xl border border-gray-200">
                    <p className="font-semibold text-gray-800 mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.name === "Revenue" || entry.name === "revenue" ? formatCurrency(entry.value) : entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading && orderStats.totalOrders === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="xl" text="Loading dashboard data..." />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Layout Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-500">Welcome back, here's what's happening today across your medical store.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(orderStats.totalRevenue)}
                    icon={Banknote}
                    loading={loading}
                />
                <StatCard
                    title="Total Orders"
                    value={orderStats.totalOrders.toLocaleString()}
                    icon={ShoppingBag}
                    loading={loading}
                />
                <StatCard
                    title="Pending Inquiries"
                    value={inquiryCount.toLocaleString()}
                    icon={Mail}
                    loading={loading}
                />
                <StatCard
                    title="Pending Quotes"
                    value={quoteCount.toLocaleString()}
                    icon={FileText}
                    loading={loading}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Revenue Chart */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card
                        title="Sales Trends"
                        subtitle={chartPeriod === 'yearly' ? 'Revenue for the last 5 years' : 'Revenue for the last 5 months'}
                        extra={
                            <select
                                value={chartPeriod}
                                onChange={(e) => {
                                    setChartPeriod(e.target.value);
                                    fetchMonthlyRevenue(e.target.value);
                                }}
                                className="text-xs bg-white border border-gray-200 rounded-lg py-1.5 px-3 outline-none cursor-pointer text-gray-700 font-medium focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-colors"
                            >
                                <option value="monthly">Monthly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        }
                    >
                        {monthlyRevenue.length > 0 ? (
                            <div className="h-[400px] w-full mt-4" style={{ minHeight: '400px' }}>
                                <Charts.ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <Charts.BarChart
                                        data={monthlyRevenue}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                        barGap={8}
                                    >
                                        <Charts.XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <Charts.Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                        <Charts.Bar
                                            dataKey="revenue"
                                            radius={[6, 6, 0, 0]}
                                            barSize={40}
                                        >
                                            {monthlyRevenue.map((entry, index) => (
                                                <Charts.Cell
                                                    key={`cell-${index}`}
                                                    fill={index === monthlyRevenue.length - 1 ? '#2563EB' : '#BFDBFE'}
                                                />
                                            ))}
                                        </Charts.Bar>
                                    </Charts.BarChart>
                                </Charts.ResponsiveContainer>
                            </div>
                        ) : (
                            <p className="text-center py-10 text-gray-500">No revenue data available</p>
                        )}
                    </Card>
                </motion.div>

                {/* Top Categories */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card
                        title="Top Categories"
                    >
                        <div className="space-y-6 mt-4">
                            {topCategories.length > 0 ? topCategories.map((category, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 font-medium">{category.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 text-xs">{formatCurrency(category.revenue)}</span>
                                            <span className="text-gray-900 font-bold">{category.percentage}%</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${category.percentage}%` }}
                                            transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                                            className={`${category.color} h-2 rounded-full`}
                                        />
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center py-6 text-gray-400 text-sm">No category data available</p>
                            )}

                            {/* Service Revenue - shown separately */}
                            {serviceRevenue.revenue > 0 && (
                                <div className="mt-6 pt-5 border-t border-gray-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Service Revenue</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-emerald-50 rounded-xl p-4">
                                        <div>
                                            <p className="text-lg font-bold text-emerald-700">{formatCurrency(serviceRevenue.revenue)}</p>
                                            <p className="text-xs text-emerald-500 font-medium">{serviceRevenue.orders} service orders</p>
                                        </div>
                                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                            <Stethoscope className="w-5 h-5 text-emerald-600" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="mt-8">
                            <button
                                onClick={() => navigate('/admin/categories/report')}
                                className="w-full py-3 bg-gray-50 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                View Full Report
                            </button>
                        </div>
                    </Card>
                </motion.div>
            </div>


            {/* Recent Orders */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-2"
            >
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 flex items-center justify-between border-b border-gray-50">
                        <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
                        <Link to="/admin/orders" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                            View All Orders
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#fcfdfe] border-b border-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orderStats.recentOrders.length > 0 ? (
                                    orderStats.recentOrders.map((order) => (
                                        <tr key={order.id} onClick={() => navigate(`/admin/orders/${order.id}`)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                                                #{order.orderId || order.id.substring(0, 8).toUpperCase()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold text-xs uppercase">
                                                        {(order.userName || 'C').charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-800">
                                                        {order.userName || 
                                                         (order.shippingAddress?.firstName 
                                                          ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ''}` 
                                                          : 'Customer')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {order.items?.[0]?.name || 'Medical Equipment'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                {formatCurrency(order.total || 0)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge
                                                    variant={
                                                        order.status === 'Delivered' ? 'success' :
                                                            order.status === 'Shipped' ? 'blue' :
                                                                order.status === 'Placed' ? 'warning' :
                                                                    order.status === 'Cancelled' ? 'danger' :
                                                                        'default'
                                                    }
                                                    className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
                                                >
                                                    {order.status || 'Placed'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {order.orderDateObj ? order.orderDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
                                                <p className="font-bold text-lg">No orders found</p>
                                                <p className="text-sm">You haven't received any orders yet.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
/**
 * Admin Home Layout Component with Sidebar
 */
const AdminPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, signOut, loading } = useAuth();

    // Admin Session Verification — uses window flag so it resets on page reload
    const [isAdminVerified, setIsAdminVerified] = useState(
        window.__adminVerified === true
    );

    const [refreshKey, setRefreshKey] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    // Real-time check: force logout if current admin is disabled or deleted
    useEffect(() => {
        if (!isAdminVerified) return;

        const adminEmail = sessionStorage.getItem("admin_email");
        const adminId = sessionStorage.getItem("admin_id");
        if (!adminEmail) return;

        const unsubAdmins = onSnapshot(collection(db, "admins"), (snapshot) => {
            const admins = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            const myDoc = admins.find(a => a.id === adminId || a.email === adminEmail);

            if (!myDoc || myDoc.isDeleted) {
                toast.error("Your admin account has been deleted. Logging out...", { autoClose: 3000 });
                window.__adminVerified = false;
                sessionStorage.removeItem("admin_email");
                sessionStorage.removeItem("admin_role");
                sessionStorage.removeItem("admin_id");
                sessionStorage.removeItem("admin_verified");
                setIsAdminVerified(false);
                navigate("/admin");
                return;
            }

            if (myDoc.isDisabled) {
                toast.error("Your account has been disabled by a Super Admin. Logging out...", { autoClose: 3000 });
                window.__adminVerified = false;
                sessionStorage.removeItem("admin_email");
                sessionStorage.removeItem("admin_role");
                sessionStorage.removeItem("admin_id");
                sessionStorage.removeItem("admin_verified");
                setIsAdminVerified(false);
                navigate("/admin");
            }
        });

        return () => unsubAdmins();
    }, [isAdminVerified]);

    const handleRefreshData = () => {
        setRefreshing(true);
        setRefreshKey(prev => prev + 1);
        setTimeout(() => {
            setRefreshing(false);
            toast.success("Admin data refreshed!");
        }, 1000);
    };

    const handleLogout = async () => {
        window.__adminVerified = false;
        sessionStorage.removeItem("admin_verified");
        sessionStorage.removeItem("admin_email");
        setIsAdminVerified(false);
        toast.success("Logged out of Admin Panel!");
        navigate("/admin");
    };

    const handleAdminVerify = (status) => {
        window.__adminVerified = status;
        setIsAdminVerified(status);
        if (status) {
            toast.success("Identity verified. Welcome to Admin Panel.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fbff] flex items-center justify-center">
                <LoadingSpinner size="xl" text="Verifying session..." />
            </div>
        );
    }

    // If not verified, show the dedicated admin login
    if (!isAdminVerified) {
        return <AdminLoginPage onVerify={handleAdminVerify} />;
    }

    const menuItems = [
        { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/admin/orders", icon: ShoppingCart, label: "Orders" },
        { path: "/admin/products", icon: Box, label: "Products" },
        { path: "/admin/brands", icon: ShieldCheck, label: "Brands" },
        { path: "/admin/categories", icon: Layers, label: "Categories" },
        { path: "/admin/users", icon: Users, label: "Users" },
        { path: "/admin/coupons", icon: Ticket, label: "Coupons" },
        { path: "/admin/blog", icon: BookOpen, label: "Blog Management" },
        { path: "/admin/inquiries", icon: Mail, label: "Contact Inquiries" },
        { path: "/admin/quotes", icon: FileText, label: "Requested Quotes" },
        // { path: "/admin/banners", icon: ImageIcon, label: "Banners" },
        // { path: "/admin/announcements", icon: Megaphone, label: "Announcements" },
    ];

    const isDashboardRoot = location.pathname === '/admin';

    return (
        <div className="flex h-screen bg-[#f8fbff] overflow-hidden">
            {/* Sidebar - Desktop */}
            <DashboardSidebar
                menuItems={menuItems}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Mobile Menu */}
            <DashboardSidebar
                menuItems={menuItems}
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                isMobile={true}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <div className="flex items-center justify-between px-8 py-3 bg-white border-b border-gray-100">
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="lg:hidden inline-flex items-center justify-center p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        <Menu className="w-5 h-5 text-gray-500" />
                    </button>
                    <div className="hidden lg:block" />
                    <button
                        onClick={handleRefreshData}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="Refresh all admin data"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        Reload Data
                    </button>
                </div>
                {/* Dashboard Viewport */}
                <main className="flex-1 overflow-y-auto p-8 bg-[#f8fbff] relative">
                    <div key={refreshKey}>
                        {isDashboardRoot ? (
                            <AdminDashboard />
                        ) : (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <Outlet />
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminPage;
