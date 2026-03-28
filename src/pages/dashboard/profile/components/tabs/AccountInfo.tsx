import { useState, useRef, useEffect } from "react";
import { FiEdit, FiCheck, FiX, FiChevronDown } from "react-icons/fi";
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
  updateAccountStatus,
} from "@/api/provider.api";
import useAxiosWithAuth from "@/utils/axiosInterceptor";

interface AccountInfoProps {
  userData: any;
  completionStatus?: Record<string, string>; // ← add
}

const AccountInfo: React.FC<AccountInfoProps> = ({
  userData,
  completionStatus,
}) => {
  const navigate = useNavigate();
  const axiosInstance = useAxiosWithAuth(import.meta.env.VITE_SERVER_URL);
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const showVerificationMessage = userData.status == "VERIFIED";
  const [avatarSrc, setAvatarSrc] = useState(userData?.profileImage);

  const allSectionsComplete = completionStatus
    ? Object.entries(completionStatus)
        .filter(([key]) => {
          // Exclude non-required sections (handle both formats)
          if (key === "Activities" || key === "activities") return false;
          if (key === "Products" || key === "products") return false;
          // HARDWARE and CUSTOMER have no Experience requirement
          if (key === "Experience" || key === "experience") {
            const uType = userData?.userType?.toUpperCase();
            if (uType === "HARDWARE" || uType === "CUSTOMER") return false;
          }
          return true;
        })
        .every(([, val]) => val === "complete")
    : false;

  const displayStatus =
  userData.status === "VERIFIED"
    ? "Verified"
    : userData.status === "SUSPENDED"
      ? "Suspended"
      : userData.status === "BLACKLISTED"
        ? "Blacklisted"
        : userData.status === "DELETED"
          ? "Deleted"
          : userData.status === "SIGNED_UP" && allSectionsComplete
            ? "Pending Verification"
            : "Profile Incomplete";
      
  const [editingField, setEditingField] = useState<string | null>(null);

  const isOrganization =
    userData?.accountType === "business" ||
    userData?.accountType === "organization" ||
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
    if (field === "name" || field === "contactFullName") {
      if (isOrganization) {
        if (!editValues.organizationName?.trim() && field === "name") {
          toast.error("Organization name cannot be empty");
          return;
        }
        if (
          userData?.userType === "CUSTOMER" &&
          userData?.accountType === "ORGANIZATION" &&
          !editValues.contactFullName?.trim() &&
          field === "contactFullName"
        ) {
          toast.error("Contact person name cannot be empty");
          return;
        }
      } else {
        if (!editValues.firstName?.trim() || !editValues.lastName?.trim()) {
          toast.error("Both first and last name are required");
          return;
        }
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
      switch (field) {
        case "name": {
          if (isOrganization) {
            updates.organizationName = editValues.organizationName.trim();
          } else {
            updates.firstName = editValues.firstName.trim();
            updates.lastName = editValues.lastName.trim();
          }
          break;
        }
        case "contactFullName": {
          updates.contactFullName = editValues.contactFullName.trim();
          break;
        }
        case "email":
          updates.email = editValues.email;
          break;
        case "phone":
          updates.phone = editValues.phone;
          break;
        case "contactFullName":
          await updateProfileNameAdmin(axiosInstance, userData.id, {
            contactFullName: editValues.contactFullName.trim(),
          });
          break;
        default:
          throw new Error("Invalid field");
      }

      if (field === "name") {
        const namePayload: any = {};
        if (isOrganization) {
          namePayload.organizationName = editValues.organizationName.trim();
        } else {
          namePayload.firstName = editValues.firstName.trim();
          namePayload.lastName = editValues.lastName.trim();
        }
        await updateProfileNameAdmin(axiosInstance, userData.id, namePayload);
      } else if (field === "contactFullName") {
        await updateProfileNameAdmin(axiosInstance, userData.id, {
          contactFullName: editValues.contactFullName.trim(),
        });
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

      Object.assign(userData, updates);
      setEditingField(null);
    } catch (error: any) {
      console.error(`Failed to update ${field}:`, error);
      toast.error(error.message || `Failed to update ${field} on server`);

      handleEditCancel();
    } finally {
      setIsUpdating(false);
    }
  };
  const getMissingRequiredFields = (): string[] => {
    const missing: string[] = [];
    const uType = userData?.userType?.toUpperCase();

    if (uType === "HARDWARE") {
      // Hardware has no organizationName — just needs phone and email
      if (!userData?.phone?.trim()) missing.push("Phone Number");
      if (!userData?.email?.trim()) missing.push("Email");
    } else if (isOrganization) {
      if (!userData?.organizationName?.trim())
        missing.push("Organization Name");
      if (!userData?.email?.trim()) missing.push("Email");
      if (!userData?.phone?.trim()) missing.push("Phone Number");
      if (uType === "CONTRACTOR" && !userData?.contactFullName?.trim())
        missing.push("Contact Full Name");
    } else {
      if (!userData?.firstName?.trim()) missing.push("First Name");
      if (!userData?.lastName?.trim()) missing.push("Last Name");
      if (!userData?.email?.trim()) missing.push("Email");
    }

    if (
      (uType === "FUNDI" ||
        uType === "PROFESSIONAL" ||
        uType === "CONTRACTOR") &&
      userData?.experienceStatus === "REJECTED"
    ) {
      missing.push("Experience (rejected — please resubmit before verifying)");
    }

    return missing;
  };
  const handleActionSubmit = async () => {
    if (!actionReason.trim() && pendingAction !== "verify") {
      toast.error("Please enter a reason for this action.");
      return;
    }

    const statusMap: Record<
      string,
      "VERIFY" | "UNVERIFY" | "SUSPEND" | "BLACKLIST" | "DELETE"
    > = {
      verify: "VERIFY",
      unverify: "UNVERIFY",
      suspend: "SUSPEND",
      blacklist: "BLACKLIST",
      delete: "DELETE",
    };

    const status = statusMap[pendingAction ?? ""];
    if (!status) return;

    try {
      await updateAccountStatus(
        axiosInstance,
        userData.id,
        status,
        actionReason || undefined,
      );
      toast.success(
        `User ${getActionLabel(pendingAction ?? "")}d successfully`,
      );

      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (err: any) {
      toast.error(
        err.message ||
          `Failed to ${getActionLabel(pendingAction ?? "").toLowerCase()} user`,
      );
    }

    setPendingAction(null);
    setActionReason("");
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "verify":
        return "Verify";
      case "unverify":
        return "Unverify";
      case "suspend":
        return "Suspend";
      case "blacklist":
        return "Blacklist";
      case "delete":
        return "Delete";
      default:
        return action;
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
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        userData.status === "VERIFIED"
                          ? "bg-green-100 text-green-700"
                          : userData.status === "SUSPENDED"
                            ? "bg-yellow-100 text-yellow-700"
                            : userData.status === "BLACKLISTED"
                              ? "bg-orange-100 text-orange-700"
                              : userData.status === "DELETED"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {userData.status === "VERIFIED" && (
                        <Shield className="w-3.5 h-3.5" />
                      )}
                      {userData.status === "SUSPENDED" && (
                        <ShieldAlert className="w-3.5 h-3.5" />
                      )}
                      {userData.status === "BLACKLISTED" && (
                        <ShieldOff className="w-3.5 h-3.5" />
                      )}
                      {userData.status === "DELETED" && (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      {(userData.status === "SIGNED_UP" ||
                        userData.status === "PENDING") && (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      <span>Status: {displayStatus || "N/A"}</span>
                    </div>

                    {userData.status === "VERIFIED" && (
                      <div className="flex items-center space-x-1">
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
                <div>
                  {/* Actions dropdown — visible based on user type and submission status */}
                  {(() => {
                    const uType = userData?.userType?.toUpperCase();
                    const docStatus = userData?.documentStatus;
                    const expStatus = userData?.experienceStatus;
                    const acctStatus = userData?.status;

                    // Already actioned users (verified, suspended, blacklisted) — always show actions
                    const isAlreadyActioned = [
                      "VERIFIED",
                      "SUSPENDED",
                      "BLACKLISTED",
                    ].includes(acctStatus);

                    // "Submitted" means status is anything other than INCOMPLETE
                    const hasSubmittedDocs =
                      docStatus && (docStatus !== "INCOMPLETE" && docStatus !== "RESUBMIT");
                    const hasSubmittedExperience =
                      expStatus && expStatus !== "INCOMPLETE" && expStatus !== "RESUBMIT";

                    const isBuilder = [
                      "FUNDI",
                      "PROFESSIONAL",
                      "CONTRACTOR",
                    ].includes(uType);
                    const isNonBuilder =
                      uType === "HARDWARE" || uType === "CUSTOMER";

                    const showActions =
                      isAlreadyActioned ||
                      (isBuilder &&
                        hasSubmittedExperience &&
                        hasSubmittedDocs) ||
                      (isNonBuilder && hasSubmittedDocs);

                    if (!showActions) return null;

                    return (
                      <>
                        <div className="mt-6">
                          <div className="relative inline-block">
                            <button
                              type="button"
                              onClick={() =>
                                setShowActionDropdown(!showActionDropdown)
                              }
                              className="bg-blue-800 text-white px-6 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
                            >
                              Actions
                              <FiChevronDown
                                className={`transition-transform ${showActionDropdown ? "rotate-180" : ""}`}
                                size={16}
                              />
                            </button>
                            {showActionDropdown && (
                              <div className="absolute left-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                                {/* Verify — only shown when user is NOT yet verified */}
                                {!showVerificationMessage && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const missing =
                                        getMissingRequiredFields();
                                      if (missing.length > 0) {
                                        toast.error(
                                          `Cannot verify: missing ${missing.join(", ")}`,
                                          { duration: 5000 },
                                        );
                                        setShowActionDropdown(false);
                                        return;
                                      }
                                      setPendingAction("verify");
                                      setShowActionDropdown(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-green-700 font-medium"
                                  >
                                    Verify
                                  </button>
                                )}
                                {/* Unverify — only shown when user IS verified */}
                                {showVerificationMessage && (
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
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPendingAction("suspend");
                                    setShowActionDropdown(false);
                                  }}
                                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-yellow-700"
                                >
                                  Suspend
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPendingAction("blacklist");
                                    setShowActionDropdown(false);
                                  }}
                                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-orange-600"
                                >
                                  Blacklist
                                </button>
                                <div className="border-t my-1" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPendingAction("delete");
                                    setShowActionDropdown(false);
                                  }}
                                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 font-medium"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Reason Modal */}
                        {pendingAction && (
                          <div
                            className={`border px-4 py-4 rounded mt-4 ${
                              pendingAction === "delete" ||
                              pendingAction === "blacklist"
                                ? "bg-red-50 border-red-300 text-red-800"
                                : pendingAction === "verify"
                                  ? "bg-green-50 border-green-300 text-green-800"
                                  : "bg-blue-50 border-blue-300 text-blue-800"
                            }`}
                          >
                            <p className="font-medium mb-2">
                              {pendingAction === "verify"
                                ? "Confirm verification of this user?"
                                : `Please provide a reason for ${getActionLabel(pendingAction).toLowerCase()}ing this user:`}
                            </p>
                            {pendingAction !== "verify" && (
                              <textarea
                                value={actionReason}
                                onChange={(e) =>
                                  setActionReason(e.target.value)
                                }
                                placeholder={`Enter reason for ${getActionLabel(pendingAction).toLowerCase()}...`}
                                className="w-full mt-2 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                              />
                            )}
                            <div className="mt-3 flex flex-wrap gap-3">
                              <button
                                type="button"
                                onClick={handleActionSubmit}
                                className={`text-white px-4 py-2 rounded transition ${
                                  pendingAction === "delete" ||
                                  pendingAction === "blacklist"
                                    ? "bg-red-600 hover:bg-red-700"
                                    : pendingAction === "verify"
                                      ? "bg-green-600 hover:bg-green-700"
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
                      </>
                    );
                  })()}
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
                              <div className="flex items-center space-x-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditSave("contactFullName")
                                  }
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
                                <div className="flex items-center space-x-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleEditSave("contactFullName")
                                    }
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
          </section>
        </div>
      </div>
    </div>
  );
};

export default AccountInfo;
