/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import { FiEdit, FiCheck, FiX, FiChevronDown } from "react-icons/fi";
import { Star } from "lucide-react";

interface AccountInfoProps {
  userData: any;
}

// --- Helper: Deep merge for nested objects ---
const deepMerge = (target: any, source: any): any => {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
};

// --- Helper: update a user in localStorage across all storage keys ---
const updateUserInLocalStorage = (
  userId: string | number,
  updates: Record<string, any>,
) => {
  try {
    // Update in "users" array
    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const userIdx = storedUsers.findIndex((u: any) => u.id === userId || u.id === Number(userId) || u.id === String(userId));
    if (userIdx !== -1) {
      storedUsers[userIdx] = deepMerge(storedUsers[userIdx], updates);
      localStorage.setItem("users", JSON.stringify(storedUsers));
    }

    // Update in "builders" array to sync with admin dashboard
    const storedBuilders = JSON.parse(localStorage.getItem("builders") || "[]");
    const builderIdx = storedBuilders.findIndex((b: any) => b.id === userId || b.id === Number(userId) || b.id === String(userId));
    if (builderIdx !== -1) {
      storedBuilders[builderIdx] = deepMerge(storedBuilders[builderIdx], updates);
      localStorage.setItem("builders", JSON.stringify(storedBuilders));
    }

    // Update in "customers" array to sync with admin dashboard
    const storedCustomers = JSON.parse(localStorage.getItem("customers") || "[]");
    const customerIdx = storedCustomers.findIndex((c: any) => c.id === userId || c.id === Number(userId) || c.id === String(userId));
    if (customerIdx !== -1) {
      storedCustomers[customerIdx] = deepMerge(storedCustomers[customerIdx], updates);
      localStorage.setItem("customers", JSON.stringify(storedCustomers));
    }

    // Also update the single "user" key if it matches
    const singleUser = JSON.parse(localStorage.getItem("user") || "null");
    if (singleUser && (singleUser.id === userId || singleUser.id === Number(userId) || singleUser.id === String(userId))) {
      localStorage.setItem(
        "user",
        JSON.stringify(deepMerge(singleUser, updates)),
      );
    }
  } catch (err) {
    console.error("Failed to update user in localStorage:", err);
  }
};

