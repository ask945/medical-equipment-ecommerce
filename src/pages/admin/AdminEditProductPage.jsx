import { useState, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc, collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Package, IndianRupee, Image as ImageIcon, Tag, Info, Check,
    X, Plus, Trash2, Shield, Upload, Loader2
} from "lucide-react";
import { Button, Card, Input, Alert, Badge, LoadingSpinner } from "../../components/ui";
import { toast } from "react-toastify";
import { formatCurrency } from "../../utils/formatUtils";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";

/**
 * Enhanced Edit Product Page with Modern UI
 */
const AdminEditProductPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('basic');
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingImages, setUploadingImages] = useState({});
    const fileInputRefs = useRef({});

    const handleImageUpload = async (imgKey, file) => {
        if (!file) return;
        setUploadingImages(prev => ({ ...prev, [imgKey]: true }));
        try {
            const url = await uploadToCloudinary(file);
            setProduct(prev => ({ ...prev, [imgKey]: url }));
            toast.success('Image uploaded successfully!');
        } catch (err) {
            toast.error(err.message || 'Failed to upload image');
        } finally {
            setUploadingImages(prev => ({ ...prev, [imgKey]: false }));
        }
    };

    const [tagInput, setTagInput] = useState("");
    const [featureInput, setFeatureInput] = useState("");
    const [specKey, setSpecKey] = useState("");
    const [specValue, setSpecValue] = useState("");
    const [errors, setErrors] = useState({});

    // Dynamic brands and categories
    const [brandsList, setBrandsList] = useState([]);
    const [categoriesList, setCategoriesList] = useState([]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                if (!id) return;
                const docRef = doc(db, "products", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProduct({
                        id: docSnap.id,
                        name: data.name || "",
                        description: data.description || "",
                        price: data.price || "",
                        mrp: data.mrp || "",
                        sellingPrice: data.sellingPrice || data.price || "",
                        brand: data.brand || "",
                        stock: data.stock || 0,
                        type: data.type || "",
                        image: data.image || "",
                        image2: data.image2 || "",
                        image3: data.image3 || "",
                        showOnHome: data.showOnHome || false,
                        tags: data.tags || [],
                        origin: data.origin || "",
                        additionalInfo: data.additionalInfo || "",
                        warranty: data.warranty || { available: false, period: "", details: "" },
                        guarantee: data.guarantee || { available: false, period: "", details: "" },
                        specifications: data.specifications || [],
                        features: data.features || [],
                        rating: data.rating || "",
                        reviews: data.reviews || ""
                    });
                } else {
                    toast.error("Product not found");
                    navigate("/admin/products");
                }
            } catch (error) {
                console.error("Error fetching product:", error);
                toast.error("Failed to load product details");
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, navigate]);

    useEffect(() => {
        // Real-time listeners for brands and categories
        const unsubBrands = onSnapshot(collection(db, "brands"), (snap) => {
            setBrandsList(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });
        const unsubCategories = onSnapshot(collection(db, "categories"), (snap) => {
            setCategoriesList(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        });
        return () => {
            unsubBrands();
            unsubCategories();
        };
    }, []);

    const tabs = [
        { id: 'basic', label: 'Basic Info', icon: Package },
        { id: 'pricing', label: 'Pricing', icon: IndianRupee },
        { id: 'images', label: 'Images', icon: ImageIcon },
        { id: 'details', label: 'Details', icon: Info },
        { id: 'warranty', label: 'Warranty', icon: Shield }
    ];

    /**
     * Validate form
     */
    const validateForm = () => {
        const newErrors = {};

        if (!product.name) newErrors.name = "Product name is required";
        if (!product.sellingPrice) newErrors.sellingPrice = "Selling price is required";
        if (!product.image) newErrors.image = "At least one image is required";
        if (product.stock === undefined || product.stock < 0) newErrors.stock = "Valid stock quantity is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Handle product update
     */
    const handleUpdateProduct = async () => {
        if (!validateForm()) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            setIsSubmitting(true);

            const { id: productId, ...productToSave } = {
                ...product,
                sellingPrice: Number(product.sellingPrice),
                mrp: Number(product.mrp || product.sellingPrice),
                price: Number(product.sellingPrice),
                stock: Number(product.stock),
                rating: Number(product.rating || 0),
                reviews: Number(product.reviews || 0),
                updatedAt: new Date()
            };

            const productRef = doc(db, "products", productId);
            await updateDoc(productRef, productToSave);

            toast.success("Product updated successfully!");
            setTimeout(() => {
                navigate("/admin/products");
            }, 1500);
        } catch (error) {
            console.error("Error updating product:", error);
            toast.error("Failed to update product");
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Add tag
     */
    const addTag = () => {
        if (tagInput.trim() && !product.tags.includes(tagInput.trim())) {
            setProduct({
                ...product,
                tags: [...product.tags, tagInput.trim()]
            });
            setTagInput("");
        }
    };

    /**
     * Remove tag
     */
    const removeTag = (tagToRemove) => {
        setProduct({
            ...product,
            tags: product.tags.filter(tag => tag !== tagToRemove)
        });
    };

    /**
     * Add feature
     */
    const addFeature = () => {
        if (featureInput.trim()) {
            setProduct({
                ...product,
                features: [...product.features, featureInput.trim()]
            });
            setFeatureInput("");
        }
    };

    /**
     * Remove feature
     */
    const removeFeature = (index) => {
        setProduct({
            ...product,
            features: product.features.filter((_, i) => i !== index)
        });
    };

    /**
     * Add specification
     */
    const addSpecification = () => {
        if (specKey.trim() && specValue.trim()) {
            setProduct({
                ...product,
                specifications: [...product.specifications, { key: specKey.trim(), value: specValue.trim() }]
            });
            setSpecKey("");
            setSpecValue("");
        }
    };

    /**
     * Remove specification
     */
    const removeSpecification = (index) => {
        setProduct({
            ...product,
            specifications: product.specifications.filter((_, i) => i !== index)
        });
    };

    /**
     * Calculate discount percentage
     */
    const discountPercentage = () => {
        const mrp = Number(product.mrp);
        const selling = Number(product.sellingPrice);
        if (mrp > selling && selling > 0) {
            return Math.round(((mrp - selling) / mrp) * 100);
        }
        return 0;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <LoadingSpinner size="xl" text="Loading product details..." />
            </div>
        );
    }

    if (!product) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-6xl mx-auto space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
                    <p className="text-gray-600 mt-1">Update details for: <span className="font-semibold text-blue-600">{product.name}</span></p>
                </div>
                <Button
                    variant="ghost"
                    onClick={() => navigate("/admin/products")}
                    icon={<X className="w-4 h-4" />}
                >
                    Cancel
                </Button>
            </div>

            {/* Progress Indicator */}
            <Card>
                <div className="flex gap-2 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <motion.button
                                key={tab.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </motion.button>
                        );
                    })}
                </div>
            </Card>

            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <Card title="Basic Information" icon={<Package className="w-5 h-5 text-blue-600" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Product Name"
                                placeholder="Enter product name"
                                value={product.name}
                                onChange={(e) => setProduct({ ...product, name: e.target.value })}
                                error={errors.name}
                                required
                            />

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Brand</label>
                                <select
                                    value={brandsList.some(b => b.label === product.brand) ? product.brand : ""}
                                    onChange={(e) => setProduct({ ...product, brand: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Brand</option>
                                    {brandsList.map((b) => (
                                        <option key={b.id} value={b.label}>{b.label}</option>
                                    ))}
                                    {!brandsList.some(b => b.label === product.brand) && product.brand && (
                                        <option value={product.brand} disabled>{product.brand} (Deleted)</option>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                <select
                                    value={categoriesList.some(c => c.label === product.type) ? product.type : ""}
                                    onChange={(e) => setProduct({ ...product, type: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Category</option>
                                    {categoriesList.map((c) => (
                                        <option key={c.id} value={c.label}>{c.label}</option>
                                    ))}
                                    {!categoriesList.some(c => c.label === product.type) && product.type && (
                                        <option value={product.type} disabled>{product.type} (Deleted)</option>
                                    )}
                                </select>
                            </div>

                             <Input
                                label="Stock Quantity"
                                type="number"
                                placeholder="Available stock"
                                value={product.stock}
                                onChange={(e) => setProduct({ ...product, stock: e.target.value })}
                                error={errors.stock}
                                required
                            />

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Product Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={product.description}
                                    onChange={(e) => setProduct({ ...product, description: e.target.value })}
                                    rows="4"
                                    placeholder="Detailed description of the product..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </Card>

                    <Card title="Status & Visibility">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="showOnHome"
                                    checked={product.showOnHome}
                                    onChange={(e) => setProduct({ ...product, showOnHome: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="showOnHome" className="text-gray-700 cursor-pointer">
                                    Display on Homepage
                                </label>
                            </div>

                            {Number(product.stock) === 0 && (
                                <Badge variant="danger" pulse>Out of Stock</Badge>
                            )}
                            {Number(product.stock) > 0 && Number(product.stock) < 10 && (
                                <Badge variant="warning" pulse>Low Stock</Badge>
                            )}
                        </div>
                    </Card>

                    <div className="flex justify-end pt-4 border-t">
                        <Button
                            onClick={handleUpdateProduct}
                            loading={isSubmitting}
                            icon={<Check className="w-4 h-4" />}
                            iconPosition="right"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <Card title="Pricing Information" icon={<IndianRupee className="w-5 h-5 text-green-600" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="MRP (Maximum Retail Price)"
                                type="number"
                                placeholder="₹ 0.00"
                                value={product.mrp}
                                onChange={(e) => setProduct({ ...product, mrp: e.target.value })}
                                icon={<IndianRupee className="w-4 h-4" />}
                            />

                            <Input
                                label="Selling Price"
                                type="number"
                                placeholder="₹ 0.00"
                                value={product.sellingPrice}
                                onChange={(e) => setProduct({
                                    ...product,
                                    sellingPrice: e.target.value,
                                    price: e.target.value
                                })}
                                icon={<IndianRupee className="w-4 h-4" />}
                                error={errors.sellingPrice}
                                required
                            />

                            {discountPercentage() > 0 && (
                                <div className="col-span-1 md:col-span-2">
                                    <Alert
                                        variant="success"
                                        title="Discount Applied"
                                        message={`Customers will save ${discountPercentage()}% on this product!`}
                                    />
                                </div>
                            )}
                        </div>
                    </Card>

                    <div className="flex justify-between pt-4 border-t">
                        <Button onClick={() => setActiveTab('basic')} variant="outline">
                            Back
                        </Button>
                        <Button
                            onClick={handleUpdateProduct}
                            loading={isSubmitting}
                            icon={<Check className="w-4 h-4" />}
                            iconPosition="right"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <Card title="Product Images" icon={<ImageIcon className="w-5 h-5 text-pink-600" />}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                            {['image', 'image2', 'image3'].map((imgKey, index) => (
                                <div key={imgKey}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        {index === 0 ? 'Primary Image' : index === 1 ? 'Secondary Image' : 'Tertiary Image'}
                                        {index === 0 && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    <Input
                                        type="url"
                                        placeholder="Paste image URL"
                                        value={product[imgKey]}
                                        onChange={(e) => setProduct({ ...product, [imgKey]: e.target.value })}
                                        error={index === 0 ? errors.image : undefined}
                                        className="mb-0"
                                    />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={el => fileInputRefs.current[imgKey] = el}
                                        className="hidden"
                                        onChange={(e) => {
                                            handleImageUpload(imgKey, e.target.files[0]);
                                            e.target.value = '';
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRefs.current[imgKey]?.click()}
                                        disabled={uploadingImages[imgKey]}
                                        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {uploadingImages[imgKey] ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                Upload from Device
                                            </>
                                        )}
                                    </button>
                                    {product[imgKey] && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="mt-2 relative group"
                                        >
                                            <img
                                                src={product[imgKey]}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-500 transition-all duration-200"
                                                onError={(e) => {
                                                    e.target.src = 'https://via.placeholder.com/300x200?text=Invalid+Image';
                                                }}
                                            />
                                            <button
                                                onClick={() => setProduct({ ...product, [imgKey]: '' })}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>

                    <div className="flex justify-between pt-4 border-t">
                        <Button onClick={() => setActiveTab('pricing')} variant="outline">
                            Back
                        </Button>
                        <Button
                            onClick={handleUpdateProduct}
                            loading={isSubmitting}
                            icon={<Check className="w-4 h-4" />}
                            iconPosition="right"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    {/* Tags */}
                    <Card title="Product Tags" icon={<Tag className="w-5 h-5 text-indigo-600" />}>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {product.tags?.map((tag, index) => (
                                <Badge key={index} variant="info">
                                    {tag}
                                    <button
                                        onClick={() => removeTag(tag)}
                                        className="ml-2 hover:text-red-500"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add a tag"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                className="mb-0 flex-1"
                            />
                            <Button onClick={addTag} icon={<Plus className="w-4 h-4" />}>
                                Add
                            </Button>
                        </div>
                    </Card>

                    {/* Features */}
                    <Card title="Key Features" icon={<Check className="w-5 h-5 text-green-600" />}>
                        <div className="space-y-2 mb-4">
                            {product.features?.map((feature, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-700">• {feature}</span>
                                    <button
                                        onClick={() => removeFeature(index)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add a feature"
                                value={featureInput}
                                onChange={(e) => setFeatureInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                                className="mb-0 flex-1"
                            />
                            <Button onClick={addFeature} icon={<Plus className="w-4 h-4" />}>
                                Add
                            </Button>
                        </div>
                    </Card>

                    {/* Specifications */}
                    <Card title="Specifications" icon={<Info className="w-5 h-5 text-blue-600" />}>
                        <div className="space-y-2 mb-4">
                            {product.specifications?.map((spec, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                        <span className="font-semibold text-gray-700">{spec.key}:</span>
                                        <span className="text-gray-600">{spec.value}</span>
                                    </div>
                                    <button
                                        onClick={() => removeSpecification(index)}
                                        className="text-red-500 hover:text-red-700 ml-4"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                placeholder="Specification name"
                                value={specKey}
                                onChange={(e) => setSpecKey(e.target.value)}
                                className="mb-0"
                            />
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Value"
                                    value={specValue}
                                    onChange={(e) => setSpecValue(e.target.value)}
                                    className="mb-0 flex-1"
                                />
                                <Button onClick={addSpecification} icon={<Plus className="w-4 h-4" />}>
                                    Add
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Additional Info */}
                    <Card title="Additional Information">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Country of Origin
                                </label>
                                <Input
                                    placeholder="e.g., India, Japan, Germany"
                                    value={product.origin}
                                    onChange={(e) => setProduct({ ...product, origin: e.target.value })}
                                    className="mb-0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Additional Notes
                                </label>
                                <textarea
                                    value={product.additionalInfo}
                                    onChange={(e) => setProduct({ ...product, additionalInfo: e.target.value })}
                                    rows="3"
                                    placeholder="Any additional information..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-between pt-4 border-t">
                        <Button onClick={() => setActiveTab('images')} variant="outline">
                            Back
                        </Button>
                        <Button
                            onClick={handleUpdateProduct}
                            loading={isSubmitting}
                            icon={<Check className="w-4 h-4" />}
                            iconPosition="right"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Warranty Tab */}
            {activeTab === 'warranty' && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <Card title="Warranty & Guarantee" icon={<Shield className="w-5 h-5 text-yellow-600" />}>
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="checkbox"
                                    id="warranty"
                                    checked={product.warranty?.available}
                                    onChange={(e) => setProduct({
                                        ...product,
                                        warranty: { ...product.warranty, available: e.target.checked }
                                    })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="warranty" className="font-semibold text-gray-700 cursor-pointer">
                                    Product has warranty
                                </label>
                            </div>

                            {product.warranty?.available && (
                                <div className="pl-6 space-y-4">
                                    <Input
                                        label="Warranty Period"
                                        placeholder="e.g., 1 year, 6 months"
                                        value={product.warranty?.period}
                                        onChange={(e) => setProduct({
                                            ...product,
                                            warranty: { ...product.warranty, period: e.target.value }
                                        })}
                                    />
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Warranty Details
                                        </label>
                                        <textarea
                                            value={product.warranty?.details}
                                            onChange={(e) => setProduct({
                                                ...product,
                                                warranty: { ...product.warranty, details: e.target.value }
                                            })}
                                            rows="3"
                                            placeholder="Describe what the warranty covers..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="checkbox"
                                    id="guarantee"
                                    checked={product.guarantee?.available}
                                    onChange={(e) => setProduct({
                                        ...product,
                                        guarantee: { ...product.guarantee, available: e.target.checked }
                                    })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="guarantee" className="font-semibold text-gray-700 cursor-pointer">
                                    Product has guarantee
                                </label>
                            </div>

                            {product.guarantee?.available && (
                                <div className="pl-6 space-y-4">
                                    <Input
                                        label="Guarantee Period"
                                        placeholder="e.g., 7 days, 30 days"
                                        value={product.guarantee?.period}
                                        onChange={(e) => setProduct({
                                            ...product,
                                            guarantee: { ...product.guarantee, period: e.target.value }
                                        })}
                                    />
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Guarantee Details
                                        </label>
                                        <textarea
                                            value={product.guarantee?.details}
                                            onChange={(e) => setProduct({
                                                ...product,
                                                guarantee: { ...product.guarantee, details: e.target.value }
                                            })}
                                            rows="3"
                                            placeholder="Describe what the guarantee covers..."
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card title="Save Changes" icon={<Check className="w-5 h-5 text-green-600" />}>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <p className="text-gray-600 font-medium">Ready to update this product listing?</p>
                                <p className="text-sm text-gray-500">Last updated: {product.updatedAt?.toDate ? product.updatedAt.toDate().toLocaleString() : 'Never'}</p>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <Button
                                    variant="outline"
                                    onClick={() => navigate("/admin/products")}
                                    fullWidth
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleUpdateProduct}
                                    loading={isSubmitting}
                                    fullWidth
                                    icon={<Check className="w-4 h-4" />}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <div className="flex justify-between">
                        <Button onClick={() => setActiveTab('details')} variant="outline">
                            Back
                        </Button>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default AdminEditProductPage;
