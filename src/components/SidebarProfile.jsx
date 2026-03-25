import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const SidebarProfile = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [adminName, setAdminName] = useState('Administrator');

    const isAdminVerified = window.__adminVerified === true;
    const adminEmail = sessionStorage.getItem("admin_email") || "";

    // Fetch admin name from Firestore
    useEffect(() => {
        if (isAdminVerified && adminEmail) {
            const fetchAdminName = async () => {
                try {
                    const q = query(collection(db, 'admins'), where('email', '==', adminEmail));
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        const data = snap.docs[0].data();
                        setAdminName(data.name || data.role || 'Administrator');
                    }
                } catch (err) {
                    console.error('Error fetching admin details:', err);
                }
            };
            fetchAdminName();
        }
    }, [isAdminVerified, adminEmail]);

    const handleLogout = async () => {
        if (isAdminVerified) {
            // Admin logout — only clear admin session, don't sign out Firebase Auth
            window.__adminVerified = false;
            sessionStorage.removeItem("admin_verified");
            sessionStorage.removeItem("admin_email");
            toast.success("Logged out of Admin Panel!");
            navigate("/admin");
            return;
        }
        try {
            await signOut();
            toast.success("Logged out successfully!");
            navigate("/signin");
        } catch (error) {
            toast.error("Logout failed. Please try again.");
            console.error("Logout error:", error);
        }
    };

    if (!user && !isAdminVerified) return null;

    let displayUser = user || {};

    if (isAdminVerified) {
        displayUser = {
            name: adminName,
            email: adminEmail
        };
    } else if (user) {
         displayUser = {
             name: user.name || user.displayName || 'User',
             email: user.email
         }
    }

    const initials = (displayUser.name && displayUser.name.trim())
        ? displayUser.name.trim().split(' ').map(n => n[0]).join('').toUpperCase()
        : (displayUser.email ? displayUser.email[0].toUpperCase() : 'U');

    return (
        <div className="p-4 border-t border-gray-50 bg-white">
            <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm overflow-hidden">
                    {initials}
                </div>
                <div className="flex-1 overflow-hidden flex flex-col justify-center min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate leading-tight">
                        {displayUser.name || 'User'}
                    </h4>
                    {displayUser.email && (
                        <p className="text-[10px] text-gray-500 truncate leading-tight mt-0.5">
                            {displayUser.email}
                        </p>
                    )}
                </div>
                <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Logout"
                >
                    <LogOut className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default SidebarProfile;
