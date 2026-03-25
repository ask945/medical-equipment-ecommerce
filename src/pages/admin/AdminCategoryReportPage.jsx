import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { formatCurrency } from "../../utils/formatUtils";
import { motion } from "framer-motion";
import { ArrowLeft, Layers, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, LoadingSpinner } from "../../components/ui";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts';

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE', '#7C3AED', '#10B981', '#F59E0B', '#EF4444'];

const AdminCategoryReportPage = () => {
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalOrders, setTotalOrders] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch category labels to map slugs → display names
                const catSnapshot = await getDocs(collection(db, "categories"));
                const categoryLabels = {};
                catSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    // Map both doc id and docID field to the label
                    categoryLabels[doc.id] = data.label || doc.id;
                    if (data.docID) categoryLabels[data.docID] = data.label || data.docID;
                });

                const ordersSnapshot = await getDocs(collection(db, "orders"));
                const categoryData = {};
                let totalRev = 0;
                let orderCount = ordersSnapshot.docs.length;

                ordersSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    // Use order total (includes tax+shipping) to match dashboard
                    const orderTotal = data.total || data.totalAmount || data.amount || data.netAmount || 0;
                    totalRev += orderTotal;

                    if (data.items && Array.isArray(data.items)) {
                        data.items.forEach(item => {
                            const rawCat = item.category;
                            if (!rawCat) return; // Skip items with no category
                            // Skip services — shown separately on dashboard
                            if (rawCat === 'Services' || String(item.id || '').startsWith('service-')) return;
                            // Map slug to display label
                            const displayName = categoryLabels[rawCat] || rawCat;
                            const qty = item.quantity || item.qty || 1;
                            const rev = (item.price || 0) * qty;
                            if (!categoryData[displayName]) {
                                categoryData[displayName] = { name: displayName, revenue: 0, orders: new Set(), items: 0 };
                            }
                            categoryData[displayName].revenue += rev;
                            categoryData[displayName].orders.add(doc.id);
                            categoryData[displayName].items += qty;
                        });
                    }
                });

                // Use item-level revenue sum for percentage calc (category breakdown)
                const itemRevenue = Object.values(categoryData).reduce((s, c) => s + c.revenue, 0);
                const sorted = Object.values(categoryData)
                    .map(cat => ({
                        ...cat,
                        orders: cat.orders.size,
                        percentage: itemRevenue > 0 ? ((cat.revenue / itemRevenue) * 100).toFixed(1) : 0,
                    }))
                    .sort((a, b) => b.revenue - a.revenue);

                setCategories(sorted);
                setTotalRevenue(totalRev);
                setTotalOrders(orderCount);
            } catch (error) {
                console.error("Error fetching category report:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 shadow-xl rounded-xl border border-gray-200">
                    <p className="font-semibold text-gray-800 text-sm">{payload[0].payload.name}</p>
                    <p className="text-sm text-blue-600">{formatCurrency(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="xl" text="Loading category report..." />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <div className="flex items-center gap-4 mb-6">
                <Link
                    to="/admin"
                    className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft size={18} className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Category Report</h1>
                    <p className="text-gray-500 text-sm">Revenue breakdown by product category</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-gray-400 text-xs font-medium mb-2">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-gray-400 text-xs font-medium mb-2">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-gray-400 text-xs font-medium mb-2">Categories</p>
                    <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                </div>
            </div>

            {/* Chart */}
            {categories.length > 0 && (
                <Card title="Revenue by Category">
                    <div className="h-[350px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categories} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                                    interval={0}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={50}>
                                    {categories.map((_, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                    <Layers size={18} className="text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">All Categories</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#fcfdfe] border-b border-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">#</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Orders</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Items Sold</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Revenue</th>
                                <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">% of Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {categories.map((cat, index) => (
                                <tr key={cat.name} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-400 font-medium">{index + 1}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                            <span className="text-sm font-semibold text-gray-800">{cat.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{cat.orders}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{cat.items}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatCurrency(cat.revenue)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                                <div
                                                    className="h-1.5 rounded-full"
                                                    style={{
                                                        width: `${cat.percentage}%`,
                                                        backgroundColor: COLORS[index % COLORS.length],
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700">{cat.percentage}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminCategoryReportPage;