const AccountInfo: React.FC<AccountInfoProps> = ({ userData }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [askDeleteReason, setAskDeleteReason] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  // Action reason modal state
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const showVerificationMessage = userData.adminApproved;
  const [avatarSrc, setAvatarSrc] = useState(
    userData?.userProfile?.profileImage,
  );

  const [editingField, setEditingField] = useState<string | null>(null);

  // Handle display name - use organizationName for organizations, firstName + lastName for individuals
  const isOrganization = userData?.accountType === "business" || userData?.accountType === "organization" ||
                         userData?.userType === "CONTRACTOR" || userData?.userType === "HARDWARE";
  const name = isOrganization && userData?.organizationName
    ? userData.organizationName
    : `${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`.trim();

  const [editValues, setEditValues] = useState({
    name: name || "",
    email: userData?.email ?? "",
    phoneNumber: userData?.phoneNumber ?? "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // --- Load persisted image from localStorage on component mount ---
  useEffect(() => {
    try {
      // Try loading from users array first
      let image = null;
      
      const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const foundUser = storedUsers.find((u: any) => u.id === userData.id);
      if (foundUser?.userProfile?.profileImage) {
        image = foundUser.userProfile.profileImage;
        console.log("✅ Image loaded from users array");
      }
      
      // If not found, try builders array
      if (!image) {
        const storedBuilders = JSON.parse(localStorage.getItem("builders") || "[]");
        const foundBuilder = storedBuilders.find((b: any) => b.id === userData.id);
        if (foundBuilder?.userProfile?.profileImage) {
          image = foundBuilder.userProfile.profileImage;
          console.log("✅ Image loaded from builders array");
        }
      }
      
      // If not found, try user key
      if (!image) {
        const singleUser = JSON.parse(localStorage.getItem("user") || "null");
        if (singleUser?.id === userData.id && singleUser?.userProfile?.profileImage) {
          image = singleUser.userProfile.profileImage;
          console.log("✅ Image loaded from user key");
        }
      }
      
      // If not found, try profile key
      if (!image) {
        const profileData = JSON.parse(localStorage.getItem("profile") || "null");
        if (profileData?.id === userData.id && profileData?.userProfile?.profileImage) {
          image = profileData.userProfile.profileImage;
          console.log("✅ Image loaded from profile key");
        }
      }
      
      // If still not found, use passed prop
      if (!image && userData?.userProfile?.profileImage) {
        image = userData.userProfile.profileImage;
        console.log("✅ Image loaded from userData prop");
      }
      
      if (image) {
        setAvatarSrc(image);
      }
    } catch (err) {
      console.error("Failed to load persisted image:", err);
    }
  }, [userData.id]);

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
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        
        // Set state immediately to show preview
        setAvatarSrc(base64String);
        
        // Update userData object in-place
        if (!userData.userProfile) {
          userData.userProfile = {};
        }
        userData.userProfile.profileImage = base64String;
        
        // Persist to all localStorage keys
        try {
          // Update "users" array
          const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
          const userIdx = storedUsers.findIndex((u: any) => u.id === userData.id);
          if (userIdx !== -1) {
            storedUsers[userIdx] = deepMerge(storedUsers[userIdx], {
              userProfile: {
                ...(storedUsers[userIdx].userProfile || {}),
                profileImage: base64String,
              },
            });
            localStorage.setItem("users", JSON.stringify(storedUsers));
            console.log("✅ Image saved to users array");
          }

          // Update "builders" array
          const storedBuilders = JSON.parse(localStorage.getItem("builders") || "[]");
          const builderIdx = storedBuilders.findIndex((b: any) => b.id === userData.id);
          if (builderIdx !== -1) {
            storedBuilders[builderIdx] = deepMerge(storedBuilders[builderIdx], {
              userProfile: {
                ...(storedBuilders[builderIdx].userProfile || {}),
                profileImage: base64String,
              },
            });
            localStorage.setItem("builders", JSON.stringify(storedBuilders));
            console.log("✅ Image saved to builders array");
          }

          // Update single "user" key
          const singleUser = JSON.parse(localStorage.getItem("user") || "null");
          if (singleUser && singleUser.id === userData.id) {
            const updated = deepMerge(singleUser, {
              userProfile: {
                ...(singleUser.userProfile || {}),
                profileImage: base64String,
              },
            });
            localStorage.setItem("user", JSON.stringify(updated));
            console.log("✅ Image saved to user key");
          }

          // Update profile key (if exists)
          const profileData = JSON.parse(localStorage.getItem("profile") || "null");
          if (profileData && profileData.id === userData.id) {
            const updated = deepMerge(profileData, {
              userProfile: {
                ...(profileData.userProfile || {}),
                profileImage: base64String,
              },
            });
            localStorage.setItem("profile", JSON.stringify(updated));
            console.log("✅ Image saved to profile key");
          }

          // Update customers array if exists
          const storedCustomers = JSON.parse(localStorage.getItem("customers") || "[]");
          const customerIdx = storedCustomers.findIndex((c: any) => c.id === userData.id);
          if (customerIdx !== -1) {
            storedCustomers[customerIdx] = deepMerge(storedCustomers[customerIdx], {
              userProfile: {
                ...(storedCustomers[customerIdx].userProfile || {}),
                profileImage: base64String,
              },
            });
            localStorage.setItem("customers", JSON.stringify(storedCustomers));
            console.log("✅ Image saved to customers array");
          }

          event.target.value = ""; // Reset input
          alert("Image uploaded successfully and persisted!");
        } catch (err) {
          console.error("Error persisting image:", err);
          alert("Image uploaded but failed to persist. Please try again.");
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
      name: name || "",
      email: userData?.email || "",
      phoneNumber: userData?.phoneNumber || "",
    });
  };

  const handleEditCancel = () => {
    setEditingField(null);
    setEditValues({
      name: name || "",
      email: userData?.email || "",
      phoneNumber: userData?.phoneNumber || "",
    });
  };

  const handleEditChange = (field: string, value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // --- localStorage-based edit save ---
  const handleEditSave = (field: string) => {
    if (!editValues[field]?.trim()) {
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
            updates.organizationName = editValues.name.trim();
          } else {
            const parts = editValues.name.trim().split(" ");
            updates.firstName = parts[0] || "";
            updates.lastName = parts.slice(1).join(" ") || "";
          }
          break;
        }
        case "email":
          updates.email = editValues.email;
          break;
        case "phoneNumber":
          updates.phoneNumber = editValues.phoneNumber;
          break;
        default:
          throw new Error("Invalid field");
      }

      // Update userData in-place for the current render
      Object.assign(userData, updates);
      // Persist to localStorage
      updateUserInLocalStorage(userData.id, updates);

      setEditingField(null);
      alert(
        `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`,
      );
    } catch (error: any) {
      console.error(`Failed to update ${field}:`, error);
      alert(error.message || `Failed to update ${field}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // --- localStorage-based action handlers ---
  const handleBlackList = (reason: string) => {
    updateUserInLocalStorage(userData.id, {
      blacklisted: true,
      blacklistReason: reason,
      blacklistDate: new Date().toISOString()
    });
    Object.assign(userData, { blacklisted: true, blacklistReason: reason });
    alert("User blacklisted successfully");
  };

  const handleWhiteList = () => {
    updateUserInLocalStorage(userData.id, { blacklisted: false });
    Object.assign(userData, { blacklisted: false });
    alert("User whitelisted successfully");
  };

  const handleSuspend = (reason: string) => {
    updateUserInLocalStorage(userData.id, {
      suspended: true,
      suspendReason: reason,
      suspendDate: new Date().toISOString()
    });
    Object.assign(userData, { suspended: true, suspendReason: reason });
    alert("User suspended successfully");
  };

  const handleUnverifyUser = (reason: string) => {
    updateUserInLocalStorage(userData.id, {
      adminApproved: false,
      approved: false,
      unverifyReason: reason,
      unverifyDate: new Date().toISOString()
    });
    Object.assign(userData, { adminApproved: false, approved: false, unverifyReason: reason });
    alert("User unverified successfully");
  };

  // Handle action with reason submission
  const handleActionSubmit = () => {
    if (!actionReason.trim()) {
      alert("Please enter a reason for this action.");
      return;
    }

    switch (pendingAction) {
      case "unverify":
        handleUnverifyUser(actionReason);
        break;
      case "suspend":
        handleSuspend(actionReason);
        break;
      case "blacklist":
        handleBlackList(actionReason);
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
                  src={avatarSrc}
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
                              value={editValues.name}
                              onChange={(e) => handleEditChange("name", e.target.value)}
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
                        {editingField === "phoneNumber" ? (
                          <>
                            <input
                              type="tel"
                              value={editValues.phoneNumber}
                              onChange={(e) => handleEditChange("phoneNumber", e.target.value)}
                              className="w-full px-4 py-2 outline-none bg-transparent"
                              disabled={isUpdating}
                            />
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditSave("phoneNumber")}
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
                              value={userData?.phoneNumber || "N/A"}
                              className="w-full px-4 py-2 outline-none bg-transparent"
                              readOnly
                            />
                            <button
                              type="button"
                              onClick={() => handleEditStart("phoneNumber")}
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
                      <div className="flex items-center border-b focus-within:border-blue-900 transition">
                        {editingField === "name" ? (
                          <>
                            <input
                              type="text"
                              value={editValues.name}
                              onChange={(e) =>
                                handleEditChange("name", e.target.value)
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
                        {editingField === "phoneNumber" ? (
                          <>
                            <input
                              type="tel"
                              value={editValues.phoneNumber}
                              onChange={(e) =>
                                handleEditChange("phoneNumber", e.target.value)
                              }
                              className="w-full px-4 py-2 outline-none bg-transparent"
                              disabled={isUpdating}
                            />
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditSave("phoneNumber")}
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
                              value={userData.phoneNumber || ""}
                              className="w-full px-4 py-2 outline-none bg-transparent"
                              readOnly
                            />
                            <button
                              type="button"
                              onClick={() => handleEditStart("phoneNumber")}
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
                    className={`text-white px-4 py-2 rounded transition ${
                      pendingAction === "blacklist"
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