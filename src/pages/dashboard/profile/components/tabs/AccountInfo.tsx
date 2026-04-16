import { useState, useRef, useEffect } from "react";
import { FiEdit, FiCheck, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  Star,
  Shield,
  ShieldAlert,
  ShieldOff,
  Trash2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateProfileImageAdmin,
  updateProfileEmailAdmin,
  updateProfilePhoneNumberAdmin,
  updateProfileNameAdmin,
  handleVerifyUser,
} from "@/api/provider.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";

interface AccountInfoProps {
  userData: any;
  completionStatus?: Record<string, string>;
  isAdmin?: boolean;
}

const AccountInfo: React.FC<AccountInfoProps> = ({
  userData,
  completionStatus,
  isAdmin,
}) => {
  const navigate = useNavigate();
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const showVerificationMessage = userData.status == "VERIFIED";
  const [avatarSrc, setAvatarSrc] = useState(userData?.profileImage);

  const allSectionsComplete = completionStatus
    ? Object.entries(completionStatus)
        .filter(([key]) => {
          
          if (key === "Activities" || key === "activities") return false;
          if (key === "Products" || key === "products") return false;
          
          if (key === "Experience" || key === "experience") {
            const uType = userData?.userType?.toUpperCase();
            if (uType === "HARDWARE" || uType === "CUSTOMER") return false;
          }
          return true;
        })
        .every(([, val]) => val === "complete")
    : false;

  const displayStatus = userData.status || "N/A";

  const [editingField, setEditingField] = useState<string | null>(null);

  const isOrganization =
    userData?.accountType?.toLowerCase() === "business" ||
    userData?.accountType?.toLowerCase() === "organization" ||
    userData?.userType === "CONTRACTOR" ||
    userData?.userType === "HARDWARE";
  const name =
    isOrganization && userData?.organizationName
      ? userData.organizationName
      : `${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`.trim();

  const [editValues, setEditValues] = useState({
    firstName: userData?.firstName ?? "",
    lastName: userData?.lastName ?? "",
    organizationName: userData?.organizationName ?? "",
    contactFullName: userData?.contactFullName ?? "",
    email: userData?.email ?? "",
    phone: userData?.phone ?? "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpMethod, setOtpMethod] = useState<"email" | "phone" | null>(null);

  
  const [displayEmail, setDisplayEmail] = useState(userData?.email ?? "");
  const [displayPhone, setDisplayPhone] = useState(userData?.phone ?? "");

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Image size must be less than 5MB");
        event.target.value = "";
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        event.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;

        setAvatarSrc(base64String);

        try {
          await updateProfileImageAdmin(
            axiosInstance,
            base64String,
            userData.id,
          );
          toast.success("Profile image updated on server");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          event.target.value = "";
        } catch (apiErr: any) {
          console.error("Failed to update image on server:", apiErr);
          toast.error(apiErr.message || "Failed to sync image with server");
          setAvatarSrc(userData?.profileImage);
          event.target.value = "";
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
        event.target.value = "";
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditStart = (field: string) => {
    setEditingField(field);
    setEditValues({
      firstName: userData?.firstName ?? "",
      lastName: userData?.lastName ?? "",
      organizationName: userData?.organizationName ?? "",
      contactFullName: userData?.contactFullName ?? "",
      email: userData?.email || "",
      phone: userData?.phone || "",
    });
  };

  const handleEditCancel = () => {
    setEditingField(null);
    setEditValues({
      firstName: userData?.firstName ?? "",
      lastName: userData?.lastName ?? "",
      organizationName: userData?.organizationName ?? "",
      contactFullName: userData?.contactFullName ?? "",
      email: userData?.email || "",
      phone: userData?.phone || "",
    });
  };

  const handleEditChange = (field: string, value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditSave = async (field: string) => {
    
    if (field === "name") {
      if (isOrganization) {
        if (!editValues.organizationName?.trim()) {
          toast.error("Organization name cannot be empty");
          return;
        }
      } else {
        if (!editValues.firstName?.trim() || !editValues.lastName?.trim()) {
          toast.error("Both first and last name are required");
          return;
        }
      }
    } else if (field === "contactFullName") {
      if (!editValues.contactFullName?.trim()) {
        toast.error("Contact person name cannot be empty");
        return;
      }
    } else if (!editValues[field as keyof typeof editValues]?.trim()) {
      toast.error(
        `${field.charAt(0).toUpperCase() + field.slice(1)} cannot be empty`,
      );
      return;
    }

    setIsUpdating(true);
    try {
      const updates: Record<string, any> = {};

      if (field === "name") {
        if (isOrganization) {
          updates.organizationName = editValues.organizationName.trim();
          await updateProfileNameAdmin(axiosInstance, userData.id, {
            organizationName: editValues.organizationName.trim(),
          });
        } else {
          updates.firstName = editValues.firstName.trim();
          updates.lastName = editValues.lastName.trim();
          await updateProfileNameAdmin(axiosInstance, userData.id, {
            firstName: editValues.firstName.trim(),
            lastName: editValues.lastName.trim(),
          });
        }
      } else if (field === "contactFullName") {
        updates.contactFullName = editValues.contactFullName.trim();
        await updateProfileNameAdmin(axiosInstance, userData.id, {
          contactFullName: editValues.contactFullName.trim(),
        });
      } else if (field === "email") {
        if (editValues.email === userData.email) {
          setEditingField(null);
          return;
        }
        const response = await updateProfileEmailAdmin(axiosInstance, userData.id, {
          email: editValues.email,
        });
        
        
        
        const emailMsg = response?.message || response?.data?.message || "";
        if (emailMsg.toLowerCase().includes("otp sent")) {
          setOtpMethod("email");
          setShowOtpModal(true);
          toast.success(emailMsg);
          setIsUpdating(false);
          return;
        }
        updates.email = editValues.email;
      } else if (field === "phone") {
        if (editValues.phone === userData.phone) {
          setEditingField(null);
          return;
        }
        const response = await updateProfilePhoneNumberAdmin(axiosInstance, userData.id, {
          phone: editValues.phone,
        });

        const phoneMsg = response?.message || response?.data?.message || "";
        if (phoneMsg.toLowerCase().includes("otp sent")) {
          setOtpMethod("phone");
          setShowOtpModal(true);
          toast.success(phoneMsg);
          setIsUpdating(false);
          return;
        }
        updates.phone = editValues.phone;
      }

      toast.success(
        `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`,
      );
      Object.assign(userData, updates);
      setEditingField(null);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error(`Failed to update ${field}:`, error);
      toast.error(error.message || `Failed to update ${field} on server`);
      handleEditCancel();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue.trim()) {
      toast.error("Please enter the OTP");
      return;
    }

    setIsUpdating(true);
    try {
      if (otpMethod === "email") {
        await updateProfileEmailAdmin(axiosInstance, userData.id, {
          email: editValues.email,
          otp: otpValue.trim(),
        });
        toast.success("Email updated successfully");
        
        setDisplayEmail(editValues.email);
        Object.assign(userData, { email: editValues.email });
      } else if (otpMethod === "phone") {
        await updateProfilePhoneNumberAdmin(axiosInstance, userData.id, {
          phone: editValues.phone,
          otp: otpValue.trim(),
        });
        toast.success("Phone number updated successfully");
        
        setDisplayPhone(editValues.phone);
        Object.assign(userData, { phone: editValues.phone });
      }

      setShowOtpModal(false);
      setOtpValue("");
      setEditingField(null);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error("Failed to verify OTP:", error);
      toast.error(error.message || "Invalid or expired OTP");
    } finally {
      setIsUpdating(false);
    }
  };


  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* <ProfileNavBarVerification /> */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="w-full px-4">
          <section className="w-full max-w-3xl mx-auto py-6">
            <div className="bg-white rounded-xl p-6">
              <div className="flex flex-row justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-6">
                    Account Info
                  </h1>
                  <div className="flex flex-col gap-3 mb-6">
                    <div
                      className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium border ${
                        userData.status === "VERIFIED"
                          ? "bg-green-50 border-green-200 text-green-700"
                          : userData.status === "SUSPENDED"
                            ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                            : userData.status === "BLACKLISTED"
                              ? "bg-orange-50 border-orange-200 text-orange-700"
                              : userData.status === "DELETED"
                                ? "bg-red-50 border-red-200 text-red-700"
                                : "bg-sky-50 border-sky-200 text-sky-700"
                      }`}
                    >
                      {userData.status === "VERIFIED" && (
                        <Shield className="w-4 h-4" />
                      )}
                      {userData.status === "SUSPENDED" && (
                        <ShieldAlert className="w-4 h-4" />
                      )}
                      {userData.status === "BLACKLISTED" && (
                        <ShieldOff className="w-4 h-4" />
                      )}
                      {userData.status === "DELETED" && (
                        <Trash2 className="w-4 h-4" />
                      )}
                      {(userData.status === "SIGNED_UP" ||
                        userData.status === "PENDING" ||
                        !userData.status) && (
                        <Clock className="w-4 h-4" />
                      )}
                      <span>
                        Status:{" "}
                        {displayStatus
                          .toLowerCase()
                          .split("_")
                          .map(
                            (word: string) =>
                              word.charAt(0).toUpperCase() + word.slice(1),
                          )
                          .join(" ")}
                      </span>
                    </div>

                    {userData.status === "VERIFIED" && (
                      <div className="flex items-center space-x-1 px-1">
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            className="text-yellow-400 w-4 h-4"
                            fill="currentColor"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-start mb-6">
                    <img
                      alt="avatar"
                      src={avatarSrc || "/profile.jpg"}
                      className="inline-block relative object-cover object-center !rounded-full w-16 h-16 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={handleButtonClick}
                      className="mt-4 text-blue-900 hover:text-blue-700 text-sm font-medium"
                    >
                      Changed Photo
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl md:text-2xl font-semibold border-b pb-2">
                  Basic Info
                </h2>

                {/* ORGANIZATION SPECIFIC SECTION (CONTRACTOR, HARDWARE & ORGANIZATION CUSTOMER) */}
                {(userData?.userType === "HARDWARE" ||
                  userData?.userType === "CONTRACTOR" ||
                  (userData?.userType === "CUSTOMER" &&
                    userData?.accountType === "ORGANIZATION")) && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg mb-6">
                    {/* Company / Hardware Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        {userData?.userType === "HARDWARE"
                          ? "Hardware Name"
                          : "Company Name"}
                      </label>
                      <div className="flex items-center border-b focus-within:border-blue-900 transition">
                        {editingField === "name" ? (
                          <>
                            <input
                              type="text"
                              value={editValues.organizationName}
                              onChange={(e) =>
                                handleEditChange(
                                  "organizationName",
                                  e.target.value,
                                )
                              }
                              className="w-full px-4 py-2 outline-none bg-transparent"
                              disabled={isUpdating}
                            />
                            <div className="flex items-center gap-2 ml-2">
                              <button
                                type="button"
                                onClick={() => handleEditSave("name")}
                                disabled={isUpdating}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm font-medium"
                              >
                                {isUpdating ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <FiCheck size={14} />
                                )}
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={handleEditCancel}
                                disabled={isUpdating}
                                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-sm font-medium"
                              >
                                <FiX size={14} />
                                Cancel
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={
                                userData?.organizationName || name || "N/A"
                              }
                              className="w-full px-4 py-2 outline-none bg-transparent"
                              readOnly
                            />
                            <button
                              type="button"
                              onClick={() => handleEditStart("name")}
                              className="text-blue-900 cursor-pointer hover:opacity-75"
                            >
                              <FiEdit size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Contact Full Name — CONTRACTOR and HARDWARE */}
                    {(userData?.userType === "CONTRACTOR" ||
                      userData?.userType === "HARDWARE") && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">
                          Contact Full Name
                        </label>
                        <div className="flex items-center border-b focus-within:border-blue-900 transition">
                          {editingField === "contactFullName" ? (
                            <>
                              <input
                                type="text"
                                value={editValues.contactFullName}
                                onChange={(e) =>
                                  handleEditChange(
                                    "contactFullName",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-4 py-2 outline-none bg-transparent"
                                disabled={isUpdating}
                              />
                              <div className="flex items-center gap-2 ml-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditSave("contactFullName")
                                  }
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm font-medium"
                                >
                                  {isUpdating ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <FiCheck size={14} />
                                  )}
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={handleEditCancel}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-sm font-medium"
                                >
                                  <FiX size={14} />
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <input
                                type="text"
                                value={userData?.contactFullName || "N/A"}
                                className="w-full px-4 py-2 outline-none bg-transparent"
                                readOnly
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditStart("contactFullName")
                                }
                                className="text-blue-900 cursor-pointer hover:opacity-75"
                              >
                                <FiEdit size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        Phone Number
                      </label>
                      <div className="flex items-center border-b focus-within:border-blue-900 transition">
                        {editingField === "phone" ? (
                          <>
                            <input
                              type="tel"
                              value={editValues.phone}
                              onChange={(e) =>
                                handleEditChange("phone", e.target.value)
                              }
                              className="w-full px-4 py-2 outline-none bg-transparent"
                              disabled={isUpdating}
                            />
                            <div className="flex items-center gap-2 ml-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditSave("phone")
                                  }
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm font-medium"
                                >
                                  {isUpdating ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <FiCheck size={14} />
                                  )}
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={handleEditCancel}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-sm font-medium"
                                >
                                  <FiX size={14} />
                                  Cancel
                                </button>
                              </div>
                          </>
                        ) : (
                          <>
                            <input
                              type="tel"
                              value={displayPhone || "N/A"}
                              className="w-full px-4 py-2 outline-none bg-transparent"
                              readOnly
                            />
                            <button
                              type="button"
                              onClick={() => handleEditStart("phone")}
                              className="text-blue-900 cursor-pointer hover:opacity-75"
                            >
                              <FiEdit size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Email</label>
                      <div className="flex items-center border-b focus-within:border-blue-900 transition">
                        {editingField === "email" ? (
                          <>
                            <input
                              type="email"
                              value={editValues.email}
                              onChange={(e) =>
                                handleEditChange("email", e.target.value)
                              }
                              className="w-full px-4 py-2 outline-none bg-transparent"
                              disabled={isUpdating}
                            />
                            <div className="flex items-center gap-2 ml-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditSave("email")
                                  }
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm font-medium"
                                >
                                  {isUpdating ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <FiCheck size={14} />
                                  )}
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={handleEditCancel}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-sm font-medium"
                                >
                                  <FiX size={14} />
                                  Cancel
                                </button>
                              </div>
                          </>
                        ) : (
                          <>
                            <input
                              type="email"
                              value={displayEmail || "N/A"}
                              className="w-full px-4 py-2 outline-none bg-transparent"
                              readOnly
                            />
                            <button
                              type="button"
                              onClick={() => handleEditStart("email")}
                              className="text-blue-900 cursor-pointer hover:opacity-75"
                            >
                              <FiEdit size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Contact Full Name for Organization Customers */}
                    {userData?.userType === "CUSTOMER" &&
                      userData?.accountType === "ORGANIZATION" && (
                        <div className="space-y-2">
                          <label className="block text-sm font-medium">
                            Contact Full Name
                          </label>
                          <div className="flex items-center border-b focus-within:border-blue-900 transition">
                            {editingField === "contactFullName" ? (
                              <>
                                <input
                                  type="text"
                                  value={editValues.contactFullName}
                                  onChange={(e) =>
                                    handleEditChange(
                                      "contactFullName",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-4 py-2 outline-none bg-transparent"
                                  disabled={isUpdating}
                                />
                                <div className="flex items-center gap-2 ml-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditSave("contactFullName")
                                  }
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm font-medium"
                                >
                                  {isUpdating ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <FiCheck size={14} />
                                  )}
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={handleEditCancel}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-sm font-medium"
                                >
                                  <FiX size={14} />
                                  Cancel
                                </button>
                              </div>
                              </>
                            ) : (
                              <>
                                <input
                                  type="text"
                                  value={userData?.contactFullName || "N/A"}
                                  className="w-full px-4 py-2 outline-none bg-transparent"
                                  readOnly
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditStart("contactFullName")
                                  }
                                  className="text-blue-900 cursor-pointer hover:opacity-75"
                                >
                                  <FiEdit size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* INDIVIDUAL USERS (FUNDI, PROFESSIONAL, INDIVIDUAL CUSTOMER) */}
                {userData?.userType !== "HARDWARE" &&
                  userData?.userType !== "CONTRACTOR" &&
                  !(
                    userData?.userType === "CUSTOMER" &&
                    userData?.accountType === "ORGANIZATION"
                  ) && (
                    <form className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">
                          Name
                        </label>
                        <div className="flex flex-row justify-center items-center gap-4 border-b pb-4">
                          {editingField === "name" ? (
                            <div className="space-y-4 w-full">
                              <div className="flex flex-col gap-2">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  First Name
                                </label>
                                <input
                                  type="text"
                                  value={editValues.firstName}
                                  onChange={(e) =>
                                    handleEditChange(
                                      "firstName",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                  disabled={isUpdating}
                                />
                              </div>
                              <div className="flex flex-col gap-2">
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Last Name
                                </label>
                                <input
                                  type="text"
                                  value={editValues.lastName}
                                  onChange={(e) =>
                                    handleEditChange("lastName", e.target.value)
                                  }
                                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                  disabled={isUpdating}
                                />
                              </div>
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditSave("name")}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm font-medium"
                                >
                                  {isUpdating ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <FiCheck size={14} />
                                  )}
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={handleEditCancel}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-sm font-medium"
                                >
                                  <FiX size={14} />
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <input
                                type="text"
                                value={name || ""}
                                className="w-full px-4 py-2 outline-none bg-transparent"
                                readOnly
                              />
                              <button
                                type="button"
                                onClick={() => handleEditStart("name")}
                                className="text-blue-900 cursor-pointer hover:opacity-75"
                              >
                                <FiEdit size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">
                          Phone Number
                        </label>
                        <div className="flex items-center border-b focus-within:border-blue-900 transition">
                          {editingField === "phone" ? (
                            <>
                              <input
                                type="tel"
                                value={editValues.phone}
                                onChange={(e) =>
                                  handleEditChange("phone", e.target.value)
                                }
                                className="w-full px-4 py-2 outline-none bg-transparent"
                                disabled={isUpdating}
                              />
                             <div className="flex items-center gap-2 ml-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditSave("phone")
                                  }
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm font-medium"
                                >
                                  {isUpdating ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <FiCheck size={14} />
                                  )}
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={handleEditCancel}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-sm font-medium"
                                >
                                  <FiX size={14} />
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <input
                                type="tel"
                                value={displayPhone || ""}
                                className="w-full px-4 py-2 outline-none bg-transparent"
                                readOnly
                              />
                              <button
                                type="button"
                                onClick={() => handleEditStart("phone")}
                                className="text-blue-900 cursor-pointer hover:opacity-75"
                              >
                                <FiEdit size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">
                          Email
                        </label>
                        <div className="flex items-center border-b focus-within:border-blue-900 transition">
                          {editingField === "email" ? (
                            <>
                              <input
                                type="email"
                                value={editValues.email}
                                onChange={(e) =>
                                  handleEditChange("email", e.target.value)
                                }
                                className="w-full px-4 py-2 outline-none bg-transparent"
                                disabled={isUpdating}
                              />
                              <div className="flex items-center gap-2 ml-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditSave("email")
                                  }
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm font-medium"
                                >
                                  {isUpdating ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <FiCheck size={14} />
                                  )}
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={handleEditCancel}
                                  disabled={isUpdating}
                                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-sm font-medium"
                                >
                                  <FiX size={14} />
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <input
                                type="email"
                                value={displayEmail || ""}
                                className="w-full px-4 py-2 outline-none bg-transparent"
                                readOnly
                              />
                              <button
                                type="button"
                                onClick={() => handleEditStart("email")}
                                className="text-blue-900 cursor-pointer hover:opacity-75"
                              >
                                <FiEdit size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </form>
                  )}
              </div>
            </div>
          </section>
        </div>
      </div>

   

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
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
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FiCheck className="w-5 h-5" />
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
    </div>
  );
};

export default AccountInfo;