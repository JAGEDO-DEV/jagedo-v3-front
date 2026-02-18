//@ts-ignore
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";

// Local/Utility Imports
import ImageUploader from "./ImageUploader";
import { useGlobalContext } from "@/context/GlobalProvider";
import Preview from "./Preview";
import { uploadFile } from "@/utils/fileUpload";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import {
    createProduct,
    updateProduct,
    getProductById,
    getProductCategories
} from "@/api/products.api";
import { getAllRegions } from "@/api/countries.api";
import Loader from "../Loader";


const ProductUploadForm = ({ onCancel }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useGlobalContext();
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);


    const [formData, setFormData] = useState({
        name: '',
        price: '',
        sku: '',
        bid: '',
        material: '',
        size: '',
        color: '',
        region: '',
        uom: '',
        category: '',
    });
    const [productDesc, setProductDesc] = useState("");
    const [images, setImages] = useState([]);


    const [categories, setCategories] = useState([]);
    const [regions, setRegions] = useState([]);


    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [isDropdownLoading, setIsDropdownLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [previewVisibility, setPreviewVisibility] = useState(false);


    const queryParams = new URLSearchParams(location.search);
    const isEditMode = queryParams.get('edit') === 'true';
    const productId = queryParams.get('id');
    const origin = location.state?.from || "/fundi-portal/products";
    const isFormIncomplete = !formData.name || !formData.bid || !formData.sku || !formData.price || !formData.category || !formData.region || !productDesc || images.length === 0;


    useEffect(() => {
        const fetchDropdownData = async () => {
            setIsDropdownLoading(true);
            try {
                // Fetch both in parallel for efficiency
                const [categoriesResponse, regionsResponse] = await Promise.all([
                    getProductCategories(axiosInstance),
                    getAllRegions(axiosInstance)
                ]);

                const categoriesRes = categoriesResponse.hashSet.filter((cat: any) => cat.type === user.user_type.toLowerCase())
                // Based on the provided structures
                setCategories(categoriesRes || []);
                setRegions(regionsResponse.hashSet || []);

            } catch (error) {
                toast.error("Failed to load categories or regions.");
                console.error("Dropdown fetch error:", error);
            } finally {
                setIsDropdownLoading(false);
            }
        };

        fetchDropdownData();
    }, []);

    // Effect to fetch product data if in edit mode
    useEffect(() => {
        const fetchProduct = async () => {
            if (isEditMode && productId) {
                setIsPageLoading(true);
                try {
                    const existingProduct = await getProductById(axiosInstance, productId);
                    setFormData({
                        name: existingProduct.name || '',
                        material: existingProduct.material || '',
                        size: existingProduct.size || '',
                        color: existingProduct.color || '',
                        region: existingProduct.regionId?.toString() || '',
                        uom: existingProduct.uom || '',
                        bid: existingProduct.bId || '',
                        sku: existingProduct.sku || '',
                        price: existingProduct.customPrice?.toString() || '',
                        category: existingProduct.category || '',
                    });
                    setProductDesc(existingProduct.description || '');
                    setImages(existingProduct.images || []);
                    setIsEditing(true);
                } catch (error) {
                    toast.error("Failed to fetch product data. Redirecting.");
                    navigate(origin);
                } finally {
                    setIsPageLoading(false);
                }
            }
            else if (!isEditMode) {
                const savedDraftJSON = localStorage.getItem('product_draft');
                if (savedDraftJSON) {
                    if (window.confirm("You have a saved draft. Would you like to load it?")) {
                        try {
                            const draftData = JSON.parse(savedDraftJSON);
                            setFormData(draftData.formData);
                            setProductDesc(draftData.productDesc);
                            setImages(draftData.images || []);
                            toast.success("Draft loaded successfully.");
                            localStorage.removeItem('product_draft');
                        } catch (error) {
                            console.error("Failed to load draft:", error);
                            localStorage.removeItem('product_draft');
                        }
                    }
                }
            }
        };

        fetchProduct();
    }, []);

    // --- HANDLER FUNCTIONS ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleBackClick = () => {
        onCancel ? onCancel() : navigate(-1);
    };

    const handleApiSubmit = async (statusType) => {
        // --- DRAFT HANDLING LOGIC ---
        if (statusType === "Drafts") {
            if (!formData.name) {
                toast.error("Please enter at least a product name to save a draft.");
                return;
            }
            setIsSubmitting(true);
            try {
                const draft = {
                    formData,
                    productDesc,
                    images: images.filter(img => typeof img === 'string'),
                };

                localStorage.setItem('product_draft', JSON.stringify(draft));
                toast.success('Product saved as a draft!');

                setTimeout(() => navigate(origin), 1500);

            } catch (error) {
                toast.error("Failed to save draft.");
                console.error("Draft save error:", error);
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        if (isFormIncomplete) {
            toast.error('Please fill all required fields.');
            return;
        }
        setIsSubmitting(true);

        try {
            const uploadPromises = images.map(image => {
                if (typeof image === 'string') return Promise.resolve(image);
                if (typeof image === 'object' && image.file instanceof File) {
                    return uploadFile(image.file).then(uploadedFile => uploadedFile.url);
                }
                return Promise.resolve(null);
            });

            const finalImageUrls = (await Promise.all(uploadPromises)).filter(url => url !== null);

            if (finalImageUrls.length === 0) {
                throw new Error("No valid images were available to submit.");
            }

            const payload = {
                name: formData.name,
                description: productDesc,
                type: user.user_type,
                category: formData.category,
                sellerId: user.id,
                bId: formData.bid,
                sku: formData.sku,
                material: formData.material,
                size: formData.size,
                color: formData.color,
                uom: formData.uom,
                images: finalImageUrls,
                customPrice: parseFloat(formData.price) || 0
            };

            if (isEditing) {
                await updateProduct(axiosInstance, productId, payload);
                toast.success('Product updated successfully!');
            } else {
                await createProduct(axiosInstance, payload);
                toast.success('Product created successfully!');
            }

            localStorage.removeItem('product_draft');

        } catch (error) {
            toast.error(error.message || "An unexpected error occurred during submission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitLabel = isEditMode ? "Submit Changes" : "Submit for Approval";

    if (isPageLoading) {
        return <div className="p-7 flex justify-center items-center min-h-screen"><Loader /></div>;

    }

    return (
        <div className="p-2 sm:p-4 md:p-7 flex flex-col min-h-screen bg-gray-100">
            <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg p-4 md:p-6 space-y-6 my-auto w-full">
                <div id="add__product" className="flex justify-start items-center space-x-2 border-b pb-4">
                    <button className="rounded-full w-10 h-10 text-2xl font-bold bg-gray-200 hover:bg-gray-300 flex items-center justify-center flex-shrink-0" onClick={handleBackClick} type="button">
                        ←
                    </button>
                    <h1 className="text-1xl md:text-3xl font-bold text-gray-800">{isEditing ? "Edit Product" : "Add New Product"}</h1>
                </div>

                <form className="grid grid-cols-1 gap-6">
                    <div>
                        <h2 className="block font-semibold mb-2 text-gray-700">Category*</h2>
                        <select name="category" value={formData.category} onChange={handleInputChange} className="w-full border border-gray-400 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="" disabled>{isDropdownLoading ? "Loading..." : "Select a category"}</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <h2 className="block font-semibold mb-2 text-gray-700">Product Name*</h2>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full border border-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        <h2 className="block font-semibold mt-4 mb-2 text-gray-700">Product Description*</h2>
                        <textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} className="w-full border border-gray-400 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" rows={5} placeholder="Write a detailed product description here..." maxLength={500} required />
                    </div>

                    <div>
                        <h2 className="font-semibold mb-3 text-gray-700">Product Attributes</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="col-span-1 sm:col-span-2 md:col-span-4">
                                <h3 className="block font-semibold mb-2 text-gray-700">Region*</h3>
                                <select name="region" value={formData.region} onChange={handleInputChange} className="w-full border border-gray-400 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="" disabled>{isDropdownLoading ? "Loading..." : "Select a region"}</option>
                                    {regions.map(reg => (
                                        <option key={reg.id} value={reg.id}>{reg.name}</option>
                                    ))}
                                </select>
                            </div>
                            {[
                                { name: 'bid', label: 'B-ID*', required: true },
                                { name: 'sku', label: 'SKU*', required: true },
                                { name: 'material', label: 'Material' },
                                { name: 'size', label: 'Size' },
                                { name: 'color', label: 'Color' },
                                { name: 'uom', label: 'UOM' },
                                { name: 'price', label: 'Price (KES)*', type: 'number', required: true },
                            ].map(({ name, label, type = 'text' }) => (
                                <div key={name} className="relative">
                                    {name === 'uom' ? (
                                        <div className="relative">
                                            <select
                                                name="uom"
                                                id="uom"
                                                value={formData.uom}
                                                onChange={handleInputChange}
                                                className="peer w-full border border-gray-300 rounded-lg px-4 pt-5 pb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none cursor-pointer transition-all duration-200 hover:border-gray-400 text-gray-900"
                                            >
                                                <option value="" disabled>Select unit</option>
                                                <option value="Pieces">Pieces</option>
                                                <option value="Kilograms">Kilograms</option>
                                                <option value="Meters">Meters</option>
                                                <option value="Liters">Liters</option>
                                                <option value="Set">Set</option>
                                                <option value="Pair">Pair</option>
                                            </select>

                                            {/* Floating label - matches your input field style */}
                                            <label
                                                htmlFor="uom"
                                                className={`absolute left-3 transition-all duration-200 bg-white px-1 pointer-events-none ${formData.uom
                                                    ? '-top-2.5 text-sm text-blue-600'
                                                    : 'top-3.5 text-base text-gray-500'
                                                    }`}
                                            >
                                                {label}
                                            </label>

                                            {/* Custom dropdown arrow */}
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type={type}
                                                name={name}
                                                id={name}
                                                value={formData[name]}
                                                onChange={handleInputChange}
                                                placeholder=" "
                                                className="peer w-full border border-gray-400 rounded px-3 pt-5 pb-2 focus:outline-none focus:border-blue-500"
                                            />
                                            <label
                                                htmlFor={name}
                                                className="absolute left-2 -top-2.5 text-sm text-gray-500 bg-white px-1 transition-all duration-200
                           peer-placeholder-shown:top-3 peer-placeholder-shown:text-base
                           peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600"
                                            >
                                                {label}
                                            </label>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="font-semibold mb-2 text-gray-700">Media Upload*</h2>
                        <div className="flex border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-4 flex-wrap gap-4">
                            <ImageUploader images={images} setImages={setImages} />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 pt-4 border-t mt-4">
                        <button onClick={() => setPreviewVisibility(true)} type="button" disabled={isSubmitting} className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold text-gray-800 bg-gray-200 hover:bg-gray-300 cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed">
                            Preview
                        </button>
                        <button type="button" disabled={isSubmitting} onClick={() => handleApiSubmit("Drafts")} className="w-full sm:w-auto px-6 py-2 rounded-lg font-semibold text-white bg-blue-800 hover:bg-blue-900 cursor-pointer disabled:bg-blue-400 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Saving...' : 'Save as Draft'}
                        </button>
                        <button type="button" disabled={isFormIncomplete || isSubmitting} onClick={() => handleApiSubmit("Pending Approval")} className="w-full sm:w-auto px-6 py-2 font-semibold text-white rounded-lg bg-green-600 hover:bg-green-700 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Submitting...' : submitLabel}
                        </button>
                    </div>
                </form>
            </div>
            {previewVisibility && (
                <Preview productData={formData} role={origin} images={images} handleEdit={() => setPreviewVisibility(false)} prodDescription={productDesc} />
            )}
        </div>
    );
};

export default ProductUploadForm;