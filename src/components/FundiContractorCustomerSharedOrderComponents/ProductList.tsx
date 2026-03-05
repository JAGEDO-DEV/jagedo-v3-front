/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
interface ApiProduct {
  id: number;
  name: string;
  images: string[];
  customPrice?: number; 
}

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  product: ApiProduct;
}

interface Product {
  id: number;
  name: string;
  image: string;
  quantity: number;
  rate: number;
}

interface ProductListProps {
  orderData: {
    items: OrderItem[];
  };
}

const ProductList = ({ orderData }: ProductListProps) => {

  const mappedProducts: Product[] = orderData.items.map((item: OrderItem) => {
    
    let effectiveRate = Number(item.price || 0);

    
    if (effectiveRate === 0 && item.product?.customPrice) {
      effectiveRate = Number(item.product.customPrice);
    }

    return {
      id: item.product.id,
      name: item.productName || 'Unnamed Product',
      image: (item.product.images && item.product.images.length > 0)
        ? item.product.images[0]
        : '/logo.png',
      quantity: item.quantity,
      rate: effectiveRate,
    };
  });

  const calculateTotal = (quantity: number, rate: number) => quantity * rate;

  if (mappedProducts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-lg">
        <p>No products found for this order.</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-4 md:py-10 px-4">
        <div className="w-full max-w-5xl bg-white shadow-lg rounded-xl p-3 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">Product List</h2>
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
                {mappedProducts.map((product) => (
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

          <div className="lg:hidden space-y-4">
            {mappedProducts.map((product) => (
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
                  {mappedProducts.map((product) => (
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