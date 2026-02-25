/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import { FiEdit, FiCheck, FiX, FiChevronDown } from "react-icons/fi";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { updateProfileImageAdmin, updateProfileEmailAdmin, updateProfilePhoneNumberAdmin, updateProfileNameAdmin, blackListUser, whiteListUser, suspendUser, unverifyUser } from "@/api/provider.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";

interface AccountInfoProps {
  userData: any;
}


const AccountInfo: React.FC<AccountInfoProps> = ({ userData }) => {
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [askDeleteReason, setAskDeleteReason] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const showVerificationMessage = userData.status == 'VERIFIED';
  const [avatarSrc, setAvatarSrc] = useState(
    userData?.profileImage,
  );

  const [editingField, setEditingField] = useState<string | null>(null);

  // Handle display name - use organizationName for organizations, firstName + lastName for individuals
  const isOrganization = userData?.accountType === "business" || userData?.accountType === "organization" ||
    userData?.userType === "CONTRACTOR" || userData?.userType === "HARDWARE";
  const name = isOrganization && userData?.organizationName
    ? userData.organizationName
    : `${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`.trim();

  const [editValues, setEditValues] = useState({
    firstName: userData?.firstName ?? "",
    lastName: userData?.lastName ?? "",
    organizationName: userData?.organizationName ?? "",
    email: userData?.email ?? "",
    phone: userData?.phone ?? "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // --- Remove localStorage-based load on mount ---

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // --- localStorage-based image change with Base64 persistence ---
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("Image size must be less than 5MB");
        event.target.value = ""; // Reset input
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        event.target.value = ""; // Reset input
        return;
      }

      // Convert to Base64 for persistence
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;

        // Set state immediately to show preview
        setAvatarSrc(base64String);

        // --- Backend Update Only ---
        try {
          await updateProfileImageAdmin(
            axiosInstance,
            base64String,
            userData.id,
          );
          toast.success("Profile image updated on server");
          event.target.value = ""; // Reset input
        } catch (apiErr: any) {
          console.error("Failed to update image on server:", apiErr);
          toast.error(apiErr.message || "Failed to sync image with server");
          event.target.value = ""; // Reset input
        }
      };
      reader.onerror = () => {
        alert("Failed to read image file");
        event.target.value = ""; // Reset input
      };
      reader.readAsDataURL(file); // Convert file to Base64
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    setAskDeleteReason(true);
  };

  const handleSubmitReason = () => {
    if (deleteReason.trim()) {
      // Replace with actual delete logic
      alert(`Deleted for reason: ${deleteReason}`);
      setAskDeleteReason(false);
      setDeleteReason("");
    } else {
      alert("Please enter a reason.");
    }
  };

  // Edit handlers
  const handleEditStart = (field: string) => {
    setEditingField(field);
    setEditValues({
      firstName: userData?.firstName ?? "",
      lastName: userData?.lastName ?? "",
      organizationName: userData?.organizationName ?? "",
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

  // --- localStorage-based edit save ---
  const handleEditSave = async (field: string) => {
    // Validation
    if (field === "name") {
      if (isOrganization) {
        if (!editValues.organizationName?.trim()) {
          alert("Organization name cannot be empty");
          return;
        }
      } else {
        if (!editValues.firstName?.trim() || !editValues.lastName?.trim()) {
          alert("Both first and last name are required");
          return;
        }
      }
    } else if (!editValues[field as keyof typeof editValues]?.trim()) {
      alert(
        `${field.charAt(0).toUpperCase() + field.slice(1)} cannot be empty`,
      );
      return;
    }

    setIsUpdating(true);
    try {
      const updates: Record<string, any> = {};
      switch (field) {
        case "name": {
          // For organizations, update organizationName; for individuals, update firstName/lastName
          if (isOrganization) {
            updates.organizationName = editValues.organizationName.trim();
          } else {
            updates.firstName = editValues.firstName.trim();
            updates.lastName = editValues.lastName.trim();
          }
          break;
        }
        case "email":
          updates.email = editValues.email;
          break;
        case "phone":
          updates.phone = editValues.phone;
          break;
        default:
          throw new Error("Invalid field");
      }

      // Update userData in-place for the current render (not strictly necessary if we refresh)
      Object.assign(userData, updates);


      // --- Backend Update ---
      try {
        if (field === "name") {
          const namePayload: any = {};
          if (isOrganization) {
            namePayload.organizationName = editValues.organizationName.trim();
          } else {
            namePayload.firstName = editValues.firstName.trim();
            namePayload.lastName = editValues.lastName.trim();
          }
          await updateProfileNameAdmin(axiosInstance, userData.id, namePayload);
        } else if (field === "email") {
          await updateProfileEmailAdmin(axiosInstance, userData.id, {
            email: editValues.email,
          });
        } else if (field === "phone") {
          await updateProfilePhoneNumberAdmin(axiosInstance, userData.id, {
            phone: editValues.phone,
          });
        }
        toast.success(
          `${field.charAt(0).toUpperCase() + field.slice(1)} updated on server`,
        );
      } catch (apiErr: any) {
        console.error(`Failed to update ${field} on server:`, apiErr);
        toast.error(apiErr.message || `Failed to sync ${field} with server`);
      }

      setEditingField(null);
      // alert(
      //   `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`,
      // );
    } catch (error: any) {
      console.error(`Failed to update ${field}:`, error);
      alert(error.message || `Failed to update ${field}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Action handlers using API ---
  const handleBlackList = async (reason: string) => {
    try {
      await blackListUser(axiosInstance, userData.id);
      Object.assign(userData, { blacklisted: true, blacklistReason: reason });
      toast.success("User blacklisted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to blacklist user");
    }
  };

  const handleWhiteList = async () => {
    try {
      await whiteListUser(axiosInstance, userData.id);
      Object.assign(userData, { blacklisted: false });
      toast.success("User whitelisted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to whitelist user");
    }
  };

  const handleSuspend = async (reason: string) => {
    try {
      await suspendUser(axiosInstance, userData.id);
      Object.assign(userData, { suspended: true, suspendReason: reason });
      toast.success("User suspended successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to suspend user");
    }
  };

  const handleUnverifyUser = async (reason: string) => {
    try {
      await unverifyUser(axiosInstance, userData.id);
      Object.assign(userData, { adminApproved: false, approved: false, unverifyReason: reason });
      toast.success("User unverified successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to unverify user");
    }
  };

  // Handle action with reason submission
  const handleActionSubmit = async () => {
    if (!actionReason.trim()) {
      alert("Please enter a reason for this action.");
      return;
    }

    switch (pendingAction) {
      case "unverify":
        await handleUnverifyUser(actionReason);
        break;
      case "suspend":
        await handleSuspend(actionReason);
        break;
      case "blacklist":
        await handleBlackList(actionReason);
        break;
    }

    setPendingAction(null);
    setActionReason("");
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "unverify": return "Unverify";
      case "suspend": return "Suspend";
      case "blacklist": return "Blacklist";
      default: return action;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* <ProfileNavBarVerification /> */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="w-full px-4">
          <section className="w-full max-w-3xl mx-auto py-6">
            <div className="bg-white rounded-xl p-6">
              <h1 className="text-2xl md:text-3xl font-bold mb-6">
                Account Info
              </h1>
              {showVerificationMessage && (
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      className="text-yellow-400 w-5 h-5"
                      fill="currentColor"
                    />
                  ))}
                  <span className="text-sm text-green-600 font-medium ml-2">
                    Verified
                  </span>
                </div>
              )}
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
              <div className="space-y-6">
                <h2 className="text-xl md:text-2xl font-semibold border-b pb-2">
                  Basic Info
                </h2>

                {/* ORGANIZATION SPECIFIC SECTION (CONTRACTOR & HARDWARE) */}
                {(userData?.userType === "HARDWARE" || userData?.userType === "CONTRACTOR") && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg mb-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        {userData?.userType === "HARDWARE" ? "Hardware Name" : "Company Name"}
                      </label>
                      <div className="flex items-center border-b focus-within:border-blue-900 transition">
                        {editingField === "name" ? (
                          <>
                            <input
                              type="text"
                              value={editValues.organizationName}
                              onChange={(e) => handleEditChange("organizationName", e.target.value)}
                              className="w-full px-4 py-2 outline-none bg-transparent"
                              disabled={isUpdating}
                            />
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditSave("name")}
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-700 disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <FiCheck size={15} />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={handleEditCancel}
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-700 disabled:opacity-50"
                              >
                                <FiX size={15} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={userData?.organizationName || name || "N/A"}
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
                      <label className="block text-sm font-medium">Phone Number</label>
                      <div className="flex items-center border-b focus-within:border-blue-900 transition">
                        {editingField === "phone" ? (
                          <>
                            <input
                              type="tel"
                              value={editValues.phone}
                              onChange={(e) => handleEditChange("phone", e.target.value)}
                              className="w-full px-4 py-2 outline-none bg-transparent"
                              disabled={isUpdating}
                            />
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditSave("phone")}
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-700 disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <FiCheck size={15} />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={handleEditCancel}
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-700 disabled:opacity-50"
                              >
                                <FiX size={15} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <input
                              type="tel"
                              value={userData?.phone || "N/A"}
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
                      <label className="block text-sm font-medium">Email</label>
                      <div className="flex items-center border-b focus-within:border-blue-900 transition">
                        {editingField === "email" ? (
                          <>
                            <input
                              type="email"
                              value={editValues.email}
                              onChange={(e) => handleEditChange("email", e.target.value)}
                              className="w-full px-4 py-2 outline-none bg-transparent"
                              disabled={isUpdating}
                            />
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditSave("email")}
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-700 disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <FiCheck size={15} />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={handleEditCancel}
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-700 disabled:opacity-50"
                              >
                                <FiX size={15} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <input
                              type="email"
                              value={userData?.email || "N/A"}
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
                  </div>
                )}

                {/* INDIVIDUAL USERS (FUNDI, PROFESSIONAL, CUSTOMER) */}
                {userData?.userType !== "HARDWARE" && userData?.userType !== "CONTRACTOR" && (
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">Name</label>
                      <div className="flex flex-col gap-4 border-b pb-4">
                        {editingField === "name" ? (
                          <div className="space-y-4 w-full">
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</label>
                              <input
                                type="text"
                                value={editValues.firstName}
                                onChange={(e) =>
                                  handleEditChange("firstName", e.target.value)
                                }
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                disabled={isUpdating}
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</label>
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
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditSave("phone")}
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-700 disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <FiCheck size={15} />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={handleEditCancel}
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-700 disabled:opacity-50"
                              >
                                <FiX size={15} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <input
                              type="tel"
                              value={userData.phone || ""}
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
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditSave("email")}
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-700 disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <FiCheck size={15} />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={handleEditCancel}
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-700 disabled:opacity-50"
                              >
                                <FiX size={15} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <input
                              type="email"
                              value={userData.email || ""}
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
            {showVerificationMessage && (
              <div className="mt-6 flex justify-between items-center flex-wrap gap-4">
                {/* Actions button aligned to start */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowActionDropdown(!showActionDropdown)}
                    className="bg-blue-800 text-white px-6 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    Actions
                    <FiChevronDown
                      className={`transition-transform ${showActionDropdown ? "rotate-180" : ""}`}
                      size={16}
                    />
                  </button>
                  {showActionDropdown && (
                    <div className="absolute left-0 mt-2 w-44 bg-white border rounded shadow-lg z-50">
                      <button
                        type="button"
                        onClick={() => {
                          setPendingAction("unverify");
                          setShowActionDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Unverify
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingAction("suspend");
                          setShowActionDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Suspend
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingAction("blacklist");
                          setShowActionDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                      >
                        Blacklist
                      </button>
                    </div>
                  )}
                </div>
                {/* Delete button aligned to end */}
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            )}

            {/* Action Reason Modal */}
            {pendingAction && (
              <div className="bg-blue-50 border border-blue-300 text-blue-800 px-4 py-4 rounded mt-4">
                <p className="font-medium mb-2">
                  Please provide a reason for {getActionLabel(pendingAction).toLowerCase()}ing this user:
                </p>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={`Enter reason for ${getActionLabel(pendingAction).toLowerCase()}...`}
                  className="w-full mt-2 p-3 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleActionSubmit}
                    className={`text-white px-4 py-2 rounded transition ${pendingAction === "blacklist"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-blue-600 hover:bg-blue-700"
                      }`}
                  >
                    Confirm {getActionLabel(pendingAction)}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingAction(null);
                      setActionReason("");
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {showDeleteConfirm && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
                <p>Are you sure you want to delete?</p>
                <div className="mt-2 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="bg-gray-300 text-black px-4 py-1 rounded hover:bg-gray-400"
                  >
                    No
                  </button>
                </div>
              </div>
            )}
            {askDeleteReason && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mt-4">
                <p>Please provide a reason for deletion:</p>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full mt-2 p-2 border rounded"
                />
                <div className="mt-2 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={handleSubmitReason}
                    className="bg-yellow-600 text-white px-4 py-1 rounded hover:bg-yellow-700"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAskDeleteReason(false);
                      setDeleteReason("");
                    }}
                    className="bg-gray-300 text-black px-4 py-1 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>

  );
};

export default AccountInfo;