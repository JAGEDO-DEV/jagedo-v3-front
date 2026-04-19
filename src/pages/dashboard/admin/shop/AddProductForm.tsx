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
import { ArrowLeft, Camera, Loader2, Upload, X, Check, ChevronsUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { createProductAdmin, updateProduct } from "@/api/products.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { uploadFile, validateFile } from "@/utils/fileUpload";
import { getAllGroups } from "@/api/groups.api";
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
  group: string;
  subGroup: string;
  sku?: string;
  productCode?: string;
  images: string[];
  [key: string]: any; 
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
                {formData.group}
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
              {Object.entries(formData)
                .filter(([key, value]) => 
                  !['name', 'description', 'type', 'group', 'subGroup', 'images', 'active'].includes(key) && 
                  value && 
                  (typeof value === 'string' || Array.isArray(value))
                )
                .map(([key, value]) => (
                  <div key={key}>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "#9ca3af",
                        margin: 0,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p
                      style={{ fontSize: "13px", margin: 0, color: "#111827" }}
                    >
                      {Array.isArray(value) ? value.join(", ") : value}
                    </p>
                  </div>
                ))}
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

const normalizeText = (value?: string | null) =>
  (value || "").trim().toLowerCase();

const parseSubGroupEntry = (sub: any) => {
  if (typeof sub === "string") {
    const trimmed = sub.trim();
    if (!trimmed) return null;

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        return {
          name: (parsed.name || "").trim(),
          active: parsed.active ?? true,
        };
      }
    } catch {
      return { name: trimmed, active: true };
    }
  }

  if (sub && typeof sub === "object") {
    return {
      name: (sub.name || "").trim(),
      active: sub.active ?? true,
    };
  }

  return null;
};

const extractSubGroupNames = (group: any) => {
  if (!group) return [];

  if (Array.isArray(group.subGroup)) {
    return group.subGroup
      .map(parseSubGroupEntry)
      .filter((entry) => entry && entry.name && entry.active)
      .map((entry) => entry!.name);
  }

  if (typeof group.subGroup === "string") {
    return group.subGroup
      .split(",")
      .map((sub: string) => sub.trim())
      .filter(Boolean);
  }

  return [];
};

const mergeUniqueAttributes = (...attributeGroups: Attribute[][]) => {
  const seenTypes = new Set<string>();

  return attributeGroups.flat().filter((attribute) => {
    const attributeKey =
      normalizeText(attribute?.type) || String(attribute?.id || "");

    if (seenTypes.has(attributeKey)) {
      return false;
    }

    seenTypes.add(attributeKey);
    return true;
  });
};

const getRelevantAttributes = ({
  attributes,
  productType,
  group,
  subGroup,
}: {
  attributes: Attribute[];
  productType: string;
  group: string;
  subGroup: string;
}) => {
  const normalizedType = normalizeText(productType);
  const normalizedGroup = normalizeText(group);
  const normalizedSubGroup = normalizeText(subGroup);

  const activeTypeAttributes = attributes.filter(
    (attribute) =>
      attribute?.active &&
      attribute.group?.active &&
      normalizeText(attribute.group?.type) === normalizedType,
  );

  const globalAttributes = activeTypeAttributes.filter(
    (attribute) => !normalizeText(attribute.attributeGroup),
  );

  const subGroupAttributes = activeTypeAttributes.filter(
    (attribute) =>
      normalizeText(attribute.attributeGroup) === normalizedSubGroup,
  );

  if (normalizedSubGroup && subGroupAttributes.length > 0) {
    return mergeUniqueAttributes(subGroupAttributes, globalAttributes);
  }

  const groupAttributes = activeTypeAttributes.filter(
    (attribute) => normalizeText(attribute.attributeGroup) === normalizedGroup,
  );

  return mergeUniqueAttributes(groupAttributes, globalAttributes);
};


