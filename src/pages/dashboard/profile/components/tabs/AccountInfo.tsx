/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
import { Avatar } from "@material-tailwind/react";
import { FiEdit, FiCheck, FiX } from "react-icons/fi";
import { Star } from "lucide-react";

interface AccountInfoProps {
  userData: any;
}

// --- Helper: update a user in localStorage "users" array ---
const updateUserInLocalStorage = (
  userId: string,
  updates: Record<string, any>,
) => {
  try {
    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const idx = storedUsers.findIndex((u: any) => u.id === userId);
    if (idx !== -1) {
      storedUsers[idx] = { ...storedUsers[idx], ...updates };
      localStorage.setItem("users", JSON.stringify(storedUsers));
    }
    // Also update the single "user" key if it matches
    const singleUser = JSON.parse(localStorage.getItem("user") || "null");
    if (singleUser && singleUser.id === userId) {
      localStorage.setItem(
        "user",
        JSON.stringify({ ...singleUser, ...updates }),
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const showVerificationMessage = userData.adminApproved;
  const [avatarSrc, setAvatarSrc] = useState(
    userData?.userProfile?.profileImage,
  );

  const [editingField, setEditingField] = useState<string | null>(null);
  const name = `${userData.firstName ?? ""} ${userData.lastName ?? ""}`.trim();
  const [editValues, setEditValues] = useState({
    name: name || "",
    email: userData.email ?? "",
    phoneNumber: userData.phoneNumber ?? "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // --- localStorage-based image change ---
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const localUrl = URL.createObjectURL(file);
      setAvatarSrc(localUrl);
      updateUserInLocalStorage(userData.id, {
        userProfile: {
          ...(userData.userProfile || {}),
          profileImage: localUrl,
        },
      });
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
      email: userData.email || "",
      phoneNumber: userData.phoneNumber || "",
    });
  };

  const handleEditCancel = () => {
    setEditingField(null);
    setEditValues({
      name: name || "",
      email: userData.email || "",
      phoneNumber: userData.phoneNumber || "",
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
          const parts = editValues.name.trim().split(" ");
          updates.firstName = parts[0] || "";
          updates.lastName = parts.slice(1).join(" ") || "";
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
  const handleBlackList = () => {
    updateUserInLocalStorage(userData.id, { blacklisted: true });
    Object.assign(userData, { blacklisted: true });
    alert("User blacklisted successfully");
  };

  const handleWhiteList = () => {
    updateUserInLocalStorage(userData.id, { blacklisted: false });
    Object.assign(userData, { blacklisted: false });
    alert("User whitelisted successfully");
  };

  const handleSuspend = () => {
    updateUserInLocalStorage(userData.id, { suspended: true });
    Object.assign(userData, { suspended: true });
    alert("User suspended successfully");
  };

  const handleUnverifyUser = () => {
    updateUserInLocalStorage(userData.id, {
      adminApproved: false,
      approved: false,
    });
    Object.assign(userData, { adminApproved: false, approved: false });
    alert("User unverified successfully");
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
                <Avatar
                  size="sm"
                  alt="avatar"
                  src={avatarSrc}
                  placeholder={undefined}
                  onResize={undefined}
                  onResizeCapture={undefined}
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                />
                <button
                  type="button"
                  onClick={handleButtonClick}
                  className="mt-4 text-blue-900 hover:text-blue-700 text-sm font-medium"
                >
                  Change Photo
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

                {/* HARDWARE SPECIFIC SECTION */}
                {userData?.userType === "HARDWARE" && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg mb-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        Hardware Name
                      </label>
                      <div className="flex items-center border-b focus-within:border-blue-900 transition">
                        <input
                          type="text"
                          value={userData.organizationName || ""}
                          className="w-full px-4 py-2 outline-none bg-transparent"
                          readOnly
                        />
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold pt-4 border-t">
                      Contact Person
                    </h3>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        Full Name
                      </label>
                      <div className="flex items-center border-b focus-within:border-blue-900 transition">
                        <input
                          type="text"
                          value={`${userData.contactFirstName || ""} ${userData.contactLastName || ""}`}
                          className="w-full px-4 py-2 outline-none bg-transparent"
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        Contact Phone
                      </label>
                      <div className="flex items-center border-b focus-within:border-blue-900 transition">
                        <input
                          type="text"
                          value={userData.contactPhone || ""}
                          className="w-full px-4 py-2 outline-none bg-transparent"
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        Contact Email
                      </label>
                      <div className="flex items-center border-b focus-within:border-blue-900 transition">
                        <input
                          type="text"
                          value={userData.contactEmail || ""}
                          className="w-full px-4 py-2 outline-none bg-transparent"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                )}

                {userData?.userType !== "HARDWARE" && (
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
                    className="bg-blue-800 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
                  >
                    Actions
                  </button>
                  {showActionDropdown && (
                    <div className="absolute left-0 mt-2 w-44 bg-white border rounded shadow-lg z-50">
                      <button
                        type="button"
                        onClick={() => {
                          handleUnverifyUser();
                          setShowActionDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Unverify
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSuspend();
                          setShowActionDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Suspend
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleBlackList();
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