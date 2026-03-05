//@ts-nocheck
import { TiTick } from "react-icons/ti";
import { useNavigate } from "react-router-dom";

type Product = {
  name?: string;
  images?: string[];
  category?: string;
  subCategory?: string; // Added for type safety
  type?: string;
};

type OrderItem = {
  product?: Product;
};

type Payment = {
  id: string;
};

type Customer = {
  id?: number;
  username?: string; // This appears to be the email in your JSON
  fullName?: string; // Placeholder for when API provides name
  phoneNumber?: string; // Placeholder for when API provides phone
  estate?: string;
};

type Seller = {
  username?: string;
};

interface OrderData {
  items?: OrderItem[];
  seller?: Seller;
  subTotal?: number;
  createdAt?: string;
  payments?: Payment[];
  customer?: Customer;
}

interface SpecificationProps {
  orderData: OrderData;
}

const Specification = ({ orderData }: SpecificationProps) => {
  const navigate = useNavigate();

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString('en-GB');
  };

  const productInfo = orderData.items?.[0]?.product;
  const productImageUrl = productInfo?.images?.[0];

  // Updated details list to include Sub-category, Location, and Required by Date
  const orderDetails = [
    { label: "Category", value: productInfo?.category },
    {
      label: "Sub-category",
      value: productInfo?.subCategory || productInfo?.type || "Not specified"
    },
    {
      label: "Location",
      value: orderData.customer?.estate || "Not specified"
    },
    {
      label: "Required by Date",
      value: formatDate(orderData.createdAt)
    },
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
                      <span className="font-semibold text-gray-800 xs:w-32 sm:w-36 text-sm md:text-base">
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
                    <div className="flex items-center space-x-2 bg-green-50 p-3 md:p-4 rounded-lg cursor-pointer hover:bg-green-100 transition border border-gray-200" onClick={() => navigate(`/receipts/${orderData.payments![orderData.payments!.length - 1].id}`)}>
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

                  <div className="bg-blue-50 p-4 rounded-2xl shadow-md mt-4 border border-gray-200">
                    <h3 className="text-xl font-bold text-blue-900 mb-1">
                      Package Details
                    </h3>

                    <h3 className="text-l font-bold mb-1 mt-4">
                      Jagedo Oversees
                    </h3>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-center">
                        <TiTick className="text-green-500 mr-2 text-xl" />
                        Arrival Time
                      </li>
                      <li className="flex items-center">
                        <TiTick className="text-green-500 mr-2 text-xl" />
                        Scope Budget
                      </li>

                      <li className="flex items-center">
                        <TiTick className="text-green-500 mr-2 text-xl" />
                        Products Quality
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="shadow-md rounded-xl p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 border border-gray-200">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-700 mb-2 sm:mb-3">
              Contact Details
            </h2>
            <div className="space-y-2 text-sm md:text-base">
              <div>
                <span className="font-bold text-gray-800">Full Name: </span>
                <span className="text-gray-600">
                  {orderData.customer?.fullName || "Not specified"}
                </span>
              </div>
              <div>
                <span className="font-bold text-gray-800">Phone Number: </span>
                <span className="text-gray-600">
                  {orderData.customer?.phoneNumber || "Not specified"}
                </span>
              </div>
              <div>
                <span className="font-bold text-gray-800">Email Address: </span>
                <span className="text-gray-600">
                  {/* Using username as fallback for email based on JSON */}
                  {orderData.customer?.email || orderData.customer?.username || "Not specified"}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Details Section */}
          <div className="shadow-md rounded-xl p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 border border-gray-200">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-700 mb-1 sm:mb-2">
              Delivery Details
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