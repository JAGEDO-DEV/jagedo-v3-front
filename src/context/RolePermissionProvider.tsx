import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { MenuItem, Role } from "@/types/permissions";
import { getCurrentUserMenuPermissions, getAllRoles } from "@/api/rolePermissions.api";
import { useGlobalContext } from "./GlobalProvider";

interface RolePermissionContextType {
  userMenuPermissions: MenuItem[];
  allRoles: Role[];
  isLoadingPermissions: boolean;
  isLoadingRoles: boolean;
  permissionsError: string | null;
  rolesError: string | null;
  refreshPermissions: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  canAccessMenuItem: (menuItemId: string) => boolean;
  hasAnyPermission: (menuItemIds: string[]) => boolean;
}

const RolePermissionContext = createContext<RolePermissionContextType | undefined>(undefined);

// Default admin menu items - shown when user is not logged in or permissions fail to load
const DEFAULT_ADMIN_MENU_ITEMS: MenuItem[] = [
  { id: "home", title: "Home", category: "Overview" },
  { id: "user-management", title: "User Management", category: "Management" },
  { id: "bulk-sms", title: "Bulk SMS", category: "Management" },
  { id: "jobs", title: "Jobs", category: "Management" },
  { id: "orders", title: "Orders", category: "Management" },
  { id: "shop-products", title: "Products", category: "Management - Shop App" },
  { id: "shop-customer-view", title: "Customer View", category: "Management - Shop App" },
  { id: "shop-categories", title: "Categories", category: "Management - Shop App" },
  { id: "shop-attributes", title: "Attributes", category: "Management - Shop App" },
  { id: "shop-regions", title: "Regions", category: "Management - Shop App" },
  { id: "shop-prices", title: "Prices", category: "Management - Shop App" },
  { id: "registers-customers", title: "Customers", category: "Management - Registers" },
  { id: "registers-builders", title: "Builders", category: "Management - Registers" },
  { id: "analytics", title: "Analytics", category: "Management" },
  { id: "configuration", title: "Configuration", category: "Configurations" },
];

