import { Navigate, Outlet, useLocation } from "react-router-dom";

// Define the User type according to the provided user object structure
interface User {
  email: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  country: string;
  state: string;
  county: string;
  password: string;
  gender: string;
  contactfirstName: string;
  contactlastName: string;
  contactPhone: string;
  contactEmail: string;
  userType: string;
  admin_approved?: boolean; // Only present for fundi, contractor, professional
  [key: string]: any; // Allow for extra properties
}

// Utility to get user and token from localStorage
function getAuthData() {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  let user: User | null = null;
  try {
    user = userStr ? (JSON.parse(userStr) as User) : null;
  } catch {
    user = null;
  }
  return { token, user };
}

interface ProtectedRouteProps {
  allowedRoles?: string[];
  requireAdminApproved?: boolean;
  fallback?: string;
  fallbackIfNotApproved?: string;
}

const ProtectedRoute = ({
  allowedRoles = [],
  requireAdminApproved = false,
  fallback = "/403",
  fallbackIfNotApproved = "/profile",
}: ProtectedRouteProps) => {
  const location = useLocation();
  const { token, user } = getAuthData();

  // If no token or user, redirect to 403
  if (!token || !user) {
    return <Navigate to={fallback} state={{ from: location }} replace />;
  }

  // If route requires specific roles (support `userType` and legacy `role`)
  const role = (user.userType || user.role || '')?.toString?.().toUpperCase();
  const allowedNormalized = allowedRoles.map((r) => r.toString().toUpperCase());

  if (allowedRoles.length > 0 && !allowedNormalized.includes(role)) {
    return <Navigate to={fallback} state={{ from: location }} replace />;
  }

  // If admin approval is required (for fundi, contractor, professional)
  if (requireAdminApproved && user.status !== "VERIFIED") {
    return <Navigate to={fallbackIfNotApproved} state={{ from: location }} replace />;
  }

  // Authorized, render children
  return <Outlet />;
};

export default ProtectedRoute;
