import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { motion } from "framer-motion";
import {
    Mail, Search, Plus, Filter,
    Download, UserX, Chrome,
    ExternalLink, ShoppingBag, Slash,
    Users, Shield
} from "lucide-react";
import { Modal, Button, Card, LoadingSpinner, Badge, Input } from "../../components/ui";
import { toast } from "react-toastify";
import { formatCurrency } from "../../utils/formatUtils";

/**
 * Enhanced Users Management Page with Professional Features
 */
const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("view"); // view, profilePic, orders
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [stats, setStats] = useState({
        total: 0,
        admins: 0,
        active: 0,
        suspended: 0
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterAndSortUsers();
        setCurrentPage(1);
    }, [users, searchTerm, sortBy, sortOrder, filterStatus]);

    /**
     * Fetch all users with enhanced data
     */
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const usersCol = collection(db, "users");
            const adminsCol = collection(db, "admins");

            const [userSnapshot, adminSnapshot] = await Promise.all([
                getDocs(usersCol),
                getDocs(adminsCol)
            ]);

            // Optimization: Fetch orders once to avoid per-user queries if possible
            let allOrders = [];
            try {
                const ordersCol = collection(db, "orders");
                const ordersSnapshot = await getDocs(ordersCol);
                allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (err) {
                console.warn("Permission denied for orders collection:", err);
            }

            const userList = userSnapshot.docs.map((userDoc) => {
                const userData = { id: userDoc.id, ...userDoc.data() };

                // Filter user's orders from pre-fetched list
                const userOrders = allOrders.filter(order => order.userId === userDoc.id);

                // Calculate user metrics
                const totalSpent = userOrders.reduce((sum, order) => sum + (order.total || 0), 0);
                const orderCount = userOrders.length;

                const role = userData.role === 'Admin' ? 'Admin' : 'User';
                const accStatus = userData.isBanned ? 'Suspended' : 'Active';

                return {
                    ...userData,
                    orders: userOrders,
                    totalSpent,
                    orderCount,
                    role: role,
                    accStatus: accStatus,
                    averageOrderValue: orderCount > 0 ? totalSpent / orderCount : 0
                };
            });

            // Map admins collection documents
            const adminList = adminSnapshot.docs.map((adminDoc) => {
                const adminData = { id: adminDoc.id, ...adminDoc.data() };

                return {
                    ...adminData,
                    orders: [], // Admins typically don't have orders, or they'd be in the users collection
                    totalSpent: 0,
                    orderCount: 0,
                    role: 'Admin', // Force role to Admin for documents in this collection
                    accStatus: 'Active',
                    averageOrderValue: 0,
                    // Ensure they have a name if missing
                    name: adminData.name || "Administrator"
                };
            });

            // Combine both lists
            const combinedList = [...userList, ...adminList];

            setUsers(combinedList);

            // Calculate stats with real month-over-month growth
            const now = new Date();
            const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

            const getDate = (u) => u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000) : (u.createdAt ? new Date(u.createdAt) : null);

            const usersBeforeThisMonth = combinedList.filter(u => { const d = getDate(u); return d && d < firstDayThisMonth; });
            const usersBeforeLastMonth = combinedList.filter(u => { const d = getDate(u); return d && d < firstDayLastMonth; });

            const totalNow = combinedList.length;
            const totalLastMonth = usersBeforeThisMonth.length;
            const totalGrowth = totalLastMonth > 0 ? Math.round(((totalNow - totalLastMonth) / totalLastMonth) * 100) : 0;

            const activeNow = combinedList.filter(u => !u.isBanned).length;
            const activeLastMonth = usersBeforeThisMonth.filter(u => !u.isBanned).length;
            const activeGrowth = activeLastMonth > 0 ? Math.round(((activeNow - activeLastMonth) / activeLastMonth) * 100) : 0;

            setStats({
                total: totalNow.toLocaleString(),
                totalGrowth,
                admins: combinedList.filter(u => u.role === 'Admin').length.toLocaleString(),
                active: activeNow.toLocaleString(),
                activeGrowth,
                suspended: combinedList.filter(u => u.isBanned).length.toLocaleString()
            });
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Filter and sort users
     */
    const filterAndSortUsers = () => {
        let filtered = [...users];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phone?.includes(searchTerm)
            );
        }

        // Apply status/role filter
        if (filterStatus === "active") {
            filtered = filtered.filter(user => !user.isBanned);
        } else if (filterStatus === "banned") {
            filtered = filtered.filter(user => user.isBanned);
        } else if (filterStatus === "users") {
            filtered = filtered.filter(user => user.role === "User");
        } else if (filterStatus === "admins") {
            filtered = filtered.filter(user => user.role === "Admin");
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aVal, bVal;

            switch (sortBy) {
                case "name":
                    aVal = a.name?.toLowerCase() || "";
                    bVal = b.name?.toLowerCase() || "";
                    break;
                case "email":
                    aVal = a.email?.toLowerCase() || "";
                    bVal = b.email?.toLowerCase() || "";
                    break;
                case "orders":
                    aVal = a.orderCount || 0;
                    bVal = b.orderCount || 0;
                    break;
                case "spent":
                    aVal = a.totalSpent || 0;
                    bVal = b.totalSpent || 0;
                    break;
                case "created":
                    aVal = a.createdAt?.seconds || 0;
                    bVal = b.createdAt?.seconds || 0;
                    break;
                case "lastLogin":
                    aVal = a.lastLogin?.seconds || 0;
                    bVal = b.lastLogin?.seconds || 0;
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

        setFilteredUsers(filtered);
    };

    /**
     * Toggle ban/unban user
     */
    const toggleBanUser = async (userId, isBanned) => {
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, { isBanned: !isBanned });

            setUsers(users.map(user =>
                user.id === userId ? { ...user, isBanned: !isBanned } : user
            ));

            toast.success(`User ${!isBanned ? "banned" : "unbanned"} successfully`);
        } catch (error) {
            console.error("Error updating user status:", error);
            toast.error("Failed to update user status");
        }
    };

    /**
     * View user details
     */
    const viewUserDetails = (user) => {
        setSelectedUser(user);
        setModalMode("view");
        setIsModalOpen(true);
    };

    /**
     * View profile picture
     */
    const viewProfilePic = (user) => {
        setSelectedUser(user);
        setModalMode("profilePic");
        setIsModalOpen(true);
    };

    /**
     * View user orders
     */
    const viewUserOrders = (user) => {
        setSelectedUser(user);
        setModalMode("orders");
        setIsModalOpen(true);
    };

    /**
     * Export users to CSV
     */
    const exportToCSV = () => {
        const headers = ["Name", "Email", "Phone", "Orders", "Total Spent", "Status", "Created At"];
        const rows = filteredUsers.map(user => [
            user.name || "",
            user.email || "",
            user.phone || "",
            user.orderCount || 0,
            user.totalSpent || 0,
            user.isBanned ? "Banned" : "Active",
            user.createdAt ? (user.createdAt.seconds ? new Date(user.createdAt.seconds * 1000) : new Date(user.createdAt)).toLocaleDateString() : ""
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast.success("Users exported successfully!");
    };

    /**
     * Format date
     */
    const formatDate = (timestamp) => {
        if (!timestamp) return "Never";
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    };

    /**
     * Get provider icon
     */
    const getProviderIcon = (provider) => {
        switch (provider) {
            case "google.com":
            case "google":
                return <Chrome className="w-4 h-4" />;
            default:
                return <Mail className="w-4 h-4" />;
        }
    };

    if (loading && users.length === 0) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <LoadingSpinner size="xl" text="Loading users..." />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div>
                    <h1 className="text-[32px] font-black text-slate-900 tracking-tight mb-2">User Management</h1>
                    <p className="text-slate-500 font-medium">Manage and administrator accounts and customer profiles.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={exportToCSV}
                        className="h-[48px] px-6 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 rounded-xl"
                        icon={<Download className="w-5 h-5" />}
                    >
                        Export Data
                    </Button>
                    <Button
                        className="h-[48px] px-6 bg-[#2563eb] hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-100 rounded-xl"
                        icon={<Plus className="w-5 h-5" />}
                    >
                        Add New User
                    </Button>
                </div>
            </div>

            {/* Stats Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                {[
                    { label: 'Total Users', value: stats.total, icon: <Users className="w-6 h-6 text-blue-600" />, bgColor: 'bg-blue-50/50', borderColor: 'border-blue-100/50', change: stats.totalGrowth !== 0 ? `${stats.totalGrowth > 0 ? '+' : ''}${stats.totalGrowth}%` : null },
                    { label: 'Active Accounts', value: stats.active, icon: <Users className="w-6 h-6 text-emerald-500" />, bgColor: 'bg-emerald-50/50', borderColor: 'border-emerald-100/50', change: stats.activeGrowth !== 0 ? `${stats.activeGrowth > 0 ? '+' : ''}${stats.activeGrowth}%` : null },
                    { label: 'Suspended', value: stats.suspended, icon: <UserX className="w-6 h-6 text-red-500" />, bgColor: 'bg-red-50/50', borderColor: 'border-red-100/50' },
                    { label: 'Administrators', value: stats.admins, icon: <Shield className="w-6 h-6 text-purple-500" />, bgColor: 'bg-purple-50/50', borderColor: 'border-purple-100/50' },
                ].map((stat, i) => (
                    <Card key={i} className="p-6 border-slate-100/80 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${stat.bgColor} border ${stat.borderColor}`}>
                                {stat.icon}
                            </div>
                            {stat.change && <span className={`text-xs font-black ${stat.change.startsWith('-') ? 'text-red-500' : 'text-emerald-500'}`}>{stat.change}</span>}
                            {stat.badge && <span className="text-red-500 text-[10px] font-black uppercase tracking-wider">{stat.badge}</span>}
                        </div>
                        <p className="text-slate-500 text-[13px] font-bold mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-black text-slate-900">{stat.value}</h3>
                    </Card>
                ))}
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mx-4">
                {/* Status Tabs */}
                <div className="px-8 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        {[
                            { label: 'All Users', value: 'all' },
                            { label: 'Users', value: 'users' },
                            { label: 'Admins', value: 'admins' },
                        ].map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setFilterStatus(tab.value)}
                                className={`py-6 text-[13px] font-bold tracking-wide transition-all relative ${filterStatus === tab.value
                                    ? 'text-blue-600'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {tab.label}
                                {filterStatus === tab.value && (
                                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select
                                className="appearance-none bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2 pr-10 text-[13px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val.includes('Active')) setFilterStatus('active');
                                    else if (val.includes('Suspended')) setFilterStatus('banned');
                                    else setFilterStatus('all');
                                }}
                            >
                                <option>Status: All</option>
                                <option>Status: Active</option>
                                <option>Status: Suspended</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Filter className="w-4 h-4 text-slate-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="p-6 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-3 pl-12 pr-4 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
                        />
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto min-h-[400px] scrollbar-hide">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <LoadingSpinner size="lg" text="Fetching users..." />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-20 mx-8 my-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-900">No users found</h3>
                            <p className="text-slate-400 font-medium">
                                {searchTerm
                                    ? `No users match "${searchTerm}"`
                                    : "Try adjusting your filters or status selection"}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#f8fafc]">
                                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-y border-slate-50">
                                    <th className="py-4 px-8 pl-24">Name</th>
                                    <th className="py-4 px-8">Email</th>
                                    <th className="py-4 px-8 text-center">Role</th>
                                    <th className="py-4 px-8 text-center">Registration Date</th>
                                    <th className="py-4 px-8 text-right pr-10">Account Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((user) => {
                                    const role = user.role;
                                    const vStatus = user.vStatus;
                                    const accStatus = user.accStatus;

                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-6 px-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm">
                                                        {user.profilePic ? (
                                                            <img
                                                                src={user.profilePic}
                                                                alt={user.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                            />
                                                        ) : null}
                                                        <span className="text-slate-400 font-bold text-xs uppercase">
                                                            {user.name?.charAt(0) || 'U'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-[14px] leading-tight mb-1">{user.name || 'Anonymous User'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <span className="text-[14px] font-medium text-slate-500">
                                                    {user.email || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-6 px-8 text-center">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest leading-none inline-block ${role === 'Admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {role}
                                                </span>
                                            </td>
                                            <td className="py-6 px-8 text-center text-[13px] font-bold text-slate-500">
                                                {user.createdAt ? (user.createdAt.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : new Date(user.createdAt).toLocaleDateString()) : 'Oct 12, 2023'}
                                            </td>
                                            <td className="py-6 px-8 text-right pr-10">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${accStatus === 'Active'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-red-50 text-red-600 border-red-100'
                                                    }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${accStatus === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                    {accStatus}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination Section */}
                <div className="px-10 py-6 bg-[#f8fafc]/30 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-[13px] font-bold text-slate-400">
                        Showing {filteredUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} results
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <span className="sr-only">Previous</span>
                            &lt;
                        </button>

                        {Array.from({ length: Math.ceil(filteredUsers.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
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
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredUsers.length / itemsPerPage)))}
                            disabled={currentPage === Math.ceil(filteredUsers.length / itemsPerPage) || filteredUsers.length === 0}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:bg-slate-50 disabled:opacity-50"
                        >
                            <span className="sr-only">Next</span>
                            &gt;
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={
                    modalMode === "profilePic" ? "Profile Picture" :
                        modalMode === "orders" ? "User Order History" :
                            "User Details Summary"
                }
                size={modalMode === "orders" ? "lg" : "md"}
            >
                {selectedUser && modalMode === "view" && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                            {selectedUser.profilePic ? (
                                <img
                                    src={selectedUser.profilePic}
                                    alt={selectedUser.name}
                                    className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-50"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                                    {selectedUser.name?.charAt(0) || "?"}
                                </div>
                            )}
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{selectedUser.name || "Anonymous"}</h3>
                                <div className="flex gap-2 mt-1">
                                    <Badge variant={selectedUser.isBanned ? "danger" : "success"}>
                                        {selectedUser.role} Account
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                                <p className="text-gray-900 font-medium">{selectedUser.email || "N/A"}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                                <p className="text-gray-900 font-medium">{selectedUser.phone || "N/A"}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Orders</label>
                                <p className="text-gray-900 font-medium">{selectedUser.orderCount || 0}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue</label>
                                <p className="text-gray-900 font-medium text-blue-600 font-bold">{formatCurrency(selectedUser.totalSpent || 0)}</p>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Interaction</label>
                                <p className="text-gray-900 font-medium">{formatDate(selectedUser.lastLogin)}</p>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                            <Button
                                variant="outline"
                                fullWidth
                                onClick={() => viewUserOrders(selectedUser)}
                                icon={<ShoppingBag className="w-4 h-4" />}
                            >
                                View Orders ({selectedUser.orderCount || 0})
                            </Button>
                        </div>
                    </div>
                )}

                {selectedUser && modalMode === "profilePic" && (
                    <div className="flex flex-col items-center gap-4">
                        <img
                            src={selectedUser.profilePic}
                            alt={selectedUser.name}
                            className="max-w-full h-auto rounded-xl shadow-lg border-2 border-gray-100"
                        />
                        <a
                            href={selectedUser.profilePic}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 font-semibold hover:underline flex items-center gap-2"
                        >
                            Open HD Image <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                )}

                {selectedUser && modalMode === "orders" && (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {selectedUser.orders && selectedUser.orders.length > 0 ? (
                            selectedUser.orders.map((order) => (
                                <div
                                    key={order.id}
                                    className="p-4 border border-slate-100 rounded-xl hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-bold text-gray-900">Order #{order.orderId || order.id.substring(0, 8)}</p>
                                            <p className="text-xs text-gray-500">{formatDate(order.orderDate)}</p>
                                        </div>
                                        <Badge
                                            variant={
                                                order.status === 'Delivered' ? 'success' :
                                                    order.status === 'Shipped' ? 'purple' :
                                                        order.status === 'Placed' ? 'warning' :
                                                            'default'
                                            }
                                        >
                                            {order.status}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <p className="text-gray-600">{order.items?.length || 0} Products</p>
                                        <p className="font-bold text-blue-600">{formatCurrency(order.total)}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-slate-400">
                                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="font-bold">No purchase history found for this user</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminUsersPage;
