import { useAxiosWithAuth } from "@/hooks/useAxiosWithAuth";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";

const getInitialMarketing = (userData: any) => {
  return {
    howDidYouHearAboutUs: userData?.referenceInfo || "",
    referralDetail: userData?.referralDetail || "",
    socialMediaOther: userData?.socialMediaOther || "",
    interestedServices: userData?.interestedServices || [],
    otherService: userData?.otherService || "",
  };
};

const SOCIAL_PLATFORMS = ["Facebook", "Instagram", "TikTok", "Twitter", "YouTube", "WhatsApp", "Telegram", "Other"];
const SERVICE_OPTIONS = ["Fundi", "Professional", "Contractor", "Hardware", "Other"];
const HEAR_ABOUT_OPTIONS = [
  { value: "SEARCH_ENGINE", label: "Search Engine (Google, Bing)" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "WORD_OF_MOUTH", label: "Word of Mouth" },
  { value: "ADVERTISEMENT", label: "Advertisement" },
  { value: "DIRECT_REFERRAL", label: "Direct Referral" },
  { value: "OTHER", label: "Other" },
];

const Marketing = ({ userData, onUpdate }) => {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [marketing, setMarketing] = useState(getInitialMarketing(userData));

  useEffect(() => {
    setMarketing(getInitialMarketing(userData));
  }, [userData]);

  return (
    <div className="bg-white flex">
      <Toaster position="top-center" richColors />
      <div className="w-full max-w-3xl items-center p-6">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6 border-b pb-3">
            <h1 className="text-2xl font-bold">Marketing</h1>
          </div>

          <form className="space-y-6">
            {/* How did you hear about us */}
            {marketing.howDidYouHearAboutUs && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  How did you hear about us?
                </label>
                <p className="px-4 py-2 text-gray-700">
                  {HEAR_ABOUT_OPTIONS.find((opt) => opt.value === marketing.howDidYouHearAboutUs)?.label || marketing.howDidYouHearAboutUs}
                </p>
              </div>
            )}

            {/* Referral Detail - conditional */}
            {marketing.referralDetail && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {marketing.howDidYouHearAboutUs === "SOCIAL_MEDIA"
                    ? "Social Media Platform"
                    : marketing.howDidYouHearAboutUs === "DIRECT_REFERRAL"
                      ? "Referred By"
                      : "Details"}
                </label>
                <p className="px-4 py-2 text-gray-700">{marketing.referralDetail}</p>
              </div>
            )}

            {/* Social Media Other */}
            {marketing.socialMediaOther && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Social Media Platform (Other)
                </label>
                <p className="px-4 py-2 text-gray-700">{marketing.socialMediaOther}</p>
              </div>
            )}

            {/* What services interested in */}
            {marketing.interestedServices && marketing.interestedServices.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  What services are you interested in?
                </label>
                <p className="px-4 py-2 text-gray-700">{marketing.interestedServices[0] || "Not provided"}</p>
              </div>
            )}

            {/* Other Service */}
            {marketing.otherService && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Service (Other)
                </label>
                <p className="px-4 py-2 text-gray-700">{marketing.otherService}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Marketing;
