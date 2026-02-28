import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { createAttribute, AttributeCreateRequest, getAllAttributes } from '@/api/attributes.api';
import { getAllCategories } from '@/api/categories.api';
import useAxiosWithAuth from '@/utils/axiosInterceptor';

interface AddAttributeFormProps {
  onBack: () => void;
  onSuccess: () => void;
  defaultProductType: string;
}

export default function AddAttributeForm({ onBack, onSuccess, defaultProductType }: AddAttributeFormProps) {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [loading, setLoading] = useState(false);
  const [existingAttributes, setExistingAttributes] = useState<any[]>([]);
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState<AttributeCreateRequest>({
    type: '',
    productType: defaultProductType,
    values: '',
    attributeGroup: '',
    categoryId: '',
    filterable: false,
    active: true,
    customerView: false
  });
  const [attributeType, setAttributeType] = useState('text');
  const [attributeValues, setAttributeValues] = useState<string[]>([]);
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attributesResponse, categoriesResponse] = await Promise.all([
          getAllAttributes(axiosInstance),
          getAllCategories(axiosInstance)
        ]);

        if (attributesResponse.success) {
          const attributes = attributesResponse.data || attributesResponse.hashSet;
          if (Array.isArray(attributes)) {
            setExistingAttributes(attributes);
          }
        }

        if (categoriesResponse.success) {
          const categories = categoriesResponse.data || categoriesResponse.hashSet;
          if (Array.isArray(categories)) {
            const defaultTypeUpper = (defaultProductType || "").trim().toUpperCase();

            const filteredCategories = categories
              .filter((cat: any) => {
                // Only include active categories
                if (!cat.active) return false;

                const catType = (cat.type || "").trim().toUpperCase();

                // Match type, or include null types in HARDWARE tab as fallback
                return (
                  catType === defaultTypeUpper ||
                  (defaultTypeUpper === "HARDWARE" && !catType)
                );
              });

            setAvailableCategories(filteredCategories);
          }
        }

      } catch (error) {
        console.error('Failed to fetch data for validation and options', error);
      }
    };
    fetchData();
  }, [defaultProductType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type.trim()) {
      toast.error('Attribute name is required');
      return;
    }

    if (attributeType === 'select' || attributeType === 'multiselect') {
      if (attributeValues.length === 0) {
        toast.error('At least one attribute value is required for select/multiselect types');
        return;
      }
    }

    const isDuplicate = existingAttributes.some((attr) => {
      const existingName = (attr.type || "").trim().toLowerCase();
      const newName = formData.type.trim().toLowerCase();

      return existingName === newName && attr.productType === formData.productType;
    });

    if (isDuplicate) {
      toast.error(`An attribute with the name "${formData.type}" already exists for ${formData.productType}.`);
      return;
    }

    try {
      setLoading(true);

      const submitData: AttributeCreateRequest = {
        ...formData,
        values: attributeValues.join(',')
      };

      const response = await createAttribute(axiosInstance, submitData);

      if (response.success) {
        toast.success('Attribute created successfully');
        onSuccess();
      } else {
        toast.error(response.message || 'Failed to create attribute');
      }
    } catch (error) {
      console.error('Error creating attribute:', error);
      toast.error('Failed to create attribute');
    } finally {
      setLoading(false);
    }
  };

  const handleAddValue = () => {
    if (newValue.trim() && !attributeValues.includes(newValue.trim())) {
      setAttributeValues([...attributeValues, newValue.trim()]);
      setNewValue('');
    }
  };

  const handleRemoveValue = (index: number) => {
    setAttributeValues(attributeValues.filter((_, i) => i !== index));
  };

  const handleDiscard = () => {
    onBack();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDiscard}
          className="p-0 h-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create a new attribute</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>
                Basic attribute information and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter attribute name"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <RadioGroup
                  value={attributeType}
                  onValueChange={setAttributeType}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="text" id="text" />
                    <Label htmlFor="text">Text</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="select" id="select" />
                    <Label htmlFor="select">Select</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="multiselect" id="multiselect" />
                    <Label htmlFor="multiselect">Multiselect</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="textarea" id="textarea" />
                    <Label htmlFor="textarea">Textarea</Label>
                  </div>
                </RadioGroup>
              </div>

              {(attributeType === 'select' || attributeType === 'multiselect') && (
                <div className="space-y-2">
                  <Label>Values</Label>

                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter new value (e.g., Red, Small, Cotton)"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddValue())}
                    />
                    <Button
                      type="button"
                      onClick={handleAddValue}
                      disabled={!newValue.trim()}
                      style={{ backgroundColor: "#00007A", color: "white" }}
                    >
                      Add
                    </Button>
                  </div>

                  {attributeValues.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <Label className="text-xs text-gray-500">Added Values:</Label>
                      <div className="flex flex-wrap gap-2 border p-2 rounded-md bg-gray-50 min-h-[40px]">
                        {attributeValues.map((value, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-1 bg-white border border-gray-200 px-2 py-1 rounded-md shadow-sm"
                          >
                            <span className="text-sm font-medium">{value}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveValue(index)}
                              className="h-4 w-4 p-0 text-gray-500 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="attributeGroup">Attribute Group (Category)</Label>
                <Select
                  value={formData.categoryId?.toString()}
                  onValueChange={(value) => {
                    const selectedCat = availableCategories.find(c => c.id.toString() === value);
                    setFormData({
                      ...formData,
                      categoryId: value,
                      attributeGroup: selectedCat ? selectedCat.name : ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    {availableCategories.length > 0 ? (
                      availableCategories.map((cat) => (
                        <SelectItem key={cat.id.toString()} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500 text-center">
                        No active categories found for {defaultProductType}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Setting</CardTitle>
              <CardDescription>
                Configure attribute behavior and visibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Is Filterable?</Label>
                <RadioGroup
                  value={formData.filterable ? 'yes' : 'no'}
                  onValueChange={(value) => setFormData({ ...formData, filterable: value === 'yes' })}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="filterable-no" />
                    <Label htmlFor="filterable-no">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="filterable-yes" />
                    <Label htmlFor="filterable-yes">Yes</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Show to customers?</Label>
                <RadioGroup
                  value={formData.customerView ? 'yes' : 'no'}
                  onValueChange={(value) => setFormData({ ...formData, customerView: value === 'yes' })}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="customer-no" />
                    <Label htmlFor="customer-no">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="customer-yes" />
                    <Label htmlFor="customer-yes">Yes</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={handleDiscard}
            className="border-red-500 text-red-500 hover:bg-red-50"
          >
            Discard
          </Button>
          <Button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: "#00007A", color: "white" }}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  );
}