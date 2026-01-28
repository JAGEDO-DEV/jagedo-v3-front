/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { kenyanLocations } from "@/data/kenyaLocations";
import { mockBuilders } from "@/data/mockBuilders";

const navItems = [
  { name: "FUNDI" },
  { name: "PROFESSIONAL" },
  { name: "CONTRACTOR" },
  { name: "HARDWARE" },
];

const STATUS_LABELS: Record<string, string> = {
  VERIFIED: "Verified",
  COMPLETED: "Completed",
  SIGNED_UP: "Signed Up",
  PENDING: "Pending",
  INCOMPLETE: "Incomplete",
  RETURNED: "Returned",
};
const STATUS_COLORS: Record<string, string> = {
  SIGNED_UP: "bg-gray-100 text-gray-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  INCOMPLETE: "bg-orange-100 text-orange-800",
  VERIFIED: "bg-green-100 text-green-800",
  RETURNED: "bg-red-100 text-red-800",
  COMPLETED: "bg-blue-100 text-blue-800",
};
export default function BuildersAdmin() {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("FUNDI");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    phone: "",
    county: "",
    verificationStatus: "",
    search: ""
  });
  const [builders, setBuilders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();


  // --- localStorage-based fetch (with mockBuilders fallback) ---
  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      const stored = JSON.parse(localStorage.getItem("builders") || "null");
      if (stored && Array.isArray(stored) && stored.length > 0) {
        setBuilders(stored);
      } else {
        setBuilders(mockBuilders);
        localStorage.setItem("builders", JSON.stringify(mockBuilders));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load builders");
      setBuilders(mockBuilders);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredBuilders = builders.filter((builder) => {
    const matchesTab = builder?.userType === activeTab;
    const matchesName = !filters.name || builder?.firstName?.toLowerCase().includes(filters.name.toLowerCase()) || builder?.lastName?.toLowerCase().includes(filters.name.toLowerCase());
    const matchesPhone = !filters.phone || builder?.phoneNumber === filters.phone;
    const matchesCounty = !filters.county || builder?.county?.toLowerCase() === filters.county.toLowerCase();
    const matchesVerificationStatus =
      !filters.verificationStatus || filters.verificationStatus === "All"
        ? true
        : filters.verificationStatus === "Verified"
          ? builder?.adminApproved === true
          : builder?.adminApproved === false;

    const searchValue = filters?.search?.toLowerCase() || "";
    const matchesSearch =
      !searchValue ||
      builder?.firstName?.toLowerCase().includes(searchValue) ||
      builder?.lastName?.toLowerCase().includes(searchValue) ||
      builder?.phoneNumber?.toLowerCase().includes(searchValue) ||
      builder?.county?.toLowerCase().includes(searchValue);

    return matchesTab && matchesName && matchesPhone && matchesCounty && matchesVerificationStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredBuilders.length / rowsPerPage);
  const paginatedData = filteredBuilders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b p-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          {/* Navigation buttons */}
          <div className="flex flex-nowrap gap-2 w-full overflow-x-auto md:overflow-visible">

            {navItems.map((nav) => (
              <button
                key={nav.name}
                type="button"
                onClick={() => {
                  setActiveTab(nav.name);
                  setCurrentPage(1);
                }}
                className={`px-2 md:px-18 py-2 rounded-md font-semibold text-center transition-colors duration-200 border focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${activeTab === nav.name
                  ? "bg-blue-900 text-white border-blue-900"
                  : "bg-blue-100 text-blue-900 border-blue-100 hover:bg-blue-200"
                  }`}
              >
                {nav.name} ({builders.filter((b) => b.userType === nav.name).length})
              </button>
            ))}
          </div>
          {/* Filters button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm shadow-sm whitespace-nowrap w-full md:w-auto"
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
                placeholder="Search builders..."
                value={filters?.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                <span className="ml-4 text-blue-800 font-medium">Loading builders...</span>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 p-8">{error}</div>
            ) : filteredBuilders.length === 0 ? (
              <div className="text-center text-gray-600 p-8">No builders found matching your criteria.</div>
            ) : (
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">#</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Name</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">{activeTab === "FUNDI" ? "Skill" : activeTab === "PROFESSIONAL" ? "Profession" : activeTab === "CONTRACTOR" ? "Contractor Type" : "Hardware Type"}</th>
                    {/* <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">{activeTab === "PROFESSIONAL" ? "Level" : "Grade"}</th> */}
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Email</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Phone</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">County</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Subcounty</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Created At</th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.map((row, rowIndex) => (
                    <tr
                      key={row.id || rowIndex}
                      className="cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => navigate(`/dashboard/profile/${row.id || rowIndex}/${row.userType || activeTab}`, {
                        state: { userData: row, userType: row.userType || activeTab }
                      })}
                    >
                      <td className="px-3 py-4 font-medium text-gray-800">{(currentPage - 1) * rowsPerPage + rowIndex + 1}</td>
                      <td className="px-3 py-4 whitespace-nowrap">{row.firstName || row.lastName || row?.organizationName || "N/A"}</td>
                      <td className="px-3 py-4 whitespace-nowrap">{row.skills || row.profession || row.contractorTypes || row.hardwareTypes || "N/A"}</td>
                      <td className="px-3 py-4 whitespace-nowrap">{row.email || row.Email || "N/A"}</td>
                      <td className="px-3 py-4 whitespace-nowrap">{row.phoneNo || row.phone || row.phoneNumber || "N/A"}</td>
                      <td className="px-3 py-4 whitespace-nowrap">{row.county || "N/A"}</td>
                      <td className="px-3 py-4 whitespace-nowrap">{row.subCounty || row.subcounty || "N/A"}</td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {row.createdAt ?
                          new Date(row.createdAt).toLocaleDateString('en-GB')
                          : "N/A"
                        }
                      </td>
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

          {!loading && filteredBuilders.length > 0 && (
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
                <button type="button" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 border border-gray-300 rounded disabled:opacity-50 bg-white hover:bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="font-semibold">Page {currentPage} of {totalPages}</span>
                <button type="button" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 border border-gray-300 rounded disabled:opacity-50 bg-white hover:bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isFilterOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" onClick={() => setIsFilterOpen(false)}></div>
          <div className="fixed top-0 right-0 h-full w-full max-w-xs bg-white shadow-lg z-50 p-6 transform transition-transform translate-x-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Filters</h2>
              <button onClick={() => setIsFilterOpen(false)} className="text-gray-500 hover:text-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Name</label>
                <input type="text" value={filters.name} onChange={(e) => updateFilter("name", e.target.value)} className="w-full border-gray-300 border p-2 rounded-md focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Phone</label>
                <input type="text" value={filters.phone} onChange={(e) => updateFilter("phone", e.target.value)} className="w-full border-gray-300 border p-2 rounded-md focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">County</label>
                <select value={filters.county} onChange={(e) => updateFilter("county", e.target.value)} className="w-full border-gray-300 border p-2 rounded-md focus:ring-blue-500 focus:border-blue-500">
                  <option value="">All Counties</option>
                  {kenyanLocations.map((location) => (
                    <option key={location.county} value={location.county}>{location.county}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Verification Status</label>
                <select value={filters.verificationStatus} onChange={(e) => updateFilter("verificationStatus", e.target.value)} className="w-full border-gray-300 border p-2 rounded-md focus:ring-blue-500 focus:border-blue-500">
                  <option value="">All</option>
                  {["Verified", "Not Verified"].map((val) => (
                    <option key={val} value={val}>{val}</option>
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








