/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
//@ts-nocheck
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getJobRequestById } from "@/api/jobRequests.api";
import { getAllProviders, assignJobToProviders } from "@/api/provider.api";
import { getOrderRequestsById, assignOrderToProviders } from "@/api/orderRequests.api";
import { toast } from "react-hot-toast";

const Register = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [entity, setEntity] = useState(null);
    const [entityType, setEntityType] = useState('');
    const [entityId, setEntityId] = useState('');
    const [filterCriteria, setFilterCriteria] = useState('');
    const [providers, setProviders] = useState([]);
    const [selectedRows, setSelectedRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [assigning, setAssigning] = useState(false);
    const [isAssigned, setIsAssigned] = useState(false);
    const [assignedProviders, setAssignedProviders] = useState([]);
    const [recalling, setRecalling] = useState(false);

    // Consolidated useEffect to handle all data fetching
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const jobId = searchParams.get("jobId");
        const orderId = searchParams.get("orderId");

        let currentEntityType = '';
        let currentEntityId = '';
        let currentFilter = '';

        if (jobId) {
            currentEntityType = 'job';
            currentEntityId = jobId;
            currentFilter = searchParams.get("skill") || "";
        } else if (orderId) {
            currentEntityType = 'order';
            currentEntityId = orderId;
            currentFilter = searchParams.get("type") || "";
        }

        // Set state for use in handlers
        setEntityType(currentEntityType);
        setEntityId(currentEntityId);
        setFilterCriteria(currentFilter);

        if (currentEntityType && currentEntityId) {
            const fetchData = async () => {
                setLoading(true);
                setError(null);
                try {
                    const entityPromise = currentEntityType === 'job'
                        ? getJobRequestById(axiosInstance, currentEntityId)
                        : getOrderRequestsById(axiosInstance, currentEntityId);

                    const providersPromise = getAllProviders(axiosInstance);

                    const [entityRes, providersRes] = await Promise.all([entityPromise, providersPromise]);

                    setEntity(entityRes.data);
                    setIsAssigned(entityRes.data.assignedServiceProviders?.length > 0);
                    setAssignedProviders(entityRes.data.assignedServiceProviders || []);
                    setProviders(providersRes.hashSet.filter((provider) => provider.adminApproved));
                } catch (err) {
                    console.log("Error: ", err)
                    setError(`Failed to fetch ${currentEntityType} or providers.`);
                    toast.error("Failed to fetch data. Please try again.");
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        } else {
            // Handle case where no ID is found in URL
            setError("No Job ID or Order ID was provided.");
            setLoading(false);
        }
    }, [location.search]);

    const handleCheckboxChange = (id) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]
        );
    };

    const handleAssign = async ({ procurementMethod, providerIds }) => {
        if (providerIds.length === 0) {
            toast.error("Please select at least one service provider.");
            return;
        }

        setAssigning(true);

        try {
            const payload = {
                procurementMethod,
                providerIds: providerIds,  // <-- ARRAY is passed correctly
            };

            if (entityType === 'job') {
                await assignJobToProviders(axiosInstance, entityId, payload);
            } else {
                await assignOrderToProviders(axiosInstance, entityId, payload);
            }

            setIsAssigned(true);
            toast.success("Providers assigned successfully!");

            setTimeout(() => {
                const navigateUrl =
                    entityType === 'job'
                        ? "/dashboard/admin/jobs"
                        : "/dashboard/admin/orders";

                navigate(navigateUrl);
            }, 1500);

        } catch (err) {
            toast.error("Assignment failed. Please try again.");
        } finally {
            setAssigning(false);
        }
    };

    const handleRecall = async () => {
        setRecalling(true);
        setError(null);
        try {
            const recallUrl = entityType === 'job'
                ? `/api/job-requests/${entityId}/recall`
                : `/api/order-requests/${entityId}/recall`;

            await axiosInstance.post(recallUrl);
            toast.success("Recall successful!");

            const entityRes = entityType === 'job'
                ? await getJobRequestById(axiosInstance, entityId)
                : await getOrderRequestsById(axiosInstance, entityId);

            setEntity(entityRes.data);
            setIsAssigned(entityRes.data.assignedServiceProviders?.length > 0);
            setAssignedProviders(entityRes.data.assignedServiceProviders || []);
            setSelectedRows([]);
        } catch (err) {
            setError(`Failed to recall ${entityType} assignment.`);
            toast.error(`Recall failed. Please try again.`);
        } finally {
            setRecalling(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-10 h-screen">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-400 border-t-transparent" />
                <p className="mt-3 text-gray-600">Loading...</p>
            </div>
        );
    }
    if (error) return <div className="p-10 text-center text-red-600 font-semibold">{error}</div>;

    const searchParams = new URLSearchParams(location.search);
    const method = searchParams.get("method") || "restricted";

    return (
        <div className="flex h-screen bg-white">
            <div className="flex-1 flex flex-col transition-all duration-300 relative p-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-700 capitalize">{entityType} Register</h2>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                        {method.toUpperCase()} MODE
                    </span>
                </div>
                <div className="bg-white rounded-md shadow-sm p-4 overflow-x-auto mt-6">
                    <h3 className="text-xl font-bold mb-4">
                        {isAssigned ? "Assigned Service Providers" : "Assign Service Providers"}
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 bg-white">
                            <thead className="bg-gray-50">
                                <tr>
                                    {!isAssigned && (
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                                    )}
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill/Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">County</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(() => {
                                    const filteredProviders = providers.filter(p => {
                                        if (!filterCriteria) return true;
                                        const lowerFilter = filterCriteria.toLowerCase();

                                        if (entityType === 'order') {
                                            return p.userType?.toLowerCase() === lowerFilter;
                                        }

                                        if (entityType === 'job') {
                                            return (
                                                (p.skills && p.skills.toLowerCase().includes(lowerFilter)) ||
                                                (p.profession && p.profession.toLowerCase().includes(lowerFilter)) ||
                                                (p.contractorTypes && p.contractorTypes.toLowerCase().includes(lowerFilter))
                                            );
                                        }

                                        return false;
                                    });

                                    const dataToShow = isAssigned ? assignedProviders : filteredProviders;

                                    if (dataToShow.length === 0) {
                                        return (
                                            <tr>
                                                <td colSpan={isAssigned ? 7 : 8} className="px-6 py-4 text-center text-sm text-gray-500">
                                                    No providers found
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return dataToShow.map((provider) => (
                                        <tr key={provider.id} className={isAssigned ? "bg-gray-100" : "hover:bg-gray-50"}>
                                            {!isAssigned && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedRows.includes(provider.id)}
                                                        onChange={() => handleCheckboxChange(provider.id)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{provider.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{provider.skills || provider.profession || provider.contractorTypes}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{provider.firstName || provider?.contactfirstName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{provider.lastName || provider?.contactlastName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{provider.phoneNumber}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{provider.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{provider.county}</td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end mt-6">
                        {!isAssigned ? (
                            <button
                                type="button"
                                onClick={() => handleAssign({ procurementMethod: method, providerIds: selectedRows })}
                                className="bg-[rgb(0,0,122)] hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition"
                                disabled={assigning || selectedRows.length === 0}
                            >
                                {assigning ? "Assigning..." : `Assign to ${entityType}`}
                            </button>
                        ) : (
                            <div className="w-full flex justify-center">
                                <button
                                    type="button"
                                    onClick={handleRecall}
                                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition"
                                    disabled={recalling || entity?.status?.toLowerCase().includes("complete")}
                                >
                                    {recalling ? "Recalling..." : `Recall from ${entityType}`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;