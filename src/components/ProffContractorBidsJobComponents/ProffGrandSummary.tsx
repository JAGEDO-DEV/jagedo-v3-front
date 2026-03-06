/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useState, useEffect, useMemo } from 'react';

// Define prop types
interface FeeItem { amount: number; }
interface ExpenseItem { amount: number; }

interface ProffGrandSummaryProps {
  onPrevClick: () => void;
  onNextClick: () => void;
  selectedBid?: any;
  response: any;
}

const ProffGrandSummary = ({ onPrevClick, onNextClick, selectedBid, response }: ProffGrandSummaryProps) => {
  const [feesTotal, setFeesTotal] = useState(0);
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const feeDescription = response?.jobType?.toLowerCase() === "professional" ? "Professional Fees" : "Contractor Fees";
  const title = response?.jobType?.toLowerCase() === "professional" ? 'Grand Summary' : 'Bill Summary';

  useEffect(() => {
    if (selectedBid || (response && response.stage !== 'BID_INVITED')) {
      setIsReadOnly(true);
    } else {
      setIsReadOnly(false);
    }
  }, [response, selectedBid]);
  
  // useMemo to perform all calculations based on the current context
  const calculatedTotals = useMemo(() => {
    let feesSum = 0;
    let expensesSum = 0;

    // Case 1: Admin is viewing a specific selected bid (read-only)
    if (selectedBid) {
      const bidFees = selectedBid.professionalFeeSubtotal
      feesSum = bidFees;

      // const bidExpenses = selectedBid.expenses || [];
      // expensesSum = bidExpenses.reduce((total: number, item: ExpenseItem) => total + (item.amount || 0), 0);
    }
    // Case 2: User is viewing their own submitted bid (read-only)
    else if (response && response.stage !== 'BID_INVITED') {
      feesSum = response.userBid?.professionalFeeSubtotal || 0;
      expensesSum = response.userBid?.expensesSubtotal || 0;
    }
    // Case 3: User is creating a new bid (editable)
    else {
      const savedFees = JSON.parse(localStorage.getItem('professionalFeesWithWorkPlans') || '[]');
      
      feesSum = savedFees.reduce((total: number, item: FeeItem) => total + (item.amount || 0), 0);

      // const savedExpenses = JSON.parse(localStorage.getItem("expenses") || '[]');
      // expensesSum = savedExpenses.reduce((total: number, item: ExpenseItem) => total + (item.amount || 0), 0);

      // While calculating for a new bid, also save the summary to localStorage for the next step
      const paymentSummary = {
        professionalFeeSubtotal: feesSum,
        expensesSubtotal: expensesSum,
        totalAmount: feesSum + expensesSum
      };
      localStorage.setItem('paymentSummary', JSON.stringify(paymentSummary));
    }

    return {
      feesTotal: feesSum,
      expensesTotal: expensesSum,
      grandTotal: feesSum + expensesSum,
    };
  }, [response, selectedBid]);

  // useEffect to update the component's state when calculated totals change
  useEffect(() => {
    setFeesTotal(calculatedTotals.feesTotal);
    setExpensesTotal(calculatedTotals.expensesTotal);
    setGrandTotal(calculatedTotals.grandTotal);
  }, [calculatedTotals]);

  
  const summaryRows = [
    { no: 1, description: feeDescription, amount: feesTotal },
    // { no: 2, description: "Other Expenses", amount: expensesTotal },
  ];

  return (
    <section className="container mx-auto mt-8 px-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        {title}
      </h2>

      {isReadOnly && (
        <div className="p-3 mb-4 rounded text-center text-yellow-800 bg-yellow-100 border border-yellow-300">
          This section is view-only.
        </div>
      )}

      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3 text-gray-700 font-medium">NO</th>
                <th className="px-4 py-3 text-gray-600 font-medium">Description</th>
                <th className="px-4 py-3 text-gray-600 font-medium text-right">Amount (Kes)</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((row) => (
                <tr key={row.no} className="border-t border-gray-200">
                  <td className="px-4 py-3 text-gray-700">{row.no}</td>
                  <td className="px-4 py-3 text-gray-600">{row.description}</td>
                  <td className="px-4 py-3 text-gray-800 font-semibold text-right">
                    {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-col items-end gap-4 mt-6">
        <div className="w-full sm:max-w-md p-4 rounded-lg flex items-center justify-between border border-gray-300 bg-gray-50">
          <span className="text-gray-600 font-medium">Grand Total (Kes)</span>
          <span className="font-bold text-xl text-gray-900">
            {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={onPrevClick}
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 border border-gray-400 transition duration-300"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNextClick}
          className="bg-blue-900 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-800"
        >
          Next
        </button>
      </div>
    </section>
  );
};

export default ProffGrandSummary;