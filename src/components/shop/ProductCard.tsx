import { useState } from "react";
import { Product } from "@/hooks/useProducts";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { useGlobalContext } from "@/context/GlobalProvider";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  onProductClick: () => void;
  onAddToCart: () => void;
  onBuyNow?: (product: Product) => void;
  isDetailView?: boolean;
}

const ProductCard = ({ product, onProductClick, onAddToCart, onBuyNow, isDetailView = false }: ProductCardProps) => {
  const [mainImage, setMainImage] = useState(product.images?.[0]);

  const { isLoggedIn } = useGlobalContext();
  const detailPricePrefix = product.showFromPrice ? "From KSH" : "KSH";
  const gridPricePrefix = product.showFromPrice ? "From Ksh" : "Ksh";

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error("Please login first to add items to cart.");
      return;
    }
    if (!product.isPriceSet) {
      toast.error("Price not set for this product.");
      return;
    }
    onAddToCart();
  };

  const handleBuyNowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error("Please login first to buy items.");
      return;
    }
    if (!product.isPriceSet) {
      toast.error("Price not set for this product.");
      return;
    }
    if (onBuyNow) {
      onBuyNow(product);
    }
  };

  // DETAIL VIEW
  if (isDetailView) {
    const specEntries = Object.entries(product.specifications ?? {});

    return (
      <div className="bg-white">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {product.sku && <span>SKU: {product.sku}</span>}
            {product.sku && product.productCode && <span className="mx-2">|</span>}
            {product.productCode && <span>BID: {product.productCode}</span>}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Image Gallery */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="rounded-lg overflow-hidden mb-3 border border-gray-100">
              <img
                src={mainImage || '/jagedologo.png'}
                alt={product.name}
                className="w-full h-64 object-cover"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setMainImage(img)}
                    className={`w-20 h-20 rounded border-2 overflow-hidden flex-shrink-0 transition-colors ${mainImage === img ? 'border-blue-500' : 'border-gray-200 hover:border-gray-400'}`}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 divide-y divide-gray-100">
            {/* Description */}
            <div className="pb-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Description</h3>
              <p className="text-sm text-gray-600">{product.description || "No description available."}</p>
            </div>

            {/* Product Details */}
            <div className="py-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">Product Details</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Type</p>
                  <p className="text-sm font-semibold text-gray-800 lowercase">{product.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Group</p>
                  <p className="text-sm font-semibold text-gray-800">{product.group || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Price</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {product.isPriceSet
                      ? `Ksh ${product.price.toLocaleString("en-KE", { minimumFractionDigits: 2 })}`
                      : <span className="text-gray-400 italic">Not set</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Sub Group</p>
                  <p className="text-sm font-semibold text-gray-800">{product.subGroup || "—"}</p>
                </div>
                {product.regionName && product.regionName !== "Universal" && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Region</p>
                    <p className="text-sm font-semibold text-gray-800 lowercase">{product.regionName}</p>
                  </div>
                )}
                {product.sellerName && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Seller</p>
                    <p className="text-sm font-semibold text-gray-800">{product.sellerName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Attributes */}
            <div className="py-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Selected Attributes</h3>
              {specEntries.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {specEntries.map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-gray-400 mb-0.5 capitalize">{key}</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {Array.isArray(value) ? value.join(", ") : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No attribute values provided yet.</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-5 flex gap-4">
              <button
                onClick={handleAddToCartClick}
                disabled={!product.isPriceSet}
                className={cn(
                  "flex-1 font-semibold py-2 px-4 rounded-lg transition-colors text-sm",
                  product.isPriceSet && isLoggedIn
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                )}
              >
                Add To Cart
              </button>
              {onBuyNow && (
                <button
                  onClick={handleBuyNowClick}
                  disabled={!product.isPriceSet}
                  className={cn(
                    "flex-1 font-semibold py-2 px-4 rounded-lg transition-colors text-sm",
                    product.isPriceSet && isLoggedIn
                      ? "bg-green-500 hover:bg-green-600 text-gray-900"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  Buy Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // GRID VIEW
  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow bg-white border group flex flex-col"
      onClick={onProductClick}
    >
      <CardContent className="p-4 flex flex-col flex-grow">
        <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
          <img
            src={product.images?.[0] || '/jagedologo.png'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="flex flex-col flex-grow">
          <h3 className="font-semibold text-gray-900 mb-1 truncate" title={product.name}>{product.name}</h3>
          <p className="text-sm text-gray-500">{product.type}</p>
          <div className="flex-grow" />
          <div className="flex justify-between items-center mt-4 pt-4">
            <p className="text-lg font-bold text-green-600">
              {product.isPriceSet ? (
                `${gridPricePrefix} ${product.price.toLocaleString()}`
              ) : (
                <span className="text-blue-900/40 text-[13px] uppercase tracking-wider">price not set</span>
              )}
            </p>
            <button
              onClick={handleAddToCartClick}
              disabled={!product.isPriceSet}
              className={cn(
                "p-2 border rounded-lg transition-colors",
                product.isPriceSet && isLoggedIn
                  ? "border-gray-300 hover:bg-gray-100"
                  : "border-gray-200 bg-gray-50 cursor-not-allowed"
              )}
            >
              <ShoppingCart className={cn("h-4 w-4", product.isPriceSet && isLoggedIn ? "text-gray-700" : "text-gray-300")} />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
