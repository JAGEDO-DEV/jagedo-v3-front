/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useState, useEffect } from "react";
import { FaFileAlt, FaTrash, FaPlus, FaDownload } from "react-icons/fa";
import { uploadFileNew } from "../../utils/fileUploadNew";
import { useGlobalContext } from "@/context/GlobalProvider";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { useParams } from "react-router-dom";
import { getJobRequestById, addServiceProviderNotes, addAdminActiveNotes, addCustomerActiveNotes } from "@/api/jobRequests.api";
import { Loader, Upload, FileText, MessageSquare } from "lucide-react";

const Submissions = () => {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const { id } = useParams<{ id: string }>();
    const jobId = id;

    const [jobData, setJobData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    // State for customer section
    const [customerActiveNotes, setCustomerActiveNotes] = useState("");

    // File states for customer section
    const [customerFiles, setCustomerFiles] = useState<File[]>([]);

    // Uploading states for customer section
    const [uploadingCustomer, setUploadingCustomer] = useState(false);

    const { user } = useGlobalContext();

    const isAdmin = user?.user_type === "ADMIN";
    const isFundi = user?.user_type === "FUNDI";
    const isCustomer = user?.user_type === "CUSTOMER";

    // Effect to fetch initial job data
    useEffect(() => {
        const fetchJobData = async () => {
            if (!jobId) {
                setError("Job ID not found.");
                setIsLoading(false);
                return;
            }
            try {
                setIsLoading(true);
                const response = await getJobRequestById(axiosInstance, jobId);
                if (response.success && response.data) {
                    setJobData(response.data);
                } else {
                    throw new Error("Failed to fetch job data.");
                }
            } catch (err) {
                console.error("Error fetching job data:", err);
                setError(err.message || "An unexpected error occurred.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchJobData();
    }, [jobId]);

    useEffect(() => {
        if (jobData) {
            setCustomerActiveNotes(jobData.customerActiveNotes || "");
        }
    }, [jobData]);

    const handleCustomerFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        setCustomerFiles((prev) => [...prev, ...files]);
    };

    const removeCustomerFile = (index: number) => {
        setCustomerFiles(customerFiles.filter((_, i) => i !== index));
    };

    const uploadFilesToServer = async (files: File[]): Promise<string[]> => {
        console.log('Uploading files:', files.map(f => f.name));
        const uploadPromises = files.map(async (file) => {
            const url = await uploadFileNew(axiosInstance, file, file.name);
            console.log('File uploaded successfully:', file.name, 'URL:', url);
            return url;
        });
        const urls = await Promise.all(uploadPromises);
        console.log('All files uploaded, URLs:', urls);
        return urls;
    };

    const handleSubmitCustomerActiveNotes = async () => {
        if (!customerActiveNotes.trim() && customerFiles.length === 0) {
            setMessage({
                type: "error",
                text: "Please add notes or attachments before submitting."
            });
            return;
        }

        setUploadingCustomer(true);
        setMessage(null);

        try {
            const attachmentUrls = await uploadFilesToServer(customerFiles);

            console.log('Submitting customer notes with data:', {
                attachments: attachmentUrls,
                adminNotes: customerActiveNotes
            });

            const response = await addCustomerActiveNotes(axiosInstance, jobId, {
                attachments: attachmentUrls,
                adminNotes: customerActiveNotes
            });

            console.log('Customer notes submission response:', response);

            if (response.status === 200 || response.success) {
                setMessage({
                    type: "success",
                    text: "Customer notes and attachments submitted successfully!"
                });
                setCustomerFiles([]);
                setCustomerActiveNotes("");
                const updatedJob = await getJobRequestById(axiosInstance, jobId);
                setJobData(updatedJob.data);
            }
        } catch (error: any) {
            console.error("Error submitting customer active notes:", error);
            setMessage({
                type: "error",
                text: `Failed to submit customer notes and attachments: ${error.message || error.response?.data?.message || 'Please try again.'}`
            });
        } finally {
            setUploadingCustomer(false);
        }
    };

    // Helper component for file attachments display
    const AttachmentsList = ({ attachments, title }: { attachments: string[], title: string }) => (
        <div className="bg-gray-50 p-4 mt-7 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
            {attachments && attachments.length > 0 ? (
                <div className="space-y-3">
                    {attachments.map((attachment, index) => (
                        <div
                            key={index}
                            className="flex justify-between items-center bg-white border border-gray-200 rounded-md px-4 py-3 shadow-sm hover:shadow transition"
                        >
                            <span
                                className="text-sm text-gray-800 truncate pr-4"
                                title={attachment.split('/').pop()}
                            >
                                {attachment.split('/').pop()}
                            </span>
                            <a
                                href={attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 font-medium hover:underline"
                            >
                                Download
                            </a>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 mt-4">No attachments.</p>
            )}
        </div>
    );

    const FileUploadSection = ({
        files,
        onFileUpload,
        onRemoveFile,
        canUpload
    }: {
        files: File[],
        onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void,
        onRemoveFile: (index: number) => void,
        canUpload: boolean
    }) => (
        <div className="space-y-3">
            {canUpload && (
                <div>
                    <label className="cursor-pointer flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        <Upload className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">Click to upload files</span>
                        <input
                            type="file"
                            className="hidden"
                            onChange={onFileUpload}
                            multiple
                            accept="*/*"
                        />
                    </label>
                </div>
            )}

            {files.length > 0 && (
                <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Selected Files:</h5>
                    {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-gray-700">{file.name}</span>
                            </div>
                            {canUpload && (
                                <button
                                    onClick={() => onRemoveFile(index)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                >
                                    <FaTrash className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader className="animate-spin h-10 w-10 text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-red-500 text-lg">{error}</p>
            </div>
        );
    }

    return (
        <section className="container mx-auto mt-8 px-4 max-w-6xl mb-10">
            {/* Success/Error Message */}
            {message && (
                <div
                    className={`mb-6 p-4 rounded-lg ${message.type === "success"
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                >
                    {message.text}
                </div>
            )}

            <div className="space-y-8">
                {/* Admin Notes Section */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Admin Notes</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Admin Notes Display */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>
                                <div className="w-full p-4 border border-gray-300 rounded-lg min-h-[150px] bg-gray-50">
                                    <p className="text-gray-700">
                                        {jobData?.adminActiveNotes || jobData?.adminNotes || "No admin notes available"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Admin Attachments */}
                        <div>
                            <AttachmentsList
                                attachments={[
                                    ...(jobData?.adminActiveAttachments || []),
                                    ...(jobData?.adminAttachments || [])
                                ]}
                                title="Admin Attachments"
                            />
                        </div>
                    </div>
                </div>

                {/* Customer Notes Section */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <MessageSquare className="h-5 w-5 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Customer Notes</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Customer Notes Input */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    className={`w-full p-4 border border-gray-300 rounded-lg min-h-[150px] focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${!isCustomer ? 'bg-gray-50 cursor-not-allowed' : ''
                                        }`}
                                    placeholder={isCustomer ? "Add your notes..." : "No customer notes yet"}
                                    value={customerActiveNotes}
                                    onChange={(e) => setCustomerActiveNotes(e.target.value)}
                                    readOnly={!isCustomer}
                                />
                            </div>

                            {isCustomer && (
                                <FileUploadSection
                                    files={customerFiles}
                                    onFileUpload={handleCustomerFileUpload}
                                    onRemoveFile={removeCustomerFile}
                                    canUpload={isCustomer}
                                />
                            )}

                            {isCustomer && (
                                <button
                                    onClick={handleSubmitCustomerActiveNotes}
                                    disabled={uploadingCustomer || (!customerActiveNotes.trim() && customerFiles.length === 0)}
                                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                                >
                                    {uploadingCustomer ? (
                                        <>
                                            <Loader className="animate-spin h-4 w-4" />
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaPlus className="h-4 w-4" />
                                            <span>Add Customer Notes</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* Existing Customer Attachments */}
                        <div>
                            <AttachmentsList
                                attachments={[
                                    ...(jobData?.customerActiveAttachments || []),
                                    ...(jobData?.attachments || [])
                                ]}
                                title="Customer Attachments"
                            />
                        </div>
                    </div>
                </div>

                {/* Service Provider notes Section */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <MessageSquare className="h-5 w-5 text-orange-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Service Provider notes</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Service Provider notes Display */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>
                                <div className="w-full p-4 border border-gray-300 rounded-lg min-h-[150px] bg-gray-50">
                                    <p className="text-gray-700">
                                        {jobData?.serviceProviderNotes || "No Service Provider notes available"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Existing Service Provider Attachments */}
                        <div>
                            <AttachmentsList
                                attachments={jobData?.serviceProviderAttachments || []}
                                title="Service Provider Attachments"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Submissions;