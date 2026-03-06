/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { getJobRequestById } from "@/api/jobRequests.api";
import JobSpecification from '@/components/CustomerActivePastJobComponents/Job_Specification';
import Progress from '@/components/CustomerActivePastJobComponents/Progress';
import ContractorProfessionalProgress from '@/components/PastActiveContractorJobsComponent/Progress';
import Quote from '@/components/CustomerActivePastJobComponents/Quote';
import Submissions from '@/components/CustomerActivePastJobComponents/Submissions';
import Builder from '@/components/CustomerActivePastJobComponents/Builder';
import { DashboardHeader } from '@/components/DashboardHeader';
import AwardPageContent from '../../Bid/jobs/awarded';
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { EmbeddedChat } from '@embeddedchat/react';

const baseTabs = [
    { name: "Job Specification", component: <JobSpecification /> },
    { name: "Quote", component: <Quote /> },
    { name: "Progress", component: <Progress /> },
    { name: "Builder", component: <Builder /> },
    { name: "Submissions", component: <Submissions /> }
];

const awardTab = { name: "Award", component: <AwardPageContent showHeader={false} showSpecificationandAward={false} /> };


interface BidClosedNavProps {
    tabs: Array<{ name: string; component: JSX.Element }>;
    activeTab: string;
    onTabClick: (tabName: string) => void;
}

function BidClosedNav({ tabs, activeTab, onTabClick }: BidClosedNavProps) {
    return (
        <div className="border-b border-gray-400">
            <div className="overflow-x-auto">
                <div className="flex justify-end space-x-6 px-4 min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            type="button"
                            onClick={() => onTabClick(tab.name)}
                            className={`pb-1 font-medium text-sm md:text-base focus:outline-none whitespace-nowrap ${activeTab === tab.name
                                ? "text-blue-800 border-b-2 border-blue-800"
                                : "text-gray-600 hover:text-blue-800"
                                }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ActiveCustomerJobsPageContainer() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [activeTab, setActiveTab] = useState(baseTabs[0].name);
    const [jobRequestData, setJobRequestData] = useState(null);

    const handleBack = () => {
        navigate(-1);
    };

    useEffect(() => {
        const fetchJobData = async () => {
            if (id) {
                try {
                    
                    const response = await getJobRequestById(axiosInstance, id);
                    setJobRequestData(response.data);
                } catch (error) {
                    console.error("Failed to fetch job request data:", error);
                }
            }
        };

        fetchJobData();
    }, [id]);

    const dynamicTabs = useMemo(() => {
        if (!jobRequestData) {
            return baseTabs;
        }

        const jobType = jobRequestData.jobType?.toLowerCase();
        let tabs = [...baseTabs];

        const progressTabIndex = tabs.findIndex(tab => tab.name === "Progress");

        if (jobType === 'professional' || jobType === 'contractor') {
            if (progressTabIndex !== -1) {
                tabs[progressTabIndex] = { ...tabs[progressTabIndex], component: <ContractorProfessionalProgress /> };
            }
            tabs.push(awardTab);

        } else if (jobType === 'fundi') {
            tabs = tabs.filter((tab) => tab.name !== 'Quote');
        }

        return tabs;
    }, [jobRequestData]);


    const activeComponent = dynamicTabs.find(tab => tab.name === activeTab)?.component;

    return (
        <>
            <DashboardHeader />
            <section className="container mx-auto mt-8 px-4">
                <header className="mb-6">
                    <div className="border-b border-gray-400 flex justify-between items-center">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-gray-700 hover:text-blue-800 transition-colors pr-4"
                            aria-label="Go back"
                        >
                            <FaArrowLeft className="h-5 w-5" />
                            <span className="font-semibold hidden sm:inline">Back</span>
                        </button>

                        <BidClosedNav
                            tabs={dynamicTabs}
                            activeTab={activeTab}
                            onTabClick={setActiveTab}
                        />
                    </div>
                </header>

                <main className="mt-6">
                    {!jobRequestData ? (
                        <p>Loading...</p>
                    ) : (
                        activeComponent
                    )}
                </main>
            </section>
            {jobRequestData?.groupChatId && (
                <>
                    <button
                        onClick={toggleChat}
                        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110 z-50"
                        aria-label="Toggle chat"
                    >
                        {isChatOpen ? (
                            <FaTimes className="h-6 w-6" />
                        ) : (
                            <FaComments className="h-6 w-6" />
                        )}
                    </button>

                    {/* Chat Window */}
                    {isChatOpen && (
                        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden">
                            <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                                <h3 className="font-semibold">Job Chat</h3>
                                <button
                                    onClick={toggleChat}
                                    className="hover:bg-blue-700 rounded-full p-1 transition-colors"
                                    aria-label="Close chat"
                                >
                                    <FaTimes className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <EmbeddedChat
                                    host={import.meta.env.VITE_CHAT_SERVER}
                                    roomId={jobRequestData?.groupChatId}
                                    token={localStorage.getItem("rocketAuthToken")}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
}

export default ActiveCustomerJobsPageContainer;