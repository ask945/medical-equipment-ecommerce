import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { adminDb as db } from "../../adminFirebase";
import {
    promoteToSuperAdmin, demoteToAdmin, disableAdmin as disableAdminService,
    enableAdmin as enableAdminService, softDeleteAdmin, addNewAdmin
} from "../../utils/adminService";
import { motion } from "framer-motion";
import {
    Mail, Search, Plus, Filter,
    Download, UserX, Chrome,
    ExternalLink, ShoppingBag, Slash,
    Users, Shield, Trash2, ShieldOff, ShieldCheck, Ban, CheckCircle, Lock, Eye, EyeOff, AlertTriangle
} from "lucide-react";
import { Modal, Button, Card, LoadingSpinner, Badge, Input } from "../../components/ui";
import { ConfirmDialog } from "../../components/ui";
import { toast } from "react-toastify";
import { formatCurrency } from "../../utils/formatUtils";

/**
 * Enhanced Users Management Page with RBAC
 *
 * Roles:
 * - Super Admin: full control over admins/super admins, can promote/demote/disable/delete
 * - Admin: can only promote Users → Admin, cannot modify any admin/super admin
 *
 * Rules:
 * - No self-modification (promote/demote/disable/delete yourself)
 * - Must always have at least 1 active Super Admin
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
    const [modalMode, setModalMode] = useState("view");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const [stats, setStats] = useState({
        total: 0,
        admins: 0,
        active: 0,
        suspended: 0
    });

    // Admin management state
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'Admin', userId: '' });
    const [adminSearchTerm, setAdminSearchTerm] = useState('');
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    // Current logged-in admin info from session
    const currentAdminEmail = sessionStorage.getItem("admin_email");
    const currentAdminId = sessionStorage.getItem("admin_id");

    // Derive role from real-time data instead of stale session
    const currentAdminFromData = users.find(u => u.isAdmin && (u.id === currentAdminId || u.email === currentAdminEmail));
    const currentAdminRole = currentAdminFromData?.role || sessionStorage.getItem("admin_role");

    const isSuperAdmin = currentAdminRole === "Super Admin";
    const isAdmin = currentAdminRole === "Admin";

    // Keep session in sync with real-time role changes
    useEffect(() => {
        if (currentAdminFromData?.role && currentAdminFromData.role !== sessionStorage.getItem("admin_role")) {
            sessionStorage.setItem("admin_role", currentAdminFromData.role);
        }
    }, [currentAdminFromData?.role]);

    // Force logout is handled globally in AdminPage.jsx via onSnapshot

    // Helper: count active super admins
    const getActiveSuperAdminCount = () => {
        return users.filter(u => u.isAdmin && u.role === 'Super Admin' && !u.isDisabled).length;
    };

    // Helper: check if target is self
    const isSelf = (admin) => {
        return admin.id === currentAdminId || admin.email === currentAdminEmail;
    };

    // RBAC validation for actions
    const canPromoteToSuperAdmin = (admin) => {
        if (!isSuperAdmin) return false;
        if (isSelf(admin)) return false;
        if (admin.role === 'Super Admin') return false;
        return true;
    };

    const canDemoteToAdmin = (admin) => {
        if (!isSuperAdmin) return false;
        if (isSelf(admin)) return false;
        if (admin.role !== 'Super Admin') return false;
        // Prevent demoting last active super admin
        if (getActiveSuperAdminCount() <= 1 && !admin.isDisabled) return false;
        return true;
    };

    const canDisableAdmin = (admin) => {
        if (!isSuperAdmin) return false;
        if (isSelf(admin)) return false;
        if (admin.isDisabled) return false;
        // Prevent disabling last active super admin
        if (admin.role === 'Super Admin' && getActiveSuperAdminCount() <= 1) return false;
        return true;
    };

    const canEnableAdmin = (admin) => {
        if (!isSuperAdmin) return false;
        if (isSelf(admin)) return false;
        if (!admin.isDisabled) return false;
        return true;
    };

    const canDeleteAdmin = (admin) => {
        if (!isSuperAdmin) return false;
        if (isSelf(admin)) return false;
        // Prevent deleting last active super admin
        if (admin.role === 'Super Admin' && getActiveSuperAdminCount() <= 1 && !admin.isDisabled) return false;
        return true;
    };

    const canAddAdmin = () => {
        // Both Admin and Super Admin can promote users to Admin
        return true;
    };

    // Real-time data refs for combining users + admins
    const [userList, setUserList] = useState([]);
    const [adminList, setAdminList] = useState([]);
    const [ordersList, setOrdersList] = useState([]);

    // Set up real-time listeners
    useEffect(() => {
        setLoading(true);

        // Listen to users collection
        const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
            const list = snapshot.docs.map((userDoc) => ({
                id: userDoc.id,
                ...userDoc.data()
            }));
            setUserList(list);
        }, (err) => {
            console.error("Error listening to users:", err);
        });

        // Listen to admins collection
        const unsubAdmins = onSnapshot(collection(db, "admins"), (snapshot) => {
            const list = snapshot.docs.map((adminDoc) => ({
                id: adminDoc.id,
                ...adminDoc.data()
            }));
            setAdminList(list);
        }, (err) => {
            console.error("Error listening to admins:", err);
        });

        // Fetch orders once (not real-time, less critical)
        getDocs(collection(db, "orders")).then((snapshot) => {
            setOrdersList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        }).catch(() => {});

        return () => {
            unsubUsers();
            unsubAdmins();
        };
    }, []);

    // Combine users + admins whenever either changes
    useEffect(() => {
        if (userList.length === 0 && adminList.length === 0) return;

        const mappedUsers = userList.map((userData) => {
            const userOrders = ordersList.filter(order => order.userId === userData.id);
            const totalSpent = userOrders.reduce((sum, order) => sum + (order.total || 0), 0);
            const orderCount = userOrders.length;

            return {
                ...userData,
                orders: userOrders,
                totalSpent,
                orderCount,
                role: userData.role === 'Admin' ? 'Admin' : 'User',
                accStatus: userData.isBanned ? 'Suspended' : 'Active',
                averageOrderValue: orderCount > 0 ? totalSpent / orderCount : 0
            };
        });

        const mappedAdmins = adminList.filter(a => !a.isDeleted).map((adminData) => ({
            ...adminData,
            orders: [],
            totalSpent: 0,
            orderCount: 0,
            role: adminData.role || 'Admin',
            accStatus: adminData.isDisabled ? 'Disabled' : 'Active',
            isDisabled: adminData.isDisabled || false,
            isAdmin: true,
            averageOrderValue: 0,
            name: adminData.name || "Administrator"
        }));

        const combinedList = [...mappedUsers, ...mappedAdmins];
        setUsers(combinedList);

        // Calculate stats
        const now = new Date();
        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const getDate = (u) => u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000) : (u.createdAt ? new Date(u.createdAt) : null);
        const usersBeforeThisMonth = combinedList.filter(u => { const d = getDate(u); return d && d < firstDayThisMonth; });

        const totalNow = combinedList.length;
        const totalLastMonth = usersBeforeThisMonth.length;
        const totalGrowth = totalLastMonth > 0 ? Math.round(((totalNow - totalLastMonth) / totalLastMonth) * 100) : 0;

        const activeNow = combinedList.filter(u => !u.isBanned).length;
        const activeLastMonth = usersBeforeThisMonth.filter(u => !u.isBanned).length;
        const activeGrowth = activeLastMonth > 0 ? Math.round(((activeNow - activeLastMonth) / activeLastMonth) * 100) : 0;

        setStats({
            total: totalNow.toLocaleString(),
            totalGrowth,
            admins: combinedList.filter(u => u.role === 'Admin' || u.role === 'Super Admin').length.toLocaleString(),
            active: activeNow.toLocaleString(),
            activeGrowth,
            suspended: combinedList.filter(u => u.isBanned).length.toLocaleString()
        });

        setLoading(false);
    }, [userList, adminList, ordersList]);

    useEffect(() => {
        filterAndSortUsers();
        setCurrentPage(1);
    }, [users, searchTerm, sortBy, sortOrder, filterStatus]);

    const filterAndSortUsers = () => {
        let filtered = [...users];

        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phone?.includes(searchTerm)
            );
        }

        if (filterStatus === "active") {
            filtered = filtered.filter(user => !user.isBanned);
        } else if (filterStatus === "banned") {
            filtered = filtered.filter(user => user.isBanned);
        } else if (filterStatus === "users") {
            filtered = filtered.filter(user => user.role === "User");
        } else if (filterStatus === "admins") {
            filtered = filtered.filter(user => user.role === "Admin" || user.role === "Super Admin");
        }

        filtered.sort((a, b) => {
            if (filterStatus === "admins") {
                const aIsSuperAdmin = a.role === 'Super Admin' ? 1 : 0;
                const bIsSuperAdmin = b.role === 'Super Admin' ? 1 : 0;
                if (aIsSuperAdmin !== bIsSuperAdmin) return bIsSuperAdmin - aIsSuperAdmin;
            }

            let aVal, bVal;
            switch (sortBy) {
                case "name": aVal = a.name?.toLowerCase() || ""; bVal = b.name?.toLowerCase() || ""; break;
                case "email": aVal = a.email?.toLowerCase() || ""; bVal = b.email?.toLowerCase() || ""; break;
                case "orders": aVal = a.orderCount || 0; bVal = b.orderCount || 0; break;
                case "spent": aVal = a.totalSpent || 0; bVal = b.totalSpent || 0; break;
                case "created": aVal = a.createdAt?.seconds || 0; bVal = b.createdAt?.seconds || 0; break;
                default: aVal = a.name || ""; bVal = b.name || "";
            }

            return sortOrder === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
        });

        setFilteredUsers(filtered);
    };

    const toggleBanUser = async (userId, isBanned) => {
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, { isBanned: !isBanned });
            setUsers(users.map(user => user.id === userId ? { ...user, isBanned: !isBanned } : user));
            toast.success(`User ${!isBanned ? "banned" : "unbanned"} successfully`);
        } catch (error) {
            console.error("Error updating user status:", error);
            toast.error("Failed to update user status");
        }
    };

    const viewUserDetails = (user) => { setSelectedUser(user); setModalMode("view"); setIsModalOpen(true); };
    const viewUserOrders = (user) => { setSelectedUser(user); setModalMode("orders"); setIsModalOpen(true); };

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
        const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Users exported successfully!");
    };

    // === ADMIN ACTIONS — delegated to adminService.js (transaction-based + audit logged) ===

    const getAdminList = () => users.filter(u => u.isAdmin);

    const handleDeleteAdmin = async (admin) => {
        try {
            await softDeleteAdmin(admin.id, currentAdminId, currentAdminEmail, getAdminList());
            setConfirmDelete(null);
            toast.success(`Admin "${admin.name || admin.email}" deleted`);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handlePromoteAdmin = async (admin) => {
        try {
            await promoteToSuperAdmin(admin.id, currentAdminId, currentAdminEmail, getAdminList());
            toast.success(`${admin.name || admin.email} promoted to Super Admin`);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDemoteAdmin = async (admin) => {
        try {
            await demoteToAdmin(admin.id, currentAdminId, currentAdminEmail, getAdminList());
            toast.success(`${admin.name || admin.email} demoted to Admin`);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDisableAdmin = async (admin) => {
        try {
            await disableAdminService(admin.id, currentAdminId, currentAdminEmail, getAdminList());
            toast.success(`${admin.name || admin.email} has been disabled`);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleEnableAdmin = async (admin) => {
        try {
            await enableAdminService(admin.id, currentAdminId, currentAdminEmail, getAdminList());
            toast.success(`${admin.name || admin.email} has been enabled`);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleAddAdmin = async () => {
        if (!newAdmin.userId) { toast.error("Please select a user first"); return; }
        if (!newAdmin.password) { toast.error("Password is required"); return; }
        try {
            const result = await addNewAdmin(newAdmin, currentAdminId, currentAdminEmail, currentAdminRole);
            setShowAddAdminModal(false);
            setNewAdmin({ name: '', email: '', password: '', role: 'Admin', userId: '' });
            setAdminSearchTerm('');
            toast.success(`${newAdmin.name || newAdmin.email} promoted to ${result.role}`);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return "Never";
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    };

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
                    <p className="text-slate-500 font-medium">
                        Logged in as <span className={`font-bold ${isSuperAdmin ? 'text-amber-600' : 'text-purple-600'}`}>{currentAdminRole}</span>
                        <span className="text-slate-300 mx-2">|</span>
                        <span className="text-slate-400">{currentAdminEmail}</span>
                    </p>
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
                        onClick={() => setShowAddAdminModal(true)}
                    >
                        Add Admin
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
                    {filterStatus === 'admins' && (
                        <Button
                            onClick={() => setShowAddAdminModal(true)}
                            className="h-[44px] px-5 bg-[#2563eb] hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-100 rounded-xl"
                            icon={<Plus className="w-4 h-4" />}
                        >
                            Add Admin
                        </Button>
                    )}
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
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-[#f8fafc]">
                                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-y border-slate-50">
                                    <th className="py-4 px-6 pl-8">Name</th>
                                    <th className="py-4 px-6">Email</th>
                                    <th className="py-4 px-6 text-center">Role</th>
                                    <th className="py-4 px-6 text-center">Registration Date</th>
                                    <th className="py-4 px-6 text-center">Status</th>
                                    {filterStatus === 'admins' && <th className="py-4 px-6 text-center">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((user) => {
                                    const role = user.role;
                                    const accStatus = user.accStatus;
                                    const selfIndicator = isSelf(user);

                                    return (
                                        <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors group ${user.isDisabled ? 'opacity-50' : ''}`}>
                                            <td className="py-5 px-6 pl-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 flex items-center justify-center border-2 border-white shadow-sm">
                                                        <svg className="w-6 h-6 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 text-[14px] leading-tight flex items-center gap-2">
                                                            {user.name || 'Anonymous User'}
                                                            {selfIndicator && (
                                                                <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">YOU</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <span className="text-[14px] font-medium text-slate-500">
                                                    {user.email || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 text-center">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest leading-none inline-block ${
                                                    role === 'Super Admin' ? 'bg-amber-50 text-amber-600' :
                                                    role === 'Admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                    {role}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 text-center text-[13px] font-bold text-slate-500">
                                                {user.createdAt ? (user.createdAt.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : new Date(user.createdAt).toLocaleDateString()) : 'N/A'}
                                            </td>
                                            <td className="py-5 px-6 text-center">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                                                    accStatus === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    accStatus === 'Disabled' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-red-50 text-red-600 border-red-100'
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                                        accStatus === 'Active' ? 'bg-emerald-500' :
                                                        accStatus === 'Disabled' ? 'bg-amber-500' : 'bg-red-500'
                                                    }`} />
                                                    {accStatus}
                                                </div>
                                            </td>
                                            {filterStatus === 'admins' && user.isAdmin && (
                                                <td className="py-5 px-6 text-center">
                                                    {isSelf(user) ? (
                                                        <span className="text-xs text-slate-300 italic">No self-actions</span>
                                                    ) : !isSuperAdmin ? (
                                                        <span className="text-xs text-slate-300 italic">Super Admin only</span>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-1">
                                                            {/* Promote / Demote */}
                                                            {user.role === 'Admin' && canPromoteToSuperAdmin(user) && (
                                                                <button
                                                                    onClick={() => handlePromoteAdmin(user)}
                                                                    className="p-2 rounded-lg text-purple-500 hover:bg-purple-50 transition-colors cursor-pointer"
                                                                    title="Promote to Super Admin"
                                                                >
                                                                    <ShieldCheck className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {user.role === 'Super Admin' && canDemoteToAdmin(user) && (
                                                                <button
                                                                    onClick={() => handleDemoteAdmin(user)}
                                                                    className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
                                                                    title="Demote to Admin"
                                                                >
                                                                    <ShieldOff className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {user.role === 'Super Admin' && !canDemoteToAdmin(user) && (
                                                                <button
                                                                    disabled
                                                                    className="p-2 rounded-lg text-slate-200 cursor-not-allowed"
                                                                    title="Cannot demote: last active Super Admin"
                                                                >
                                                                    <ShieldOff className="w-4 h-4" />
                                                                </button>
                                                            )}

                                                            {/* Enable / Disable */}
                                                            {user.isDisabled ? (
                                                                canEnableAdmin(user) && (
                                                                    <button
                                                                        onClick={() => handleEnableAdmin(user)}
                                                                        className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors cursor-pointer"
                                                                        title="Enable Admin"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4" />
                                                                    </button>
                                                                )
                                                            ) : (
                                                                canDisableAdmin(user) ? (
                                                                    <button
                                                                        onClick={() => handleDisableAdmin(user)}
                                                                        className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
                                                                        title="Disable Admin"
                                                                    >
                                                                        <Ban className="w-4 h-4" />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        disabled
                                                                        className="p-2 rounded-lg text-slate-200 cursor-not-allowed"
                                                                        title={user.role === 'Super Admin' ? "Cannot disable: last active Super Admin" : "No permission"}
                                                                    >
                                                                        <Ban className="w-4 h-4" />
                                                                    </button>
                                                                )
                                                            )}

                                                            {/* Delete */}
                                                            {canDeleteAdmin(user) ? (
                                                                <button
                                                                    onClick={() => setConfirmDelete(user)}
                                                                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                                                    title="Delete Admin"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    disabled
                                                                    className="p-2 rounded-lg text-slate-200 cursor-not-allowed"
                                                                    title={user.role === 'Super Admin' ? "Cannot delete: last active Super Admin" : "No permission"}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                            {filterStatus === 'admins' && !user.isAdmin && (
                                                <td className="py-5 px-6 text-center">
                                                    <span className="text-xs text-slate-300">—</span>
                                                </td>
                                            )}
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
                            &gt;
                        </button>
                    </div>
                </div>
            </div>

            {/* User Details Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={modalMode === "orders" ? "User Order History" : "User Details Summary"}
                size={modalMode === "orders" ? "lg" : "md"}
            >
                {selectedUser && modalMode === "view" && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center">
                                <svg className="w-12 h-12 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                                </svg>
                            </div>
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

                {selectedUser && modalMode === "orders" && (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {selectedUser.orders && selectedUser.orders.length > 0 ? (
                            selectedUser.orders.map((order) => (
                                <div key={order.id} className="p-4 border border-slate-100 rounded-xl hover:shadow-md transition-all duration-200">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-bold text-gray-900">Order #{order.orderId || order.id.substring(0, 8)}</p>
                                            <p className="text-xs text-gray-500">{formatDate(order.orderDate)}</p>
                                        </div>
                                        <Badge variant={
                                            order.status === 'Delivered' ? 'success' :
                                            order.status === 'Shipped' ? 'purple' :
                                            order.status === 'Placed' ? 'warning' : 'default'
                                        }>
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

            {/* Add Admin Modal */}
            <Modal
                isOpen={showAddAdminModal}
                onClose={() => { setShowAddAdminModal(false); setNewAdmin({ name: '', email: '', password: '', role: 'Admin', userId: '' }); setAdminSearchTerm(''); setShowUserDropdown(false); }}
                title="Promote User to Administrator"
                size="md"
            >
                <div className="space-y-4">
                    {/* User Search */}
                    <div className="relative">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Search User *</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Type name or email to search users..."
                                value={adminSearchTerm}
                                onChange={(e) => {
                                    setAdminSearchTerm(e.target.value);
                                    setShowUserDropdown(true);
                                    if (!e.target.value) {
                                        setNewAdmin({ ...newAdmin, name: '', email: '', userId: '' });
                                    }
                                }}
                                onFocus={() => setShowUserDropdown(true)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        {showUserDropdown && adminSearchTerm.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                {users
                                    .filter(u => u.role === 'User' && !u.isAdmin && (
                                        u.name?.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
                                        u.email?.toLowerCase().includes(adminSearchTerm.toLowerCase())
                                    ))
                                    .length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-slate-400 text-center">No matching users found</div>
                                ) : (
                                    users
                                        .filter(u => u.role === 'User' && !u.isAdmin && (
                                            u.name?.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
                                            u.email?.toLowerCase().includes(adminSearchTerm.toLowerCase())
                                        ))
                                        .slice(0, 10)
                                        .map(u => (
                                            <button
                                                key={u.id}
                                                type="button"
                                                onClick={() => {
                                                    setNewAdmin({ ...newAdmin, name: u.name || '', email: u.email || '', userId: u.id });
                                                    setAdminSearchTerm(u.name ? `${u.name} (${u.email})` : u.email);
                                                    setShowUserDropdown(false);
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-b-0"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 border border-slate-200">
                                                    <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                                                    </svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 truncate">{u.name || 'Anonymous'}</p>
                                                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                                                </div>
                                            </button>
                                        ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Selected User Info */}
                    {newAdmin.userId && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                                <Users className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-900">{newAdmin.name || 'Anonymous'}</p>
                                <p className="text-xs text-slate-500">{newAdmin.email}</p>
                            </div>
                            <button
                                onClick={() => { setNewAdmin({ ...newAdmin, name: '', email: '', userId: '' }); setAdminSearchTerm(''); }}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            >
                                <Slash className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Password */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Admin Password *</label>
                        <Input
                            type="password"
                            placeholder="Set a password for admin login"
                            value={newAdmin.password}
                            onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                            icon={<Lock className="w-4 h-4" />}
                            required
                        />
                    </div>

                    {/* Role - only Super Admin can choose Super Admin role */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Role</label>
                        {isSuperAdmin ? (
                            <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                value={newAdmin.role}
                                onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                            >
                                <option value="Admin">Admin</option>
                                <option value="Super Admin">Super Admin</option>
                            </select>
                        ) : (
                            <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-500">
                                Admin <span className="text-xs text-slate-400 ml-2">(Only Super Admins can assign Super Admin role)</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" fullWidth onClick={() => { setShowAddAdminModal(false); setNewAdmin({ name: '', email: '', password: '', role: 'Admin', userId: '' }); setAdminSearchTerm(''); }}>Cancel</Button>
                        <Button variant="primary" fullWidth onClick={handleAddAdmin} disabled={!newAdmin.userId} icon={<Plus className="w-4 h-4" />}>Promote to Admin</Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => handleDeleteAdmin(confirmDelete)}
                title="Delete Administrator"
                message={`Are you sure you want to permanently delete "${confirmDelete?.name || confirmDelete?.email}"? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
};

export default AdminUsersPage;
