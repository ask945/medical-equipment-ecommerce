import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, Shield, Loader2, ArrowRight } from "lucide-react";
import { Button, Input, Card, Alert } from "../../components/ui";
import { motion } from "framer-motion";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { adminDb } from "../../adminFirebase";
import { toast } from "react-toastify";

/**
 * Dedicated Admin Login Page
 * Used as a gateway for the /admin dashboard
 */
const AdminLoginPage = ({ onVerify }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Check the dedicated 'admins' collection in Firestore
            const adminsRef = collection(adminDb, "admins");
            const q = query(adminsRef, where("email", "==", email), where("password", "==", password));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Check if admin is disabled
                const adminDoc = querySnapshot.docs[0];
                const adminData = adminDoc.data();
                if (adminData.isDeleted) {
                    setError("This admin account no longer exists.");
                    setLoading(false);
                    return;
                }
                if (adminData.isDisabled) {
                    setError("Your admin account has been disabled. Contact a Super Admin.");
                    setLoading(false);
                    return;
                }

                // Valid admin — store session and grant access
                sessionStorage.setItem("admin_email", email);
                sessionStorage.setItem("admin_role", adminData.role || "Admin");
                sessionStorage.setItem("admin_id", adminDoc.id);
                onVerify(true);
                setLoading(false);
                return;
            }

            // Emergency fallback for first-time setup
            if (email === "admin@bluecare.com" && password === "admin789") {
                try {
                    await addDoc(adminsRef, {
                        email: email,
                        password: password,
                        role: "Super Admin",
                        createdAt: new Date()
                    });
                    toast.success("Admin credentials saved to database!");
                } catch (e) {
                    console.error("Could not auto-create admin doc:", e);
                }

                sessionStorage.setItem("admin_email", email);
                sessionStorage.setItem("admin_role", "Super Admin");
                sessionStorage.setItem("admin_id", "super_admin_default");
                onVerify(true);
                setLoading(false);
                return;
            }

            setError("Invalid administrator credentials.");
        } catch (err) {
            console.error("Admin login error:", err);
            setError("Server connection failed or access denied.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fbff] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[440px]"
            >
                {/* Logo Area */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-100 mb-4">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Control Center</h1>
                    <p className="text-slate-500 font-medium mt-1">Provide credentials to access management tools</p>
                </div>

                <Card className="p-8 border-slate-100 shadow-2xl shadow-blue-50/50 rounded-3xl">
                    <form onSubmit={handleAdminLogin} className="space-y-5">
                        {error && (
                            <Alert variant="danger" message={error} />
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[13px] font-bold text-slate-700 ml-1">Administrator Email</label>
                            <Input
                                type="email"
                                placeholder="admin@bluecare.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                icon={<Mail className="w-4 h-4" />}
                                required
                                className="h-12 border-slate-200 focus:border-blue-500 rounded-xl"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[13px] font-bold text-slate-700">Security Password</label>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    icon={<Lock className="w-4 h-4" />}
                                    required
                                    className="h-12 border-slate-200 focus:border-blue-500 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                fullWidth
                                disabled={loading}
                                className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all hover:-translate-y-0.5"
                                icon={loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                iconPosition="right"
                            >
                                {loading ? "Verifying..." : "Unlock Dashboard"}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                        <button
                            onClick={() => navigate("/")}
                            className="text-[13px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Return to Public Storefront
                        </button>
                    </div>
                </Card>

                <div className="mt-8 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <Shield className="w-3 h-3" />
                    <span>Secure Encrypted Connection</span>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLoginPage;
