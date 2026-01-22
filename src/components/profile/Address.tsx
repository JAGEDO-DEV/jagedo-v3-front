import { useState, useEffect, useMemo } from "react";
import { FiEdit } from "react-icons/fi";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { useGlobalContext } from "@/context/GlobalProvider";
import { getProviderProfile, updateProfileAddress } from "@/api/provider.api";
import { getAllCountries } from "@/api/countries.api";
import { counties } from "@/pages/data/counties";
import { MOCK_ADDRESSES } from "@/pages/mockAddresses";

const Address = () => {
  const { user } = useGlobalContext();
  const canEdit = user?.userType === "CUSTOMER" || !user?.adminApproved;

  const [isEditing, setIsEditing] = useState(false);
  const [address, setAddress] = useState({
    country: "",
    county: "",
    subCounty: "",
    estate: "",
  });
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await getAllCountries();
        // @ts-ignore
        setCountriesList(data.hashSet || []);
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      } finally {
        setIsLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  // useEffect(() => {
  //   const fetchProviderProfile = async () => {
  //     if (user?.id) {
  //       try {
  //         setLoading(true);
  //         const profile = await getProviderProfile(axiosInstance, user.id);
  //         setProviderProfile(profile.data);
  //         setAddress({
  //           country: profile.data.country || "",
  //           county: profile.data.county || "",
  //           subCounty: profile.data.subCounty || "",
  //           estate: profile.data.estate || "",
  //         });
  //       } catch (error) {
  //         console.error("Failed to fetch provider profile:", error);
  //         setUpdateMessage({
  //           type: "error",
  //           text: "Failed to fetch profile data"
  //         });
  //       } finally {
  //         setLoading(false);
  //       }
  //     }
  //   };
  //   fetchProviderProfile();
  // }, [user?.id]);
useEffect(() => {
  if (!user) return;

  const key = user.username.split("@")[0];
  const stored = JSON.parse(localStorage.getItem("address"));

  if (stored) {
    setAddress(stored);
    setProviderProfile(stored);
  } else {
    const mock = MOCK_ADDRESSES[key] || MOCK_ADDRESSES["lucy"];

    setAddress(mock);
    setProviderProfile(mock);
    localStorage.setItem("address", JSON.stringify(mock));
  }

  setLoading(false);
}, [user]);

  useEffect(() => {
    if (updateMessage) {
      const timer = setTimeout(() => {
        setUpdateMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [updateMessage]);

  const countyList = useMemo(() => {
    return address.country?.toLowerCase() === "kenya" ? Object.keys(counties) : [];
  }, [address.country]);

  const subCountyList = useMemo(() => {
    if (address.country?.toLowerCase() === "kenya" && address.county) {
      return counties[address.county as keyof typeof counties] || [];
    }
    return [];
  }, [address.country, address.county]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "country") {
      setAddress((prev) => ({ ...prev, country: value, county: "", subCounty: "" }));
    } else if (name === "county") {
      setAddress((prev) => ({ ...prev, county: value, subCounty: "" }));
    } else {
      setAddress((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateAddress = () => {
    const requiredFields: Array<keyof typeof address> = ['country'];
    if (address.country?.toLowerCase() === 'kenya') {
      requiredFields.push('county');
    }
    const missingFields = requiredFields.filter(field => !address[field]?.trim());

    if (missingFields.length > 0) {
      setUpdateMessage({
        type: "error",
        text: `Please fill in required fields: ${missingFields.join(', ')}`
      });
      return false;
    }
    return true;
  };

  // const handleUpdate = async () => {
  //   if (!validateAddress()) return;

  //   try {
  //     setUpdating(true);
  //     setUpdateMessage(null);
  //     const response = await updateProfileAddress(axiosInstance, address);
  //     setProviderProfile(prev => ({ ...prev, ...address }));
  //     setUpdateMessage({ type: "success", text: "Address updated successfully!" });
  //     setIsEditing(false);
  //     console.log("Address updated successfully:", response.data);
  //   } catch (error: any) {
  //     console.error("Failed to update address:", error);
  //     const errorMessage = error.response?.data?.message || error.message || "Failed to update address. Please try again.";
  //     setUpdateMessage({ type: "error", text: errorMessage });
  //   } finally {
  //     setUpdating(false);
  //   }
  // };
const handleUpdate = () => {
  if (!validateAddress()) return;

  setUpdating(true);

  setTimeout(() => {
    localStorage.setItem("address", JSON.stringify(address));
    setProviderProfile(address);
    setUpdateMessage({ type: "success", text: "Address updated successfully!" });
    setIsEditing(false);
    setUpdating(false);
  }, 600);
};

  const handleCancel = () => {
    if (providerProfile) {
      setAddress({
        country: providerProfile.country || "",
        county: providerProfile.county || "",
        subCounty: providerProfile.subCounty || "",
        estate: providerProfile.estate || "",
      });
    }
    setIsEditing(false);
    setUpdateMessage(null);
  };

  const handleReset = () => {
    setAddress({
      country: "",
      county: "",
      subCounty: "",
      estate: "",
    });
    setUpdateMessage(null);
  };

  if (loading || isLoadingCountries) {
    return (
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-md p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-white rounded-xl shadow-md p-8">
      <div className="flex justify-between items-center mb-6 border-b pb-3">
        <h1 className="text-2xl font-bold">My Address</h1>
        {!isEditing && canEdit && (
          <FiEdit className="text-[rgb(0,0,122)] cursor-pointer hover:opacity-75" size={20} onClick={() => setIsEditing(true)} />
        )}
      </div>

      {!canEdit && !isEditing && (
        <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-200">
          Your profile has been approved. To update your address, please contact support for assistance.
        </div>
      )}

      {updateMessage && (
        <div className={`mb-4 p-3 rounded ${updateMessage.type === "success"
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-700 border border-red-200"
          }`}>
          {updateMessage.text}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Country <span className="text-red-500">*</span></label>
          {isEditing ? (
            <select
              name="country"
              value={address.country}
              onChange={handleChange}
              className="w-full px-4 py-2 border-b outline-none focus:border-[rgb(0,0,122)]"
              required
            >
              <option value="">Select Country</option>
              {countriesList.map((country) => (
                <option key={country.name} value={country.name}>{country.name}</option>
              ))}
            </select>
          ) : (
            <p className="w-full px-4 py-2 border-b">{address.country || "Not specified"}</p>
          )}
        </div>

        {address.country?.toLowerCase() === 'kenya' && (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium">County <span className="text-red-500">*</span></label>
              {isEditing ? (
                <select
                  name="county"
                  value={address.county}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-b outline-none focus:border-[rgb(0,0,122)]"
                  required
                >
                  <option value="">Select County</option>
                  {countyList.map((county) => (
                    <option key={county} value={county}>{county}</option>
                  ))}
                </select>
              ) : (
                <p className="w-full px-4 py-2 border-b">{address.county || "Not specified"}</p>
              )}
            </div>

            {address.county && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">Sub County</label>
                {isEditing ? (
                  <select
                    name="subCounty"
                    value={address.subCounty}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-b outline-none focus:border-[rgb(0,0,122)]"
                  >
                    <option value="">Select Sub-County</option>
                    {subCountyList.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                ) : (
                  <p className="w-full px-4 py-2 border-b">{address.subCounty || "Not specified"}</p>
                )}
              </div>
            )}
          </>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium">Estate / Town</label>
          {isEditing ? (
            <input
              name="estate"
              value={address.estate}
              onChange={handleChange}
              className="w-full px-4 py-2 border-b outline-none focus:border-[rgb(0,0,122)]"
              placeholder="Enter estate/area"
            />
          ) : (
            <p className="w-full px-4 py-2 border-b">{address.estate || "Not specified"}</p>
          )}
        </div>

        {isEditing && (
          <div className="flex gap-4 mt-4 items-center">
            <button type="button" onClick={handleUpdate} disabled={updating} className="bg-[rgb(0,0,122)] text-white px-6 py-2 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {updating ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Updating...</>) : ("Update")}
            </button>
            <button type="button" onClick={handleReset} disabled={updating} className="border border-gray-400 text-gray-700 px-6 py-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
              Reset
            </button>
            <button type="button" onClick={handleCancel} disabled={updating} className="text-red-500 px-6 py-2 rounded hover:underline ml-auto disabled:opacity-50 disabled:cursor-not-allowed">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>

  );
};

export default Address;