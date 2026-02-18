/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { useGlobalContext } from '@/context/GlobalProvider';

interface FeeItem { amount: number; }
interface ExpenseItem { amount: number; }
interface MilestoneItem {
    name: string;
    amount: number;
    percentageDisbursement: number;
}

interface PaymentBreakdownProps {
    onPrevClick: () => void;
    onNextClick: () => void;
    selectedBid?: any; // For admin viewing a specific bid
    response: any; // The full job data object from the parent container
}

const PaymentBreakdown = ({ onPrevClick, onNextClick, selectedBid, response }: PaymentBreakdownProps) => {
    const { user } = useGlobalContext();
    const isAdmin = user.user_type === "ADMIN";
    // State for UI display, all derived from props/localStorage
    const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
    const [professionalFeeSubtotal, setProfessionalFeeSubtotal] = useState(0);
    const [expensesSubtotal, setExpensesSubtotal] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [jagedoCommission, setJagedoCommission] = useState(0);
    const [payableToYou, setPayableToYou] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [discountedTotal, setDiscountedTotal] = useState(0);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    // Helper function to calculate commission
    const calculateCommission = (total: number, managedBy: string) => {
        const commissionRate = (managedBy === 'SELF') ? 0.10 : 0.30;
        return total * commissionRate;
    };

    // Helper function to calculate discount
    const calculateDiscount = (total: number, managedBy: string, user_type: string) => {
        const isEligible = user_type?.toLowerCase() === 'customer' || user_type?.toLowerCase() === 'admin';
        if (isEligible && managedBy === 'SELF') {
            return total * 0.20; // 20% discount
        }
        return 0;
    };

    // Set read-only status based on the props
    useEffect(() => {
        if (selectedBid || (response && response.stage !== 'BID_INVITED')) {
            setIsReadOnly(true);
        } else {
            setIsReadOnly(false);
        }
    }, [response, selectedBid]);

    // useMemo to derive all calculated values from props or localStorage
    const derivedValues = useMemo(() => {
        // Case 1: Admin is viewing a specific selected bid
        if (selectedBid && response) {
            const fees = selectedBid.professionalFeeSubtotal || [];
            // const expenses = selectedBid.expenses || [];
            const feesSum = fees;
            // const expensesSum = expenses.reduce((sum: number, item: ExpenseItem) => sum + (item.amount || 0), 0);
            const total = feesSum;
            const commission = calculateCommission(total, response.managedBy || 'JAGEDO');

            return {
                professionalFeeSubtotal: feesSum,
                payableToServiceProvider: total - commission,
                // expensesSubtotal: expensesSum,
                totalAmount: total,
                jagedoCommission: commission,
                payableToYou: total - commission,
                milestones: selectedBid.milestones || [],
            };
        }

        // Case 2: Professional/Contractor is viewing their own submitted bid (read-only)
        if (response && response.stage !== 'BID_INVITED') {
            const selectedBid = response.userBid || {};
            const fees = selectedBid.professionalFeeSubtotal || [];
            // const expenses = selectedBid.expenses || [];
            const feesSum = fees;
            // const expensesSum = expenses.reduce((sum: number, item: ExpenseItem) => sum + (item.amount || 0), 0);
            const total = feesSum;
            const commission = calculateCommission(total, response.managedBy || 'JAGEDO');
            return {
                professionalFeeSubtotal: feesSum,
                // expensesSubtotal: expensesSum,
                totalAmount: total,
                jagedoCommission: commission,
                payableToYou: total - commission,
                milestones: selectedBid.milestones || [],
            };
        }

        // Case 3: Professional/Contractor is creating a new bid (editable, reads from localStorage)
        const feesData = JSON.parse(localStorage.getItem('professionalFeesWithWorkPlans') || '[]');
        // const expensesData = JSON.parse(localStorage.getItem('expenses') || '[]');
        const milestonesData = JSON.parse(localStorage.getItem('milestones') || '[]');
        const feesSum = feesData.reduce((sum: number, item: FeeItem) => sum + (item.amount || 0), 0);
        // const expensesSum = expensesData.reduce((sum: number, item: ExpenseItem) => sum + (item.amount || 0), 0);
        const total = feesSum;
        const managedBy = response?.managedBy || 'JAGEDO';
        const commission = calculateCommission(total, managedBy);

        return {
            professionalFeeSubtotal: feesSum,
            expensesSubtotal: 0,
            totalAmount: total,
            jagedoCommission: commission,
            payableToYou: total - commission,
            payableToServiceProvider: total - commission,
            milestones: milestonesData,
        };
    }, [response, selectedBid, user?.user_type]);

    // Sync derived values into component state for UI rendering
    useEffect(() => {
        console.log("derivedValues ", derivedValues)
        setProfessionalFeeSubtotal(derivedValues.professionalFeeSubtotal);
        setExpensesSubtotal(derivedValues.expensesSubtotal);
        setTotalAmount(derivedValues.totalAmount);
        setJagedoCommission(derivedValues.jagedoCommission);
        setPayableToYou(derivedValues.payableToYou);
        setMilestones(derivedValues.milestones);

        // Handle discount separately as it's a UI concern for certain users
        const managedBy = response?.managedBy || 'JAGEDO';
        const discountAmount = calculateDiscount(derivedValues.totalAmount, managedBy, user?.user_type);
        setDiscount(discountAmount);
        setDiscountedTotal(derivedValues.totalAmount - discountAmount);

    }, [derivedValues, response, user?.user_type]);

    // Saves the calculated summary to localStorage
    const saveSummaryData = () => {
        if (isReadOnly) return; // Don't save if in read-only mode
        const summaryData = {
            jagedoCommission,
            payableToServiceProvider: payableToYou,
            totalAmount,
            expensesSubtotal,
            professionalFeeSubtotal
        };
        localStorage.setItem("paymentSummary", JSON.stringify(summaryData));
    };

    const handleSaveDraft = () => {
        saveSummaryData();
        setSaveMessage("Payment summary saved successfully!");
        setTimeout(() => setSaveMessage(""), 3000);
    };

    const handleNextClick = () => {
        saveSummaryData();
        onNextClick();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Breakdown & Summary</h2>
            {isReadOnly && (
                <div className="p-3 mb-4 rounded text-center text-yellow-800 bg-yellow-100 border border-yellow-300">
                    This section is view-only.
                </div>
            )}

            <div className="bg-white rounded-lg p-4 my-5 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Milestone Review</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead className="bg-gray-100 text-left">
                            <tr>
                                <th className="px-4 py-2 text-gray-700 font-medium">Milestone</th>
                                <th className="px-4 py-2 text-gray-600 font-medium">% Disbursement</th>
                                <th className="px-4 py-2 text-gray-600 font-medium text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {milestones.length > 0 ? (
                                milestones.map((milestone, index) => (
                                    <tr key={index} className="border-t">
                                        <td className="px-4 py-2 text-gray-700">{milestone.name}</td>
                                        <td className="px-4 py-2 text-gray-600">{milestone.percentageDisbursement}%</td>
                                        <td className="px-4 py-2 text-gray-800 font-semibold text-right">{formatCurrency(milestone.amount)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={3} className="text-center py-4 text-gray-500">No milestones defined.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 mt-6">
                <div className="w-full p-6 rounded-lg flex justify-between items-center bg-gray-50 shadow-sm border border-gray-200">
                    <span className="text-gray-600 text-lg">Total Bid Amount</span>
                    <span className="text-2xl font-bold text-gray-800">{formatCurrency(totalAmount)}</span>
                </div>

                {/* Show discount only for customers and admins */}
                {(user?.user_type?.toLowerCase() === 'customer' || user?.user_type?.toLowerCase() === 'admin') && discount > 0 && (
                    <>
                        <div className="w-full p-6 rounded-lg flex justify-between items-center bg-green-50 shadow-sm border border-green-200">
                            <span className="text-green-800 text-lg font-semibold">Customer Discount (20%)</span>
                            <span className="text-2xl font-bold text-green-600">-{formatCurrency(discount)}</span>
                        </div>
                        <div className="w-full p-6 rounded-lg flex justify-between items-center bg-blue-50 shadow-sm border border-blue-200">
                            <span className="text-blue-800 text-lg font-semibold">Discounted Total</span>
                            <span className="text-2xl font-bold text-blue-800">{formatCurrency(discountedTotal)}</span>
                        </div>
                    </>
                )}

                <div className="w-full p-6 rounded-lg flex justify-between items-center bg-gray-50 shadow-sm border border-gray-200">
                    <span className="text-gray-600 text-lg">Jagedo Commission ({(response?.managedBy === 'SELF') ? '10%' : '30%'})</span>
                    <span className="text-2xl font-bold text-red-600">{formatCurrency(jagedoCommission)}</span>
                </div>
                <div className="w-full p-6 rounded-lg flex justify-between items-center bg-green-50 shadow-sm border border-green-200">
                    {
                        isAdmin ? (
                            <span className="text-green-800 text-lg font-semibold">Payable to Service Provider</span>
                        ) : (
                            <span className="text-green-800 text-lg font-semibold">Payable to You</span>
                        )

                    }
                    <span className="text-2xl font-bold text-green-800">{formatCurrency(payableToYou)}</span>
                </div>
            </div>

            {saveMessage && <p className="text-green-600 font-medium mt-4 text-center">{saveMessage}</p>}

            <div className="flex justify-between items-center mt-8 gap-4">
                <button onClick={onPrevClick} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 border border-gray-400">Back</button>
                <div className="flex gap-4">
                    {!isReadOnly && (
                        <>
                            <button
                                onClick={handleSaveDraft}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                            >
                                Save as Draft
                            </button>
                            <button
                                onClick={handleNextClick}
                                className="bg-blue-900 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-800"
                            >
                                Next
                            </button>
                        </>
                    )}
                    {/* Always show Next button if it's read-only, but without save functionality */}
                    {isReadOnly && (
                        <button
                            onClick={onNextClick}
                            className="bg-blue-900 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-800"
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentBreakdown;