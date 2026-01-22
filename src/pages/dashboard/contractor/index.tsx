/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProfileCompletion } from "@/components/profile 2.0/ProfileCompletion";
import {
    Eye,
    CheckCircle,
    AlertCircle,
    Search,
    Award,
    TrendingUp,
    FileText,
    Clock,
    Building2,
    XCircle
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGlobalContext } from "@/context/GlobalProvider";
import JobOrderCard from "@/components/dashboard/JobOrderCard";
import Loader from "@/components/Loader";
import { getServiceProviderJobRequests } from "@/api/jobRequests.api";
import { getProviderOrderRequests } from "@/api/orderRequests.api";
import { DashboardHeader } from "@/components/DashboardHeader";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import ChatWidgetWrapper from "@/components/ChatWidget";
import GenericFooter from "@/components/generic-footer";
interface JobRequest {
    id: string | number;
    status: string;
    skill?: string;
    customer?: string;
    jobType?: string;
    managedBy?: string;
    location?: string;
    startDate?: string;
    stage?: string;
}

interface OrderItem {
    productName?: string;
    product?: {
        name?: string;
    };
}

interface OrderRequest {
    id: string | number;
    status?: string;
    hardwareStore?: { name?: string };
    seller?: { name?: string };
    items?: OrderItem[];
    orderItems?: OrderItem[];
    type?: 'order';
}

