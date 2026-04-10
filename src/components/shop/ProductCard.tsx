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
    if (!product.isPriceSet) {
      toast.error("Price not set for this product.");
      return;
    }
    onAddToCart();
  };

  const handleBuyNowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    return (
      <Card className="p-6 shadow-product bg-white border-none">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Image Gallery */}
          <div className="flex-1">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden mb-4">
              <img src={mainImage || '/jagedologo.png'} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img, index) => (
                  <div
                    key={index}
                    onClick={() => setMainImage(img)}
                    className={`aspect-square bg-gray-100 rounded flex items-center justify-center overflow-hidden cursor-pointer border-2 ${mainImage === img ? 'border-blue-500' : 'border-transparent'}`}
                  >
                    <img src={img} alt={`${product.name} thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
            <div className="text-3xl font-bold text-green-600 mb-4">
              {product.isPriceSet ? (
                `${detailPricePrefix} ${product.price.toLocaleString()}`
              ) : (
                <span className="text-blue-900/40 text-lg uppercase tracking-wider">price not set</span>
              )}
            </div>
            <p className="text-gray-500 mb-6">{product.description || "No description available."}</p>

            {/* Specifications */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-6 text-sm">
              {Object.entries(product.specifications).map(([key, value]) =>
                value ? (
                  <div key={key}>
                    <span className="font-semibold capitalize">{key}:</span> {Array.isArray(value) ? value.join(", ") : value}
                  </div>
                ) : null
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCartClick}
                disabled={!product.isPriceSet}
                className={cn(
                  "flex-1 font-semibold py-2 px-4 rounded-lg transition-colors",
                  product.isPriceSet 
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
                    "flex-1 font-semibold py-2 px-4 rounded-lg transition-colors",
                    product.isPriceSet
                      ? "bg-green-500 hover:bg-green-600 text-gray-900"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed border-none"
                  )}
                >
                  Buy Now
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>
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
                product.isPriceSet
                  ? "border-gray-300 hover:bg-gray-100"
                  : "border-gray-200 bg-gray-50 cursor-not-allowed"
              )}
            >
              <ShoppingCart className={cn("h-4 w-4", product.isPriceSet ? "text-gray-700" : "text-gray-300")} />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
