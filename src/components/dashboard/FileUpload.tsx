/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import type React from "react";
import { toast } from "react-hot-toast";
import { AiOutlinePaperClip } from "react-icons/ai";
import { uploadFile, validateFile, type UploadedFile } from "@/utils/fileUpload"; // Make sure this path is correct
import { uploadFileAlternative } from "@/utils/s3Upload";
type FileUploaderProps = {
  onFileUpload: (file: UploadedFile) => void;
};

const FileUploader = ({ onFileUpload }: FileUploaderProps) => {
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!fileName.trim()) {
      toast.error("Please enter a file name before uploading.");
      return;
    }
    if (!event.target.files || event.target.files.length === 0) return;

    setIsUploading(true);
    const uploadedFile = event.target.files[0];
    const validation = validateFile(uploadedFile);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file type or size.");
      setIsUploading(false);
      return;
    }

    try {
      // const uploaded = await uploadFileAlternative(uploadedFile, fileName);
      const uploaded = await uploadFile(uploadedFile);
      
      /*
        UploadedFile {
            id: string;
            originalName: string;
            displayName: string;
            url: string;
            type: string;
            size: number;
            uploadedAt: Date;
        }
      */
      const finalFile: UploadedFile = {
        ...uploaded,
        displayName: fileName || uploaded.displayName,
      };

      onFileUpload(finalFile);
      setFileName("");

    } catch (err: any) {
      toast.error(err.message || "Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center border border-gray-300 rounded-lg px-2 py-2 bg-gray-100 gap-2">
        <input
          type="text"
          placeholder="Enter file name..."
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="w-full sm:flex-1 px-2 py-1 border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-blue-300 bg-white"
          disabled={isUploading}
        />

        <div className="flex flex-row sm:flex-row gap-3 sm:gap-2 justify-start sm:justify-end">
          <label
            className={`cursor-pointer flex items-center ${!fileName.trim() || isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
            title={!fileName.trim() ? "Enter a file name first" : "Upload file"}
          >
            <AiOutlinePaperClip className="text-gray-700 text-2xl" />
            <input
              type="file"
              className="hidden"
              onChange={handleFileChange}
              disabled={!fileName.trim() || isUploading}
            />
          </label>
        </div>
      </div>

      {isUploading && <p className="text-sm text-blue-600 mt-2 animate-pulse">Uploading, please wait...</p>}
    </div>
  );
};

export default FileUploader;