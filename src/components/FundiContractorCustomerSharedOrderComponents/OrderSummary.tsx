import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getProvierOrderRequestsById, getOrderRequestsById } from "@/api/orderRequests.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { Loader } from "lucide-react";
import { useGlobalContext } from "@/context/GlobalProvider";

interface SummaryData {
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
}

const OrderSummary = () => {
  const { id } = useParams<{ id: string }>();
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const { user } = useGlobalContext();
  const user_type = user.user_type;
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    const fetchOrderSummary = async () => {
      try {
        setLoading(true);
        const fetchApi = user_type?.toLowerCase() === 'customer'
          ? getOrderRequestsById
          : getProvierOrderRequestsById;
        const response = await fetchApi(axiosInstance, id);

        if (response && response.success) {
          const { subTotal, deliveryFee, totalAmount } = response.data;

          setSummaryData({
            subtotal: subTotal || 0,
            deliveryFee: deliveryFee || 0,
            totalAmount: totalAmount || 0, // Handles the 'null' case from the API
          });
        } else {
          throw new Error(response.message || "Failed to fetch order summary.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
        console.error("Error fetching order summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderSummary();
  }, [id, user_type]); // Added axiosInstance to dependency array

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (typeof amount !== 'number') {
      return typeof amount === 'string' ? amount : 'N/A';
    }
    return `KES ${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin h-10 w-10 text-gray-500" />
      </div>
    );
  }

  if (error || !summaryData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 text-lg">
        <p>{error || "Could not load order summary."}</p>
      </div>
    );
  }

  return (
    <>
      <br className="hidden sm:block" />
      <div className="min-h-screen flex items-start sm:items-center justify-center bg-gray-100 py-2 sm:py-6 md:py-10 px-2 sm:px-0">
        <div className="max-w-6xl w-full mx-auto p-3 sm:p-4 md:p-6 bg-white shadow-md rounded-md flex flex-col space-y-4 sm:space-y-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-600 mt-3 sm:mt-6 mb-3 sm:mb-4 px-1 sm:px-0">
            Order Summary
          </h2>

          <div className="bg-white shadow-md rounded-xl p-4 sm:p-5 md:p-6 border border-gray-200">
            <div className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-600">
              {/* Subtotal Row */}
              <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
                <span className="text-gray-700 font-medium sm:font-normal">Subtotal</span>
                <span className="font-semibold sm:font-medium text-gray-800 text-base sm:text-sm self-start">
                  {formatCurrency(summaryData.subtotal)}
                </span>
              </div>

              {/* Delivery Fee Row */}
              <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
                <span className="text-gray-700 font-medium sm:font-normal">Delivery Fee</span>
                <span className="font-semibold sm:font-medium text-gray-800 text-base sm:text-sm self-start">
                  {summaryData.deliveryFee > 0 ? formatCurrency(summaryData.deliveryFee) : "TBD"}
                </span>
              </div>

              {/* Total Row */}
              <div className="border-t pt-3 sm:pt-4 flex flex-col sm:flex-row sm:justify-between font-bold text-gray-800 text-base sm:text-base space-y-1 sm:space-y-0">
                <span className="text-lg sm:text-base">Total</span>
                <span className="text-lg sm:text-base text-[rgb(0,0,122)] sm:text-gray-800 self-start">
                  {formatCurrency(summaryData.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderSummary;