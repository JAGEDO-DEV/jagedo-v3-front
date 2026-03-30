/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Camera, Loader2, Upload, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { createProductAdmin, updateProduct } from "@/api/products.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { uploadFile, validateFile } from "@/utils/fileUpload";
import { getAllCategories } from "@/api/categories.api";
import { getAllAttributes, Attribute } from "@/api/attributes.api";

interface AddProductFormProps {
  onBack: () => void;
  onSuccess: () => void;
  product?: any;
  isEditMode?: boolean;
  initialType?: string;
}

interface ProductFormData {
  name: string;
  description: string;
  type: string;
  category: string;
  subcategory: string;
  bId: string;
  sku: string;
  material: string;
  size: string;
  color: string;
  uom: string;
  images: string[];
}

interface UploadedImage {
  id: string;
  url: string;
  originalName: string;
  displayName: string;
}
import { createPortal } from "react-dom";

const ProductPreviewModal = ({
  formData,
  uploadedImages,
  onClose,
}: {
  formData: ProductFormData;
  uploadedImages: UploadedImage[];
  onClose: () => void;
}) => {
  const [activeImage, setActiveImage] = useState(0);

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          border: "0.5px solid #e5e7eb",
          width: "100%",
          maxWidth: "700px",
          overflow: "hidden",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "0.5px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "16px", fontWeight: 500 }}>
            Product preview
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "20px",
              lineHeight: 1,
              color: "#6b7280",
            }}
          >
            &#x2715;
          </button>
        </div>

        {/* Body */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr" }}>
          {/* Images */}
          <div
            style={{
              background: "#f9fafb",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {uploadedImages.length > 0 ? (
              <>
                <img
                  src={uploadedImages[activeImage]?.url}
                  alt="main"
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "6px",
                  }}
                >
                  {uploadedImages.map((img, i) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt={`thumb-${i}`}
                      onClick={() => setActiveImage(i)}
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        objectFit: "cover",
                        borderRadius: "6px",
                        cursor: "pointer",
                        border:
                          i === activeImage
                            ? "2px solid #00007A"
                            : "2px solid transparent",
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1",
                  background: "#e5e7eb",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  fontSize: "13px",
                }}
              >
                No images
              </div>
            )}
          </div>

          {/* Details */}
          <div
            style={{
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "11px",
                  color: "#9ca3af",
                  margin: "0 0 2px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {formData.category}
              </p>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: 500,
                  margin: 0,
                  color: "#111827",
                }}
              >
                {formData.name}
              </p>
            </div>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {formData.type && (
                <span
                  style={{
                    fontSize: "12px",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                  }}
                >
                  {formData.type}
                </span>
              )}
              {formData.sku && (
                <span
                  style={{
                    fontSize: "12px",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    background: "#f3f4f6",
                    color: "#6b7280",
                  }}
                >
                  {formData.sku}
                </span>
              )}
            </div>

            <div
              style={{
                borderTop: "0.5px solid #e5e7eb",
                paddingTop: "10px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              {[
                { label: "Material", value: formData.material },
                { label: "Size", value: formData.size },
                { label: "Color", value: formData.color },
                { label: "UOM", value: formData.uom },
                { label: "B-ID", value: formData.bId },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label}>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                        margin: 0,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{ fontSize: "13px", margin: 0, color: "#111827" }}
                    >
                      {value}
                    </p>
                  </div>
                ) : null,
              )}
            </div>

            {formData.description && (
              <div
                style={{ borderTop: "0.5px solid #e5e7eb", paddingTop: "10px" }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    margin: "0 0 4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Description
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {formData.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderTop: "0.5px solid #e5e7eb",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid #00007A",
              background: "transparent",
              cursor: "pointer",
              fontSize: "14px",
              color: "#00007A",
            }}
          >
            Back to edit
          </button>
        </div>
      </div>
    </div>,
    document.body, 
  );
};
export default function AddProductForm({
  onBack,
  onSuccess,
  product,
  isEditMode = false,
  initialType,
}: AddProductFormProps) {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || "",
    description: product?.description || "",
    type: product?.type || initialType || "",
    category: product?.category || "",
    subcategory: product?.subcategory || "",
    bId: product?.bId || "",
    sku: product?.sku || "",
    material: product?.material || "",
    size: product?.size || "",
    color: product?.color || "",
    uom: product?.uom || "",
    images: product?.images || [],
  });

  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [allAttributes, setAllAttributes] = useState<Attribute[]>([]);
  const [filteredAttributes, setFilteredAttributes] = useState<Attribute[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(
    product?.images?.map((url: string, index: number) => ({
      id: `existing-${index}`,
      url,
      originalName: `Image ${index + 1}`,
      displayName: `Image ${index + 1}`,
    })) || [],
  );

  const typeOptions = [
    { value: "HARDWARE", label: "Hardware" },
    { value: "FUNDI", label: "Fundi" },
    { value: "PROFESSIONAL", label: "Professional" },
    { value: "CONTRACTOR", label: "Contractor" },
  ];

  const generateBID = () => {
    const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BID-${timestamp}-${randomPart}`;
  };

  const fetchCategories = useCallback(
    async (type?: string) => {
      try {
        const response = await getAllCategories(axiosInstance);
        if (response.success) {
          const categoriesData = response.data || response.hashSet || [];

          let filteredCategories = categoriesData;
          const typeToFilter = (type || formData.type || "")
            .trim()
            .toUpperCase();

          if (typeToFilter && !isEditMode) {
            filteredCategories = categoriesData.filter((cat: any) => {
              const catType = (cat.type || "").trim().toUpperCase();

              
              return (
                catType === typeToFilter ||
                (typeToFilter === "HARDWARE" && !catType)
              );
            });
          }

          setCategories(filteredCategories);
        } else {
          toast.error("Failed to fetch categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to fetch categories");
      }
    },
    [axiosInstance, isEditMode, formData.type],
  );

  const fetchAttributes = useCallback(async () => {
    try {
      const response = await getAllAttributes(axiosInstance);
      if (response.success) {
        const attributes = (response.data || response.hashSet) as Attribute[];
        setAllAttributes(attributes);
      }
    } catch (error) {
      console.error("Error fetching attributes:", error);
    }
  }, [axiosInstance]);

  const uomOptions = [
    { value: "pcs", label: "Pieces" },
    { value: "kg", label: "Kilograms" },
    { value: "m", label: "Meters" },
    { value: "sqm", label: "Square Meters" },
    { value: "l", label: "Liters" },
  ];

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "category") {
        const selectedCategory = categories.find(
          (cat: any) => cat.name === value,
        );
        if (selectedCategory) {
          const subs = Array.isArray(selectedCategory.subCategory) ? selectedCategory.subCategory : [];
          setSubcategoryOptions(subs);
          updated.subcategory = subs.length > 0 ? subs[0] : "";
          
          
          const relevantAttributes = allAttributes.filter(attr => 
            attr.attributeGroup === value || 
            (attr.active && attr.productType === updated.type && !attr.attributeGroup)
          );
          setFilteredAttributes(relevantAttributes);
        } else {
          setSubcategoryOptions([]);
          updated.subcategory = "";
        }
      }

      return updated;
    });
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    setUploadingImages(true);

    try {
      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.isValid) {
          toast.error(validation.error || "Invalid file");
          continue;
        }

        const uploadedFile = await uploadFile(file);

        setUploadedImages((prev) => [
          ...prev,
          {
            id: uploadedFile.id,
            url: uploadedFile.url,
            originalName: uploadedFile.originalName,
            displayName: uploadedFile.displayName,
          },
        ]);
      }

      toast.success(`${files.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload one or more images");
    } finally {
      setUploadingImages(false);
    }
  };

  const isFormComplete = !!(
    formData.type &&
    formData.category &&
    formData.name &&
    formData.description &&
    formData.bId &&
    formData.sku &&
    uploadedImages.length > 0
  );

  const handlePreview = () => {
    if (!isFormComplete) {
      toast(
        "Please fill all required fields and upload at least one image before previewing.",
        { icon: "ℹ️" },
      );
      return;
    }
    setPreviewLoading(true);
    setTimeout(() => {
      setShowPreview(true);
      setPreviewLoading(false);
    }, 800);
  };

  const removeImage = (imageId: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleSubmit = async () => {
    const requiredFields = [
      { key: "type", label: "Type" },
      { key: "category", label: "Category" },
      { key: "name", label: "Product Name" },
      { key: "description", label: "Description" },
      { key: "bId", label: "B-ID" },
      { key: "sku", label: "SKU" },
    ];

    const missingField = requiredFields.find(
      (field) => !formData[field.key as keyof ProductFormData],
    );

    if (missingField) {
      toast.error(`Please fill in the ${missingField.label}`);
      return;
    }

    if (uploadedImages.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    try {
      setLoading(true);

      const imageUrls = uploadedImages.map((img) => img.url);

      const submitData: any = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        bId: formData.bId,
        sku: formData.sku,
        material: formData.material,
        size: formData.size,
        color: formData.color,
        uom: formData.uom,
        images: imageUrls,
      };

      if (isEditMode && product) {
        await updateProduct(axiosInstance, product.id, submitData);
        toast.success("Product updated successfully");
      } else {
        await createProductAdmin(axiosInstance, submitData);
        toast.success("Product created successfully");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(
        error.response?.data?.message ||
          (isEditMode
            ? "Failed to update product"
            : "Failed to create product"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!formData.name) {
      toast.error("Please enter at least a product name to save a draft.");
      return;
    }

    try {
      setLoading(true);

      const imageUrls = uploadedImages.map((img) => img.url);

      const submitData: any = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        bId: formData.bId,
        sku: formData.sku,
        material: formData.material,
        size: formData.size,
        color: formData.color,
        uom: formData.uom,
        images: imageUrls,
        status: "DRAFT", 
      };

      await createProductAdmin(axiosInstance, submitData);
      toast.success("Product saved as draft.");
      onSuccess();
    } catch (error: any) {
      console.error("Error saving draft:", error);
      toast.error(error.response?.data?.message || "Failed to save draft.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchAttributes();
  }, []);

  useEffect(() => {
    if (!isEditMode && !formData.bId) {
      setFormData((prev) => ({
        ...prev,
        bId: generateBID(),
      }));
    }
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode && formData.type) {
      fetchCategories(formData.type);
    }
  }, [formData.type, isEditMode]);

  useEffect(() => {
    if (formData.category && allAttributes.length > 0) {
      const relevantAttributes = allAttributes.filter(attr => 
        attr.attributeGroup === formData.category || 
        (attr.active && attr.productType === formData.type && !attr.attributeGroup)
      );
      setFilteredAttributes(relevantAttributes);
    }
  }, [formData.category, allAttributes, formData.type]);

  useEffect(() => {
    if (isEditMode && product?.category && categories.length > 0) {
      const categoryExists = categories.some(
        (cat) => cat.name === product.category,
      );
      if (!categoryExists && formData.category !== product.category) {
        setFormData((prev) => ({
          ...prev,
          category: product.category,
        }));
      }

      
      const selected = categories.find(c => c.name === (product.category || formData.category));
      if (selected && Array.isArray(selected.subCategory)) {
        setSubcategoryOptions(selected.subCategory);
      }
    }
  }, [categories, isEditMode, product]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditMode ? "Edit Product" : "Add Product"}
        </h1>
      </div>

      <div className="space-y-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="type" className="font-semibold">
                Type*
              </Label>
              <Select
                disabled={isEditMode || !!initialType}
                value={formData.type}
                onValueChange={(value) => handleInputChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {typeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="font-semibold">
                Category*
              </Label>
              <Select
                value={formData.category || ""}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {isEditMode &&
                    formData.category &&
                    !categories.some(
                      (cat) => cat.name === formData.category,
                    ) && (
                      <SelectItem value={formData.category}>
                        {formData.category}
                      </SelectItem>
                    )}
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="font-semibold">
                Product Name*
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter product name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory" className="font-semibold">
                Sub Category
              </Label>
              <Select
                value={formData.subcategory || ""}
                onValueChange={(value) => handleInputChange("subcategory", value)}
                disabled={subcategoryOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={subcategoryOptions.length > 0 ? "Select a sub-category" : "No sub-categories"} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {subcategoryOptions.map((sub, index) => (
                    <SelectItem key={`${sub}-${index}`} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-semibold">
              Product Description*
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Write product description here..."
              rows={4}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label className="font-semibold">Product Attributes</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bId" className="text-sm">
                B-ID (Auto)*
              </Label>
              <Input
                id="bId"
                value={formData.bId}
                readOnly
                className="bg-gray-100 text-gray-500 cursor-not-allowed"
                placeholder="Auto-generated"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku" className="text-sm">
                SKU*
              </Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange("sku", e.target.value)}
                placeholder="Enter SKU"
              />
            </div>

            {/* Dynamic Attributes */}
            {filteredAttributes.map((attr) => {
              const fieldName = attr.type.toLowerCase() as keyof ProductFormData;
              const hasValues = attr.values && attr.values.trim().length > 0;
              const options = hasValues ? attr.values.split(",").map(v => v.trim()) : [];
              const isSelect = attr.attributeType === 'select' || attr.attributeType === 'multiselect' || hasValues;

              return (
                <div key={attr.id} className="space-y-2">
                  <Label htmlFor={`attr-${attr.id}`} className="text-sm">
                    {attr.type}
                  </Label>
                  {isSelect ? (
                    <Select
                      value={(formData[fieldName] as string) || ""}
                      onValueChange={(val) => handleInputChange(fieldName, val)}
                    >
                      <SelectTrigger id={`attr-${attr.id}`}>
                        <SelectValue placeholder={`Select ${attr.type}`} />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {options.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : attr.attributeType === 'textarea' ? (
                    <Textarea 
                      id={`attr-${attr.id}`}
                      value={(formData[fieldName] as string) || ""}
                      onChange={(e) => handleInputChange(fieldName, e.target.value)}
                      placeholder={`Enter ${attr.type}`}
                      className="min-h-[80px]"
                    />
                  ) : (
                    <Input
                      id={`attr-${attr.id}`}
                      value={(formData[fieldName] as string) || ""}
                      onChange={(e) => handleInputChange(fieldName, e.target.value)}
                      placeholder={`Enter ${attr.type}`}
                    />
                  )}
                </div>
              );
            })}

            {/* Fallback for core fields if not in dynamic attributes */}
            {!filteredAttributes.some(a => a.type.toLowerCase() === 'material') && (
              <div className="space-y-2">
                <Label htmlFor="material" className="text-sm">Material</Label>
                <Input
                  id="material"
                  value={formData.material}
                  onChange={(e) => handleInputChange("material", e.target.value)}
                  placeholder="Enter material"
                />
              </div>
            )}
            
            {!filteredAttributes.some(a => a.type.toLowerCase() === 'size') && (
              <div className="space-y-2">
                <Label htmlFor="size" className="text-sm">Size</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) => handleInputChange("size", e.target.value)}
                  placeholder="Enter size"
                />
              </div>
            )}

            {!filteredAttributes.some(a => a.type.toLowerCase() === 'color') && (
              <div className="space-y-2">
                <Label htmlFor="color" className="text-sm">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange("color", e.target.value)}
                  placeholder="Enter color"
                />
              </div>
            )}

            {!filteredAttributes.some(a => a.type.toLowerCase() === 'uom') && (
              <div className="space-y-2">
                <Label htmlFor="uom" className="text-sm">UOM</Label>
                <Select
                  value={formData.uom}
                  onValueChange={(val) => handleInputChange("uom", val)}
                >
                  <SelectTrigger id="uom">
                    <SelectValue placeholder="Select UOM" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {uomOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="font-semibold">
            Media Upload (Upload in the manner: Front, Back, Side Elevations)*
          </Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-500">
                        {uploadingImages ? "Uploading..." : "Click to upload"}
                      </span>
                      <span className="text-gray-500"> or drag and drop</span>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImages}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG, GIF up to 10MB each
                  </p>
                </div>
              </div>
            </div>

            {uploadedImages.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Uploaded Images:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {uploadedImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="w-full h-24 border rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={image.url}
                          alt={image.displayName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removeImage(image.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {image.displayName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-6">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={loading || uploadingImages || previewLoading}
            style={{
              backgroundColor: "#f3f4f6",
              color: "#00007A",
              borderColor: "#00007A",
            }}
          >
            {previewLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Previewing...
              </>
            ) : (
              "Preview"
            )}
          </Button>
          {!isEditMode && (
            <Button
              variant="outline"
              onClick={handleSaveChanges}
              disabled={loading || uploadingImages || previewLoading}
              style={{
                backgroundColor: "#f3f4f6",
                color: "#00007A",
                borderColor: "#00007A",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save as Draft"
              )}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={loading || uploadingImages || previewLoading}
            style={{ backgroundColor: "#00007A", color: "white" }}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Submitting..."}
              </>
            ) : isEditMode ? (
              "Update"
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </div>

      {showPreview && (
        <ProductPreviewModal
          formData={formData}
          uploadedImages={uploadedImages}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
