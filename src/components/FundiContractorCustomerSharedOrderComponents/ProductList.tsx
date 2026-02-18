import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getProvierOrderRequestsById, getOrderRequestsById } from "@/api/orderRequests.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { useGlobalContext } from "@/context/GlobalProvider";
import { Loader } from "lucide-react";

// Interface for the nested 'product' object from the API
interface ApiProduct {
  id: number;
  name: string;
  images: string[];
}

// Interface for a single order item from the API, matching the provided JSON
interface OrderItem {
  productName: string;
  quantity: number;
  price: number; // Corresponds to the unit price
  product: ApiProduct; // Nested product details
}

// Interface for the component's internal state (remains the same)
interface Product {
  id: number;
  name: string;
  image: string;
  quantity: number;
  rate: number;
}

const ProductList = () => {
  const { id } = useParams<{ id: string }>();
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const { user } = useGlobalContext();
  const user_type = user.user_type;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    const fetchOrderItems = async () => {
      try {
        setLoading(true);
        const fetchApi = user_type?.toLowerCase() === 'customer'
          ? getOrderRequestsById
          : getProvierOrderRequestsById;
        const response = await fetchApi(axiosInstance, id);

        if (response && response.success) {
          // Correctly map the API response to the component's state
          const mappedProducts = response.data.items.map((item: OrderItem) => ({
            id: item.product.id, // Correct: Use ID from the nested product object
            name: item.productName || 'Unnamed Product',
            // Correct: Safely access the first image from the images array
            image: (item.product.images && item.product.images.length > 0)
              ? item.product.images[0]
              : '/logo.png',
            quantity: item.quantity,
            rate: item.price || 0, // Correct: Use 'price' for the rate
          }));
          setProducts(mappedProducts);
        } else {
          throw new Error(response.message || "Failed to fetch products.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
        console.error("Error fetching product list:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderItems();
  }, [id, user_type]); // Added axiosInstance to dependency array

  const calculateTotal = (quantity: number, rate: number) => quantity * rate;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin h-10 w-10 text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 text-lg">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-lg">
        <p>No products found for this order.</p>
      </div>
    );
  }

  // The rest of the JSX rendering remains the same as it correctly uses the 'Product' interface
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-4 md:py-10 px-4">
        <div className="w-full max-w-5xl bg-white shadow-lg rounded-xl p-3 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Product List</h2>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700 border">
              <thead className="bg-gray-100 text-gray-600 uppercase">
                <tr>
                  <th className="p-4 border">Image</th>
                  <th className="p-4 border">Product Name</th>
                  <th className="p-4 border">Quantity</th>
                  <th className="p-4 border">Rate (KES)</th>
                  <th className="p-4 border">Total (KES)</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="bg-white border-b hover:bg-gray-50 transition"
                  >
                    <td className="p-4 border">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    </td>
                    <td className="p-4 border font-medium">{product.name}</td>
                    <td className="p-4 border">{product.quantity}</td>
                    <td className="p-4 border">
                      {product.rate.toLocaleString()}
                    </td>
                    <td className="p-4 border font-semibold text-gray-900">
                      {calculateTotal(product.quantity, product.rate).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-shrink-0 mx-auto sm:mx-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 sm:w-16 sm:h-16 object-cover rounded-md"
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="font-semibold text-gray-900 text-center sm:text-left">
                      {product.name}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between sm:flex-col sm:justify-start">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium text-gray-900">
                          {product.quantity}
                        </span>
                      </div>
                      <div className="flex justify-between sm:flex-col sm:justify-start">
                        <span className="text-gray-600">Rate:</span>
                        <span className="font-medium text-gray-900">
                          KES {product.rate.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Total:</span>
                        <span className="font-bold text-gray-900 text-lg">
                          KES {calculateTotal(product.quantity, product.rate).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tablet Horizontal Scroll Table */}
          <div className="hidden sm:block lg:hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700 border min-w-[600px]">
                <thead className="bg-gray-100 text-gray-600 uppercase">
                  <tr>
                    <th className="p-3 border text-xs">Image</th>
                    <th className="p-3 border text-xs">Product Name</th>
                    <th className="p-3 border text-xs">Quantity</th>
                    <th className="p-3 border text-xs">Rate (KES)</th>
                    <th className="p-3 border text-xs">Total (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="bg-white border-b hover:bg-gray-50 transition"
                    >
                      <td className="p-3 border">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-md"
                        />
                      </td>
                      <td className="p-3 border font-medium text-sm">{product.name}</td>
                      <td className="p-3 border text-sm">{product.quantity}</td>
                      <td className="p-3 border text-sm">
                        {product.rate.toLocaleString()}
                      </td>
                      <td className="p-3 border font-semibold text-gray-900 text-sm">
                        {calculateTotal(product.quantity, product.rate).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductList;