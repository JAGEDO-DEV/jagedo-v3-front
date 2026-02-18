import { useState } from "react";
import { approvePayment } from "@/api/payments.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";

interface PaymentsProps {
  jobData: any;
}

const Payments = ({ jobData }: PaymentsProps) => {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : null;
  const [showDetails, setShowDetails] = useState(false);
  const [showFundRequest, setShowFundRequest] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [confirming, setIsConfirming] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [approvalError, setApprovalError] = useState("");
  const [payments, setPayments] = useState(jobData?.payments || []);

  // Use the assignedBid as the single source of truth for payment data.
  const assignedBid = jobData?.assignedBid;

  // If assignedBid exists, use its data. Otherwise, default to empty/zero values.
  const milestones = assignedBid?.milestones || [];
  const totalAmount = assignedBid?.totalAmount || 0;
  const jagedoCommission = assignedBid?.jagedoCommission || 0;
  const payableAmount = assignedBid?.payableToServiceProvider || 0;

  // Helper function to calculate discount for customers/admins
  const calculateDiscount = (total: number, managedBy: string, user_type: string) => {
    const isCustomerOrAdmin = user_type?.toLowerCase() === 'customer' || user_type?.toLowerCase() === 'admin';
    if (isCustomerOrAdmin && managedBy === 'SELF') {
      return total * 0.20; // 20% discount
    }
    return 0;
  };

  const discount = calculateDiscount(totalAmount, jobData?.managedBy || 'JAGEDO', user?.user_type);
  const discountedTotal = totalAmount - discount;

  // Use the first payment if it exists, otherwise fallback to the calculated payable amount.
  const paymentAmount = payments.length > 0 ? payments[0].amount : payableAmount;

  const handleConfirmPayment = async (paymentId: number) => {
    if (!assignedBid) {
      setApprovalError("Cannot approve payment without an assigned bid.");
      return;
    }

    setIsConfirming(true);
    setApprovalError("");
    setApprovalMessage("");
    try {
      await approvePayment(axiosInstance, jobData.id, paymentId);
      const newPayments = payments.map(p =>
        p.id === paymentId ? { ...p, approved: true } : p
      );
      setPayments(newPayments);
      setApprovalMessage("Payment approved successfully!");
      setTimeout(() => setApprovalMessage(""), 5000);
    } catch (error: any) {
      setApprovalError(error.message || "Failed to approve payment");
      setTimeout(() => setApprovalError(""), 5000);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDownloadFundRequest = () => {
    const data = `
      Funds Request Report
      =====================
      Fund Request to: ${jobData?.assignedServiceProvider?.firstName || 'N/A'} ${jobData?.assignedServiceProvider?.lastName || ''}
      Type: ${jobData?.assignedServiceProvider?.profession || jobData?.assignedServiceProvider?.user_type || 'N/A'}
      Request Type: Managed by JaGedo
      Request ID: #Fr${Date.now()}
      FR Date: ${new Date().toLocaleDateString('en-GB')}
  
      Job: ${jobData?.description || 'N/A'}
      Total Amount: KES ${paymentAmount.toLocaleString()}
  
      Payment Method: Bank Transfer
      Account Name: JaGedo Innovations Limited
      Bank: Kenya Commercial Bank
      Branch: Kipande House Branch
      Account No: 1326749757
    `;

    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "fund-request-report.txt";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Conditionally render all payment info based on assignedBid */}
      {assignedBid ? (
        <>
          {/* Milestones Table */}
          <div className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all my-5">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Milestones</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="px-4 py-2 text-gray-700 font-medium">Milestone</th>
                    <th className="px-4 py-2 text-gray-600 font-medium">% Disbursement</th>
                    <th className="px-4 py-2 text-gray-600 font-medium">Amount (KES)</th>
                    <th className="px-4 py-2 text-gray-600 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {milestones.length > 0 ? (
                    milestones.map((milestone: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-gray-700">{milestone.name || `Milestone ${index + 1}`}</td>
                        <td className="px-4 py-2 text-gray-600">{milestone.percentageDisbursement || 0}%</td>
                        <td className="px-4 py-2 text-gray-600">{(milestone.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${milestone.paid ? 'bg-green-100 text-green-800' : milestone.approved ? 'bg-blue-100 text-blue-800' : milestone.rejected ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {milestone.paid ? 'Paid' : milestone.approved ? 'Approved' : milestone.rejected ? 'Rejected' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No milestones defined for this bid.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-6 mt-6">
            <div className="w-full p-6 rounded-lg flex justify-between items-center bg-gray-50 shadow border border-gray-300">
              <span className="text-gray-600 text-lg">Total (KES)</span>
              <span className="text-2xl font-bold text-blue-900">{totalAmount.toLocaleString()}</span>
            </div>
            {(user?.user_type?.toLowerCase() === 'customer' || user?.user_type?.toLowerCase() === 'admin') && discount > 0 && (
              <>
                <div className="w-full p-6 rounded-lg flex justify-between items-center bg-green-50 shadow border border-green-300">
                  <span className="text-green-800 text-lg font-semibold">Customer Discount (20%)</span>
                  <span className="text-2xl font-bold text-green-600">-{discount.toLocaleString()}</span>
                </div>
                <div className="w-full p-6 rounded-lg flex justify-between items-center bg-blue-50 shadow border border-blue-300">
                  <span className="text-blue-800 text-lg font-semibold">Discounted Total</span>
                  <span className="text-2xl font-bold text-blue-800">{discountedTotal.toLocaleString()}</span>
                </div>
              </>
            )}
            <div className="w-full p-6 rounded-lg flex justify-between items-center bg-gray-50 shadow border border-gray-300">
              <span className="text-gray-600 text-lg">Jagedo Commission</span>
              <span className="text-2xl font-bold text-blue-900">{jagedoCommission.toLocaleString()}</span>
            </div>
            <div className="w-full p-6 rounded-lg flex justify-between items-center bg-gray-50 shadow border border-gray-300">
              <span className="text-gray-600 text-lg">Payable to Service Provider</span>
              <span className="text-2xl font-bold text-blue-900">{payableAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment History */}
          {payments && payments.length > 0 && (
            <div className="bg-white rounded-lg p-4 mt-6 shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Payment History</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="px-4 py-2 text-gray-700 font-medium">Date</th>
                      <th className="px-4 py-2 text-gray-700 font-medium">Amount</th>
                      <th className="px-4 py-2 text-gray-700 font-medium">Payment Method</th>
                      <th className="px-4 py-2 text-gray-700 font-medium">Status</th>
                      <th className="px-4 py-2 text-gray-700 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment: any) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-2 text-gray-700">{new Date(payment.createdAt).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-2 text-gray-600">{payment.amount?.toLocaleString()}</td>
                        <td className="px-4 py-2 text-gray-600">{payment.paymentType || 'N/A'}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.paymentStatus === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {payment.paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {payment.approved ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>
                          ) : (
                            <button
                              onClick={() => handleConfirmPayment(payment.id)}
                              disabled={confirming}
                              className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
                            >
                              {confirming ? 'Approving...' : 'Confirm Payment'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Requests Section */}
          {payments.length > 0 ? (
            <div className="flex flex-col items-center mt-8 bg-gray-50">
              <h2 className="text-xl font-semibold mb-6 text-gray-800">Admin Payment Confirmation</h2>
              <div className="w-full max-w-2xl mb-6">
                <button
                  type="button"
                  className="border border-gray-300 px-6 py-3 w-full flex justify-between items-center bg-white shadow-sm rounded-md hover:bg-gray-100"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  Job Details
                  <span className="text-lg text-gray-600">{showDetails ? "▲" : "▼"}</span>
                </button>
                {showDetails && (
                  <div className="mt-4 space-y-6">
                    <div className="p-8 rounded-xl shadow-lg bg-white hover:shadow-xl transition-all duration-300">
                      <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6">Job Details</h2>
                      <div className="flex justify-between gap-8">
                        <div className="w-1/2 space-y-4">
                          {[
                            { label: "Job Type", value: jobData?.jobType || "N/A" },
                            { label: "Skill", value: jobData?.skill || "N/A" },
                            { label: "Location", value: jobData?.location || "N/A" },
                            { label: "Start Date", value: jobData?.startDate ? new Date(jobData.startDate).toLocaleDateString('en-GB') : "N/A" },
                            { label: "End Date", value: jobData?.endDate ? new Date(jobData.endDate).toLocaleDateString('en-GB') : "N/A" },
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center bg-gray-50 p-3 rounded-lg">
                              <span className="font-semibold text-gray-800 w-24">{item.label}:</span>
                              <span className="text-gray-700">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-end mt-2">
                  <button type="button" className="border border-gray-300 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                    Download Report
                  </button>
                </div>
              </div>

              {/* Fund Request Details */}
              <div className="border border-gray-300 p-8 w-full max-w-3xl mb-6 flex flex-col justify-between bg-white shadow-sm rounded-md">
                <button
                  type="button"
                  className="border border-gray-300 px-6 py-3 w-full flex justify-between items-center bg-white shadow-sm rounded-md hover:bg-gray-100 mb-4"
                  onClick={() => setShowFundRequest(!showFundRequest)}
                >
                  Fund Request Details
                  <span className="text-lg text-gray-600">{showFundRequest ? "▲" : "▼"}</span>
                </button>
                {showFundRequest && (
                  <div className="p-6 bg-white shadow-lg rounded-lg space-y-6">
                    <div className="flex justify-between items-center border-b pb-4">
                      <img src="/logo.png" alt="Company Logo" className="h-12 w-auto" />
                      <div className="text-right">
                        <h2 className="text-xl font-bold text-gray-800">Funds Request</h2>
                        <p className="text-gray-700 font-semibold">#Fr{jobData?.id || Date.now()}</p>
                        <p className="text-gray-600">FR Date: {new Date().toLocaleDateString('en-GB')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-gray-700">
                      <p className="font-semibold">Fund Request to: <span className="font-normal">{jobData?.assignedServiceProvider?.firstName || 'N/A'} {jobData?.assignedServiceProvider?.lastName || ''}</span></p>
                      <p className="font-semibold">Profession: <span className="font-normal">{jobData?.assignedServiceProvider?.profession || jobData?.skill || 'N/A'}</span></p>
                      <p className="font-semibold">Request Type: <span className="font-normal">Managed by JaGedo</span></p>
                      <p className="font-semibold">Milestone no: <span className="font-normal">1</span></p>
                    </div>
                    <table className="w-full border-collapse border border-gray-300 text-gray-700 mt-4">
                      <thead><tr className="bg-gray-100 text-left"><th className="border border-gray-300 px-4 py-3">Description</th><th className="border border-gray-300 px-4 py-3 text-right">Sum</th><th className="border border-gray-300 px-4 py-3 text-right">Total</th></tr></thead>
                      <tbody>
                        <tr className="border border-gray-300"><td className="border border-gray-300 px-4 py-3">{jobData?.description || 'Project work'}</td><td className="border border-gray-300 px-4 py-3 text-right">KES {paymentAmount.toLocaleString()}</td><td className="border border-gray-300 px-4 py-3 text-right">KES {paymentAmount.toLocaleString()}</td></tr>
                        <tr className="border border-gray-300 font-semibold bg-gray-100"><td className="border border-gray-300 px-4 py-3 text-right">Total</td><td className="border border-gray-300 px-4 py-3 text-right">KES {paymentAmount.toLocaleString()}</td><td className="border border-gray-300 px-4 py-3 text-right">KES {paymentAmount.toLocaleString()}</td></tr>
                      </tbody>
                    </table>
                    <div className="flex justify-end mt-4">
                      <button type="button" onClick={handleDownloadFundRequest} className="border border-gray-300 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Download Fund Request Report</button>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-gray-800">Payment Details</h3>
                      <p className="text-gray-700">🏦 Bank Transfer</p>
                      <p className="text-gray-700">📌 Account Name: <span className="font-semibold">JaGedo Innovations Limited</span></p>
                      <p className="text-gray-700">🏛️ Bank: Kenya Commercial Bank</p>
                      <p className="text-gray-700">🏢 Branch: Kipande House Branch</p>
                      <p className="text-gray-700">🔢 Account No: <span className="font-semibold">1326749757</span></p>
                    </div>
                  </div>
                )}
                {(approvalMessage || approvalError) && (
                  <div className="mb-4 mt-4">
                    {approvalMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-2"><div className="flex items-center"><svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>{approvalMessage}</div></div>}
                    {approvalError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2"><div className="flex items-center"><svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>{approvalError}</div></div>}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-600 text-lg">No payment requests available</p>
              <p className="text-gray-500 text-sm mt-2">Payment requests will appear here when submitted by the service provider.</p>
            </div>
          )}
        </>
      ) : (
        <div className="mt-8 p-8 bg-gray-50 rounded-lg text-center border-2 border-dashed">
          <h2 className="text-xl font-semibold text-gray-700">Awaiting Bid Assignment</h2>
          <p className="text-gray-500 text-md mt-2">
            Payment milestones and financial details will be displayed here once a bid has been assigned to this job.
          </p>
        </div>
      )}
    </div>
  );
};

export default Payments;