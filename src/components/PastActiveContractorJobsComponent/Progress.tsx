/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader, CheckCircle, AlertTriangle } from "lucide-react";
import { getJobRequestById } from "@/api/jobRequests.api";
import { updateBidWorkplan } from "@/api/bidRequests.api";
import { useGlobalContext } from "@/context/GlobalProvider";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import {
    startProgressWorkPlan,
    completeProgressWorkPlan,
    approveProgressWorkPlan,
    requestMilestonePayment,
    approveMilestonePayment
} from "@/api/bidRequests.api";
import { completeJob } from "@/api/jobRequests.api";
import { approveJobCompletion } from "@/api/jobRequests.api";
import { toast } from "react-hot-toast";

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
};

const toISOStringOrNull = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
}

const TechnicalProgressView = ({ workPlans, onWorkPlanChange, onUpdateWorkPlan, savingWorkPlanId, user, jobData, refetchJobData }) => {
    const navigate = useNavigate();
    const isEditable = user?.user_type === 'PROFESSIONAL' || user?.user_type === 'CONTRACTOR';
    const isCustomer = user.user_type === 'CUSTOMER' || user.user_type === 'ADMIN';

    const sortedWorkPlans = useMemo(() => workPlans.sort((a, b) => a.id - b.id), [workPlans]);

    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

    const handleProgressWorkPlan = async (bidId, workPlanId, nextAction) => {
        if (nextAction === "Start") {
            await handleStartProgressWorkPlan(bidId, workPlanId);
        }

        if (nextAction === 'Complete') {
            await handleCompleteProgressWorkPlan(bidId, workPlanId);
        }

        if (nextAction === "Approve Completion") {
            await handleApproveProgressWorkPlan(bidId, workPlanId)
        }
    };

    const handleStartProgressWorkPlan = async (bidId, workPlanId) => {
        try {
            const res = await startProgressWorkPlan(axiosInstance, bidId, workPlanId);
            if (res && res.success) {
                toast.success(`Work plan started successfully`);
                await refetchJobData();
            } else {
                throw new Error(res?.message || "Failed to start work plan");
            }
        } catch (error) {
            toast.error(error.message || "Failed to start work plan");
        }
    };

    const handleCompleteProgressWorkPlan = async (bidId, workPlanId) => {
        try {
            const res = await completeProgressWorkPlan(axiosInstance, bidId, workPlanId);
            if (res && res.success) {
                toast.success(`Work plan completed successfully`);
                await refetchJobData();
            } else {
                throw new Error(res?.message || "Failed to complete work plan");
            }
        } catch (error) {
            toast.error(error.message || "Failed to complete work plan");
        }
    };

    const handleApproveProgressWorkPlan = async (bidId, workPlanId) => {
        try {
            const res = await approveProgressWorkPlan(axiosInstance, bidId, workPlanId);
            if (res && res.success) {
                toast.success(`Work plan approved successfully`);
                await refetchJobData();
            } else {
                throw new Error(res?.message || "Failed to approve work plan");
            }
        } catch (error) {
            toast.error(error.message || "Failed to approve work plan");
        }
    };

    const getNextAction = (workPlan) => {
        const currentStage = workPlan.stage?.toLowerCase();
        switch (currentStage) {
            case 'pending':
            case 'not started':
            case null:
            case undefined:
                return 'Start';
            case 'started':
            case 'in_progress':
            case 'in progress':
                return 'Complete';
            case 'completed':
            case 'complete':
                if (isEditable) return 'Completed';
                if (isCustomer) return 'Approve Completion';
                break;
            case 'approved':
                return 'Approved'
            default:
                return 'Completed';
        }
    };

    const isButtonDisabled = (workPlan) => {
        const currentStage = workPlan.stage?.toLowerCase();
        const nextAction = getNextAction(workPlan);

        if (!isEditable && !isCustomer) {
            return true;
        }

        return (
            savingWorkPlanId === workPlan.id ||
            nextAction === 'Completed' ||
            (currentStage === 'approved')
        );
    };

    const getButtonStyles = (action) => {
        const baseStyles = "text-xs px-3 py-1.5 rounded-md shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]";
        switch (action) {
            case 'Start':
                return `bg-green-600 text-white hover:bg-green-700 ${baseStyles}`;
            case 'Complete':
            case 'Complete Job Milestone':
                return `bg-blue-600 text-white hover:bg-blue-700 ${baseStyles}`;
            case 'Approve Completion':
                return `bg-purple-600 text-white hover:bg-purple-700 ${baseStyles}`;
            case 'Approved':
                return `bg-green-500 text-white cursor-not-allowed ${baseStyles}`;
            case 'Completed':
                return `bg-gray-500 text-white cursor-not-allowed ${baseStyles}`;
            default:
                return `bg-gray-600 text-white ${baseStyles}`;
        }
    };

    let headers = ['Item no.', 'Activity', 'Contribution', 'Planned Start Date', 'Planned End Date', 'Actual Start Date', 'Actual End Date', 'Status'];
    if (isEditable || isCustomer) {
        headers.push('Action');
    }

    return (
        <div className="max-w-full overflow-x-auto mx-auto w-full md:w-[90%] lg:w-[100%]">
            <h2 className="text-xl font-semibold mb-3">Technical Progress</h2>
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <div className="hidden lg:block">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr className="border-b">
                                {headers.map(header => (
                                    <th key={header} className="border p-2 font-semibold">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedWorkPlans.map((workPlan, index) => {
                                const nextAction = getNextAction(workPlan);
                                const isDisabled = isButtonDisabled(workPlan);
                                const buttonStyles = getButtonStyles(nextAction);
                                return (<tr key={workPlan.id} className="text-center border">
                                    <td className="border p-2">{index + 1}</td>
                                    <td className="border p-2 text-left font-medium" onClick={() => navigate(`/bill-details/${jobData.id}/${workPlan.id}`)}><a href="">{workPlan.name}</a></td>
                                    <td className="border p-2">
                                        <span>
                                            {workPlan?.contribution ?? 0}
                                        </span>
                                    </td>
                                    <td className="border p-2">{formatDateForInput(workPlan.startDate)}</td>
                                    <td className="border p-2">{formatDateForInput(workPlan.endDate)}</td>
                                    <td className="border p-2">
                                        {formatDateForInput(workPlan.actualStartDate) || 'Not started'}
                                    </td>
                                    <td className="border p-2">
                                        {formatDateForInput(workPlan.actualEndDate) || 'Not completed'}
                                    </td>

                                    <td className="border p-2">
                                        <span className="capitalize bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">
                                            {workPlan.stage?.replace(/_/g, ' ') || 'Not Started'}
                                        </span>
                                    </td>
                                    {(isEditable || isCustomer) && (
                                        <td className="border p-2">
                                            {isEditable ? (
                                                <button
                                                    onClick={() => handleProgressWorkPlan(jobData?.assignedBid?.id, workPlan.id, nextAction)}
                                                    disabled={isDisabled}
                                                    className={buttonStyles}
                                                >
                                                    {savingWorkPlanId === workPlan.id ? (
                                                        <Loader className="animate-spin h-3 w-3" />
                                                    ) : (
                                                        nextAction
                                                    )}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleApproveProgressWorkPlan(jobData?.assignedBid?.id, workPlan.id)}
                                                    disabled={!['completed', 'complete'].includes(workPlan.stage?.toLowerCase())}
                                                    className={buttonStyles}
                                                >
                                                    {workPlan.stage?.toLowerCase() === "approved" ? (
                                                        'Approved'
                                                    ) : (
                                                        'Approve Completion'
                                                    )}
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="lg:hidden space-y-4">
                    {sortedWorkPlans.map((workPlan, index) => {
                        const nextAction = getNextAction(workPlan);
                        const isDisabled = isButtonDisabled(workPlan);
                        const buttonStyles = getButtonStyles(nextAction);
                        return (
                            <div key={workPlan.id} className="p-3 border border-gray-200 rounded-lg shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-sm text-gray-900 truncate pr-2">#{index + 1} {workPlan.name}</h3>
                                    {isEditable && (
                                        <button
                                            onClick={() => onUpdateWorkPlan(workPlan)}
                                            disabled={savingWorkPlanId === workPlan.id}
                                            className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[60px]"
                                        >
                                            {savingWorkPlanId === workPlan.id ? (
                                                <Loader className="animate-spin h-3 w-3" />
                                            ) : (
                                                'Update'
                                            )}
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                                        <div className="w-full p-2 text-sm">
                                            <span className="capitalize bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">
                                                {workPlan.stage?.replace(/_/g, ' ') || 'Not Started'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Remarks</label>
                                        <input
                                            type="text"
                                            placeholder="Enter remarks"
                                            className="w-full border border-black rounded-md p-2 text-sm"
                                            value={workPlan.remarks || ''}
                                            onChange={(e) => onWorkPlanChange(workPlan.id, 'remarks', e.target.value)}
                                            readOnly={!isEditable}
                                        />
                                    </div>
                                    <div className="text-sm">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Planned Start</label>
                                        <div className="text-gray-800 p-2 border border-transparent">{formatDateForInput(workPlan.startDate)}</div>
                                    </div>
                                    <div className="text-sm">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Planned End</label>
                                        <div className="text-gray-800 p-2 border border-transparent">{formatDateForInput(workPlan.endDate)}</div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Actual Start</label>
                                        <input
                                            type="date"
                                            className="w-full border border-black rounded-md p-2 text-sm"
                                            value={formatDateForInput(workPlan.actualStartDate)}
                                            onChange={(e) => onWorkPlanChange(workPlan.id, 'actualStartDate', e.target.value)}
                                            readOnly={!isCustomer}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Actual End</label>
                                        <input
                                            type="date"
                                            className="w-full border border-black rounded-md p-2 text-sm"
                                            value={formatDateForInput(workPlan.actualEndDate)}
                                            onChange={(e) => onWorkPlanChange(workPlan.id, 'actualEndDate', e.target.value)}
                                            readOnly={!isCustomer}
                                        />
                                    </div>
                                </div>

                                {(isEditable || isCustomer) && (
                                    <div className="flex justify-end">
                                        {isEditable ? (
                                            <button
                                                onClick={() => handleProgressWorkPlan(jobData?.assignedBid?.id, workPlan.id, nextAction)}
                                                disabled={isDisabled}
                                                className={buttonStyles}
                                            >
                                                {savingWorkPlanId === workPlan.id ? (
                                                    <Loader className="animate-spin h-3 w-3" />
                                                ) : (
                                                    nextAction
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleApproveProgressWorkPlan(jobData?.assignedBid?.id, workPlan.id)}
                                                disabled={!['completed', 'complete'].includes(workPlan.stage?.toLowerCase())}
                                                className={buttonStyles}
                                            >
                                                {workPlan.stage?.toLowerCase() === "approved" ? (
                                                    'Approved'
                                                ) : (
                                                    'Approve Completion'
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const FinancialProgressView = ({ milestones, jobId, user, jobData, refetchJobData }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditable = user?.user_type === 'PROFESSIONAL' || user?.user_type === 'CONTRACTOR';
    const isCustomer = user?.user_type === 'CUSTOMER';
    const isAdmin = user?.user_type === 'ADMIN';

    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

    const [isCompleting, setIsCompleting] = useState(false);

    const allMilestonesComplete = milestones.every(milestone => milestone?.complete);
    const allMilestonesApproveComplete = milestones.every(milestone => milestone?.completeApproved);

    const getStatus = (milestone) => {
        if (milestone.paid) return { text: "Customer Paid", color: "bg-green-100 text-green-800" };
        if (milestone.approved) return { text: "Awaiting Payment", color: "bg-blue-100 text-blue-800" };
        if (milestone.stage == "payment_requested") return { text: "Payment Requested", color: "bg-blue-100 text-blue-800" };
        if (milestone.stage == "payment_approved") return { text: "Payment Approved", color: "bg-green-100 text-green-800" };
        return { text: "Not paid", color: "bg-gray-100 text-gray-800" };
    }

    const handleCompleteJob = async () => {
        if (!allMilestonesComplete) return;

        setIsCompleting(true);
        try {
            await completeJob(axiosInstance, jobId);
            toast.success("Job completed successfully");
            refetchJobData();
        } catch (error) {
            console.error('Failed to complete job:', error);
            toast.error("Failed to complete job");
        } finally {
            setIsCompleting(false);
        }
    };

    const handleApproveCompleteJob = async () => {
        if (!allMilestonesApproveComplete) return;

        setIsCompleting(true);
        try {
            await approveJobCompletion(axiosInstance, jobId);
            toast.success("Job completion approved successfully");
            refetchJobData();
        } catch (error) {
            console.error('Failed to approve job completion:', error);
            toast.error("Failed to approve job completion");
        } finally {
            setIsCompleting(false);
        }
    };

    const handleRequestMilestonePayment = (id: number) => async () => {
        try {
            const res = await requestMilestonePayment(axiosInstance, id);
            if (res && res.success) {
                toast.success(`Payment requested successfully!`);
                refetchJobData();
            } else {
                throw new Error(res?.message || "Failed to request payment");
            }
        } catch (error) {
            console.error('Failed to request milestone payment:', error);
            toast.error(error.message || "Failed to request payment");
        }
    };

    const handleApproveMilestonePayment = (id: number) => async () => {
        try {
            const res = await approveMilestonePayment(axiosInstance, id);
            if (res && res.success) {
                toast.success(`Payment approved successfully!`);
                refetchJobData();
            } else {
                throw new Error(res?.message || "Failed to approve payment");
            }
        } catch (error) {
            console.error('Failed to approve milestone payment:', error);
            toast.error(error.message || "Failed to approve payment");
        }
    };

    let headers = ['Milestone', 'Description', '%', 'Status', 'Amount'];
    if (isAdmin || isEditable || isCustomer) {
        headers.push('Action');
    }

    return (
        <div className="max-w-full overflow-x-auto mx-auto w-full md:w-[90%] lg:w-[80%] space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-3">Disbursement Schedule</h2>
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="hidden md:block">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr className="border-b">
                                    {headers.map(header => (
                                        <th key={header} className="border p-2 font-semibold">{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[...milestones]
                                    .sort((a, b) => a.id - b.id)
                                    .map((milestone) => {
                                        const status = getStatus(milestone);
                                        return (
                                            <tr key={milestone.id} className="text-center border">
                                                <td className="border p-2">{milestone.id}</td>
                                                <td className="border p-2 text-left">{milestone.name}</td>
                                                <td className="border p-2">{milestone.percentageDisbursement}%</td>
                                                <td className="border p-2">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                                                        {status.text}
                                                    </span>
                                                </td>
                                                <td className="border p-2 font-mono">{milestone.amount.toLocaleString('en-KE')}</td>
                                                {(isAdmin || isEditable || isCustomer) && (
                                                    <td className="border p-2">
                                                        {isEditable && (
                                                            <button
                                                                onClick={handleRequestMilestonePayment(milestone.id)}
                                                                disabled={milestone.stage === 'payment_requested' || milestone.stage === 'payment_approved'}
                                                                className={`mr-2 bg-gradient-to-r from-green-500 to-teal-600 text-white text-xs px-4 py-1.5 rounded-md shadow-sm transition-all ${milestone.stage === 'payment_requested' || milestone.stage === 'payment_approved'
                                                                    ? 'opacity-50 cursor-not-allowed'
                                                                    : 'hover:shadow-md hover:from-green-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400'
                                                                    }`}
                                                            >
                                                                {milestone.stage === 'payment_requested'
                                                                    ? 'Payment Requested'
                                                                    : milestone.stage === 'payment_approved'
                                                                        ? 'Paid'
                                                                        : 'Request Payment'
                                                                }
                                                            </button>
                                                        )}
                                                        {isAdmin && (
                                                            <button
                                                                onClick={handleApproveMilestonePayment(milestone.id)}
                                                                disabled={status.text !== 'Customer Paid' || milestone.completeApproved}
                                                                className={`bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs px-4 py-1.5 rounded-md shadow-sm transition-all ${status.text !== 'Customer Paid' || milestone.completeApproved
                                                                    ? 'opacity-50 cursor-not-allowed'
                                                                    : 'hover:shadow-md hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-400'
                                                                    }`}
                                                            >
                                                                {milestone.completeApproved ? 'Approved' : 'Approve Payment'}
                                                            </button>
                                                        )}
                                                        {isCustomer && (
                                                            (status.text === "Not paid" || status.text === "Payment Requested") ? (
                                                                <button
                                                                    onClick={() => navigate(`/customer/bid/job/${id}/bid_awarded`)}
                                                                    className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-md shadow-sm hover:bg-blue-700"
                                                                >
                                                                    Make Payment
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    disabled
                                                                    className="bg-gray-400 text-white text-xs px-4 py-1.5 rounded-md shadow-sm cursor-not-allowed"
                                                                >
                                                                    Approve Payment
                                                                </button>
                                                            )
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>

                    <div className="md:hidden space-y-3">
                        {milestones.map((milestone, index) => {
                            const status = getStatus(milestone);
                            return (
                                <div key={milestone.id} className="p-3 border rounded-lg shadow-sm">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-sm">Milestone {index + 1}: {milestone.name}</h3>
                                        </div>
                                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                                            {status.text}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                        <p><span className="text-gray-500">Percent:</span> {milestone.percentageDisbursement}%</p>
                                        <p><span className="text-gray-500">Amount:</span> {milestone.amount.toLocaleString('en-KE')}</p>
                                    </div>
                                    <div className="space-y-2">
                                        {isEditable && (
                                            <button
                                                onClick={handleRequestMilestonePayment(milestone.id)}
                                                disabled={milestone.stage === 'payment_requested' || milestone.stage === 'payment_approved' || milestone.paid}
                                                className={`w-full bg-gradient-to-r from-green-500 to-teal-600 text-white text-sm px-4 py-2 rounded-md shadow-sm transition-all ${milestone.stage === 'payment_requested' || milestone.stage === 'payment_approved' || milestone.paid
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : 'hover:shadow-md hover:from-green-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400'
                                                    }`}
                                            >
                                                {milestone.stage === 'payment_requested'
                                                    ? 'Payment Requested'
                                                    : milestone.stage === 'payment_approved' || milestone.paid
                                                        ? 'Paid'
                                                        : 'Request Payment'
                                                }
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button
                                                onClick={handleApproveMilestonePayment(milestone.id)}
                                                disabled={status.text !== 'Customer Paid' || milestone.completeApproved}
                                                className={`w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm px-4 py-2 rounded-md shadow-sm transition-all ${status.text !== 'Customer Paid' || milestone.completeApproved
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : 'hover:shadow-md hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-400'
                                                    }`}
                                            >
                                                {milestone.completeApproved ? 'Approved' : 'Approve Payment'}
                                            </button>
                                        )}
                                        {isCustomer && (
                                            (status.text === "Not paid" || status.text === "Payment Requested") ? (
                                                <button
                                                    onClick={() => navigate(`/customer/bid/job/${id}/bid_awarded`)}
                                                    className="w-full bg-blue-600 text-white text-sm px-4 py-2 rounded-md shadow-sm hover:bg-blue-700"
                                                >
                                                    Make Payment
                                                </button>
                                            ) : (
                                                <button
                                                    disabled
                                                    className="w-full bg-gray-400 text-white text-sm px-4 py-2 rounded-md shadow-sm cursor-not-allowed"
                                                >
                                                    Approve Payment
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        {allMilestonesComplete && isEditable && (
                            <button
                                onClick={handleCompleteJob}
                                disabled={isCompleting}
                                className="bg-blue-600 text-white px-6 py-3 rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full md:w-auto"
                            >
                                {isCompleting ? <Loader className="animate-spin h-4 w-4 mr-2" /> : null}
                                Complete Job
                            </button>
                        )}
                        {allMilestonesApproveComplete && (isCustomer || isAdmin) && (
                            <button
                                onClick={handleApproveCompleteJob}
                                disabled={isCompleting || jobData.status === 'COMPLETE'}
                                className="bg-purple-600 text-white px-6 py-3 rounded-md shadow-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full md:w-auto mt-2 md:ml-4"
                            >
                                {isCompleting ? <Loader className="animate-spin h-4 w-4 mr-2" /> : null}
                                Approve Job Completion
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Progress() {
    const { user } = useGlobalContext();
    const [job, setJob] = useState(null);
    const [editableWorkPlans, setEditableWorkPlans] = useState([]);
    const [financialMilestones, setFinancialMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingWorkPlanId, setSavingWorkPlanId] = useState(null);
    const [saveStatus, setSaveStatus] = useState({ message: '', type: '' });
    const [activeCard, setActiveCard] = useState("technical");
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const { id } = useParams();

    const fetchJobData = useCallback(async (isInitial = false) => {
        if (isInitial) {
            setLoading(true);
        }
        try {
            const response = await getJobRequestById(axiosInstance, id);
            if (response && response.success) {
                const transformedData = { ...response.data };
                const assignedBid = transformedData.assignedBid;

                if (assignedBid) {
                    if (assignedBid.workPlans) {
                        const sanitizedWorkPlans = assignedBid.workPlans.map(wp => ({
                            ...wp,
                            progress: parseInt(wp.progress, 10) || 0,
                        }));
                        setEditableWorkPlans(sanitizedWorkPlans);
                    }

                    if (assignedBid.milestones) {
                        setFinancialMilestones(assignedBid.milestones);
                    }
                }
                setJob(transformedData);
            } else {
                throw new Error(response.message || "API returned a failure status.");
            }
        } catch (error) {
            console.error("Failed to fetch job data:", error);
            toast.error("Failed to fetch job data");
        } finally {
            if (isInitial) {
                setLoading(false);
            }
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchJobData(true);
    }, [id, fetchJobData]);

    const refetchJobData = useCallback(async () => {
        await fetchJobData(false);
    }, [fetchJobData]);

    const handleWorkPlanChange = (workPlanId, field, value) => {
        setEditableWorkPlans(prev => prev.map(wp => wp.id === workPlanId ? { ...wp, [field]: value } : wp));
    };

    const calculateDurationDays = (startDate, endDate) => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const handleUpdateWorkPlan = async (workPlanToUpdate) => {
        setSavingWorkPlanId(workPlanToUpdate.id);
        setSaveStatus({ message: '', type: '' });

        const durationDays = calculateDurationDays(
            workPlanToUpdate.startDate,
            workPlanToUpdate.endDate
        );

        const payload = {
            id: workPlanToUpdate.id,
            name: workPlanToUpdate.name,
            remarks: workPlanToUpdate.remarks || "",
            status: workPlanToUpdate.progress,
            startDate: toISOStringOrNull(workPlanToUpdate.startDate),
            endDate: toISOStringOrNull(workPlanToUpdate.endDate),
            actualStartDate: toISOStringOrNull(workPlanToUpdate.actualStartDate),
            actualEndDate: toISOStringOrNull(workPlanToUpdate.actualEndDate),
            durationDays: durationDays
        };

        try {
            const response = await updateBidWorkplan(axiosInstance, job.assignedBid?.id, [payload]);

            if (!response || !response.success) {
                throw new Error(response?.message || "API returned a failure status.");
            }

            setSaveStatus({
                message: response.message || `Work plan "${workPlanToUpdate.name}" updated successfully!`,
                type: 'success'
            });
            refetchJobData();

        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "An unexpected error occurred. Please try again.";

            setSaveStatus({ message: errorMessage, type: 'error' });

        } finally {
            setSavingWorkPlanId(null);
            setTimeout(() => setSaveStatus({ message: '', type: '' }), 4000);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Loader className="animate-spin h-8 w-8 text-blue-600" />
        </div>
    );

    if (!job) return (
        <div className="p-4 text-center text-red-500 min-h-screen flex items-center justify-center bg-gray-50">
            Failed to load job details.
        </div>
    );


    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{job.skill}</h1>
                    <p className="text-sm sm:text-base text-gray-600">{job.description}</p>
                </div>

                {saveStatus.message && (
                    <div className={`p-3 sm:p-4 mb-4 rounded-md flex items-center gap-3 ${saveStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {saveStatus.type === 'success' ? <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" /> : <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />}
                        <span className="text-sm sm:text-base">{saveStatus.message}</span>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6">
                    <div
                        role="button"
                        className={`flex-1 cursor-pointer p-4 sm:p-6 text-center rounded-xl shadow-md transition-all font-bold ${activeCard === "technical" ? "bg-blue-800 text-white" : "bg-blue-100 text-blue-800"
                            }`}
                        onClick={() => setActiveCard("technical")}
                    >
                        <h2 className="text-base sm:text-lg font-semibold mb-2">Technical Progress</h2>
                        <div className="text-2xl sm:text-4xl font-bold">{job?.assignedBid?.technicalScore}%</div>
                    </div>
                    <div
                        role="button"
                        className={`flex-1 cursor-pointer p-4 sm:p-6 text-center rounded-xl shadow-md transition-all font-bold ${activeCard === "financial" ? "bg-blue-800 text-white" : "bg-blue-100 text-blue-800"
                            }`}
                        onClick={() => setActiveCard("financial")}
                    >
                        <h2 className="text-base sm:text-lg font-semibold mb-2">Financial Progress</h2>
                        <div className="text-2xl sm:text-4xl font-bold">{job?.assignedBid?.financialScore}%</div>
                    </div>
                </div>

                {activeCard === 'technical' ? (
                    <TechnicalProgressView
                        workPlans={editableWorkPlans}
                        onWorkPlanChange={handleWorkPlanChange}
                        onUpdateWorkPlan={handleUpdateWorkPlan}
                        savingWorkPlanId={savingWorkPlanId}
                        user={user}
                        jobData={job}
                        refetchJobData={refetchJobData}
                    />
                ) : (
                    <FinancialProgressView
                        milestones={financialMilestones}
                        jobId={job.id}
                        user={user}
                        jobData={job}
                        refetchJobData={refetchJobData}
                    />
                )}
            </div>
        </div>
    );
}