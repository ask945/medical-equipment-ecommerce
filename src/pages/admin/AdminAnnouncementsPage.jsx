import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trash2, Plus, Edit, X,
    Link as LinkIcon, MessageSquare,
    Pencil, Volume2,
    Info, Calendar, Box, MousePointer2, Clock, Eye,
} from 'lucide-react';
import { Card, Button, LoadingSpinner, ConfirmDialog } from '../../components/ui';

const AdminAnnouncementsPage = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [promoMessage, setPromoMessage] = useState("");
    const [filterTab, setFilterTab] = useState('All');
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentEditId, setCurrentEditId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [newAnnouncement, setNewAnnouncement] = useState({
        text: '',
        priority: 'Medium',
        status: 'Active',
        type: 'Alert'
    });

    useEffect(() => {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        const unsubAnnouncements = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => {
                const docData = doc.data();
                return {
                    ...docData, // Put this first to allow mapping to override properties
                    id: doc.id,
                    title: docData.text || "Untitled Announcement",
                    // Map numeric or boolean values to UI labels
                    priority: docData.priority === 2 ? 'High' : docData.priority === 1 ? 'Medium' : 'Low',
                    status: docData.status || (docData.active ? 'Active' : 'Draft'),
                    date: docData.createdAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Oct 24, 2023',
                    type: docData.type || 'Alert'
                };
            });
            setAnnouncements(data);
            setLoading(false);
        });

        const unsubPromo = onSnapshot(doc(db, 'settings', 'promobar'), (snapshot) => {
            if (snapshot.exists()) {
                setPromoMessage(snapshot.data().message);
            }
        });

        return () => {
            unsubAnnouncements();
            unsubPromo();
        };
    }, []);

    const handleUpdatePromo = async () => {
        try {
            await setDoc(doc(db, 'settings', 'promobar'), {
                message: promoMessage,
                updatedAt: new Date()
            }, { merge: true });
            toast.success('Promo bar updated successfully!');
        } catch (error) {
            toast.error('Failed to update promo bar');
        }
    };

    const handleAddAnnouncement = async () => {
        if (!newAnnouncement.text.trim()) {
            toast.error('Announcement text is required');
            return;
        }
        try {
            const announcementRef = doc(collection(db, 'announcements'));
            const priorityMap = { 'High': 2, 'Medium': 1, 'Low': 0 };
            await setDoc(announcementRef, {
                text: newAnnouncement.text,
                priority: priorityMap[newAnnouncement.priority],
                active: newAnnouncement.status === 'Active',
                status: newAnnouncement.status, // Save explicit status
                type: newAnnouncement.type,
                createdAt: new Date()
            });
            toast.success('Announcement published!');
            setIsAddingNew(false);
            setNewAnnouncement({ text: '', priority: 'Medium', status: 'Active', type: 'Alert' });
        } catch (error) {
            toast.error('Failed to add announcement');
        }
    };

    const handleUpdateAnnouncement = async () => {
        try {
            const priorityMap = { 'High': 2, 'Medium': 1, 'Low': 0 };
            await setDoc(doc(db, 'announcements', currentEditId), {
                text: newAnnouncement.text,
                priority: priorityMap[newAnnouncement.priority],
                active: newAnnouncement.status === 'Active',
                status: newAnnouncement.status, // Save explicit status
                type: newAnnouncement.type,
                updatedAt: new Date()
            }, { merge: true });
            toast.success('Announcement updated!');
            setIsEditing(false);
            setCurrentEditId(null);
            setNewAnnouncement({ text: '', priority: 'Medium', status: 'Active', type: 'Alert' });
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        try {
            await deleteDoc(doc(db, 'announcements', id));
            toast.success('Deleted');
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const startEdit = (a) => {
        setNewAnnouncement({
            text: a.text,
            priority: a.priority,
            status: a.status,
            type: a.type
        });
        setCurrentEditId(a.id);
        setIsEditing(true);
    };

    const stats = [
        { label: 'Total Alert Impressions', value: '128,492', change: '+12% vs last week', icon: <Eye className="w-5 h-5 text-blue-600" />, trend: 'up' },
        { label: 'Avg. Engagement Rate', value: '3.8%', change: '+5.4%', icon: <MousePointer2 className="w-5 h-5 text-blue-600" />, trend: 'up' },
        { label: 'Active Display Duration', value: '14.2 Days', change: 'Stable', icon: <Clock className="w-5 h-5 text-blue-600" />, trend: 'stable' }
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <LoadingSpinner size="xl" text="Connecting to core systems..." />
            </div>
        );
    }

    const filteredAnnouncements = announcements.filter(a => {
        if (filterTab === 'All') return true;
        return a.status === filterTab;
    });

    return (
        <div className="space-y-8 pb-10 px-4">
            <AnimatePresence>
                {(isAddingNew || isEditing) && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-black text-slate-900">{isEditing ? 'Edit' : 'New'} Announcement</h2>
                                    <button onClick={() => { setIsAddingNew(false); setIsEditing(false); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                        <X className="w-6 h-6 text-slate-400" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[13px] font-bold text-slate-500 ml-1">Message</label>
                                        <textarea
                                            value={newAnnouncement.text}
                                            onChange={(e) => setNewAnnouncement({ ...newAnnouncement, text: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[14px] font-medium min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="Enter announcement text..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold text-slate-500 ml-1">Priority</label>
                                            <select
                                                value={newAnnouncement.priority}
                                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[14px] font-bold text-slate-900"
                                            >
                                                {['High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold text-slate-500 ml-1">Status</label>
                                            <select
                                                value={newAnnouncement.status}
                                                onChange={(e) => setNewAnnouncement({ ...newAnnouncement, status: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[14px] font-bold text-slate-900"
                                            >
                                                {['Active', 'Draft', 'Scheduled'].map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => { setIsAddingNew(false); setIsEditing(false); }} className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                                    <button onClick={isEditing ? handleUpdateAnnouncement : handleAddAnnouncement} className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                                        {isEditing ? 'Save Changes' : 'Publish Now'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
                <div>
                    <h1 className="text-[32px] font-black text-slate-900 tracking-tight">Announcements & Alerts</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage communications and critical system alerts across the platform.</p>
                </div>
                <Button
                    onClick={() => setIsAddingNew(true)}
                    className="bg-[#2563eb] hover:bg-blue-700 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-blue-100"
                    icon={<Plus className="w-5 h-5" />}
                >
                    Create New Announcement
                </Button>
            </div>

            {/* Site-wide Promo Bar Editor */}
            <Card className="p-6 border-slate-100/80 shadow-sm relative overflow-visible">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Volume2 className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-black text-slate-900">Site-wide Promo Bar Editor</h2>
                </div>

                <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-500 ml-1">Top Bar Promo Message</label>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={promoMessage}
                                onChange={(e) => setPromoMessage(e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-3 px-5 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all pr-12"
                                placeholder="Enter marketing message for the top bar..."
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Pencil className="w-4 h-4 text-slate-400" />
                            </div>
                        </div>
                        <Button
                            onClick={handleUpdatePromo}
                            className="!bg-[#111827] hover:!bg-black text-white font-bold h-12 px-8 rounded-xl shadow-lg transition-all"
                        >
                            Update Promo Bar
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Recent Announcements Table Card */}
            <Card className="border-slate-100/80 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-lg font-black text-slate-900">Recent Announcements</h3>
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
                        {['All', 'Active', 'Scheduled'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilterTab(tab)}
                                className={`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all ${filterTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-hide min-h-[200px]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#f8fafc]/50">
                            <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
                                <th className="py-4 px-8">Announcement Title</th>
                                <th className="py-4 px-4 text-center">Priority</th>
                                <th className="py-4 px-4 text-center">Status</th>
                                <th className="py-4 px-4 text-center">Last Updated</th>
                                <th className="py-4 px-8 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredAnnouncements.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-4 bg-slate-50 rounded-2xl">
                                                <MessageSquare className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 font-bold">No announcements found matching the criteria</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAnnouncements.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-5 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${row.type === 'Policy' ? 'bg-blue-100 text-blue-600' :
                                                    row.type === 'Maintenance' ? 'bg-indigo-100 text-indigo-600' :
                                                        'bg-blue-50 text-blue-500'
                                                    }`}>
                                                    {row.type === 'Policy' ? <Info className="w-4 h-4" /> :
                                                        row.type === 'Maintenance' ? <Calendar className="w-4 h-4" /> :
                                                            <Box className="w-4 h-4" />}
                                                </div>
                                                <span className="font-bold text-slate-900 text-[14px]">{row.title}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${row.priority === 'High' ? 'bg-red-50 text-red-600' :
                                                row.priority === 'Medium' ? 'bg-orange-50 text-orange-600' :
                                                    'bg-blue-50 text-blue-600'
                                                }`}>
                                                {row.priority}
                                            </span>
                                        </td>
                                        <td className="py-5 px-4 text-center">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${row.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                                                row.status === 'Scheduled' ? 'bg-indigo-50 text-indigo-600' :
                                                    'bg-slate-50 text-slate-500'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${row.status === 'Active' ? 'bg-emerald-500' :
                                                    row.status === 'Scheduled' ? 'bg-indigo-500' :
                                                        'bg-slate-400'
                                                    }`} />
                                                <span className="text-[10px] font-black uppercase tracking-wider">{row.status}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-4 text-center text-[13px] font-bold text-slate-400">
                                            {row.date}
                                        </td>
                                        <td className="py-5 px-8 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => startEdit(row)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDelete(row.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-[13px] font-bold text-slate-400">Showing {filteredAnnouncements.length} of {announcements.length} announcements</p>
                    <div className="flex items-center gap-3">
                        <button className="px-5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-[13px] font-bold hover:bg-slate-50 transition-colors">Previous</button>
                        <button className="px-5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-[13px] font-bold hover:bg-slate-50 transition-colors shadow-sm">Next</button>
                    </div>
                </div>
            </Card>

            {/* Bottom Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (stat.label && (
                    <Card key={i} className="p-6 border-slate-100/80 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-50 text-blue-600">
                                {stat.icon}
                            </div>
                            <span className={`text-[11px] font-black uppercase tracking-wider ${stat.trend === 'up' ? 'text-emerald-500' : 'text-slate-400'}`}>
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-slate-500 text-[13px] font-bold mb-1">{stat.label}</p>
                        <h3 className="text-[28px] font-black text-slate-900 leading-none">{stat.value}</h3>
                    </Card>
                )))}
            </div>

            <ConfirmDialog
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => handleDeleteAnnouncement(confirmDelete)}
                title="Delete Announcement"
                message="Are you sure you want to delete this announcement?"
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
};

export default AdminAnnouncementsPage;
