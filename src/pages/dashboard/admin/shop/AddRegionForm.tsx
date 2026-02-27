/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
//@ts-nocheck
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { createRegion, RegionCreateRequest, getAllRegions } from '@/api/regions.api';
import useAxiosWithAuth from '@/utils/axiosInterceptor';
import { kenyanRegions, getCountiesForRegion } from '@/data/kenyanRegions';

interface AddRegionFormProps {
  onBack: () => void;
  onSuccess: () => void;
  predefinedType?: string;
}

export default function AddRegionForm({ onBack, onSuccess, predefinedType }: AddRegionFormProps) {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [loading, setLoading] = useState(false);
  const [existingRegions, setExistingRegions] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCounty, setSelectedCounty] = useState('');

  const [formData, setFormData] = useState<RegionCreateRequest>({
    country: 'Kenya',
    name: '',
    type: predefinedType || 'HARDWARE',
    counties: '',
    active: true,
    customerView: false,
    filterable: false
  });


  useEffect(() => {
    const fetchExistingRegions = async () => {
      try {
        const response = await getAllRegions(axiosInstance);
        if (response.success && Array.isArray(response.hashSet)) {
          setExistingRegions(response.hashSet);
        }
      } catch (error) {
        console.error('Failed to fetch existing regions for validation', error);
      }
    };
    fetchExistingRegions();
  }, []);


  const availableCounties = useMemo(() => {
    return selectedRegion ? getCountiesForRegion(selectedRegion) : [];
  }, [selectedRegion]);


  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region);
    setFormData({ ...formData, name: region });
  };


  const handleCountySelect = (county: string) => {
    setSelectedCounty(county);
    if (county && county !== selectedRegion) {
      setFormData({ ...formData, name: `${selectedRegion} - ${county}`, counties: county });
    } else {
      setFormData({ ...formData, name: selectedRegion, counties: '' });
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Region name is required');
      return;
    }


    const isDuplicate = existingRegions.some((region) => {

      const existingName = region.name?.toLowerCase().trim();
      const newName = formData.name.toLowerCase().trim();



      return existingName === newName && region.type === formData.type;
    });

    if (isDuplicate) {
      toast.error(`A region with the name "${formData.name}" and type "${formData.type}" already exists.`);
      return;
    }


    try {
      setLoading(true);

      const response = await createRegion(axiosInstance, formData);

      if (response.success) {
        toast.success('Region created successfully');
        onSuccess();
      } else {
        toast.error(response.message || 'Failed to create region');
      }
    } catch (error) {
      console.error('Error creating region:', error);
      toast.error('Failed to create region');
    } finally {
      setLoading(false);
    }
  };


  const handleDiscard = () => {
    onBack();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <h1 className="text-3xl font-bold tracking-tight">Create a new region</h1>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Section */}
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>
                Basic region information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Enter country name"
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Select Region</Label>
                <Select value={selectedRegion} onValueChange={handleRegionSelect}>
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent>
                    {kenyanRegions.map((r) => (
                      <SelectItem key={r.region} value={r.region}>
                        {r.region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedRegion && (
                <div className="space-y-2">
                  <Label htmlFor="county">Select County (Optional)</Label>
                  <Select onValueChange={handleCountySelect}>
                    <SelectTrigger id="county">
                      <SelectValue placeholder="Select a county" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCounties.map((county) => (
                        <SelectItem key={county} value={county}>
                          {county}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Region Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter or modify region name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type || 'HARDWARE'}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                  disabled={!!predefinedType}
                >
                  <SelectTrigger id="type" className={predefinedType ? "bg-gray-100 cursor-not-allowed" : ""}>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HARDWARE">Hardware</SelectItem>
                    <SelectItem value="FUNDI">Custom Products</SelectItem>
                    <SelectItem value="PROFESSIONAL">Designs</SelectItem>
                    <SelectItem value="CONTRACTOR">Hire Machinery & E</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Region configuration options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Is Filterable?</Label>
                <RadioGroup
                  value={formData.filterable ? "yes" : "no"}
                  onValueChange={(value) => setFormData({ ...formData, filterable: value === "yes" })}
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

              <div className="space-y-3">
                <Label>Show to customers?</Label>
                <RadioGroup
                  value={formData.customerView ? "yes" : "no"}
                  onValueChange={(value) => setFormData({ ...formData, customerView: value === "yes" })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="customer-view-no" />
                    <Label htmlFor="customer-view-no">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="customer-view-yes" />
                    <Label htmlFor="customer-view-yes">Yes</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
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
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}