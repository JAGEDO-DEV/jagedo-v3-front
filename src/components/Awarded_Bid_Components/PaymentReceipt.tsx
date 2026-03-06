/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useState } from "react";
import PropTypes from 'prop-types';
import { useParams } from "react-router-dom";
import { payContractorProfessionalJobRequest } from "@/api/jobRequests.api";
import { uploadFile } from "@/utils/fileUpload";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import toast from "react-hot-toast";


const formatCurrency = (amount) => {
  if (typeof amount !== 'number') return "N/A";
  return new Intl.NumberFormat('en-US').format(amount);
};

const PaymentReceipt = ({ data, onBack }) => {
  const { milestones, jobInfo, customerInfo } = data || {
    milestones: [],
    jobInfo: {},
    customerInfo: {}
  };
  const { id } = useParams<{ id: string }>();
  const [method, setMethod] = useState("bank");
  const [phone, setPhone] = useState("");
  const [slipFile, setSlipFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const totalToPay = milestones.reduce((sum, milestone) => sum + milestone.amount, 0);
  const mpesaDisabled = totalToPay > 500_000;
  const today = new Date().toISOString().split('T')[0];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSlipFile(file);
    } else {
      setSlipFile(null);
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      let s3ReceiptKey = "";
      if (method === "bank") {
        if (!slipFile) throw new Error("Payment slip is required for bank transfers.");
        const uploadResponse = await uploadFile(slipFile);
        if (!uploadResponse || !uploadResponse.url) {
          throw new Error("Failed to get URL from file upload response.");
        }
        s3ReceiptKey = uploadResponse.url;
      }
      let phoneNumber = phone;
      if (phone && phone.startsWith("0")) {
        phoneNumber = "254" + phone.substring(1)
      }

      if (phone && phone.startsWith("+")) {
        phoneNumber = phone.substring(1)
      }

      const paymentPayload = {
        milestoneIds: milestones.map(m => m.id),
        amount: totalToPay,
        accountRef: jobInfo?.jobId || "N/A",
        currency: "KES",
        method: method.toUpperCase(),
        phone: method === "mpesa" ? phoneNumber : "",
        s3ReceiptKey: s3ReceiptKey,
      };
      
      const response = await payContractorProfessionalJobRequest(axiosInstance, id, paymentPayload);

      if (response.success) {
        toast.success("Payment submitted successfully!");
        onBack();
      } else {
        throw new Error(response.message || "The API indicated a failure.");
      }
    } catch (err) {
      console.error("Error during payment confirmation:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 bg-gray-50/50">
      <div className="max-w-2xl mx-auto p-6 bg-white border border-gray-300 shadow-md text-gray-800 space-y-6 font-sans text-base">
        {milestones.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-center">
            <p className="font-semibold text-blue-800">
              Processing Payment for Milestone(s): {milestones.map(m => m.name).join(', ')}
            </p>
          </div>
        )}
        <div className="flex justify-between items-start mb-4">
          <img src="/logo.png" alt="JaGedo Logo" className="h-14 w-auto" />
          <div className="text-sm text-right space-y-1">
            <p><strong>Funds request no:</strong> {jobInfo?.jobId || 'N/A'}</p>
            <p><strong>Date:</strong> {today}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p><strong>Funds request to:</strong> {customerInfo?.name || 'N/A'}</p>
            <p><strong>Request type:</strong> Managed by {jobInfo?.managedBy === 'SELF' ? 'Self' : 'JaGedo'}</p>
            <p><strong>Skill:</strong> {jobInfo?.skill || 'N/A'}</p>
          </div>
        </div>
        <div className="border border-gray-400 rounded">
          <div className="grid grid-cols-2 bg-gray-100 font-semibold text-center p-2">
            <span>Description</span>
            <span>Total</span>
          </div>
          {milestones.map(milestone => (
            <div key={milestone.id} className="grid grid-cols-2 text-center p-2 border-t border-gray-300">
              <span>Payment for: {milestone.name}</span>
              <span>{formatCurrency(milestone.amount)}</span>
            </div>
          ))}
          <div className="text-right font-bold p-2 border-t border-gray-300">
            Total (KES): {formatCurrency(totalToPay)}
          </div>
        </div>
        <div className="space-y-3">
          <label className="font-semibold">Select payment method:</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 focus:ring focus:ring-blue-200"
          >
            <option value="mpesa" disabled={mpesaDisabled}>
              Mpesa {mpesaDisabled && "(disabled for > 500K)"}
            </option>
            <option value="bank">Bank</option>
          </select>
          {method === "bank" ? (
            <>
              <div className="ml-4 space-y-1">
                <p><strong>Bank Name:</strong> KCB</p>
                <p><strong>Branch:</strong> Kipande House</p>
                <p><strong>Account:</strong> 132 679 9757</p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center sm:gap-4 mt-3 ml-4">
                <label className="font-semibold mb-1 sm:mb-0">Attach Payment Slip:</label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileChange}
                  className="border border-gray-300 rounded px-2 py-1 text-sm cursor-pointer file:mr-2 file:border-0 file:bg-blue-600 file:text-white file:px-3 file:py-1"
                />
              </div>
            </>
          ) : (
            <div className="ml-4 space-y-2">
              <label className="block font-semibold">Phone Number:</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0700123123" className="border border-gray-300 rounded px-3 py-2 w-64 focus:ring focus:ring-blue-200" />
            </div>
          )}
        </div>
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-center">
            <p className="font-semibold text-red-700">{error}</p>
          </div>
        )}
        <div className="pt-4 flex justify-between items-center">
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="font-semibold text-gray-700 py-2 px-6 rounded-md border border-gray-300 hover:bg-gray-100 transition disabled:bg-gray-200 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="bg-[rgb(0,0,122)] text-white font-semibold px-6 py-2 rounded shadow hover:bg-blue-800 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Confirming...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

PaymentReceipt.propTypes = {
  data: PropTypes.object,
  onBack: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  axiosInstance: PropTypes.object.isRequired,
};

export default PaymentReceipt;