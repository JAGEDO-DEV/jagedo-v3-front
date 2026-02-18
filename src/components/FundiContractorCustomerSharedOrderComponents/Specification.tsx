/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck
import { TiTick } from "react-icons/ti";
import { getProvierOrderRequestsById, getOrderRequestsById } from "@/api/orderRequests.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { useState, useEffect } from "react";
import { useGlobalContext } from "@/context/GlobalProvider";
import { useParams, useNavigate } from "react-router-dom";
import Loader from "../Loader";

interface Product {
  name: string;
  category: string;
  images: string[];
}

interface Item {
  product: Product;
}

interface Customer {
  username: string;
  estate?: string;
}

interface Seller {
  username: string;
}

interface OrderData {
  customer?: Customer;
  items: Item[];
  createdAt?: string;
  seller?: Seller;
  subTotal: number;
  payments?: any[];
}

const Specification = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>();
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const { user } = useGlobalContext();
  const user_type = user.user_type
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    const fetchOrderData = async () => {
      try {
        setLoading(true);
        const fetchApi = user_type?.toLowerCase() === 'customer'
          ? getOrderRequestsById
          : getProvierOrderRequestsById;
        const response = await fetchApi(axiosInstance, id);

        if (response && response.success) {
          setOrderData(response.data);
        } else {
          throw new Error(response.message || "Failed to fetch order details.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
        console.error("Error fetching order specifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [id, user_type]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 text-lg">
        <p>{error || "Could not load order data."}</p>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString('en-GB');
  };

  const productInfo = orderData.items?.[0]?.product;
  const productImageUrl = productInfo?.images?.[0]; // Safely get the first image URL

  const orderDetails = [
    {
      label: "Product",
      value: productInfo?.name,
    },
    {
      label: "Category",
      value: productInfo?.category,
    },
    {
      label: "Seller",
      value: orderData.seller?.username,
    },
    {
      label: "Price (Subtotal)",
      value: `KES ${orderData.subTotal?.toFixed(2)}`
    },
    { label: "Order Date", value: formatDate(orderData.createdAt) },
  ];

  return (
    <>
      <br className="hidden sm:block" />
      <div className="min-h-screen flex items-start sm:items-center justify-center bg-gray-100 py-2 sm:py-4 md:py-10 px-2 sm:px-4">
        <div className="max-w-6xl w-full mx-auto p-3 sm:p-4 md:p-6 bg-white shadow-md rounded-md flex flex-col space-y-3 sm:space-y-4 md:space-y-6">
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-600 mt-2 sm:mt-3 md:mt-6 mb-2 md:mb-4 px-1 sm:px-0">
            Order Specifications
          </h1>

          <div className="p-3 sm:p-4 md:p-8 my-2 sm:my-3 md:my-6 rounded-xl">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 border-b pb-2 md:pb-4 mb-3 sm:mb-4 md:mb-6">
              Order Details
            </h2>

            <div className="p-3 sm:p-4 md:p-8 my-2 sm:my-3 md:my-6 rounded-xl shadow-lg bg-white hover:shadow-xl transition-all duration-300 border border-gray-200">
              <div className="flex flex-col lg:flex-row lg:justify-between gap-4 lg:gap-8">
                <div className="w-full lg:w-1/2 space-y-3 md:space-y-4">

                  {/* --- ADDED PRODUCT IMAGE DISPLAY --- */}
                  {productImageUrl && (
                    <div className="mb-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <img
                        src={productImageUrl}
                        alt={productInfo?.name || 'Product Image'}
                        className="w-full h-auto max-h-72 object-contain rounded-md"
                      />
                    </div>
                  )}

                  {orderDetails.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col xs:flex-row xs:items-center bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1 xs:space-y-0"
                    >
                      <span className="font-semibold text-gray-800 xs:w-20 sm:w-24 text-sm md:text-base">
                        {item.label}:
                      </span>
                      <span className="text-gray-700 text-sm md:text-base break-words">
                        {item.value || "Not specified"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="w-full lg:w-1/2 lg:pl-8 lg:border-l border-gray-200 space-y-3 sm:space-y-4 mt-4 sm:mt-6 lg:mt-0">
                  {orderData.payments?.length > 0 && (
                    <div className="flex items-center space-x-2 bg-green-50 p-3 md:p-4 rounded-lg cursor-pointer hover:bg-green-100 transition border border-gray-200" onClick={() => navigate(`/receipts/${orderData.payments[orderData.payments.length - 1].id}`)}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 md:h-6 md:w-6 text-green-600 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v6m0 0l-3-3m3 3l3-3m0-6V4m-6 4l3 3 3-3"
                        />
                      </svg>
                      <span className="text-green-700 font-medium text-sm md:text-base">
                        Download Receipt
                      </span>
                    </div>
                  )}

                  <div className="bg-blue-50 p-3 md:p-4 rounded-2xl shadow-md border border-gray-200">
                    <h3 className="text-base sm:text-lg md:text-2xl font-bold text-blue-900">
                      Managed by Jagedo
                    </h3>
                  </div>

                  <div className="bg-blue-50 p-3 md:p-4 rounded-2xl shadow-md border border-gray-200">
                    <h3 className="text-base sm:text-lg md:text-2xl font-bold text-blue-900 mb-2">
                      Package details
                    </h3>
                    <p className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 md:mb-4">
                      Jagedo Oversees
                    </p>

                    <ul className="space-y-2 md:space-y-3 text-gray-700">
                      <li className="flex items-start sm:items-center">
                        <TiTick className="text-green-500 mr-2 text-lg md:text-xl flex-shrink-0 mt-0.5 sm:mt-0" />
                        <span className="text-sm md:text-base leading-relaxed">Arrival time</span>
                      </li>
                      <li className="flex items-start sm:items-center">
                        <TiTick className="text-green-500 mr-2 text-lg md:text-xl flex-shrink-0 mt-0.5 sm:mt-0" />
                        <span className="text-sm md:text-base leading-relaxed">Scope budget</span>
                      </li>
                      <li className="flex items-start sm:items-center">
                        <TiTick className="text-green-500 mr-2 text-lg md:text-xl flex-shrink-0 mt-0.5 sm:mt-0" />
                        <span className="text-sm md:text-base leading-relaxed">Workmanship for a day</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="shadow-md rounded-xl p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 border border-gray-200">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-700 mb-1 sm:mb-2">
              Delivery Address
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              {orderData.customer?.estate || "Address not specified"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Specification;