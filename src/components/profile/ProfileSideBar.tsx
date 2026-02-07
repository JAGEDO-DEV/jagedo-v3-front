//@ts-nocheck
import { useState, useMemo, useEffect } from "react";
import {
  Card,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
} from "@material-tailwind/react";
import {
  FaUser,
  FaHome,
  FaBoxes,
  FaBriefcase,
  FaShoppingCart,
  FaArrowLeft,
  FaClock,
  FaBars,
  FaTimes
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function ProfileSide({ activeComponent, setActiveComponent, user, completionStatus }) {
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  const baseNavItems = [
    {
      id: "Account Info",
      label: "Account Info",
      icon: <FaUser className="h-5 w-5 text-blue-600" />,
    },
    {
      id: "Address",
      label: "Address",
      icon: <FaHome className="h-5 w-5 text-green-600" />,
    },
    {
      id: "Account Uploads",
      label: "Account Uploads",
      icon: <FaBoxes className="h-5 w-5 text-purple-600" />,
    },
  ];

  const experienceItem = {
    id: "Experience",
    label: "Experience",
    icon: <FaBriefcase className="h-5 w-5 text-yellow-600" />,
  };

  const productsItem = {
    id: "Products",
    label: "Products",
    icon: <FaShoppingCart className="h-5 w-5 text-red-600" />,
  };

  const activitiesItem = {
    id: "Activities",
    label: "Activities",
    icon: <FaClock className="h-5 w-5 text-red-600" />,
  };

  const userType = user?.userType?.toLowerCase();
  const verified = user?.adminApproved;

  const filteredBaseNavItems = baseNavItems.filter(
    (item) => !(userType === "admin" && item.id === "Account Uploads")
  );

  const finalNavItems = [];

  finalNavItems.push(
    filteredBaseNavItems.find(i => i.id === "Account Info"),
    filteredBaseNavItems.find(i => i.id === "Address"),
  );

  if (userType !== "customer" && userType !== "hardware" && userType !== "admin") {
    finalNavItems.push(experienceItem);
  }

  const uploadsItem = filteredBaseNavItems.find(i => i.id === "Account Uploads");
  if (uploadsItem) finalNavItems.push(uploadsItem);

  if ((userType === "professional" || userType === "fundi") && verified) {
    finalNavItems.push(productsItem);
  }

  finalNavItems.push(activitiesItem);

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <Card
        className={`fixed top-0 bottom-0 left-0 transition-all duration-300 ease-in-out shadow-xl rounded-r-xl bg-white border-r border-gray-200 flex flex-col overflow-hidden 
          ${isMobileOpen ? "w-64 z-50" : "w-16"} 
          sm:w-64 lg:w-80
        `}
      >
        {/* Header Section */}
        <div className="p-4 sm:p-6 lg:p-8 border-b border-gray-200">

          {/* Controls: Menu Toggle (Mobile) + Back Button */}
          <div className="flex flex-col gap-4 sm:gap-0">
            {/* Mobile Toggle Button */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="sm:hidden flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-gray-100 mb-2 transition-colors"
            >
              {isMobileOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
            </button>

            {/* Back Button */}
            <button
              onClick={handleBack}
              className="flex items-center justify-center sm:justify-start w-full gap-3 text-gray-700 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              <FaArrowLeft className="h-5 w-5" />
              {/* Show 'Back' text if mobile menu is open OR if on desktop */}
              <span className={`font-semibold ${isMobileOpen ? "inline" : "hidden"} sm:inline`}>
                Back
              </span>
            </button>
          </div>

          {/* Title Area - Hidden on mobile closed state */}
          <div className={`text-center mt-6 ${isMobileOpen ? "block" : "hidden"} sm:block`}>
            <Typography variant="h5" color="blue-gray" className="font-bold">
              Profile Management
            </Typography>
            <Typography variant="small" color="gray" className="mt-1">
              Manage your account settings
            </Typography>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6 scrollbar-hide">
          <List className="space-y-1">
            {finalNavItems.filter(Boolean).map((item) => {
              const isActive = activeComponent === item.id;
              const status = completionStatus[item.id] || 'incomplete';
              const isComplete = status === 'complete';
              const showStatus = item.id !== 'Activities';

              return (
                <ListItem
                  key={item.id}
                  onClick={() => {
                    setActiveComponent(item.id);
                    setIsMobileOpen(false); 
                  }}
                  className={`hover:bg-blue-50 transition-all duration-200 cursor-pointer flex items-center gap-4 rounded-xl px-1.5 py-3 ${isActive
                      ? "bg-blue-100 text-blue-700 font-bold"
                      : "text-gray-700"
                    }`}
                >
                  <ListItemPrefix>
                    <div>
                      {item.icon}
                    </div>
                  </ListItemPrefix>

                  {/* Show Label if mobile menu is open OR on desktop */}
                  <span className={`text-sm font-medium flex-1 ${isMobileOpen ? "inline" : "hidden"} sm:inline`}>
                    {item.label}
                  </span>

                  {/* Show Status if mobile menu is open OR on desktop */}
                  {showStatus && (
                    <span
                      className={`ml-auto text-xs font-semibold ${isComplete ? 'text-green-600' : 'text-red-600'} 
                      ${isMobileOpen ? "inline" : "hidden"} sm:inline`}
                    >
                      {isComplete ? 'Complete' : 'Incomplete'}
                    </span>
                  )}
                </ListItem>
              );
            })}
          </List>
        </div>
      </Card>
    </>
  );
}

export default ProfileSide;