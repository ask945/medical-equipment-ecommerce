import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
    Layers, Plus, Trash2, Search,
    X, FolderTree,
    Download, Info
} from "lucide-react";
import { Card, LoadingSpinner, Badge } from "../../components/ui";
import { toast } from "react-toastify";

/**
 * Admin Categories Management Page - Redesigned
 */
const AdminCategoriesPage = () => {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTab, setFilterTab] = useState('All');

    // Inline/Modal Editing States
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ label: "", docID: "", status: "Active" });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Sync Categories
        const qCat = collection(db, "categories");
        const unsubCat = onSnapshot(qCat, (snapshot) => {
            const categoriesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                docID: doc.id
            }))
                // Sort client-side to handle missing updatedAt fields
                .sort((a, b) => {
                    const dateA = a.updatedAt?.toDate() || new Date(0);
                    const dateB = b.updatedAt?.toDate() || new Date(0);
                    return dateB - dateA;
                });
            setCategories(categoriesList);
            checkLoading();
        }, (err) => {
            console.error("Error fetching categories:", err);
            toast.error("Failed to sync categories");
        });

        // Sync Products for counting
        const unsubProd = onSnapshot(collection(db, "products"), (snapshot) => {
            const productsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProducts(productsList);
            checkLoading();
        });

        function checkLoading() {
            setLoading(false);
        }

        return () => {
            unsubCat();
            unsubProd();
        };
    }, []);

    const filteredCategories = categories.filter(category =>
        category.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.docID?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Dynamic Stats Calculation
    const activeItemsCount = products.length;

    // Find last updated time
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

    const stats = [
        { label: 'Total Categories', value: categories.length, color: 'slate' },
        { label: 'Active Items', value: activeItemsCount, color: 'blue' },
        { label: 'Sub-Categories', value: '156', color: 'slate' }, // Placeholder matching reference
        { label: 'Last Updated', value: getTimeAgo(lastUpdatedDate), color: 'slate' }
    ];

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
                        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold h-12 px-6 rounded-xl transition-all shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>
                    <button
                        onClick={() => setIsAddingNew(true)}
                        className="flex items-center gap-2 bg-[#1d61f2] hover:bg-blue-700 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-blue-100 transition-all border border-blue-600"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add New Category</span>
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
                                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100">
                                                {row.image ? (
                                                    <img src={row.image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <FolderTree className="w-5 h-5 text-slate-400" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-5 px-4">
                                            {editingId === row.id ? (
                                                <input
                                                    type="text"
                                                    value={editData.label}
                                                    onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                                                    className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-[14px] font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/10"
                                                />
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 text-[14px]">{row.label}</span>
                                                    <span className="text-[11px] font-medium text-slate-400">
                                                        {products.filter(p => p.type === row.label).length} Products
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-5 px-4 text-center">
                                            {editingId === row.id ? (
                                                <input
                                                    type="text"
                                                    value={editData.docID}
                                                    onChange={(e) => setEditData({ ...editData, docID: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-[13px] font-mono text-slate-500"
                                                    disabled
                                                />
                                            ) : (
                                                <span className="px-3 py-1 bg-slate-100 text-slate-500 font-mono text-[11px] font-bold rounded-lg border border-slate-200/50 uppercase tracking-tighter">
                                                    {row.docID}
                                                </span>
                                            )}
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
                                                            setEditData({ label: row.label, docID: row.docID, status: row.status || 'Active' });
                                                        }}
                                                        className="px-4 py-1 text-[13px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCategory(row)}
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
                    <p className="text-[13px] font-bold text-slate-400">Showing 1-{filteredCategories.length} of {categories.length} categories</p>
                    <div className="flex items-center gap-3">
                        <button className="px-5 py-2 rounded-xl bg-white border border-slate-200 text-slate-400 text-[13px] font-bold cursor-not-allowed">Previous</button>
                        <button className="px-5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-[13px] font-bold hover:bg-slate-50 transition-colors shadow-sm">Next</button>
                    </div>
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
                                "Ensure Category IDs follow the CAT-XXX naming convention."
                            ].map((item, i) => (
                                <li key={i} className="flex gap-3 text-slate-600 text-[14px] leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                                    <span className="font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Card>

                {/* Visual Tree Map Placeholder */}
                <Card className="border-slate-100 bg-white rounded-[32px] flex flex-col items-center justify-center text-center group cursor-pointer hover:border-blue-200 transition-all min-h-[260px]">
                    <div className="flex flex-col items-center gap-5">
                        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all duration-500">
                            <FolderTree className="w-8 h-8 stroke-[1.5]" />
                        </div>
                        <div>
                            <h3 className="text-[20px] font-black text-slate-900 mb-2">Visual Tree Map</h3>
                            <p className="text-slate-400 font-medium max-w-[220px] text-[14px] leading-relaxed">View your category hierarchy as an interactive visual node map.</p>
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
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-slate-500 ml-1">Category ID (Slug)</label>
                                        <input
                                            type="text"
                                            value={editData.label.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}
                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-4 text-[14px] font-mono text-slate-400 cursor-not-allowed"
                                            disabled
                                            placeholder="auto-generated-slug"
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
        </div>
    );

    // --- Helper Functions ---

    async function handleAddCategory() {
        if (!editData.label.trim()) return toast.error("Category name is required");

        setIsSaving(true);
        try {
            const docID = editData.label.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            const categoryRef = doc(db, "categories", docID);
            await setDoc(categoryRef, {
                label: editData.label,
                docID: docID,
                status: "Active",
                createdAt: new Date(),
                updatedAt: new Date()
            }, { merge: true });

            toast.success("Category added successfully");
            setIsAddingNew(false);
            setEditData({ label: "", docID: "", status: "Active" });
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
            await updateDoc(categoryRef, {
                label: editData.label,
                status: editData.status,
                updatedAt: new Date()
            });
            toast.success("Category updated");
            setEditingId(null);
        } catch (error) {
            toast.error("Failed to update");
        }
    }

    async function handleDeleteCategory(category) {
        if (!window.confirm(`Delete "${category.label}"?`)) return;
        try {
            await deleteDoc(doc(db, "categories", category.id));
            toast.success("Category deleted");
        } catch (error) {
            toast.error("Failed to delete");
        }
    }
};

export default AdminCategoriesPage;
