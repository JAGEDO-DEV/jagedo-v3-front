/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
//@ts-nocheck
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

import JobSpecification from '@/components/BidComponents/JobSpecification';
import Payments from '@/components/BidComponents/Payments';
import CustomerDetails from '@/components/BidComponents/CustomerDetails';
import Bidders from '@/components/BidComponents/Bidders';
import Bids from '@/components/BidComponents/Bids';
import { DashboardHeader } from '@/components/DashboardHeader';
import { getJobRequestById } from '@/api/jobRequests.api';
import useAxiosWithAuth from '@/utils/axiosInterceptor';
import { useGlobalContext } from '@/context/GlobalProvider';

const getTabs = (jobData: any) => [
    { name: "Job Specification", component: <JobSpecification jobData={jobData} /> },
    { name: "Payments", component: <Payments jobData={jobData} /> },
    { name: "Customer Details", component: <CustomerDetails jobData={jobData} /> },
    { name: "Bidders", component: <Bidders jobData={jobData} /> },
    { name: "Bids", component: <Bids jobData={jobData} /> }
];

interface ActiveAwardedNavProps {
    activeTab: string;
    onTabClick: (tabName: string) => void;
    tabs: Array<{ name: string; component: JSX.Element }>;
}

function ActiveAwardedNav({ activeTab, onTabClick, tabs }: ActiveAwardedNavProps) {
    return (
        <div className="flex space-x-6 overflow-x-auto flex-nowrap">
            {tabs.map((tab) => (
                <button
                    key={tab.name}
                    type="button"
                    onClick={() => onTabClick(tab.name)}
                    className={`py-2 font-medium text-sm md:text-base whitespace-nowrap focus:outline-none ${
                        activeTab === tab.name
                            ? "text-blue-800 border-b-2 border-blue-800"
                            : "text-gray-600 hover:text-blue-800"
                        }`}
                >
                    {tab.name}
                </button>
            ))}
        </div>
    );
}

function ActiveJobPageContainer() {
    const { id } = useParams<{ id: string }>();
    const { user } = useGlobalContext();
    const navigate = useNavigate();
    const jobId = id;
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [jobData, setJobData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("Job Specification");

    const handleBack = () => {
        navigate(-1);
    };

    const fetchJobData = async () => {
        const response = await getJobRequestById(axiosInstance, jobId);
        setJobData(response.data);
    }

    useEffect(() => {
        if (jobId) {
            fetchJobData();
        }
    }, [jobId]);

    const tabs = jobData ? getTabs(jobData) : [];
    const activeComponent = tabs.find(tab => tab.name === activeTab)?.component;

    return (
        <>
            {user?.user_type.toLowerCase() == 'fundi' && <DashboardHeader />}
            <section className="container mx-auto mt-8 px-4">
                <header>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Job Details for #{jobData?.jobId}</h2>
                    {/* Container for Back button and Tabs */}
                    <div className="border-b border-gray-400 flex justify-between items-center">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-gray-700 hover:text-blue-800 transition-colors pr-4"
                            aria-label="Go back"
                        >
                            <FaArrowLeft className="h-5 w-5" />
                            <span className="font-semibold hidden sm:inline">Back</span>
                        </button>

                        <ActiveAwardedNav
                            activeTab={activeTab}
                            onTabClick={setActiveTab}
                            tabs={tabs}
                        />
                    </div>
                </header>

                <main className="mt-6">
                    {activeComponent}
                </main>
            </section>
        </>
    );
}

export default ActiveJobPageContainer;