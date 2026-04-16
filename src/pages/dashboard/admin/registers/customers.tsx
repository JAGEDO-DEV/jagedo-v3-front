/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Download, File, Filter, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getAllCustomers, getDeletedCustomers, purgeUser, updateAccountStatus, restoreDeletedUser } from "@/api/provider.api";
import { kenyanLocations } from "@/data/kenyaLocations";
import { generatePDF } from "@/utils/pdfExport";
import { BuilderStatus } from "@/data/mockBuilders"; 
import { StatusBadge } from "./StatusBadge"; 
import { toast } from "react-hot-toast";

const navItems = [{ name: "Individual" }, { name: "Organization" }, { name: "TRASH" }];


const exportToExcel = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const exportData = data.map((item, index) => ({
    ID: index + 1,
    "Builder ID": item?.builderId || "N/A",
    Name:
      `${item?.firstName ?? ""} ${item?.lastName ?? ""}`.trim() ||
      item?.contactFullName ||
      item?.organizationName ||
      "N/A",
    Email: item.email || "N/A",
    Phone: item.phone || "N/A",
    Gender: item.gender || "N/A",
    County: item.county || "N/A",
    subCounty: item.subCounty || "N/A",
    Estate: item.estate || "N/A",
    "Account Type": item.accountType || "N/A",
    "Registration Type": item.registrationType || "N/A",
    Status: item.status == 'VERIFIED' ? "Verified" : "Not Verified",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();

  
  worksheet["!cols"] = [
    { wch: 5 }, 
    { wch: 20 }, 
    { wch: 25 }, 
    { wch: 30 }, 
    { wch: 15 }, 
    { wch: 10 }, 
    { wch: 15 }, 
    { wch: 15 }, 
    { wch: 15 }, 
    { wch: 15 }, 
    { wch: 15 }, 
    { wch: 12 }, 
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
  XLSX.writeFile(
    workbook,
    `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`
  );
};


const exportToPDF = async (
  data: any[],
  filename: string,
  accountType: string
) => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  const tableData = data.map((item, index) => [
    index + 1,
    item?.builderId || "N/A",
    `${item?.firstName ?? ""} ${item?.lastName ?? ""}`.trim() ||
    item?.contactFullName ||
    item?.organizationName ||
    "N/A",
    item.email || "N/A",
    item.phone || "N/A",
    item.gender || "N/A",
    item.county || "N/A",
    item.subCounty || "N/A",
    item.estate || "N/A",
    item.accountType || "N/A",
    item.registrationType || "Manual",
    item.status == 'VERIFIED' ? "Verified" : "Not Verified",
  ]);

  try {
    await generatePDF(
      tableData,
      filename,
      "CUSTOMERS REPORT",
      [
        "iD",
        "Builder ID",
        "Name",
        "Email",
        "Phone",
        "Gender",
        "County",
        "subCounty",
        "Estate",
        "Account Type",
        "Registration",
        "Status",
      ],
      accountType
    );
  } catch (error) {
    console.error("PDF generation failed:", error);
    alert("Failed to generate PDF. Please try again.");
  }
};

export default function CustomersAdmin() {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState("Individual");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    phone: "",
    county: "",
    verificationStatus: "", 
    search: "",
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [deletedCustomers, setDeletedCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const [customersRes, deletedRes] = await Promise.all([
        getAllCustomers(axiosInstance),
        getDeletedCustomers(axiosInstance)
      ]);
      setCustomers(customersRes?.data || []);
      setDeletedCustomers(deletedRes?.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const filteredCustomers = (activeTab === "TRASH" ? deletedCustomers : customers).filter((customer) => {
    const matchesTab = 
      activeTab === "TRASH" ? true :
      activeTab === "Individual"
        ? customer.accountType === "INDIVIDUAL" || !customer.accountType
        : customer.accountType === "ORGANIZATION";
    const matchesName =
      !filters.name ||
      customer?.firstName?.toLowerCase().includes(filters.name.toLowerCase()) ||
      customer?.lastName?.toLowerCase().includes(filters.name.toLowerCase()) ||
      customer?.organizationName?.toLowerCase().includes(filters.name.toLowerCase());
    const matchesPhone =
      !filters.phone || customer?.phone === filters.phone;
    const matchesCounty =
      !filters.county ||
      customer?.county?.toLowerCase() === filters.county.toLowerCase();
    const matchesVerificationStatus =
      !filters.verificationStatus ||
      customer?.status === filters.verificationStatus;

    const searchValue = filters?.search?.toLowerCase() || "";
    const matchesSearch =
      !searchValue ||
      customer?.firstName?.toLowerCase().includes(searchValue) ||
      customer?.lastName?.toLowerCase().includes(searchValue) ||
      customer?.contactFullName?.toLowerCase().includes(searchValue) ||
      customer?.phone?.toLowerCase().includes(searchValue) ||
      customer?.email?.toLowerCase().includes(searchValue) ||
      customer?.organizationName?.toLowerCase().includes(searchValue) ||
      customer?.subCounty?.toLowerCase().includes(searchValue) ||
      customer?.county?.toLowerCase().includes(searchValue);

    return (
      matchesTab &&
      matchesName &&
      matchesPhone &&
      matchesCounty &&
      matchesVerificationStatus &&
      matchesSearch
    );
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
          <div className="flex flex-wrap md:flex-nowrap gap-2 w-full">
            {navItems.map((nav) => (
              <button
                key={nav.name}
                type="button"
                onClick={() => {
                  setActiveTab(nav.name);
                  setCurrentPage(1);
                }}
                className={`flex-1 px-4 py-2 rounded-md font-semibold text-center transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm flex items-center justify-center gap-2 ${activeTab === nav.name
                  ? nav.name === "TRASH"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-blue-900 text-white border-blue-900"
                  : nav.name === "TRASH"
                    ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                    : "bg-blue-100 text-blue-900 border-blue-100 hover:bg-blue-200"
                  }`}
              >
                {nav.name === "TRASH" ? (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>({deletedCustomers.length})</span>
                  </>
                ) : (
                  <>
                    {nav.name} (
                    {nav.name === "Individual"
                      ? customers.filter(
                        (c) => c.accountType === "INDIVIDUAL" || !c.accountType
                      ).length
                      : customers.filter((c) => c.accountType === "ORGANIZATION")
                        .length}
                    )
                  </>
                )}
              </button>
            ))}
          </div>
          {/* Filters and Export buttons */}
          <div className="flex gap-2 w-full md:w-auto flex-wrap md:flex-nowrap">
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="flex-1 md:flex-none px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-700 text-sm shadow-sm whitespace-nowrap flex items-center gap-2 justify-center"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>

            {/* Export Dropdown */}
            <div
              className="relative flex-1 md:flex-none"
              ref={exportDropdownRef}
            >
              <button
                type="button"
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                disabled={filteredCustomers.length === 0}
                className="w-full px-4 py-2 bg-blue-900 text-white rounded-md hover:bg-blue-700 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 justify-center whitespace-nowrap"
              >
                <Download className="h-4 w-4" />
                Export
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isExportDropdownOpen ? "rotate-180" : ""
                    }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      exportToExcel(filteredCustomers, "customers");
                      setIsExportDropdownOpen(false);
                    }}
                    disabled={filteredCustomers.length === 0}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
                  >
                    <File className="h-4 w-4 text-green-600" />
                    <span className="flex-1 text-left">Export to Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      exportToPDF(filteredCustomers, "customers", activeTab);
                      setIsExportDropdownOpen(false);
                    }}
                    disabled={filteredCustomers.length === 0}
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
                <span className="ml-4 text-blue-800 font-medium">
                  Loading customers...
                </span>
              </div>
            ) : error ? (
              <div className="text-center text-red-600 p-8">{error}</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center text-gray-600 p-8">
                No customers found.
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
                      Status
                    </th>
                    <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                      Actions
                    </th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedData.map((row, rowIndex) => (
                    <tr
                      key={row.id || rowIndex}
                      className="cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => {
                        if (activeTab === "TRASH") return;
                        navigate(`/dashboard/profile/${row.id || rowIndex}/customer`, {
                          state: { userData: row, userType: 'CUSTOMER' }
                        })
                      }}
                    >
                      <td className="px-3 py-4 font-medium text-gray-800">
                        {(currentPage - 1) * rowsPerPage + rowIndex + 1}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {`${row?.firstName ?? ""} ${row?.lastName ?? ""
                          }`.trim() ||
                          row?.contactFullName ||
                          row?.organizationName}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {row.email || "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {row.phone || "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {row.county || "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {row.subCounty || "N/A"}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <StatusBadge
                          status={(row.status as BuilderStatus) || "INCOMPLETE"}
                        />
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {activeTab === "TRASH" ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(row);
                                setIsRestoreModalOpen(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border bg-green-50 text-green-600 border-green-300 hover:bg-green-100 transition-colors"
                            >
                              ↻ Restore
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(row);
                                setIsPurgeModalOpen(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border bg-red-600 text-white border-red-600 hover:bg-red-700 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Purge
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(row);
                              setNotificationEmail(row.email || "");
                              setIsTrashModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Trash
                          </button>
                        )}
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
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
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

      {/* Filter Modal with Status Filter Added */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-40 overflow-hidden">
          <div
            className="fixed inset-0 bg-gray-200/30 transition-opacity"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-semibold">Filter Customers</h2>
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
                  {/* Added Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      className="w-full border rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500"
                      value={filters.verificationStatus}
                      onChange={(e) => updateFilter("verificationStatus", e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="VERIFIED">Verified</option>
                      <option value="PENDING">Pending</option>
                      <option value="INCOMPLETE">Incomplete</option>
                      <option value="BLACKLISTED">blacklisted</option>
                      <option value="DELETED">deleted</option>
                      <option value="REJECTED">Rejected</option>
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
                    className="flex-1 bg-blue-900 text-white rounded-md py-2.5 font-medium hover:bg-blue-700 transition-colors"
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
      {/* Move to Trash Modal */}
      {isTrashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Move Customer To Trash</h3>
              <p className="text-sm text-gray-500 mb-6">
                Add a reason and notification email before deleting this customer.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Delete reason
                  </label>
                  <textarea
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                    placeholder="Enter reason for deletion..."
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Notification Email
                  </label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="customer@example.com"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsTrashModalOpen(false)}
                  disabled={isActionLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!deleteReason || isActionLoading}
                  onClick={async () => {
                    setIsActionLoading(true);
                    try {
                      await updateAccountStatus(axiosInstance, selectedUser.id, "DELETE", deleteReason);
                      toast.success("Customer moved to trash successfully");
                      setIsTrashModalOpen(false);
                      setDeleteReason("");
                      fetchCustomers();
                    } catch (err: any) {
                      toast.error(err.message || "Failed to move customer to trash");
                    } finally {
                      setIsActionLoading(false);
                    }
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isActionLoading ? "Processing..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purge (Permanent Delete) Modal */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Permanently Purge Customer?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This action is irreversible. All archived information for this customer will be permanently removed from the database.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(false)}
                disabled={isActionLoading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={async () => {
                  setIsActionLoading(true);
                  try {
                    await purgeUser(axiosInstance, selectedUser.id);
                    toast.success("Customer permanently purged");
                    setIsPurgeModalOpen(false);
                    fetchCustomers();
                  } catch (err: any) {
                    toast.error(err.message || "Failed to purge customer");
                  } finally {
                    setIsActionLoading(false);
                  }
                }}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isActionLoading ? "Purging..." : "Purge Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Customer Modal */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Restore Customer?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will restore <span className="font-semibold">{selectedUser?.firstName} {selectedUser?.lastName}</span> with status set to <span className="font-semibold">UNVERIFIED</span>. You can re-verify them after.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-blue-800">
                ℹ️ All profile data, documents, and history will be restored. The customer will need admin approval to become active again.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsRestoreModalOpen(false)}
                disabled={isActionLoading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={async () => {
                  setIsActionLoading(true);
                  try {
                    await restoreDeletedUser(axiosInstance, selectedUser.id);
                    toast.success("Customer restored successfully");
                    setIsRestoreModalOpen(false);
                    fetchCustomers();
                  } catch (err: any) {
                    toast.error(err.message || "Failed to restore customer");
                  } finally {
                    setIsActionLoading(false);
                  }
                }}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isActionLoading ? "Restoring..." : "Restore Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}