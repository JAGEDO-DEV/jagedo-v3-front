//@ts-nocheck
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Loader } from "lucide-react";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getJobRequestCustomerDataById } from "@/api/jobRequests.api";

interface CustomerData {
    profile: boolean;
    accountType: 'INDIVIDUAL' | 'ORGANIZATION';
    organizationName: string | null;
    contactfirstName: string | null;
    contactlastName: string | null;
    phoneNumber: string;
    email: string;
    firstName: string;
    lastName: string;
    userProfile: {
        profileImage?: string | null;
    };
}

export default function CustomerPage() {
    const { id } = useParams<{ id: string }>();
    const [customerData, setCustomerData] = useState<CustomerData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

    useEffect(() => {
        const fetchCustomerData = async () => {
            if (!id) {
                toast.error("Job ID not found in URL.");
                setIsLoading(false);
                return;
            }
            try {
                const response = await getJobRequestCustomerDataById(axiosInstance, id);
                if (response.success && response.data) {
                   setCustomerData(response.data);
                } else {
                    console.error("Failed to fetch customer data:", response.message);
                    toast.error(response.message || "Could not load customer details.");
                }
            } catch (error) {
                console.error("Error fetching customer data:", error);
                toast.error("An error occurred while fetching customer details.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCustomerData();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-white">
                <Loader className="animate-spin h-12 w-12 text-blue-600" />
            </div>
        );
    }
    
    if (!customerData) {
        return (
            <div className="flex justify-center items-center h-screen bg-white text-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-700">Customer Not Found</h2>
                    <p className="text-gray-500 mt-2">The details for this customer could not be loaded.</p>
                    <Link to="/dashboard" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const isOrganization = customerData.accountType === 'ORGANIZATION';
    const displayName = isOrganization 
        ? customerData.organizationName 
        : `${customerData.firstName} ${customerData.lastName}`;
    const contactPerson = `${customerData.contactfirstName || ''} ${customerData.contactlastName || ''}`.trim();

    return (
        <div className="flex h-screen bg-white">
            <div className="flex-1 p-10 overflow-y-auto">
                <div className="bg-white shadow-xl rounded-3xl p-10 flex flex-col items-center justify-center text-center max-w-xl mx-auto border border-gray-200">
                    
                    <img
                        src={customerData.userProfile?.profileImage || '/profile.jpg'}
                        alt="Customer Avatar"
                        className="w-60 h-60 rounded-full object-cover shadow-lg border-4 border-green-500 mb-6"
                    />

                    <h2 className="text-4xl font-bold text-gray-800 mb-2">
                        {displayName}
                    </h2>

                    <p className="text-2xl text-gray-600 capitalize">
                        {customerData.accountType.toLowerCase()}
                    </p>

                    {isOrganization && contactPerson && (
                        <p className="text-2xl text-gray-600 mb-6">
                           Contact: {contactPerson}
                        </p>
                    )}
                    
                    <div className="w-full space-y-4 text-left mt-6 pt-6 border-t border-gray-200">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-500">Phone</h3>
                            <p className="text-lg text-gray-800">{customerData.phoneNumber}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-500">Email</h3>
                            <p className="text-lg text-gray-800">{customerData.email}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}