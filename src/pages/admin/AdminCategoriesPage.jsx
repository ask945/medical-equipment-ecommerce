import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs, writeBatch } from "firebase/firestore";
import { adminDb as db } from "../../adminFirebase";
import { motion, AnimatePresence } from "framer-motion";
import {
    Layers, Plus, Trash2, Search,
    X, FolderTree,
    Download, Info, Upload, Loader2
} from "lucide-react";
import { Card, LoadingSpinner, Badge, Button, Modal } from "../../components/ui";
import { toast } from "react-toastify";
import { exportToCSV } from "../../utils/csvUtils";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";

/**
 * Admin Categories Management Page
 */
const AdminCategoriesPage = () => {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Inline/Modal Editing States
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ label: "", docID: "", status: "Active", image: "" });
    const [isSaving, setIsSaving] = useState(false);

    // Image upload
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingInlineImage, setUploadingInlineImage] = useState(false);
    const addImageRef = useRef(null);
    const inlineImageRef = useRef(null);

    // Delete confirm modal
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        const unsubCat = onSnapshot(collection(db, "categories"), (snapshot) => {
            const categoriesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                docID: doc.id
            })).sort((a, b) => {
                const dateA = a.updatedAt?.toDate() || new Date(0);
                const dateB = b.updatedAt?.toDate() || new Date(0);
                return dateB - dateA;
            });
            setCategories(categoriesList);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching categories:", err);
            toast.error("Failed to sync categories");
        });

        const unsubProd = onSnapshot(collection(db, "products"), (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => { unsubCat(); unsubProd(); };
    }, []);

    const filteredCategories = categories.filter(category =>
        category.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.docID?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Last updated
    const lastUpdatedDate = categories.reduce((latest, cat) => {
        const catDate = cat.updatedAt?.toDate() || new Date(0);
        return catDate > latest ? catDate : latest;
    }, new Date(0));

    const getTimeAgo = (date) => {
        if (!date || date.getTime() === 0) return 'N/A';
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    const activeCount = categories.filter(c => c.status !== 'Inactive').length;
    const inactiveCount = categories.filter(c => c.status === 'Inactive').length;

    const stats = [
        { label: 'Total Categories', value: categories.length, color: 'slate' },
        { label: 'Active', value: activeCount, color: 'blue' },
        { label: 'Inactive', value: inactiveCount, color: 'slate' },
        { label: 'Last Updated', value: getTimeAgo(lastUpdatedDate), color: 'slate' }
    ];

    const normalize = (str) => (str || '').toLowerCase().replace(/\s+/g, '-');

    const getProductsForCategory = (row) => {
        return products.filter(p => {
            const prodCatId = (p.categoryId || p.category || p.type || '');
            const prodCatName = normalize(p.category || p.type || '');
            return (
                row.id === prodCatId ||
                normalize(row.label || '') === prodCatName ||
                normalize(row.label || '') === normalize(prodCatId) ||
                normalize(row.id || '') === prodCatName ||
                normalize(row.id || '') === normalize(prodCatId)
            );
        });
    };

    // Image upload handler
    const handleImageUpload = async (file, target) => {
        if (!file) return;
        const setter = target === 'add' ? setUploadingImage : setUploadingInlineImage;
        setter(true);
        try {
            const url = await uploadToCloudinary(file);
            setEditData(prev => ({ ...prev, image: url }));
            toast.success("Image uploaded");
        } catch (err) {
            console.error("Upload error:", err);
            toast.error("Failed to upload image");
        } finally {
            setter(false);
        }
    };

    // When category is set to Inactive, disable all its products
    const disableCategoryProducts = async (categoryRow) => {
        const categoryProducts = getProductsForCategory(categoryRow);
        if (categoryProducts.length === 0) return;

        const batch = writeBatch(db);
        categoryProducts.forEach(p => {
            const prodRef = doc(db, "products", p.id);
            batch.update(prodRef, { showOnHome: false, disabledByCategory: true });
        });
        await batch.commit();
        toast.info(`${categoryProducts.length} product(s) disabled`);
    };

    // When category is set to Active, re-enable products that were disabled by category
    const enableCategoryProducts = async (categoryRow) => {
        const categoryProducts = getProductsForCategory(categoryRow);
        const disabledProducts = categoryProducts.filter(p => p.disabledByCategory === true);
        if (disabledProducts.length === 0) return;

        const batch = writeBatch(db);
        disabledProducts.forEach(p => {
            const prodRef = doc(db, "products", p.id);
            batch.update(prodRef, { showOnHome: true, disabledByCategory: false });
        });
        await batch.commit();
        toast.info(`${disabledProducts.length} product(s) re-enabled`);
    };

    async function handleAddCategory() {
        if (!editData.label.trim()) return toast.error("Category name is required");

        setIsSaving(true);
        try {
            const docID = editData.docID.trim() || editData.label.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            const categoryRef = doc(db, "categories", docID);
            await setDoc(categoryRef, {
                label: editData.label,
                docID: docID,
                status: "Active",
                image: editData.image || "",
                createdAt: new Date(),
                updatedAt: new Date()
            }, { merge: true });

            toast.success("Category added successfully");
            setIsAddingNew(false);
            setEditData({ label: "", docID: "", status: "Active", image: "" });
        } catch (error) {
            console.error("Error saving category:", error);
            toast.error("Failed to save category");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleSaveInline(id) {
        if (!editData.label.trim()) return toast.error("Category name is required");

        try {
            const categoryRef = doc(db, "categories", id);
            const oldCategory = categories.find(c => c.id === id);
            const oldStatus = oldCategory?.status || 'Active';
            const newStatus = editData.status;

            await updateDoc(categoryRef, {
                image: editData.image,
                status: editData.status,
                updatedAt: new Date()
            });

            // Handle product visibility based on status change
            if (oldStatus !== 'Inactive' && newStatus === 'Inactive') {
                await disableCategoryProducts(oldCategory);
            } else if (oldStatus === 'Inactive' && newStatus !== 'Inactive') {
                await enableCategoryProducts(oldCategory);
            }

            toast.success("Category updated");
            setEditingId(null);
        } catch (error) {
            toast.error("Failed to update");
        }
    }

    async function handleDeleteCategory() {
        if (!deleteConfirm) return;
        try {
            await deleteDoc(doc(db, "categories", deleteConfirm.id));
            toast.success("Category deleted");
            setDeleteConfirm(null);
        } catch (error) {
            toast.error("Failed to delete");
        }
    }

    if (loading && categories.length === 0) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <LoadingSpinner size="xl" text="Connecting to catalog..." />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10 px-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
                <div>
                    <h1 className="text-[34px] font-black text-slate-900 tracking-tight">Category Hierarchy</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage, organize, and update your product catalog structure.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (!categories || categories.length === 0) {
                                toast.warn("No categories to export");
                                return;
                            }
                            const headers = [
                                { key: 'label', label: 'Category Name' },
                                { key: 'docID', label: 'Category ID' },
                                { key: 'status', label: 'Status' }
                            ];
                            exportToCSV(categories, `Categories_Export_${new Date().toISOString().split('T')[0]}.csv`, headers);
                            toast.success("Categories exported to CSV");
                        }}
                        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold h-12 px-6 rounded-xl transition-all shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>
                    <button
                        onClick={() => { setEditData({ label: "", docID: "", status: "Active", image: "" }); setIsAddingNew(true); }}
                        className="flex items-center gap-2 bg-[#1d61f2] hover:bg-blue-700 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-blue-100 transition-all border border-blue-600"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add category</span>
                    </button>
                </div>
            </div>

            {/* Stats Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="py-4 px-5 border-slate-100/80 shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl">
                        <p className="text-[11px] font-bold uppercase tracking-tight text-slate-400 mb-1">{stat.label}</p>
                        <h3 className={`text-[26px] font-black leading-none ${stat.color === 'blue' ? 'text-blue-600' : 'text-slate-900'}`}>
                            {stat.value}
                        </h3>
                    </Card>
                ))}
            </div>

            {/* Categories Table Card */}
            <Card className="border-slate-100/80 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-black text-slate-900">Recent Categories</h3>
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 pl-10 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-hide min-h-[300px]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#f8fafc]/50">
                            <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                                <th className="py-4 px-8 w-24">Image</th>
                                <th className="py-4 px-4">Category Name</th>
                                <th className="py-4 px-4 text-center">Category ID</th>
                                <th className="py-4 px-4 text-center">Status</th>
                                <th className="py-4 px-8 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-4 bg-slate-50 rounded-2xl text-slate-300">
                                                <Layers className="w-8 h-8" />
                                            </div>
                                            <p className="text-slate-500 font-bold">No categories found matching the criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredCategories.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-5 px-8">
                                            {editingId === row.id ? (
                                                <div className="flex flex-col gap-2">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden mb-1">
                                                        {editData.image ? <img src={editData.image} className="w-full h-full object-cover" /> : <FolderTree className="w-5 h-5 text-slate-300 mx-auto mt-3" />}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={editData.image}
                                                        onChange={(e) => setEditData({ ...editData, image: e.target.value })}
                                                        placeholder="URL"
                                                        className="w-24 bg-white border border-slate-200 rounded-lg py-1 px-2 text-[10px] font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/10"
                                                    />
                                                    <input type="file" ref={inlineImageRef} accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], 'inline')} />
                                                    <button
                                                        onClick={() => inlineImageRef.current?.click()}
                                                        disabled={uploadingInlineImage}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700"
                                                    >
                                                        {uploadingInlineImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                                        Upload
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100">
                                                    {row.image ? (
                                                        <img src={row.image} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FolderTree className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-5 px-4">
                                            {editingId === row.id ? (
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 text-[14px]">{row.label}</span>
                                                    <span className="text-[11px] font-medium text-slate-400">Name cannot be changed</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 text-[14px]">{row.label}</span>
                                                    <span className="text-[11px] font-medium text-slate-400">
                                                        {getProductsForCategory(row).length} Products
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-5 px-4 text-center">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-500 font-mono text-[11px] font-bold rounded-lg border border-slate-200/50 uppercase tracking-tighter">
                                                {row.docID}
                                            </span>
                                        </td>
                                        <td className="py-5 px-4 text-center">
                                            {editingId === row.id ? (
                                                <select
                                                    value={editData.status}
                                                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                                    className="bg-white border border-slate-200 rounded-lg py-2 px-3 text-[13px] font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/10"
                                                >
                                                    <option value="Active">Active</option>
                                                    <option value="Inactive">Inactive</option>
                                                </select>
                                            ) : (
                                                <div className="flex justify-center">
                                                    <Badge
                                                        variant={row.status === 'Inactive' ? 'secondary' : 'success'}
                                                        className={`px-3 py-1 rounded-full font-bold text-[12px] min-w-[80px] flex items-center justify-center gap-1.5 ${row.status === 'Inactive' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full ${row.status === 'Inactive' ? 'bg-slate-400' : 'bg-emerald-500'}`} />
                                                        {row.status || 'Active'}
                                                    </Badge>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-5 px-8 text-right">
                                            {editingId === row.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="px-4 py-2 text-[13px] font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleSaveInline(row.id)}
                                                        className="px-4 py-2 text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100 transition-all"
                                                    >
                                                        Save Changes
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(row.id);
                                                            setEditData({ label: row.label, docID: row.docID, status: row.status || 'Active', image: row.image || '' });
                                                        }}
                                                        className="px-4 py-1 text-[13px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(row)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-[13px] font-bold text-slate-400">Showing {filteredCategories.length} of {categories.length} categories</p>
                </div>
            </Card>

            {/* Bottom Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                {/* Best Practices */}
                <Card className="p-8 border-blue-100 bg-blue-50/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-500 rounded-xl text-white">
                                <Info className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">Hierarchy Best Practices</h3>
                        </div>
                        <ul className="space-y-4">
                            {[
                                "Keep categories under 12 characters for better UI display on mobile.",
                                "Use high-resolution 1:1 aspect ratio images for category icons.",
                                "Setting a category to Inactive will disable all its products from the storefront."
                            ].map((item, i) => (
                                <li key={i} className="flex gap-3 text-slate-600 text-[14px] leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                                    <span className="font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Card>

                {/* Info Card */}
                <Card className="border-slate-100 bg-white rounded-[32px] flex flex-col items-center justify-center text-center group cursor-pointer hover:border-blue-200 transition-all min-h-[260px]">
                    <div className="flex flex-col items-center gap-5">
                        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all duration-500">
                            <FolderTree className="w-8 h-8 stroke-[1.5]" />
                        </div>
                        <div>
                            <h3 className="text-[20px] font-black text-slate-900 mb-2">Category Status</h3>
                            <p className="text-slate-400 font-medium max-w-[280px] text-[14px] leading-relaxed">
                                When a category is set to <span className="text-red-500 font-bold">Inactive</span>, all its products are automatically hidden from the storefront. Re-activating restores them.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Add New Category Modal */}
            <AnimatePresence>
                {isAddingNew && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-black text-slate-900">New Category</h2>
                                    <button onClick={() => setIsAddingNew(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                        <X className="w-6 h-6 text-slate-400" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-slate-500 ml-1">Category Name</label>
                                        <input
                                            type="text"
                                            value={editData.label}
                                            onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="e.g. Prescription Drugs"
                                        />
                                    </div>

                                    {/* Image: URL input + Upload button */}
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-slate-500 ml-1">Category Image</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={editData.image}
                                                onChange={(e) => setEditData({ ...editData, image: e.target.value })}
                                                className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                placeholder="Paste URL or upload"
                                            />
                                            <input type="file" ref={addImageRef} accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e.target.files[0], 'add')} />
                                            <button
                                                onClick={() => addImageRef.current?.click()}
                                                disabled={uploadingImage}
                                                className="px-4 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors flex items-center gap-2 text-slate-600 font-bold text-sm shrink-0"
                                            >
                                                {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                                Upload
                                            </button>
                                        </div>
                                        {editData.image && (
                                            <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden mt-2">
                                                <img src={editData.image} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-slate-500 ml-1">Category ID (Slug/URL)</label>
                                        <input
                                            type="text"
                                            value={editData.docID}
                                            onChange={(e) => setEditData({ ...editData, docID: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[14px] font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="Auto-generated from name"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => setIsAddingNew(false)}
                                        className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddCategory}
                                        disabled={isSaving}
                                        className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50"
                                    >
                                        {isSaving ? "Creating..." : "Add Category"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirm Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Category"
                size="sm"
            >
                <div className="space-y-4 pt-2">
                    <p className="text-sm text-gray-600">
                        Are you sure you want to delete <span className="font-bold text-gray-900">"{deleteConfirm?.label}"</span>?
                    </p>
                    <p className="text-xs text-red-500 font-medium">This action cannot be undone. Products in this category will become uncategorized.</p>
                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="font-bold">Cancel</Button>
                        <Button onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700 text-white font-bold">Delete</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminCategoriesPage;
