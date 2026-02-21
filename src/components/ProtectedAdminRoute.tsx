import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRolePermissions } from "@/context/RolePermissionProvider";
import { hasMenuAccess, canPerformOperation } from "@/utils/adminPermissions";

/**
 * Protected Admin Route Component
 * 
 * Protects admin routes and checks both authentication and permissions
 * 
 * Usage:
 *   <Route element={<ProtectedAdminRoute requiredMenu="jobs" requiredOperation="VIEW" />}>
 *     <Route path="/admin/jobs" element={<JobsPage />} />
 *   </Route>
 */
export const ProtectedAdminRoute = ({
  requiredMenu = null,
  requiredOperation = "VIEW",
  fallback = "/403",
  fallbackIfNotAdmin = "/login",
  children = null,
}) => {
  const location = useLocation();
  const { userMenuPermissions, isLoadingPermissions } = useRolePermissions();

  // Get user from localStorage
  const userStr = localStorage.getItem("user");
  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch {
    user = null;
  }
  const token = localStorage.getItem("token");

  // Check authentication - if not authenticated, redirect to login
  if (!token || !user) {
    return <Navigate to={fallbackIfNotAdmin} state={{ from: location }} replace />;
  }

  // Check if user is admin
  const isAdmin =
    user.userType === "ADMIN";

  if (!isAdmin) {
    return (
      <Navigate to={fallbackIfNotAdmin} state={{ from: location }} replace />
    );
  }

  // While checking permissions, show a loading state
  if (isLoadingPermissions) {
    return <div className="p-8 text-center">Loading permissions...</div>;
  }

  // If specific menu access is required, check it
  if (requiredMenu) {
    const hasAccess = hasMenuAccess(userMenuPermissions, requiredMenu);

    if (!hasAccess) {
      console.warn(
        `User ${user.id} attempted to access ${requiredMenu} without permission`
      );
      return <Navigate to={fallback} state={{ from: location }} replace />;
    }

    // Check operation permission if required
    if (requiredOperation && requiredOperation !== "NONE") {
      const canPerform = canPerformOperation(
        userMenuPermissions,
        requiredMenu,
        requiredOperation
      );

      if (!canPerform) {
        console.warn(
          `User ${user.id} attempted operation ${requiredOperation} on ${requiredMenu} without permission`
        );
        return <Navigate to={fallback} state={{ from: location }} replace />;
      }
    }
  }

  // Authorized, render children
  return <Outlet />;
};

/**
 * Component-level permission check hook
 * Use this inside admin components to conditionally render based on permissions
 */
export const useAdminPermission = (requiredMenu = null, requiredOperation = "VIEW") => {
  const { userMenuPermissions, isLoadingPermissions } = useRolePermissions();

  const hasAccess = requiredMenu
    ? hasMenuAccess(userMenuPermissions, requiredMenu) &&
      (requiredOperation === "NONE" ||
        canPerformOperation(
          userMenuPermissions,
          requiredMenu,
          requiredOperation
        ))
    : true;

  return {
    hasAccess,
    isLoading: isLoadingPermissions,
    canViewMenu: (menuId) => hasMenuAccess(userMenuPermissions, menuId),
    canPerformOp: (menuId, op) =>
      canPerformOperation(userMenuPermissions, menuId, op),
  };
};

/**
 * Wrapper component to protect admin pages with permission checks
 */
export const AdminPageGuard = ({
  requiredMenu,
  children,
  fallback = <Navigate to="/403" replace />,
  loadingComponent = <div className="p-8 text-center">Loading...</div>,
}) => {
  const { hasAccess, isLoading } = useAdminPermission(requiredMenu, "VIEW");

  if (isLoading) {
    return loadingComponent;
  }

  if (!hasAccess) {
    return fallback;
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
