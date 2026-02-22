/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getJobRequestById, addAdminNotes } from "@/api/jobRequests.api";
import { AiOutlinePaperClip } from "react-icons/ai";
import { ArrowDownTrayIcon } from "@heroicons/react/24/solid";
// import { FaVideo } from "react-icons/fa";
import { TiTick } from "react-icons/ti";
import { uploadFile, type UploadedFile } from "@/utils/fileUpload";
import { toast } from "react-hot-toast";
import { updateStage, closeJobRequest } from "@/api/jobRequests.api";
import { Download } from "lucide-react"

const JobDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [job, setJob] = useState<any>(null);
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [method, setMethod] = useState(() => {
        if (id) {
            const savedMethod = localStorage.getItem(`assignmentMethod-${id}`);
            return savedMethod || "Restricted";
        }
        return "Restricted";
    });
    const methods = ["Restricted", "Competitive"];
    const [adminNotes, setAdminNotes] = useState("");
    const [attachments, setAttachments] = useState<UploadedFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmittingAdminData, setIsSubmittingAdminData] = useState(false);
    const [isClosingJob, setIsClosingJob] = useState(false);

    const [showConfirm, setShowConfirm] = useState(false);
    const [showReason, setShowReason] = useState(false);
    const [reason, setReason] = useState("");
    const [jobIsAssigned, setJobIsAssigned] = useState(false);

    const buttonRef = useRef(null);

    useEffect(() => {
        if (id) {
            localStorage.setItem(`assignmentMethod-${id}`, method);
        }
    }, [method, id]);

    const fetchJob = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!id) {
                setError("No job ID provided.");
                setLoading(false);
                return;
            }
            const response = await getJobRequestById(axiosInstance, id);
            console.log("Response: ", response.data)
            setJob(response.data);
            setJobIsAssigned(response.data?.assignedServiceProviders?.length > 0);
            // Initialize admin notes and attachments if they exist
            if (response.data?.adminNotes) {
                setAdminNotes(response?.data?.adminNotes);
            }

            // Convert adminAttachments to UploadedFile format for display
            if (
                response?.data?.adminAttachments &&
                Array.isArray(response?.data?.adminAttachments)
            ) {
                const existingAttachments: UploadedFile[] =
                    response?.data?.adminAttachments.map(
                        (url: string, index: number) => ({
                            id: `existing-${index}-${Date.now()}`,
                            originalName:
                                url.split("/").pop() ||
                                `attachment-${index + 1}`,
                            displayName:
                                url.split("/").pop() ||
                                `attachment-${index + 1}`,
                            url: url,
                            type: "unknown",
                            size: 0,
                            uploadedAt: new Date()
                        })
                    );
                setAttachments(existingAttachments);
            }

            // If API includes customer field, set it here
            if (response?.data?.customer) setCustomer(response?.data?.customer);
        } catch (err: any) {
            setError(err.message || "Failed to fetch job details");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchJob();
        // eslint-disable-next-line
    }, [id]);

    const handleCloseJob = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a reason for closing the job");
            return;
        }

        setIsClosingJob(true);
        try {
            await closeJobRequest(axiosInstance, job.id);
            toast.success("Job closed successfully!");

            // Reset modal states
            setShowReason(false);
            setReason("");

            // Redirect to jobs page
            navigate("/dashboard/admin/jobs");
        } catch (error: any) {
            console.error("Error closing job:", error);
            toast.error(error.message || "Failed to close job");
        } finally {
            setIsClosingJob(false);
        }
    };

    const handleStartReview = async () => {
        try {
            await updateStage(axiosInstance, job.id, "UNDERREVIEW");
            toast.success("Review started successfully!");
            fetchJob();
        } catch (error: any) {
            toast.error(error.message || "Failed to start review");
        }
    };

    const handleSubmitAdminData = async () => {
        if (!adminNotes.trim() && attachments.length === 0) {
            toast.error(
                "Please add admin notes or attachments before submitting."
            );
            return;
        }

        setIsSubmittingAdminData(true);
        try {
            const adminNotesData = {
                adminNotes: adminNotes.trim(),
                attachments: attachments.map((file) => file.url)
            };

            await addAdminNotes(axiosInstance, job.id, adminNotesData);
            toast.success("Admin data submitted successfully!");
            fetchJob();
            // Clear the form after successful submission
            setAdminNotes("");
            setAttachments([]);
        } catch (error: any) {
            console.error("Error submitting admin data:", error);
            toast.error(error.message || "Failed to submit admin data");
        } finally {
            setIsSubmittingAdminData(false);
        }
    };

    const handleBottomButtonClick = async () => {
        if (method.toLowerCase() === "competitive") {
            try {
                const payload = {
                    procurementMethod: method,
                    providerIds: [job?.providerIds]
                };
                await axiosInstance.post(
                    `/api/job-requests/${job.id}/assign`,
                    payload
                );
                toast.success("Job submitted for competitive selection!");
                navigate(
                    `/dashboard/admin/register?method=${method.toLowerCase()}&jobId=${job.id || job.id
                    }&skill=${job.skill}`
                );
            } catch (error) {
                console.error("Error submitting competitive job:", error);
                toast.error("No service providers of the type are available");
            }
        } else {
            // Navigate to register page for restricted method
            navigate(
                `/dashboard/admin/register?method=${method.toLowerCase()}&jobId=${job.id || job.id
                }&skill=${job.skill}`
            );
        }
    };

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        try {
            for (const file of Array.from(files)) {
                try {
                    const uploadedFile = await uploadFile(file);
                    setAttachments((prev) => [...prev, uploadedFile]);
                    toast.success(
                        `'${uploadedFile.displayName}' uploaded successfully.`
                    );
                } catch (error: any) {
                    console.error(`Error uploading ${file.name}:`, error);
                    toast.error(
                        `Failed to upload ${file.name}: ${error.message}`
                    );
                }
            }
        } finally {
            setIsUploading(false);
            // Reset file input
            event.target.value = "";
        }
    };

    const removeAttachment = (fileId: string) => {
        setAttachments((prev) => prev.filter((file) => file.id !== fileId));
        toast.success("File removed successfully.");
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-400 border-t-transparent" />
                <p className="mt-3 text-gray-600">Loading...</p>
            </div>
        );
    }

    if (error)
        return <div className="p-10 text-center text-red-600">{error}</div>;
    if (!job) return <div className="p-10 text-center">No job data found.</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg relative border border-gray-200">
            {/* Header Section */}
            <div className="flex justify-between items-center bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
                <h1 className="text-2xl font-bold text-gray-800">
                    {job.jobId || job.id}
                </h1>
                <span className="text-xs font-semibold bg-[rgb(0,0,122)] text-white px-3 py-1 rounded-full shadow-sm">
                    {job?.stage}
                </span>
                <span className="text-xs font-semibold bg-[rgb(0,0,122)] text-white px-3 py-1 rounded-full shadow-sm">
                    {method}
                </span>

                <h2 className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm">
                    Created:{" "}
                    {job.createdAt
                        ? new Date(job.createdAt).toLocaleDateString('en-GB')
                        : new Date(job.startDate).toLocaleDateString('en-GB')}
                </h2>
            </div>
            <br className="my-6 border-gray-200" />
            <div className="flex justify-between items-center mb-6">

                <div className="relative flex items-center gap-4">
                    {job?.status == "NEW" && (<div>
                        <span className="text-gray-700 font-semibold mr-2">
                            Method:
                        </span>
                        <select
                            className="border p-2 rounded-md shadow-sm"
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                        >
                            {methods.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </div>)}

                    {job?.stage == "UNREVIEWED" && (<button
                        type="button"
                        className="ml-4 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition-colors"
                        onClick={handleStartReview}
                    >
                        Start Review
                    </button>)}
                </div>
            </div>
            <br className="my-6 border-gray-200" />

            {/* Customer Details */}
            <div className="p-8 my-6 rounded-xl shadow-lg bg-white hover:shadow-xl transition-all duration-300">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Customer Details
                </h2>
                <div className="grid grid-cols-2 gap-6">
                    {customer ? (
                        <>
                            <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                                <span className="font-semibold text-gray-800 w-32">
                                    First Name:
                                </span>
                                <span className="text-gray-700">
                                    {customer.firstName || customer?.contactfirstName}
                                </span>
                            </div>
                            <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                                <span className="font-semibold text-gray-800 w-32">
                                    Last Name:
                                </span>
                                <span className="text-gray-700">
                                    {customer.lastName || customer?.contactlastName}
                                </span>
                            </div>
                            <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                                <span className="font-semibold text-gray-800 w-32">
                                    Phone:
                                </span>
                                <span className="text-gray-700">
                                    {customer.phoneNumber}
                                </span>
                            </div>
                            <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                                <span className="font-semibold text-gray-800 w-32">
                                    Email:
                                </span>
                                <span className="text-gray-700">
                                    {customer.email}
                                </span>
                            </div>
                            <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                                <span className="font-semibold text-gray-800 w-32">
                                    Location:
                                </span>
                                <span className="text-gray-700">
                                    {customer.country} {customer.county}{" "}
                                    {customer.subCounty}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="col-span-2 text-gray-500">
                            No customer data.
                        </div>
                    )}
                </div>
            </div>

            {/* Job Detail Section */}
            <div className="p-8 my-6 rounded-xl shadow-lg bg-white hover:shadow-xl transition-all duration-300 border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Job Details
                </h2>
                <div className="flex justify-between gap-8">
                    {/* Left Column */}
                    <div className="w-1/2 space-y-4">
                        <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <span className="font-semibold text-gray-800 w-24">
                                {job?.jobType == "FUNDI" ? "Skill: " : job?.jobType == "PROFESSIONAL" ? "Profession: " : job?.jobType == "CONTRACTOR" ? "Contractor Type: " : ""}
                            </span>
                            <span className="text-gray-700">{job.skill}</span>
                        </div>
                        <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <span className="font-semibold text-gray-800 w-24">
                                Job Type:
                            </span>
                            <span className="text-gray-700">{job.jobType}</span>
                        </div>
                        <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <span className="font-semibold text-gray-800 w-24">
                                Location:
                            </span>
                            <span className="text-gray-700">
                                {job.location}
                            </span>
                        </div>
                        <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <span className="font-semibold text-gray-800 w-24">
                                Start Date:
                            </span>
                            <span className="text-gray-700">
                                {job.startDate
                                    ? new Date(
                                        job.startDate
                                    ).toLocaleDateString('en-GB')
                                    : "-"}
                            </span>
                        </div>
                        <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <span className="font-semibold text-gray-800 w-24">
                                End Date:
                            </span>
                            <span className="text-gray-700">
                                {job.endDate
                                    ? new Date(job.endDate).toLocaleDateString('en-GB')
                                    : "-"}
                            </span>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="w-1/2 pl-8 border-l border-gray-200 space-y-4">
                        {/* Download Receipt Section */}
                        {job.payments.length > 0 && (<div className="flex items-center space-x-2 bg-green-100 p-4 rounded-lg cursor-not-allowed opacity-60 border border-green-300" onClick={() => navigate(`/receipts/${job.payments[job.payments.length - 1].id}`)}>
                            {/* Download Icon */}
                            <Download className="h-6 w-6 text-green-500" />
                            <span className="text-green-600 font-medium">
                                Download Receipt
                            </span>
                        </div>)}

                        {/* Managed by Jagedo Section */}
                        <div className="bg-blue-50 p-4 rounded-2xl shadow-md border border-gray-200">
                            <h3 className="text-2xl font-bold text-blue-900">
                                Managed by {job?.managedBy}
                            </h3>
                        </div>

                        {/* Package Details Section */}
                        <div className="bg-blue-50 p-4 rounded-2xl shadow-md mt-4 border border-gray-200">
                            <h3 className="text-2xl font-bold text-blue-900 mb-2">
                                Package details
                            </h3>
                            {(() => {
                                if (!job) return null;

                                // Helper to check if managed by Jagedo or self
                                const isManagedByJagedo =
                                    job.managedBy?.toLowerCase().includes("jagedo");

                                // FUNDI
                                if (job.jobType === "FUNDI") {
                                    if (isManagedByJagedo) {
                                        return (
                                            <>
                                                <p className="text-lg font-semibold text-gray-800">
                                                    Jagedo Oversees
                                                </p>
                                                <ul className="space-y-3 mt-4 text-gray-700">
                                                    {[
                                                        "Arrival time",
                                                        "Scope budget",
                                                        "Workmanship for a day"
                                                    ].map((text, idx) => (
                                                        <li key={idx} className="flex items-center">
                                                            <TiTick className="text-green-300 mr-2 text-xl" />
                                                            {text}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        );
                                    } else {
                                        return (
                                            <ul className="space-y-3 mt-4 text-gray-700">
                                                <li className="flex items-center">
                                                    <TiTick className="text-green-500 mr-2 text-xl" />
                                                    Arrival time
                                                </li>
                                                <li className="flex items-center">
                                                    <TiTick className="text-green-500 mr-2 text-xl" />
                                                    1 day payment
                                                </li>
                                                <p className="text-lg text-left font-bold">Client manages</p>
                                                <li className="flex items-center">
                                                    <TiTick className="text-green-500 mr-2 text-xl" />
                                                    Workmanship for a day
                                                </li>
                                            </ul>
                                        );
                                    }
                                }

                                // PROFESSIONAL
                                if (job.jobType === "PROFESSIONAL") {
                                    if (isManagedByJagedo) {
                                        return (
                                            <>
                                                <ul className="space-y-3 mt-4 text-gray-700">
                                                    <li className="flex items-center">
                                                        <TiTick className="text-green-300 mr-2 text-xl" />
                                                        Time: Duration of Execution
                                                    </li>
                                                    <li className="flex items-center">
                                                        <TiTick className="text-green-300 mr-2 text-xl" />
                                                        Scope of budget: Determined through Competitive bidding
                                                    </li>
                                                    <li className="flex items-center">
                                                        <TiTick className="text-green-300 mr-2 text-xl" />
                                                        Quality: Professionalism and peer reviewing
                                                    </li>
                                                </ul>
                                            </>
                                        );
                                    } else {
                                        return (
                                            <ul className="space-y-3 mt-4 text-gray-700">
                                                <li className="flex items-center">
                                                    <TiTick className="text-green-500 mr-2 text-xl" />
                                                    Scope budget: Determined through Competitive bidding.
                                                </li>
                                                <p className="text-lg text-left font-bold">Client manages</p>
                                                <li className="flex items-center">
                                                    <TiTick className="text-green-500 mr-2 text-xl" />
                                                    Time: Duration of Execution.
                                                </li>
                                                <li className="flex items-center">
                                                    <TiTick className="text-green-500 mr-2 text-xl" />
                                                    Quality: Professionalism and peer review.
                                                </li>
                                            </ul>
                                        );
                                    }
                                }

                                // CONTRACTOR
                                if (job.jobType === "CONTRACTOR") {
                                    if (isManagedByJagedo) {
                                        return (
                                            <ul className="space-y-3 mt-4 text-gray-700">
                                                <li className="flex items-center">
                                                    <TiTick className="text-green-300 mr-2 text-xl" />
                                                    Time: Duration of Execution
                                                </li>
                                                <li className="flex items-center">
                                                    <TiTick className="text-green-300 mr-2 text-xl" />
                                                    Scope of Budget: Determined through competitive bidding.
                                                </li>
                                                <li className="flex items-center">
                                                    <TiTick className="text-green-300 mr-2 text-xl" />
                                                    Quality :Workmanship and site supervisions.
                                                </li>
                                            </ul>
                                        );
                                    } else {
                                        return (
                                            <ul className="space-y-3 mt-4 text-gray-700">
                                                <li className="flex items-center">
                                                    <TiTick className="text-green-500 mr-2 text-xl" />
                                                    Scope of Budget: Determined through Competitve Bidding
                                                </li>
                                                <p className="text-lg text-left font-bold">Client manages</p>
                                                <li className="flex items-center">
                                                    <TiTick className="text-green-500 mr-2 text-xl" />
                                                    Time: Duration of Execution
                                                </li>
                                                <li className="flex items-center">
                                                    <TiTick className="text-green-500 mr-2 text-xl" />
                                                    Quality :Workmanship and site supervisions.
                                                </li>
                                            </ul>
                                        );
                                    }
                                }

                                // Default fallback
                                return null;
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-6 bg-white p-8 shadow-lg rounded-xl border border-gray-200">
                {/* Description */}
                <div className="col-span-2 pr-6 border-r border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        Description
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                        {job.description}
                    </p>
                </div>

                {/* Files Table */}

                <div className="col-span-2">
                    <table className="w-full border-collapse rounded-lg overflow-hidden">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                                    File Name
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                                    Attachment
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(job.attachments) &&
                                job.attachments.length > 0 ? (
                                job.attachments.map(
                                    (url: string, index: number) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-gray-50 transition-all duration-200"
                                        >
                                            <td className="px-6 py-4 border-t border-gray-200">
                                                {url
                                                    ?.split("/")
                                                    ?.pop()
                                                    ?.slice(0, 10)}
                                            </td>
                                            <td className="px-6 py-4 border-t border-gray-200 flex items-center gap-4">
                                                <a
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-900 hover:text-blue-700 flex items-center gap-2 transition-colors"
                                                >
                                                    <ArrowDownTrayIcon className="w-5 h-5" />
                                                    Download
                                                </a>
                                            </td>
                                        </tr>
                                    )
                                )
                            ) : (
                                <tr>
                                    <td
                                        colSpan={2}
                                        className="text-gray-500 text-center"
                                    >
                                        No attachments
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <br className="my-6 border-gray-200" />

            {/* Admin Section */}
            <div className="grid grid-cols-4 gap-6 bg-white p-8 shadow-lg rounded-xl border border-gray-200">
                {/* Admin Notes */}
                <div className="col-span-2 pr-6 border-r border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        Admin Notes
                    </h2>
                    <textarea
                        className="w-full p-6 border border-gray-200 rounded-md"
                        rows={10}
                        placeholder="Enter admin notes..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        disabled={job?.stage.toLowerCase() == "unreviewed"}
                    />
                </div>

                {/* File Upload */}
                <div className="space-y-4 col-span-2">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        Attachments
                    </h2>

                    {/* File Upload Input */}
                    <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 gap-3">
                        <label className="cursor-pointer flex items-center gap-2 flex-1">
                            <AiOutlinePaperClip className="text-gray-700 text-2xl" />
                            <span className="text-gray-600">
                                {isUploading
                                    ? "Uploading..."
                                    : "Click to upload files"}
                            </span>
                            <input
                                type="file"
                                className="hidden"
                                onChange={handleFileUpload}
                                multiple
                                disabled={isUploading || job?.stage.toLowerCase() == "unreviewed"}
                                accept="image/*,.pdf,.doc,.docx"
                            />
                        </label>
                    </div>

                    {/* Uploaded Files List */}
                    {attachments.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-700">
                                Uploaded Files:
                            </h3>
                            {attachments.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between bg-gray-50 p-2 rounded border"
                                >

                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-sm text-gray-600 truncate">
                                            {file.displayName}
                                        </span>
                                        <span className="text-xs text-gray-400 flex-shrink-0">
                                            ({(file.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 text-sm"
                                        >
                                            View
                                        </a>
                                        <button
                                            onClick={() =>
                                                removeAttachment(file.id)
                                            }
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Submit Admin Data Button */}
            {(job?.status != "DRAFT" && job?.stage.toLowerCase() != "unreviewed") && (<div className="flex justify-center mt-6">
                <button
                    type="button"
                    onClick={handleSubmitAdminData}
                    disabled={
                        isSubmittingAdminData ||
                        (!adminNotes.trim() && attachments.length === 0)
                    }
                    className="bg-[#00007A] text-white px-6 py-2 rounded-md shadow-md hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmittingAdminData ? "Saving..." : "Save Changes"}
                </button>
            </div>)}

            {/* Action Buttons */}
            {(job?.status !== "DRAFT" && job?.stage.toLowerCase() != "unreviewed") && (<div className="flex justify-between mt-6">
                {/* Dynamic Button based on method */}
                <button
                    type="button"
                    onClick={handleBottomButtonClick}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                    {method.toLowerCase() === "competitive"
                        ? "Assign"
                        : "View Registers"}
                </button>

                {!jobIsAssigned && (<button
                    ref={buttonRef}
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    className="bg-[rgb(0,0,122)] text-white px-6 py-2 rounded-md shadow-md hover:bg-blue-800"
                >
                    Close Job
                </button>)}
                {/* Confirm Modal (Card-style) */}
                {showConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-md shadow-md w-80 p-6 mx-4">
                            <h2 className="text-lg font-semibold mb-4">
                                Are you sure you want to close the job?
                            </h2>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowConfirm(false);
                                        setShowReason(true);
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                    Yes, Close Job
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showReason && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

                        <div className="bg-white rounded-md shadow-md w-96 p-6 mx-4">
                            <h2 className="text-lg font-semibold mb-3">
                                Reason for closing the job
                            </h2>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                                placeholder="Please provide a reason for closing this job..."
                                className="w-full text-sm border border-gray-300 rounded p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowReason(false);
                                        setReason("");
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCloseJob}
                                    disabled={!reason.trim() || isClosingJob}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isClosingJob ? "Closing..." : "Submit & Close"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reason Modal (Card-style) */}
                {showReason && (
                    <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-md shadow-md w-80 p-4 z-10">
                        <h2 className="text-sm font-semibold mb-2">
                            Reason for closing the job
                        </h2>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="Enter reason..."
                            className="w-full text-sm border border-gray-300 rounded p-2 mb-3"
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setShowReason(false);
                                    setReason("");
                                }}
                                className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCloseJob}
                                disabled={!reason.trim() || isClosingJob}
                                className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isClosingJob ? "Closing..." : "Submit & Close"}
                            </button>
                        </div>
                    </div>
                )}
            </div>)}
        </div>
    );
};

export default JobDetail;