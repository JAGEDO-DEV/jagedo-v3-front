/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Loader } from "lucide-react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import { TiTick } from "react-icons/ti";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { getJobRequestById } from "@/api/jobRequests.api";

// Simplified interface for the job data object itself
interface JobSpecification {
  id: number; // Added for API calls
  jobId: string;
  jobType: string;
  skill: string;
  description: string;
  location: string;
  startDate: string;
  endDate?: string | null;
  createdAt?: string | null;
  managedBy: string;
  level?: string;
  attachments: string[];
  adminAttachments?: string[];
  adminNotes?: string;
  receiptUrl?: string;
}

const getFileNameFromUrl = (url: string) => {
  if (!url) return "attachment";
  try {
    return decodeURIComponent(
      new URL(url).pathname.split("/").pop() || "attachment"
    );
  } catch (e) {
    console.error("Error parsing URL:", e);
    // Fallback for relative paths or invalid URLs
    return url.split("/").pop() || "attachment";
  }
};

export const JobSpecificationPage = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobSpecification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const user = localStorage?.getItem("user") ? JSON.parse(localStorage.getItem("user") || "") : null;

  useEffect(() => {
    const fetchJobRequest = async () => {
      if (!id) {
        toast.error("Job ID not found in URL.");
        setIsLoading(false);
        return;
      }
      try {
        const response = await getJobRequestById(axiosInstance, id);
        if (response.success) {
          setJob(response.data);
        } else {
          console.error(
            "Failed to fetch job request:",
            response.message
          );
          toast.error(
            response.message || "Could not load job details."
          );
        }
      } catch (error) {
        console.error("Error fetching job request:", error);
        toast.error("An error occurred while fetching job details.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobRequest();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="animate-spin h-10 w-10 text-[rgb(0,0,122)]" />
      </div>
    );
  }

  if (!job) {
    return (
      <section className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-700">
          Job Not Found
        </h1>
        <p className="text-gray-500 mt-2">
          The job you are looking for does not exist or could not be
          loaded.
        </p>
        <Link
          to="/dashboard"
          className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Dashboard
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg relative border border-gray-200 my-10 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">
          REQ {job.jobId}
        </h1>
        <h2 className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm">
          Created:{" "}
          {new Date(
            job.createdAt || job.startDate
          ).toLocaleDateString('en-GB')}
        </h2>
      </div>

      {/* Job Detail Section */}
      <div className="p-8 rounded-xl shadow-lg bg-white border border-gray-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Job Details
        </h2>
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="md:w-1/2 space-y-4">
            {[
              { label: "Skill", value: job.skill },
              { label: "Level", value: job.assignedServiceProvider.grade || job.assignedServiceProvider.level || "N/A" },
              { label: "Location", value: job.location },
              {
                label: "Start Date",
                value: new Date(
                  job.startDate
                ).toLocaleDateString('en-GB')
              },
              {
                label: "End Date",
                value: job.endDate
                  ? new Date(job.endDate).toLocaleDateString('en-GB')
                  : "N/A"
              }
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200"
              >
                <span className="font-semibold text-gray-800 w-28 text-sm">
                  {item.label}:
                </span>
                <span className="text-gray-700 text-sm">
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <div className="md:w-1/2 md:pl-8 md:border-l border-gray-200 space-y-4">
            {job.payments.length > 0 && (<a
              href="#"
              className={`flex items-center space-x-2 p-4 rounded-lg border transition-colors bg-green-50 border-green-200 text-green-700 hover:bg-green-100`}
              onClick={() => navigate(`/receipts/${job.payments[job.payments.length - 1].id}`)}
            >
              <ArrowDownTrayIcon className="h-6 w-6" />
              <span className="font-medium">
                Download Receipt
              </span>
            </a>)}
            <div className="bg-blue-50 p-4 rounded-2xl shadow-md border border-blue-200">
              <h3 className="text-xl font-bold text-blue-900">
                Managed by {job.managedBy}
              </h3>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl shadow-md mt-4 border border-blue-200">
              <h3 className="text-xl font-bold text-blue-900 mb-2">
                Package details
              </h3>
              {(() => {
                if (!job) return null;

                // Helper to check if managed by Jagedo or self
                const isManagedByJagedo =
                  job.managedBy?.toLowerCase().includes("jagedo");

                // FUNDI
                if (job.jobType === "FUNDI") {
                  if (isManagedByJagedo) {
                    return (
                      <>
                        <p className="text-lg font-semibold text-gray-800">
                          Jagedo Oversees
                        </p>
                        <ul className="space-y-3 mt-4 text-gray-700">
                          {[
                            "Arrival time",
                            "Scope budget",
                            "Workmanship for a day"
                          ].map((text, idx) => (
                            <li key={idx} className="flex items-center">
                              <TiTick className="text-green-300 mr-2 text-xl" />
                              {text}
                            </li>
                          ))}
                        </ul>
                      </>
                    );
                  } else {
                    return (
                      <ul className="space-y-3 mt-4 text-gray-700">
                        <li className="flex items-center">
                          <TiTick className="text-green-500 mr-2 text-xl" />
                          Arrival time
                        </li>
                        <li className="flex items-center">
                          <TiTick className="text-green-500 mr-2 text-xl" />
                          1 day payment
                        </li>
                        <p className="text-lg text-left font-bold">Client manages</p>
                        <li className="flex items-center">
                          <TiTick className="text-green-500 mr-2 text-xl" />
                          Workmanship for a day
                        </li>
                      </ul>
                    );
                  }
                }

                // PROFESSIONAL
                if (job.jobType === "PROFESSIONAL") {
                  if (isManagedByJagedo) {
                    return (
                      <>
                        <ul className="space-y-3 mt-4 text-gray-700">
                          <li className="flex items-center">
                            <TiTick className="text-green-300 mr-2 text-xl" />
                            Time: Duration of Execution
                          </li>
                          <li className="flex items-center">
                            <TiTick className="text-green-300 mr-2 text-xl" />
                            Scope of budget: Determined through Competitive bidding
                          </li>
                          <li className="flex items-center">
                            <TiTick className="text-green-300 mr-2 text-xl" />
                            Quality: Professionalism and peer reviewing
                          </li>
                        </ul>
                      </>
                    );
                  } else {
                    return (
                      <ul className="space-y-3 mt-4 text-gray-700">
                        <li className="flex items-center">
                          <TiTick className="text-green-500 mr-2 text-xl" />
                          Scope budget: Determined through Competitive bidding.
                        </li>
                        <p className="text-lg text-left font-bold">Client manages</p>
                        <li className="flex items-center">
                          <TiTick className="text-green-500 mr-2 text-xl" />
                          Time: Duration of Execution.
                        </li>
                        <li className="flex items-center">
                          <TiTick className="text-green-500 mr-2 text-xl" />
                          Quality: Professionalism and peer review.
                        </li>
                      </ul>
                    );
                  }
                }

                // CONTRACTOR
                if (job.jobType === "CONTRACTOR") {
                  if (isManagedByJagedo) {
                    return (
                      <ul className="space-y-3 mt-4 text-gray-700">
                        <li className="flex items-center">
                          <TiTick className="text-green-300 mr-2 text-xl" />
                          Time: Duration of Execution
                        </li>
                        <li className="flex items-center">
                          <TiTick className="text-green-300 mr-2 text-xl" />
                          Scope of Budget: Determined through competitive bidding.
                        </li>
                        <li className="flex items-center">
                          <TiTick className="text-green-300 mr-2 text-xl" />
                          Quality :Workmanship and site supervisions.
                        </li>
                      </ul>
                    );
                  } else {
                    return (
                      <ul className="space-y-3 mt-4 text-gray-700">
                        <li className="flex items-center">
                          <TiTick className="text-green-500 mr-2 text-xl" />
                          Scope of Budget: Determined through Competitve Bidding
                        </li>
                        <p className="text-lg text-left font-bold">Client manages</p>
                        <li className="flex items-center">
                          <TiTick className="text-green-500 mr-2 text-xl" />
                          Time: Duration of Execution
                        </li>
                        <li className="flex items-center">
                          <TiTick className="text-green-500 mr-2 text-xl" />
                          Quality :Workmanship and site supervisions.
                        </li>
                      </ul>
                    );
                  }
                }

                // Default fallback
                return null;
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Job Description and Files */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 shadow-lg rounded-xl border border-gray-200">
        <div className="md:border-r border-gray-200 md:pr-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Description
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {job.description || "No description provided."}
          </p>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Attachments
          </h2>
          {job.attachments?.length > 0 ? (
            <table className="w-full border-collapse rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                    File Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {job.attachments.map((url, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-all duration-200"
                  >
                    <td className="px-6 py-4 border-t border-gray-200 break-all">
                      {getFileNameFromUrl(url)}
                    </td>
                    <td className="px-6 py-4 border-t border-gray-200">
                      <a
                        href={url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-900 hover:text-blue-700 flex items-center gap-2 transition-colors"
                      >
                        <ArrowDownTrayIcon className="w-5 h-5" />{" "}
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 mt-2">
              No attachments provided.
            </p>
          )}
        </div>
      </div>

      {/* Admin Notes */}
      {job.adminNotes ||
        (job.adminAttachments && job.adminAttachments.length > 0) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 shadow-lg rounded-xl border border-gray-200">
          <div className="md:pr-6 md:border-r border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Admin Notes
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {job.adminNotes || "No admin notes provided."}
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Admin Attachments
            </h2>
            {job.adminAttachments &&
              job.adminAttachments.length > 0 ? (
              <table className="w-full border-collapse rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                      File Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {job.adminAttachments.map((url, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-all duration-200"
                    >
                      <td className="px-6 py-4 border-t border-gray-200 break-all">
                        {getFileNameFromUrl(url)}
                      </td>
                      <td className="px-6 py-4 border-t border-gray-200">
                        <a
                          href={url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-900 hover:text-blue-700 flex items-center gap-2 transition-colors"
                        >
                          <ArrowDownTrayIcon className="w-5 h-5" />{" "}
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 mt-2">
                No admin attachments provided.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {/* Payment Breakdown Section */}
      {user?.user_type !== "CUSTOMER" && (<div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Payment Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div>
            <dl>
              <div className="flex justify-between py-2">
                <dt className="text-gray-600">Jagedo Fee</dt>
                <dd className="font-medium text-gray-900">
                  {typeof job?.assignedBid?.jagedoCommission === "number"
                    ? `KES ${job?.assignedBid?.jagedoCommission.toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2 }
                    )}`
                    : job?.basePrice - job?.serviceProviderPaid}
                </dd>
              </div>
              <div className="flex justify-between py-2 border-t">
                <dt className="text-gray-600">Total Earnings</dt>
                <dd className="font-medium text-gray-900">
                  {typeof job?.assignedBid?.payableToServiceProvider === "number"
                    ? `KES ${job?.assignedBid?.payableToServiceProvider.toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2 }
                    )}`
                    : job?.serviceProviderPaid}
                </dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          <span>
            <span className="font-semibold">Note:</span> Payment
            details are subject to change based on admin review and
            agreement.
          </span>
        </div>
      </div>)}
    </section>
  );
};

export default JobSpecificationPage;
