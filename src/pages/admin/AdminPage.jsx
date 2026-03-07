import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { formatCurrency } from "../../utils/formatUtils";
import {
    LayoutDashboard, Users, ShoppingBag, Layers, Image as ImageIcon,
    Bell, TrendingUp, ShoppingCart, Menu,
    Search, Settings, UserPlus,
    FileText, Ticket, Megaphone, ChevronDown, MoreHorizontal,
    Banknote, ShieldCheck, Box
} from "lucide-react";
import { Card, LoadingSpinner, Badge } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";

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
const StatCard = ({ title, value, icon: Icon, trend, loading, subtext = "vs last month" }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start justify-between min-w-[240px]"
        >
            <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-sm font-medium mb-4">{title}</p>
                <div className="flex items-center gap-3 flex-wrap">
                    {loading ? (
                        <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
                    ) : (
                        <h3 className="text-2xl xl:text-3xl font-bold text-gray-900">{value}</h3>
                    )}
                    {trend && (
                        <div className={`flex items-center text-sm font-semibold whitespace-nowrap ${trend.includes('-') ? 'text-red-500' : 'text-green-500'}`}>
                            {trend.includes('-') ? (
                                <TrendingUp className="w-4 h-4 mr-1 rotate-180" />
                            ) : (
                                <TrendingUp className="w-4 h-4 mr-1" />
                            )}
                            {trend.replace('-', '')}
                        </div>
                    )}
                </div>
                <p className="text-xs text-gray-400 mt-2">{subtext}</p>
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
                    fetchMonthlyRevenue(),
                    fetchProductPerformance(),
                    fetchOrderStatusDistribution(),
                    fetchUserStatistics()
                ]);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                toast.error("Failed to load dashboard data");
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

                return { id: doc.id, ...data };
            });

            // Recent Orders
            const recentOrdersQuery = query(
                collection(db, "orders"),
                orderBy("orderDate", "desc"),
                limit(5)
            );
            const recentSnapshot = await getDocs(recentOrdersQuery).catch(() => getDocs(collection(db, "orders"))); // Fallback if no orderDate index

            const recentOrders = recentSnapshot.docs.slice(0, 5).map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

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

    const fetchMonthlyRevenue = async () => {
        try {
            const now = new Date();
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(now.getMonth() - 6);

            const ordersRef = collection(db, "orders");
            const ordersSnapshot = await getDocs(ordersRef);

            const monthlyData = {};

            for (let i = 0; i < 6; i++) {
                const month = new Date();
                month.setMonth(now.getMonth() - i);
                const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
                const monthName = month.toLocaleString('default', { month: 'short' });
                monthlyData[monthKey] = { month: monthName, year: month.getFullYear(), revenue: 0, orders: 0 };
            }

            ordersSnapshot.docs.forEach(doc => {
                const data = doc.data();
                const rawDate = data.orderDate || data.createdAt || data.date;
                let orderDate = null;
                if (rawDate?.toDate) {
                    orderDate = rawDate.toDate();
                } else if (rawDate) {
                    orderDate = new Date(rawDate);
                }

                if (orderDate && orderDate >= sixMonthsAgo) {
                    const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth() + 1}`;
                    const orderTotal = data.total || data.totalAmount || data.amount || data.netAmount || 0;

                    if (monthlyData[monthKey]) {
                        monthlyData[monthKey].revenue += orderTotal;
                        monthlyData[monthKey].orders += 1;
                    }
                }
            });

            const monthlyArray = Object.values(monthlyData).sort((a, b) => {
                return a.year === b.year
                    ? new Date(0, a.month, 0) - new Date(0, b.month, 0)
                    : a.year - b.year;
            });

            setMonthlyRevenue(monthlyArray);
        } catch (error) {
            console.error("Error fetching monthly revenue:", error);
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(orderStats.totalRevenue)}
                    icon={Banknote}
                    trend="12.5%"
                    loading={loading}
                />
                <StatCard
                    title="Total Orders"
                    value={orderStats.totalOrders.toLocaleString()}
                    icon={ShoppingBag}
                    trend="8.2%"
                    loading={loading}
                />
                <StatCard
                    title="New Users"
                    value={userStats.totalUsers.toLocaleString()}
                    icon={UserPlus}
                    trend="5.4%"
                    loading={loading}
                />
                <StatCard
                    title="Pending Quotes"
                    value="12"
                    icon={FileText}
                    trend="-2.1%"
                    subtext="Immediate action required"
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
                        subtitle="Performance for the last 12 months"
                        extra={
                            <select className="text-xs bg-gray-50 border-none rounded-lg py-1 px-2 outline-none cursor-pointer">
                                <option>Yearly</option>
                                <option>Monthly</option>
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
                            {[
                                { name: 'Imaging Systems', percentage: 42, color: 'bg-blue-600' },
                                { name: 'Surgical Tools', percentage: 28, color: 'bg-blue-500' },
                                { name: 'Patient Monitoring', percentage: 18, color: 'bg-blue-400' },
                                { name: 'Diagnostic Equipment', percentage: 12, color: 'bg-blue-300' },
                            ].map((category, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 font-medium">{category.name}</span>
                                        <span className="text-gray-900 font-bold">{category.percentage}%</span>
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
                            ))}
                        </div>
                        <div className="mt-8">
                            <button className="w-full py-3 bg-gray-50 text-gray-600 text-sm font-bold rounded-xl hover:bg-gray-100 transition-colors">
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
                                    <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orderStats.recentOrders.length > 0 ? (
                                    orderStats.recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">
                                                #{order.orderId || order.id.substring(0, 8).toUpperCase()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold text-xs uppercase">
                                                        {(order.userName || 'C').charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-800">{order.userName || 'Customer'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {order.items?.[0]?.name || 'Medical Equipment'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                {formatCurrency(order.totalAmount || 0)}
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
                                                {order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Oct 24, 2023'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                                                <button className="hover:text-gray-600">
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-10 text-center text-gray-500">No recent orders</td>
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

import DashboardSidebar from "../../components/DashboardSidebar";

/**
 * Admin Home Layout Component with Sidebar
 */
const AdminPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        toast.success("Logged out successfully!");
        navigate("/signin");
    };

    const menuItems = [
        { path: "/admin", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/admin/orders", icon: ShoppingCart, label: "Orders" },
        { path: "/admin/products", icon: Box, label: "Products" },
        { path: "/admin/brands", icon: ShieldCheck, label: "Brands" },
        { path: "/admin/categories", icon: Layers, label: "Categories" },
        { path: "/admin/users", icon: Users, label: "Users" },
        { path: "/admin/coupons", icon: Ticket, label: "Coupons" },
        { path: "/admin/banners", icon: ImageIcon, label: "Banners" },
        { path: "/admin/announcements", icon: Megaphone, label: "Announcements" },
    ];

    const isDashboardRoot = location.pathname === '/admin';

    return (
        <div className="flex h-screen bg-[#f8fbff] overflow-hidden">
            <ToastContainer position="top-right" autoClose={3000} />

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
                {/* Top Bar / Header */}
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-20 sticky top-0">
                    <div className="flex items-center gap-4 flex-1 max-w-xl">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Menu className="w-6 h-6 text-gray-500" />
                        </button>
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search orders, products, or customers..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 border-r border-gray-100 pr-6">
                            <button className="relative p-2 text-gray-400 hover:text-gray-900 transition-colors">
                                <Bell className="w-6 h-6" />
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                                <Settings className="w-6 h-6" />
                            </button>
                        </div>

                        <button className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-blue-600 transition-colors">
                            <span>English (US)</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Dashboard Viewport */}
                <main className="flex-1 overflow-y-auto p-8 bg-[#f8fbff]">
                    {isDashboardRoot ? (
                        <AdminDashboard />
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <Outlet />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminPage;
