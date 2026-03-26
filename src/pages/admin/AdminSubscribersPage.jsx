import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { adminDb as db } from "../../adminFirebase";
import { Mail, Trash2, Search, Download, Calendar } from "lucide-react";
import { Card, LoadingSpinner, ConfirmDialog } from "../../components/ui";
import { toast } from "react-toastify";

const AdminSubscribersPage = () => {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(null);

    useEffect(() => {
        let q;
        try {
            q = query(collection(db, "subscribers"), orderBy("subscribedAt", "desc"));
        } catch {
            q = collection(db, "subscribers");
        }

        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                subscribedAt: d.data().subscribedAt?.toDate() || new Date(),
            }));
            setSubscribers(list);
            setLoading(false);
        }, (err) => {
            console.warn("Ordered subscribers query failed, falling back:", err.message);
            const fallbackUnsub = onSnapshot(collection(db, "subscribers"), (snap) => {
                const list = snap.docs.map(d => ({
                    id: d.id,
                    ...d.data(),
                    subscribedAt: d.data().subscribedAt?.toDate() || new Date(),
                }));
                setSubscribers(list.sort((a, b) => b.subscribedAt - a.subscribedAt));
                setLoading(false);
            });
            return fallbackUnsub;
        });

        return unsub;
    }, []);

    const filtered = subscribers.filter(s =>
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, "subscribers", id));
            toast.success("Subscriber removed");
        } catch (err) {
            console.error("Delete error:", err);
            toast.error("Failed to remove subscriber");
        }
        setConfirmDelete(null);
    };

    const handleExportCSV = () => {
        const csv = ["Email,Subscribed Date,Source"];
        filtered.forEach(s => {
            csv.push(`${s.email},${s.subscribedAt.toLocaleDateString()},${s.source || "unknown"}`);
        });
        const blob = new Blob([csv.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "subscribers.csv";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Exported successfully");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="xl" text="Loading subscribers..." />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Newsletter Subscribers</h1>
                    <p className="text-sm text-gray-500 mt-1">{subscribers.length} total subscriber{subscribers.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={handleExportCSV}
                    disabled={filtered.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
                />
            </div>

            {/* Table */}
            <Card className="overflow-hidden border-none shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email</th>
                                <th className="text-left px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Source</th>
                                <th className="text-left px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Subscribed Date</th>
                                <th className="text-right px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                        <Mail size={40} className="mx-auto mb-3 text-gray-300" />
                                        <p className="font-semibold">No subscribers yet</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((sub) => (
                                    <tr key={sub.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                                                    <Mail size={16} className="text-blue-600" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{sub.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                                                {sub.source || "unknown"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar size={14} />
                                                {sub.subscribedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setConfirmDelete(sub)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                title="Remove subscriber"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Confirm Delete Dialog */}
            {confirmDelete && (
                <ConfirmDialog
                    isOpen={!!confirmDelete}
                    onClose={() => setConfirmDelete(null)}
                    onConfirm={() => handleDelete(confirmDelete.id)}
                    title="Remove Subscriber"
                    message={`Remove ${confirmDelete.email} from the subscriber list?`}
                    confirmText="Remove"
                    variant="danger"
                />
            )}
        </div>
    );
};

export default AdminSubscribersPage;
