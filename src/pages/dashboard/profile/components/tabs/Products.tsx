
import ProductUploadForm from "./AdminProductUploadForm";
import FileImportButton from "@/components/profile/FileImportButton.tsx";
import FileUploadPage from "@/components/profile/FileImportPreview.tsx";
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getProductsBySeller, deleteProduct } from "@/api/products.api";
import {
  ShoppingBagIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import {
  Search,
  Plus,
  Filter,
  Upload,
  Download,
  Trash2,
  Pencil,
  Trash,
} from "lucide-react";
import { useGlobalContext } from "@/context/GlobalProvider";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import Loader from "@/components/Loader";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";

const ShopAppPage = ({ userData, userType }) => {
  const profileData = userData; 
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState("default");
  const [products, setProducts] = useState([]);
  const [localDrafts, setLocalDrafts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState(new Set());

  const { user } = useGlobalContext();
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

  const fetchSellerAndLocalProducts = async () => {
    const targetId = profileData?.id || user?.id;
    if (!targetId) return;

    setIsLoading(true);
    console.log("Fetching products for target user:", targetId);
    try {
      const response = await getProductsBySeller(axiosInstance, targetId);
      console.log("API Response:", response);
      const fetchedProducts =
        response.data || response.hashSet || response.items || [];
      setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);

      const savedDrafts = JSON.parse(
        localStorage.getItem("jagedo_product_drafts") || "[]",
      );
      console.log("Local Drafts:", savedDrafts);
      setLocalDrafts(Array.isArray(savedDrafts) ? savedDrafts.filter((d: any) => d.sellerId === targetId) : []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === "default") {
      fetchSellerAndLocalProducts();
    }
  }, [currentView, user?.id, profileData?.id]);

  
  const showCreateView = () => {
    navigate('?'); 
    setCurrentView('create');
  };
  const showImportView = () => setCurrentView('import');
  const showDefaultView = () => {
    navigate('?'); 
    setCurrentView('default');
  };

  const handleEdit = (productId: string, isDraft: boolean = false) => {
    navigate(`?edit=true&id=${productId}${isDraft ? "&draft=true" : ""}`);
    setCurrentView("create"); 
  };

  const handleDelete = async (productId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone.",
      )
    )
      return;

    try {
      await deleteProduct(axiosInstance, productId);
      toast.success("Product deleted successfully");
      fetchSellerAndLocalProducts(); 
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    }
  };

  const handleDeleteDraft = (draftId: string) => {
    if (!window.confirm("Are you sure you want to discard this local draft?"))
      return;

    const savedDrafts = JSON.parse(
      localStorage.getItem("jagedo_product_drafts") || "[]",
    );
    const updatedDrafts = savedDrafts.filter((d: any) => d.id !== draftId);
    localStorage.setItem(
      "jagedo_product_drafts",
      JSON.stringify(updatedDrafts),
    );
    setLocalDrafts(updatedDrafts);
    toast.success("Draft discarded");
  };

  const viewTitles = {
    default: 'Manage Product Catalog',
    create: 'Add a New Product',
    import: 'Batch Import Products'
  };

  const isApproved = profileData?.status === "VERIFIED";

  const getFilteredItems = () => {
    const combined = [
      ...localDrafts.map((d: any) => ({
        ...d,
        id: d.id,
        name: d.formData?.name || "Untitled Draft",
        description: d.formData?.description || "",
        price: d.formData?.price || 0,
        sku: d.formData?.sku || "N/A",
        productCode: d.formData?.productCode || "N/A",
        images: d.uploadedImages?.map((img: any) => img.url) || [],
        status: "Draft",
        active: false,
        isDraft: true,
      })),
      ...products.map((p: any) => ({
        ...p,
        status: p.active ? "Active" : "Pending",
        isDraft: false,
      })),
    ];

    return combined.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        [item.name, item.sku, item.productCode]
          .some((v) => v?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const filteredItems = getFilteredItems();

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.size} selected items? This action cannot be undone.`,
      )
    )
      return;

    setIsLoading(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      const serverIds = idsToDelete.filter((id) =>
        products.some((p: any) => p.id === id),
      );
      const draftIds = idsToDelete.filter((id: string) =>
        localDrafts.some((d: any) => d.id === id),
      );

      
      for (const id of serverIds) {
        try {
          await deleteProduct(axiosInstance, id as string);
        } catch (e) {
          console.error(`Failed to delete server product ${id}`, e);
        }
      }

      
      if (draftIds.length > 0) {
        const savedDrafts = JSON.parse(
          localStorage.getItem("jagedo_product_drafts") || "[]",
        );
        const updatedDrafts = savedDrafts.filter(
          (d: any) => !draftIds.includes(d.id),
        );
        localStorage.setItem(
          "jagedo_product_drafts",
          JSON.stringify(updatedDrafts),
        );
      }

      toast.success(`Successfully deleted ${selectedIds.size} items`);
      setSelectedIds(new Set());
      fetchSellerAndLocalProducts();
    } catch (error) {
      toast.error("An error occurred during batch deletion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    const itemsToExport =
      selectedIds.size > 0
        ? filteredItems.filter((item) => selectedIds.has(item.id))
        : filteredItems;

    if (itemsToExport.length === 0) {
      toast.error("No products to export");
      return;
    }

    const headers = [
      "No",
      "Name",
      "Description",
      "Price (KES)",
      "SKU",
      "Product Code",
      "Status",
    ];
    const csvRows = [
      headers.join(","),
      ...itemsToExport.map((item, index) =>
        [
          index + 1,
          `"${(item.name || "").replace(/"/g, '""')}"`,
          `"${(item.description || "").replace(/"/g, '""')}"`,
          item.price || item.customPrice || item.basePrice || 0,
          `"${item.sku || "N/A"}"`,
          `"${item.productCode || "N/A"}"`,
          item.status,
        ].join(","),
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `jagedo_products_export_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exporting CSV file...");
  };
  console.log("Filtered Items:", filteredItems);

  const renderCurrentView = () => {
    switch (currentView) {
      case "create":
        return (
          <ProductUploadForm
            onCancel={showDefaultView}
            targetUser={userData}
            initialType={userType}
          />
        );

      case "import":
        return <FileUploadPage onBack={showDefaultView} />;

      case "default":
      default:
        return (
          <div className="space-y-6 animate-fade-in p-2">
            {profileData ? (
              <>
                {/* Header Section */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">
                      Products
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Manage all shop products, inventory, and pricing.
                    </p>
                  </div>
                </div>

                {/* Category Tags */}
                <div className="w-full flex gap-2 overflow-x-auto pb-2">
                  <button
                    type="button"
                    disabled={(userType || profileData?.userType) !== "HARDWARE"}
                    className={`flex-1 min-w-[120px] rounded-lg border px-4 py-3 text-sm font-medium transition ${
                      (userType || profileData?.userType) === "HARDWARE"
                        ? "text-white border-blue-900 bg-blue-900"
                        : "border-slate-200 bg-slate-200 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    Hardware
                  </button>
                  <button
                    type="button"
                    disabled={(userType || profileData?.userType) !== "FUNDI"}
                    className={`flex-1 min-w-[120px] rounded-lg border px-4 py-3 text-sm font-medium transition ${
                      (userType || profileData?.userType) === "FUNDI"
                        ? "text-white border-blue-900 bg-blue-900"
                        : "border-slate-200 bg-slate-200 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    Custom Products
                  </button>
                  <button
                    type="button"
                    disabled={(userType || profileData?.userType) !== "PROFESSIONAL"}
                    className={`flex-1 min-w-[120px] rounded-lg border px-4 py-3 text-sm font-medium transition ${
                      (userType || profileData?.userType) === "PROFESSIONAL"
                        ? "text-white border-blue-900 bg-blue-900"
                        : "border-slate-200 bg-slate-200 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    Designs
                  </button>
                  <button
                    type="button"
                    disabled={(userType || profileData?.userType) !== "CONTRACTOR"}
                    className={`flex-1 min-w-[120px] rounded-lg border px-4 py-3 text-sm font-medium transition ${
                      (userType || profileData?.userType) === "CONTRACTOR"
                        ? "text-white border-blue-900 bg-blue-900"
                        : "border-slate-200 bg-slate-200 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    Hire of Machinery
                  </button>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border bg-background shadow-xs h-9 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-900/20"
                    >
                      <option value="All">Status: All</option>
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={showImportView}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border bg-background shadow-sm h-9 px-4 py-2 gap-2 hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Import
                    </button>
                    <button
                      onClick={handleExport}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border bg-background shadow-sm h-9 px-4 py-2 gap-2 hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                    <button
                      onClick={handleBatchDelete}
                      disabled={selectedIds.size === 0 || isLoading}
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border shadow-sm h-9 px-4 py-2 gap-2 transition-colors ${
                        selectedIds.size === 0
                          ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                          : "bg-red-50 text-red-700 border-red-100 hover:bg-red-100"
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Batch ({selectedIds.size})
                    </button>
                    <button
                      onClick={showCreateView}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium text-white shadow-sm h-9 px-4 py-2 gap-2 border-blue-900 bg-blue-900 hover:bg-blue-800 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Product
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by Name, SKU, Product Code"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900/20 focus-visible:ring-offset-2 pl-9"
                  />
                </div>

                {/* Products Table */}
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Products Inventory
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {filteredItems.length} products found
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={
                                filteredItems.length > 0 &&
                                selectedIds.size === filteredItems.length
                              }
                              onChange={toggleSelectAll}
                              className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 h-4 w-4 transition-all duration-200 cursor-pointer"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            No
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thumb
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price (KES)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SKU
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? (
                          <tr>
                            <td colSpan={9} className="py-10 text-center">
                              <Loader />
                            </td>
                          </tr>
                        ) : filteredItems.length > 0 ? (
                          filteredItems.map((item: any, index: number) => (
                            <tr
                              key={item.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(item.id)}
                                  onChange={() => toggleSelectItem(item.id)}
                                  className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 h-4 w-4 transition-all duration-200 cursor-pointer"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="h-10 w-10 flex-shrink-0">
                                  {item.images && item.images[0] ? (
                                    <img
                                      className="h-10 w-10 rounded-md object-cover border border-gray-100"
                                      src={item.images[0]}
                                      alt=""
                                    />
                                  ) : (
                                    <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center">
                                      <ShoppingBagIcon className="w-5 h-5 text-gray-300" />
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                  {item.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                {parseFloat(
                                  item.customPrice || item.basePrice || 0,
                                ).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                {item.sku}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                {item.productCode}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-tight
                                  ${
                                    item.status === "Active"
                                      ? "bg-green-100 text-green-800"
                                      : item.status === "Draft"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() =>
                                      handleEdit(item.id, item.isDraft)
                                    }
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    title="Edit"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      item.isDraft
                                        ? handleDeleteDraft(item.id)
                                        : handleDelete(item.id)
                                    }
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Delete"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={9}
                              className="py-10 text-center text-muted-foreground"
                            >
                              No products found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="max-w-xl mx-auto space-y-6 text-center py-20">
                <div className="inline-flex p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                  <ShoppingBagIcon className="w-10 h-10 text-yellow-600" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 leading-tight">
                  No Profile Data Found
                </h2>
                <p className="text-gray-500 text-sm font-medium leading-relaxed">
                  We couldn't load your seller profile. Please try refreshing
                  the page or contact support if the issue persists.
                </p>
              </div>
            )}
          </div>
        );
    }
  };

  return <div className="w-full">{renderCurrentView()}</div>;
}

export default ShopAppPage;