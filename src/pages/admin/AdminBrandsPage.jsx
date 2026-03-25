import { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, getDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { adminDb as db } from "../../adminFirebase";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Edit, Trash2,
    ChevronRight, LayoutGrid, ListTree,
    Building2, FolderTree, Info,
    GripVertical, Download,
    Activity, Stethoscope, CheckCircle2,
    Eye, ChevronDown
} from "lucide-react";
import { Card, Button, Input, LoadingSpinner, Modal, Badge, ConfirmDialog } from "../../components/ui";
import { toast } from "react-toastify";
import { exportToCSV } from "../../utils/csvUtils";
import { getCategories } from "../../services/categoryService";
import { useNavigate } from "react-router-dom";

/**
 * Admin Brands Management Page
 */
const AdminBrandsPage = () => {
    const navigate = useNavigate();
    const [brands, setBrands] = useState([]);
    const [filteredBrands, setFilteredBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("brands");
    const [categories, setCategories] = useState([]); // categories shown in hierarchy tree
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [hierarchyIds, setHierarchyIds] = useState(null); // null = not loaded yet
    const [expandedBrandId, setExpandedBrandId] = useState(null);

    const [confirmDelete, setConfirmDelete] = useState(null);

    // Modal States
    const [modalOpen, setModalOpen] = useState(false);
    const [editBrand, setEditBrand] = useState(null);
    const [label, setLabel] = useState("");
    const [docID, setDocID] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Root category dropdown
    const [categorySearchTerm, setCategorySearchTerm] = useState("");
    const [productCategories, setProductCategories] = useState([]);
    // Category delete confirm modal
    const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState(null);

    useEffect(() => {
        fetchBrands();
        fetchCategories();
    }, []);

    useEffect(() => {
        const filtered = brands.filter(brand =>
            brand.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            brand.docID?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredBrands(filtered);
    }, [brands, searchTerm]);

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const snapshot = await getDocs(collection(db, "brands"));
            const brandsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                docID: doc.id
            }));

            const productsSnapshot = await getDocs(collection(db, "products"));
            const productCounts = {};
            const uniqueCategories = new Set();
            productsSnapshot.docs.forEach(doc => {
                const product = doc.data();
                if (product.brand) {
                    const rawBrand = product.brand.toLowerCase().trim();
                    const brandSlug = rawBrand.replace(/\s+/g, '-');
                    productCounts[brandSlug] = (productCounts[brandSlug] || 0) + 1;
                    productCounts[rawBrand] = (productCounts[rawBrand] || 0) + 1;
                }
                if (product.category) {
                    uniqueCategories.add(product.category.trim());
                }
            });

            // Fetch categories from Firestore categories collection
            try {
                const firestoreCategories = await getCategories();
                const catNames = firestoreCategories
                    .filter(c => c.name || c.label)
                    .map(c => c.name || c.label);
                // Merge Firestore categories with product-derived ones (Firestore takes priority)
                const mergedSet = new Set([...catNames, ...uniqueCategories]);
                setProductCategories([...mergedSet].sort());
            } catch {
                setProductCategories([...uniqueCategories].sort());
            }

            const brandsWithCounts = brandsList.map(brand => {
                const docIdKey = (brand.docID || '').toLowerCase().trim();
                const labelKey = (brand.label || '').toLowerCase().trim();
                const countBySlug = productCounts[docIdKey] || 0;
                const countByLabel = productCounts[labelKey] || 0;
                return {
                    ...brand,
                    productCount: Math.max(countBySlug, countByLabel)
                };
            });

            setBrands(brandsWithCounts);
        } catch (err) {
            console.error("Error fetching brands:", err);
            toast.error("Failed to fetch brands");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        setCategoriesLoading(true);
        try {
            // Fetch ALL categories from Firestore
            const snapshot = await getDocs(collection(db, "categories"));
            const allCats = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // Fetch the hierarchy doc to know which categories to show in tree
            const hierRef = doc(db, "settings", "categoryHierarchy");
            const hierSnap = await getDoc(hierRef);
            let visibleIds;

            if (hierSnap.exists() && hierSnap.data().visibleCategories) {
                visibleIds = hierSnap.data().visibleCategories;
                setHierarchyIds(visibleIds);
                setCategories(allCats.filter(c => visibleIds.includes(c.id)));
            } else {
                // No hierarchy doc yet — start empty, admin adds manually
                setHierarchyIds([]);
                setCategories([]);
                await setDoc(hierRef, { visibleCategories: [] }, { merge: true });
            }
        } catch (err) {
            console.error("Error fetching categories:", err);
        } finally {
            setCategoriesLoading(false);
        }
    };

    const handleAddOrEdit = async () => {
        if (!label.trim()) return toast.error("Brand name is required");
        if (!docID.trim()) return toast.error("Brand ID is required");

        try {
            setIsSaving(true);
            const brandData = {
                label: label.trim(),
                docID: docID.trim().toLowerCase().replace(/\s+/g, '-'),
                updatedAt: new Date()
            };

            if (editBrand) {
                const brandRef = doc(db, "brands", editBrand.id);
                await updateDoc(brandRef, brandData);
                toast.success("Brand updated successfully");
            } else {
                const brandRef = doc(db, "brands", brandData.docID);
                await setDoc(brandRef, {
                    ...brandData,
                    createdAt: new Date()
                });
                toast.success("Brand added successfully");
            }

            setModalOpen(false);
            setEditBrand(null);
            setLabel("");
            setDocID("");
            fetchBrands();
        } catch (error) {
            console.error("Error saving brand:", error);
            toast.error(error.message || "Failed to save brand");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteBrand = async (brand) => {
        try {
            await deleteDoc(doc(db, "brands", brand.id));
            toast.success("Brand deleted successfully");
            setExpandedBrandId(null);
            fetchBrands();
        } catch (error) {
            console.error("Error deleting brand:", error);
            toast.error("Failed to delete brand");
        }
    };

    const handleExport = () => {
        if (!brands || brands.length === 0) {
            toast.warn("No brands to export");
            return;
        }

        const headers = [
            { key: 'label', label: 'Brand Name' },
            { key: 'docID', label: 'Brand Slug' },
            { key: 'productCount', label: 'Product Count' }
        ];

        exportToCSV(brands, `Brands_Export_${new Date().toISOString().split('T')[0]}.csv`, headers);
        toast.success("Brands exported to CSV");
    };

    // Get categories not already displayed (for the "Add Root Category" dropdown)
    const availableCategories = (() => {
        // All products' categories that exist but aren't in the categories collection
        return [];
    })();

    const handleAddRootCategory = async (categoryLabel) => {
        try {
            // Find the matching category in Firestore — only existing categories allowed
            const snapshot = await getDocs(collection(db, "categories"));
            const match = snapshot.docs.find(d => {
                const data = d.data();
                return (data.name || data.label || '').toLowerCase() === categoryLabel.toLowerCase();
            });

            if (!match) {
                toast.error("Category does not exist. Create it first in the Categories page.");
                return;
            }

            // Add to hierarchy visibility list
            const hierRef = doc(db, "settings", "categoryHierarchy");
            await setDoc(hierRef, { visibleCategories: arrayUnion(match.id) }, { merge: true });

            toast.success(`"${categoryLabel}" added to hierarchy`);
            fetchCategories();
        } catch (error) {
            console.error("Error adding category:", error);
            toast.error("Failed to add category");
        }
    };

    const handleDeleteCategory = (cat) => {
        setDeleteCategoryConfirm(cat);
    };

    const confirmDeleteCategory = async () => {
        if (!deleteCategoryConfirm) return;
        try {
            // Only remove from hierarchy list, NOT the actual category
            const hierRef = doc(db, "settings", "categoryHierarchy");
            await updateDoc(hierRef, { visibleCategories: arrayRemove(deleteCategoryConfirm.id) });
            toast.success(`"${deleteCategoryConfirm.label}" removed from hierarchy`);
            setDeleteCategoryConfirm(null);
            fetchCategories();
        } catch (error) {
            console.error("Error removing category from hierarchy:", error);
            toast.error("Failed to remove from hierarchy");
            setDeleteCategoryConfirm(null);
        }
    };

    // Auto-generate docID from label when adding
    useEffect(() => {
        if (!editBrand && label) {
            setDocID(label.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, ""));
        }
    }, [label, editBrand]);

    if (loading && brands.length === 0) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <LoadingSpinner size="xl" text="Loading brands..." />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-10 max-w-7xl mx-auto"
        >
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Catalog Management</h1>
                    <p className="text-gray-500 font-medium">Organize and manage equipment brands and category hierarchies.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleExport} className="border-gray-200 text-gray-700 font-bold bg-white h-11 px-6 shadow-sm">
                        <Download className="w-4 h-4 mr-2" /> Export Data
                    </Button>
                    {activeTab === 'brands' && (
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 h-11 px-6 text-white"
                            onClick={() => {
                                setEditBrand(null);
                                setLabel("");
                                setDocID("");
                                setModalOpen(true);
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add Brand
                        </Button>
                    )}
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-8 mb-8 border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('brands')}
                    className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2
                        ${activeTab === 'brands' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <LayoutGrid className="w-4 h-4" /> Brands Management
                    {activeTab === 'brands' && (
                        <motion.div layoutId="catalogTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2
                        ${activeTab === 'categories' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <FolderTree className="w-4 h-4" /> Category Hierarchy
                    {activeTab === 'categories' && (
                        <motion.div layoutId="catalogTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                    )}
                </button>
            </nav>

            {/* Brands Tab */}
            {activeTab === 'brands' && (
                <div className="space-y-3">
                    {/* Search */}
                    <Input
                        placeholder="Search brands..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="max-w-sm mb-4"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredBrands.map((brand) => (
                            <Card
                                key={brand.id}
                                className={`p-4 border-gray-100 transition-all ${expandedBrandId === brand.id ? 'border-blue-200 shadow-lg shadow-blue-500/5' : 'hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5'}`}
                            >
                                <div
                                    className="flex items-center gap-4 cursor-pointer"
                                    onClick={() => setExpandedBrandId(expandedBrandId === brand.id ? null : brand.id)}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${expandedBrandId === brand.id ? 'bg-blue-50 border-blue-100 border' : 'bg-gray-50 border border-gray-100'}`}>
                                        <Building2 className={`w-5 h-5 ${expandedBrandId === brand.id ? 'text-blue-600' : 'text-gray-400'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 text-sm truncate">{brand.label}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">
                                            {brand.productCount?.toLocaleString() || 0} Products
                                        </p>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform ${expandedBrandId === brand.id ? 'rotate-180 text-blue-600' : ''}`} />
                                </div>

                                {/* Expanded actions */}
                                <AnimatePresence>
                                    {expandedBrandId === brand.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 text-xs font-bold"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditBrand(brand);
                                                        setLabel(brand.label);
                                                        setDocID(brand.docID);
                                                        setModalOpen(true);
                                                    }}
                                                >
                                                    <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Brand
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/admin/products?brand=${brand.docID}`);
                                                    }}
                                                >
                                                    <Eye className="w-3.5 h-3.5 mr-1.5" /> View Products
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs font-bold text-red-500 border-red-200 hover:bg-red-50 px-3"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmDelete(brand);
                                                    }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        ))}
                    </div>

                    {filteredBrands.length === 0 && !loading && (
                        <div className="text-center py-20 text-gray-400">
                            <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm font-medium">No brands found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
                <div className="space-y-6">
                    <Card className="p-8 border-none shadow-xl bg-white/80 backdrop-blur-sm min-h-[400px] overflow-y-auto custom-scrollbar max-h-[calc(100vh-320px)]">
                        <div className="space-y-4">
                            {categoriesLoading ? (
                                <div className="flex justify-center py-20">
                                    <LoadingSpinner size="md" text="Fetching categories..." />
                                </div>
                            ) : categories.length > 0 ? (
                                categories.map(cat => (
                                    <div key={cat.id} className="flex items-center gap-3 p-4 rounded-xl border bg-[#f8fafc] border-slate-100 group transition-all hover:bg-white hover:shadow-md hover:border-blue-100">
                                        <GripVertical className="w-4 h-4 text-slate-300" />
                                        <div className="w-8 h-8 flex items-center justify-center text-blue-600">
                                            {cat.label.toLowerCase().includes('diagnos') ? <Activity className="w-5 h-5" /> :
                                                cat.label.toLowerCase().includes('surgic') ? <Stethoscope className="w-5 h-5" /> :
                                                    <FolderTree className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-900 text-[15px]">{cat.label}</h4>
                                        </div>
                                        <Badge className="!bg-[#2b64e3] !text-white !border-none py-1 px-3 text-[10px] font-bold rounded-full shadow-sm">
                                            ACTIVE
                                        </Badge>
                                        <button
                                            onClick={() => handleDeleteCategory(cat)}
                                            className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                            title={`Remove ${cat.label}`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 text-gray-400">
                                    <p className="text-sm font-medium">No categories found in database</p>
                                </div>
                            )}

                            {/* Add Root Category - dropdown from Firestore categories */}
                            <div className="mt-6">
                                <label className="text-xs font-bold text-slate-500 mb-2 block">Add a subcategory to existing category</label>
                                <div className="flex gap-2">
                                    <select
                                        value={categorySearchTerm}
                                        onChange={(e) => setCategorySearchTerm(e.target.value)}
                                        className="flex-1 px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                                    >
                                        <option value="">Select a category...</option>
                                        {(() => {
                                            const existingCatIds = categories.map(c => c.id.toLowerCase());
                                            const existingCatLabels = categories.map(c => c.label.toLowerCase());
                                            return productCategories.filter(cat => {
                                                const slug = cat.toLowerCase().replace(/\s+/g, '-');
                                                const lower = cat.toLowerCase();
                                                return !existingCatIds.includes(slug) && !existingCatLabels.includes(lower);
                                            }).map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ));
                                        })()}
                                    </select>
                                    <button
                                        onClick={() => {
                                            if (categorySearchTerm) {
                                                handleAddRootCategory(categorySearchTerm);
                                                setCategorySearchTerm('');
                                            } else {
                                                toast.error('Please select a category first');
                                            }
                                        }}
                                        className="px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                                    >
                                        <Plus className="w-4 h-4" /> Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Pro Tip Section */}
                    <div className="bg-[#ebf2fe] p-5 flex gap-4 rounded-xl shadow-sm border border-blue-100/50">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
                                <Info className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-900 text-[15px] leading-6">Category Management</h4>
                            <p className="text-[13px] text-slate-600 leading-relaxed mt-1">
                                Categories are used to organize products. Add categories from the suggested list above. Products are assigned categories when adding or editing them.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Site Footer */}
            <footer className="mt-20 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">&copy; 2024 MedEquip E-Commerce Admin</p>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        <span className="text-[10px] text-green-600 font-black uppercase tracking-widest">System Live</span>
                    </div>
                </div>
            </footer>

            {/* Add/Edit Brand Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editBrand ? "Edit Brand" : "Add New Brand"}
                size="md"
            >
                <div className="space-y-4 pt-2">
                    <Input
                        label="Brand Name"
                        placeholder="e.g. Philips, GE Healthcare"
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                        required
                    />
                    <Input
                        label="Brand ID (Slug)"
                        placeholder="philips"
                        value={docID}
                        onChange={e => setDocID(e.target.value)}
                        disabled={!!editBrand}
                        helpText="Used for system identification. Cannot be changed after creation."
                        required
                    />

                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button variant="outline" onClick={() => setModalOpen(false)} className="font-bold">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddOrEdit}
                            loading={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        >
                            {editBrand ? "Update Brand" : "Create Brand"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Category Delete Confirm Modal */}
            <Modal
                isOpen={!!deleteCategoryConfirm}
                onClose={() => setDeleteCategoryConfirm(null)}
                title="Remove Category"
                size="sm"
            >
                <div className="space-y-4 pt-2">
                    <p className="text-sm text-gray-600">
                        Are you sure you want to remove <span className="font-bold text-gray-900">"{deleteCategoryConfirm?.label}"</span> from the category hierarchy?
                    </p>
                    <p className="text-xs text-gray-400">This only removes it from the displayed tree. The category still exists and can be re-added.</p>
                    <div className="flex gap-3 justify-end pt-4 border-t">
                        <Button variant="outline" onClick={() => setDeleteCategoryConfirm(null)} className="font-bold">
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDeleteCategory}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold"
                        >
                            Remove
                        </Button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => handleDeleteBrand(confirmDelete)}
                title="Delete Brand"
                message={`Are you sure you want to delete the brand "${confirmDelete?.label}"?`}
                confirmText="Delete"
                variant="danger"
            />
        </motion.div>
    );
};

export default AdminBrandsPage;