export default function ContractorDashboard() {
    const { user, setUser } = useGlobalContext();
    const navigate = useNavigate();
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [activeSection, setActiveSection] = useState("new");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchParams] = useSearchParams();

    const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
    const [orderRequests, setOrderRequests] = useState<OrderRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showAllJobs, setShowAllJobs] = useState(false);
    const [showAllOrders, setShowAllOrders] = useState(false);

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
        { id: 'new', label: 'New', Icon: Eye },
        { id: 'bid', label: 'Bids', Icon: TrendingUp },
        { id: 'active', label: 'Active', Icon: Building2 },
        { id: 'complete', label: 'Completed', Icon: CheckCircle },
        { id: 'draft', label: 'Drafts', Icon: FileText },
    ];

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [jobsResponse, ordersResponse] = await Promise.all([
                    getServiceProviderJobRequests(axiosInstance),
                    getProviderOrderRequests(axiosInstance)
                ]);

                if (jobsResponse.success) {
                    const fetchedJobs = jobsResponse.hashSet || [];
                    setJobRequests([...fetchedJobs]);
                } else {
                    toast.error("Failed to load jobs.");
                    setError("Could not fetch jobs.");
                }

                if (ordersResponse.success) {
                    setOrderRequests(ordersResponse.hashSet || []);
                } else {
                    toast.error("Failed to load material orders.");
                    setError(prev => prev ? `${prev} And could not fetch orders.` : "Could not fetch orders.");
                }
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError("An error occurred while loading your data.");
                toast.error("An error occurred while loading your data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, []);

    useEffect(() => {
        const tabFromParams = searchParams.get("tab");
        if (tabFromParams && TABS.some(tab => tab.id === tabFromParams)) {
            setActiveSection(tabFromParams);
        }
    }, [searchParams]);

    const getJobsByStatus = (status: string): JobRequest[] => {
        if (!jobRequests) return [];
        const sortByDateDesc = (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        switch (status) {
            case "new":
                return jobRequests.filter((job) => ["new", "request", "available"].includes(job.status.toLowerCase())).sort(sortByDateDesc);
            case "draft":
                return jobRequests.filter((job) => job.status.toLowerCase() === "draft").sort(sortByDateDesc);
            case "bid":
                return jobRequests.filter((job) => ["bid", "bidding", "quotation", "proposal_submitted", "bids"].includes(job.status.toLowerCase())).sort(sortByDateDesc);
            case "active":
                return jobRequests.filter((job) => ["assigned", "active"].includes(job.status.toLowerCase())).sort(sortByDateDesc);
            case "complete":
                return jobRequests
                    .filter((job) => ["completed", "complete", "past"].includes(job.status.toLowerCase()))
                    .sort(sortByDateDesc);
            default:
                return [];
        }
    };

    const getOrdersByStatus = (status: string): OrderRequest[] => {
        if (!orderRequests) return [];
        const sortByDateDesc = (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        switch (status) {
            case "new":
                return orderRequests.filter(order => ["PENDING", "NEW"].includes(order.status?.toUpperCase())).sort(sortByDateDesc);
            case "active":
                return orderRequests.filter(order => ["PROCESSING", "SHIPPED"].includes(order.status?.toUpperCase())).sort(sortByDateDesc);
            case "complete":
                return orderRequests.filter(order => ["DELIVERED", "COMPLETED", "PAST"].includes(order.status?.toUpperCase())).sort(sortByDateDesc);
            case "bid":
                return orderRequests.filter(order => ["BIDDING", "BID"].includes(order.status?.toUpperCase())).sort(sortByDateDesc);
            default:
                return [];
        }
    };

    const getStatusColor = (status: string) => {
        const lowerStatus = status?.toLowerCase();
        switch (lowerStatus) {
            case "proposal_submitted":
            case "submitted": return "bg-blue-100 text-blue-800";
            case "accepted":
            case "available": return "bg-green-100 text-green-800";
            case "rejected": return "bg-red-100 text-red-800";
            case "draft": return "bg-blue-100 text-blue-800";
            case "active": return "bg-yellow-100 text-yellow-800";
            case "complete": return "bg-purple-100 text-purple-800";
            case "pending": return "bg-orange-100 text-orange-800";
            case "delivered": return "bg-green-100 text-green-800";
            case "new":
            case "request": return "bg-cyan-100 text-cyan-800";
            case "bid":
            case "bidding":
            case "quotation": return "bg-indigo-100 text-indigo-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusIcon = (status: string) => {
        const lowerStatus = status?.toLowerCase();
        switch (lowerStatus) {
            case "proposal_submitted":
            case "submitted": return <TrendingUp className="h-4 w-4" />;
            case "accepted":
            case "available": return <CheckCircle className="h-4 w-4" />;
            case "rejected": return <XCircle className="h-4 w-4" />;
            case "draft": return <FileText className="h-4 w-4" />;
            case "active": return <Clock className="h-4 w-4" />;
            case "complete": return <Award className="h-4 w-4" />;
            case "pending": return <Clock className="h-4 w-4" />;
            case "delivered": return <CheckCircle className="h-4 w-4" />;
            case "new":
            case "request": return <Eye className="h-4 w-4" />;
            case "bid":
            case "bidding":
            case "quotation": return <TrendingUp className="h-4 w-4" />;
            default: return <AlertCircle className="h-4 w-4" />;
        }
    };

    const renderJobsLayout = (jobs: JobRequest[]) => {
        const filteredJobs = jobs.filter(
            (job) =>
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
                            onViewDetail={(selectedJob) => navigate(`/contractor/${activeSection}/job/${selectedJob.id}`)}
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

    const renderOrdersLayout = (orders: OrderRequest[]) => {
        const filteredOrders = orders.filter((order) => {
            if (!searchTerm) return true;
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            const storeName = order.hardwareStore?.name || order.seller?.name;
            if (storeName?.toLowerCase().includes(lowercasedSearchTerm)) return true;
            const items = order.items || order.orderItems;
            return items?.some(item => (item.productName || item.product?.name)?.toLowerCase().includes(lowercasedSearchTerm)) || false;
        });
        const ordersToDisplay = showAllOrders ? filteredOrders : filteredOrders.slice(0, 2);

        return (
            <section className="bg-white px-4 py-5 shadow-sm border border-gray-100 rounded-2xl w-full">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Material Orders</h2>
                {ordersToDisplay.length > 0 ? (
                    ordersToDisplay.map((order) => (
                        <JobOrderCard
                            key={`order-${order.id}`}
                            item={{ ...order, type: 'order' }}
                            getStatusColor={getStatusColor}
                            getStatusIcon={getStatusIcon}
                            onViewDetail={(selectedOrder) => navigate(`/contractor/${activeSection}/order/${selectedOrder.id}`)}
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
        if (isLoading) {
            return <div className="flex justify-center items-center p-16"><Loader /></div>;
        }
        if (error) {
            return <p className="text-center p-8 text-red-600">{error}</p>;
        }

        const currentJobs = getJobsByStatus(activeSection);
        const currentOrders = getOrdersByStatus(activeSection);

        let sectionTitle = "";
        let sectionDescription = "";

        if (activeSection === "bid") {
            sectionTitle = "Your Bids";
            sectionDescription = "Construction jobs and material orders you have bid on";
        } else {
            sectionTitle = `${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Jobs & Orders`;
            switch (activeSection) {
                case "new": sectionDescription = "New job opportunities and pending material orders"; break;
                case "active": sectionDescription = "Currently ongoing work"; break;
                case "complete": sectionDescription = "Completed work history and delivered orders"; break;
                case "draft": sectionDescription = "Draft proposals and orders you are working on"; break;
                default: sectionDescription = "All jobs and orders";
            }
        }

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between animate-fade-in">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#00007a] mb-2">{sectionTitle}</h1>
                        <p className="text-gray-600">{sectionDescription}</p>
                    </div>
                    <div className="flex gap-2">
                        <Badge className="bg-[#00a63e] text-white px-3 py-1">{currentJobs.length} Jobs</Badge>
                        <Badge className="bg-[#00007a] text-white px-3 py-1">{currentOrders.length} Orders</Badge>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-end">
                    <div className="relative flex-1 max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search jobs or orders..."
                            className="pl-10 bg-white border border-gray-200 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
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
                accountType="INDIVIDUAL"
                onComplete={handleProfileComplete}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <DashboardHeader />
            <ChatWidgetWrapper />
            <div className="bg-white border-b shadow-sm">
                <div className="container mx-auto">
                    <div className="bg-white p-5">
                        <div className="flex items-center">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                Welcome, {user?.firstName}!
                            </h1>
                        </div>
                    </div>
                    <div className="border-b border-gray-200">
                        <nav className="flex overflow-x-auto justify-start md:justify-end h-14 px-2 sm:px-4 scrollbar-hide">
                            {TABS.map(({ id, label, Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveSection(id)}
                                    className={`
                                flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium
                                border-b-4 transition-colors whitespace-nowrap
                                ${activeSection === id
                                            ? 'border-[#00a63e] text-[#00a63e]'
                                            : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                                        }
                            `}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
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