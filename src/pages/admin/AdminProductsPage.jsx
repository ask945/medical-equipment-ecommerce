import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc, updateDoc, writeBatch, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Search, Plus, Edit, Trash2, Eye,
    TrendingUp, TrendingDown,
    RefreshCw, BarChart2, Archive, Pencil
} from "lucide-react";
import { Button, Card, Input, Modal, Badge, Alert, LoadingSpinner, ConfirmDialog } from "../../components/ui";
import { formatCurrency } from "../../utils/formatUtils";
import { toast } from "react-toastify";


/**
 * WORLD-CLASS Product Manager with Professional Features
 * - Bulk Operations (Restock, Add Stock, Edit, Delete)
 * - Out of Stock Alerts
 * - Grid/List View Toggle
 * - Performance Tracking
 * - Advanced Search & Filters
 * - Product Visibility Control
 */
const AdminProductsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const brandFilter = searchParams.get('brand') || '';

    // Data States
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [orderData, setOrderData] = useState({});
    const [loading, setLoading] = useState(true);

    // UI States
    const [viewMode, setViewMode] = useState('grid'); // grid or list
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [filterStatus, setFilterStatus] = useState("all"); // all, instock, outofstock, lowstock
    const [filterPerformance, setFilterPerformance] = useState("all"); // all, good, poor
    const [filterBrand, setFilterBrand] = useState(brandFilter || "all");
    const [filterCategory, setFilterCategory] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal States
    const [bulkModal, setBulkModal] = useState({ open: false, type: null }); // restock, addstock, delete
    const [bulkQuantity, setBulkQuantity] = useState("");
    const [viewProductModal, setViewProductModal] = useState({ open: false, product: null });
    const [performingBulkOperation, setPerformingBulkOperation] = useState(false);
    const [syncingStock, setSyncingStock] = useState(false);
    const [showSyncConfirm, setShowSyncConfirm] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        inStock: 0,
        outOfStock: 0,
        lowStock: 0,
        totalValue: 0
    });

    // Fetch orders once for sales data
    useEffect(() => {
        const fetchOrderData = async () => {
            try {
                const ordersSnapshot = await getDocs(collection(db, "orders"));
                const salesData = {};
                ordersSnapshot.docs.forEach(orderDoc => {
                    const order = orderDoc.data();
                    if (order.items && Array.isArray(order.items)) {
                        order.items.forEach(item => {
                            const productId = item.productId || item.id;
                            if (!salesData[productId]) {
                                salesData[productId] = { totalSales: 0, totalRevenue: 0, orderCount: 0 };
                            }
                            salesData[productId].totalSales += item.quantity || 0;
                            salesData[productId].totalRevenue += (item.price * (item.quantity || 1)) || 0;
                            salesData[productId].orderCount += 1;
                        });
                    }
                });
                setOrderData(salesData);
            } catch (err) {
                console.warn("Failed to fetch order metrics:", err);
            }
        };
        fetchOrderData();
    }, []);

    // Real-time product listener
    useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
            const productsList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            const enhancedProducts = productsList.map(product => {
                const sales = orderData[product.id] || { totalSales: 0, totalRevenue: 0, orderCount: 0 };
                const stock = Number(product.stock) || 0;
                return {
                    ...product,
                    salesData: sales,
                    stockStatus: stock === 0 ? 'outofstock' : stock < 10 ? 'lowstock' : 'instock',
                    performance: sales.totalSales > 20 ? 'good' : sales.totalSales > 5 ? 'average' : 'poor',
                    isVisible: product.showOnHome !== false,
                    isDisabledByCategory: product.disabledByCategory === true
                };
            });

            setProducts(enhancedProducts);

            const totalValue = enhancedProducts.reduce((sum, p) => sum + (Number(p.price) * Number(p.stock)), 0);
            setStats({
                total: enhancedProducts.length,
                inStock: enhancedProducts.filter(p => p.isVisible && !p.isDisabledByCategory).length,
                outOfStock: enhancedProducts.filter(p => !p.isVisible && !p.isDisabledByCategory).length,
                lowStock: enhancedProducts.filter(p => p.stockStatus === 'lowstock').length,
                disabled: enhancedProducts.filter(p => p.isDisabledByCategory).length,
                totalValue
            });

            setLoading(false);
        }, (error) => {
            console.error("Error listening to products:", error);
            toast.error("Failed to load products");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [orderData]);

    useEffect(() => {
        filterAndSortProducts();
        setCurrentPage(1);
    }, [products, searchTerm, sortBy, sortOrder, filterStatus, filterPerformance, orderData, filterBrand, filterCategory]);

    /**
     * Filter and sort products
     */
    const filterAndSortProducts = () => {
        let filtered = [...products];

        // Brand filter
        if (filterBrand && filterBrand !== 'all') {
            filtered = filtered.filter(product => {
                const productBrand = (product.brand || '').toLowerCase().trim();
                const brandSlug = productBrand.replace(/\s+/g, '-');
                return brandSlug === filterBrand.toLowerCase() || productBrand === filterBrand.toLowerCase();
            });
        }

        // Category filter
        if (filterCategory && filterCategory !== 'all') {
            filtered = filtered.filter(product => {
                const productCategory = (product.category || '').toLowerCase().trim();
                const categorySlug = productCategory.replace(/\s+/g, '-');
                return categorySlug === filterCategory.toLowerCase() || productCategory === filterCategory.toLowerCase();
            });
        }

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(product =>
                product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.type?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Stock status filter
        if (filterStatus === "instock") {
            filtered = filtered.filter(product => product.isVisible && !product.isDisabledByCategory);
        } else if (filterStatus === "outofstock") {
            filtered = filtered.filter(product => !product.isVisible && !product.isDisabledByCategory);
        } else if (filterStatus === "lowstock") {
            filtered = filtered.filter(product => product.stockStatus === 'lowstock');
        } else if (filterStatus === 'disabled') {
            filtered = filtered.filter(product => product.isDisabledByCategory);
        } else if (filterStatus === 'archived') {
            filtered = filtered.filter(product => product.status === 'archived');
        }

        // Performance filter
        if (filterPerformance !== "all") {
            filtered = filtered.filter(product => product.performance === filterPerformance);
        }

        // Sorting
        filtered.sort((a, b) => {
            let aVal, bVal;

            switch (sortBy) {
                case "name":
                    aVal = a.name?.toLowerCase() || "";
                    bVal = b.name?.toLowerCase() || "";
                    break;
                case "price":
                    aVal = Number(a.price) || 0;
                    bVal = Number(b.price) || 0;
                    break;
                case "stock":
                    aVal = Number(a.stock) || 0;
                    bVal = Number(b.stock) || 0;
                    break;
                case "sales":
                    aVal = a.salesData?.totalSales || 0;
                    bVal = b.salesData?.totalSales || 0;
                    break;
                case "revenue":
                    aVal = a.salesData?.totalRevenue || 0;
                    bVal = b.salesData?.totalRevenue || 0;
                    break;
                default:
                    aVal = a.name || "";
                    bVal = b.name || "";
            }

            if (sortOrder === "asc") {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        setFilteredProducts(filtered);
    };

    /**
     * Toggle product selection
     */
    const toggleProductSelection = (productId) => {
        setSelectedProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    /**
     * Select all filtered products
     */
    const toggleSelectAll = () => {
        if (selectedProducts.length === filteredProducts.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(filteredProducts.map(p => p.id));
        }
    };

    /**
     * Bulk Restock
     */
    const handleBulkRestock = async () => {
        if (!bulkQuantity || selectedProducts.length === 0) {
            toast.error("Please enter quantity and select products");
            return;
        }

        try {
            setPerformingBulkOperation(true);
            const batch = writeBatch(db);

            selectedProducts.forEach(productId => {
                const productRef = doc(db, "products", productId);
                batch.update(productRef, {
                    stock: Number(bulkQuantity),
                    updatedAt: new Date()
                });
            });

            await batch.commit();

            toast.success(`Restocked ${selectedProducts.length} products!`);
            setBulkModal({ open: false, type: null });
            setBulkQuantity("");
            setSelectedProducts([]);
            // onSnapshot auto-refreshes
        } catch (error) {
            console.error("Error restocking:", error);
            toast.error("Failed to restock products");
        } finally {
            setPerformingBulkOperation(false);
        }
    };

    /**
     * Bulk Add Stock
     */
    const handleBulkAddStock = async () => {
        if (!bulkQuantity || selectedProducts.length === 0) {
            toast.error("Please enter quantity and select products");
            return;
        }

        try {
            setPerformingBulkOperation(true);

            for (const productId of selectedProducts) {
                const product = products.find(p => p.id === productId);
                const productRef = doc(db, "products", productId);
                await updateDoc(productRef, {
                    stock: Number(product.stock || 0) + Number(bulkQuantity),
                    updatedAt: new Date()
                });
            }

            toast.success(`Added ${bulkQuantity} stock to ${selectedProducts.length} products!`);
            setBulkModal({ open: false, type: null });
            setBulkQuantity("");
            setSelectedProducts([]);
            // onSnapshot auto-refreshes
        } catch (error) {
            console.error("Error adding stock:", error);
            toast.error("Failed to add stock");
        } finally {
            setPerformingBulkOperation(false);
        }
    };

    /**
     * Bulk Delete
     */
    const handleBulkDelete = async () => {
        if (selectedProducts.length === 0) {
            toast.error("Please select products to delete");
            return;
        }

        try {
            setPerformingBulkOperation(true);

            for (const productId of selectedProducts) {
                await deleteDoc(doc(db, "products", productId));
            }

            toast.success(`Deleted ${selectedProducts.length} products!`);
            setBulkModal({ open: false, type: null });
            setSelectedProducts([]);
            // onSnapshot auto-refreshes
        } catch (error) {
            console.error("Error deleting products:", error);
            toast.error("Failed to delete products");
        } finally {
            setPerformingBulkOperation(false);
        }
    };

    /**
     * Sync Stock — recalculate stock by subtracting quantities from all non-cancelled orders
     */
    const handleSyncStock = async () => {
        setShowSyncConfirm(false);
        setSyncingStock(true);
        try {
            // Fetch all products to get their current stock as base
            const productsSnap = await getDocs(collection(db, "products"));
            const productMap = {};
            productsSnap.docs.forEach(d => {
                const data = d.data();
                productMap[d.id] = {
                    ref: doc(db, "products", d.id),
                    originalStock: Number(data.originalStock || data.stock) || 0,
                };
            });

            // Fetch all orders
            const ordersSnap = await getDocs(collection(db, "orders"));
            const cancelStatuses = ['cancelled', 'declined', 'refunded'];

            // Calculate total sold per product from non-cancelled orders
            const soldMap = {};
            ordersSnap.docs.forEach(d => {
                const order = d.data();
                if (cancelStatuses.includes((order.status || '').toLowerCase())) return;
                if (order.items && Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        if (item.category === 'Services' || String(item.id).startsWith('service-')) return;
                        soldMap[item.id] = (soldMap[item.id] || 0) + (item.quantity || 1);
                    });
                }
            });

            // Update each product: stock = originalStock - totalSold
            const batch = writeBatch(db);
            let updated = 0;
            for (const [productId, product] of Object.entries(productMap)) {
                const totalSold = soldMap[productId] || 0;
                const newStock = Math.max(0, product.originalStock - totalSold);
                batch.update(product.ref, {
                    stock: newStock,
                    originalStock: product.originalStock, // Save original for future syncs
                });
                updated++;
            }
            await batch.commit();

            // Also reset fake ratings: verify against actual review documents
            const reviewsSnap = await getDocs(collection(db, "reviews"));
            const realReviewCounts = {};
            const realRatingSums = {};
            reviewsSnap.docs.forEach(d => {
                const r = d.data();
                if (r.productId) {
                    realReviewCounts[r.productId] = (realReviewCounts[r.productId] || 0) + 1;
                    realRatingSums[r.productId] = (realRatingSums[r.productId] || 0) + (r.rating || 0);
                }
            });

            const ratingBatch = writeBatch(db);
            let ratingsFixed = 0;
            productsSnap.docs.forEach(d => {
                const data = d.data();
                const count = realReviewCounts[d.id] || 0;
                const avg = count > 0 ? Number((realRatingSums[d.id] / count).toFixed(1)) : 0;
                if (Number(data.rating) !== avg || Number(data.reviews) !== count) {
                    ratingBatch.update(doc(db, "products", d.id), { rating: avg, reviews: count });
                    ratingsFixed++;
                }
            });
            if (ratingsFixed > 0) {
                await ratingBatch.commit();
            }

            toast.success(`Stock synced for ${updated} products! Ratings verified for ${ratingsFixed} products.`);
        } catch (error) {
            console.error("Error syncing stock:", error);
            toast.error(`Stock sync failed: ${error.message}`);
        }
        setSyncingStock(false);
    };

    /**
     * Toggle product visibility
     */
    const toggleProductVisibility = async (productId, currentVisibility) => {
        try {
            const productRef = doc(db, "products", productId);
            await updateDoc(productRef, {
                showOnHome: !currentVisibility,
                updatedAt: new Date()
            });

            toast.success(currentVisibility ? "Product hidden from homepage" : "Product shown on homepage");
            // onSnapshot auto-refreshes
        } catch (error) {
            console.error("Error updating visibility:", error);
            toast.error("Failed to update visibility");
        }
    };

    /**
     * Delete single product
     */
    const handleDeleteProduct = async (productId) => {
        try {
            await deleteDoc(doc(db, "products", productId));
            toast.success("Product deleted successfully!");
            // onSnapshot auto-refreshes
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Failed to delete product");
        }
    };

    /**
     * Export products to CSV
     */
    const exportToCSV = () => {
        const headers = ["Name", "Brand", "Type", "Price", "Stock", "Sales", "Revenue", "Status", "Performance"];
        const rows = filteredProducts.map(p => [
            p.name || "",
            p.brand || "",
            p.type || "",
            p.price || 0,
            p.stock || 0,
            p.salesData?.totalSales || 0,
            p.salesData?.totalRevenue || 0,
            p.stockStatus || "",
            p.performance || ""
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast.success("Products exported successfully!");
    };

    /**
     * Get performance badge
     */
    const getPerformanceBadge = (product) => {
        if (product.performance === 'good') {
            return <Badge variant="success" icon={<TrendingUp className="w-3 h-3" />}>High Sales</Badge>;
        } else if (product.performance === 'average') {
            return <Badge variant="warning" icon={<BarChart2 className="w-3 h-3" />}>Average</Badge>;
        } else {
            return <Badge variant="danger" icon={<TrendingDown className="w-3 h-3" />}>Low Sales</Badge>;
        }
    };

    /**
     * Get stock badge
     */
    const getStockBadge = (product) => {
        if (product.stockStatus === 'outofstock') {
            return <Badge variant="danger" dot pulse>Out of Stock</Badge>;
        } else if (product.stockStatus === 'lowstock') {
            return <Badge variant="warning" dot pulse>Low Stock</Badge>;
        } else {
            return <Badge variant="success">In Stock</Badge>;
        }
    };

    if (loading && products.length === 0) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <LoadingSpinner size="xl" text="Loading products..." />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 pb-10 max-w-[1600px] mx-auto"
        >
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div>
                    <h1 className="text-4xl font-black text-[#1e293b] tracking-tight mb-1">Products Catalog</h1>
                    <p className="text-slate-500 font-medium">Manage your medical equipment inventory, pricing, and availability.</p>
                    {(filterBrand !== 'all' || filterCategory !== 'all') && (
                        <div className="flex items-center gap-2 mt-2">
                            {filterBrand !== 'all' && (
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
                                    Brand: {filterBrand}
                                </span>
                            )}
                            {filterCategory !== 'all' && (
                                <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                                    Category: {filterCategory}
                                </span>
                            )}
                            <button
                                onClick={() => { setFilterBrand('all'); setFilterCategory('all'); setSearchParams({}); }}
                                className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                            >
                                Clear filters
                            </button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowSyncConfirm(true)}
                        disabled={syncingStock}
                        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold h-11 px-4 rounded-xl transition-all shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${syncingStock ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">{syncingStock ? 'Syncing...' : 'Sync Stock'}</span>
                    </button>
                    <Link
                        to="/admin/products/add"
                        className="flex items-center gap-2 bg-[#1d61f2] hover:bg-blue-700 text-white font-bold h-11 px-5 rounded-xl shadow-lg shadow-blue-100 transition-all border border-blue-600"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add New</span>
                    </Link>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mx-4">
                {/* Status Tabs */}
                <div className="px-8 border-b border-slate-50 flex items-center gap-6">
                    {[
                        { label: 'All Products', count: stats.total, value: 'all' },
                        { label: 'Published', count: stats.inStock, value: 'instock' },
                        { label: 'Drafts', count: stats.outOfStock, value: 'outofstock' },
                        { label: 'Disabled', count: stats.disabled || 0, value: 'disabled' },
                        { label: 'Archived', count: 0, value: 'archived' }
                    ].map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setFilterStatus(tab.value)}
                            className={`py-5 text-[14px] font-bold transition-all border-b-2 relative ${filterStatus === tab.value
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {tab.label} {tab.count > 0 && <span className="ml-1 text-[12px] opacity-70">({tab.count})</span>}
                        </button>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="px-8 py-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                            />
                        </div>
                        <select
                            value={filterBrand}
                            onChange={(e) => setFilterBrand(e.target.value)}
                            className="py-2.5 px-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 font-medium text-slate-700 min-w-[140px]"
                        >
                            <option value="all">All Brands</option>
                            {[...new Set(products.map(p => p.brand).filter(Boolean))].sort().map(brand => (
                                <option key={brand} value={brand.toLowerCase().replace(/\s+/g, '-')}>{brand}</option>
                            ))}
                        </select>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="py-2.5 px-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 font-medium text-slate-700 min-w-[150px]"
                        >
                            <option value="all">All Categories</option>
                            {[...new Set(products.map(p => p.category).filter(Boolean))].sort().map(cat => (
                                <option key={cat} value={cat.toLowerCase().replace(/\s+/g, '-')}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    {selectedProducts.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                variant="danger"
                                onClick={() => setBulkModal({ open: true, type: 'delete' })}
                                icon={<Trash2 className="w-4 h-4" />}
                                className="rounded-xl"
                            >
                                Delete ({selectedProducts.length})
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedProducts([])}
                                className="text-slate-400 font-bold"
                            >
                                Clear
                            </Button>
                        </div>
                    )}
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <LoadingSpinner size="lg" text="Fetching products..." />
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-20 mx-8 my-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <Archive className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900">No products found</h3>
                            <p className="text-slate-400 font-medium">
                                {searchTerm
                                    ? `No matches for "${searchTerm}"`
                                    : "Try adjusting your filters or status selection"}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#f8fafc]">
                                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-y border-slate-50">
                                    <th className="py-4 px-4 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </th>
                                    <th className="py-4 px-4">Product</th>
                                    <th className="py-4 px-4 text-center">SKU</th>
                                    <th className="py-4 px-4 text-center">Category</th>
                                    <th className="py-4 px-4 text-center">Price</th>
                                    <th className="py-4 px-4">Stock</th>
                                    <th className="py-4 px-4 text-center">Status</th>
                                    <th className="py-4 px-4 text-right pr-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-6 px-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.includes(product.id)}
                                                onChange={() => toggleProductSelection(product.id)}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="py-6 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={product.image || 'https://via.placeholder.com/100'}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/100'; }}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-[14px] leading-tight mb-1.5">{product.name}</p>
                                                    <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">{product.brand || 'General Medical'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4 text-center">
                                            <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">
                                                {product.sku || 'MED-0' + Math.floor(Math.random() * 9000 + 1000)}
                                            </span>
                                        </td>
                                        <td className="py-6 px-4 text-center">
                                            <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest leading-none inline-block">
                                                {product.type || product.category || 'Uncategorized'}
                                            </span>
                                        </td>
                                        <td className="py-6 px-4 text-center text-[15px] font-bold text-slate-900">
                                            {formatCurrency(product.price)}
                                        </td>
                                        <td className="py-6 px-4">
                                            <div className="w-40">
                                                <div className="flex justify-between items-end mb-2">
                                                    <span className={`text-[13px] font-bold ${product.stockStatus === 'outofstock' ? 'text-red-600' :
                                                        product.stockStatus === 'lowstock' ? 'text-orange-600' :
                                                            'text-slate-900'
                                                        }`}>
                                                        {product.stock || 0} units
                                                    </span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${product.stockStatus === 'outofstock' ? 'text-red-400' :
                                                        product.stockStatus === 'lowstock' ? 'text-orange-500' :
                                                            'text-slate-400'
                                                        }`}>
                                                        {product.stockStatus === 'lowstock' ? 'Critical' : product.stockStatus === 'outofstock' ? 'Out' : 'High'}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ${product.stockStatus === 'outofstock' ? 'bg-red-500 w-0' :
                                                            product.stockStatus === 'lowstock' ? 'bg-orange-500' :
                                                                'bg-emerald-500 shadow-sm shadow-emerald-100'
                                                            }`}
                                                        style={{ width: product.stockStatus === 'instock' ? '85%' : product.stockStatus === 'lowstock' ? '30%' : '0%' }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4 text-center">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                                product.isDisabledByCategory
                                                    ? 'bg-red-50 text-red-500'
                                                    : product.isVisible
                                                        ? 'bg-[#ecfdf5] text-[#059669]'
                                                        : 'bg-slate-50 text-slate-400'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    product.isDisabledByCategory ? 'bg-red-500' : product.isVisible ? 'bg-[#10b981]' : 'bg-slate-400'
                                                }`} />
                                                {product.isDisabledByCategory ? 'Disabled' : product.isVisible ? 'Published' : 'Draft'}
                                            </div>
                                        </td>
                                        <td className="py-6 px-4 text-right pr-4">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {product.isDisabledByCategory ? (
                                                    <div
                                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 border border-red-100 text-red-400 cursor-not-allowed"
                                                        title="Disabled by inactive category"
                                                    >
                                                        <Archive className="w-5 h-5" />
                                                    </div>
                                                ) : (
                                                <button
                                                    onClick={() => toggleProductVisibility(product.id, product.isVisible)}
                                                    className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all hover:shadow-sm ${product.isVisible
                                                        ? 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100'
                                                        : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'}`}
                                                    title={product.isVisible ? "Convert to Draft" : "Publish Product"}
                                                >
                                                    {product.isVisible ? <Archive className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                                                </button>
                                                )}
                                                <button
                                                    onClick={() => setViewProductModal({ open: true, product })}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-all hover:shadow-sm"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <Link to={`/admin/products/edit/${product.id}`}>
                                                    <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50 transition-all hover:shadow-sm">
                                                        <Pencil className="w-5 h-5" />
                                                    </button>
                                                </Link>
                                                <button
                                                    onClick={() => setConfirmDelete({ id: product.id })}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all hover:shadow-sm"
                                                >
                                                    <Trash2 className="w-5 h-5" />
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
                <div className="px-10 py-6 bg-[#f8fafc]/30 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-[13px] font-bold text-slate-400">
                        Showing {filteredProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
                        {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 flex items-center justify-center rounded-xl text-[13px] font-bold text-slate-400 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Previous
                        </button>

                        {Array.from({ length: Math.ceil(filteredProducts.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl text-[13px] font-black transition-all active:scale-90 ${currentPage === page
                                    ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-100'
                                    : 'bg-white border border-slate-100 text-slate-400 font-bold hover:bg-slate-50'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredProducts.length / itemsPerPage)))}
                            disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage) || filteredProducts.length === 0}
                            className="px-4 py-2 flex items-center justify-center rounded-xl text-[13px] font-bold text-[#2563eb] hover:bg-blue-50 disabled:text-slate-400"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Operations Modal */}
            <Modal
                isOpen={bulkModal.open}
                onClose={() => setBulkModal({ open: false, type: null })}
                title={
                    bulkModal.type === 'restock' ? 'Bulk Restock' :
                        bulkModal.type === 'addstock' ? 'Bulk Add Stock' :
                            'Bulk Delete'
                }
                size="md"
            >
                {bulkModal.type === 'delete' ? (
                    <div className="space-y-4">
                        <Alert
                            variant="danger"
                            title="Warning"
                            message={`Are you sure you want to delete ${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''}? This action cannot be undone.`}
                        />
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setBulkModal({ open: false, type: null })}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                loading={performingBulkOperation}
                                onClick={handleBulkDelete}
                                icon={<Trash2 className="w-4 h-4" />}
                            >
                                {performingBulkOperation ? 'Deleting...' : 'Delete All'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            {bulkModal.type === 'restock'
                                ? `Set stock quantity for ${selectedProducts.length} selected product${selectedProducts.length > 1 ? 's' : ''}`
                                : `Add stock to ${selectedProducts.length} selected product${selectedProducts.length > 1 ? 's' : ''}`
                            }
                        </p>
                        <Input
                            label="Quantity"
                            type="number"
                            placeholder="Enter quantity"
                            value={bulkQuantity}
                            onChange={(e) => setBulkQuantity(e.target.value)}
                            required
                        />
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setBulkModal({ open: false, type: null })}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="success"
                                loading={performingBulkOperation}
                                onClick={bulkModal.type === 'restock' ? handleBulkRestock : handleBulkAddStock}
                                icon={bulkModal.type === 'restock' ? <RefreshCw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            >
                                {performingBulkOperation ? 'Processing...' : bulkModal.type === 'restock' ? 'Restock' : 'Add Stock'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* View Product Modal */}
            <Modal
                isOpen={viewProductModal.open}
                onClose={() => setViewProductModal({ open: false, product: null })}
                title="Product Details"
                size="lg"
            >
                {viewProductModal.product && (
                    <div className="space-y-6">
                        {/* Product Images */}
                        <div className="grid grid-cols-3 gap-4">
                            {[viewProductModal.product.image, viewProductModal.product.image2, viewProductModal.product.image3]
                                .filter(Boolean)
                                .map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img}
                                        alt={`Product ${idx + 1}`}
                                        className="w-full h-32 object-cover rounded-lg"
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/200';
                                        }}
                                    />
                                ))}
                        </div>

                        {/* Product Info Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Name</label>
                                <p className="text-gray-900">{viewProductModal.product.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Brand</label>
                                <p className="text-gray-900">{viewProductModal.product.brand || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Category</label>
                                <p className="text-gray-900">{viewProductModal.product.type || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Price</label>
                                <p className="text-gray-900">{formatCurrency(viewProductModal.product.price)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Stock</label>
                                <p className="text-gray-900">{viewProductModal.product.stock || 0}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-600">Total Sales</label>
                                <p className="text-gray-900">{viewProductModal.product.salesData?.totalSales || 0} units</p>
                            </div>
                            <div className="col-span-2">
                                <label className="text-sm font-semibold text-gray-600">Total Revenue</label>
                                <p className="text-gray-900">{formatCurrency(viewProductModal.product.salesData?.totalRevenue || 0)}</p>
                            </div>
                            <div className="col-span-2">
                                <label className="text-sm font-semibold text-gray-600">Description</label>
                                <p className="text-gray-900">{viewProductModal.product.description || 'No description'}</p>
                            </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex gap-2">
                            {getStockBadge(viewProductModal.product)}
                            {getPerformanceBadge(viewProductModal.product)}
                            <Badge variant={viewProductModal.product.isVisible ? 'success' : 'default'}>
                                {viewProductModal.product.isVisible ? 'Visible on Homepage' : 'Hidden from Homepage'}
                            </Badge>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Link to={`/admin/products/edit/${viewProductModal.product.id}`} className="flex-1">
                                <Button fullWidth variant="primary" icon={<Edit className="w-4 h-4" />}>
                                    Edit Product
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                onClick={() => toggleProductVisibility(viewProductModal.product.id, viewProductModal.product.isVisible)}
                                icon={viewProductModal.product.isVisible ? <Archive className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            >
                                {viewProductModal.product.isVisible ? 'Hide' : 'Show'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
            {/* Sync Stock Confirmation Modal */}
            <Modal
                isOpen={showSyncConfirm}
                onClose={() => setShowSyncConfirm(false)}
                title="Sync Stock"
            >
                <div className="p-4">
                    <p className="text-sm text-slate-600 mb-4">
                        This will recalculate stock for <strong>all products</strong> based on existing orders. Current stock will be used as the base and quantities from non-cancelled orders will be subtracted.
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setShowSyncConfirm(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleSyncStock}>Sync Stock</Button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => handleDeleteProduct(confirmDelete?.id)}
                title="Delete Product"
                message="Are you sure you want to delete this product? This cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </motion.div >
    );
};

export default AdminProductsPage;
