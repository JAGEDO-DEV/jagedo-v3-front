/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Download, File, Filter } from "lucide-react";
import * as XLSX from "xlsx";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getAllProviders } from "@/api/provider.api";
import { kenyanLocations } from "@/data/kenyaLocations";
import { generatePDF } from "@/utils/pdfExport";

const navItems = [
  { name: "FUNDI" },
  { name: "PROFESSIONAL" },
  { name: "CONTRACTOR" },
  { name: "HARDWARE" },
];

// Export to Excel function
const exportToExcel = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const exportData = data.map((item, index) => ({
    "#": index + 1,
    Name:
      item.organizationName && item.organizationName.length > 1
        ? item.organizationName
        : item.contactfirstName && item.contactfirstName.length > 1
        ? `${item.contactfirstName} ${item.contactlastName}`
        : `${item.firstName} ${item.lastName}`,
    Type:
      item.skills ||
      item.profession ||
      item.contractorTypes ||
      item.hardwareTypes ||
      "N/A",
    Email: item.email || item.Email || "N/A",
    Phone: item.phoneNo || item.phone || item.phoneNumber || "N/A",
    County: item.county || "N/A",
    subCounty: item.subCounty || item.subCounty || "N/A",
    Created: item.createdAt
      ? new Date(item.createdAt).toLocaleDateString()
      : "N/A",
    Status: item.adminApproved ? "Verified" : "Not Verified",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();

  // Set column widths
  worksheet["!cols"] = [
    { wch: 5 },
    { wch: 25 },
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Builders");
  XLSX.writeFile(
    workbook,
    `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`
  );
};

// Export to PDF function
const exportToPDF = async (
  data: any[],
  filename: string,
  builderType: string
) => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const tableData = data.map((item, index) => [
    index + 1,
    item.organizationName && item.organizationName.length > 1
      ? item.organizationName
      : item.contactfirstName && item.contactfirstName.length > 1
      ? `${item.contactfirstName} ${item.contactlastName}`
      : `${item.firstName} ${item.lastName}`,
    item.skills ||
      item.profession ||
      item.contractorTypes ||
      item.hardwareTypes ||
      "N/A",
    item.email || item.Email || "N/A",
    item.phoneNo || item.phone || item.phoneNumber || "N/A",
    item.county || "N/A",
    item.adminApproved ? "Verified" : "Not Verified",
  ]);

  try {
    await generatePDF(
      tableData,
      filename,
      "BUILDERS REPORT",
      ["#", "Name", "Type", "Email", "Phone", "County", "Status"],
      builderType
    );
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Failed to generate PDF. Please try again.");
  }
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
    search: "",
  });
  const [builders, setBuilders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBuilders = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllProviders(axiosInstance);
        console.log(data?.hashSet);
        setBuilders(data?.hashSet || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch builders");
      } finally {
        setLoading(false);
      }
    };
    fetchBuilders();
  }, []);
  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setIsExportDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const filteredBuilders = builders.filter((builder) => {
    const matchesTab = builder?.userType === activeTab;
    const matchesName =
      !filters.name ||
      builder?.firstName?.toLowerCase().includes(filters.name.toLowerCase()) ||
      builder?.lastName?.toLowerCase().includes(filters.name.toLowerCase());
    const matchesPhone =
      !filters.phone || builder?.phoneNumber === filters.phone;
    const matchesCounty =
      !filters.county ||
      builder?.county?.toLowerCase() === filters.county.toLowerCase();
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
      builder?.email?.toLowerCase().includes(searchValue) ||
      builder?.organizationName?.toLowerCase().includes(searchValue) ||
      builder?.skills?.toLowerCase().includes(searchValue) ||
      builder?.profession?.toLowerCase().includes(searchValue) ||
      builder?.contractorTypes?.toLowerCase().includes(searchValue) ||
      builder?.hardwareTypes?.toLowerCase().includes(searchValue) ||
      builder?.county?.toLowerCase().includes(searchValue);

    return (
      matchesTab &&
      matchesName &&
      matchesPhone &&
      matchesCounty &&
      matchesVerificationStatus &&
      matchesSearch
    );
  });

  const totalPages = Math.ceil(filteredBuilders.length / rowsPerPage);
  const paginatedData = filteredBuilders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  console.log(paginatedData);

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b p-4">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          {/* Navigation tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full">
            {navItems.map((nav) => (
              <button
                key={nav.name}
                type="button"
                onClick={() => {
                  setActiveTab(nav.name);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-md font-semibold text-center transition-colors duration-200 border focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${
                  activeTab === nav.name
                    ? "bg-blue-900 text-white border-blue-900"
                    : "bg-blue-100 text-blue-900 border-blue-100 hover:bg-blue-200"
                }`}
              >
                {nav.name} (
                {builders.filter((b) => b.userType === nav.name).length})
              </button>
            ))}
          </div>

          {/* Filters and Export buttons */}
          <div className="flex gap-2 w-full justify-end">
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-700 text-sm shadow-sm whitespace-nowrap flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>

            {/* Export Dropdown */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                type="button"
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                disabled={filteredBuilders.length === 0}
                className="px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-700 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Download className="h-4 w-4" />
                Export
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isExportDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      exportToExcel(filteredBuilders, "builders");
                      setIsExportDropdownOpen(false);
                    }}
                    disabled={filteredBuilders.length === 0}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
                  >
                    <File className="h-4 w-4 text-green-600" />
                    <span className="flex-1 text-left">Export to Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      exportToPDF(filteredBuilders, "builders", activeTab);
                      setIsExportDropdownOpen(false);
                    }}
                    disabled={filteredBuilders.length === 0}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-4 w-4 text-red-600" />
                    <span className="flex-1 text-left">Export to PDF</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto bg-white border border-gray-200 rounded-lg shadow-md p-4">
          <div className="flex justify-end mb-4">
            <div className="relative w-full sm:w-auto">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
                  />
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
                <span className="ml-4 text-blue-800 font-medium">
                  Loading builders...
                </span>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 p-8">{error}</div>
            ) : filteredBuilders.length === 0 ? (
              <div className="text-center text-gray-600 p-8">
                No builders found matching your criteria.
              </div>
            ) : (
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-gray-100 text-gray-900">
                  <tr className="border-b border-gray-300">
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                      #
                    </th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                      Name
                    </th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                      {activeTab === "FUNDI"
                        ? "Skill"
                        : activeTab === "PROFESSIONAL"
                        ? "Profession"
                        : activeTab === "CONTRACTOR"
                        ? "Contractor Type"
                        : "Hardware Type"}
                    </th>
                    {/* <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">{activeTab === "PROFESSIONAL" ? "Level" : "Grade"}</th> */}
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                      Email
                    </th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                      Phone
                    </th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                      County
                    </th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                      subCounty
                    </th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                      Created At
                    </th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.map((row, rowIndex) => (
                    <tr
                      key={row.id || rowIndex}
                      className="cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() =>
                        navigate(
                          `/dashboard/profile/${row.id || rowIndex}/${
                            row.userType || activeTab
                          }`,
                          {
                            state: {
                              userData: row,
                              userType: row.userType || activeTab,
                            },
                          }
                        )
                      }
                    >
                      <td className="px-3 py-4 font-medium text-gray-800">
                        {(currentPage - 1) * rowsPerPage + rowIndex + 1}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {/* {
                          row.organizationName || row.contactfirstName + ' ' + row.contactlastName || row.firstName + " " + row.lastName
                      
                        } */}

                        {row.organizationName && row.organizationName.length > 1
                          ? row.organizationName
                          : row.contactfirstName &&
                            row.contactfirstName.length > 1
                          ? `${row.contactfirstName} ${row.contactlastName}`
                          : `${row.firstName} ${row.lastName}`}
                      </td>

                      <td className="px-3 py-4 whitespace-nowrap">
                        {row.skills ||
                          row.profession ||
                          row.contractorTypes ||
                          row.hardwareTypes ||
                          "N/A"}
                      </td>
                      {/* <td className="px-3 py-4 whitespace-nowrap">{row.grade || "N/A"}</td> */}
                      <td className="px-3 py-4 whitespace-nowrap">
                        {row.email || row.Email || "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {row.phoneNo || row.phone || row.phoneNumber || "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {row.county || "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {row.subCounty || row.subCounty || "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                              timeZone: "Africa/Nairobi",
                            }) + " EAT"
                          : "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            row.adminApproved
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
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
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-300 rounded disabled:opacity-50 bg-white hover:bg-gray-50"
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
                <span className="font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-300 rounded disabled:opacity-50 bg-white hover:bg-gray-50"
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
        <div className="fixed inset-0 z-40 overflow-hidden">
          <div
            className="fixed inset-0 bg-gray-200/30 backdrop-blur-sm transition-opacity"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">Filter Builders</h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setIsFilterOpen(false)}
                  aria-label="Close filters"
                >
                  <span className="text-3xl">&times;</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setIsFilterOpen(false);
                    setCurrentPage(1);
                  }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      value={filters.name}
                      onChange={(e) => updateFilter("name", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      value={filters.phone}
                      onChange={(e) => updateFilter("phone", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      County
                    </label>
                    <select
                      className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      value={filters.county}
                      onChange={(e) => updateFilter("county", e.target.value)}
                    >
                      <option value="">All Counties</option>
                      {kenyanLocations.map((location) => (
                        <option key={location.county} value={location.county}>
                          {location.county}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Status
                    </label>
                    <select
                      className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      value={filters.verificationStatus}
                      onChange={(e) =>
                        updateFilter("verificationStatus", e.target.value)
                      }
                    >
                      <option value="">All</option>
                      <option value="Verified">Verified</option>
                      <option value="Not Verified">Not Verified</option>
                    </select>
                  </div>
                </form>
              </div>
              <div className="p-6 border-t">
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="flex-1 bg-gray-100 rounded-md py-2.5 font-medium hover:bg-gray-200 transition-colors"
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        name: "",
                        phone: "",
                        county: "",
                        verificationStatus: "",
                      }));
                      setCurrentPage(1);
                    }}
                  >
                    Reset All
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white rounded-md py-2.5 font-medium hover:bg-blue-700 transition-colors"
                    onClick={() => {
                      setIsFilterOpen(false);
                      setCurrentPage(1);
                    }}
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
