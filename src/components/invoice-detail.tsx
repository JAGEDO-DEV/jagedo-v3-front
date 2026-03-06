/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { ArrowLeft } from "lucide-react";
import { FaDownload } from "react-icons/fa";
import { IoIosPrint } from "react-icons/io";
import { toast } from "react-hot-toast";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { payJobRequest } from "@/api/jobRequests.api";
import { Button } from "@/components/ui/button";
import { useGlobalContext } from "@/context/GlobalProvider";

interface InvoiceDetailProps {
    invoice: {
        id: number;
        jobId: string;
        jobType: string;
        skill: string;
        description: string;
        location: string;
        startDate: string;
        status: string;
        managedBy: string;
        basePrice: number;
        jagedoFee: number;
    };
    onPayment?: () => void;
    onBack?: () => void;
}

export function InvoiceDetail({ invoice, onPayment, onBack }: InvoiceDetailProps) {
    const { user } = useGlobalContext();
    const [isPaying, setIsPaying] = useState(false);
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [paymentMade, setPaymentMade] = useState(invoice.status.toUpperCase() === "PAID");
    const [phone, setPhone] = useState(user?.phoneNumber || "");

    const isFundi = invoice?.jobType.toLowerCase() === "fundi";

    const subtotal = invoice?.discountedPrice;
    const platformFee = invoice?.jagedoFee;
    const totalBeforeVat = subtotal;
    
    const totalInclusivePlatformFee = subtotal;
    
    const vatAmount = isFundi ? 0 : totalInclusivePlatformFee * 0.16;
    const finalTotal = totalInclusivePlatformFee + vatAmount;

    const handlePaymentClick = async () => {
        if (!phone) {
            toast.error("Please enter a valid phone number.");
            return;
        }
        setIsPaying(true);
        toast.success("You will receive a payment prompt on your phone");
        try {
            const sanitizedPhone = phone.startsWith('0') ? phone.substring(1) : phone;
            const paymentData = {
                accountRef: `${invoice.jobId}`,
                amount: Math.ceil(finalTotal),
                phone: `${sanitizedPhone}`
            };
            const response = await payJobRequest(axiosInstance, invoice.id, paymentData);
            if (response?.success) {
                setPaymentMade(true);
                if (onPayment) onPayment();
            } else {
                toast.error(response?.message || "Payment failed.");
            }
        } catch (err: any) {
            console.error("Payment failed:", err);
            toast.error(err.message || "Payment failed");
        } finally {
            setIsPaying(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="mb-4 flex justify-between items-center no-print">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="flex items-center text-gray-600 hover:text-[#00007a]"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            </div>

            <div
                className="max-w-[794px] mx-auto bg-white shadow-xl rounded-2xl p-8 border border-gray-200 printable-content"
            >
                <div className="flex justify-end mb-6">
                    <span
                        className={`text-sm font-bold px-4 py-1 rounded-full uppercase tracking-wide ${paymentMade
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : "bg-red-100 text-red-700 border border-red-300"
                            }`}
                    >
                        {paymentMade ? "Paid" : "Unpaid"}
                    </span>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center border-b pb-6">
                    <img
                        src="/jagedologo.png"
                        alt="JAGEDO Logo"
                        className="h-16 md:h-20"
                    />
                    <div className="flex space-x-4 mt-6 md:mt-0 no-print">
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="flex items-center px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm transition"
                        >
                            <FaDownload className="mr-2" /> Download
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-gray-700 text-base">
                    <div className="space-y-1">
                        <p className="font-semibold">
                            Fund Request To:{" "}
                            <span className="font-normal">{user?.firstName} {user?.lastName}</span>
                        </p>
                        <p className="font-semibold">
                            Request Type:{" "}
                            <span className="font-normal">{invoice.managedBy}</span>
                        </p>
                        <p className="font-semibold">
                            Skill:{" "}
                            <span className="font-normal">{invoice.skill}</span>
                        </p>
                    </div>
                    <div className="text-left md:text-right space-y-1">
                        <p className="font-semibold">
                            Fund Request No:{" "}
                            <span className="font-normal">{invoice.jobId || 'N/A'}</span>
                        </p>
                        <p className="font-semibold">
                            Date:{" "}
                            <span className="font-normal">{new Date(invoice.startDate).toLocaleDateString('en-GB')}</span>
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto mt-8 border rounded-lg">
                    <table className="w-full text-sm text-left text-gray-800">
                        <thead className="bg-gray-100 border-b">
                            <tr>
                                <th className="px-6 py-3 border-r">Description</th>
                                <th className="px-6 py-3 border-r text-right">Sum (KES)</th>
                                <th className="px-6 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b hover:bg-gray-50">
                                <td className="px-6 py-4 border-r">{invoice.description}</td>
                                <td className="px-6 py-4 border-r text-right">{totalBeforeVat.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                <td className="px-6 py-4 text-right">{totalBeforeVat.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            {/* {platformFee > 0 && (
                                <tr className="border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 border-r">JaGedo Platform Fee (10%)</td>
                                    <td className="px-6 py-4 border-r text-right">{platformFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    <td className="px-6 py-4 text-right">{platformFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            )} */}
                        </tbody>
                    </table>
                </div>

                <div className="overflow-x-auto w-full md:w-1/2 ml-auto mt-10 border rounded-lg">
                    <table className="w-full text-sm text-left text-gray-800">
                        <tbody>
                            <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-semibold text-right">Total (KES)</td>
                                <td className="px-6 py-4 text-right">{totalInclusivePlatformFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-semibold text-right">VAT 16%</td>
                                <td className="px-6 py-4 text-right">{vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            <tr className="hover:bg-gray-50 font-bold">
                                <td className="px-6 py-4 text-right">Total Including VAT</td>
                                <td className="px-6 py-4 text-right">{finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            </tr>
                            {paymentMade && (
                                <tr className="hover:bg-gray-50 text-green-700 font-semibold">
                                    <td className="px-6 py-4 text-right">
                                        Paid by KE3D8CURS76EQNB-1:
                                    </td>
                                    <td className="px-6 py-4 text-right">{finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!paymentMade && (
                    <div className="mt-10 no-print">
                        <div className="flex justify-end mb-2">
                            <label className="text-sm font-semibold text-gray-700">
                                Enter phone number to make payment:
                            </label>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-4">
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g., 0712345678"
                                className="w-full sm:w-[250px] px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isPaying}
                            />
                            <button
                                type="button"
                                onClick={handlePaymentClick}
                                disabled={isPaying || !phone}
                                className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-md transition font-semibold disabled:bg-gray-400"
                            >
                                {isPaying ? "Processing..." : "Pay"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}