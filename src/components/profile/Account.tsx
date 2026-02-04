/* eslint-disable */
//@ts-nocheck
import { useState, useEffect, useRef } from "react";
import { FiEdit } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useGlobalContext } from "@/context/GlobalProvider";

const isValidPhone = (phone: string) => {
  return /^2547\d{8}$/.test(phone);
};


const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

function AccountInfo() {
  const fileInputRef = useRef(null);
  const { user } = useGlobalContext();

  const [profile, setProfile] = useState(null);
  const [imageSrc, setImageSrc] = useState("/profile.jpg");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [originalPhone, setOriginalPhone] = useState("");

  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpValue, setPhoneOtpValue] = useState("");
  const [emailOtpValue, setEmailOtpValue] = useState("");
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(false);
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);

  /* ---------- VALIDATION ---------- */
  useEffect(() => {
    setPhoneValid(isValidPhone(phoneValue));
  }, [phoneValue]);

  useEffect(() => {
    setEmailValid(isValidEmail(emailValue));
  }, [emailValue]);

  /* ---------- OTP HELPERS ---------- */
  const sendPhoneOtp = () => {
    if (phoneValid && !phoneOtpSent) {
      // TODO: Call your actual OTP API here
      toast.success("OTP sent to new phone number");
      setPhoneOtpSent(true);
    }
  };

  const sendEmailOtp = () => {
    if (emailValid && !emailOtpSent) {
      // TODO: Call your actual OTP API here
      toast.success("OTP sent to new email");
      setEmailOtpSent(true);
    }
  };

  const verifyPhoneOtp = () => {
    if (phoneOtpValue.length === 6) {
      // TODO: Call your actual OTP verification API here
      // For now, we'll simulate success
      toast.success("Phone OTP verified successfully");
      setPhoneOtpVerified(true);
    }
  };

  const verifyEmailOtp = () => {
    if (emailOtpValue.length === 6) {
      // TODO: Call your actual OTP verification API here
      // For now, we'll simulate success
      toast.success("Email OTP verified successfully");
      setEmailOtpVerified(true);
    }
  };

  /* ---------- LOAD PROFILE (REAL FIX) ---------- */
  useEffect(() => {
    let stored = null;
    try {
      const raw = localStorage.getItem("profile");
      if (raw && raw !== "undefined") {
        stored = JSON.parse(raw);
      }
    } catch {
      localStorage.removeItem("profile");
    }

    // Build profile from user data
    const userProfile = user ? {
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: user.username || user.email || "",
      phone: user.phone || "",
      userType: user.userType,
      type: user.profileType || user.accountType,
      // Organization fields - check multiple possible field names
      organizationName: user.organizationName || "",
      contactPerson: user.contactFullName || user.contactPerson || "",
    } : null;

    if (stored && userProfile) {
      // Merge stored profile with user data, preferring user data for org fields if stored is empty
      const mergedProfile = {
        ...stored,
        userType: userProfile.userType || stored.userType,
        type: userProfile.type || stored.type,
        organizationName: stored.organizationName || userProfile.organizationName,
        contactPerson: stored.contactPerson || userProfile.contactPerson,
        name: stored.name || userProfile.name,
      };
      setProfile(mergedProfile);
      setPhoneValue(mergedProfile.phone || "");
      setEmailValue(mergedProfile.email || "");
      if (mergedProfile.avatar) {
        setImageSrc(mergedProfile.avatar);
      }
      // Update stored profile with merged data
      localStorage.setItem("profile", JSON.stringify(mergedProfile));
    } else if (stored) {
      setProfile(stored);
      setPhoneValue(stored.phone || "");
      setEmailValue(stored.email || "");
      if (stored.avatar) {
        setImageSrc(stored.avatar);
      }
    } else if (userProfile) {
      setProfile(userProfile);
      setPhoneValue(userProfile.phone);
      setEmailValue(userProfile.email);
      localStorage.setItem("profile", JSON.stringify(userProfile));
    }
  }, [user]);

  /* ---------- SAVE ---------- */
  const saveProfile = (updated) => {
    localStorage.setItem("profile", JSON.stringify(updated));
    setProfile(updated);
    toast.success("Profile updated");
  };

  /* ---------- IMAGE ---------- */
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result;
        setImageSrc(base64String);
        saveProfile({ ...profile, avatar: base64String });
        toast.success("Image uploaded successfully");
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
      };
      reader.readAsDataURL(file);
    }
  };

  /* ---------- PHONE ---------- */
  const handlePhoneSave = () => {
    saveProfile({ ...profile, phone: phoneValue });
    setIsEditingPhone(false);
    setPhoneOtpSent(false);
    setPhoneOtpValue("");
    setPhoneOtpVerified(false);
  };

  /* ---------- EMAIL ---------- */
  const handleEmailSave = () => {
    saveProfile({ ...profile, email: emailValue });
    setIsEditingEmail(false);
    setEmailOtpSent(false);
    setEmailOtpValue("");
    setEmailOtpVerified(false);
  };

  /* ---------- REMOVE IMAGE ---------- */
  const handleRemoveImage = () => {
    setImageSrc("/profile.jpg");
    const updatedProfile = { ...profile };
    delete updatedProfile.avatar;
    saveProfile(updatedProfile);
    toast.success("Image removed");
  };

  /* ---------- LOADING (NO BLACK SCREEN) ---------- */
  if (!profile) {
    return (
      <div className="p-10 text-gray-500">
        Loading account info...
      </div>
    );
  }

  const role = user?.userType?.toLowerCase();

  return (
    <section className="w-full max-w-4xl bg-white rounded-xl shadow-md p-8">
      <h1 className="text-3xl font-bold mb-6">Account Info</h1>

      {/* Avatar */}
      <div className="flex flex-col items-start mb-8">
        <img
          src={profile.avatar || imageSrc}
          className="w-24 h-24 rounded-full object-cover border"
          alt="Profile Avatar"
        />
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => fileInputRef.current.click()}
            className="text-blue-700 text-sm hover:text-blue-900"
          >
            Change Photo
          </button>
          {profile.avatar && (
            <button
              onClick={handleRemoveImage}
              className="text-red-600 text-sm hover:text-red-800"
            >
              Remove Photo
            </button>
          )}
        </div>
        <input
          type="file"
          hidden
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
        />
      </div>

      {/* ORGANIZATION USERS - Contractors, Hardware, and Organization-type customers */}
      {(role === "contractor" || role === "hardware" ||
        (role === "customer" && (profile.type === "organization" || profile.type === "ORGANIZATION"))) && (
        <>
          <Field label="Organization Name" value={profile.organizationName} />
          <Field label="Contact Person" value={profile.contactPerson} />
        </>
      )}

      {/* INDIVIDUAL USERS - Fundi, Professional, and Individual-type customers */}
      {!(role === "contractor" || role === "hardware" ||
        (role === "customer" && (profile.type === "organization" || profile.type === "ORGANIZATION"))) && (
        <Field label="Name" value={profile.name} />
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
      />
    </section>
  );
}

