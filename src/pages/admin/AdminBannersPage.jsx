import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trash2, Plus, Edit, X,
    Image as ImageIcon, Eye,
    AlertTriangle, Settings, GripVertical, Link as LinkIcon,
    Calendar
} from 'lucide-react';
import { Card, Button, Input, LoadingSpinner, ConfirmDialog } from '../../components/ui';

/**
 * AdminBannersPage Component
 * Ported from ecommerce-admin-template
 * Allows administrators to manage banner images displayed on the homepage
 */
const AdminBannersPage = () => {
    // State for banner data
    const [banners, setBanners] = useState([]);
    const [newBanner, setNewBanner] = useState({
        title: '',
        imageUrl: '',
        active: true,
        startDate: '',
        endDate: '',
        ctaLink: '',
        position: 'Homepage Carousel'
    });
    const [isEditing, setIsEditing] = useState(false);
    const [currentEditId, setCurrentEditId] = useState(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); // 'active', 'drafts', 'archived'
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState(null);

    // Alert & Editor State
    const [siteAlerts, setSiteAlerts] = useState([
        { id: 1, title: 'Holiday Shipping Delay Notification', displays: 'Top Bar', priority: 'High', status: 'Active', color: 'orange' },
        { id: 2, title: 'FDA Approval Announcement: SmartMonitor X1', displays: 'Bottom Sticky', priority: 'Medium', status: 'Scheduled (Oct 1)', color: 'blue' }
    ]);
    const [quickEditor, setQuickEditor] = useState({
        message: '✨ Free shipping on orders over ₹5,000. Use code SAVE5K at checkout.',
        bgColor: 'Dark Slate'
    });

    // Fetch banners on component mount
    useEffect(() => {
        fetchBannerData();
    }, []);

    const fetchBannerData = async () => {
        setLoading(true);
        try {
            const bannersCollection = collection(db, 'banners');
            const bannersSnapshot = await getDocs(bannersCollection);
            const bannersData = bannersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Sort banners by order property
            bannersData.sort((a, b) => (a.order || 0) - (b.order || 0));
            setBanners(bannersData);

            // Get slideshow setting
            const settingsCollection = collection(db, 'settings');
            const settingsSnapshot = await getDocs(settingsCollection);
            const settingsData = settingsSnapshot.docs.find(doc => doc.id === 'bannerSettings');
            if (settingsData) {
                setSlideshowEnabled(settingsData.data().slideshowEnabled ?? true);
            }
        } catch (error) {
            console.error('Error fetching banners:', error);
            toast.error('Failed to load banner data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddBanner = async () => {
        if (!newBanner.imageUrl.trim()) {
            toast.error('Banner URL cannot be empty');
            return;
        }

        if (banners.length >= 5) {
            toast.error('Maximum of 5 banners allowed');
            return;
        }

        try {
            const bannerRef = doc(collection(db, 'banners'));
            const bannerData = {
                ...newBanner,
                order: banners.length,
                createdAt: new Date()
            };
            await setDoc(bannerRef, bannerData);

            toast.success('Banner added successfully');
            setBanners([...banners, { id: bannerRef.id, ...bannerData }]);
            setNewBanner({
                title: '',
                imageUrl: '',
                active: true,
                startDate: '',
                endDate: '',
                ctaLink: '',
                position: 'Homepage Carousel'
            });
            setIsAddingNew(false);
        } catch (error) {
            console.error('Error adding banner:', error);
            toast.error('Failed to add banner');
        }
    };

    const handleUpdateBanner = async () => {
        if (!newBanner.imageUrl.trim()) {
            toast.error('Banner URL cannot be empty');
            return;
        }

        try {
            const bannerRef = doc(db, 'banners', currentEditId);
            await setDoc(bannerRef, newBanner, { merge: true });

            setBanners(banners.map(banner =>
                banner.id === currentEditId ? { ...banner, ...newBanner } : banner
            ));

            toast.success('Banner updated successfully');
            setNewBanner({
                title: '',
                imageUrl: '',
                active: true,
                startDate: '',
                endDate: '',
                ctaLink: '',
                position: 'Homepage Carousel'
            });
            setIsEditing(false);
            setCurrentEditId(null);
        } catch (error) {
            console.error('Error updating banner:', error);
            toast.error('Failed to update banner');
        }
    };

    const handleDeleteBanner = async (id) => {
        try {
            await deleteDoc(doc(db, 'banners', id));
            const updatedBanners = banners.filter(banner => banner.id !== id);

            // Re-order remaining banners
            const reorderedBanners = updatedBanners.map((banner, index) => ({
                ...banner,
                order: index
            }));

            // Sequential updates to avoid race conditions in Firestore
            for (const banner of reorderedBanners) {
                await setDoc(doc(db, 'banners', banner.id), { order: banner.order }, { merge: true });
            }

            setBanners(reorderedBanners);
            toast.success('Banner deleted successfully');
        } catch (error) {
            console.error('Error deleting banner:', error);
            toast.error('Failed to delete banner');
        }
    };

    const startEdit = (banner) => {
        setNewBanner({
            title: banner.title || '',
            imageUrl: banner.imageUrl,
            active: banner.active,
            startDate: banner.startDate || '',
            endDate: banner.endDate || '',
            ctaLink: banner.ctaLink || '',
            position: banner.position || 'Homepage Carousel'
        });
        setIsEditing(true);
        setCurrentEditId(banner.id);
        setIsAddingNew(false);
    };

    const cancelEdit = () => {
        setNewBanner({
            title: '',
            imageUrl: '',
            active: true,
            startDate: '',
            endDate: '',
            ctaLink: '',
            position: 'Homepage Carousel'
        });
        setIsEditing(false);
        setCurrentEditId(banner.id);
        setIsAddingNew(false);
    };

    const toggleSlideshowSetting = async () => {
        try {
            const newSetting = !slideshowEnabled;
            await setDoc(doc(db, 'settings', 'bannerSettings'), {
                slideshowEnabled: newSetting
            }, { merge: true });
            setSlideshowEnabled(newSetting);
            toast.success(`Slideshow ${newSetting ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('Error updating slideshow setting:', error);
            toast.error('Failed to update slideshow setting');
        }
    };

    if (loading && banners.length === 0) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <LoadingSpinner size="xl" text="Loading banners..." />
            </div>
        );
    }

    const renderBannerCard = (banner, index) => (
        <motion.div
            key={banner.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
            {/* Banner Image Area */}
            <div className="aspect-[16/9] relative bg-gray-50 overflow-hidden">
                <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                    <Badge variant={banner.active ? 'success' : 'gray'} className="bg-green-500/90 text-white border-none py-1.5 px-3 backdrop-blur-md">
                        {banner.active ? 'LIVE' : 'DRAFT'}
                    </Badge>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 p-2 rounded-lg shadow-lg backdrop-blur-md cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                </div>
            </div>

            {/* Banner Info */}
            <div className="p-5 border-t border-gray-50">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="font-bold text-gray-900 line-clamp-1">{banner.title || "Untitled Banner"}</h3>
                        <p className="text-xs text-gray-400 font-medium">{banner.position || "Homepage Carousel"} - Position {index + 1}</p>
                    </div>
                    <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(banner)} className="h-8 w-8 p-0">
                            <Edit className="w-3.5 h-3.5 text-gray-400" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(banner.id)} className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                    <div>
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Date Range</p>
                        <div className="flex items-center gap-1.5 text-gray-600 font-bold text-xs">
                            <Calendar className="w-3 h-3" />
                            {banner.startDate ? `${new Date(banner.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(banner.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Permanent'}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">CTA Link</p>
                        <div className="flex items-center gap-1.5 text-blue-600 font-bold text-xs truncate">
                            <LinkIcon className="w-3 h-3" />
                            <span className="truncate">{banner.ctaLink || '/'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-10 max-w-7xl mx-auto"
        >
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Marketing & Announcements</h1>
                    <p className="text-gray-500 font-medium">Configure carousel banners, sales messaging, and urgent site notices.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-gray-200 text-gray-700 font-bold bg-white h-11 px-6 shadow-sm">
                        <Eye className="w-4 h-4 mr-2" /> Preview Site
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 h-11 px-6 text-white" onClick={() => setIsAddingNew(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Create New Banner
                    </Button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-8 mb-8 border-b border-gray-100">
                {['Active Banners (4)', 'Drafts (2)', 'Archived'].map((tab) => (
                    <button
                        key={tab}
                        className={`pb-4 text-sm font-bold transition-all relative ${tab.includes('Active') ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        {tab}
                        {tab.includes('Active') && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Banner Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {banners.map((banner, index) => renderBannerCard(banner, index))}

                {/* Reference Dummy Card if empty */}
                {banners.length === 0 && (
                    <div className="col-span-2 py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-lg font-bold text-gray-900">No Banners Configured</h4>
                        <p className="text-gray-500 max-w-sm mx-auto">Click "Create New Banner" to add marketing visuals to your homepage.</p>
                    </div>
                )}
            </div>

            {/* Global Site Alerts Section */}
            <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-500" /> Global Site Alerts
                    </h2>
                    <button className="text-blue-600 font-bold text-sm hover:underline">Manage All Alerts</button>
                </div>

                <div className="space-y-4">
                    {siteAlerts.map((alert) => (
                        <Card key={alert.id} className="p-0 border-none shadow-sm group overflow-hidden">
                            <div className={`flex items-center gap-6 p-4 bg-gradient-to-r ${alert.color === 'orange' ? 'from-orange-50/50 to-white' : 'from-blue-50/50 to-white'} border border-gray-100 rounded-xl`}>
                                <div className={`w-1.5 h-10 rounded-full ${alert.color === 'orange' ? 'bg-orange-400' : 'bg-blue-500'}`} />
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 mb-1">{alert.title}</h4>
                                    <div className="flex list-none gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <span>Displays: {alert.displays}</span>
                                        <span className="opacity-30">|</span>
                                        <span>Priority: {alert.priority}</span>
                                        <span className="opacity-30">|</span>
                                        <div className="flex items-center gap-1">
                                            <span>Status:</span>
                                            <span className={alert.status === 'Active' ? 'text-green-600' : 'text-blue-500'}>{alert.status}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="bg-white text-gray-700 font-bold border-gray-200 h-9 px-4 rounded-lg">
                                        {alert.id === 1 ? 'Deactivate' : 'Edit Schedule'}
                                    </Button>
                                    <button className="p-2 text-gray-300 hover:text-gray-500">
                                        <Settings className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Quick Editor Section */}
            <section>
                <Card className="p-8 border-none shadow-xl">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Editor: Top Bar Promo</h2>

                    <div className="space-y-6">
                        {/* Visual Preview */}
                        <div className="bg-slate-900 rounded-lg p-3 text-center text-white text-xs font-medium relative border border-slate-800 shadow-inner">
                            <span className="opacity-80">✨ {quickEditor.message}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-9">
                                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Text Message</label>
                                <input
                                    type="text"
                                    value={quickEditor.message}
                                    onChange={(e) => setQuickEditor({ ...quickEditor, message: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Background Color</label>
                                <div className="relative group">
                                    <button className="w-full h-[46px] bg-white border border-gray-200 rounded-xl px-4 flex items-center justify-between text-sm font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full bg-slate-900" />
                                            Dark Slate
                                        </div>
                                        <Settings className="w-3.5 h-3.5 text-gray-400" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                            <button className="text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors">Discard Changes</button>
                            <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-8 text-white font-bold shadow-lg shadow-blue-200">
                                Update Announcement
                            </Button>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Modal for adding/editing banner (optional/needs implementation) */}
            <AnimatePresence>
                {(isAddingNew || isEditing) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-extrabold text-gray-900">
                                        {isEditing ? "Edit Banner" : "New Marketing Banner"}
                                    </h3>
                                    <button onClick={cancelEdit} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <Input
                                        label="Banner Title"
                                        placeholder="e.g. 2024 Summer Hospital Grade Sale"
                                        value={newBanner.title}
                                        onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                                    />

                                    <div className="grid grid-cols-2 gap-6">
                                        <Input
                                            label="Start Date"
                                            type="date"
                                            value={newBanner.startDate}
                                            onChange={(e) => setNewBanner({ ...newBanner, startDate: e.target.value })}
                                        />
                                        <Input
                                            label="End Date"
                                            type="date"
                                            value={newBanner.endDate}
                                            onChange={(e) => setNewBanner({ ...newBanner, endDate: e.target.value })}
                                        />
                                    </div>

                                    <Input
                                        label="Banner Image URL"
                                        placeholder="https://..."
                                        value={newBanner.imageUrl}
                                        onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                                    />

                                    <Input
                                        label="CTA Link"
                                        placeholder="/products/vent-v2"
                                        value={newBanner.ctaLink}
                                        onChange={(e) => setNewBanner({ ...newBanner, ctaLink: e.target.value })}
                                    />

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="active-toggle"
                                            checked={newBanner.active}
                                            onChange={(e) => setNewBanner({ ...newBanner, active: e.target.checked })}
                                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="active-toggle" className="text-sm font-bold text-gray-700">Set as Live Banner</label>
                                    </div>

                                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                                        <Button variant="ghost" className="font-bold text-gray-400" onClick={cancelEdit}>Cancel</Button>
                                        <Button className="bg-blue-600 hover:bg-blue-700 h-11 px-8 text-white font-bold" onClick={isEditing ? handleUpdateBanner : handleAddBanner}>
                                            {isEditing ? "Save Changes" : "Create Banner"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ConfirmDialog
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => handleDeleteBanner(confirmDelete)}
                title="Delete Banner"
                message="Are you sure you want to delete this banner?"
                confirmText="Delete"
                variant="danger"
            />
        </motion.div>
    );
};

export default AdminBannersPage;
