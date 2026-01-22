/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type React from "react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import ChatWidgetWrapper from "@/components/ChatWidget";

import {
    Search,
    Store,
    CheckCircle,
    Clock,
    Edit,
    AlertCircle,
    Loader
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaFileAlt } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import JobOrderCard from "@/components/dashboard/JobOrderCard";
import { createJobRequest } from "@/api/jobRequests.api";
import { type UploadedFile } from "@/utils/fileUpload";
import type { JobRequestResponse } from "@/api/jobRequests.api";
import { InvoiceDetail } from "@/components/invoice-detail";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getCustomerJobRequests } from "@/api/jobRequests.api";
import { JobDetail } from "@/components/jobDetail";
import { getOrderRequests } from "@/api/orderRequests.api";
import { useGlobalContext } from "@/context/GlobalProvider";
import { ContractorForm } from "./forms/ContractorForm";
import { ProfessionalForm } from "./forms/ProfessionalForm";
import { FundiForm } from "./forms/FundiForm";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useNavigate } from "react-router-dom";
import GenericFooter from "@/components/generic-footer";
import { ProfileCompletion } from "@/components/profile 2.0/ProfileCompletion";

export default function CustomerDashboard() {
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const { user, setUser } = useGlobalContext();
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState("fundi");
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [acceptedPolicy, setAcceptedPolicy] = useState(false);
    const [activeSection, setActiveSection] = useState("requisitions");
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({
        skill: "",
        location: "",
        startDate: null as Date | null,
        description: "",
        customerNotes: ""
    });
    const [attachments, setAttachments] = useState<UploadedFile[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [jobRequests, setJobRequests] = useState<JobRequestResponse[]>([]);
    const [orderRequests, setOrderRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [showAllJobs, setShowAllJobs] = useState(false);
    const [showAllOrders, setShowAllOrders] = useState(false);

    //@ts-ignore
    const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
    const [editingFile, setEditingFile] = useState<string | null>(null);
    const [editingFileName, setEditingFileName] = useState("");

    const [currentJob, setCurrentJob] = useState<any>(null);
    const [showJobDetail, setShowJobDetail] = useState(false);
    const [currentInvoice, setCurrentInvoice] = useState<any>(null);
    const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);

    const [showProfileCompletion, setShowProfileCompletion] = useState(false);

    useEffect(() => {
        if (user && user.profileCompleted === false) {
            setShowProfileCompletion(true);
        }
    }, [user]);

    const handleProfileComplete = (profileData: any) => {
        const updatedUser = { ...user, ...profileData, profileCompleted: true };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        const db = JSON.parse(localStorage.getItem("mock_users_db") || "[]");
        const index = db.findIndex((u: any) => u.email === user.email);
        if (index !== -1) {
            db[index] = updatedUser;
            localStorage.setItem("mock_users_db", JSON.stringify(db));
        }

        setShowProfileCompletion(false);
        toast.success("Profile Completed!");
    };

    const TABS = [
        { id: 'requisitions', label: 'Requisitions' },
        { id: 'new', label: 'New' },
        { id: 'draft', label: 'Drafts' },
        { id: 'bid', label: 'Bid' },
        { id: 'active', label: 'Active' },
        { id: 'complete', label: 'Complete' },
    ];

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            try {
                const [jobsResponse, ordersResponse] = await Promise.all([
                    getCustomerJobRequests(axiosInstance),
                    getOrderRequests(axiosInstance)
                ]);

                if (jobsResponse.success) {
                    setJobRequests(jobsResponse.hashSet || []);
                } else {
                    toast.error("Failed to load job requests.");
                }

                if (ordersResponse.success) {
                    setOrderRequests(ordersResponse.hashSet || []);
                } else {
                    toast.error("Failed to load order requests.");
                }

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                toast.error("An error occurred while loading your data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const removeAttachment = (index: number) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };

    const startEditingFile = (index: number) => {
        setEditingFile(attachments[index].id);
        setEditingFileName(attachments[index].displayName);
    };
    const saveEditingFileName = (index: number) => {
        setAttachments((prev) =>
            prev.map((file, i) =>
                i === index ? { ...file, displayName: editingFileName } : file
            )
        );
        setEditingFile(null);
        setEditingFileName("");
    };
    const cancelEditingFileName = () => {
        setEditingFile(null);
        setEditingFileName("");
    };

    const handleInputChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date: Date | null) => {
        setFormData((prev) => ({ ...prev, startDate: date }));
    };

    const handleFileUpload = (uploadedFile: UploadedFile) => {
        setAttachments((prev) => [...prev, uploadedFile]);
        toast.success(`'${uploadedFile.displayName}' uploaded successfully.`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid()) {
            toast.error(
                "Please fill all required fields and accept the policy."
            );
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = {
                jobType:
                    selectedTab === "contractor"
                        ? "CONTRACTOR"
                        : selectedTab === "professional"
                            ? "PROFESSIONAL"
                            : "FUNDI",
                skill: formData.skill,
                description: formData.description,
                location: formData.location,
                managedBy: selectedPlan.toLowerCase() == "jagedo" ? "JAGEDO" : "SELF",
                startDate: formData.startDate
                    ? new Date(formData.startDate).toISOString()
                    : new Date().toISOString(),
                endDate: undefined,
                agreeToTerms: acceptedPolicy,
                attachments: attachments.map((f) => f.url),
                customerNotes: formData.description || "",
                basePrice: selectedTab === "fundi" ? 3000 : 0
            };
            const newJobRequest = await createJobRequest(
                axiosInstance,
                payload
            );

            if (newJobRequest.success && newJobRequest.data) {
                if (newJobRequest.data.jobType === "FUNDI") {
                    toast.success(
                        "Request submitted! Taking you to the invoice..."
                    );
                    setCurrentInvoice(newJobRequest.data);
                    setShowInvoiceDetail(true);
                    setActiveSection("invoices");
                } else {
                    toast.success("Request submitted successfully!");
                    const response = await getCustomerJobRequests(
                        axiosInstance
                    );
                    setJobRequests(response.hashSet);
                    setActiveSection("new");
                }

                setFormData({
                    skill: "",
                    location: "",
                    startDate: null,
                    description: "",
                    customerNotes: ""
                });
                setAttachments([]);
                setSelectedPlan(null);
                setAcceptedPolicy(false);
            } else {
                toast.error(
                    newJobRequest.message || "Failed to create job request."
                );
            }
            setIsSubmitting(false);
        } catch (err: any) {
            setIsSubmitting(false);
            toast.error(err.message || "Failed to submit request");
        }
    };

    const isFormValid = () => {
        return (
            formData.skill !== "" &&
            formData.location !== "" &&
            formData.startDate !== null &&
            formData.description !== "" &&
            selectedPlan !== null &&
            acceptedPolicy
        );
    };

    const getJobsByStatus = (status: string) => {
        if (!jobRequests) return [];

        const sortByDateDesc = (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

        switch (status) {
            case "new":
                return jobRequests
                    .filter((job) => ["new", "request"].includes(job.status.toLowerCase()))
                    .sort(sortByDateDesc);
            case "quotation":
                return jobRequests
                    .filter((job) => job.status.toLowerCase() === "quotation")
                    .sort(sortByDateDesc);
            case "draft":
                return jobRequests.filter((job) => ["drafts", "draft"].includes(job.status?.toLowerCase())).sort(sortByDateDesc);

            case "bid":
                return jobRequests
                    .filter(job => ["BIDDING", "BID"].includes(job.status?.toUpperCase()))
                    .sort(sortByDateDesc);
            case "active":
                return jobRequests
                    .filter((job) => ["assigned", "active"].includes(job.status.toLowerCase()))
                    .sort(sortByDateDesc);
            case "complete":
                return jobRequests
                    .filter((job) => ["completed", "complete", "past"].includes(job.status.toLowerCase()))
                    .sort(sortByDateDesc);
            default:
                return [...jobRequests].sort(sortByDateDesc);
        }
    };

    const getOrdersByStatus = (status: string) => {
        if (!orderRequests) return [];
        const sortByDateDesc = (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

        switch (status) {
            case "new":
                return orderRequests
                    .filter(order => ["PENDING", "NEW"].includes(order.status?.toUpperCase()))
                    .sort(sortByDateDesc);
            case "active":
                return orderRequests
                    .filter(order => ["PROCESSING", "SHIPPED"].includes(order.status?.toUpperCase()))
                    .sort(sortByDateDesc);
            case "complete":
                return orderRequests
                    .filter(order => ["DELIVERED", "COMPLETED", "PAST"].includes(order.status?.toUpperCase()))
                    .sort(sortByDateDesc);
            case "bid":
                return orderRequests
                    .filter(order => ["BIDDING", "BID"].includes(order.status?.toUpperCase()))
                    .sort(sortByDateDesc);
            default:
                return [];
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "request": return "bg-yellow-100 text-yellow-800";
            case "assigned": return "bg-indigo-100 text-indigo-800";
            case "draft": return "bg-gray-100 text-gray-800";
            case "bid": return "bg-cyan-100 text-cyan-800";
            case "quotation": return "bg-blue-100 text-blue-800";
            case "active": return "bg-green-100 text-green-800";
            case "pending-approval": return "bg-orange-100 text-orange-800";
            case "complete": return "bg-purple-100 text-purple-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case "request": return <Search className="h-4 w-4" />;
            case "assigned": return <Store className="h-4 w-4" />;
            case "draft": return <Edit className="h-4 w-4" />;
            case "quotation": return <Clock className="h-4 w-4" />;
            case "active": return <CheckCircle className="h-4 w-4" />;
            case "pending-approval": return <AlertCircle className="h-4 w-4" />;
            case "complete": return <CheckCircle className="h-4 w-4" />;
            default: return <AlertCircle className="h-4 w-4" />;
        }
    };

    const renderJobsLayout = (jobs: any[]) => {
        if (isLoading) return <Loader className="animate-spin mx-auto mt-8" />;
        const filteredJobs = jobs.filter(
            (job: any) =>
                job.skill?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.customer?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const jobsToDisplay = showAllJobs ? filteredJobs : filteredJobs.slice(0, 2);

        return (
            <section className="bg-white px-4 py-5 shadow-sm border border-gray-100 rounded-2xl w-full">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Jobs</h2>
                {jobsToDisplay.length > 0 ? (
                    jobsToDisplay.map((job) => (
                        <JobOrderCard
                            key={`job-${job.id}`}
                            item={job}
                            getStatusColor={getStatusColor}
                            getStatusIcon={getStatusIcon}
                            onViewDetail={(selectedJob) => navigate(
                                job.stage === 'BID_AWARDED' || job.stage === 'PAYMENT_APPROVAL'
                                    ? `/customer/${activeSection}/job/${selectedJob.id}/bid_awarded`
                                    : `/customer/${activeSection}/job/${selectedJob.id}`
                            )}
                        />
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-lg font-medium mb-2">No jobs found</div>
                        <p>There are no jobs matching the current criteria.</p>
                    </div>
                )}
                {filteredJobs.length > 2 && (
                    <div className="flex justify-end mt-2">
                        <button type="button" className="text-[#00007a] font-bold hover:underline text-sm" onClick={() => setShowAllJobs((prev) => !prev)}>
                            {showAllJobs ? "View less" : "View more"}
                        </button>
                    </div>
                )}
            </section>
        );
    };

    const renderOrdersLayout = (orders: any[]) => {
        if (isLoading) return <Loader className="animate-spin mx-auto mt-8" />;
        const filteredOrders = orders.filter(
            (order) => {
                if (!searchTerm) return true;
                const lowercasedSearchTerm = searchTerm.toLowerCase();

                const storeName = order.hardwareStore?.name || order.seller?.name;
                if (storeName?.toLowerCase().includes(lowercasedSearchTerm)) {
                    return true;
                }

                const items = order.items || order.orderItems;
                if (items?.some(item => (item.productName || item.product?.name)?.toLowerCase().includes(lowercasedSearchTerm))) {
                    return true;
                }

                return false;
            }
        );
        const ordersToDisplay = showAllOrders ? filteredOrders : filteredOrders.slice(0, 2);

        return (
            <section className="bg-white px-4 py-5 shadow-sm border border-gray-100 rounded-2xl w-full">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Orders</h2>
                {ordersToDisplay.length > 0 ? (
                    ordersToDisplay.map((order) => (
                        <JobOrderCard
                            key={`order-${order.id}`}
                            item={{ ...order, type: 'order' }}
                            getStatusColor={getStatusColor}
                            getStatusIcon={getStatusIcon}
                            onViewDetail={(selectedOrder) => navigate(`/customer/${activeSection}/order/${selectedOrder.id}`)}
                        />
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-lg font-medium mb-2">No orders found</div>
                        <p>There are no orders matching the current criteria.</p>
                    </div>
                )}
                {filteredOrders.length > 2 && (
                    <div className="flex justify-end mt-2">
                        <button type="button" className="text-[#00007a] font-bold hover:underline text-sm" onClick={() => setShowAllOrders((prev) => !prev)}>
                            {showAllOrders ? "View less" : "View more"}
                        </button>
                    </div>
                )}
            </section>
        );
    };

    const renderSectionContent = () => {
        if (activeSection === "invoices") {
            if (showInvoiceDetail && currentInvoice) {
                return (
                    <InvoiceDetail
                        invoice={currentInvoice}
                        onPayment={async () => {
                            toast.success("Payment successful! Viewing your new jobs.");
                            const updatedJobs = await getCustomerJobRequests(axiosInstance);
                            setJobRequests(updatedJobs.hashSet);
                            setShowInvoiceDetail(false);
                            setActiveSection("new");
                        }}
                        onBack={() => {
                            setShowInvoiceDetail(false);
                            setActiveSection("requisitions");
                        }}
                    />
                );
            }
            return (
                <div className="space-y-6 p-4">
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border">
                        <FaFileAlt className="text-4xl mb-3 mx-auto text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-700">No Invoice Selected</h3>
                        <p className="mt-1 max-w-md mx-auto">Invoices will appear here after a Fundi request is submitted.</p>
                    </div>
                </div>
            );
        }

        if (activeSection === "requisitions") {
            return (
                <div className="space-y-8 px-4 md:px-16">
                    <Tabs
                        value={selectedTab}
                        className="w-full"
                        onValueChange={setSelectedTab}
                    >
                        <div className="mt-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div onClick={() => setSelectedTab("fundi")}>
                                    <div
                                        className={`${selectedTab == "fundi"
                                            ? "bg-[rgb(0,0,122)]"
                                            : "bg-blue-200 hover:bg-opacity-70"
                                            } flex flex-row md:flex-col justify-center items-center rounded-lg shadow-md p-4`}
                                    >
                                        <img
                                            src="/fundi.png"
                                            className="h-12 md:h-16 mr-2 md:mr-0"
                                            alt="Requisition"
                                        />
                                        <p
                                            className={`${selectedTab == "fundi"
                                                ? "text-white"
                                                : "text-black"
                                                } mt-2 text-lg font-semibold`}
                                        >
                                            Fundi
                                        </p>
                                    </div>
                                </div>
                                <div
                                    onClick={() =>
                                        setSelectedTab("professional")
                                    }
                                >
                                    <div
                                        className={`${selectedTab == "professional"
                                            ? "bg-[rgb(0,0,122)]"
                                            : "bg-blue-200 hover:bg-opacity-70"
                                            } flex flex-row md:flex-col justify-center items-center rounded-lg shadow-md p-4`}
                                    >
                                        <img
                                            src="/professional.png"
                                            className="h-12 md:h-16 mr-2 md:mr-0"
                                            alt="Professional"
                                        />
                                        <p
                                            className={`${selectedTab == "professional"
                                                ? "text-white"
                                                : "text-black"
                                                } mt-2 text-lg font-semibold`}
                                        >
                                            Professional
                                        </p>
                                    </div>
                                </div>
                                <div
                                    onClick={() => setSelectedTab("contractor")}
                                >
                                    <div
                                        className={`${selectedTab == "contractor"
                                            ? "bg-[rgb(0,0,122)]"
                                            : "bg-blue-200 hover:bg-opacity-70"
                                            } flex flex-row md:flex-col justify-center items-center rounded-lg shadow-md p-4 transition`}
                                    >
                                        <img
                                            src="/contractor.png"
                                            className="h-12 md:h-16 mr-2 md:mr-0"
                                            alt="Contractor"
                                        />
                                        <p
                                            className={`${selectedTab == "contractor"
                                                ? "text-white"
                                                : "text-black"
                                                } mt-2 text-lg font-semibold`}
                                        >
                                            Contractor
                                        </p>
                                    </div>
                                </div>
                                <div
                                    onClick={() =>
                                        navigate("/customer/hardware_shop")
                                    }
                                >
                                    <div
                                        className={`${selectedTab == "hardware"
                                            ? "bg-[rgb(0,0,122)]"
                                            : "bg-blue-200 hover:bg-opacity-70"
                                            } flex flex-row md:flex-col justify-center items-center rounded-lg shadow-md p-4 transition cursor-pointer`}
                                    >
                                        <img
                                            src="/hardware.png"
                                            className="h-12 md:h-16 mr-2 md:mr-0"
                                            alt="Hardware"
                                        />
                                        <p
                                            className={`${selectedTab == "hardware"
                                                ? "text-white"
                                                : "text-black"
                                                } mt-2 text-lg font-semibold`}
                                        >
                                            Shop App
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center animate-fade-in my-4">
                            <h1 className="text-2xl md:text-3xl font-bold text-[#162c9b] mb-2">
                                Request for{" "}
                                {selectedTab === "fundi"
                                    ? "Fundi Services"
                                    : selectedTab === "professional"
                                        ? "Professional Services"
                                        : selectedTab === "contractor"
                                            ? "Contractor Services"
                                            : "Hardware Services"}
                            </h1>
                        </div>

                        <TabsContent value="fundi">
                            <FundiForm
                                formData={formData}
                                handleInputChange={handleInputChange}
                                handleDateChange={handleDateChange}
                                setSelectedPlan={setSelectedPlan}
                                setAcceptedPolicy={setAcceptedPolicy}
                                handleSubmit={handleSubmit}
                                isFormValid={isFormValid}
                                isSubmitting={isSubmitting}
                                selectedPlan={selectedPlan}
                                acceptedPolicy={acceptedPolicy}
                                attachments={attachments}
                                uploadingFiles={uploadingFiles}
                                editingFile={editingFile}
                                editingFileName={editingFileName}
                                handleFileUpload={handleFileUpload}
                                removeAttachment={removeAttachment}
                                startEditingFile={startEditingFile}
                                saveEditingFileName={saveEditingFileName}
                                cancelEditingFileName={cancelEditingFileName}
                                setEditingFileName={setEditingFileName}
                            />
                        </TabsContent>

                        <TabsContent value="professional">
                            <ProfessionalForm
                                formData={formData}
                                handleInputChange={handleInputChange}
                                handleDateChange={handleDateChange}
                                setSelectedPlan={setSelectedPlan}
                                setAcceptedPolicy={setAcceptedPolicy}
                                handleSubmit={handleSubmit}
                                isFormValid={isFormValid}
                                isSubmitting={isSubmitting}
                                selectedPlan={selectedPlan}
                                acceptedPolicy={acceptedPolicy}
                                attachments={attachments}
                                uploadingFiles={uploadingFiles}
                                editingFile={editingFile}
                                editingFileName={editingFileName}
                                handleFileUpload={handleFileUpload}
                                removeAttachment={removeAttachment}
                                startEditingFile={startEditingFile}
                                saveEditingFileName={saveEditingFileName}
                                cancelEditingFileName={cancelEditingFileName}
                                setEditingFileName={setEditingFileName}
                            />
                        </TabsContent>

                        <TabsContent value="contractor">
                            <ContractorForm
                                formData={formData}
                                handleInputChange={handleInputChange}
                                handleDateChange={handleDateChange}
                                setSelectedPlan={setSelectedPlan}
                                setAcceptedPolicy={setAcceptedPolicy}
                                handleSubmit={handleSubmit}
                                isFormValid={isFormValid}
                                isSubmitting={isSubmitting}
                                selectedPlan={selectedPlan}
                                acceptedPolicy={acceptedPolicy}
                                attachments={attachments}
                                uploadingFiles={uploadingFiles}
                                editingFile={editingFile}
                                editingFileName={editingFileName}
                                handleFileUpload={handleFileUpload}
                                removeAttachment={removeAttachment}
                                startEditingFile={startEditingFile}
                                saveEditingFileName={saveEditingFileName}
                                cancelEditingFileName={cancelEditingFileName}
                                setEditingFileName={setEditingFileName}
                            />
                        </TabsContent>

                        {/* --- Hardware/Shop Tab Content --- */}
                        <TabsContent value="shop">
                            <div className="text-center py-12 animate-fade-in">
                                <Store className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                    Shop App
                                </h3>
                                <p className="text-gray-500 mb-4">
                                    Browse and purchase construction materials
                                    and tools
                                </p>
                                <Button className="bg-[#00a63e] hover:bg-[#00a63e]/90 text-white">
                                    Visit Shop App
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            );
        }

        if (showJobDetail && currentJob) {
            return <JobDetail job={currentJob} onBack={() => setShowJobDetail(false)} onEdit={() => setShowJobDetail(false)} />;
        }

        const currentJobs = getJobsByStatus(activeSection);
        const currentOrders = getOrdersByStatus(activeSection);

        return (
            <div className="space-y-6 p-4">
                <div className="md:ml-13 flex items-center justify-between animate-fade-in">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#00007a] mb-2">
                            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Jobs & Orders
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <Badge className="bg-[#00a63e] text-white px-3 py-1">{currentJobs.length} Jobs</Badge>
                        <Badge className="bg-[#00007a] text-white px-3 py-1">{currentOrders.length} Orders</Badge>
                    </div>
                </div>

                <div className="ml-19 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input placeholder="Search..." className="pl-10 bg-white border border-gray-200 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="grid gap-6 max-w-6xl mx-auto">
                    {renderJobsLayout(currentJobs)}
                    {renderOrdersLayout(currentOrders)}
                </div>
            </div>
        );
    };

    if (showProfileCompletion) {
        return (
            <ProfileCompletion
                user={user}
                accountType={user?.accountType || "INDIVIDUAL"}
                onComplete={handleProfileComplete}
            />
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <DashboardHeader />
            <ChatWidgetWrapper className="" />
            <div className="bg-white border-b mx-6">
                <div className="bg-white pt-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="flex items-center">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                Welcome - {user?.firstName}
                            </h1>
                        </div>
                    </div>
                </div>
                <div className="container mx-auto">
                    <nav className="flex overflow-x-auto justify-start md:justify-end h-12 px-4 scrollbar-hide">
                        {TABS.map((tab) => (
                            <button key={tab.id} onClick={() => { setActiveSection(tab.id); setShowJobDetail(false); }} className={`flex-shrink-0 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeSection === tab.id ? 'border-[#162c9b] text-[#162c9b]' : 'border-transparent text-gray-600 hover:text-[#00007a] hover:border-gray-300'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
            <main className="flex-1 flex items-center justify-center py-8">
                <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {renderSectionContent()}
                </div>
            </main>
            <GenericFooter />
        </div>
    );
}