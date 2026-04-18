/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Download, File, Filter, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getAllProviders, getDeletedBuilders, purgeUser, updateAccountStatus, restoreDeletedUser } from "@/api/provider.api";
import { kenyanLocations } from "@/data/kenyaLocations";
import { generatePDF } from "@/utils/pdfExport";
import { BuilderStatus, STATUS_LABELS } from "@/data/mockBuilders";
import { StatusBadge } from "./StatusBadge";
import { BuilderFilters } from "./BuilderFilters";
import { CompletionStatus } from "@/hooks/useProfileCompletion";
import { BuilderStatusCell } from "./BuilderStatusCell";
import { toast } from "react-hot-toast";

const navItems = [
  { name: "FUNDI" },
  { name: "PROFESSIONAL" },
  { name: "CONTRACTOR" },
  { name: "HARDWARE" },
  { name: "TRASH" },
];


const exportToExcel = (data: any[], filename: string, activeTab?: string) => {
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
    ...(activeTab !== "HARDWARE" ? { Specialization: item.specialization || "N/A" } : {}),
    Email: item.email || item.Email || "N/A",
    Phone: item.phoneNo || item.phone || item.phoneNumber || "N/A",
    County: item.county || "N/A",
    subCounty: item.subCounty || item.subCounty || "N/A",
    Created: item.createdAt
      ? new Date(item.createdAt).toLocaleDateString()
      : "N/A",
    Status: STATUS_LABELS[item.status as BuilderStatus] || item.status || "N/A",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();

  
  worksheet["!cols"] = [
    { wch: 5 },   // #
    { wch: 25 },  // Name
    { wch: 20 },  // Type
    ...(activeTab !== "HARDWARE" ? [{ wch: 25 }] : []), // Specialization
    { wch: 15 },  // Email
    { wch: 15 },  // Phone
    { wch: 15 },  // County
    { wch: 12 },  // subCounty
    { wch: 12 },  // Created
    { wch: 12 },  // Status
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Builders");
  XLSX.writeFile(
    workbook,
    `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`,
  );
};


const exportToPDF = async (
  data: any[],
  filename: string,
  builderType: string,
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
    ...(builderType !== "HARDWARE" ? [item.specialization || "N/A"] : []),
    item.email || item.Email || "N/A",
    item.phoneNo || item.phone || item.phoneNumber || "N/A",
    item.county || "N/A",
    STATUS_LABELS[item.status as BuilderStatus] || item.status || "N/A",
  ]);

  try {
    await generatePDF(
      tableData,
      filename,
      "BUILDERS REPORT",
      ["#", "Name", "Type", ...(builderType !== "HARDWARE" ? ["Specialization"] : []), "Email", "Phone", "County", "Status"],
      builderType,
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
    skill: "",
    specialization: "",
    search: "",
  });
  const [builders, setBuilders] = useState<any[]>([]);
  const [deletedBuilders, setDeletedBuilders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  
  
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const navigate = useNavigate();

  const fetchBuilders = async () => {
    setLoading(true);
    setError(null);
    try {
      const [buildersRes, deletedRes] = await Promise.all([
        getAllProviders(axiosInstance),
        getDeletedBuilders(axiosInstance)
      ]);
      setBuilders(Array.isArray(buildersRes.data) ? buildersRes.data : []);
      setDeletedBuilders(Array.isArray(deletedRes.data) ? deletedRes.data : []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch builders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilders();
  }, []);
  
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
  const filteredBuilders = (activeTab === "TRASH" ? deletedBuilders : builders).filter((builder) => {
    const matchesTab = activeTab === "TRASH" ? true : builder?.userType === activeTab;
    const matchesName =
      !filters.name ||
      builder?.firstName?.toLowerCase().includes(filters.name.toLowerCase()) ||
      builder?.lastName?.toLowerCase().includes(filters.name.toLowerCase()) ||
      builder?.organizationName?.toLowerCase().includes(filters.name.toLowerCase());
    const matchesPhone =
      !filters.phone || 
      (builder?.phoneNumber?.toLowerCase().includes(filters.phone.toLowerCase()) || 
       builder?.phone?.toLowerCase().includes(filters.phone.toLowerCase()) || 
       builder?.phoneNo?.toLowerCase().includes(filters.phone.toLowerCase()));
    const matchesCounty =
      !filters.county ||
      builder?.county?.toLowerCase() === filters.county.toLowerCase();
    const matchesVerificationStatus =
      !filters.verificationStatus ||
      builder?.status === filters.verificationStatus;
    const matchesSkill =
      !filters.skill ||
      (builder?.skills || builder?.profession || builder?.contractorTypes || builder?.hardwareTypes || "")
        .toLowerCase()
        .includes(filters.skill.toLowerCase());
    const matchesSpecialization =
      !filters.specialization ||
      (builder?.specialization || "")
        .toLowerCase()
        .includes(filters.specialization.toLowerCase());

    const searchValue = filters?.search?.toLowerCase() || "";
    const matchesSearch =
      !searchValue ||
      builder?.firstName?.toLowerCase().includes(searchValue) ||
      builder?.lastName?.toLowerCase().includes(searchValue) ||
      builder?.phoneNumber?.toLowerCase().includes(searchValue) ||
      builder?.phone?.toLowerCase().includes(searchValue) ||
      builder?.phoneNo?.toLowerCase().includes(searchValue) ||
      builder?.email?.toLowerCase().includes(searchValue) ||
      builder?.organizationName?.toLowerCase().includes(searchValue) ||
      builder?.skills?.toLowerCase().includes(searchValue) ||
      builder?.profession?.toLowerCase().includes(searchValue) ||
      builder?.contractorTypes?.toLowerCase().includes(searchValue) ||
      builder?.hardwareTypes?.toLowerCase().includes(searchValue) ||
      builder?.specialization?.toLowerCase().includes(searchValue) ||
      builder?.county?.toLowerCase().includes(searchValue);

    return (
      matchesTab &&
      matchesName &&
      matchesPhone &&
      matchesCounty &&
      matchesVerificationStatus &&
      matchesSkill &&
      matchesSpecialization &&
      matchesSearch
    );
  });

  const totalPages = Math.ceil(filteredBuilders.length / rowsPerPage);
  const paginatedData = filteredBuilders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

 

  const isSignedUpButIncomplete = (
    status: BuilderStatus,
    completionStatus: Record<string, CompletionStatus>,
  ) => {
    if (status !== "SIGNED_UP") return false;

    return Object.values(completionStatus).some(
      (section) => section === "incomplete",
    );
  };
  const getSmartStatusLabel = (
    status: BuilderStatus,
    completionStatus: Record<string, CompletionStatus>,
  ) => {
    if (status === "SIGNED_UP") {
      const hasIncomplete = Object.values(completionStatus).some(
        (s) => s === "incomplete",
      );

      return hasIncomplete ? "Complete Your Profile" : "Pending Verification";
    }

    return STATUS_LABELS[status];
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b p-4 rounded-lg">
        {/* Header Section */}
        <div className="flex flex-col gap-4">
          {/* Navigation tabs */}
          <div className="flex flex-wrap lg:flex-nowrap gap-2 w-full lg:w-3/4">
            {navItems.map((nav) => (
              <button
                key={nav.name}
                type="button"
                onClick={() => {
                  setActiveTab(nav.name);
                  setCurrentPage(1);
                }}
                className={`flex-1 px-4 py-2 rounded-md font-semibold text-center transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm flex items-center justify-center gap-2 ${
                  activeTab === nav.name
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
                    <span>({deletedBuilders.length})</span>
                  </>
                ) : (
                  <>
                    {nav.name} ({builders.filter((b) => b.userType === nav.name).length})
                  </>
                )}
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
                      exportToExcel(filteredBuilders, "builders", activeTab);
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
                    {activeTab !== "HARDWARE" && (
                      <th className="px-3 py-3 text-left font-semibold whitespace-nowrap">
                        Specialization
                      </th>
                    )}
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
                        navigate(
                          `/dashboard/profile/${row.id || rowIndex}/${
                            row.userType || activeTab
                          }`,
                          {
                            state: {
                              userData: row,
                              userType: row.userType || activeTab,
                            },
                          },
                        )
                      }}
                    >
                      <td className="px-3 py-4 font-medium text-gray-800">
                        {(currentPage - 1) * rowsPerPage + rowIndex + 1}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
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
                      {activeTab !== "HARDWARE" && (
                        <td className="px-4 py-4 whitespace-nowrap">
                          {row.specialization || "N/A"}
                        </td>
                      )}
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
                      <td className="px-3 py-4 whitespace-nowrap b">
                          {(() => {
                          const status = row.status?.toLowerCase() || "unknown";
                          const statusStyles = {
                            verified: "bg-green-100 text-green-800 border-green-300",
                            pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
                            complete: "bg-blue-100 text-blue-800 border-blue-300",
                            incomplete: "bg-gray-100 text-gray-800 border-gray-300",
                            signed_up: "bg-purple-100 text-purple-800 border-purple-300",
                            unverified: "bg-orange-100 text-orange-800 border-orange-300",
                            suspended: "bg-red-100 text-red-800 border-red-300",
                            blacklisted: "bg-red-200 text-red-900 border-red-400",
                            deleted: "bg-gray-300 text-gray-900 border-gray-400",
                          };
                          const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.incomplete;
                          return (
                            <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold border ${style}`}>
                              {status}
                            </span>
                          );
                        })()}
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

      <BuilderFilters
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        updateFilter={updateFilter}
        activeTab={activeTab}
        axiosInstance={axiosInstance}
      />

      {/* Move to Trash Modal */}
      {isTrashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Move Builder To Trash</h3>
              <p className="text-sm text-gray-500 mb-6">
                Add a reason and notification email before deleting this builder.
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
                    placeholder="builder@example.com"
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
                      toast.success("Builder moved to trash successfully");
                      setIsTrashModalOpen(false);
                      setDeleteReason("");
                      fetchBuilders();
                    } catch (err: any) {
                      toast.error(err.message || "Failed to move builder to trash");
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Permanently Purge Builder?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This action is irreversible. All archived information for this builder will be permanently removed from the database.
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
                    toast.success("Builder permanently purged");
                    setIsPurgeModalOpen(false);
                    fetchBuilders();
                  } catch (err: any) {
                    toast.error(err.message || "Failed to purge builder");
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

      {/* Restore User Modal */}
      {isRestoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Restore Builder?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will restore <span className="font-semibold">{selectedUser?.firstName} {selectedUser?.lastName}</span> with status set to <span className="font-semibold">UNVERIFIED</span>. You can re-verify them after.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-blue-800">
                ℹ️ All profile data, documents, and history will be restored. The user will need admin approval to become active again.
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
                    toast.success("Builder restored successfully");
                    setIsRestoreModalOpen(false);
                    fetchBuilders();
                  } catch (err: any) {
                    toast.error(err.message || "Failed to restore builder");
                  } finally {
                    setIsActionLoading(false);
                  }
                }}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isActionLoading ? "Restoring..." : "Restore Builder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
