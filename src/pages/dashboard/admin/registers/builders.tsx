import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { kenyanLocations } from "@/data/kenyaLocations";
import {
  mockBuilders,
  resolveStatus,
  STATUS_LABELS,
  type Builder,
  type BuilderStatus,
} from "@/data/mockBuilders";
import { StatusBadge } from "@/pages/dashboard/admin/registers/StatusBadge";
import { BuilderFilters } from "@/pages/dashboard/admin/registers/BuilderFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

type UserType = "FUNDI" | "PROFESSIONAL" | "CONTRACTOR" | "HARDWARE";

const navItems: { name: UserType }[] = [
  { name: "FUNDI" },
  { name: "PROFESSIONAL" },
  { name: "CONTRACTOR" },
  { name: "HARDWARE" },
];

const getTypeColumnHeader = (type: UserType): string => {
  switch (type) {
    case "FUNDI":
      return "Skill";
    case "PROFESSIONAL":
      return "Profession";
    case "CONTRACTOR":
      return "Contractor Type";
    case "HARDWARE":
      return "Hardware Type";
  }
};

export default function BuildersAdmin() {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState<UserType>("FUNDI");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    phone: "",
    county: "",
    verificationStatus: "",
    search: "",
  });
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Clear localStorage and load fresh mock data
  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      // Force refresh with mock data to ensure proper status values
      localStorage.setItem("builders", JSON.stringify(mockBuilders));
      setBuilders(mockBuilders);
    } catch (err) {
      setError("Failed to load builders");
      setBuilders(mockBuilders);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Refresh builders when page comes back into focus ---
  useEffect(() => {
    const handleFocus = () => {
      try {
        const stored = JSON.parse(localStorage.getItem("builders") || "null");
        if (stored && Array.isArray(stored) && stored.length > 0) {
          setBuilders(stored);
        }
      } catch (err) {
        console.error("Failed to refresh builders:", err);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const filteredBuilders = builders.filter((builder) => {
    const matchesTab = builder.userType === activeTab;
    const matchesName =
      !filters.name ||
      builder.firstName?.toLowerCase().includes(filters.name.toLowerCase()) ||
      builder.lastName?.toLowerCase().includes(filters.name.toLowerCase()) ||
      builder.organizationName?.toLowerCase().includes(filters.name.toLowerCase());
    const matchesPhone = !filters.phone || builder.phoneNumber?.includes(filters.phone);
    const matchesCounty =
      !filters.county || builder.county?.toLowerCase() === filters.county.toLowerCase();

    const status = resolveStatus(builder);
    const matchesVerificationStatus =
      !filters.verificationStatus ||
      STATUS_LABELS[status] === filters.verificationStatus;

    const searchValue = filters.search?.toLowerCase() || "";
    const matchesSearch =
      !searchValue ||
      builder.firstName?.toLowerCase().includes(searchValue) ||
      builder.lastName?.toLowerCase().includes(searchValue) ||
      builder.organizationName?.toLowerCase().includes(searchValue) ||
      builder.phoneNumber?.toLowerCase().includes(searchValue) ||
      builder.county?.toLowerCase().includes(searchValue);

    return matchesTab && matchesName && matchesPhone && matchesCounty && matchesVerificationStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredBuilders.length / rowsPerPage);
  const paginatedData = filteredBuilders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const getBuilderName = (builder: Builder): string => {
    if (builder.organizationName) return builder.organizationName;
    return [builder.firstName, builder.lastName].filter(Boolean).join(" ") || "N/A";
  };

  const getBuilderTypeValue = (builder: Builder): string => {
    return builder.skills || builder.profession || builder.contractorTypes || builder.hardwareTypes || "N/A";
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b p-4">
    
      {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">

          {/* Navigation tabs */}
          <div className="flex flex-nowrap gap-2 w-full overflow-x-auto md:overflow-visible">
            {navItems.map((nav) => {
              const count = builders.filter((b) => b.userType === nav.name).length;
              return (
                <Button
                  key={nav.name}
                  type="button" 

                  // variant={activeTab === nav.name ? "default" : "secondary"}
                  onClick={() => {
                    setActiveTab(nav.name);
                    setCurrentPage(1);
                  }}
                     className={`px-2 md:px-18 py-2 rounded-md font-semibold text-center transition-colors duration-200 border focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${activeTab === nav.name
                  ? "bg-blue-900 text-white border-blue-900"
                  : "bg-blue-100 text-blue-900 border-blue-100 hover:bg-blue-200"
                  }`}
              >
                  {nav.name} ({count})
                </Button>
              );
            })}
          </div>

         <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm shadow-sm whitespace-nowrap w-full md:w-auto"
          >
            Filters
          </button>
      </div>     
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Card className="mx-auto bg-white border border-gray-200 rounded-lg shadow-md p-4">
          <CardContent className="p-4 sm:p-6">
            {/* Search bar */}
            <div className="flex justify-end mb-4">
            <div className="relative w-full sm:w-auto">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
              </span>
             <input type="text" placeholder="Search builders..." value={filters?.search} onChange={(e) => updateFilter("search", e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            </div>

            {/* Table */}
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
                <Table className="min-w-full bg-white text-sm">
                  <TableHeader className="bg-gray-50 text-gray-600">
                    <TableRow className="border-b border-gray-200">
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
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-100">
                    {paginatedData.map((row, rowIndex) => {
                      const status = resolveStatus(row);
                      return (
                        <TableRow
                          key={row.id}
                      className="cursor-pointer hover:bg-blue-50 transition-colors"
                          onClick={() =>
                            navigate(`/dashboard/profile/${row.id}/${row.userType}`, {
                        state: { userData: row, userType: row.userType || activeTab }
                            })
                          }
                        >
                          <TableCell className="px-3 py-4 font-medium text-gray-800">
                            {(currentPage - 1) * rowsPerPage + rowIndex + 1}
                          </TableCell>
                          <TableCell className="px-3 py-4 whitespace-nowrap">{getBuilderName(row)}</TableCell>
                          <TableCell className="px-3 py-4 whitespace-nowrap">{getBuilderTypeValue(row)}</TableCell>
                          <TableCell className="px-3 py-4 whitespace-nowrap">{row.email || "N/A"}</TableCell>
                          <TableCell className="px-3 py-4 whitespace-nowrap">{row.phoneNumber || "N/A"}</TableCell>
                          <TableCell className="px-3 py-4 whitespace-nowrap">{row.county || "N/A"}</TableCell>
                          <TableCell className="px-3 py-4 whitespace-nowrap">{row.subCounty || "N/A"}</TableCell>
                          <TableCell className="px-3 py-4 whitespace-nowrap">
                            {row.createdAt
                              ? new Date(row.createdAt).toLocaleDateString("en-GB")
                              : "N/A"}
                          </TableCell>
                          <TableCell >
                            <StatusBadge status={status} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Pagination */}
            {!loading && filteredBuilders.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-muted-foreground gap-4">
                <div className="flex items-center gap-2">
                  <span>Rows per page:</span>
                  <Select
                    value={rowsPerPage.toString()}
                    onValueChange={(value) => {
                      setRowsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 20, 30].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters Sidebar */}
      <BuilderFilters
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        updateFilter={updateFilter}
      />
    </div>
  );
}

