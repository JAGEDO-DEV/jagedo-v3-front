/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Camera, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createProductAdmin, updateProduct } from '@/api/products.api';
import useAxiosWithAuth from '@/utils/axiosInterceptor';
import { uploadFile, validateFile } from '@/utils/fileUpload';
import {
  getAllCategories,
} from "@/api/categories.api";

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

export default function AddProductForm({ onBack, onSuccess, product, isEditMode = false, initialType }: AddProductFormProps) {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    description: product?.description || '',
    type: product?.type || initialType || '',
    category: product?.category || '',
    subcategory: product?.subcategory || '',
    bId: product?.bId || '',
    sku: product?.sku || '',
    material: product?.material || '',
    size: product?.size || '',
    color: product?.color || '',
    uom: product?.uom || '',
    images: product?.images || []
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(
    product?.images?.map((url: string, index: number) => ({
      id: `existing-${index}`,
      url,
      originalName: `Image ${index + 1}`,
      displayName: `Image ${index + 1}`
    })) || []
  );

  const typeOptions = [
    { value: 'HARDWARE', label: 'Hardware' },
    { value: 'FUNDI', label: 'Fundi' },
    { value: 'PROFESSIONAL', label: 'Professional' },
    { value: 'CONTRACTOR', label: 'Contractor' }
  ];

  const generateBID = () => {
    const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BID-${timestamp}-${randomPart}`;
  };

  const fetchCategories = useCallback(async (type?: string) => {
    try {
      const response = await getAllCategories(axiosInstance);
      if (response.success) {
        const categoriesData = response.data || response.hashSet || [];

        let filteredCategories = categoriesData;
        const typeToFilter = (type || formData.type || "").trim().toUpperCase();

        if (typeToFilter && !isEditMode) {
          filteredCategories = categoriesData.filter((cat: any) => {
            const catType = (cat.type || "").trim().toUpperCase();

            // Match type, or include null types in HARDWARE tab as fallback
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
  }, [axiosInstance, isEditMode, formData.type]);

  const uomOptions = [
    { value: 'pcs', label: 'Pieces' },
    { value: 'kg', label: 'Kilograms' },
    { value: 'm', label: 'Meters' },
    { value: 'sqm', label: 'Square Meters' },
    { value: 'l', label: 'Liters' }
  ];

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      if (field === 'category') {
        const selectedCategory = categories.find((cat: any) => cat.name === value);
        if (selectedCategory) {
          updated.subcategory = selectedCategory.subCategory || '';
        }
      }

      return updated;
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    setUploadingImages(true);

    try {
      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.isValid) {
          toast.error(validation.error || 'Invalid file');
          continue;
        }

        const uploadedFile = await uploadFile(file);

        setUploadedImages(prev => [...prev, {
          id: uploadedFile.id,
          url: uploadedFile.url,
          originalName: uploadedFile.originalName,
          displayName: uploadedFile.displayName
        }]);
      }

      toast.success(`${files.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload one or more images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSubmit = async () => {
    const requiredFields = [
      { key: 'type', label: 'Type' },
      { key: 'category', label: 'Category' },
      { key: 'name', label: 'Product Name' },
      { key: 'description', label: 'Description' },
      { key: 'bId', label: 'B-ID' },
      { key: 'sku', label: 'SKU' },
    ];

    const missingField = requiredFields.find(field => !formData[field.key as keyof ProductFormData]);

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

      const imageUrls = uploadedImages.map(img => img.url);

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
        images: imageUrls
      };

      if (isEditMode && product) {
        await updateProduct(axiosInstance, product.id, submitData);
        toast.success('Product updated successfully');
      } else {
        await createProductAdmin(axiosInstance, submitData);
        toast.success('Product created successfully');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || (isEditMode ? 'Failed to update product' : 'Failed to create product'));
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    toast?.info('Preview functionality coming soon');
  };

  const handleSaveChanges = () => {
    toast?.info('Save as draft functionality coming soon');
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!isEditMode && !formData.bId) {
      setFormData(prev => ({
        ...prev,
        bId: generateBID()
      }));
    }
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode && formData.type) {
      fetchCategories(formData.type);
    }
  }, [formData.type, isEditMode]);

  useEffect(() => {
    if (isEditMode && product?.category && categories.length > 0) {
      const categoryExists = categories.some(cat => cat.name === product.category);
      if (!categoryExists && formData.category !== product.category) {
        setFormData(prev => ({
          ...prev,
          category: product.category
        }));
      }
    }
  }, [categories, isEditMode, product]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">{isEditMode ? 'Edit Product' : 'Add Product'}</h1>
      </div>

      <div className="space-y-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="type" className="font-semibold">Type*</Label>
              <Select disabled={isEditMode || !!initialType} value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  {typeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="font-semibold">Category*</Label>
              <Select value={formData.category || ""} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  {isEditMode && formData.category && !categories.some(cat => cat.name === formData.category) && (
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
              <Label htmlFor="name" className="font-semibold">Product Name*</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter product name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-semibold">Product Description*</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Write product description here..."
              rows={4}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label className="font-semibold">Product Attributes</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bId" className="text-sm">B-ID (Auto)*</Label>
              <Input
                id="bId"
                value={formData.bId}
                readOnly
                className="bg-gray-100 text-gray-500 cursor-not-allowed"
                placeholder="Auto-generated"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku" className="text-sm">SKU*</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="Enter SKU"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="material" className="text-sm">Material</Label>
              <Input
                id="material"
                value={formData.material}
                onChange={(e) => handleInputChange('material', e.target.value)}
                placeholder="Enter material"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size" className="text-sm">Size</Label>
              <Input
                id="size"
                value={formData.size}
                onChange={(e) => handleInputChange('size', e.target.value)}
                placeholder="Enter size"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color" className="text-sm">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                placeholder="Enter color"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uom" className="text-sm">UOM</Label>
              <Select value={formData.uom} onValueChange={(value) => handleInputChange('uom', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select UOM" />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  {uomOptions.map((uom) => (
                    <SelectItem key={uom.value} value={uom.value}>
                      {uom.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                        {uploadingImages ? 'Uploading...' : 'Click to upload'}
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
                      <p className="text-xs text-gray-600 mt-1 truncate">{image.displayName}</p>
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
            disabled={loading || uploadingImages}
            style={{ backgroundColor: '#f3f4f6', color: '#00007A', borderColor: '#00007A' }}
          >
            Preview
          </Button>
          {!isEditMode && (
            <Button
              variant="outline"
              onClick={handleSaveChanges}
              disabled={loading || uploadingImages}
              style={{ backgroundColor: '#f3f4f6', color: '#00007A', borderColor: '#00007A' }}
            >
              Save Changes
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={loading || uploadingImages}
            style={{ backgroundColor: '#00007A', color: "white" }}
          >
            {loading ? 'Submitting...' : (isEditMode ? 'Update' : 'Submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}