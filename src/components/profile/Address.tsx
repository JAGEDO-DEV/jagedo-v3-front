/* eslint-disable */
//@ts-nocheck
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { updateAddress } from "@/api/provider.api";
import { counties } from "@/pages/data/counties";
import useAxiosWithAuth from "@/utils/axiosInterceptor";

// Accept data and refreshData props
const Address = ({ data, refreshData }) => {
  const [address, setAddress] = useState({
    country: "Kenya",
    county: "",
    subCounty: "",
    city: "",
    estate: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

  useEffect(() => {
    if (data) {
      setAddress({
        country: data.country || "Kenya",
        county: data.county || "",
        subCounty: data.subCounty || "",
        city: data.city || "",
        estate: data.estate || "",
      });
      setLoading(false);
    }
  }, [data]);

  const subCounties = counties[address.county] || [];

  const handleUpdate = async () => {
    if (!address.county || !address.subCounty || !address.city || !address.estate) {
      return toast.error("Please fill in all address fields");
    }

    setIsSubmitting(true);
    try {
      const response = await updateAddress(axiosInstance, address);
      if (response.success) {
        toast.success("Address updated successfully");
        setIsEditing(false);
        if (refreshData) refreshData();
      } else {
        toast.error(response.message || "Failed to update address");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !data) return <div className="p-8">Loading address...</div>;

  const isReadOnly = data?.status === "VERIFIED";

  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Address</h1>
        {isReadOnly && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-100 shadow-sm">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider">
              Verified
            </span>
          </div>
        )}
      </div>

      {isReadOnly && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-900">
              Address Verified
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              Your registered address has been verified. To update these
              details, please contact JAGEDO Support.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Country (Read Only) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Country
          </label>
          <input
            type="text"
            value={address.country}
            readOnly
            className="w-full px-4 py-2 border-b bg-transparent"
          />
        </div>

        {/* County */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            County
          </label>
          {isEditing ? (
            <select
              value={address.county}
              onChange={(e) =>
                setAddress({ ...address, county: e.target.value, subCounty: "" })
              }
              className="w-full px-4 py-2 border rounded-md"
            >
              <option value="">Select County</option>
              {Object.keys(counties).map((countyName) => (
                <option key={countyName} value={countyName}>
                  {countyName}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={address.county}
              readOnly
              className="w-full px-4 py-2 border-b bg-transparent"
            />
          )}
        </div>

        {/* Sub-county */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Sub-county
          </label>
          {isEditing ? (
            <select
              value={address.subCounty}
              onChange={(e) =>
                setAddress({ ...address, subCounty: e.target.value })
              }
              className="w-full px-4 py-2 border rounded-md"
              disabled={!address.county}
            >
              <option value="">Select Sub-county</option>
              {subCounties.map((sc) => (
                <option key={sc} value={sc}>
                  {sc}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={address.subCounty}
              readOnly
              className="w-full px-4 py-2 border-b bg-transparent"
            />
          )}
        </div>

        {/* City */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Town / City
          </label>
          {isEditing ? (
            <input
              type="text"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="Enter town or city"
            />
          ) : (
            <input
              type="text"
              value={address.city}
              readOnly
              className="w-full px-4 py-2 border-b bg-transparent"
            />
          )}
        </div>

        {/* Estate */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Estate
          </label>
          {isEditing ? (
            <input
              type="text"
              value={address.estate}
              onChange={(e) => setAddress({ ...address, estate: e.target.value })}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="Enter estate"
            />
          ) : (
            <input
              type="text"
              value={address.estate}
              readOnly
              className="w-full px-4 py-2 border-b bg-transparent"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex gap-4">
          {!isEditing ? (
            !isReadOnly && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-800 text-white px-8 py-2 rounded font-semibold transition hover:bg-blue-900"
              >
                Edit Address
              </button>
            )
          ) : (
            <>
              <button
                onClick={handleUpdate}
                disabled={isSubmitting}
                className="bg-blue-800 text-white px-8 py-2 rounded font-semibold disabled:opacity-50 transition hover:bg-blue-900"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="border border-blue-800 text-blue-800 px-8 py-2 rounded font-semibold"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Address;