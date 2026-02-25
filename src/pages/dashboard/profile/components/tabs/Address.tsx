import { useState, useEffect } from "react";
import { FiEdit } from "react-icons/fi";
import { toast, Toaster } from "sonner";
import { counties } from "@/pages/data/counties";
import { adminUpdateAddress } from "@/api/provider.api"
import { getAllCountries } from "@/api/countries.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";

const getInitialAddress = (userData: any) => {
  return {
    country: userData?.country || "Kenya",
    county: userData?.county || "",
    subCounty: userData?.subCounty || "",
    city: userData?.city || "",
    estate: userData?.estate || "",
  };
};

const Address = ({ userData }) => {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [isEditing, setIsEditing] = useState(false);
  const [address, setAddress] = useState(getInitialAddress(userData));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countriesList = [{ name: "Kenya" }];
  const isLoadingCountries = false;

  useEffect(() => {
    setAddress(getInitialAddress(userData));
  }, [userData]);

  const countyList =
    address.country?.toLowerCase() === "kenya" ? Object.keys(counties) : [];

  const subCountyList =
    address.country?.toLowerCase() === "kenya" && address.county
      ? counties[address.county] || []
      : [];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "country") {
      setAddress({
        country: value,
        county: "",
        subCounty: "",
        city: "",
        estate: "",
      });
    } else if (name === "county") {
      setAddress((prev) => ({
        ...prev,
        county: value,
        subCounty: "",
      }));
    } else {
      setAddress((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCancel = () => {
    setAddress(getInitialAddress(userData));
    setIsEditing(false);
  };

  const handleReset = () => {
    setAddress({
      country: "",
      county: "",
      subCounty: "",
      city: "",
      estate: "",
    });
  };

  // --- Corrected API call ---
  const handleEdit = async () => {
    setIsSubmitting(true);
    try {
      await adminUpdateAddress(axiosInstance, address, userData.id);
      toast.success("Address Updated Successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update address");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white flex">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-3xl items-center p-6">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6 border-b pb-3">
            <h1 className="text-2xl font-bold">My Address</h1>
            {!isEditing && (
              <FiEdit
                className="text-[rgb(0,0,122)] cursor-pointer"
                size={20}
                onClick={() => setIsEditing(true)}
              />
            )}
          </div>

          <form className="space-y-4">
            {/* Country */}
            <div>
              <label className="block text-sm font-medium">Country</label>
              {isEditing ? (
                <select
                  name="country"
                  value={address.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-b"
                >
                  <option value="">
                    {isLoadingCountries ? "Loading..." : "Select Country"}
                  </option>
                  {countriesList.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="border-b px-4 py-2">{address.country}</p>
              )}
            </div>

            {/* County */}
            {address.country?.toLowerCase() === "kenya" && (
              <div>
                <label className="block text-sm font-medium">County</label>
                {isEditing ? (
                  <select
                    name="county"
                    value={address.county}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-b"
                  >
                    <option value="">Select County</option>
                    {countyList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="border-b px-4 py-2">{address.county}</p>
                )}
              </div>
            )}

            {/* Sub County */}
            {address.country?.toLowerCase() === "kenya" && address.county && (
              <div>
                <label className="block text-sm font-medium">Sub County</label>
                {isEditing ? (
                  <select
                    name="subCounty"
                    value={address.subCounty}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-b"
                  >
                    <option value="">Select Sub-County</option>
                    {subCountyList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="border-b px-4 py-2">{address.subCounty}</p>
                )}
              </div>
            )}

            {/* City */}
            <div>
              <label className="block text-sm font-medium">Town / City</label>
              {isEditing ? (
                <input
                  name="city"
                  value={address.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-b"
                  placeholder="Enter town or city"
                />
              ) : (
                <p className="border-b px-4 py-2">{address.city}</p>
              )}
            </div>

            {/* Estate */}
            <div>
              <label className="block text-sm font-medium">Estate</label>
              {isEditing ? (
                <input
                  name="estate"
                  value={address.estate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-b"
                  placeholder="Enter estate"
                />
              ) : (
                <p className="border-b px-4 py-2">{address.estate}</p>
              )}
            </div>

            {/* Buttons */}
            {isEditing && (
              <div className="flex gap-4 mt-4">
                <button
                  type="button"
                  onClick={handleEdit}
                  disabled={isSubmitting}
                  className="bg-[rgb(0,0,122)] text-white px-4 py-2 rounded"
                >
                  {isSubmitting ? "Updating..." : "Update"}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="border px-4 py-2 rounded"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-red-500 ml-auto"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Address;
