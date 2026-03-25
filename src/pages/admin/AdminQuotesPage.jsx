import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { adminDb as db } from "../../adminFirebase";
import { motion } from "framer-motion";
import {
    FileText, Search, Filter,
    Download, Trash2, Eye,
    Calendar, User, MessageSquare, Clock, Banknote
} from "lucide-react";
import { Modal, Button, Card, LoadingSpinner, Badge, ConfirmDialog } from "../../components/ui";
import { toast } from "react-toastify";
import { exportToCSV } from "../../utils/csvUtils";

const AdminQuotesPage = () => {
    const [quotes, setQuotes] = useState([]);
    const [filteredQuotes, setFilteredQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => {
        fetchQuotes();
    }, []);

    useEffect(() => {
        let filtered = quotes.filter(item => {
            const matchesSearch = 
                item.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.message?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
            
            return matchesSearch && matchesStatus;
        });
        setFilteredQuotes(filtered);
        setCurrentPage(1);
    }, [quotes, searchTerm, filterStatus]);

    const fetchQuotes = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "quotes"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));
            setQuotes(list);
        } catch (error) {
            console.error("Error fetching quotes:", error);
            toast.error("Failed to load quotes");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await updateDoc(doc(db, "quotes", id), { status: newStatus });
            setQuotes(quotes.map(item => item.id === id ? { ...item, status: newStatus } : item));
            setSelectedQuote(prev => prev ? { ...prev, status: newStatus } : prev);
            toast.success(`Quote marked as ${newStatus}`);
            setTimeout(() => setIsModalOpen(false), 1500);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, "quotes", id));
            setQuotes(quotes.filter(item => item.id !== id));
            toast.success("Quote request deleted");
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Failed to delete quote request");
        }
    };

    const handleExport = () => {
        const headers = [
            { key: 'firstName', label: 'First Name' },
            { key: 'lastName', label: 'Last Name' },
            { key: 'email', label: 'Email' },
            { key: 'message', label: 'Requirements' },
            { key: 'status', label: 'Status' },
            { key: 'createdAt', label: 'Date' }
        ];

        const exportData = filteredQuotes.map(item => ({
            ...item,
            createdAt: item.createdAt.toLocaleString()
        }));

        exportToCSV(exportData, `Quote_Requests_${new Date().toISOString().split('T')[0]}.csv`, headers);
        toast.success("Data exported successfully");
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredQuotes.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);

    if (loading && quotes.length === 0) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <LoadingSpinner size="xl" text="Loading quotes..." />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div>
                    <h1 className="text-[32px] font-black text-slate-900 tracking-tight mb-2">Quote Requests</h1>
                    <p className="text-slate-500 font-medium">Manage price quotations and bulk order inquiries.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        className="h-[48px] px-6 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 rounded-xl"
                        icon={<Download className="w-5 h-5" />}
                    >
                        Export CSV
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mx-4">
                <div className="px-8 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        {[
                            { label: 'All Quotes', value: 'all' },
                            { label: 'Pending', value: 'pending' },
                            { label: 'Sent', value: 'sent' },
                            { label: 'Closed', value: 'closed' },
                        ].map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setFilterStatus(tab.value)}
                                className={`py-6 text-[13px] font-bold tracking-wide transition-all relative ${filterStatus === tab.value ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {tab.label}
                                {filterStatus === tab.value && (
                                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or requirements..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    {filteredQuotes.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 mx-6 mb-6 rounded-2xl border border-dashed border-slate-200">
                            <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900">No quotes found</h3>
                            <p className="text-slate-400">No one has requested a quote yet.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-[#f8fafc]">
                                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-y border-slate-50">
                                    <th className="py-4 px-8">Potential Client</th>
                                    <th className="py-4 px-8">Requirement</th>
                                    <th className="py-4 px-8">Date</th>
                                    <th className="py-4 px-8 text-center">Status</th>
                                    <th className="py-4 px-8 text-right pr-10">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {currentItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-6 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-xs uppercase">
                                                    {item.firstName?.charAt(0)}{item.lastName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-[14px] leading-tight mb-1">{item.firstName} {item.lastName}</p>
                                                    <p className="text-[12px] text-slate-500">{item.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-8 text-[14px] font-medium text-slate-600 truncate max-w-[200px]">
                                            {item.message}
                                        </td>
                                        <td className="py-6 px-8 text-[13px] font-bold text-slate-500">
                                            {item.createdAt.toLocaleDateString()}
                                        </td>
                                        <td className="py-6 px-8 text-center">
                                            <Badge variant={
                                                item.status === 'closed' ? 'success' :
                                                item.status === 'sent' ? 'blue' : 'warning'
                                            }>
                                                {item.status}
                                            </Badge>
                                        </td>
                                        <td className="py-6 px-8 text-right pr-10">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => { setSelectedQuote(item); setIsModalOpen(true); }}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDelete({ id: item.id })}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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

                {totalPages > 1 && (
                    <div className="px-10 py-6 border-t border-slate-50 flex items-center justify-between">
                        <p className="text-[13px] font-bold text-slate-400">
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredQuotes.length)} of {filteredQuotes.length}
                        </p>
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-10 h-10 rounded-xl text-[13px] font-black transition-all ${currentPage === page ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border border-slate-100 text-slate-400'}`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Quote Request Details"
                size="lg"
            >
                {selectedQuote && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-50 rounded-2xl">
                                    <Banknote className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">{selectedQuote.firstName} {selectedQuote.lastName}</h3>
                                    <p className="text-sm text-slate-500 font-medium">{selectedQuote.email}</p>
                                </div>
                            </div>
                            <Badge variant={selectedQuote.status === 'closed' ? 'success' : selectedQuote.status === 'sent' ? 'blue' : 'warning'}>
                                {selectedQuote.status}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Date Requested
                                </p>
                                <p className="text-[15px] font-bold text-slate-700">{selectedQuote.createdAt.toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                                <p className="text-[15px] font-bold text-slate-700 capitalize">{selectedQuote.status}</p>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> Quotation Requirements
                            </p>
                            <p className="text-[15px] text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{selectedQuote.message}</p>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                            {selectedQuote.status === 'pending' && (
                                <Button className="bg-blue-600 text-white font-bold" fullWidth onClick={() => handleUpdateStatus(selectedQuote.id, 'sent')}>
                                    Mark as Quotation Sent
                                </Button>
                            )}
                            {selectedQuote.status !== 'closed' && (
                                <Button className="bg-emerald-600 text-white font-bold" fullWidth onClick={() => handleUpdateStatus(selectedQuote.id, 'closed')}>
                                    Close Request (Won)
                                </Button>
                            )}
                            <Button variant="outline" className="border-red-100 text-red-600 hover:bg-red-50" fullWidth onClick={() => setConfirmDelete({ id: selectedQuote.id })}>
                                Delete Request
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmDialog
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => handleDelete(confirmDelete?.id)}
                title="Delete Quote"
                message="Are you sure you want to delete this quote request?"
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
};

export default AdminQuotesPage;
