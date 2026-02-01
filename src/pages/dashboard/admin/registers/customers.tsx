/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// import useAxiosWithAuth from "@/utils/axiosInterceptor";
// import { getAllCustomers } from "@/api/provider.api";
import { kenyanLocations } from "@/data/kenyaLocations";

// Static fallback customer data (used when no localStorage data exists)
const STATIC_CUSTOMERS = [
  {
    id: "cust-001",
    userType: "CUSTOMER",
    accountType: "INDIVIDUAL",
    firstName: "Lucy",
    lastName: "Wanjiku",
    email: "lucy@jagedo.co.ke",
    phoneNumber: "0712000001",
    county: "Nairobi",
    subCounty: "Westlands",
    adminApproved: false,
    createdAt: "2026-01-10",
  },
  {
    id: "cust-002",
    userType: "CUSTOMER",
    accountType: "INDIVIDUAL",
    firstName: "Peter",
    lastName: "Omondi",
    email: "peter@jagedo.co.ke",
    phoneNumber: "0712000002",
    county: "Kisumu",
    subCounty: "Kisumu Central",
    adminApproved: true,
    createdAt: "2026-01-15",
  },
  {
    id: "cust-003",
    userType: "CUSTOMER",
    accountType: "ORGANIZATION",
    firstName: "Acme",
    lastName: "Builders Ltd",
    email: "info@acmebuilders.co.ke",
    phoneNumber: "0712000003",
    county: "Mombasa",
    subCounty: "Mvita",
    adminApproved: false,
    organizationName: "Acme Builders Ltd",
    createdAt: "2026-01-20",
  },
];

const navItems = [
  { name: "Individual" },
  { name: "Organization" },
];

export default function CustomersAdmin() {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("Individual");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    phone: "",
    county: "",
    search: ""
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const navigate = useNavigate();

  // --- ORIGINAL API-based fetch (commented out) ---
  // useEffect(() => {
  //   const fetchCustomers = async () => {
  //     setLoading(true);
  //     setError(null);
  //     try {
  //       const data = await getAllCustomers(axiosInstance);
  //       setCustomers(data?.hashSet || []);
  //     } catch (err: any) {
  //       setError(err.message || "Failed to fetch customers");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchCustomers();
  // }, []);
  // --- END ORIGINAL ---

  // --- localStorage-based fetch ---
  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      const stored = JSON.parse(localStorage.getItem("customers") || "null");
      if (stored && Array.isArray(stored) && stored.length > 0) {
        setCustomers(stored);
      } else {
        setCustomers(STATIC_CUSTOMERS);
        localStorage.setItem("customers", JSON.stringify(STATIC_CUSTOMERS));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load customers");
      setCustomers(STATIC_CUSTOMERS);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Refresh customers when page comes back into focus ---
  useEffect(() => {
    const handleFocus = () => {
      try {
        const stored = JSON.parse(localStorage.getItem("customers") || "null");
        if (stored && Array.isArray(stored) && stored.length > 0) {
          setCustomers(stored);
        }
      } catch (err) {
        console.error("Failed to refresh customers:", err);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const filteredCustomers = customers.filter((customer) => {
    const matchesTab = activeTab === "Individual"
      ? customer.accountType === "INDIVIDUAL" || !customer.accountType
      : customer.accountType === "ORGANIZATION";
    const matchesName = !filters.name || customer?.firstName?.toLowerCase().includes(filters.name.toLowerCase()) || customer?.lastName?.toLowerCase().includes(filters.name.toLowerCase());
    const matchesPhone = !filters.phone || customer?.phoneNumber === filters.phone;
    const matchesCounty = !filters.county || customer?.county?.toLowerCase() === filters.county.toLowerCase();

    const searchValue = filters?.search?.toLowerCase() || "";
    const matchesSearch =
      !searchValue ||
      customer?.firstName?.toLowerCase().includes(searchValue) ||
      customer?.lastName?.toLowerCase().includes(searchValue) ||
      customer?.phoneNumber?.toLowerCase().includes(searchValue) ||
      customer?.county?.toLowerCase().includes(searchValue);

    return matchesTab && matchesName && matchesPhone && matchesCounty && matchesSearch;
  });

  const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage);
  const paginatedData = filteredCustomers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Navigation Bar */}
          <div className="flex gap-2 w-full">
            {navItems.map((nav) => (
              <button
                key={nav.name}
                type="button"
                onClick={() => setActiveTab(nav.name)}
                className={`w-full px-4 py-2 rounded-md font-semibold text-center transition-colors duration-200 border focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${activeTab === nav.name
                  ? "bg-blue-900 text-white border-blue-900"
                  : "bg-blue-100 text-blue-900 border-blue-100 hover:bg-blue-200"
                  }`}
              >
                {nav.name} ({nav.name === "Individual"
                  ? customers.filter((c) => c.accountType === "INDIVIDUAL" || !c.accountType).length
                  : customers.filter((c) => c.accountType === "ORGANIZATION").length
                })
              </button>
            ))}
          </div>
          {/* Filters Button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm shadow-sm whitespace-nowrap"
          >
            Filters
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto bg-white border border-gray-200 rounded-lg shadow-md p-4">
          <div className="flex justify-end mb-4">
            <div className="relative w-full sm:w-auto">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search customers..."
                value={filters?.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                <span className="ml-4 text-blue-800 font-medium">Loading customers...</span>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 p-8">{error}</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center text-gray-600 p-8">No customers found.</div>
            ) : (
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">#</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Name</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Email</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Phone</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">County</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Subcounty</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.map((row, rowIndex) => (
                    <tr
                      key={row.id || rowIndex}
                      className="cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => navigate(`/dashboard/profile/${row.id || rowIndex}/CUSTOMER`, {
                        state: { userData: row, userType: 'CUSTOMER' }
                      })}
                    >
                      <td className="px-3 py-4 font-medium text-gray-800">{(currentPage - 1) * rowsPerPage + rowIndex + 1}</td>
                      <td className="px-3 py-4 whitespace-nowrap">{row.firstName} {row.lastName}</td>
                      <td className="px-3 py-4 whitespace-nowrap">{row.email || "N/A"}</td>
                      <td className="px-3 py-4 whitespace-nowrap">{row.phoneNumber || "N/A"}</td>
                      <td className="px-3 py-4 whitespace-nowrap">{row.county || "N/A"}</td>
                      <td className="px-3 py-4 whitespace-nowrap">{row.subCounty || "N/A"}</td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${row.adminApproved
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                          }`}>
                          {row.adminApproved ? "Verified" : "Not Verified"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loading && filteredCustomers.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-700 gap-4">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-2 py-1"
                >
                  {[5, 10, 20, 30].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded disabled:opacity-50 bg-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <span className="font-semibold">{currentPage}</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded disabled:opacity-50 bg-white"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isFilterOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsFilterOpen(false)}></div>
          <div className="fixed top-0 right-0 h-full w-full max-w-xs bg-white shadow-lg z-50 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} className="text-gray-500 hover:text-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Name</label>
                <input type="text" value={filters.name} onChange={(e) => updateFilter("name", e.target.value)} className="w-full border-gray-300 border p-2 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Phone</label>
                <input type="text" value={filters.phone} onChange={(e) => updateFilter("phone", e.target.value)} className="w-full border-gray-300 border p-2 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">County</label>
                <select value={filters.county} onChange={(e) => updateFilter("county", e.target.value)} className="w-full border-gray-300 border p-2 rounded-md">
                  <option value="">All Counties</option>
                  {kenyanLocations.map((location) => (
                    <option key={location.county} value={location.county}>{location.county}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}