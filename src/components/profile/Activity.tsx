/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { getSalesActivities } from '@/api/sales.api'
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { useGlobalContext } from "@/context/GlobalProvider";

// Accept data as profileData from parent
const Activity = ({ data: profileData }) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [requestData, setRequestData] = useState(null);
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const { user } = useGlobalContext();
    const user_type = user?.user_type?.toLowerCase();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getSalesActivities(axiosInstance)
                if (response.success) {
                    setData(response.data)
                }
            } catch (error) {
                console.error('Error fetching sales activities:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    useEffect(() => {
        if (data) {
            switch (user_type) {
                case 'fundi':
                    setRequestData({
                        title: 'Fundi Requests',
                        value: data.fundiRequests || 0
                    });
                    break;
                case 'professional':
                    setRequestData({
                        title: 'Professional Requests',
                        value: data.professionalRequests || 0
                    });
                    break;
                case 'contractor':
                    setRequestData({
                        title: 'Contractor Requests',
                        value: data.contractorRequests || 0
                    });
                    break;
                default:
                    setRequestData([
                        { title: 'Fundi Requests', value: data.fundiRequests || 0 },
                        { title: 'Professional Requests', value: data.professionalRequests || 0 },
                        { title: 'Contractor Requests', value: data.contractorRequests || 0 }
                    ]);
            }
        }
    }, [data, user_type]);

    if (loading && !profileData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">Loading activity...</div>
            </div>
        )
    }

    // Use createdAt from profileData if available
    const activeDuration = profileData?.userProfile?.createdAt
        ? calculateDuration(profileData.userProfile.createdAt)
        : (data?.date ? calculateDuration(data.date) : '1y 2m 18d');

    return (
        <div className="max-w-4xl mx-auto p-8">
            {/* Requests & Orders Section */}
            <div className="mb-12">
                <h2 className="text-2xl font-semibold text-gray-700 text-center mb-6">
                    Requests & Orders
                </h2>
                <div className="flex justify-center gap-4 flex-wrap">
                    {requestData && (
                        <>
                            {Array.isArray(requestData) ? (
                                requestData.map((req, index) => (
                                    <StatCard
                                        key={index}
                                        title={req.title}
                                        value={req.value}
                                        bgColor="bg-green-50"
                                        textColor="text-green-600"
                                    />
                                ))
                            ) : (
                                <StatCard
                                    title={requestData.title}
                                    value={requestData.value}
                                    bgColor="bg-green-50"
                                    textColor="text-green-600"
                                />
                            )}
                        </>
                    )}
                    <StatCard
                        title="Custom Products"
                        value={data?.customOrders || 0}
                        bgColor="bg-pink-50"
                        textColor="text-pink-600"
                    />
                </div>
            </div>

            {/* Job Status Section */}
            <div className="mb-12">
                <h2 className="text-2xl font-semibold text-gray-700 text-center mb-6">
                    Job Status
                </h2>
                <div className="flex justify-center gap-4">
                    <StatCard
                        title="New Jobs"
                        value={data?.newJobs || 0}
                        bgColor="bg-green-50"
                        textColor="text-green-600"
                    />
                    <StatCard
                        title="Drafts"
                        value={data?.draftJobs || 0}
                        bgColor="bg-yellow-50"
                        textColor="text-yellow-600"
                    />
                    <StatCard
                        title="Completed Jobs"
                        value={data?.completeJobs || 0}
                        bgColor="bg-purple-50"
                        textColor="text-purple-600"
                    />
                </div>
            </div>

            {/* Active Duration Section */}
            <div className="flex justify-center">
                <div className="bg-white rounded-lg shadow-md p-8 w-96 text-center">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">
                        Active Duration
                    </h3>
                    <div className="text-3xl font-bold text-gray-800">
                        {activeDuration}
                    </div>
                </div>
            </div>
        </div>
    )
}

const StatCard = ({ title, value, bgColor, textColor }) => {
    return (
        <div className={`${bgColor} rounded-lg shadow-md p-6 w-40 text-center hover:scale-105 hover:shadow-lg transition-transform transition-shadow duration-200`}>
            <div className="text-sm text-gray-600 mb-2">{title}</div>
            <div className={`text-4xl font-bold ${textColor}`}>{value}</div>
        </div>
    )
}

const calculateDuration = (dateString) => {
    const startDate = new Date(dateString)
    const now = new Date()

    const diffTime = Math.abs(now - startDate)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    const years = Math.floor(diffDays / 365)
    const months = Math.floor((diffDays % 365) / 30)
    const days = Math.floor((diffDays % 365) % 30)

    return `${years}y ${months}m ${days}d`
}

export default Activity;