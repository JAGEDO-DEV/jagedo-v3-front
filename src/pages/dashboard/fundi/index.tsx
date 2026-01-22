/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    CheckCircle,
    AlertCircle,
    Search,
    TrendingUp,
    Building2,
    FileText,
    Hammer,
    Eye,
    Clock,
    Store,
    Edit,
    Loader
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { useGlobalContext } from "@/context/GlobalProvider";
import JobOrderCard from "@/components/dashboard/JobOrderCard";
import GenericFooter from "@/components/generic-footer";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getServiceProviderJobRequests } from "@/api/jobRequests.api";
import { getProviderOrderRequests } from "@/api/orderRequests.api";
import { toast } from "react-hot-toast";
import ChatWidgetWrapper from "@/components/ChatWidget";
import { ProfileCompletion } from "@/components/profile 2.0/ProfileCompletion";

export interface JobRequestResponse {
    id: string;
    skill: string;
    customer: {
        firstName: string;
        lastName: string;
    };
    location: string;
    startDate: string;
    status: string;
    jobType: string;
    description: string;
    managedBy: string;
}

export interface OrderRequestResponse {
    id: string;
    status: string;
    total: number;
    hardwareStore: {
        name: string;
    };
    orderItems: { product: { name: string } }[];
    createdAt: string;
}

// Define the notification type to anticipate the structure from the header
export interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    createdAt: string;
    read: boolean;
}


type Job = JobRequestResponse;
type Order = OrderRequestResponse;

export default function FundiDashboard() {
    //const { user } = useGlobalContext();
    const { user, setUser } = useGlobalContext();
    const navigate = useNavigate();
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
        const userIndex = db.findIndex((u: any) => u.email === user.email);
        if (userIndex !== -1) {
            db[userIndex] = updatedUser;
            localStorage.setItem("mock_users_db", JSON.stringify(db));
        }
        setShowProfileCompletion(false);
        toast.success("Profile completed!");
    };
    
    const location = useLocation();
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeSection, setActiveSection] = useState(location.state?.activeTab || "new");
    const [showAllJobs, setShowAllJobs] = useState(false);
    const [showAllOrders, setShowAllOrders] = useState(false);
    const [jobRequests, setJobRequests] = useState<Job[]>([]);
    const [orderRequests, setOrderRequests] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);


    const TABS = [
        { id: 'new', label: 'New', Icon: Eye },
        { id: 'bid', label: 'Bids', Icon: TrendingUp },
        { id: 'active', label: 'Active', Icon: Building2 },
        { id: 'complete', label: 'Complete', Icon: CheckCircle },
        { id: 'draft', label: 'Drafts', Icon: FileText },
    ];

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            try {
                const [jobsResponse, ordersResponse] = await Promise.all([
                    getServiceProviderJobRequests(axiosInstance),
                    getProviderOrderRequests(axiosInstance)
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

    const getDataByStatus = (status: string, dataType: "jobs" | "orders") => {
        const sortByDateDesc = (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

        if (dataType === "jobs") {
            if (!jobRequests) return [];
            switch (status) {
                case "new":
                    return jobRequests.filter((job) => ["request", "new", "available"].includes(job.status?.toLowerCase())).sort(sortByDateDesc);
                case "draft":
                    return jobRequests.filter((job) => ["drafts", "draft"].includes(job.status?.toLowerCase())).sort(sortByDateDesc);
                case "active":
                    return jobRequests.filter((job) => ["assigned", "active"].includes(job.status?.toLowerCase())).sort(sortByDateDesc);
                case "complete":
                    return jobRequests.filter((job) => ["completed", "complete", "past"].includes(job.status?.toLowerCase())).sort(sortByDateDesc);
                default:
                    return [];
            }
        } else {
            if (!orderRequests) return [];
            switch (status) {
                case "new":
                    return orderRequests.filter(order => ["PENDING", "NEW"].includes(order.status?.toUpperCase())).sort(sortByDateDesc);
                case "active":
                    return orderRequests.filter(order => ["PROCESSING", "SHIPPED"].includes(order.status?.toUpperCase())).sort(sortByDateDesc);
                case "bid":
                    return orderRequests.filter(order => order.status?.toUpperCase() === "BID").sort(sortByDateDesc);
                case "complete":
                    return orderRequests.filter(order => ["DELIVERED", "COMPLETED", "COMPLETE", "PAST"].includes(order.status?.toUpperCase())).sort(sortByDateDesc);
                case "draft":
                    return orderRequests.filter(order => order.status?.toUpperCase() === "DRAFT").sort(sortByDateDesc);
                default:
                    return [];
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "available": case "delivered": return "bg-green-100 text-green-800";
            case "bid": return "bg-blue-100 text-blue-800";
            case "active": return "bg-yellow-100 text-yellow-800";
            case "complete": case "completed": return "bg-purple-100 text-purple-800";
            case "pending": case "pending-approval": return "bg-orange-100 text-orange-800";
            case "draft": return "bg-gray-200 text-gray-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case "request": return <Search className="h-4 w-4" />;
            case "assigned": return <Store className="h-4 w-4" />;
            case "draft": return <Edit className="h-4 w-4" />;
            case "quotation": return <Clock className="h-4 w-4" />;
            case "active": return <Hammer className="h-4 w-4" />;
            case "pending-approval": return <AlertCircle className="h-4 w-4" />;
            case "completed": case "complete": return <CheckCircle className="h-4 w-4" />;
            default: return <AlertCircle className="h-4 w-4" />;
        }
    };

    const renderJobsLayout = (jobs: Job[]) => {
        const filteredJobs = jobs.filter(
            (job) =>
                job.skill?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (job.customer?.firstName + " " + job.customer?.lastName).toLowerCase().includes(searchTerm.toLowerCase())
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
                            onViewDetail={(selectedJob) => navigate(`/fundi-portal/${activeSection}/job/${selectedJob.id}`)}
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

    const renderOrdersLayout = (orders: Order[]) => {
        const filteredOrders = orders.filter(
            (order) =>
                order.hardwareStore?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.orderItems?.some(item => item.product.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
                            onViewDetail={(selectedOrder) => navigate(`/fundi-portal/${activeSection}/order/${selectedOrder.id}`)}
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
            return (
                <div className="flex justify-center items-center py-20">
                    <Loader className="h-10 w-10 animate-spin text-blue-600" />
                </div>
            );
        }

        const currentJobs = getDataByStatus(activeSection, "jobs");
        const currentOrders = getDataByStatus(activeSection, "orders");

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between animate-fade-in">
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
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search by skill or customer..."
                            className="pl-10 bg-white border border-gray-200 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="grid gap-8 max-w-7xl mx-auto">
                    {activeSection !== 'bid' && renderJobsLayout(currentJobs)}
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
            {/* FIXED: Pass the handler function to the header component */}
            <DashboardHeader />

            <ChatWidgetWrapper />
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="pt-5">
                        <div className="flex items-center">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome, {user?.firstName}</h1>
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