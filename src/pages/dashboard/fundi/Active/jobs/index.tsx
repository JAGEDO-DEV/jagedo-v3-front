/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
//@ts-nocheck
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaComments, FaTimes } from "react-icons/fa";

// --- Component Imports ---
import Customer from '@/components/FundiActivePastSharedJobComponents/Customer';
import FundiPage from '@/components/FundiActivePastSharedJobComponents/Fundi';
import JobSpecification from '@/components/FundiActivePastSharedJobComponents/Job_Specification';
import Progress from '@/components/FundiActivePastSharedJobComponents/Progress';
import Submissions from '@/components/FundiActivePastSharedJobComponents/Submissions';
import { DashboardHeader } from '@/components/DashboardHeader';
import { getJobRequestById } from '@/api/jobRequests.api';
import useAxiosWithAuth from '@/utils/axiosInterceptor';
import { useGlobalContext } from '@/context/GlobalProvider';
import { EmbeddedChat } from '@embeddedchat/react';
import { jwtDecode } from 'jwt-decode';

// --- Tab Configuration ---
const tabs = [
    { name: "Job Specification", component: <JobSpecification /> },
    { name: "Progress", component: <Progress /> },
    { name: "Submissions", component: <Submissions /> },
    { name: "Customer Details", component: <Customer /> },
    { name: "Fundi Details", component: <FundiPage /> }
];

// --- Navigation Component (Controlled) ---
interface ActiveAwardedNavProps {
    activeTab: string;
    onTabClick: (tabName: string) => void;
}


const ChatWrapper = ({ roomId }) => {
    const token = localStorage.getItem('token')
    const decodedToken = jwtDecode(token)
    const authConfig = {
        flow: 'TOKEN',
        credentials: {
            resume: decodedToken.rocketAuthToken,
        },
        secure: true
    };
    return (
        <EmbeddedChat
            host="https://uatchat.jagedo.co.ke"
            roomId={"690a06f7c892d9187f681f4e"}
            auth={authConfig}
            secure={false} 
        />
    );
}


function ActiveAwardedNav({ activeTab, onTabClick }: ActiveAwardedNavProps) {


    const { user } = useGlobalContext();
    return (
        <div className="flex space-x-6 overflow-x-auto flex-nowrap">
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
    );
}

function ActiveJobPageContainer() {
    const { id } = useParams<{ id: string }>();
    const { user } = useGlobalContext();
    const navigate = useNavigate();
    const jobId = id;
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [activeTab, setActiveTab] = useState(tabs[0].name);
    const [jobData, setJobData] = useState<any>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const handleBack = () => {
        navigate(-1);
    };

    const fetchJobData = async () => {
        const jobData = await getJobRequestById(axiosInstance, jobId);
        setJobData(jobData.data);
    }

    useEffect(() => {
        if (jobId) {
            fetchJobData();
        }
    }, [jobId]);

    const activeComponent = tabs.find(tab => tab.name === activeTab)?.component;

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    const token = localStorage.getItem('token')
    console.log(token)
    const decodedToken = jwtDecode(token)
    console.log(decodedToken)
    const authConfig = {
        flow: 'TOKEN',
        credentials: {
            // serviceName: 'rocket-chat',
            accessToken: decodedToken.rocketAuthToken,
        },
        secure: true
    };

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
                        />
                    </div>
                </header>

                <main className="mt-6">
                    {activeComponent}
                </main>
            </section>

            {/* Floating Chat Button */}
            {jobData?.groupChatId && (
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
                        <div className="fixed bottom-20 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden">
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
                                <ChatWrapper
                                    jobGroupId={jobData?.groupChatId}
                                // authConfig={authConfig}
                                // userName={user?.userName}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
}

export default ActiveJobPageContainer;