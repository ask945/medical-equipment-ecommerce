import { useState, useEffect, useMemo } from "react";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { motion } from "framer-motion";
import {
    Plus,
    Check,
    AlertCircle,
    Download, Gift, TrendingUp, TrendingDown,
    Banknote, Edit, Trash2
} from "lucide-react";
import { Modal, Button, Card, LoadingSpinner, Badge, Input } from "../../components/ui";
import { toast } from "react-toastify";
import { formatCurrency } from "../../utils/formatUtils";
import { exportToCSV } from "../../utils/csvUtils";

/**
 * AdminCouponsPage Component
 * Provides a premium interface for managing discount coupons
 * Redesigned to match medical equipment ecommerce aesthetic
 */
const AdminCouponsPage = () => {
    // State variables
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState(null);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState("");
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [orders, setOrders] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // New coupon state with default values
    const [newCoupon, setNewCoupon] = useState({
        code: "",
        discountType: "percentage", // percentage or fixed
        discountValue: 0,
        maxUses: 0, // 0 for unlimited
        usedCount: 0,
        minOrderAmount: 0,
        maxDiscountAmount: 0, // 0 for no limit
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        isActive: true, // Renamed from isActive for clarity if needed, keeping consistency with existing
        description: "",
        applicableProducts: [], // Empty array means applicable to all products
        isProductSpecific: false,
        targetAudience: "All", // Added for redesign: All, B2B, FirstTime
    });

    useEffect(() => {
        fetchCoupons();
        fetchProducts();
        fetchOrders();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const couponsCollection = collection(db, "coupons");
            const couponsSnapshot = await getDocs(couponsCollection);
            const couponsList = couponsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                isProductSpecific: doc.data().applicableProducts && doc.data().applicableProducts.length > 0,
            }));
            setCoupons(couponsList);
        } catch (error) {
            console.error("Error fetching coupons:", error);
            toast.error("Failed to load coupons");
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const productsCollection = collection(db, "products");
            const productsSnapshot = await getDocs(productsCollection);
            const productsList = productsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setProducts(productsList);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchOrders = async () => {
        try {
            const snapshot = await getDocs(collection(db, "orders"));
            setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.warn("Failed to fetch orders for coupon stats:", err);
        }
    };

    // Calculate Stats from real order data
    const stats = useMemo(() => {
        const active = coupons.filter(c => c.isActive && !isCouponExpired(c.endDate)).length;

        // Real redemptions and volume from orders
        const now = new Date();
        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const ordersWithCoupon = orders.filter(o => o.couponCode);
        const totalRedemptions = ordersWithCoupon.length;
        const totalVolume = ordersWithCoupon.reduce((sum, o) => sum + (Number(o.couponDiscount) || 0), 0);

        // Also count from usedCount on coupons (for any that were incremented)
        const usedCountTotal = coupons.reduce((sum, c) => sum + (Number(c.usedCount) || 0), 0);
        const redemptions = Math.max(totalRedemptions, usedCountTotal);

        // Month-over-month for redemptions
        const getOrderDate = (o) => o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : (o.createdAt ? new Date(o.createdAt) : null);
        const thisMonthRedemptions = ordersWithCoupon.filter(o => { const d = getOrderDate(o); return d && d >= firstDayThisMonth; }).length;
        const lastMonthRedemptions = ordersWithCoupon.filter(o => { const d = getOrderDate(o); return d && d >= firstDayLastMonth && d < firstDayThisMonth; }).length;
        const redemptionGrowth = lastMonthRedemptions > 0 ? Math.round(((thisMonthRedemptions - lastMonthRedemptions) / lastMonthRedemptions) * 100) : 0;

        // Month-over-month for volume
        const thisMonthVolume = ordersWithCoupon.filter(o => { const d = getOrderDate(o); return d && d >= firstDayThisMonth; }).reduce((s, o) => s + (Number(o.couponDiscount) || 0), 0);
        const lastMonthVolume = ordersWithCoupon.filter(o => { const d = getOrderDate(o); return d && d >= firstDayLastMonth && d < firstDayThisMonth; }).reduce((s, o) => s + (Number(o.couponDiscount) || 0), 0);
        const volumeGrowth = lastMonthVolume > 0 ? Math.round(((thisMonthVolume - lastMonthVolume) / lastMonthVolume) * 100) : 0;

        // Active coupons growth (compare with last month)
        const lastMonthActive = coupons.filter(c => {
            const created = c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000) : (c.createdAt ? new Date(c.createdAt) : null);
            return created && created < firstDayThisMonth && c.isActive && !isCouponExpired(c.endDate);
        }).length;
        const activeGrowth = lastMonthActive > 0 ? Math.round(((active - lastMonthActive) / lastMonthActive) * 100) : 0;

        return {
            active,
            activeGrowth,
            redemptions: redemptions.toLocaleString(),
            redemptionGrowth,
            volume: formatCurrency(totalVolume),
            volumeGrowth
        };
    }, [coupons, orders]);

    const handleAddCoupon = async () => {
        if (!newCoupon.code) {
            toast.error("Please enter a coupon code");
            return;
        }

        if (newCoupon.discountValue <= 0) {
            toast.error("Discount value must be greater than zero");
            return;
        }

        if (newCoupon.discountType === "percentage" && newCoupon.discountValue > 100) {
            toast.error("Percentage discount cannot exceed 100%");
            return;
        }

        const existingCoupon = coupons.find(
            coupon => coupon.code.toLowerCase() === newCoupon.code.toLowerCase()
        );

        if (existingCoupon) {
            toast.error("A coupon with this code already exists");
            return;
        }

        setIsSubmitting(true);
        setSubmissionStatus("submitting");

        try {
            const couponToSave = {
                ...newCoupon,
                createdAt: new Date(),
                code: newCoupon.code.toUpperCase(),
                discountValue: Number(newCoupon.discountValue),
                maxUses: Number(newCoupon.maxUses),
                minOrderAmount: Number(newCoupon.minOrderAmount),
                maxDiscountAmount: Number(newCoupon.maxDiscountAmount),
                isProductSpecific: newCoupon.isProductSpecific,
                applicableProducts: newCoupon.isProductSpecific ? newCoupon.applicableProducts : [],
            };

            await addDoc(collection(db, "coupons"), couponToSave);

            setNewCoupon({
                code: "",
                discountType: "percentage",
                discountValue: 0,
                maxUses: 0,
                usedCount: 0,
                minOrderAmount: 0,
                maxDiscountAmount: 0,
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
                isActive: true,
                description: "",
                applicableProducts: [],
                isProductSpecific: false,
                targetAudience: "All",
            });
            setSelectedProducts([]);
            toast.success("Coupon created successfully");
            fetchCoupons();
        } catch (error) {
            console.error("Error adding coupon:", error);
            toast.error("Failed to create coupon");
        } finally {
            setIsSubmitting(false);
            setSubmissionStatus(null);
        }
    };

    const startEditCoupon = (coupon) => {
        setSelectedProducts(
            products.filter(product =>
                coupon.applicableProducts && coupon.applicableProducts.includes(product.id)
            )
        );

        setEditingCoupon({
            ...coupon,
            startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
            isProductSpecific: coupon.isProductSpecific || (coupon.applicableProducts && coupon.applicableProducts.length > 0),
            targetAudience: coupon.targetAudience || "All",
        });
    };

    const handleUpdateCoupon = async () => {
        if (!editingCoupon) return;

        setIsSubmitting(true);
        try {
            const couponRef = doc(db, "coupons", editingCoupon.id);
            const couponToUpdate = {
                ...editingCoupon,
                code: editingCoupon.code.toUpperCase(),
                discountValue: Number(editingCoupon.discountValue),
                maxUses: Number(editingCoupon.maxUses),
                minOrderAmount: Number(editingCoupon.minOrderAmount),
                maxDiscountAmount: Number(editingCoupon.maxDiscountAmount),
                updatedAt: new Date(),
                isProductSpecific: editingCoupon.isProductSpecific,
                applicableProducts: editingCoupon.isProductSpecific ? editingCoupon.applicableProducts : [],
            };

            const cleanCoupon = { ...couponToUpdate };
            delete cleanCoupon.id;

            await updateDoc(couponRef, cleanCoupon);
            toast.success("Coupon updated successfully");
            setEditingCoupon(null);
            setSelectedProducts([]);
            fetchCoupons();
        } catch (error) {
            console.error("Error updating coupon:", error);
            toast.error("Failed to update coupon");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCoupon = async () => {
        if (!deleteConfirm) return;
        try {
            await deleteDoc(doc(db, "coupons", deleteConfirm.id));
            toast.success("Coupon deleted successfully");
            setCoupons(coupons.filter(coupon => coupon.id !== deleteConfirm.id));
            setDeleteConfirm(null);
        } catch (error) {
            console.error("Error deleting coupon:", error);
            toast.error("Failed to delete coupon");
        }
    };

    function isCouponExpired(endDate) {
        if (!endDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const couponEndDate = new Date(endDate);
        return couponEndDate < today;
    }

    const generateCouponCode = () => {
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        const length = 8;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        const codeExists = coupons.some(coupon => coupon.code === result);
        if (codeExists) return generateCouponCode();

        if (editingCoupon) {
            setEditingCoupon({ ...editingCoupon, code: result });
        } else {
            setNewCoupon({ ...newCoupon, code: result });
        }
    };

    const toggleProductSelection = (product) => {
        const isEditing = !!editingCoupon;
        const currentCoupon = isEditing ? editingCoupon : newCoupon;
        const currentProducts = currentCoupon.applicableProducts || [];
        const isSelected = currentProducts.includes(product.id);

        const updatedProducts = isSelected
            ? currentProducts.filter(id => id !== product.id)
            : [...currentProducts, product.id];

        setSelectedProducts(
            products.filter(p => updatedProducts.includes(p.id))
        );

        if (isEditing) {
            setEditingCoupon({ ...editingCoupon, applicableProducts: updatedProducts });
        } else {
            setNewCoupon({ ...newCoupon, applicableProducts: updatedProducts });
        }
    };

    const filteredProducts = productSearchTerm
        ? products.filter(p =>
            p.name?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
            (p.brand || "").toLowerCase().includes(productSearchTerm.toLowerCase())
        )
        : products;

    const renderStatCard = (title, value, icon, change, colorClass) => (
        <Card className="flex-1 min-w-[280px]">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${colorClass}`}>
                    {icon}
                </div>
            </div>
            {change !== null && change !== undefined && (
                <div className="flex items-center gap-1">
                    {String(change).startsWith('+') ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : String(change).startsWith('-') ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                    ) : null}
                    <span className={`text-xs font-semibold ${String(change).startsWith('-') ? 'text-red-500' : 'text-green-500'}`}>
                        {change} from last month
                    </span>
                </div>
            )}
        </Card>
    );

    const renderCouponForm = (couponData, setCouponData, submitHandler, isEdit) => {
        const audienceOptions = [
            { id: 'B2B', title: 'B2B Partners', desc: 'Corporate and hospital accounts' },
            { id: 'FirstTime', title: 'First-time Buyers', desc: 'One-time use for new registration' },
            { id: 'All', title: 'All Customers', desc: 'General public promotion' }
        ];

        return (
            <Card className="h-full border-none shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-blue-600 p-1.5 rounded-full text-white">
                        <Plus className="w-4 h-4" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEdit ? "Edit Coupon" : "Create New Coupon"}
                    </h2>
                </div>

                <div className="space-y-6">
                    <Input
                        label="Coupon Code"
                        placeholder="E.G. NEW2024"
                        value={couponData.code}
                        onChange={(e) => setCouponData({ ...couponData, code: e.target.value.toUpperCase() })}
                        className="bg-gray-50/50 border-gray-200"
                    />

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                            <select
                                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-[42px]"
                                value={couponData.discountType}
                                onChange={(e) => setCouponData({ ...couponData, discountType: e.target.value })}
                            >
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <Input
                                label="Value"
                                placeholder="10"
                                type="number"
                                value={couponData.discountValue}
                                onChange={(e) => setCouponData({ ...couponData, discountValue: e.target.value })}
                                className="bg-gray-50/50 border-gray-200"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Target Audience</label>
                        <div className="space-y-2">
                            {audienceOptions.map((opt) => (
                                <div
                                    key={opt.id}
                                    onClick={() => setCouponData({ ...couponData, targetAudience: opt.id })}
                                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${couponData.targetAudience === opt.id
                                        ? 'border-blue-600 bg-blue-50/50'
                                        : 'border-gray-100 bg-white hover:border-gray-200'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${couponData.targetAudience === opt.id ? 'border-blue-600' : 'border-gray-300'}`}>
                                        {couponData.targetAudience === opt.id && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900">{opt.title}</p>
                                        <p className="text-xs text-gray-500 truncate">{opt.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                label="Usage Limit"
                                placeholder="Unlimited"
                                type="number"
                                value={couponData.maxUses || ''}
                                onChange={(e) => setCouponData({ ...couponData, maxUses: e.target.value })}
                                className="bg-gray-50/50 border-gray-200"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                            <input
                                type="date"
                                value={couponData.endDate}
                                onChange={(e) => setCouponData({ ...couponData, endDate: e.target.value })}
                                className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-[42px]"
                            />
                        </div>
                    </div>

                    <Button
                        className="w-full py-4 text-sm font-bold bg-blue-600 hover:bg-blue-700 h-[52px] rounded-xl mt-4 shadow-lg shadow-blue-200"
                        onClick={submitHandler}
                        loading={isSubmitting}
                    >
                        {isEdit ? "Update Coupon" : "Generate Coupon"}
                    </Button>

                    {isEdit && (
                        <Button
                            variant="outline"
                            className="w-full py-2 text-xs border-gray-200 text-gray-500 hover:bg-gray-50"
                            onClick={() => {
                                setEditingCoupon(null);
                                setSelectedProducts([]);
                            }}
                        >
                            Cancel Edit
                        </Button>
                    )}
                </div>
            </Card>
        );
    };

    if (loading && coupons.length === 0) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <LoadingSpinner size="xl" text="Loading coupons..." />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-10"
        >
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Coupons & Promotions</h1>
                    <p className="text-gray-500 font-medium">Manage discounts for medical equipment sales and B2B contracts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => {
                            if (!coupons || coupons.length === 0) {
                                toast.warn("No coupons to export");
                                return;
                            }
                            const headers = [
                                { key: 'code', label: 'Coupon Code' },
                                { key: 'discountType', label: 'Type' },
                                { key: 'discountValue', label: 'Value' },
                                { key: 'usedCount', label: 'Used' },
                                { key: 'maxUses', label: 'Limit' },
                                { key: 'endDate', label: 'Expiry' },
                                { key: 'isActive', label: 'Active' }
                            ];
                            exportToCSV(coupons, `Coupons_Export_${new Date().toISOString().split('T')[0]}.csv`, headers);
                            toast.success("Coupons exported to CSV");
                        }}
                        className="border-gray-200 text-gray-700 font-bold bg-gray-50/50"
                    >
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {renderStatCard(
                    "Active Coupons",
                    stats.active,
                    <Check className="w-6 h-6 text-green-600" />,
                    stats.activeGrowth !== 0 ? `${stats.activeGrowth > 0 ? '+' : ''}${stats.activeGrowth}%` : null,
                    "bg-green-100"
                )}
                {renderStatCard(
                    "Total Redemptions",
                    stats.redemptions,
                    <Gift className="w-6 h-6 text-blue-600" />,
                    stats.redemptionGrowth !== 0 ? `${stats.redemptionGrowth > 0 ? '+' : ''}${stats.redemptionGrowth}%` : null,
                    "bg-blue-100"
                )}
                {renderStatCard(
                    "Discount Volume",
                    stats.volume,
                    <Banknote className="w-6 h-6 text-amber-600" />,
                    stats.volumeGrowth !== 0 ? `${stats.volumeGrowth > 0 ? '+' : ''}${stats.volumeGrowth}%` : null,
                    "bg-amber-100"
                )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Table Section */}
                <div className="lg:col-span-8">
                    <Card className="p-0 overflow-hidden border-none shadow-xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-50">
                            <h2 className="text-xl font-bold text-gray-900">Active Promotional Codes</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px]">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Coupon Code</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Type</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Usage</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Expiry</th>
                                        <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-right">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {coupons.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                <AlertCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                                No coupons found.
                                            </td>
                                        </tr>
                                    ) : coupons.map((coupon) => {
                                        const expired = isCouponExpired(coupon.endDate);
                                        const usagePercent = coupon.maxUses > 0 ? Math.min((coupon.usedCount || 0) / coupon.maxUses * 100, 100) : 0;

                                        return (
                                            <tr key={coupon.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span className="font-mono font-bold text-blue-600 bg-blue-50/80 px-3 py-1.5 rounded-lg text-sm tracking-tighter">
                                                        {coupon.code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-sm font-bold text-gray-900">
                                                        {coupon.discountType === "percentage" ? `${coupon.discountValue}% Off` : formatCurrency(coupon.discountValue) + " Fixed"}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-medium">
                                                        {coupon.minOrderAmount > 0 ? `Min: ${formatCurrency(coupon.minOrderAmount)}` : 'No Minimum'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1.5 min-w-[100px]">
                                                        <p className="text-xs font-bold text-gray-700">
                                                            {coupon.usedCount || 0} / <span className="text-gray-400">{coupon.maxUses > 0 ? coupon.maxUses : '∞'}</span>
                                                        </p>
                                                        {coupon.maxUses > 0 && (
                                                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                                <div className="h-full bg-blue-600" style={{ width: `${usagePercent}%` }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-xs font-bold text-gray-600">
                                                        {new Date(coupon.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    {expired ? (
                                                        <div className="flex items-center gap-1.5 text-gray-400">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                                            <span className="text-xs font-bold">Expired</span>
                                                        </div>
                                                    ) : coupon.isActive ? (
                                                        <div className="flex items-center gap-1.5 text-green-600">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                            <span className="text-xs font-bold">Active</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-amber-500">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                            <span className="text-xs font-bold">Paused</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => startEditCoupon(coupon)}
                                                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                            title="Edit coupon"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteConfirm(coupon)}
                                                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            title="Delete coupon"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Form Section */}
                <div className="lg:col-span-4">
                    {renderCouponForm(
                        editingCoupon || newCoupon,
                        editingCoupon ? setEditingCoupon : setNewCoupon,
                        editingCoupon ? handleUpdateCoupon : handleAddCoupon,
                        !!editingCoupon
                    )}
                </div>
            </div>
            {/* Delete Confirm Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Coupon"
                size="sm"
            >
                <div className="space-y-4 pt-2">
                    <p className="text-sm text-gray-600">
                        Are you sure you want to delete coupon <span className="font-mono font-bold text-blue-600">"{deleteConfirm?.code}"</span>?
                    </p>
                    <p className="text-xs text-red-500 font-medium">This action cannot be undone.</p>
                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="font-bold">Cancel</Button>
                        <Button onClick={handleDeleteCoupon} className="bg-red-600 hover:bg-red-700 text-white font-bold">Delete</Button>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
};

export default AdminCouponsPage;
