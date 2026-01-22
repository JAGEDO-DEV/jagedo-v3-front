/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
//@ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProfileCompletion } from "@/components/profile 2.0/ProfileCompletion";
import {
    Eye,
    CheckCircle,
    AlertCircle,
    Search,
    FileText,
    TrendingUp,
    Clock,
    ShoppingCart
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getProviderOrderRequests } from "@/api/orderRequests.api";
import { useGlobalContext } from "@/context/GlobalProvider";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import JobOrderCard from "@/components/dashboard/JobOrderCard";
import { DashboardHeader } from "@/components/DashboardHeader";
import ChatWidgetWrapper from "@/components/ChatWidget";
import GenericFooter from "@/components/generic-footer";

export default function HardwareDashboard() {
    const { user, setUser } = useGlobalContext();
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const navigate = useNavigate();

    const [activeSection, setActiveSection] = useState("new");
    const [searchTerm, setSearchTerm] = useState("");

    // State for API data, loading, and errors
    const [orderRequests, setOrderRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setIsLoading(true);
                const response = await getProviderOrderRequests(axiosInstance);
                setOrderRequests(response.hashSet || []);
                setError(null);
            } catch (err) {
                console.error("Failed to fetch orders:", err);
                setError("Failed to load orders. Please try again later.");
                setOrders([]); // Clear any stale data on error
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, []); // Dependency array ensures this runs once or if axiosInstance changes

    const getOrderByStatus = (status: string) => {
        if (!orderRequests) return [];
        const sortByDateDesc = (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

        switch (status) {
            case "new":
                return orderRequests.filter(order => ["PENDING", "NEW"].includes(order.status?.toUpperCase())).sort(sortByDateDesc);
            case "active":
                return orderRequests.filter(order => ["PROCESSING", "SHIPPED"].includes(order.status?.toUpperCase())).sort(sortByDateDesc);
            case "complete":
                return orderRequests.filter(order => ["DELIVERED", "COMPLETED", "PAST"].includes(order.status?.toUpperCase())).sort(sortByDateDesc);
            case "quotations":
                return orderRequests.filter(order => ["BIDDING", "BID"].includes(order.status?.toUpperCase())).sort(sortByDateDesc);
            case "draft":
                return orderRequests.filter(order => order.status?.toUpperCase() === "DRAFT").sort(sortByDateDesc);
            default:
                return [];
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "bg-orange-100 text-orange-800";
            case "active": return "bg-green-100 text-green-800";
            case "quotations": return "bg-blue-100 text-blue-800";
            case "draft": return "bg-yellow-100 text-yellow-800";
            case "complete": return "bg-purple-100 text-purple-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "pending": return <Clock className="h-4 w-4" />;
            case "active": return <ShoppingCart className="h-4 w-4" />;
            case "quotations": return <TrendingUp className="h-4 w-4" />;
            case "draft": return <FileText className="h-4 w-4" />;
            case "complete": return <CheckCircle className="h-4 w-4" />;
            default: return <AlertCircle className="h-4 w-4" />;
        }
    };

    const renderOrdersLayout = (ordersToRender) => {
        const filteredOrders = ordersToRender.filter(
            (order) =>
                // Ensure properties exist before calling toLowerCase
                (order.skill || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.customer || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        const ordersToDisplay = showAllOrders ? filteredOrders : filteredOrders.slice(0, 2);

        return (
            <section className="bg-white px-4 py-5 shadow-sm border border-gray-100 rounded-2xl w-full">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Orders</h2>
                {ordersToDisplay.length > 0 ? (
                    ordersToDisplay.map((order) => (
                        <JobOrderCard
                            key={`order-${order.id}`}
                            item={order}
                            getStatusColor={getStatusColor}
                            getStatusIcon={getStatusIcon}
                            onViewDetail={(selectedOrder) => navigate(`/hardware/${activeSection}/order/${selectedOrder.id}`)}
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
                        <button
                            type="button"
                            className="text-[#00007a] font-bold hover:underline text-sm"
                            onClick={() => setShowAllOrders((prev) => !prev)}
                        >
                            {showAllOrders ? "View less" : "View more"}
                        </button>
                    </div>
                )}
            </section>
        );
    };

    const renderSectionContent = () => {
        // Handle loading and error states first
        if (isLoading) {
            return <div className="text-center py-10">Loading orders...</div>;
        }

        if (error) {
            return (
                <div className="text-center py-10 text-red-600 bg-red-50 p-4 rounded-lg">
                    <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                    <p className="font-semibold">{error}</p>
                </div>
            );
        }

        // **MODIFIED**: Using the renamed function to get orders for the active section.
        const currentOrders = getOrderByStatus(activeSection);

        return (
            <div className="space-y-6">
                <div className="p-2 flex items-center justify-between animate-fade-in">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#00007a] mb-2">
                            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Orders
                        </h1>
                        <p className="text-gray-600">
                            {activeSection === "new" && "New material orders from customers"}
                            {activeSection === "draft" && "Draft orders you are working on"}
                            {activeSection === "quotations" && "Quotations you have sent to customers"}
                            {activeSection === "active" && "Currently active orders"}
                            {activeSection === "complete" && "Completed orders"}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Badge className="bg-[#00007a] text-white px-3 py-1">{currentOrders.length} Orders</Badge>
                    </div>
                </div>
                <div className="ml-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search by material or customer..."
                            className="pl-10 bg-white border border-gray-200 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="grid gap-8 max-w-7xl mx-auto">
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
            <div className="bg-white border-b shadow-sm w-full">
                <div className="container mx-auto px-4">
                    <div className="pt-5">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div className="flex items-center">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    Welcome - {user?.firstName}
                                </h1>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <nav className="flex overflow-x-auto space-x-2">
                            {[
                                { label: "New", value: "new", Icon: Eye },
                                { label: "Drafts", value: "draft", Icon: FileText },
                                { label: "Quotations", value: "quotations", Icon: TrendingUp },
                                { label: "Active", value: "active", Icon: ShoppingCart },
                                { label: "Complete", value: "complete", Icon: CheckCircle },
                            ].map(({ label, value, Icon }) => (
                                <button
                                    key={value}
                                    onClick={() => setActiveSection(value)}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                                ${activeSection === value
                                            ? "border-[#00a63e] text-[#00a63e] bg-[#00a63e]/5"
                                            : "border-transparent text-gray-600 hover:text-[#00007a] hover:border-gray-300"
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {label}
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