/* eslint-disable */
//@ts-nocheck
import { useState, useEffect, useRef } from "react";
import { FiEdit } from "react-icons/fi";
import { toast } from "react-hot-toast";
import {
  updateProfilePhoneNumber,
  updateProfileEmail,
  requestPhoneUpdateOtp,
  requestEmailUpdateOtp,
  updateProfileImage
} from "@/api/provider.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { uploadFile } from "@/utils/fileUpload";
import { Loader2 } from "lucide-react";

const isValidPhone = (phone: string) => /^2547\d{8}$/.test(phone);
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Accept data prop
function AccountInfo({ data, refreshData }) {
  const fileInputRef = useRef(null);
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

  const [profile, setProfile] = useState(null);
  const [imageSrc, setImageSrc] = useState("/profile.jpg");

  // Edit states
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
  const [emailValid, setEmailValid] = useState(false);

  // OTP states
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpValue, setPhoneOtpValue] = useState("");
  const [emailOtpValue, setEmailOtpValue] = useState("");
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(false);
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);

  // Loading states
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  /* ---------- LOAD PROFILE FROM PROP ---------- */
  useEffect(() => {
    if (data) {
      // Map API Data to Profile Structure
      const mappedProfile = {
        name: data.organizationName || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.phone || "",
        userType: data.userType,
        type: data.accountType, // e.g., ORGANIZATION
        organizationName: data.organizationName || "",
        contactPerson: `${data.contactfirstName || ""} ${data.contactlastName || ""}`.trim(),
        avatar: data.userProfile?.profileImage || null
      };

      setProfile(mappedProfile);
      setPhoneValue(mappedProfile.phone);
      setEmailValue(mappedProfile.email);

      if (mappedProfile.avatar) {
        setImageSrc(mappedProfile.avatar);
      }
    }
  }, [data]);

  /* ---------- VALIDATION ---------- */
  useEffect(() => {
    setPhoneValid(isValidPhone(phoneValue));
  }, [phoneValue]);

  useEffect(() => {
    setEmailValid(isValidEmail(emailValue));
  }, [emailValue]);

  /* ---------- OTP HELPERS ---------- */
  const sendPhoneOtp = async () => {
    if (phoneValid && !isSendingPhoneOtp) {
      setIsSendingPhoneOtp(true);
      try {
        await requestPhoneUpdateOtp(axiosInstance, { phone: phoneValue });
        toast.success("OTP sent to new phone number");
        setPhoneOtpSent(true);
      } catch (error: any) {
        toast.error(error.message || "Failed to send phone OTP");
      } finally {
        setIsSendingPhoneOtp(false);
      }
    }
  };

  const sendEmailOtp = async () => {
    if (emailValid && !isSendingEmailOtp) {
      setIsSendingEmailOtp(true);
      try {
        await requestEmailUpdateOtp(axiosInstance, { email: emailValue });
        toast.success("OTP sent to new email");
        setEmailOtpSent(true);
      } catch (error: any) {
        toast.error(error.message || "Failed to send email OTP");
      } finally {
        setIsSendingEmailOtp(false);
      }
    }
  };

  const verifyPhoneOtp = async () => {
    if (phoneOtpValue.length === 6 && !isVerifyingPhoneOtp) {
      setIsVerifyingPhoneOtp(true);
      try {
        const success = await updateProfilePhoneNumber(axiosInstance, {
          phone: phoneValue,
          otp: phoneOtpValue
        });
        if (success) {
          toast.success("Phone verified and updated successfully");
          setPhoneOtpVerified(true);
          handlePhoneSave();
        }
      } catch (error: any) {
        toast.error(error.message || "Invalid phone OTP");
      } finally {
        setIsVerifyingPhoneOtp(false);
      }
    }
  };

  const verifyEmailOtp = async () => {
    if (emailOtpValue.length === 6 && !isVerifyingEmailOtp) {
      setIsVerifyingEmailOtp(true);
      try {
        const success = await updateProfileEmail(axiosInstance, {
          email: emailValue,
          otp: emailOtpValue
        });
        if (success) {
          toast.success("Email verified and updated successfully");
          setEmailOtpVerified(true);
          handleEmailSave();
        }
      } catch (error: any) {
        toast.error(error.message || "Invalid email OTP");
      } finally {
        setIsVerifyingEmailOtp(false);
      }
    }
  };

  /* ---------- HANDLERS ---------- */
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingImage(true);
      const loadingToast = toast.loading("Uploading profile image...");
      try {
        // 1. Upload to storage
        const uploaded = await uploadFile(file);
        // 2. Update profile
        await updateProfileImage(axiosInstance, uploaded.url);

        setImageSrc(uploaded.url);
        toast.success("Profile image updated!", { id: loadingToast });
        if (refreshData) refreshData();
      } catch (error: any) {
        toast.error(error.message || "Failed to upload image", { id: loadingToast });
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handlePhoneSave = () => {
    setProfile(prev => ({ ...prev, phone: phoneValue }));
    setIsEditingPhone(false);
    toast.success("Phone updated");
    if (refreshData) refreshData();
  };

  const handleEmailSave = () => {
    setProfile(prev => ({ ...prev, email: emailValue }));
    setIsEditingEmail(false);
    toast.success("Email updated");
    if (refreshData) refreshData();
  };

  if (!profile) return <div className="p-10">Loading info...</div>;

  const isOrg = profile.type === "ORGANIZATION" || profile.type === "organization";

  return (
    <section className="w-full max-w-4xl bg-white rounded-xl shadow-md p-8">
      <h1 className="text-3xl font-bold mb-6">Account Info</h1>

      {/* Avatar */}
      <div className="flex flex-col items-start mb-8">
        <div className="relative group">
          <img
            src={imageSrc}
            className={`w-24 h-24 rounded-full object-cover border ${isUploadingImage ? 'opacity-50' : ''}`}
            alt="Profile Avatar"
          />
          {isUploadingImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-4">
          <button
            disabled={isUploadingImage}
            onClick={() => fileInputRef.current.click()}
            className="text-blue-700 text-sm hover:text-blue-900 disabled:opacity-50"
          >
            {isUploadingImage ? "Uploading..." : "Change Photo"}
          </button>
        </div>
        <input type="file" hidden ref={fileInputRef} onChange={handleImageChange} accept="image/*" />
      </div>

      {/* Organization vs Individual Fields */}
      {isOrg ? (
        <>
          <Field label="Organization Name" value={profile.organizationName} />
          <Field label="Contact Person (Optional)" value={profile.contactPerson} />
        </>
      ) : (
        <>
          <Field label="First Name" value={profile.firstName} />
          <Field label="Last Name" value={profile.lastName} />
        </>
      )}

      {/* PHONE */}
      <EditableField
        label="Account Phone"
        value={phoneValue}
        editing={isEditingPhone}
        onEdit={() => {
          setIsEditingPhone(true);
          setPhoneOtpSent(false);
          setPhoneOtpValue("");
          setPhoneOtpVerified(false);
        }}
        onChange={setPhoneValue}
        onSave={handlePhoneSave}
        canSave={phoneOtpVerified}
        isValid={phoneValid}
        otpSent={phoneOtpSent}
        otpValue={phoneOtpValue}
        otpVerified={phoneOtpVerified}
        onSendOtp={sendPhoneOtp}
        onVerifyOtp={verifyPhoneOtp}
        onOtpChange={setPhoneOtpValue}
        isSendingOtp={isSendingPhoneOtp}
        isVerifyingOtp={isVerifyingPhoneOtp}
      />

      {/* EMAIL */}
      <EditableField
        label="Account Email"
        value={emailValue}
        editing={isEditingEmail}
        onEdit={() => {
          setIsEditingEmail(true);
          setEmailOtpSent(false);
          setEmailOtpValue("");
          setEmailOtpVerified(false);
        }}
        onChange={setEmailValue}
        onSave={handleEmailSave}
        canSave={emailOtpVerified}
        isValid={emailValid}
        otpSent={emailOtpSent}
        otpValue={emailOtpValue}
        otpVerified={emailOtpVerified}
        onSendOtp={sendEmailOtp}
        onVerifyOtp={verifyEmailOtp}
        onOtpChange={setEmailOtpValue}
        isSendingOtp={isSendingEmailOtp}
        isVerifyingOtp={isVerifyingEmailOtp}
      />
    </section>
  );
}

const Field = ({ label, value }) => (
  <div className="space-y-2 mb-4">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input value={value || ""} readOnly className="w-full px-4 py-2 border-b bg-transparent" />
  </div>
);

const EditableField = ({
  label, value, editing, onEdit, onChange, onSave,
  isValid, otpSent, otpValue, otpVerified, onSendOtp, onVerifyOtp, onOtpChange,
  isSendingOtp, isVerifyingOtp
}) => (
  <div className="space-y-2 mb-4">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="flex items-center border-b">
      <input
        value={value}
        readOnly={!editing}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 outline-none bg-transparent"
      />
      {!editing ? (
        <button onClick={onEdit}><FiEdit size={15} /></button>
      ) : (
        <div className="flex items-center gap-2">
          {!otpSent && isValid && (
            <button
              onClick={onSendOtp}
              disabled={isSendingOtp}
              className="text-blue-600 text-sm whitespace-nowrap disabled:opacity-50"
            >
              {isSendingOtp ? "Sending..." : "Send OTP"}
            </button>
          )}
          {otpSent && !otpVerified && otpValue.length === 6 && (
            <button
              onClick={onVerifyOtp}
              disabled={isVerifyingOtp}
              className="text-blue-600 text-sm whitespace-nowrap disabled:opacity-50"
            >
              {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
            </button>
          )}
          {otpVerified && (
            <button onClick={onSave} className="text-green-600 text-sm whitespace-nowrap">Save</button>
          )}
        </div>
      )}
    </div>
    {editing && otpSent && !otpVerified && (
      <div className="mt-2">
        <input
          type="text"
          value={otpValue}
          onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, ""))}
          maxLength={6}
          placeholder="Enter 6-digit OTP"
          className="w-full px-4 py-2 border rounded outline-none"
        />
      </div>
    )}
  </div>
);

export default AccountInfo;