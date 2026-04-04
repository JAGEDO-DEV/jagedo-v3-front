//@ts-nocheck
import React, { useState } from "react";
import PropTypes from "prop-types";
import * as XLSX from "xlsx";
import { toast } from "react-hot-toast";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { bulkCreateProducts } from "@/api/products.api";
import { useGlobalContext } from "@/context/GlobalProvider";

// const expectedHeaders = [
//   "Number", "Thumbnail", "Product Name", "Product Description", "Price",
//   "SKU", "BID", "Material", "Size", "Color", "Region", "UOM"
// ];

const ParsedPreviewTable = ({ file, onSubmitSuccess }) => {
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    price: "",
    sku: "",
    bid: "",
    images: [],
  });
  const { user } = useGlobalContext();
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

  React.useEffect(() => {
    const parseFile = async () => {
      try {
        const data = await file.arrayBuffer(); //reads file to binary data suitable for parsing with xlsx

        // parse the binary data into a workbook object.
        const workbook = XLSX.read(data, { type: "array" });

        // Get the first sheet from the workbook (assuming that's the one with relevant data).
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // Convert the whole sheet (column names & remaining data) to json array
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const headers = jsonData[0].map(h => h?.trim()); // defines column names
        const rows = jsonData.slice(1); // defines the rest of the data

        const headerIndexMap = {
          name: headers.indexOf("Product Name"),
          price: headers.indexOf("Price"),
          sku: headers.indexOf("SKU"),
          bid: headers.indexOf("BID"),
          thumbnail: headers.indexOf("Thumbnail"),
        };

        setProducts((prev) => {
          const nextId = prev.length > 0 ? Math.max(...prev.map((p) => p.id)) + 1 : 1;
          const newlyMapped = rows.map((row, i) => ({
            id: nextId + i,
            name: row[headerIndexMap.name],
            price: row[headerIndexMap.price],
            sku: row[headerIndexMap.sku],
            bid: row[headerIndexMap.bid],
            status: "Drafts",
            images: row[headerIndexMap.thumbnail]
              ? [
                  {
                    dataUrl: row[headerIndexMap.thumbnail],
                    label: row[headerIndexMap.name] || `Image ${i + 1}`,
                  },
                ]
              : [],
          }));
          return [...prev, ...newlyMapped];
        });


      } catch (err) {
        console.error("Error parsing file:", err);
      }
    };

    if (file) parseFile();

  }, [file]);

  const handleDelete = (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this product?");
    if (confirmed) {
      const updatedList = products.filter((product) => product.id !== id);
      setProducts(updatedList);
      localStorage.setItem("products", JSON.stringify(updatedList));
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setEditFormData({
      name: product.name,
      price: product.price,
      sku: product.sku,
      bid: product.bid,
      images: product.images || [],
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage = {
          dataUrl: event.target?.result,
          label: file.name,
        };
        setEditFormData((prev) => ({
          ...prev,
          images: [newImage, ...prev.images],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index) => {
    setEditFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSaveEdit = () => {
    if (!editFormData.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!editFormData.price || isNaN(parseFloat(editFormData.price))) {
      toast.error("Valid price is required");
      return;
    }

    const updatedProducts = products.map((p) =>
      p.id === editingId
        ? {
            ...p,
            name: editFormData.name,
            price: editFormData.price,
            sku: editFormData.sku,
            bid: editFormData.bid,
            images: editFormData.images,
          }
        : p
    );

    setProducts(updatedProducts);
    localStorage.setItem("products", JSON.stringify(updatedProducts));
    setEditingId(null);
    toast.success("Product updated successfully");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({
      name: "",
      price: "",
      sku: "",
      bid: "",
      images: [],
    });
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (products.length === 0) {
      toast.error("No products to submit");
      return;
    }

    setIsSubmitting(true);
    try {
      // Transform products to match API expectations
      const productsToUpload = products.map((p) => ({
        name: p.name,
        description: p.name, // Using name as description since it's not in the template
        customPrice: parseFloat(p.price) || 0,
        sku: p.sku,
        bId: p.bid,
        type: user.userType,
        category: "", // Will need to be filled from template
        sellerId: user.id,
        images: p.images?.map((img) => img.dataUrl).filter(Boolean) || [],
        regionId: "",
      }));

      await bulkCreateProducts(axiosInstance, productsToUpload);
      toast.success(`Successfully uploaded ${products.length} products!`);
      onSubmitSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload products");
      console.error("Upload error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse rounded-lg overflow-hidden table-auto">
        <thead>
          <tr className="bg-gray-300 text-gray-700">
            <th className="border border-gray-300/50 p-4 text-lg">No</th>
            <th className="border border-gray-300/50 p-4 text-lg">Thumbnail</th>
            <th className="border border-gray-300/50 p-4 text-lg">Name</th>
            <th className="border border-gray-300/50 p-4 text-lg">Price</th>
            <th className="border border-gray-300/50 p-4 text-lg">SKU</th>
            <th className="border border-gray-300/50 p-4 text-lg">BID</th>
            <th className="border border-gray-300/50 p-4 text-lg">Status</th>
            <th className="border border-gray-300/50 p-4 text-lg">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, index) => (
            <tr
              key={index}
              className="border-b-2 border-gray-300 bg-gray-50 hover:bg-gray-200 transition duration-300 hover:cursor-pointer"
            >
              <td className="border border-gray-300/30 p-4 text-lg">{index + 1}</td>
              <td className="flex justify-center border border-gray-300/30 p-4">
                {p.images && p.images.length > 0 ? (
                  <img
                    src={p.images[0].dataUrl}
                    alt={`${p.images[0].label} thumbnail`}
                    className="w-14 h-14 object-cover rounded-full border"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center text-xs text-gray-500">
                    No Image
                  </div>
                )}
              </td>
              <td className="border border-gray-300/30 p-4 text-lg">{p.name}</td>
              <td className="border border-gray-300/30 p-4 text-lg">KES {Number(p.price).toLocaleString("en-US")}</td>
              <td className="border border-gray-300/30 p-4 text-lg">{p.sku}</td>
              <td className="border border-gray-300/30 p-4 text-lg">{p.bid}</td>
              <td className="border border-gray-300/30 p-4 font-semibold text-lg">
                {p.status}
              </td>
              <td className="p-2 align-middle">
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(p)}
                    className="text-white bg-[rgb(0,0,112)] py-2 px-3 rounded-lg cursor-pointer hover:bg-blue-900 transition"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="text-white bg-red-800 py-2 px-3 rounded-lg cursor-pointer hover:bg-red-900 transition"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center py-4 text-gray-500">
                No products yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Edit Modal */}
      {editingId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Product</h2>

            <div className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => handleEditFormChange("name", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter product name"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Price (KES) *
                </label>
                <input
                  type="number"
                  value={editFormData.price}
                  onChange={(e) => handleEditFormChange("price", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter price"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* SKU */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  value={editFormData.sku}
                  onChange={(e) => handleEditFormChange("sku", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter SKU"
                />
              </div>

              {/* BID */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  BID
                </label>
                <input
                  type="text"
                  value={editFormData.bid}
                  onChange={(e) => handleEditFormChange("bid", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter BID"
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Product Images
                </label>

                {/* Image Upload Input */}
                <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                  <span className="text-gray-600 font-medium">+ Add Images</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {/* Current Images */}
                {editFormData.images && editFormData.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {editFormData.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img.dataUrl}
                          alt={img.label}
                          className="w-full h-20 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="flex-1 bg-gray-400 text-white font-semibold py-2 rounded-lg hover:bg-gray-500 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-4 justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || products.length === 0}
          className="bg-green-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            `Submit ${products.length} Product${products.length !== 1 ? "s" : ""}`
          )}
        </button>
      </div>
    </div>
  );
};
ParsedPreviewTable.propTypes = {
  file: PropTypes.shape({
    arrayBuffer: PropTypes.func.isRequired,
  }).isRequired,
  onSubmitSuccess: PropTypes.func,
};

export default ParsedPreviewTable;
