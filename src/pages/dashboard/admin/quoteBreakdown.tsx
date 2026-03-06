/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useState, useEffect } from 'react';
import { useParams, useLocation } from "react-router-dom";
import { getJobRequestById } from '@/api/jobRequests.api';
import useAxiosWithAuth from '@/utils/axiosInterceptor';
import Submissions from '@/components/Admin_Submissions_Child_Components/Submissions';
import ProffGrandSummary from '@/components/ProffContractorBidsJobComponents/ProffGrandSummary';
import ProffContractorFee from '@/components/ProffContractorBidsJobComponents/ProffContractor_fee';
import JobSpecification from '@/components/ProffContractorBidsJobComponents/Job_Specification';
import Milestones from '@/components/ProffContractorBidsJobComponents/Milestones';
import PaymentBreakdown from '@/components/ProffContractorBidsJobComponents/PaymentBreakdown';
// import OtherExpenses from '@/components/ProffContractorBidsJobComponents/Other_expenses';
import ProffWorkPlan from '@/components/ProffContractorBidsJobComponents/ProffContWorkPlan';

function AdminBidBreakDown() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

    const [activeTab, setActiveTab] = useState("Job Specification");
    const [jobData, setJobData] = useState<any>(null);
    const [selectedBid, setSelectedBid] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get bidId from navigation state
    const bidId = location.state?.bidId;

    const fetchJobData = async () => {
        if (!id) return;

        try {
            setLoading(true);
            setError(null);
            const response = await getJobRequestById(axiosInstance, id);

            if (response.success && response.data) {
                setJobData(response.data);
                
                

                // Find the selected bid from submittedBids array
                if (bidId && response.data.submittedBids) {
                    const foundBid = response.data.submittedBids.find((bid: any) => bid.id === parseInt(bidId));
                    if (foundBid) {
                        setSelectedBid(foundBid);
                        
                    } else {
                        console.warn('Bid not found with ID:', bidId);
                    }
                }
            } else {
                setError('Failed to fetch job data');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch job data');
            console.error('Error fetching job data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobData();
    }, [id]);

    const tabs = [
        { name: "Job Specification" },
        { name: "Work Plan" },
        { name: jobData?.jobType === "PROFESSIONAL" ? "Professional Fee" : "Contractor Fee" },
        // { name: "Other Expenses" },
        { name: "Milestones" },
        { name: "Grand Summary" },
        { name: "Payment Breakdown" },
        { name: "Submissions" },
    ];

    const getActiveComponent = () => {
        const componentProps = {
            response: jobData,
            jobData,
            selectedBid,
            bidId,
            loading,
            error
        };

        switch (activeTab) {
            case "Job Specification":
                return <JobSpecification
                    {...componentProps}
                    onNextClick={() => setActiveTab("Work Plan")}
                />;
            case "Work Plan":
                return <ProffWorkPlan
                    {...componentProps}
                    onPrevClick={() => setActiveTab("Job Specification")}
                    onNextClick={() => setActiveTab("Professional Fee")}
                />;
            case "Professional Fee":
                return <ProffContractorFee
                    {...componentProps}
                    onPrevClick={() => setActiveTab("Work Plan")}
                    onNextClick={() => setActiveTab("Milestones")}
                />;
            case "Contractor Fee":
                return <ProffContractorFee
                    {...componentProps}
                    onPrevClick={() => setActiveTab("Work Plan")}
                    onNextClick={() => setActiveTab("Milestones")}
                />;
            // case "Other Expenses":
            //     return <OtherExpenses
            //         {...componentProps}
            //         onPrevClick={() => setActiveTab("Professional Fee")}
            //         onNextClick={() => setActiveTab("Milestones")}
            //     />;
            case "Milestones":
                return <Milestones
                    {...componentProps}
                    onPrevClick={() => setActiveTab("Other Expenses")}
                    onNextClick={() => setActiveTab("Grand Summary")}
                />;
            case "Grand Summary":
                return <ProffGrandSummary
                    {...componentProps}
                    onPrevClick={() => setActiveTab("Milestones")}
                    onNextClick={() => setActiveTab("Payment Breakdown")}
                />;
            case "Payment Breakdown":
                return <PaymentBreakdown
                    {...componentProps}
                    onPrevClick={() => setActiveTab("Grand Summary")}
                    onNextClick={() => setActiveTab("Submissions")}
                />;
            case "Submissions":
                return <Submissions {...componentProps} />;
            default:
                return <JobSpecification
                    {...componentProps}
                    onNextClick={() => setActiveTab("Work Plan")}
                />;
        }
    };

    if (loading) {
        return (
            <>
                <section className="container mx-auto mt-4 md:mt-8 px-4">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-lg text-gray-600">Loading job data...</div>
                    </div>
                </section>
            </>
        );
    }

    if (error) {
        return (
            <>
                <section className="container mx-auto mt-4 md:mt-8 px-4">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-lg text-red-600">Error: {error}</div>
                    </div>
                </section>
            </>
        );
    }

    return (
        <>
            <button
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors m-4"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Back
            </button>
            <section className="container mx-auto mt-4 md:mt-8 px-4">
                <header>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                        Job Details for #{jobData?.jobId || id}
                        {jobData?.description && (
                            <span className="text-base font-normal text-gray-600 ml-2">- {jobData.description}</span>
                        )}
                    </h2>
                    <div className="mb-4 text-sm text-gray-600">
                        <span className="font-medium">Status:</span> {jobData?.status} |
                        <span className="font-medium ml-2">Stage:</span> {jobData?.stage} |
                        <span className="font-medium ml-2">Location:</span> {jobData?.location}
                        {bidId && (
                            <span className="font-medium ml-2">| Bid ID: {bidId}</span>
                        )}

                    </div>
                    <ActiveAwardedNav
                        tabs={tabs}
                        activeTab={activeTab}
                        onTabClick={setActiveTab}
                    />
                </header>

                <main className="mt-4 md:mt-6">
                    {getActiveComponent()}
                </main>
            </section>
        </>
    );
}

// --- Navigation Component ---
interface ActiveAwardedNavProps {
    tabs: { name: string }[];
    activeTab: string;
    onTabClick: (tabName: string) => void;
}

function ActiveAwardedNav({ tabs, activeTab, onTabClick }: ActiveAwardedNavProps) {
    return (
        <>
            {/* Desktop Navigation */}
            <div className="hidden md:block border-b border-gray-400">
                <div className="flex justify-end space-x-6 px-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            type="button"
                            onClick={() => onTabClick(tab.name)}
                            className={`pb-1 font-medium text-sm lg:text-base focus:outline-none ${activeTab === tab.name
                                ? "text-blue-800 border-b-2 border-blue-800"
                                : "text-gray-600 hover:text-blue-800"
                                }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile Navigation - Horizontal Scroll */}
            <div className="md:hidden border-b border-gray-400">
                <div className="flex overflow-x-auto scrollbar-hide px-2 py-2">
                    <div className="flex space-x-3 min-w-max">
                        {tabs.map((tab) => (
                            <button
                                key={tab.name}
                                type="button"
                                onClick={() => onTabClick(tab.name)}
                                className={`px-3 py-2 rounded-lg whitespace-nowrap text-xs font-medium focus:outline-none transition-colors ${activeTab === tab.name
                                    ? "bg-blue-800 text-white"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-blue-800"
                                    }`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

export default AdminBidBreakDown;