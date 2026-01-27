import { useState, useEffect } from "react";
import { FiEdit } from "react-icons/fi";
// import { adminUpdateAddress } from "@/api/provider.api";
// import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { toast, Toaster } from "sonner";
// import { getAllCountries } from "@/api/countries.api";
import { counties } from "@/pages/data/counties";


const getInitialAddress = (userData: any) => {
  return {
    country: userData?.country || "",
    county: userData?.county || "",
    subCounty: userData?.subCounty || userData?.subcounty || "",
    estate: userData?.estate || "",
  };
};

// --- Helper: update a user in localStorage "users" array ---
const updateUserInLocalStorage = (userId: string, updates: Record<string, any>) => {
  try {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const idx = storedUsers.findIndex((u: any) => u.id === userId);
    if (idx !== -1) {
      storedUsers[idx] = { ...storedUsers[idx], ...updates };
      localStorage.setItem('users', JSON.stringify(storedUsers));
    }
    const singleUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (singleUser && singleUser.id === userId) {
      localStorage.setItem('user', JSON.stringify({ ...singleUser, ...updates }));
    }
  } catch (err) {
    console.error('Failed to update user in localStorage:', err);
  }
};

// Static fallback countries list (used in place of API)
const STATIC_COUNTRIES = [
  { name: "Kenya" }, { name: "Uganda" }, { name: "Tanzania" },
  { name: "Rwanda" }, { name: "Ethiopia" }, { name: "Nigeria" },
  { name: "South Africa" }, { name: "Ghana" }, { name: "Egypt" },
];

const Address = ({ userData }: { userData: any }) => {
  // const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [isEditing, setIsEditing] = useState(false);
  const [address, setAddress] = useState(getInitialAddress(userData));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);

  // --- ORIGINAL API-based countries fetch (commented out) ---
  // useEffect(() => {
  //   const fetchCountries = async () => {
  //     try {
  //       const data = await getAllCountries();
  //       //@ts-ignore
  //       setCountriesList(data.hashSet || []);
  //     } catch (error) {
  //       console.error("Failed to fetch countries:", error);
  //       toast.error("Could not load country list.");
  //     } finally {
  //       setIsLoadingCountries(false);
  //     }
  //   };
  //   fetchCountries();
  // }, []);
  // --- END ORIGINAL ---

  // --- localStorage / static fallback for countries ---
  useEffect(() => {
    try {
      const storedCountries = JSON.parse(localStorage.getItem('countries') || 'null');
      if (storedCountries && Array.isArray(storedCountries) && storedCountries.length > 0) {
        setCountriesList(storedCountries);
      } else {
        setCountriesList(STATIC_COUNTRIES);
        localStorage.setItem('countries', JSON.stringify(STATIC_COUNTRIES));
      }
    } catch {
      setCountriesList(STATIC_COUNTRIES);
    } finally {
      setIsLoadingCountries(false);
    }
  }, []);


  useEffect(() => {
    setAddress(getInitialAddress(userData));
  }, [userData]);
  
  const countyList =
    address.country?.toLowerCase() === "kenya" ? Object.keys(counties) : [];

  const subCountyList =
    address.country?.toLowerCase() === "kenya" && address.county
      ? counties[address.county as keyof typeof counties] || []
      : [];


  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "country") {
      setAddress((prev) => ({
        ...prev,
        country: value,
        county: "",
        subCounty: "",
      }));
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
      estate: "",
    });
  };

  // --- ORIGINAL API-based address update (commented out) ---
  // const handleEdit = async () => {
  //   try {
  //     setIsSubmitting(true);
  //     const response = await adminUpdateAddress(axiosInstance, address, userData.id);
  //     if (response.success) {
  //       toast.success("Address Updated Successfully");
  //     } else {
  //       toast.error(response.message || "Error Updating Address");
  //     }
  //   } catch (error: any) {
  //     console.log(error);
  //     toast.error(error.message || "Error Updating Address");
  //   } finally {
  //     setIsEditing(false);
  //     setIsSubmitting(false);
  //   }
  // };
  // --- END ORIGINAL ---

  // --- localStorage-based address update ---
  const handleEdit = () => {
    setIsSubmitting(true);
    try {
      updateUserInLocalStorage(userData.id, address);
      Object.assign(userData, address);
      toast.success("Address Updated Successfully");
    } catch (error: any) {
      console.log(error);
      toast.error(error.message || "Error Updating Address");
    } finally {
      setIsEditing(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className=" bg-white flex">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-3xl p-6">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6 border-b pb-3">
            <h1 className="text-2xl font-bold">My Address</h1>
            {!isEditing && (
              <FiEdit
                className="text-[rgb(0,0,122)] cursor-pointer hover:opacity-75"
                size={20}
                onClick={() => setIsEditing(true)}
              />
            )}
          </div>

          <form className="space-y-4">
            {/* Country Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Country</label>
              {isEditing ? (
                <select
                  name="country"
                  value={address.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-b outline-none"
                  disabled={isLoadingCountries}
                >
                  <option value="">{isLoadingCountries ? "Loading..." : "Select Country"}</option>
                  {countriesList.map((country) => (
                    <option key={country.name} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="w-full px-4 py-2 border-b">{address.country}</p>
              )}
            </div>

            {/* County Dropdown (Conditional for Kenya) */}
            {address.country?.toLowerCase() === "kenya" && (
                <div className="space-y-2">
                <label className="block text-sm font-medium">County</label>
                {isEditing ? (
                    <select
                    name="county"
                    value={address.county}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-b outline-none"
                    >
                    <option value="">Select County</option>
                    {countyList.map((county) => (
                        <option key={county} value={county}>
                        {county}
                        </option>
                    ))}
                    </select>
                ) : (
                    <p className="w-full px-4 py-2 border-b">{address.county}</p>
                )}
                </div>
            )}

            {/* Sub County Dropdown (Conditional for Kenya) */}
            {address.country?.toLowerCase() === "kenya" && address.county && (
                <div className="space-y-2">
                <label className="block text-sm font-medium">Sub County</label>
                {isEditing ? (
                    <select
                    name="subCounty"
                    value={address.subCounty}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border-b outline-none"
                    >
                    <option value="">Select Sub-County</option>
                    {subCountyList.map((sub) => (
                        <option key={sub} value={sub}>
                        {sub}
                        </option>
                    ))}
                    </select>
                ) : (
                    <p className="w-full px-4 py-2 border-b">{address.subCounty}</p>
                )}
                </div>
            )}

            {/* Estate / Town (Text input) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Estate / Town</label>
              {isEditing ? (
                <input
                  name="estate"
                  value={address.estate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-b outline-none"
                />
              ) : (
                <p className="w-full px-4 py-2 border-b">{address.estate}</p>
              )}
            </div>

            {/* Buttons */}
            {isEditing && (
              <div className="flex gap-4 mt-4 items-center">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="bg-[rgb(0,0,122)] text-white px-4 py-2 rounded hover:opacity-90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="border border-gray-400 text-gray-700 px-4 py-2 rounded hover:bg-gray-100"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-red-500 px-4 py-2 rounded hover:underline ml-auto"
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