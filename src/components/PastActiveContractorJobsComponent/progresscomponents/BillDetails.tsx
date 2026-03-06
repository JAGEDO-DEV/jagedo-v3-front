/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader } from "lucide-react";
import { toast } from "react-hot-toast";
import { DashboardHeader } from "@/components/DashboardHeader";
import { getJobRequestById } from "@/api/jobRequests.api";
import { updateWorkPlanItem, updateWorkPlanRemarks } from "@/api/bidRequests.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";

const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const BillDetails = () => {
    const { id, billid } = useParams();
    const [workPlan, setWorkPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [job, setJob] = useState(null);
    const [savingItemId, setSavingItemId] = useState(null);
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [remarks, setRemarks] = useState('');
    const [savingRemarks, setSavingRemarks] = useState(false);
    useEffect(() => {
        const fetchWorkPlan = async () => {
            setLoading(true);
            try {
                const response = await getJobRequestById(axiosInstance, id);
                if (response && response.success) {
                    const jobData = response.data;
                    setJob(jobData);
                    if (jobData?.assignedBid?.workPlans) {
                        const foundWorkPlan = jobData.assignedBid.workPlans.find(
                            (wp) => wp.id === parseInt(billid)
                        );
                        
                        if (foundWorkPlan) {
                            setWorkPlan(foundWorkPlan);
                        } else {
                            throw new Error(`Work Plan with ID ${billid} not found.`);
                        }
                    } else {
                        throw new Error("Invalid job data structure received from API.");
                    }
                } else {
                    throw new Error(response.message || "API returned a failure status.");
                }
            } catch (error) {
                console.error("Failed to fetch work plan details", error);
                toast.error("Failed to load bill details.");
            } finally {
                setLoading(false);
            }
        };

        if (id && billid) {
            fetchWorkPlan();
        } else {
            setLoading(false);
            toast.error("Job ID or Bill ID is missing.");
        }
    }, [id, billid]);

    const handleItemUpdate = (itemId, field, value) => {
        setWorkPlan(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.id === itemId
                    ? { ...item, [field]: value }
                    : item
            )
        }));
    };


    const handleSaveRemarks = async () => {
        if (!workPlan) return;

        setSavingRemarks(true);
        try {
            // Replace with your actual API endpoint to update remarks
            const response = await updateWorkPlanRemarks(axiosInstance, workPlan.id, remarks);

            if (response && response.success) {
                // Update local state
                setWorkPlan(prev => ({ ...prev, remarks }));
                toast.success("Remarks saved successfully!");
            } else {
                throw new Error(response.message || "Failed to save remarks");
            }
        } catch (error) {
            console.error("Failed to save remarks", error);
            toast.error("Failed to save remarks.");
        } finally {
            setSavingRemarks(false);
        }
    };

    const handleSaveItem = async (items) => {
        
        // return;
        // setSavingItemId(item.id);
        try {
            // Replace this with your actual API call to update the item
            const response = await updateWorkPlanItem(axiosInstance, job.assignedBid.id, workPlan.id, items);

            if (response && response.success) {
                toast.success(`Bill Items updated successfully!`);
            } else {
                throw new Error(response.message || "Failed to update item");
            }
        } catch (error) {
            console.error("Failed to update item", error);
            toast.error(`Failed to update bill items`);
        } finally {
            setSavingItemId(null);
        }
    };
    const calculateActualSubtotal = (item) => {
        if (item.quantity !== null && item.quantity !== undefined) {
            return (item.quantity * item.unitRate).toFixed(2);
        }
        return '0.00';
    };

    // Helper function to format numbers for input fields
    const formatNumberForInput = (value) => {
        return value === null || value === undefined ? '' : value.toString();
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><Loader className="animate-spin h-8 w-8" /></div>;
    }
    if (!workPlan) {
        return <div className="p-8 text-center text-red-500">Bill details not found.</div>;
    }

    return (
        <>
            <DashboardHeader />
            <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
                <div className="max-w-full mx-auto">
                    <div className="pb-4 mb-6 border-b border-gray-300">
                        <h1 className="text-2xl font-bold text-gray-800">{workPlan.name}</h1>
                        <p className="text-gray-600">Details for Bill ID: {workPlan.id}</p>
                    </div>

                    {/* Work Plan Details Table */}
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8 overflow-x-auto">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Bill Details</h2>
                        <table className="w-full min-w-[1000px] text-sm">
                            <thead className="text-left text-gray-600 bg-gray-50">
                                <tr>
                                    <th className="p-3 font-semibold">Bill Name</th>
                                    <th className="p-3 font-semibold">Planned Start</th>
                                    <th className="p-3 font-semibold">Planned End</th>
                                    <th className="p-3 font-semibold">Actual Start</th>
                                    <th className="p-3 font-semibold">Actual End</th>
                                    <th className="p-3 font-semibold">Duration (Days)</th>
                                    <th className="p-3 font-semibold">Progress</th>
                                    {/* Removed Remarks column from table */}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t">
                                    <td className="p-3 font-medium text-gray-800 whitespace-nowrap">{workPlan.name}</td>
                                    <td className="p-3 whitespace-nowrap">{formatDate(workPlan.startDate) || 'N/A'}</td>
                                    <td className="p-3 whitespace-nowrap">{formatDate(workPlan.endDate) || 'N/A'}</td>
                                    <td className="p-3 whitespace-nowrap">{formatDate(workPlan.actualStartDate) || 'Not Started'}</td>
                                    <td className="p-3 whitespace-nowrap">{formatDate(workPlan.actualEndDate) || 'Not Finished'}</td>
                                    <td className="p-3">{workPlan.durationDays}</td>
                                    <td className="p-3">{`${workPlan.progress || 0}%`}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Separate Remarks Section */}
                        <div className="mt-6 border-t pt-6">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-semibold text-gray-800">Remarks</h3>
                                <button
                                    onClick={handleSaveRemarks}
                                    disabled={savingRemarks}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                                >
                                    {savingRemarks ? (
                                        <>
                                            <Loader className="animate-spin h-4 w-4 mr-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Remarks'
                                    )}
                                </button>
                            </div>
                            <textarea
                                value={remarks || workPlan.remarks || ''}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Enter remarks here..."
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                            />
                            {!workPlan.remarks && (
                                <p className="text-gray-500 text-sm mt-1">No remarks provided.</p>
                            )}
                        </div>
                    </div>

                    {/* Work Plan Items Table */}
                    <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Bill Items</h2>
                        {workPlan.items && workPlan.items.length > 0 ? (
                            <table className="w-full min-w-[1200px] text-sm">
                                <thead className="text-left text-gray-600 bg-gray-50">
                                    <tr>
                                        <th className="p-3 font-semibold">Description</th>
                                        <th className="p-3 font-semibold">UOM</th>
                                        <th className="p-3 font-semibold">Planned Qty</th>
                                        <th className="p-3 font-semibold">Unit Rate</th>
                                        <th className="p-3 font-semibold">Planned Amount</th>
                                        <th className="p-3 font-semibold">Actual Qty</th>
                                        <th className="p-3 font-semibold">Actual Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workPlan.items.map((item) => (
                                        <tr key={item.id} className="border-t hover:bg-gray-50">
                                            <td className="p-3 font-medium text-gray-800">
                                                {item.description}
                                            </td>

                                            <td className="p-3 text-gray-600">
                                                {item.uom || 'N/A'}
                                            </td>

                                            <td className="p-3 text-gray-600">
                                                {item.quantity}
                                            </td>

                                            <td className="p-3 text-gray-600">
                                                {item.unitRate}
                                            </td>

                                            <td className="p-3 text-gray-600">
                                                {item.amount}
                                            </td>

                                            <td className="p-3 text-gray-600">
                                                {item.quantity}
                                            </td>
                                            {/* <td className="p-3">
                                                <input
                                                    type="number"
                                                    value={formatNumberForInput(item.actualQuantity)}
                                                    onChange={(e) => handleItemUpdate(item.id, 'actualQuantity', e.target.value ? Number(e.target.value) : null)}
                                                    className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Enter actual quantity"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </td> */}

                                            <td className="p-3">
                                                <div className="w-full px-2 py-1 border border-gray-300 rounded bg-gray-50 text-gray-700">
                                                    {calculateActualSubtotal(item)}
                                                </div>
                                            </td>


                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No items found for this work plan.
                            </div>
                        )}
                        <div>
                            {/* <button
                                onClick={() => handleSaveItem(workPlan.items)}
                                disabled={workPlan.items.length < 1}
                                className={`px-4 py-2 rounded text-white font-medium ${workPlan.items.length < 1
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {workPlan.items.length < 1 ? (
                                    <Loader className="animate-spin h-4 w-4 mx-2" />
                                ) : (
                                    'Save'
                                )}
                            </button> */}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BillDetails;