/* ---------------- UI HELPERS ---------------- */

const Field = ({ label, value }) => (
  <div className="space-y-2 mb-4">
    <label className="block text-sm font-medium">{label}</label>
    <input
      value={value || ""}
      readOnly
      className="w-full px-4 py-2 border-b bg-transparent"
    />
  </div>
);

const EditableField = ({
  label,
  value,
  editing,
  onEdit,
  onChange,
  onSave,
  canSave,
  isValid,
  otpSent,
  otpValue,
  otpVerified,
  onSendOtp,
  onVerifyOtp,
  onOtpChange,
}) => (
  <div className="space-y-2 mb-4">
    <label className="block text-sm font-medium">{label}</label>
    <div className="flex items-center border-b">
      <input
        value={value}
        readOnly={!editing}
        maxLength={label.includes("Phone") ? 12 : undefined}
        inputMode={label.includes("Phone") ? "numeric" : undefined}
        onChange={(e) => {
          if (label.includes("Phone")) {
            const digitsOnly = e.target.value.replace(/\D/g, "");
            onChange(digitsOnly);
          } else {
            onChange(e.target.value);
          }
        }}
        className="w-full px-4 py-2 outline-none bg-transparent"
      />

      {!editing ? (
        <button onClick={onEdit}>
          <FiEdit size={15} />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          {/* Send OTP Button */}
          {isValid && !otpSent && (
            <button onClick={onSendOtp} className="text-blue-600 text-sm whitespace-nowrap">
              Send OTP
            </button>
          )}
          
          {/* Verify OTP Button */}
          {otpSent && !otpVerified && otpValue.length === 6 && (
            <button onClick={onVerifyOtp} className="text-blue-600 text-sm whitespace-nowrap">
              Verify OTP
            </button>
          )}
          
          {/* Save Button */}
          {canSave && (
            <button onClick={onSave} className="text-green-600 text-sm whitespace-nowrap">
              Save
            </button>
          )}
        </div>
      )}
    </div>
    
    {/* OTP Input Field */}
    {editing && otpSent && !otpVerified && (
      <div className="mt-2">
        <input
          type="text"
          value={otpValue}
          onChange={(e) => {
            const digitsOnly = e.target.value.replace(/\D/g, "");
            if (digitsOnly.length <= 6) {
              onOtpChange(digitsOnly);
            }
          }}
          maxLength={6}
          inputMode="numeric"
          placeholder="Enter 6-digit OTP"
          className="w-full px-4 py-2 border rounded outline-none"
        />
      </div>
    )}
  </div>
);

export default AccountInfo;