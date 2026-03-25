import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Search, Plus, Edit, Trash2, Eye,
    RefreshCw, Archive, Pencil, BookOpen,
    EyeOff, MessageSquare, Calendar, User
} from "lucide-react";
import { Button, Card, Badge, LoadingSpinner, ConfirmDialog } from "../../components/ui";
import { getBlogs, deleteBlog, updateBlog, subscribeToBlogsAdmin } from "../../services/blogService";
import { toast } from "react-toastify";

/**
 * Admin Blog Management Page
 * Similar styling to AdminProductsPage for consistency
 */
const AdminBlogsPage = () => {
    const [blogs, setBlogs] = useState([]);
    const [filteredBlogs, setFilteredBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // all, active, draft
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const itemsPerPage = 8;

    useEffect(() => {
        const unsubscribe = subscribeToBlogsAdmin((data) => {
            setBlogs(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        filterBlogs();
    }, [blogs, searchTerm, filterStatus]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const data = await getBlogs();
            setBlogs(data);
        } catch (error) {
            console.error("Error fetching blogs:", error);
            toast.error("Failed to load blogs");
        } finally {
            setLoading(false);
        }
    };

    const filterBlogs = () => {
        let filtered = [...blogs];

        if (searchTerm) {
            filtered = filtered.filter(blog =>
                blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                blog.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                blog.category?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStatus === "active") {
            filtered = filtered.filter(blog => blog.isActive);
        } else if (filterStatus === "draft") {
            filtered = filtered.filter(blog => !blog.isActive);
        }

        setFilteredBlogs(filtered);
    };

    const handleDelete = async (id) => {
        try {
            await deleteBlog(id);
            toast.success("Blog deleted successfully");
            fetchBlogs();
        } catch (error) {
            toast.error("Failed to delete blog");
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            await updateBlog(id, { isActive: !currentStatus });
            toast.success(`Blog ${!currentStatus ? 'published' : 'moved to draft'}`);
            fetchBlogs();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredBlogs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage);

    if (loading && blogs.length === 0) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <LoadingSpinner size="xl" text="Loading articles..." />
            </div>
        );
    }

    return (
        <>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 pb-10 max-w-[1600px] mx-auto"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div>
                    <h1 className="text-4xl font-black text-[#1e293b] tracking-tight mb-1">Articles & News</h1>
                    <p className="text-slate-500 font-medium">Manage your health blog, educational content, and announcements.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchBlogs}
                        className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold h-11 px-4 rounded-xl transition-all shadow-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <Link
                        to="/admin/blog/add"
                        className="flex items-center gap-2 bg-[#1d61f2] hover:bg-blue-700 text-white font-bold h-11 px-5 rounded-xl shadow-lg shadow-blue-100 transition-all border border-blue-600"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Create Post</span>
                    </Link>
                </div>
            </div>

            {/* Main Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mx-4">
                {/* Status Tabs */}
                <div className="px-8 border-b border-slate-50 flex items-center gap-6">
                    {[
                        { label: 'All Articles', value: 'all', count: blogs.length },
                        { label: 'Published', value: 'active', count: blogs.filter(b => b.isActive).length },
                        { label: 'Drafts', value: 'draft', count: blogs.filter(b => !b.isActive).length }
                    ].map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setFilterStatus(tab.value)}
                            className={`py-5 text-[14px] font-bold transition-all border-b-2 relative ${filterStatus === tab.value
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {tab.label} <span className="ml-1 text-[12px] opacity-70">({tab.count})</span>
                        </button>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="px-8 py-5 flex items-center justify-between bg-slate-50/30">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search articles by title, author, or tag..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 font-medium"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {filteredBlogs.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50/50 m-6 rounded-3xl border border-dashed border-slate-200">
                            <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900">No articles found</h3>
                            <p className="text-slate-400 font-medium">Get started by creating your first educational post.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#f8fafc]">
                                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-y border-slate-50">
                                    <th className="py-4 px-8">Article</th>
                                    <th className="py-4 px-4 text-center">Category</th>
                                    <th className="py-4 px-4 text-center">Engagement</th>
                                    <th className="py-4 px-4 text-center">Status</th>
                                    <th className="py-4 px-8 text-right pr-10">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {currentItems.map((blog) => (
                                    <tr key={blog.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-6 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-12 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={blog.image || 'https://via.placeholder.com/150'}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="max-w-xs">
                                                    <p className="font-bold text-slate-900 text-[14px] leading-tight mb-1 line-clamp-1">{blog.title}</p>
                                                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {blog.createdAt?.toLocaleDateString()}</span>
                                                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {blog.author || 'Admin'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4 text-center">
                                            <Badge variant="blue" className="rounded-lg uppercase tracking-widest text-[10px] px-2 py-1">
                                                {blog.category || 'Health'}
                                            </Badge>
                                        </td>
                                        <td className="py-6 px-4 text-center">
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-[13px] font-black text-slate-900 leading-none">{blog.views || 0}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Views</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[13px] font-black text-slate-900 leading-none">{blog.comments?.length || 0}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Comments</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4 text-center">
                                            <Badge variant={blog.isActive ? 'success' : 'secondary'} className="rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${blog.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                {blog.isActive ? 'Published' : 'Draft'}
                                            </Badge>
                                        </td>
                                        <td className="py-6 px-8 text-right pr-10">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => toggleStatus(blog.id, blog.isActive)}
                                                    className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all ${blog.isActive
                                                        ? 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100'
                                                        : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                                                        }`}
                                                    title={blog.isActive ? "Move to Draft" : "Publish"}
                                                >
                                                    {blog.isActive ? <EyeOff className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                                                </button>
                                                <Link to={`/admin/blog/edit/${blog.id}`} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all">
                                                    <Pencil className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => setConfirmDelete({ id: blog.id, title: blog.title })}
                                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-10 py-6 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
                        <p className="text-[13px] font-bold text-slate-400">
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredBlogs.length)} of {filteredBlogs.length} articles
                        </p>
                        <div className="flex items-center gap-2">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-9 h-9 rounded-xl text-[13px] font-black transition-all ${currentPage === page ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>

        <ConfirmDialog
            isOpen={!!confirmDelete}
            onClose={() => setConfirmDelete(null)}
            onConfirm={() => handleDelete(confirmDelete?.id)}
            title="Delete Blog"
            message={`Are you sure you want to delete "${confirmDelete?.title}"? This cannot be undone.`}
            confirmText="Delete"
            variant="danger"
        />
        </>
    );
};

export default AdminBlogsPage;
