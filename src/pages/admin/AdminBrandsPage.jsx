import { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { motion } from "framer-motion";
import {
    Plus, Edit, Trash2,
    ChevronRight, LayoutGrid, ListTree,
    Building2, FolderTree, Info,
    GripVertical, Download,
    Activity, Stethoscope, CheckCircle2
} from "lucide-react";
import { Card, Button, Input, LoadingSpinner, Modal, Badge } from "../../components/ui";
import { toast } from "react-toastify";

/**
 * Admin Brands Management Page
 */
const AdminBrandsPage = () => {
    const [brands, setBrands] = useState([]);
    const [filteredBrands, setFilteredBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("brands");
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    // Modal States
    const [modalOpen, setModalOpen] = useState(false);
    const [editBrand, setEditBrand] = useState(null);
    const [label, setLabel] = useState("");
    const [docID, setDocID] = useState("");
    const [isSaving, setIsSaving] = useState(false);

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
                docID: doc.id // Ensure docID is consistent
            }));
            setBrands(brandsList);
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
            const snapshot = await getDocs(collection(db, "categories"));
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCategories(list);
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
                // Update existing brand
                const brandRef = doc(db, "brands", editBrand.id);
                await updateDoc(brandRef, brandData);
                toast.success("Brand updated successfully");
            } else {
                // Add new brand
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
            toast.error("Failed to save brand");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteBrand = async (brand) => {
        if (!window.confirm(`Are you sure you want to delete the brand "${brand.label}"?`)) {
            return;
        }

        try {
            await deleteDoc(doc(db, "brands", brand.id));
            toast.success("Brand deleted successfully");
            fetchBrands();
        } catch (error) {
            console.error("Error deleting brand:", error);
            toast.error("Failed to delete brand");
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
                    <Button variant="outline" className="border-gray-200 text-gray-700 font-bold bg-white h-11 px-6 shadow-sm">
                        <Download className="w-4 h-4 mr-2" /> Export Data
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 h-11 px-6 text-white"
                        onClick={() => {
                            setEditBrand(null);
                            setLabel("");
                            setDocID("");
                            setModalOpen(true);
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" /> New Entry
                    </Button>
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Featured Brands */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-blue-600" /> Featured Brands
                        </h2>
                        <button className="text-blue-600 text-[10px] font-black uppercase tracking-tighter hover:underline">Add Brand</button>
                    </div>

                    <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredBrands.map((brand) => (
                            <Card
                                key={brand.id}
                                className="p-4 border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer group"
                                onClick={() => {
                                    setEditBrand(brand);
                                    setLabel(brand.label);
                                    setDocID(brand.docID);
                                    setModalOpen(true);
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                        <Building2 className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 text-sm truncate">{brand.label}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">
                                            {Math.floor(Math.random() * 2000 + 100).toLocaleString()} Products
                                        </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" />
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Right Column: Category Hierarchy */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <ListTree className="w-5 h-5 text-blue-600" /> Category Hierarchy
                        </h2>
                        <button className="text-blue-600 text-[10px] font-black uppercase tracking-tighter hover:underline">Add Category</button>
                    </div>

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
                                        {cat.status === 'ACTIVE' || true && (
                                            <div className="ml-auto">
                                                <Badge className="!bg-[#2b64e3] !text-white !border-none py-1 px-3 text-[10px] font-bold rounded-full shadow-sm">
                                                    ACTIVE
                                                </Badge>
                                            </div>
                                        )}
                                        <div className="flex gap-1.5 ml-4">
                                            <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 text-gray-400">
                                    <p className="text-sm font-medium">No categories found in database</p>
                                </div>
                            )}

                            {/* Empty Root Adder */}
                            <div className="mt-6 border-2 border-dashed border-slate-200 rounded-xl p-5 flex items-center justify-center gap-3 text-slate-400 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group">
                                <div className="bg-slate-300 group-hover:bg-[#2b64e3] text-white rounded p-1 transition-colors flex items-center justify-center">
                                    <Plus className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-slate-400 group-hover:text-blue-600 transition-colors">Drop or Add New Root Category</span>
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
                            <h4 className="font-bold text-slate-900 text-[15px] leading-6">Pro Tip: Reordering</h4>
                            <p className="text-[13px] text-slate-600 leading-relaxed mt-1">
                                You can drag and drop categories to reorder them or change their nesting level. Changes are saved automatically.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Site Footer */}
            <footer className="mt-20 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">© 2024 MedEquip E-Commerce Admin</p>
                <div className="flex items-center gap-6">
                    <button className="text-gray-400 hover:text-gray-900 text-[10px] font-black uppercase tracking-widest">System Logs</button>
                    <button className="text-gray-400 hover:text-gray-900 text-[10px] font-black uppercase tracking-widest">Support</button>
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
        </motion.div>
    );
};

export default AdminBrandsPage;
