/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
//@ts-nocheck
import { useState, useEffect } from "react";
import { AiOutlinePaperClip } from "react-icons/ai";
import { FaVideo, FaTrash, FaFileAlt } from "react-icons/fa";
import { addProviderNotes } from "@/api/orderRequests.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { uploadFile } from "@/utils/fileUpload";
import { toast } from "react-hot-toast";

interface FileObject {
  name: string;
  raw: File;
}

interface SubmissionsProps {
  orderData: {
    id: string | number;
    serviceProviderNotes?: string | null;
    serviceProviderAttachments?: string[] | null;
  };
  userType?: string;
}

const Submissions = ({ orderData, userType }: SubmissionsProps) => {
  const [serviceProviderNotes, setServiceProviderNotes] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [files, setFiles] = useState<FileObject[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

  useEffect(() => {
    const notesExist = !!orderData.serviceProviderNotes;
    const attachmentsExist = orderData.serviceProviderAttachments && orderData.serviceProviderAttachments.length > 0;

    if (notesExist && attachmentsExist) {
      setHasSubmitted(true);
      setServiceProviderNotes(orderData.serviceProviderNotes || "");
    }
  }, [orderData]);


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!fileName.trim()) {
      toast.error("Please enter a file name before uploading.");
      return;
    }
    if (!event.target.files) return;

    const uploadedFiles = Array.from(event.target.files);
    const newFiles = uploadedFiles.map((file) => ({
      name: fileName || file.name,
      raw: file,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    setFileName("");
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!serviceProviderNotes.trim() && files.length === 0) {
      toast.error("Please provide notes or at least one attachment.");
      return;
    }

    setIsSubmitting(true);
    try {
      const attachmentUrls: string[] = [];
      for (const fileObj of files) {
        if (fileObj.raw) {
          const uploadedFile = await uploadFile(fileObj.raw);
          attachmentUrls.push(uploadedFile.url);
        }
      }

      const payload = {
        serviceProviderNotes: serviceProviderNotes.trim(),
        attachments: attachmentUrls,
      };

      await addProviderNotes(axiosInstance, orderData.id, payload);

      toast.success("Submission successful!");
      // Re-check submission status after success, which will disable the form
      setHasSubmitted(true);
      window.location.reload();
    } catch (error: any) {
      console.error("Submission failed:", error);
      toast.error(error.message || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="hidden sm:block">
        <br />
        <br />
      </div>
      <div className="block sm:hidden pt-4"></div>

      <div className="min-h-screen bg-gray-100 py-3 sm:py-6 px-2 sm:px-4 flex justify-center">
        <div className="max-w-6xl w-full bg-white shadow-md rounded-md p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-700 px-1 sm:px-0">
              Attachments
            </h1>
            {hasSubmitted && <span className="text-sm font-medium bg-green-100 text-green-700 px-3 py-1 rounded-full">Already Submitted</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 border border-gray-200 p-3 sm:p-4 md:p-6 rounded-md">
            <div className="md:col-span-2 order-1 md:order-1">
              <label className="block text-sm font-medium text-gray-700 mb-2 sm:hidden">
                Order Description
              </label>
              <textarea
                className="w-full p-3 sm:p-4 border border-gray-300 rounded-md text-sm sm:text-base resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                rows={6}
                placeholder="Enter order description..."
                value={serviceProviderNotes}
                onChange={(e) => setServiceProviderNotes(e.target.value)}
                disabled={hasSubmitted}
              />
            </div>

            <div className="md:col-span-2 space-y-3 order-2 md:order-2">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 sm:hidden">
                  File Upload
                </label>
                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg p-2 sm:p-3">
                  <input
                    type="text"
                    placeholder="Enter file name"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-md outline-none bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 disabled:bg-gray-200"
                    disabled={hasSubmitted}
                  />
                  <div className="flex gap-2 justify-center xs:justify-start">
                    <label
                      className={`cursor-pointer p-2 rounded-md transition-colors ${!fileName.trim() || hasSubmitted ? "opacity-50 cursor-not-allowed bg-gray-200" : "bg-blue-50 hover:bg-blue-100"}`}
                      title={hasSubmitted ? "Already submitted" : !fileName.trim() ? "Enter a file name first" : "Upload file"}
                    >
                      <AiOutlinePaperClip className="text-xl sm:text-2xl text-gray-700" />
                      <input type="file" className="hidden" onChange={handleFileUpload} multiple disabled={!fileName.trim() || hasSubmitted} />
                    </label>
                    <label
                      className={`cursor-pointer p-2 rounded-md transition-colors ${!fileName.trim() || hasSubmitted ? "opacity-50 cursor-not-allowed bg-gray-200" : "bg-red-50 hover:bg-red-100"}`}
                      title={hasSubmitted ? "Already submitted" : !fileName.trim() ? "Enter a file name first" : "Upload video"}
                    >
                      <FaVideo className="text-lg sm:text-xl text-red-500" />
                      <input type="file" className="hidden" onChange={handleFileUpload} multiple accept="video/*" disabled={!fileName.trim() || hasSubmitted} />
                    </label>
                  </div>
                </div>
              </div>
              <div className="min-h-32 sm:min-h-40 bg-gray-50 p-3 sm:p-4 rounded-md border border-gray-200">
                {hasSubmitted ? (
                  orderData.serviceProviderAttachments && orderData.serviceProviderAttachments.length > 0 ? (
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        Submitted Files ({orderData.serviceProviderAttachments.length}):
                      </h3>
                      <ul className="space-y-2">
                        {orderData.serviceProviderAttachments.map((url, index) => (
                          <li key={index} className="flex justify-between items-center bg-white px-2 sm:px-3 py-2 rounded shadow-sm border border-gray-100">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm truncate pr-2 flex-1">
                              {url.split("/").pop()}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                      <FaFileAlt className="text-2xl sm:text-3xl mb-2 mx-auto" />
                      <p className="text-sm sm:text-base">No attachments were submitted.</p>
                    </div>
                  )
                ) : (
                  files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-24 sm:h-32 text-center text-gray-500">
                      <FaFileAlt className="text-2xl sm:text-3xl mb-2 mx-auto" />
                      <p className="text-sm sm:text-base">No files uploaded</p>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        Uploaded Files ({files.length}):
                      </h3>
                      <ul className="space-y-2">
                        {files.map((file, index) => (
                          <li key={index} className="flex justify-between items-center bg-white px-2 sm:px-3 py-2 rounded shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <span className="text-gray-800 text-xs sm:text-sm truncate pr-2 flex-1">
                              {file.name}
                            </span>
                            <button onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors flex-shrink-0" title="Remove file">
                              <FaTrash className="text-sm" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {(userType !== "CUSTOMER" && userType !== "ADMIN") && (
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || hasSubmitted}
                className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasSubmitted ? "Submitted" : isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Submissions;