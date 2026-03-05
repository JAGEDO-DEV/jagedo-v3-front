
import React from 'react';

interface GrandSummaryProps {
  orderData: {
    subTotal: number;
    deliveryFee: number;
    totalPrice: number;
    
    items?: any[];
    productBids?: any[];
    
    [key: string]: any;
  };
}

const GrandSummary = ({ orderData }: GrandSummaryProps) => {

  

  const calculateFinancials = () => {
    
    let effectiveSubTotal = Number(orderData.subTotal || 0);

    
    if (effectiveSubTotal === 0 && orderData.items && orderData.items.length > 0) {
      effectiveSubTotal = orderData.items.reduce((acc: number, item: any) => {
        let price = Number(item.price || 0);
        const quantity = Number(item.quantity || 1);

        
        if (price === 0 && item.product?.customPrice) {
          price = Number(item.product.customPrice);
        }

        return acc + (price * quantity);
      }, 0);
    }

    
    let effectiveDeliveryFee = Number(orderData.deliveryFee || 0);

    
    if (effectiveDeliveryFee === 0 && orderData.productBids && orderData.productBids.length > 0) {
      effectiveDeliveryFee = Number(orderData.productBids[0].bidAmount || 0);
    }

    return {
      subTotal: effectiveSubTotal,
      deliveryFee: effectiveDeliveryFee,
      grandTotal: effectiveSubTotal + effectiveDeliveryFee
    };
  };

  const { subTotal, deliveryFee, grandTotal } = calculateFinancials();

  

  
  const formatCurrency = (amount: number | null | undefined) => {
    if (typeof amount !== 'number') {
      return "KES 0.00";
    }
    return `KES ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      <div className="mt-6 min-h-screen flex items-center justify-center bg-gray-100 py-4 md:py-10 px-4">
        <div className="max-w-4xl w-full mx-auto p-3 md:p-6 bg-white shadow-md rounded-md flex flex-col space-y-4 md:space-y-6">
          <h2 className="text-lg md:text-2xl font-semibold text-gray-700 mt-3 md:mt-6 mb-2 md:mb-4">
            Order Summary
          </h2>

          <div className="bg-white shadow-md rounded-xl p-3 md:p-6 border border-gray-200 space-y-4 md:space-y-6">
            {/* Simplified Summary Section */}
            <div className="space-y-4 text-gray-700">
              {/* Subtotal */}
              <div className="flex justify-between items-center">
                <span className="text-base font-medium">Subtotal</span>
                <span className="text-base font-semibold">
                  {formatCurrency(subTotal)}
                </span>
              </div>

              {/* Delivery Fee */}
              <div className="flex justify-between items-center">
                <span className="text-base font-medium">Delivery Fee</span>
                <span className="text-base font-semibold">
                  {deliveryFee > 0 ? formatCurrency(deliveryFee) : "TBD"}
                </span>
              </div>
            </div>

            {/* Grand Total */}
            <div className="flex justify-between font-bold text-green-700 text-base md:text-lg border-t pt-4 mt-4">
              <span>Grand Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GrandSummary;