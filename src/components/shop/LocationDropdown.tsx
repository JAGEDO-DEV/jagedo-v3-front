/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getAllRegions } from "@/api/regions.api";
import axios from "axios";

const publicAxios = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL
});


interface Region {
  id: number;
  country: string;
  name: string;
  code: string;
  type: string;
  active: boolean;
  customerView: boolean;
  filterable: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: null | any;
  status: string;
  hashSet: Region[];
}

interface LocationDropdownProps {
  selectedLocationName: string | null;
  onSelectLocation: (name: string | null) => void;
  categoryTypes?: string[];
}

const locationDescriptions: { [key: string]: string } = {
  Nairobi: "The following are areas associated with the Nairobi Metropolitan area.",
  Western: "This region covers the counties of Kakamega, Vihiga, Bungoma, and Busia.",
  "Rift Valley": "This region encompasses the vast Kenyan Rift Valley, including major towns like Nakuru and Eldoret.",
  Coast: "The Coast region includes Mombasa, Kilifi, Kwale, and other coastal areas.",
  Central: "Central region covers the highlands of Kenya, including Nyeri, Murang'a, and Kiambu.",
};

const LocationDropdown = ({ selectedLocationName, onSelectLocation, categoryTypes = [] }: LocationDropdownProps) => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        setIsLoading(true);
        const response: ApiResponse = await getAllRegions(publicAxios);

        if (response && response.success && response.hashSet?.length > 0) {
          const activeRegions = response.hashSet.filter(region => region.active && region.customerView);
          setRegions(activeRegions);
          setError(null);
        } else {
          setError(response.message || "No locations found.");
        }
      } catch (err) {
        console.error("Failed to fetch regions:", err);
        setError("Could not load locations. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegions();
  }, []);

  const filteredRegions = useMemo(() => {
    if (!categoryTypes.length) {
      return regions;
    }
    return regions.filter(region => categoryTypes.includes(region.type));
  }, [regions, categoryTypes]);

  useEffect(() => {
    if (!selectedLocationName) return;
    const hasSelected = filteredRegions.some(region => region.name === selectedLocationName);
    if (!hasSelected) {
      onSelectLocation(null);
    }
  }, [filteredRegions, selectedLocationName, onSelectLocation]);

  const handleSelectChange = (name: string) => onSelectLocation(name);

  const selectedRegion = filteredRegions.find(region => region.name === selectedLocationName);

  if (isLoading) {
    return <div>Loading locations...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!filteredRegions.length) {
    return <div className="text-muted-foreground p-4">No locations available for this category.</div>;
  }

  return (
    <div className="bg-white border-none flex justify-center items-center">
      <div className="container mx-auto flex justify-center">
        <div className="p-4">
          <div className="block space-y-3 text-center">
            <Select
              value={selectedLocationName || ""}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {/* REMOVED: The "All Regions" SelectItem is gone */}
                {filteredRegions.map((region) => (
                  <SelectItem key={region.id} value={region.name}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRegion && (
              <div className="bg-gray-100 p-3 rounded-lg text-sm text-gray-700 shadow-sm max-w-72 mx-auto">
                {locationDescriptions[selectedRegion.name] ||
                  `Details for the ${selectedRegion.name} region.`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDropdown;
