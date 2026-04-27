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
  updateProfileImage,
  updateProfileName
} from "@/api/provider.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";
import { uploadFile } from "@/utils/fileUpload";
import { Loader2, Shield, Clock, Check, X } from "lucide-react";
import { FiCheck, FiX } from "react-icons/fi";

const isValidPhone = (phone: string) => /^(?:254|0|7|1)\d{8,11}$/.test(phone.replace(/[\s+]/g, ''));
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);


function AccountInfo({ data, refreshData }) {
  const fileInputRef = useRef(null);
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);

  const [profile, setProfile] = useState(null);
  const [imageSrc, setImageSrc] = useState("/profile.jpg");

  
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [firstNameValue, setFirstNameValue] = useState("");
  const [lastNameValue, setLastNameValue] = useState("");
  const [orgNameValue, setOrgNameValue] = useState("");
  const [contactNameValue, setContactNameValue] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
  const [emailValid, setEmailValid] = useState(false);

  
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpMethod, setOtpMethod] = useState<"email" | "phone" | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const isOrgData = data?.accountType?.toLowerCase() === "organization" || 
                    data?.accountType?.toLowerCase() === "business" || 
                    data?.userType === "CONTRACTOR" || 
                    data?.userType === "HARDWARE";

  const showsContactName = data?.userType === "CUSTOMER" || 
                           data?.userType === "CONTRACTOR" || 
                           data?.userType === "HARDWARE";

  const isComplete = isOrgData 
    ? showsContactName
      ? !!(data?.organizationName?.trim() && data?.contactFullName?.trim() && data?.phone?.trim() && data?.email?.trim())
      : !!(data?.organizationName?.trim() && data?.phone?.trim() && data?.email?.trim())
    : !!(data?.firstName?.trim() && data?.lastName?.trim() && data?.phone?.trim() && data?.email?.trim());

  const isReadOnly = data?.status === "VERIFIED" || data?.status === "SUSPENDED" || data?.status === "BLACKLISTED" || isComplete;

  /* ---------- LOAD PROFILE FROM PROP ---------- */
  useEffect(() => {
    if (data) {
      
      const isOrgData = data?.accountType?.toLowerCase() === "organization" || 
                        data?.accountType?.toLowerCase() === "business" || 
                        data?.userType === "CONTRACTOR" || 
                        data?.userType === "HARDWARE";

      const mappedProfile = {
        name: isOrgData ? (data.organizationName || "") : `${data.firstName || ""} ${data.lastName || ""}`.trim(),
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.phone || "",
        userType: data.userType,
        type: data.accountType, 
        organizationName: data.organizationName || "",
        contactFullName: data.contactFullName || "",
        avatar: data.profileImage || null
      };

      setProfile(mappedProfile);
      setPhoneValue(mappedProfile.phone);
      setEmailValue(mappedProfile.email);
      setFirstNameValue(mappedProfile.firstName);
      setLastNameValue(mappedProfile.lastName);
      setOrgNameValue(mappedProfile.organizationName);
      setContactNameValue(mappedProfile.contactFullName);

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
    if (phoneValue === profile.phone) {
        setIsEditingPhone(false);
        return;
    }
    if (phoneValid && !isSendingPhoneOtp) {
      setIsSendingPhoneOtp(true);
      try {
        const response = await requestPhoneUpdateOtp(axiosInstance, { phone: phoneValue });
        
        const msg = response?.data?.message || response?.message || "OTP sent to new phone number";
        toast.success(msg);
        setOtpMethod("phone");
        setShowOtpModal(true);
      } catch (error: any) {
        toast.error(error.message || "Failed to send phone OTP");
      } finally {
        setIsSendingPhoneOtp(false);
      }
    }
  };

  const sendEmailOtp = async () => {
    if (emailValue === profile.email) {
        setIsEditingEmail(false);
        return;
    }
    if (emailValid && !isSendingEmailOtp) {
      setIsSendingEmailOtp(true);
      try {
        const response = await requestEmailUpdateOtp(axiosInstance, { email: emailValue });
        
        const msg = response?.data?.message || response?.message || "OTP sent to new email";
        toast.success(msg);
        setOtpMethod("email");
        setShowOtpModal(true);
      } catch (error: any) {
        toast.error(error.message || "Failed to send email OTP");
      } finally {
        setIsSendingEmailOtp(false);
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue.trim()) {
      toast.error("Please enter the OTP");
      return;
    }

    setIsUpdating(true);
    try {
      if (otpMethod === "phone") {
        await updateProfilePhoneNumber(axiosInstance, {
          phone: phoneValue,
          otp: otpValue.trim()
        });
        toast.success("Phone updated successfully");
        setProfile(prev => ({ ...prev, phone: phoneValue }));
        setIsEditingPhone(false);
      } else if (otpMethod === "email") {
        await updateProfileEmail(axiosInstance, {
          email: emailValue,
          otp: otpValue.trim()
        });
        toast.success("Email updated successfully");
        setProfile(prev => ({ ...prev, email: emailValue }));
        setIsEditingEmail(false);
      }

      setShowOtpModal(false);
      setOtpValue("");
      if (refreshData) refreshData();
    } catch (error: any) {
      toast.error(error.message || "Invalid or expired OTP");
    } finally {
      setIsUpdating(false);
    }
  };

  /* ---------- HANDLERS ---------- */
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingImage(true);
      const loadingToast = toast.loading("Uploading profile image...");
      try {
        
        const uploaded = await uploadFile(file);
        
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

  if (!profile) return <div className="p-10">Loading info...</div>;

  const isOrg = profile?.type?.toLowerCase() === "organization" || 
                profile?.type?.toLowerCase() === "business" || 
                profile?.userType === "CONTRACTOR" || 
                profile?.userType === "HARDWARE";

  const handleNameSave = async () => {
    setIsUpdatingName(true);
    try {
      const payload = isOrg
        ? { organizationName: orgNameValue, contactFullName: contactNameValue }
        : { firstName: firstNameValue, lastName: lastNameValue };

      await updateProfileName(axiosInstance, payload);
      toast.success("Name updated successfully");
      setIsEditingName(false);
      if (refreshData) refreshData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update name");
    } finally {
      setIsUpdatingName(false);
    }
  };

  if (!profile) return <div className="p-10">Loading info...</div>;

  return (
    <section className="w-full max-w-6xl bg-white rounded-xl shadow-md p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Account Info</h1>
        <div className="flex items-center gap-3">
          {isReadOnly && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm ${data?.status === "BLACKLISTED" ? "bg-red-50 text-red-700 border-red-100" : data?.status === "SUSPENDED" ? "bg-yellow-50 text-yellow-700 border-yellow-100" : "bg-green-50 text-green-700 border-green-100"}`}>
              <Shield className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {data?.status === "BLACKLISTED" ? "Blacklisted" : data?.status === "SUSPENDED" ? "Suspended" : data?.status === "VERIFIED" ? "Verified Profile" : "Information Submitted"}
              </span>
            </div>
          )}
          {!isReadOnly && !isEditingName && (
            <button
              onClick={() => setIsEditingName(true)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <FiEdit /> Edit Names
            </button>
          )}
        </div>
      </div>

      {isReadOnly && (
        <div className={`mb-6 p-4 border rounded-xl flex items-start gap-3 ${data?.status === "BLACKLISTED" ? "bg-red-50 border-red-200" : data?.status === "SUSPENDED" ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"}`}>
          <Clock className={`w-5 h-5 mt-0.5 ${data?.status === "BLACKLISTED" ? "text-red-600" : data?.status === "SUSPENDED" ? "text-yellow-600" : "text-blue-600"}`} />
          <div>
            <p className={`text-sm font-semibold ${data?.status === "BLACKLISTED" ? "text-red-900" : data?.status === "SUSPENDED" ? "text-yellow-900" : "text-blue-900"}`}>
              {data?.status === "BLACKLISTED" ? "Account Blacklisted" : data?.status === "SUSPENDED" ? "Account Suspended" : data?.status === "VERIFIED" ? "Profile Verified" : "Information Submitted"}
            </p>
            <p className={`text-xs mt-0.5 ${data?.status === "BLACKLISTED" ? "text-red-700" : data?.status === "SUSPENDED" ? "text-yellow-700" : "text-blue-700"}`}>
              {data?.status === "BLACKLISTED" || data?.status === "SUSPENDED" 
                ? "Your account has been restricted. To update these details, please contact JAGEDO Support." 
                : data?.status === "VERIFIED" 
                  ? "Your profile information has been verified. To update these details, please contact JAGEDO Support."
                  : "You have already submitted your information. To update these details, please contact JAGEDO Support."}
            </p>
            {data?.statusReason && (
              <p className={`text-xs mt-2 font-medium italic ${data?.status === "BLACKLISTED" ? "text-red-800" : data?.status === "SUSPENDED" ? "text-yellow-800" : "text-blue-800"}`}>
                Reason: {data?.statusReason}
              </p>
            )}
          </div>
        </div>
      )}

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
        {!isReadOnly && (
          <div className="flex gap-3 mt-4">
            <button
              disabled={isUploadingImage}
              onClick={() => fileInputRef.current.click()}
              className="text-blue-700 text-sm hover:text-blue-900 disabled:opacity-50 font-medium"
            >
              {isUploadingImage ? "Uploading..." : "Change Photo"}
            </button>
          </div>
        )}
        <input type="file" hidden ref={fileInputRef} onChange={handleImageChange} accept="image/*" />
      </div>

      {/* Organization vs Individual Fields */}
      {isOrg ? (
        <div className="space-y-4 mb-6">
          <SimpleEditableField 
            label={profile.userType === "HARDWARE" ? "Hardware Name" : "Company Name"} 
            value={orgNameValue} 
            editing={isEditingName} 
            onChange={setOrgNameValue} 
          />
          {(profile.userType === "CUSTOMER" || profile.userType === "CONTRACTOR" || profile.userType === "HARDWARE") && (
            <SimpleEditableField 
              label="Contact Full Name" 
              value={contactNameValue} 
              editing={isEditingName} 
              onChange={setContactNameValue} 
            />
          )}
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          <SimpleEditableField 
            label="First Name" 
            value={firstNameValue} 
            editing={isEditingName} 
            onChange={setFirstNameValue} 
          />
          <SimpleEditableField 
            label="Last Name" 
            value={lastNameValue} 
            editing={isEditingName} 
            onChange={setLastNameValue} 
          />
        </div>
      )}

      {isEditingName && (
        <div className="flex gap-3 mb-8">
          <button
            disabled={isUpdatingName}
            onClick={handleNameSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition sm:w-32"
          >
            {isUpdatingName ? "Saving..." : "Save"}
          </button>
          <button
            disabled={isUpdatingName}
            onClick={() => {
              setIsEditingName(false);
              setFirstNameValue(profile.firstName);
              setLastNameValue(profile.lastName);
              setOrgNameValue(profile.organizationName);
              setContactNameValue(profile.contactFullName);
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition sm:w-32"
          >
            Cancel
          </button>
        </div>
      )}
    {/* <Field label="Phone Number" value={profile.contactFullName} /> */}
      {/* PHONE */}
      <EditableField
        label="Account Phone"
        value={phoneValue}
        editing={isEditingPhone}
        isReadOnly={isReadOnly}
        onEdit={() => {
          setIsEditingPhone(true);
        }}
        onChange={setPhoneValue}
        onSave={sendPhoneOtp}
        isValid={phoneValid}
        isLoading={isSendingPhoneOtp}
        onCancel={() => {
            setIsEditingPhone(false);
            setPhoneValue(profile.phone);
        }}
      />

      {/* EMAIL */}
      <EditableField
        label="Account Email"
        value={emailValue}
        editing={isEditingEmail}
        isReadOnly={isReadOnly}
        onEdit={() => {
          setIsEditingEmail(true);
        }}
        onChange={setEmailValue}
        onSave={sendEmailOtp}
        isValid={emailValid}
        isLoading={isSendingEmailOtp}
        onCancel={() => {
            setIsEditingEmail(false);
            setEmailValue(profile.email);
        }}
      />

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Verify Update</h3>
              <p className="text-gray-500 mb-8">
                An OTP has been sent to your new {otpMethod === "email" ? "email address" : "phone number"}. 
                Please enter it below to confirm the change.
              </p>
              
              <div className="space-y-4">
                <input
                  type="text"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="w-full px-4 py-4 text-center text-2xl font-mono tracking-[0.5em] border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                  maxLength={6}
                />
                
                <div className="flex flex-col gap-3 mt-8">
                  <button
                    onClick={handleVerifyOtp}
                    disabled={isUpdating || !otpValue.trim()}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                    Verify & Update
                  </button>
                  <button
                    onClick={() => {
                      setShowOtpModal(false);
                      setOtpValue("");
                    }}
                    disabled={isUpdating}
                    className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const SimpleEditableField = ({ label, value, editing, onChange }) => (
  <div className="space-y-2 mb-4">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      value={value || ""}
      readOnly={!editing}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-4 py-2 border-b bg-transparent outline-none transition-colors ${
        editing ? 'border-blue-500 focus:border-blue-700' : 'border-gray-300'
      }`}
    />
  </div>
);

const Field = ({ label, value }) => (
  <div className="space-y-2 mb-4">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input value={value || ""} readOnly className="w-full px-4 py-2 border-b bg-transparent" />
  </div>
);

const EditableField = ({
  label, value, editing, onEdit, onChange, onSave,
  isValid, isLoading, onCancel, isReadOnly
}) => (
  <div className="space-y-2 mb-6">
    <label className="block text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</label>
    <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-lg border focus-within:border-blue-500 transition-all">
      <input
        value={value}
        readOnly={!editing}
        onChange={(e) => onChange(e.target.value)}
        className={`flex-1 px-4 py-2 outline-none bg-transparent font-medium ${!editing ? 'text-gray-700' : 'text-blue-900'}`}
      />
      {!editing ? (
        !isReadOnly && (
          <button 
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
              <FiEdit size={18} />
          </button>
        )
      ) : (
        <div className="flex items-center gap-2 p-1">
          <button
              onClick={onSave}
              disabled={isLoading || !isValid}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 text-sm font-medium"
          >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <FiCheck size={14} />}
              Save
          </button>
          <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition text-sm font-medium"
          >
              <FiX size={14} />
              Cancel
          </button>
        </div>
      )}
    </div>
  </div>
);

export default AccountInfo;