const generateProductCode = () => {
  const segment1 = Math.random().toString(36).substring(2, 8).toUpperCase();
  const segment2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BID-${segment1}-${segment2}`;
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
    type: product?.type || initialType || "HARDWARE",
    group: product?.group || "",
    subGroup: product?.subGroup || "",
    sku: product?.sku || "",
    productCode: product?.productCode || generateProductCode(),
    images: product?.images || [],
  });

  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [allAttributes, setAllAttributes] = useState<Attribute[]>([]);
  const [filteredAttributes, setFilteredAttributes] = useState<Attribute[]>([]);
  const [subGroupOptions, setSubGroupOptions] = useState<string[]>([]);
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



  const fetchGroups = useCallback(
    async (type?: string) => {
      try {
        const response = await getAllGroups(axiosInstance);
        if (response.success) {
          const groupsData = response.data || response.hashSet || [];

          let filteredGroups = groupsData.filter((g: any) => g.active);
          const typeToFilter = (type || formData.type || "")
            .trim()
            .toUpperCase();

          if (typeToFilter && !isEditMode) {
            filteredGroups = filteredGroups.filter((cat: any) => {
              const catType = (cat.type || "").trim().toUpperCase();

              
              return (
                catType === typeToFilter ||
                (typeToFilter === "HARDWARE" && !catType)
              );
            });
          }

          console.log("📥 Groups fetched for product form:", {
            totalCount: filteredGroups.length,
            groups: filteredGroups.map(c => ({
              name: c.name,
              type: c.type,
              subGroupCount: Array.isArray(c.subGroup) ? c.subGroup.length : 0,
              subGroups: Array.isArray(c.subGroup) 
                ? c.subGroup.map(s => typeof s === "string" ? s : s?.name)
                : [],
            })),
          });

          setGroups(filteredGroups);
        } else {
          toast.error("Failed to fetch groups");
        }
      } catch (error) {
        console.error("Error fetching groups:", error);
        toast.error("Failed to fetch groups");
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


  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "group") {
        const selectedGroup = groups.find(
          (cat: any) => cat.name === value,
        );
        if (selectedGroup) {
          const subs = extractSubGroupNames(selectedGroup);
          
          setSubGroupOptions(subs);
          updated.subGroup = subs.includes(updated.subGroup)
            ? updated.subGroup
            : subs[0] || "";
          
          console.log("📦 Sub Groups loaded for group:", {
            group: value,
            subGroupCount: subs.length,
            options: subs,
          });
          
        } else {
          setSubGroupOptions([]);
          updated.subGroup = "";
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
    let successCount = 0;

    try {
      for (const file of files) {
        
        const validation = validateFile(file);
        if (!validation.isValid) {
          toast.error(`${file.name}: ${validation.error || "Invalid file"}`, {
            duration: 4000, 
          });
          continue;
        }

        try {
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
          successCount++;
        } catch (uploadError: any) {
          console.error(`Error uploading ${file.name}:`, uploadError);
          toast.error(`${file.name}: ${uploadError.message || "Failed to upload"}`);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} image(s) uploaded successfully`);
      }
    } catch (error: any) {
      console.error("Error in upload process:", error);
      toast.error(error.message || "An unexpected error occurred during upload");
    } finally {
      setUploadingImages(false);
      
      if (event.target) event.target.value = "";
    }
  };

  const isFormComplete = !!(
    formData.type &&
    formData.group &&
    formData.name &&
    formData.description &&
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
      { key: "group", label: "Group" },
      { key: "name", label: "Product Name" },
      { key: "description", label: "Description" },
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

      const coreFields = ['name', 'description', 'type', 'group', 'subGroup', 'sku', 'productCode', 'images'];
      const submitData: any = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        group: formData.group,
        subGroup: formData.subGroup,
        sku: formData.sku,
        productCode: formData.productCode,
        images: imageUrls,
      };

      
      const specs: any = {};
      filteredAttributes.forEach(attr => {
        const fieldName = attr.type.toLowerCase();
        if (!coreFields.includes(fieldName) && formData[fieldName] !== undefined) {
          specs[fieldName] = formData[fieldName];
        }
      });
      
      if (Object.keys(specs).length > 0) {
        submitData.specs = specs;
      }

      console.log("📤 Product submission data:", {
        name: submitData.name,
        type: submitData.type,
        group: submitData.group,
        subGroup: submitData.subGroup,
        sku: submitData.sku,
        imagesCount: imageUrls.length,
        specsCount: Object.keys(specs).length
      });

      if (isEditMode && product) {
        await updateProduct(axiosInstance, product.id, submitData);
        console.log("✅ Product updated successfully");
        toast.success("Product updated successfully");
      } else {
        await createProductAdmin(axiosInstance, submitData);
        console.log("✅ Product created successfully");
        toast.success("Product created successfully");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving product:", error);
      
      
      if (error.response?.status === 409 && error.response?.data?.message?.toLowerCase().includes("product code")) {
        toast.error("Product code already exists. Auto-generating a new one and retrying...");
        const newCode = generateProductCode();
        setFormData(prev => ({ ...prev, productCode: newCode }));
        return; 
      }

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

      const coreFields = ['name', 'description', 'type', 'group', 'subGroup', 'sku', 'productCode', 'images'];
      const submitData: any = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        group: formData.group,
        subGroup: formData.subGroup,
        sku: formData.sku,
        productCode: formData.productCode,
        status: "DRAFT",
        images: imageUrls,
      };

      
      const specs: any = {};
      filteredAttributes.forEach(attr => {
        const fieldName = attr.type.toLowerCase();
        if (!coreFields.includes(fieldName) && formData[fieldName] !== undefined) {
          specs[fieldName] = formData[fieldName];
        }
      });
      
      if (Object.keys(specs).length > 0) {
        submitData.specs = specs;
      }

      console.log("📋 Saving product as draft:", {
        name: submitData.name,
        group: submitData.group,
        subGroup: submitData.subGroup,
        status: submitData.status,
        specsCount: Object.keys(specs).length
      });

      await createProductAdmin(axiosInstance, submitData);
      console.log("✅ Product saved as draft successfully");
      toast.success("Product saved as draft.");
      onSuccess();
    } catch (error: any) {
      console.error("Error saving draft:", error);
      
      if (error.response?.status === 409 && error.response?.data?.message?.toLowerCase().includes("product code")) {
        toast.error("Product code already exists. Auto-generating a new one. Please save again.");
        const newCode = generateProductCode();
        setFormData(prev => ({ ...prev, productCode: newCode }));
        return;
      }

      toast.error(error.response?.data?.message || "Failed to save draft.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchAttributes();
    
    if (isEditMode && product) {
      console.log("📥 Loading product for edit:", {
        productId: product.id,
        productName: product.name,
        type: product.type,
        group: product.group,
        subGroup: product.subGroup,
      });

      
      if (product.product_specifications?.specs) {
        setFormData(prev => ({
          ...prev,
          ...product.product_specifications.specs
        }));
      }
    }
  }, []);

  useEffect(() => {
    if (!isEditMode && formData.type) {
      fetchGroups(formData.type);
    }
  }, [formData.type, isEditMode]);

  useEffect(() => {
    if (!formData.group || allAttributes.length === 0) {
      setFilteredAttributes([]);
      return;
    }

    setFilteredAttributes(
      getRelevantAttributes({
        attributes: allAttributes,
        productType: formData.type,
        group: formData.group,
        subGroup: formData.subGroup,
      }),
    );
  }, [formData.group, formData.subGroup, allAttributes, formData.type]);

  useEffect(() => {
    if (isEditMode && product?.group && groups.length > 0) {
      const groupExists = groups.some(
        (cat) => cat.name === product.group,
      );
      if (!groupExists && formData.group !== product.group) {
        setFormData((prev) => ({
          ...prev,
          group: product.group,
        }));
      }

      const selected = groups.find(c => c.name === (product.group || formData.group));
      if (selected) {
        const subs = extractSubGroupNames(selected);
        
        setSubGroupOptions(subs);
        
        console.log("📦 Sub Groups loaded for edit mode:", {
          group: product.group || formData.group,
          subGroupCount: subs.length,
          options: subs,
          currentSubGroup: product.subGroup,
        });
      }
    }
  }, [groups, isEditMode, product]);

  return (
    <div className="max-w-[1000px] mx-auto p-4 md:p-8 space-y-10">
      {/* Header */}
      <div className="flex items-center space-x-4 pb-2">
        <Button variant="ghost" onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100/50">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          {isEditMode ? "Edit Product" : "Add Product"}
          {formData.type && (
            <Badge className="bg-[#1f2937] text-white hover:bg-[#1f2937] px-3 py-1 text-xs rounded-md font-medium tracking-wide">
              {typeOptions.find(t => t.value === formData.type)?.label || formData.type}
            </Badge>
          )}
        </h1>
      </div>

      <div className="space-y-12">
        {/* Classification Section */}
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Classification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <Label htmlFor="group" className="text-sm font-semibold text-gray-700">
                Group <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.group || ""}
                onValueChange={(value) => handleInputChange("group", value)}
              >
                <SelectTrigger className="h-12 border-gray-200">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {isEditMode &&
                    formData.group &&
                    !groups.some((cat) => cat.name === formData.group) && (
                      <SelectItem value={formData.group}>
                        {formData.group}
                      </SelectItem>
                    )}
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.name}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subGroup" className="text-sm font-semibold text-gray-700">
                Subgroup <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.subGroup || ""}
                onValueChange={(value) => handleInputChange("subGroup", value)}
                disabled={subGroupOptions.length === 0}
              >
                <SelectTrigger className="h-12 border-gray-200">
                  <SelectValue placeholder={subGroupOptions.length > 0 ? "Select a group first" : "No sub-groups"} />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {subGroupOptions.map((sub, index) => (
                    <SelectItem key={`${sub}-${index}`} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Basic Information Section */}
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                Product Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter product name"
                className="h-12 border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku" className="text-sm font-semibold text-gray-700">
                SKU <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sku"
                value={formData.sku || ""}
                onChange={(e) => handleInputChange("sku", e.target.value)}
                placeholder="Enter SKU"
                className="h-12 border-gray-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="productCode" className="text-sm font-semibold text-gray-700">
                Product Code (Auto)
              </Label>
              <Input
                id="productCode"
                value={formData.productCode || ""}
                disabled
                placeholder="Auto-generating..."
                className="h-12 bg-gray-50 text-gray-500 cursor-not-allowed border-gray-100"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
              Product Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Write product description here..."
              rows={4}
              className="resize-none border-gray-200 p-4"
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label className="font-semibold">Product Attributes</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
            {/* Dynamic Attributes */}
            {filteredAttributes.map((attr) => {
              const fieldName = attr.type.toLowerCase() as keyof ProductFormData;
              const hasValues = attr.values && attr.values.trim().length > 0;
              const options = hasValues ? attr.values.split(",").map(v => v.trim()) : [];
              const isMultiSelect = attr.attributeType === 'multiselect';
              const isSelect = attr.attributeType === 'select' || (!attr.attributeType && hasValues);
              const isTextarea = attr.attributeType === 'textarea';

              const currentValue = formData[fieldName];
              let selectedOptions: string[] = [];
              if (isMultiSelect) {
                if (Array.isArray(currentValue)) {
                  selectedOptions = currentValue;
                } else if (typeof currentValue === 'string') {
                  selectedOptions = currentValue.split(',').filter(Boolean);
                }
              }

              return (
                <div key={attr.id} className={cn("space-y-1.5", isTextarea ? "col-span-full" : "")}>
                  <Label htmlFor={`attr-${attr.id}`} className="text-[13px] font-medium text-gray-600">
                    {attr.type}
                  </Label>
                  {isMultiSelect ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between h-11 px-3 py-2 text-left font-normal border-gray-200 rounded-lg bg-white hover:bg-gray-50",
                            !selectedOptions.length && "text-muted-foreground"
                          )}
                        >
                          <div className="flex flex-wrap gap-1 overflow-hidden">
                            {selectedOptions.length > 0 ? (
                              selectedOptions.slice(0, 2).map((opt) => (
                                <Badge
                                  key={opt}
                                  variant="secondary"
                                  className="h-6 text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-2"
                                >
                                  {opt}
                                  <X
                                    className="ml-1 h-3 w-3 cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInputChange(
                                        fieldName,
                                        selectedOptions.filter((o) => o !== opt)
                                      );
                                    }}
                                  />
                                </Badge>
                              ))
                            ) : (
                              <span className="text-gray-400">Select {attr.type}...</span>
                            )}
                            {selectedOptions.length > 2 && (
                              <span className="text-[11px] text-gray-500 font-medium">+{selectedOptions.length - 2} more</span>
                            )}
                          </div>
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[250px] p-1 bg-white shadow-xl border border-gray-200 rounded-xl" align="start">
                        <div className="max-h-[300px] overflow-y-auto p-1 space-y-0.5">
                          {options.map((opt) => (
                            <div
                              key={opt}
                              className={cn(
                                "flex items-center space-x-3 p-2.5 rounded-lg cursor-pointer transition-colors",
                                selectedOptions.includes(opt) ? "bg-blue-50/50" : "hover:bg-gray-50"
                              )}
                              onClick={() => {
                                const newOptions = selectedOptions.includes(opt)
                                  ? selectedOptions.filter((o) => o !== opt)
                                  : [...selectedOptions, opt];
                                handleInputChange(fieldName, newOptions);
                              }}
                            >
                              <Checkbox
                                checked={selectedOptions.includes(opt)}
                                onCheckedChange={() => {}} 
                                className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                              <span className={cn(
                                "text-sm",
                                selectedOptions.includes(opt) ? "font-semibold text-blue-700" : "text-gray-700"
                              )}>{opt}</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : isSelect ? (
                    <Select
                      value={(formData[fieldName] as string) || ""}
                      onValueChange={(val) => handleInputChange(fieldName, val)}
                    >
                      <SelectTrigger id={`attr-${attr.id}`} className="h-11 border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-blue-500">
                        <SelectValue placeholder={`Select ${attr.type}`} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 rounded-xl shadow-xl">
                        {options.map((opt) => (
                          <SelectItem key={opt} value={opt} className="rounded-lg my-0.5 focus:bg-blue-50 focus:text-blue-700">
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : isTextarea ? (
                    <Textarea 
                      id={`attr-${attr.id}`}
                      value={(formData[fieldName] as string) || ""}
                      onChange={(e) => handleInputChange(fieldName, e.target.value)}
                      placeholder={`Enter ${attr.type}`}
                      className="min-h-[100px] border-gray-200 rounded-xl bg-white focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <Input
                      id={`attr-${attr.id}`}
                      type={attr.attributeType === 'number' ? 'number' : attr.attributeType === 'date' ? 'date' : 'text'}
                      value={(formData[fieldName] as string) || ""}
                      onChange={(e) => handleInputChange(fieldName, e.target.value)}
                      placeholder={`Enter ${attr.type}`}
                      className={cn(
                        "h-11 border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 text-left px-4",
                        attr.attributeType === 'date' && "block w-full text-left [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-auto"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold">Media Upload<span className="text-red-500">*</span></h3>
            <p className="text-sm text-gray-500">Upload in the manner: Front, Back, Side Elevations</p>
          </div>
          
          <div className="border border-dashed border-gray-200 rounded-3xl p-8 space-y-10 bg-white/40 shadow-sm">
            {/* Elevation Slots */}
            <div className="grid grid-cols-3 gap-8">
              {[
                { label: "Front Elevation", id: "front" },
                { label: "Back Elevation", id: "back" },
                { label: "Side Elevation", id: "side" }
              ].map((slot, index) => (
                <div key={slot.id} className="space-y-3">
                  <p className="text-center text-sm font-semibold text-gray-500">{slot.label}</p>
                  <div 
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="relative aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#00007A]/40 hover:bg-[#00007A]/5 transition-all group overflow-hidden"
                  >
                    {uploadedImages[index] ? (
                      <>
                        <img 
                          src={uploadedImages[index].url} 
                          alt={slot.label}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(uploadedImages[index].id);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Camera className="h-8 w-8 text-gray-300 group-hover:text-[#00007A] transition-colors" />
                        <span className="mt-2 text-sm text-gray-400 group-hover:text-[#00007A] font-medium transition-colors">Upload</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Main Upload Handle */}
            <div className="flex flex-col items-center justify-center border-t border-gray-100 pt-8 mt-2">
               <div className="p-3 rounded-full bg-gray-50 mb-3 group-hover:bg-blue-50 transition-colors">
                 <Upload className="h-8 w-8 text-gray-400" />
               </div>
               <div className="text-center">
                 <label htmlFor="image-upload" className="cursor-pointer">
                   <span className="text-sm font-bold text-gray-800 hover:text-[#00007A] transition-colors">
                     {uploadingImages ? "Uploading..." : "Click to upload"}
                   </span>
                   <span className="text-sm text-gray-500 font-medium"> or drag and drop</span>
                 </label>
                 <div className="mt-2 space-y-0.5">
                   <p className="text-[11px] text-gray-400 font-medium">
                     Tip: click this box, then press Ctrl+V to paste an image
                   </p>
                   <p className="text-[11px] text-gray-400">
                     PNG, JPG, GIF up to 10MB each
                   </p>
                 </div>
               </div>
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
          </div>

          {/* Gallery View for extra images if count > 3 */}
          {uploadedImages.length > 3 && (
            <div className="space-y-3 pt-2">
               <h4 className="text-sm font-semibold text-gray-600 flex items-center">
                 Other product images ({uploadedImages.length - 3})
               </h4>
               <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                 {uploadedImages.slice(3).map((image) => (
                    <div key={image.id} className="relative group aspect-square rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
                      <img
                        src={image.url}
                        alt="product"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(image.id)}
                        className="absolute top-1 right-1 bg-red-500/90 text-white rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-all transform scale-90 hover:scale-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                 ))}
               </div>
            </div>
          )}
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
