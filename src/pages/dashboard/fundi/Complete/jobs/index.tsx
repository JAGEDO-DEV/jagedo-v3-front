/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";

// --- Component Imports ---
import JobSpecification from '@/components/FundiActivePastSharedJobComponents/Job_Specification';
import Progress from '@/components/FundiActivePastSharedJobComponents/Progress';
import { DashboardHeader } from '@/components/DashboardHeader';
import Submissions from '@/components/FundiActivePastSharedJobComponents/Submissions';
import Customer from '@/components/FundiActivePastSharedJobComponents/Customer';
import FundiPage from '@/components/FundiActivePastSharedJobComponents/Fundi';
import Reviews from '@/components/FundiActivePastSharedJobComponents/Reviews';
import { useGlobalContext } from '@/context/GlobalProvider';

const tabs = [
    { name: "Job Specification", component: <JobSpecification /> },
    { name: "Job Progress", component: <Progress /> },
    { name: "Submissions", component: <Submissions /> },
    { name: "Customer Details", component: <Customer /> },
    { name: "Fundi Details", component: <FundiPage /> },
    { name: "Reviews", component: <Reviews /> }
];

interface BidClosedNavProps {
    activeTab: string;
    onTabClick: (tabName: string) => void;
}

function BidClosedNav({ activeTab, onTabClick }: BidClosedNavProps) {
    const { user } = useGlobalContext();
    return (
        <div className="border-b border-gray-400">
            <div className="flex justify-end space-x-6 px-4">
                {tabs
                    .filter(
                        (tab) =>
                            !(user?.user_type?.toLowerCase() === "fundi" && tab.name === "Fundi Details")
                    )
                    .map((tab) => (
                        <button
                            key={tab.name}
                            type="button"
                            onClick={() => onTabClick(tab.name)}
                            className={`py-2 font-medium text-sm md:text-base whitespace-nowrap focus:outline-none ${activeTab === tab.name
                                ? "text-blue-800 border-b-2 border-blue-800"
                                : "text-gray-600 hover:text-blue-800"
                                }`}
                        >
                            {tab.name}
                        </button>
                    ))}
            </div>
        </div>
    );
}

function PastJobsPageContainer() {
    // We still need the job ID to know which past job to display data for.
    const { id } = useParams<{ id: string }>();

    const { user } = useGlobalContext();

    const [activeTab, setActiveTab] = useState(tabs[0].name);

    // Example of where you would fetch data for this specific past job.
    useEffect(() => {
        if (id) {
            console.log(`Fetching all data for past job: ${id}`);
            // fetchPastJobData(id);
        }
    }, [id]);

    // 2. Determine which component to render based on the activeTab state.
    const activeComponent = tabs.find(tab => tab.name === activeTab)?.component;

    return (
        <>
            {user?.user_type.toLowerCase() == "fundi" && <DashboardHeader />}
            <section className="container mx-auto mt-8 px-4">
                <header className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Past Job Details for #{id}</h2>
                    {/* 3. Pass state and the update function to the navigation component. */}
                    <BidClosedNav
                        activeTab={activeTab}
                        onTabClick={setActiveTab}
                    />
                </header>

                <main className="mt-6">
                    {/* 4. Render the currently active component directly. */}
                    {activeComponent}
                </main>
            </section>
        </>
    );
}

export default PastJobsPageContainer;