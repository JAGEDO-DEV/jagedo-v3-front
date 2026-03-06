//@ts-nocheck
import React, { useState } from "react";
import PropTypes from "prop-types";
import * as XLSX from "xlsx";

// const expectedHeaders = [
//   "Number", "Thumbnail", "Product Name", "Product Description", "Price",
//   "SKU", "BID", "Material", "Size", "Color", "Region", "UOM"
// ];

const ParsedPreviewTable = ({ file }) => {
  const [products, setProducts] = useState([]);

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

        const mappedProducts = rows.map((row, i) => ({
          id: i + 1,
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

        setProducts(mappedProducts);


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
    // setProducts(prev => prev.filter(p => p.id !== id));
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
                    className="text-white bg-[rgb(0,0,112)] py-2 px-3 rounded-lg cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="text-white bg-red-800 py-2 px-3 rounded-lg cursor-pointer"
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
    </div>
  );
};
ParsedPreviewTable.propTypes = {
  file: PropTypes.shape({
    arrayBuffer: PropTypes.func.isRequired,
  }).isRequired,
};

export default ParsedPreviewTable;