export const RolePermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isLoggedIn, user } = useGlobalContext();
  const [userMenuPermissions, setUserMenuPermissions] = useState<MenuItem[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [cachedUserId, setCachedUserId] = useState<string | null>(null);

  // Load user's menu permissions with localStorage caching
  const refreshPermissions = async () => {
    // Check if user has a token (either from context or localStorage)
    const hasToken = localStorage.getItem("token");
    
    if (!isLoggedIn && !hasToken) {
      setUserMenuPermissions([]);
      setIsLoadingPermissions(false);
      return;
    }

    setIsLoadingPermissions(true);
    setPermissionsError(null);
    try {
      const permissions = await getCurrentUserMenuPermissions();
      setUserMenuPermissions(permissions || []);
      // Persist permissions to localStorage for instant access on next load
      if (permissions && permissions.length > 0) {
        localStorage.setItem("cachedPermissions", JSON.stringify(permissions));
        // Store the user ID to validate cache belongs to current user
        if (user?.id) {
          localStorage.setItem("cachedPermissionsUserId", String(user.id));
          setCachedUserId(String(user.id));
        }
      }
    } catch (error: any) {
      console.error("Failed to load user menu permissions:", error);
      setPermissionsError(error.message);
      // Try to restore from cache if API fails, but only if it belongs to the current user
      const cached = localStorage.getItem("cachedPermissions");
      const cachedId = localStorage.getItem("cachedPermissionsUserId");
      if (cached && cachedId === String(user?.id)) {
        try {
          const cachedPermissions = JSON.parse(cached);
          setUserMenuPermissions(cachedPermissions);
        } catch (e) {
          // Fallback to default menu items for admin users
          if (user?.userType === "ADMIN") {
            setUserMenuPermissions(DEFAULT_ADMIN_MENU_ITEMS);
          } else {
            setUserMenuPermissions([]);
          }
        }
      } else {
        // Fallback to default menu items for admin users when API fails
        if (user?.userType === "ADMIN") {
          setUserMenuPermissions(DEFAULT_ADMIN_MENU_ITEMS);
        } else {
          setUserMenuPermissions([]);
        }
      }
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  // Load all available roles
  const refreshRoles = async () => {
    if (!isLoggedIn) {
      setAllRoles([]);
      setIsLoadingRoles(false);
      return;
    }

    setIsLoadingRoles(true);
    setRolesError(null);
    try {
      const roles = await getAllRoles();
      setAllRoles(roles);
    } catch (error: any) {
      console.error("Failed to load roles:", error);
      setRolesError(error.message);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  // Initialize permissions on mount (in case token exists but isLoggedIn hasn't updated yet)
  // Also restore from cache if available, but only if it belongs to the current user
  useEffect(() => {
    const hasToken = localStorage.getItem("token");
    
    // Only restore from cache if user is logged in and has a token
    if (!hasToken) {
      setUserMenuPermissions([]);
      setCachedUserId(null);
      setIsLoadingPermissions(false);
      return;
    }
    
    // Restore from cache immediately for better UX, but validate it belongs to current user
    const cached = localStorage.getItem("cachedPermissions");
    const cachedId = localStorage.getItem("cachedPermissionsUserId");
    const currentUserId = user?.id ? String(user.id) : null;
    
    if (cached && cachedId && cachedId === currentUserId) {
      try {
        const cachedPermissions = JSON.parse(cached);
        setUserMenuPermissions(cachedPermissions);
        setCachedUserId(cachedId);
      } catch (e) {
        console.error("Failed to parse cached permissions:", e);
        // Fallback to default menu items for admin users
        if (user?.userType === "ADMIN") {
          setUserMenuPermissions(DEFAULT_ADMIN_MENU_ITEMS);
        } else {
          setUserMenuPermissions([]);
        }
      }
    } else {
      // Use default menu items for admin users, or clear for others
      if (user?.userType === "ADMIN") {
        setUserMenuPermissions(DEFAULT_ADMIN_MENU_ITEMS);
      } else {
        setUserMenuPermissions([]);
      }
      setCachedUserId(null);
    }
    
    // Then refresh from API if token exists
    if (hasToken) {
      refreshPermissions();
      refreshRoles();
    } else {
      setIsLoadingPermissions(false);
    }
  }, [user?.id]);

  // Also load permissions when isLoggedIn changes
  useEffect(() => {
    if (isLoggedIn) {
      refreshPermissions();
      refreshRoles();
    } else {
      // Clear state and cache when logging out
      setUserMenuPermissions([]);
      setAllRoles([]);
      setCachedUserId(null);
      localStorage.removeItem("cachedPermissions");
      localStorage.removeItem("cachedPermissionsUserId");
    }
  }, [isLoggedIn]);

  // Helper function to check if user can access a specific menu item
  const canAccessMenuItem = (menuItemId: string): boolean => {
    return userMenuPermissions.some((item) => item.id === menuItemId);
  };

  // Helper function to check if user has access to any of the provided menu items
  const hasAnyPermission = (menuItemIds: string[]): boolean => {
    return menuItemIds.some((id) => canAccessMenuItem(id));
  };

  const value: RolePermissionContextType = {
    userMenuPermissions,
    allRoles,
    isLoadingPermissions,
    isLoadingRoles,
    permissionsError,
    rolesError,
    refreshPermissions,
    refreshRoles,
    canAccessMenuItem,
    hasAnyPermission,
  };

  return (
    <RolePermissionContext.Provider value={value}>
      {children}
    </RolePermissionContext.Provider>
  );
};

export const useRolePermissions = (): RolePermissionContextType => {
  const context = useContext(RolePermissionContext);
  
  // If provider is not available, return empty permissions (restricted access)
  if (context === undefined) {
    return {
      userMenuPermissions: [],
      allRoles: [],
      isLoadingPermissions: false,
      isLoadingRoles: false,
      permissionsError: null,
      rolesError: null,
      refreshPermissions: async () => {},
      refreshRoles: async () => {},
      canAccessMenuItem: () => false, // Deny all by default for security
      hasAnyPermission: () => false,
    };
  }
  
  return context;
};
