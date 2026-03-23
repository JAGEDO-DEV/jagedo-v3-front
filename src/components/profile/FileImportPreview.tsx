//@ts-nocheck
import { useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import ParsedPreviewTable from "./ParsedPreviewTable";

interface FileUploadPageProps {
  onBack: () => void;
}

export default function FileUploadPage({ onBack }: FileUploadPageProps) {
  const [files, setFiles] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const expectedHeaders = [
    "Number", "Thumbnail", "Product Name", "Product Description", "Price",
    "SKU", "BID", "Material", "Size", "Color", "Region", "UOM"
  ];

  const preventDefaults = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const generateTemplate = () => {
    const templateData = [
      ["Number", "Thumbnail", "Product Name", "Product Description", "Price", "SKU", "BID", "Material", "Size", "Color", "Region", "UOM"],
      [1, "https://example.com/image.jpg", "Product Name", "Description", 5000, "SKU-001", "BID-001", "Material", "Size", "Color", "1", "Pieces"]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "product-template.xlsx");
    toast.success("Template downloaded!");
  };

  const isValidFile = (file) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    return file && allowedTypes.includes(file.type);
  };

  const validateFileStructure = async (file) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (!jsonData || jsonData.length === 0) {
        return false;
      }

      const headers = jsonData[0]?.map((h) => String(h).trim());
      const isValid = expectedHeaders.every((h, i) => headers[i] === h);

      return isValid;
    } catch (error) {
      console.error("File validation error:", error);
      return false;
    }
  };

  const handleFiles = async (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error("No file selected");
      return;
    }

    const file = selectedFiles[0];
    
    if (!isValidFile(file)) {
      toast.error("Invalid file type. Only .xlsx and .csv files are allowed.");
      return;
    }

    const isValidStructure = await validateFileStructure(file);
    if (!isValidStructure) {
      toast.error("File structure or headers do not match the required template.");
      return;
    }

    setFiles([file]);
    setShowPreview(true);
    toast.success("File uploaded successfully! Please review the data.");
  };

  const handleDrop = (e) => {
    preventDefaults(e);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleBrowse = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
  };

  const handleReset = () => {
    setFiles([]);
    setShowPreview(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      {showPreview && files.length > 0 ? (
        <div className="w-full max-w-6xl bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={onBack}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              Back
            </button>
            <h2 className="text-2xl font-bold text-gray-800">Preview Imported Data</h2>
            <button
              onClick={handleReset}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              Upload Another File
            </button>
          </div>
          <ParsedPreviewTable file={files[0]} onSubmitSuccess={onBack} />
        </div>
      ) : (
        <div className="w-full max-w-xl">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="mb-4 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            ← Back
          </button>

          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 bg-white text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={preventDefaults}
            onDragEnter={preventDefaults}
            onDragLeave={preventDefaults}
          >
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-4m0-4v4m0-8a8 8 0 110 16 8 8 0 010-16z" />
            </svg>

            <p className="text-gray-700 font-semibold mb-2">Drag and drop your file here</p>
            <p className="text-gray-500 mb-4">or</p>

            <label className="inline-block px-6 py-3 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer font-medium transition">
              Browse Files
              <input
                type="file"
                multiple={false}
                onChange={handleBrowse}
                className="hidden"
                accept=".xlsx,.csv"
              />
            </label>

            <button
              onClick={generateTemplate}
              className="mt-6 inline-block px-6 py-3 bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg font-medium transition"
            >
              ↓ Download Template
            </button>

            <p className="mt-6 text-sm text-gray-500">
              Supported formats: .xlsx and .csv
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
