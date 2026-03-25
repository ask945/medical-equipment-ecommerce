import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Save, ArrowLeft, Image as ImageIcon,
    Link as LinkIcon, Type, FileText,
    Tag, User, CheckCircle, Globe,
    Upload, Loader2, Trash2
} from "lucide-react";
import { Button, Card, Input, LoadingSpinner } from "../../components/ui";
import { getBlogById, createBlog, updateBlog } from "../../services/blogService";
import { toast } from "react-toastify";
import RichTextEditor from "../../components/RichTextEditor";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";

const AdminBlogDetailEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        excerpt: "",
        content: "",
        image: "",
        category: "General Health",
        author: "Admin",
        readTime: "5 min read",
        isActive: true,
        tags: ""
    });

    useEffect(() => {
        if (isEditMode) {
            fetchBlog();
        }
    }, [id]);

    const fetchBlog = async () => {
        try {
            const blog = await getBlogById(id);
            if (blog) {
                setFormData({
                    ...blog,
                    tags: blog.tags?.join(", ") || ""
                });
            } else {
                toast.error("Article not found");
                navigate("/admin/blog");
            }
        } catch (error) {
            toast.error("Failed to load article");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const url = await uploadToCloudinary(file);
            setFormData(prev => ({ ...prev, image: url }));
            toast.success("Image uploaded successfully");
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim() || !formData.content.trim()) {
            return toast.error("Title and Content are required");
        }

        setSaving(true);
        try {
            const processedData = {
                ...formData,
                tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
                updatedAt: new Date()
            };

            if (isEditMode) {
                await updateBlog(id, processedData);
                toast.success("Article updated successfully");
            } else {
                await createBlog(processedData);
                toast.success("Article published successfully");
            }
            navigate("/admin/blog");
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Failed to save article");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <LoadingSpinner size="xl" text="Preparing editor..." />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-20 max-w-5xl mx-auto px-4"
        >
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate("/admin/blog")}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                            {isEditMode ? "Edit Article" : "Write New Post"}
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">
                            {isEditMode ? "Update your existing educational content" : "Share your medical expertise with your patients"}
                        </p>
                    </div>
                </div>
                <Button 
                    variant="primary" 
                    icon={<Save className="w-5 h-5" />} 
                    className="h-12 px-8 rounded-xl shadow-lg shadow-blue-100"
                    onClick={handleSave}
                    loading={saving}
                >
                    {isEditMode ? "Update Post" : "Publish Post"}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-8 border-slate-100 shadow-sm">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                                    <Type className="w-4 h-4 text-blue-500" /> Article Title
                                </label>
                                <input 
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full text-2xl font-bold bg-slate-50 border border-slate-100 rounded-2xl p-5 focus:outline-none focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300"
                                    placeholder="Enter a compelling title..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-500" /> Short Summary (Excerpt)
                                </label>
                                <textarea 
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                    className="w-full h-24 bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-none font-medium leading-relaxed"
                                    placeholder="A brief overview that appears in the blog list..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-800 flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-blue-500" /> Full Content
                                </label>
                                <RichTextEditor
                                    value={formData.content}
                                    onChange={(newContent) => setFormData(prev => ({ ...prev, content: newContent }))}
                                    placeholder="Write your blog content here..."
                                    maxLength={10000}
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-6">
                    {/* Visual Asset */}
                    <Card className="p-6 border-slate-100 shadow-sm space-y-4">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <ImageIcon className="w-3.5 h-3.5" /> Featured Image
                        </label>
                        <div className="aspect-video rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden group relative">
                            {uploading ? (
                                <div className="text-center p-4">
                                    <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Uploading...</p>
                                </div>
                            ) : formData.image ? (
                                <>
                                    <img src={formData.image} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Preview" />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer hover:bg-red-600"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <ImageIcon className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">No image selected</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Paste cover image URL..."
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                className="bg-slate-50 border-slate-100 flex-1"
                            />
                            <label className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors cursor-pointer shrink-0">
                                <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                                <Upload className="w-4 h-4" />
                            </label>
                        </div>
                    </Card>

                    {/* Meta Data */}
                    <Card className="p-6 border-slate-100 shadow-sm space-y-5">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Article Metadata</h4>
                        
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                                    <Tag className="w-3 h-3" /> Category
                                </label>
                                <select 
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                                >
                                    <option value="General Health">General Health</option>
                                    <option value="Medical Tech">Medical Tech</option>
                                    <option value="Patient Care">Patient Care</option>
                                    <option value="Industry News">Industry News</option>
                                    <option value="Equipment Guides">Equipment Guides</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                                    <User className="w-3 h-3" /> Author Name
                                </label>
                                <Input 
                                    value={formData.author}
                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    className="bg-slate-50 border-slate-100 font-bold"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 ml-1">
                                    <LinkIcon className="w-3 h-3" /> Tags (Comma separated)
                                </label>
                                <Input 
                                    placeholder="medical, health, guide..."
                                    value={formData.tags}
                                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                    className="bg-slate-50 border-slate-100"
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                                <span className="text-sm font-bold text-slate-600">Article Status</span>
                                <button 
                                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isActive ? 'bg-blue-600' : 'bg-slate-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium text-center italic">
                                {formData.isActive ? "Visible to public on saved" : "Saved as draft, hidden from public"}
                            </p>
                        </div>
                    </Card>

                    {/* Helpful Tips */}
                    <div className="bg-blue-600 rounded-[32px] p-8 text-white relative overflow-hidden">
                        <CheckCircle className="absolute -right-4 -bottom-4 text-white/10" size={100} />
                        <h4 className="text-lg font-black mb-3 italic">Editor Tips</h4>
                        <ul className="text-xs space-y-3 font-medium text-blue-50">
                            <li>• Use descriptive titles for better SEO.</li>
                            <li>• Keep summary under 200 characters.</li>
                            <li>• Include keywords in your tags.</li>
                            <li>• Break long text into paragraphs.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminBlogDetailEditor;
