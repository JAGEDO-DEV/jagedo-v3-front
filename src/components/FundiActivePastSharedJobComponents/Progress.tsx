/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Stepper, Step } from "react-form-stepper";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Loader } from "lucide-react";

import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { useGlobalContext } from "@/context/GlobalProvider";
import {
    getJobRequestById,
    updateStage,
    completeJob,
    approveJobCompletion
} from "@/api/jobRequests.api";
import { useNavigate } from "react-router-dom";

const TrackProgress = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isCompleting, setIsCompleting] = useState(false);
    const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
    const [confirming, setConfirming] = useState(false);

    const { user } = useGlobalContext();
    const stepsContent = [
        {
            title: "Mobilization",
            heading: "Job Mobilization",
            description: "Fundi has been assigned and is preparing to start.",
            iconColor: "text-gray-500",
            buttonText: "Start Job",
            tag: null
        },
        {
            title: "In Progress",
            heading: "Job In Progress",
            description: "The work is currently ongoing.",
            iconColor: "text-blue-500",
            buttonText: "Complete Job",
            tag: (
                <div className="mt-3 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                    Ongoing
                </div>
            )
        },
        {
            title: "Completed",
            heading: "Job Completed",
            description:
                "The job has been successfully completed and is pending review.",
            iconColor: "text-green-500",
            buttonText: null,
            tag: (
                <div className="mt-3 inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    ✅ Completed
                </div>
            )
        }
    ];

    useEffect(() => {
        const fetchInitialStatus = async () => {
            if (!id) {
                toast.error("Job ID not found.");
                setIsLoading(false);
                return;
            }
            try {
                const job = await getJobRequestById(axiosInstance, id);
                //@ts-ignore
                setCurrentStep(job.data.stage == "MOBILIZATION" ? 0 : job.data.stage == "INPROGRESS" && !job.data.completed ? 1 : 2);
            } catch (error) {
                toast.error("Could not fetch job status.");
                console.error("Error fetching job status:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialStatus();
    }, [id]);

    const handleButtonClick = async () => {
        if (!id) return toast.error("Job ID is missing.");
        setIsCompleting(true);
        try {
            if (currentStep === 0) {
                const newStage = "INPROGRESS";
                await updateStage(
                    axiosInstance,
                    id,
                    newStage
                );
                setCurrentStep(1);
                window.location.reload();
                toast.success("Job started!");
            } else if (currentStep === 1) {
                await completeJob(axiosInstance, id);
                setCurrentStep(2);
                window.location.reload();
                toast.success("Job marked as complete!");
            }
        } catch (error: any) {
            console.error("Error updating job stage:", error);
            toast.error(
                error.response?.data?.message || "An unexpected error occurred."
            );
        } finally {
            setIsCompleting(false);
        }
    };

    const handleConfirmCompletion = async () => {
        if (!id) return;
        try {
            setConfirming(true);
            await approveJobCompletion(axiosInstance, id);
            toast.success("Job Confirmed Complete")
            navigate("/dashboard/admin")
        } catch (err) {
            console.error("Error confirming job completion:", err);
            toast.error("Error Marking Job As Complete")
        } finally {
            setConfirming(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <Loader className="animate-spin h-10 w-10 text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold text-gray-800">
                        Job Progress Tracker
                    </h2>
                    <p className="text-gray-600 mt-2">
                        Monitor your job's milestones in real-time.
                    </p>
                </div>

                <div className="mb-12">
                    <Stepper activeStep={currentStep}>
                        {stepsContent.map((step) => (
                            <Step key={step.title} label={step.title} />
                        ))}
                    </Stepper>
                </div>

                {/* Current Step Details */}
                {user?.user_type.toLowerCase() !== "customer" && user?.user_type.toLowerCase() !== "admin" && (<div className="bg-gray-50 p-6 rounded-lg shadow-inner text-center">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                        {stepsContent[currentStep].heading}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {stepsContent[currentStep].description}
                    </p>
                    {stepsContent[currentStep].tag}
                </div>)}

                {/* Action Button Section */}
                {user.user_type.toLowerCase() !== "customer" &&
                    user.user_type.toLowerCase() !== "admin" && (
                        <div className="text-center mt-10">
                            {currentStep < stepsContent.length - 1 && (
                                <button
                                    onClick={handleButtonClick}
                                    disabled={isCompleting}
                                    className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center mx-auto gap-2"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    {isCompleting
                                        ? "Submitting..."
                                        : stepsContent[currentStep].buttonText}
                                </button>
                            )}
                        </div>
                    )}

                {user?.user_type?.toLowerCase() == "admin" && (
                    <div className="bg-gray-50 p-6 rounded-lg shadow-inner text-center">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                            {stepsContent[currentStep].heading}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {stepsContent[currentStep].description}
                        </p>
                        {stepsContent[currentStep].tag}

                        {/* Confirm button only for Completed step */}
                        {currentStep === 2 && (
                            <button
                                onClick={handleConfirmCompletion}
                                disabled={confirming}
                                className="mt-6 mx-2 px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 disabled:opacity-50"
                            >
                                {confirming ? "Confirming..." : "Confirm Job Completed"}
                            </button>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default TrackProgress;
