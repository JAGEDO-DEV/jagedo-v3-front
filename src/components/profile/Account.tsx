/* eslint-disable */
//@ts-nocheck
import { useState, useEffect, useRef } from "react";
import { FiEdit } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useGlobalContext } from "@/context/GlobalProvider";

function AccountInfo() {
  const fileInputRef = useRef(null);
  const { user } = useGlobalContext();

  const [profile, setProfile] = useState(null);
  const [imageSrc, setImageSrc] = useState("/profile.jpg");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [emailValue, setEmailValue] = useState("");

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

    if (stored) {
      setProfile(stored);
      setPhoneValue(stored.phone || "");
      setEmailValue(stored.email || "");
      // Load persisted image if it exists
      if (stored.avatar) {
        setImageSrc(stored.avatar);
      }
    } else if (user) {
      // fallback to real logged-in user
      const initialProfile = {
        name: `${user.firstName} ${user.lastName}`,
        email: user.username || user.email || "",
        phone: user.phone || "",
        userType: user.userType,
        type: user.profileType || user.accountType,
      };

      setProfile(initialProfile);
      setPhoneValue(initialProfile.phone);
      setEmailValue(initialProfile.email);
      localStorage.setItem("profile", JSON.stringify(initialProfile));
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
      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      // Convert to Base64 for persistence
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result;
        setImageSrc(base64String); // Display immediately
        saveProfile({ ...profile, avatar: base64String }); // Persist in localStorage
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
  };

  /* ---------- EMAIL ---------- */
  const handleEmailSave = () => {
    saveProfile({ ...profile, email: emailValue });
    setIsEditingEmail(false);
  };

  /* ---------- REMOVE IMAGE ---------- */
  const handleRemoveImage = () => {
    setImageSrc("/profile.jpg"); // Reset to default
    const updatedProfile = { ...profile };
    delete updatedProfile.avatar; // Remove avatar from profile
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

      {/* ORGANIZATION USERS */}
      {(role === "contractor" ||
        (role === "customer" && profile.type === "organization")) && (
        <>
          <Field label="Organization Name" value={profile.organizationName} />
          <Field label="Contact Person" value={profile.contactPerson} />
        </>
      )}

      {/* NORMAL USERS */}
      <Field label="Name" value={profile.name} />

      {/* PHONE */}
      <EditableField
        label="Account Phone"
        value={phoneValue}
        editing={isEditingPhone}
        onEdit={() => setIsEditingPhone(true)}
        onChange={setPhoneValue}
        onSave={handlePhoneSave}
      />

      {/* EMAIL */}
      <EditableField
        label="Account Email"
        value={emailValue}
        editing={isEditingEmail}
        onEdit={() => setIsEditingEmail(true)}
        onChange={setEmailValue}
        onSave={handleEmailSave}
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
}) => (
  <div className="space-y-2 mb-4">
    <label className="block text-sm font-medium">{label}</label>
    <div className="flex items-center border-b">
      <input
        value={value}
        readOnly={!editing}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 outline-none bg-transparent"
      />
      {!editing ? (
        <button onClick={onEdit}>
          <FiEdit size={15} />
        </button>
      ) : (
        <button onClick={onSave} className="text-blue-600 text-sm">
          Save
        </button>
      )}
    </div>
  </div>
);

export default AccountInfo;
