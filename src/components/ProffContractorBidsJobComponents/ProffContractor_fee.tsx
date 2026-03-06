/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useState, useEffect } from "react";

interface FeeItem {
  id: number;
  description: string;
  uom: string;
  quantity: number;
  unitRate: number;
  amount: number;
  actualAmount: number;
  actualQuantity: number;
}

interface WorkPlanItem {
  billName: string;
  amount: number;
}

interface ProffContractorFeeProps {
  onPrevClick: () => void;
  onNextClick: () => void;
  selectedBid?: any;
  response: any;
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const ProffContractorFee = ({ onPrevClick, onNextClick, selectedBid, response }: ProffContractorFeeProps) => {
  const [workPlans, setWorkPlans] = useState<WorkPlanItem[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const storageKey = 'professionalFeesWithWorkPlans';
  const workPlanStorageKey = 'professionalFeesWithWorkPlans';
  const uomOptions = ["Hours", "Days", "Unit", "Litres", "Kg"];
  

  // Save to localStorage whenever workPlans change
  useEffect(() => {
    if (!isReadOnly && workPlans.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(workPlans));
    }
  }, [workPlans, isReadOnly]);

  useEffect(() => {
    if (selectedBid) {
      
      setIsReadOnly(true);
      const bidWorkPlans = selectedBid.workPlans?.map((plan: any) => ({
        billName: plan.name || plan.billName,
        startDate: plan.startDate,
        endDate: plan.endDate,
        duration: plan.durationDays || plan.duration,
        amount: plan.amount,
        items: plan.items?.map((item: any, index: number) => ({
          id: index + 1,
          description: item.description || item.fee || "",
          uom: item.uom || "",
          quantity: item.quantity || item.qty || 0,
          unitRate: item.unitRate || item.rate || 0,
          amount: item.amount || 0,
        })) || []
      })) || [];
      setWorkPlans(bidWorkPlans);
      return;
    }

    if (response) {
      if (response.stage !== 'BID_INVITED') {
        
        setIsReadOnly(true);
        const apiWorkPlans = response.userBid?.workPlans || [];
        const transformedWorkPlans = apiWorkPlans.map((plan: any) => ({
          billName: plan.name || plan.billName,
          startDate: plan.startDate,
          endDate: plan.endDate,
          duration: plan.durationDays || plan.duration,
          amount: plan.amount,
          items: plan.items?.map((item: any, index: number) => ({
            id: index + 1,
            description: item.description || item.fee || "",
            uom: item.uom || "",
            quantity: item.quantity || item.qty || 0,
            unitRate: item.unitRate || item.rate || 0,
            amount: item.amount || 0,
          })) || []
        }));
        setWorkPlans(transformedWorkPlans);
      } else {
        setIsReadOnly(false);

        // Load work plans from localStorage
        const savedWorkPlansRaw = localStorage.getItem(workPlanStorageKey);
        const savedWorkPlans: any[] = savedWorkPlansRaw ? JSON.parse(savedWorkPlansRaw) : [];

        // Load bill items from localStorage
        const savedBillItemsRaw = localStorage.getItem(storageKey);
        const savedBillItems: WorkPlanItem[] = savedBillItemsRaw ? JSON.parse(savedBillItemsRaw) : [];

        // Synchronize work plans with saved bill items
        const synchronizedWorkPlans: WorkPlanItem[] = savedWorkPlans.map((plan, index) => {
          const existingWorkPlan = savedBillItems[index] || { items: [] };

          return {
            billName: plan.billName || "",
            startDate: plan.startDate || "",
            endDate: plan.endDate || "",
            duration: plan.duration || 0,
            amount: plan.amount,
            items: existingWorkPlan.items?.map((item, itemIndex) => ({
              id: itemIndex + 1,
              description: item.description || "",
              uom: item.uom || "",
              quantity: Number(item.quantity) || 0,
              unitRate: Number(item.unitRate) || 0,
              amount: (Number(item.quantity) || 0) * (Number(item.unitRate) || 0),
            })) || []
          };
        });

        setWorkPlans(synchronizedWorkPlans);
      }
    }
  }, [response, selectedBid]);

  useEffect(() => {
    const total = workPlans.reduce((sum, workPlan) => {
      return sum + workPlan.items.reduce((itemSum, item) => itemSum + item.amount, 0);
    }, 0);
    setSubTotal(total);
  }, [workPlans]);

  const handleInputChange = (workPlanIndex: number, itemIndex: number, field: keyof FeeItem, value: string | number) => {
    if (isReadOnly) return;
    
    

    const updatedWorkPlans = [...workPlans];
    const workPlan = { ...updatedWorkPlans[workPlanIndex] };
    const item = { ...workPlan.items[itemIndex], [field]: value };

    // Recalculate amount if quantity or unitRate changes
    if (field === 'quantity' || field === 'unitRate') {
      const quantity = field === 'quantity' ? Number(value) : item.quantity;
      const unitRate = field === 'unitRate' ? Number(value) : item.unitRate;
      item.amount = quantity * unitRate;
    }

    workPlan.items[itemIndex] = item;

    // Calculate total amount for this work plan (sum of all item amounts)
    const workPlanTotal = workPlan.items.reduce((sum, currentItem) => {
      return sum + (currentItem.amount || 0);
    }, 0);

    // Set the work plan total amount
    workPlan.amount = workPlanTotal;

    updatedWorkPlans[workPlanIndex] = workPlan;
    setWorkPlans(updatedWorkPlans);

    
  };

  const addNewItem = (workPlanIndex: number) => {
    if (isReadOnly) return;

    const updatedWorkPlans = [...workPlans];
    const workPlan = { ...updatedWorkPlans[workPlanIndex] };

    const newItem: FeeItem = {
      id: 0,
      description: "",
      uom: "",
      quantity: 0,
      unitRate: 0,
      amount: 0,
    };

    workPlan.items = [...workPlan.items, newItem];
    updatedWorkPlans[workPlanIndex] = workPlan;
    setWorkPlans(updatedWorkPlans);
  };

  const deleteItem = (workPlanIndex: number, itemIndex: number) => {
    if (isReadOnly) return;

    const updatedWorkPlans = [...workPlans];
    const workPlan = { ...updatedWorkPlans[workPlanIndex] };

    workPlan.items = workPlan.items.filter((_, index) => index !== itemIndex);
    updatedWorkPlans[workPlanIndex] = workPlan;
    setWorkPlans(updatedWorkPlans);
  };

  const clearAllTables = () => {
    if (isReadOnly) return;

    const clearedWorkPlans = workPlans.map(workPlan => ({
      ...workPlan,
      items: []
    }));
    setWorkPlans(clearedWorkPlans);
    localStorage.removeItem(storageKey);
  };
  const getWorkPlanSubtotal = (items: FeeItem[]) => {
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    return total;
  };

  return (
    <div className="container mx-auto p-6 mb-5 bg-white shadow-lg rounded-lg border border-gray-200 lg:px-8 py-8">
      <div className="bg-white rounded-lg p-4 border border-gray-200 my-5">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {response?.jobType?.toLowerCase() === "professional" ? "Professional Fees" : "Contractor Fees"}
        </h2>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <div class="flex items-start">
            <svg class="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>
            <div class="text-sm text-blue-800">
              <p class="text-sm text-gray-600 italic mt-4">
                * The {response?.jobType?.toLowerCase() === "professional" ? "professional" : "contractor"} fee is inclusive of other expenses such as communication, transport, and related costs.
              </p>
            </div>
          </div>
        </div>
        {isReadOnly && (
          <div className="p-3 mb-4 rounded text-center text-yellow-800 bg-yellow-100 border border-yellow-300">
            {response.jobRequest?.stage === 'BID_AWARDED'
              ? 'This bid has been awarded, and the fees cannot be edited.'
              : response.jobRequest?.stage === 'UNDER_EVALUATION'
                ? 'These fees are UNDER EVALUATION and cannot be edited.'
                : 'These fees are view-only and cannot be edited.'
            }
          </div>
        )}


        <div className="space-y-8 mt-6">
          {workPlans.map((workPlan, workPlanIndex) => (
            <div key={workPlanIndex} className="border border-gray-200 rounded-lg p-4">
              {/* Work Plan Header */}
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {workPlan.billName || `Work Plan ${workPlanIndex + 1}`}
                </h3>
                <div className="text-sm text-gray-600 mt-1">
                  Duration: {workPlan.duration} days |
                  Start: {formatDate(workPlan.startDate)} |
                  End: {formatDate(workPlan.endDate)}
                </div>
              </div>


              {/* Fee Items Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead className="bg-gray-100 text-left">
                    <tr>
                      <th className="px-4 py-2 text-gray-700 font-medium">Fee Description</th>
                      <th className="px-4 py-2 text-gray-600 font-medium">QTY</th>
                      <th className="px-4 py-2 text-gray-600 font-medium">UOM</th>
                      <th className="px-4 py-2 text-gray-600 font-medium">Rate</th>
                      <th className="px-4 py-2 text-gray-600 font-medium">Amount</th>
                      <th className="px-4 py-2 text-gray-600 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workPlan.items.map((item, itemIndex) => (
                      <tr key={itemIndex} className="border-t border-gray-200">
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleInputChange(workPlanIndex, itemIndex, "description", e.target.value)}
                            className="w-full bg-transparent border-b p-1 focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            disabled={isReadOnly}
                            placeholder="Enter fee description"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleInputChange(workPlanIndex, itemIndex, "quantity", e.target.value)}
                            className="w-20 bg-transparent border-b p-1 focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={item.uom}
                            onChange={(e) => handleInputChange(workPlanIndex, itemIndex, "uom", e.target.value)}
                            className="w-full bg-transparent border-b p-1 focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            disabled={isReadOnly}
                          >
                            <option value="" disabled>-- Select --</option>
                            {uomOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={item.unitRate}
                            onChange={(e) => handleInputChange(workPlanIndex, itemIndex, "unitRate", e.target.value)}
                            className="w-24 bg-transparent border-b p-1 focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-4 py-2 text-gray-800 font-semibold">
                          {item.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => deleteItem(workPlanIndex, itemIndex)}
                            className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                            disabled={isReadOnly}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}


                    {/* Empty state */}
                    {workPlan.items.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                          No fee items added yet. Click "Add Item" to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>


              {/* Work Plan Subtotal and Add Item Button */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm font-semibold text-gray-700">
                  Work Plan Subtotal: Kes {getWorkPlanSubtotal(workPlan.items).toLocaleString()}
                </div>
                <button
                  onClick={() => addNewItem(workPlanIndex)}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={isReadOnly}
                >
                  Add Item
                </button>
              </div>
            </div>
          ))}


          {/* Empty state for no work plans */}
          {workPlans.length === 0 && (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              No work plans found. Please add work plans first.
            </div>
          )}
        </div>


        {/* Grand Total */}
        <div className="flex flex-col items-end gap-4 mt-8">
          <div className="w-full md:w-1/3 p-4 rounded-lg flex items-center justify-between border border-gray-300 bg-gray-50">
            <span className="text-gray-600 text-sm font-semibold">Grand Total (Kes)</span>
            <span className="font-bold text-xl">{subTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>


      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6 space-x-4">
        <button onClick={onPrevClick} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
          Back
        </button>
        <div className="flex-grow flex justify-end gap-4">
          <button
            onClick={clearAllTables}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isReadOnly}
          >
            Clear All
          </button>
          <button onClick={onNextClick} className="bg-blue-900 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-950">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};


export default ProffContractorFee;