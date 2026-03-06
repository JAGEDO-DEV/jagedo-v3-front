/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useState, useEffect, useMemo } from 'react';

interface MilestoneItem {
  name: string;
  amount: number;
  percentageDisbursement: number;
  description: string;
}

interface MilestonesProps {
  onPrevClick: () => void;
  onNextClick: () => void;
  selectedBid?: { milestones?: MilestoneItem[] } | null;
  response: any;
}

const Milestones = ({ onPrevClick, onNextClick, selectedBid, response }: MilestonesProps) => {
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [totalBidAmount, setTotalBidAmount] = useState(0);
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    if (selectedBid || (response && response.stage !== 'BID_INVITED')) {
      setIsReadOnly(true);
    } else {
      setIsReadOnly(false);
    }
  }, [response, selectedBid]);

  const derivedData = useMemo(() => {
    if (selectedBid) {
      const bidMilestones = selectedBid.milestones || [];
      const total = bidMilestones.reduce((sum: number, m) => sum + (m.amount || 0), 0);
      return { milestones: bidMilestones, totalBidAmount: total };
    }

    if (response && response.stage !== 'BID_INVITED') {
      const apiMilestones = response.userBid?.milestones || [];
      const total = (response.userBid?.professionalFeeSubtotal || 0) + (response.userBid?.expensesSubtotal || 0);
      return { milestones: apiMilestones, totalBidAmount: total };
    }

    
    const workPlansData = JSON.parse(localStorage.getItem("professionalFeesWithWorkPlans") || "[]");
    
    
    const total = workPlansData.reduce((sum: number, workPlan: any) => {
      const workPlanTotal = workPlan.items?.reduce((itemSum: number, item: any) => {
        return itemSum + (item.amount || 0);
      }, 0) || 0;
      return sum + workPlanTotal;
    }, 0);

    let generatedMilestones: MilestoneItem[] = [];

    
    if (total < 100000) {
      generatedMilestones = [{
        name: "Milestone 1",
        description: "Final payment upon successful completion of all works.",
        percentageDisbursement: 100,
        amount: total
      }];
    } else if (total <= 500000) {
      generatedMilestones = [
        {
          name: "Milestone 1",
          description: "Initial payment to commence the project.",
          percentageDisbursement: 50,
          amount: total * 0.50
        },
        {
          name: "Milestone 2",
          description: "Final payment upon successful completion.",
          percentageDisbursement: 50,
          amount: total * 0.50
        },
      ];
    } else if (total <= 3000000) {
      const pct = parseFloat((100 / 3).toFixed(2));
      const amountPerMilestone = Math.ceil(total / 3);
      generatedMilestones = [
        {
          name: "Milestone 1",
          description: "Initial payment to commence the project.",
          percentageDisbursement: pct,
          amount: amountPerMilestone
        },
        {
          name: "Milestone 2",
          description: "Payment after reaching a significant project milestone.",
          percentageDisbursement: pct,
          amount: amountPerMilestone
        },
        {
          name: "Milestone 3",
          description: "Final payment upon successful completion.",
          percentageDisbursement: 100 - (pct * 2),
          amount: total - (amountPerMilestone * 2)
        },
      ];
    } else { 
      generatedMilestones = [
        {
          name: "Milestone 1",
          description: "Initial payment to commence the project.",
          percentageDisbursement: 25,
          amount: total * 0.25
        },
        {
          name: "Milestone 2",
          description: "Payment after reaching a significant project milestone.",
          percentageDisbursement: 25,
          amount: total * 0.25
        },
        {
          name: "Milestone 3",
          description: "Payment after reaching a significant project milestone.",
          percentageDisbursement: 25,
          amount: total * 0.25
        },
        {
          name: "Milestone 4",
          description: "Final payment upon successful completion.",
          percentageDisbursement: 25,
          amount: total * 0.25
        },
      ];
    }

    localStorage.setItem("milestones", JSON.stringify(generatedMilestones));

    return { milestones: generatedMilestones, totalBidAmount: total };
  }, [response, selectedBid]);

  useEffect(() => {
    setMilestones(derivedData.milestones);
    setTotalBidAmount(derivedData.totalBidAmount);
  }, [derivedData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
    <div className="container mx-auto mb-5 p-6 bg-white shadow-lg rounded-lg border border-gray-200 lg:px-8 py-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Milestones</h2>
      {isReadOnly && (
        <div className="p-3 mb-4 rounded text-center text-yellow-800 bg-yellow-100 border border-yellow-300">
          This section is view-only.
        </div>
      )}
      <div className="p-3 my-4 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
        <p>Based on a total bid amount of <strong>{formatCurrency(totalBidAmount)}</strong>, the following payment milestones have been {isReadOnly ? 'submitted' : 'automatically generated'}.</p>
      </div>

      <div className="bg-white rounded-lg p-4 my-5">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-2 text-gray-700 font-medium">Seq.</th>
                <th className="px-4 py-2 text-gray-700 font-medium">Milestone Name</th>
                <th className="px-4 py-2 text-gray-700 font-medium">Description</th>
                <th className="px-4 py-2 text-gray-600 font-medium">% Disbursement</th>
                <th className="px-4 py-2 text-gray-600 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map((milestone, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2 text-gray-600">{index + 1}</td>
                  <td className="px-4 py-2 text-gray-800">{milestone.name}</td>
                  <td className="px-4 py-2 text-gray-600 text-sm">{milestone.description}</td>
                  <td className="px-4 py-2 text-gray-600">{milestone.percentageDisbursement}%</td>
                  <td className="px-4 py-2 text-gray-800 font-semibold text-right">{formatCurrency(milestone.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between mt-8 space-x-4">
        <button onClick={onPrevClick} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 border border-gray-400">
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
    </div>
  );
};

export default Milestones;