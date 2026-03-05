/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
const COMMISSION_RATE = 0.30;

interface PaymentBreakdownProps {
    orderData: {
        subTotal: number;
        deliveryFee: number;
        items?: any[];
        productBids?: any[];
    };
}

const PaymentBreakdown = ({ orderData }: PaymentBreakdownProps) => {


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
            deliveryFee: effectiveDeliveryFee
        };
    };

    const { subTotal, deliveryFee } = calculateFinancials();


    const formatCurrency = (amount: number | null | undefined) => {
        if (typeof amount !== 'number') {
            return 'KSH 0';
        }
        return `KSH ${amount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })}`;
    };


    const commissionAmount = subTotal * COMMISSION_RATE;
    const payableAmount = subTotal - commissionAmount + deliveryFee;

    return (
        <>
            <div className="min-h-screen flex items-start justify-center bg-gray-100 pt-2 sm:pt-4 pb-4 sm:pb-6 px-2 sm:px-0">
                <div className="max-w-6xl w-full mx-auto p-3 sm:p-4 md:p-6 bg-white shadow-md rounded-md flex flex-col space-y-4 sm:space-y-6">
                    <h1 className="text-xl sm:text-2xl font-semibold text-gray-600 mt-1 sm:mt-2 mb-3 sm:mb-4 px-1 sm:px-0">
                        Payment Summary
                    </h1>
                    <div className="bg-white shadow-md rounded-xl p-3 sm:p-4 md:p-6 border border-gray-200 mb-4 sm:mb-6">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 space-y-1 sm:space-y-0">
                            <span className="text-sm sm:text-base text-gray-700 font-medium">
                                Paid by Customer
                            </span>
                            <span className="font-semibold text-gray-800 text-base sm:text-base self-start sm:self-auto">
                                {formatCurrency(subTotal)}
                            </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between text-gray-600 space-y-1 sm:space-y-0">
                            <span className="text-sm sm:text-base leading-relaxed pr-2 sm:pr-4">
                                JaGedo Commission @{COMMISSION_RATE * 100}% inclusive VAT
                            </span>
                            <span className="font-semibold text-gray-800 text-base sm:text-base self-start sm:self-auto">
                                {formatCurrency(commissionAmount)}
                            </span>
                        </div>
                        <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                                <span className="text-base sm:text-lg font-semibold text-gray-700">
                                    Payable to Service Provider
                                </span>
                                <span className="text-lg sm:text-xl font-bold text-[rgb(0,0,122)] self-start sm:self-auto">
                                    {formatCurrency(payableAmount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PaymentBreakdown;