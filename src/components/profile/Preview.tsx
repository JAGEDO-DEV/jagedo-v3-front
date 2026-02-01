import PropTypes from "prop-types";
import { useState } from "react";

const Preview = ({ productData: { name, price, sku, bid, material, size, color, uom, status }, images, handleEdit, prodDescription, role }) => {
    const elevationLabels = ["Front Elevation", "Back Elevation", "Side Elevation"];
    const [imageList, setImageList] = useState(images || []);

    const handleThumbnailClick = (index) => {
        setImageList((prevImages) => {
            const newImages = [...prevImages];
            const temp = newImages[0];
            newImages[0] = newImages[index];
            newImages[index] = temp;
            return newImages;
        });
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-7xl max-h-[95vh] overflow-y-auto">
                <div className="flex flex-col lg:flex-row">
                    {/* Images Section */}
                    <section className={`w-full bg-gradient-to-br from-gray-50 to-white border-r border-gray-100
                        ${role === "/fundi-portal/products" || role === "/professional/professional-products" ? "lg:w-3/4" : "lg:w-1/2"}`}>
                        <div className="p-8">
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Main Image */}
                                <div className="w-full lg:w-3/4">
                                    {imageList[0] ? (
                                        <div className="relative group overflow-hidden rounded-2xl shadow-lg bg-white p-4">
                                            <img
                                                src={imageList[0].dataUrl}
                                                alt={elevationLabels[0]}
                                                className="w-full h-[500px] object-cover rounded-xl transition-all duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-gray-400 shadow-inner">
                                            <div className="text-center">
                                                <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-lg font-medium">No Image</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Thumbnail Images */}
                                <div className="w-full lg:w-1/4 flex flex-row lg:flex-col gap-4">
                                    {imageList.length > 1 ? (
                                        imageList.slice(1).map((img, index) => (
                                            <div
                                                key={index + 1}
                                                onClick={() => handleThumbnailClick(index + 1)}
                                                className="relative group overflow-hidden rounded-xl cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 bg-white p-2 border-2 border-transparent hover:border-blue-500"
                                            >
                                                <img
                                                    src={img.dataUrl}
                                                    alt={`Thumbnail ${index + 1}`}
                                                    className="w-full h-[150px] object-cover rounded-lg transition-transform duration-300 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-xl" />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="w-full h-[150px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-gray-400 shadow-inner">
                                            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Product Details Section */}
                    <section className="w-full lg:w-1/2">
                        <div className="p-8 flex flex-col h-full">
                            {/* Product Name */}
                            <div className="mb-6">
                                <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-2">Product Name</p>
                                <h1 className="text-3xl font-bold text-gray-900">{name || 'N/A'}</h1>
                            </div>

                            {/* Status */}
                            {status && (
                                <div className="mb-6">
                                    <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-2">Status</p>
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${
                                        status.toLowerCase() === 'complete' || status.toLowerCase() === 'completed'
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-red-500 bg-red-50'
                                    }`}>
                                        {status.toLowerCase() === 'complete' || status.toLowerCase() === 'completed' ? (
                                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                        <span className={`font-bold text-sm ${
                                            status.toLowerCase() === 'complete' || status.toLowerCase() === 'completed'
                                                ? 'text-green-700'
                                                : 'text-red-700'
                                        }`}>
                                            {status}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-gray-200 my-4" />

                            {/* Price */}
                            <div className="mb-6">
                                <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-2">Price</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-[rgb(0,0,112)]">Ksh {price || 'N/A'}</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 my-4" />

                            {/* Product Specifications */}
                            <div className="mb-6">
                                <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-4">Specifications</p>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">SKU</p>
                                        <p className="text-lg font-bold text-gray-900">{sku || 'N/A'}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">BID</p>
                                        <p className="text-lg font-bold text-gray-900">{bid || 'N/A'}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Material</p>
                                        <p className="text-lg font-bold text-gray-900">{material || 'N/A'}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-100">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Size</p>
                                        <p className="text-lg font-bold text-gray-900">{size || 'N/A'}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border border-red-100">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Color</p>
                                        <p className="text-lg font-bold text-gray-900">{color || 'N/A'}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-xl border border-cyan-100">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">UOM</p>
                                        <p className="text-lg font-bold text-gray-900">{uom || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 my-4" />

                            {/* Description */}
                            <div className="mb-6 flex-grow">
                                <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-3">Product Description</p>
                                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                                    <p className="text-gray-700 leading-relaxed">
                                        {prodDescription || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="mt-auto pt-6">
                                <button
                                    onClick={handleEdit}
                                    type="button"
                                    className="w-full bg-gradient-to-r from-[rgb(0,0,112)] to-blue-700 text-white py-4 px-6 font-bold rounded-xl hover:from-blue-700 hover:to-[rgb(0,0,112)] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    <span className="flex items-center justify-center gap-3">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                        </svg>
                                        Back to Edit
                                    </span>
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

Preview.propTypes = {
    productData: PropTypes.shape({
        name: PropTypes.string,
        price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        sku: PropTypes.string,
        bid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        status: PropTypes.string,
        material: PropTypes.string,
        size: PropTypes.string,
        color: PropTypes.string,
        uom: PropTypes.string,
        images: PropTypes.arrayOf(
            PropTypes.shape({
                url: PropTypes.string.isRequired,
            })
        ),
    }).isRequired,
    images: PropTypes.arrayOf(
        PropTypes.shape({
            url: PropTypes.string.isRequired,
            dataUrl: PropTypes.string,
        })
    ).isRequired,
    handleEdit: PropTypes.func.isRequired,
    prodDescription: PropTypes.string.isRequired,
    saveProduct: PropTypes.func.isRequired,
    role: PropTypes.string.isRequired,
};

export default Preview;