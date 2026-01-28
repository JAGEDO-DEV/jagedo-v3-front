//@ts-nocheck
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
  FaClock
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function ProfileSide({ activeComponent, setActiveComponent, user }) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  // Base core items (NO Activities here)
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

  const renderListItem = (item) => {
    const isActive = activeComponent === item.id;
    return (
      <ListItem
        key={item.id}
        onClick={() => setActiveComponent(item.id)}
        className={`hover:bg-blue-50 transition-all duration-200 cursor-pointer flex items-center justify-center sm:justify-start gap-3 rounded-lg p-2 sm:p-3 m-1 sm:m-0 ${
          isActive
            ? "bg-blue-100 text-blue-700 font-semibold"
            : "text-gray-700"
        }`}
      >
        <ListItemPrefix>{item.icon}</ListItemPrefix>
        <span className="hidden sm:inline">{item.label}</span>
      </ListItem>
    );
  };

  const userType = user?.userType?.toLowerCase();
  const verified = user?.adminApproved;

  // Remove uploads for admin
  const filteredBaseNavItems = baseNavItems.filter(
    (item) => !(userType === "admin" && item.id === "Account Uploads")
  );

  /* 
    FINAL ORDER (STRICT):
    1. Account Info
    2. Address
    3. Experience (if allowed)
    4. Account Uploads
    5. Products (if allowed)
    6. Activities (ALWAYS LAST)
  */

  const finalNavItems = [];

  // 1 & 2
  finalNavItems.push(
    filteredBaseNavItems.find(i => i.id === "Account Info"),
    filteredBaseNavItems.find(i => i.id === "Address"),
  );

  // 3 Experience (for all except customer/hardware/admin)
  if (userType !== "customer" && userType !== "hardware" && userType !== "admin") {
    finalNavItems.push(experienceItem);
  }

  // 4 Account Uploads
  const uploadsItem = filteredBaseNavItems.find(i => i.id === "Account Uploads");
  if (uploadsItem) finalNavItems.push(uploadsItem);

  // 5 Products (only professional/fundi & verified)
  if ((userType === "professional" || userType === "fundi") && verified) {
    finalNavItems.push(productsItem);
  }

  // 6 Activities ALWAYS LAST
  finalNavItems.push(activitiesItem);

  return (
    <Card className="fixed top-0 bottom-0 left-0 w-16 sm:w-64 lg:w-80 p-0 sm:p-4 shadow-xl rounded-r-xl bg-white border-r border-gray-200">
      <div className="p-2 sm:p-4 lg:p-6">
        <button
          onClick={handleBack}
          className="flex items-center justify-center sm:justify-start w-full gap-3 text-gray-700 hover:text-blue-600 transition-colors mb-4 p-2 rounded-lg hover:bg-gray-100"
        >
          <FaArrowLeft className="h-5 w-5" />
          <span className="font-semibold hidden sm:inline">Back</span>
        </button>

        <div className="mb-0 sm:mb-6 p-0 sm:p-4 text-center border-b border-gray-300 hidden sm:block">
          <Typography variant="h5" color="blue-gray" className="font-bold">
            Profile Management
          </Typography>
          <Typography variant="small" color="gray" className="mt-1">
            Manage your account settings
          </Typography>
        </div>

        <List className="space-y-2">
          {finalNavItems.filter(Boolean).map(renderListItem)}
        </List>
      </div>
    </Card>
  );
}

export default ProfileSide;
