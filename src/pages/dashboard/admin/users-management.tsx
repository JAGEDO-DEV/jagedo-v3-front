import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAllRoles,
  getAllMenuItems,
  getAllAdminUsers,
} from "@/api/rolePermissions.api";
import { UserManagementSection } from "./user-management-section";
import { RoleManagementSection } from "./role-management-section";
import { UserStatsCards } from "./user-stats-cards";
import { useAdminPermission, AdminPageGuard } from "@/components/ProtectedAdminRoute";
import { useRolePermissions } from "@/context/RolePermissionProvider";
import { useGlobalContext } from "@/context/GlobalProvider";
import { canPerformOperation } from "@/utils/adminPermissions";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";

const UserManagement = () => {
  // Data state
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get current user info
  const { user } = useGlobalContext();

  // Check if current user is SUPER_ADMIN
  // Use isSuperAdmin flag from backend if available, otherwise check userType
  const isSuperAdmin = 
    user?.isSuperAdmin === true ||
    (user?.userType && String(user.userType).toUpperCase() === 'SUPER_ADMIN') ||
    // Also check roles array if it exists (fallback for older data)
    (user?.roles &&
      Array.isArray(user.roles) &&
      user.roles.some((r: any) => {
        if (typeof r === "string") return r?.toUpperCase?.() === "SUPER_ADMIN";
        return r?.name?.toUpperCase?.() === "SUPER_ADMIN" || r?.isSuperAdmin === true;
      }));

  // Check permissions for user-management menu
  const { hasAccess, isLoading: permissionsLoading } = useAdminPermission('user-management', 'VIEW');
  const { userMenuPermissions } = useRolePermissions();


  // Check specific user-management operations
  const canView = canPerformOperation(userMenuPermissions, 'user-management', 'VIEW');
  const canCreate = canPerformOperation(userMenuPermissions, 'user-management', 'CREATE');
  const canUpdate = canPerformOperation(userMenuPermissions, 'user-management', 'UPDATE');
  const canDelete = canPerformOperation(userMenuPermissions, 'user-management', 'DELETE');
  const canApprove = canPerformOperation(userMenuPermissions, 'user-management', 'APPROVE');
  const canVerify = canPerformOperation(userMenuPermissions, 'user-management', 'VERIFY');
  const canSuspend = canPerformOperation(userMenuPermissions, 'user-management', 'SUSPEND');

  // Handle loading state
  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading permissions...</p>
        </div>
      </div>
    );
  }

  // Handle no access
  if (!hasAccess) {
    return <Navigate to="/403" replace />;
  }

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
    isLoading: boolean;
    buttonLabel?: string;
  }>({
    isOpen: false,
    title: "",
    description: "",
    action: async () => {},
    isLoading: false,
    buttonLabel: "Delete",
  });

  // Load data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [rolesData, menuItemsData, usersData] = await Promise.all([
        getAllRoles(),
        getAllMenuItems(),
        getAllAdminUsers(),
      ]);

      // Transform snake_case to camelCase
      const transformRole = (role: any) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive || role.is_active,
        isSuperAdmin: role.isSuperAdmin || role.is_super_admin,
        createdAt: role.createdAt || role.created_at,
        updatedAt: role.updatedAt || role.updated_at,
        menuItems: role.menuItems || [],
        userCount: role.userCount || 0,
      });

      const transformedRoles = (rolesData || []).map(transformRole);
      setRoles(transformedRoles);
      setMenuItems(menuItemsData || []);
      setUsers(usersData || []);
    } catch (error: any) {
      console.error("Failed to load initial data:", error);
      toast.error("Failed to load roles and menu items");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminPageGuard requiredMenu="user-management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage users, roles, and permissions
            </p>
            {isSuperAdmin && (
              <div className="mt-2 inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium">
                Super Admin Mode
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {/* Stats Cards */}
            <UserStatsCards
              totalUsers={users.length}
              activeUsers={users.filter((u) => u.isActive).length}
              suspendedUsers={users.filter((u) => !u.isActive).length}
              totalRoles={roles.length}
            />

            {/* User Management Section with permission-based actions */}
            <UserManagementSection
              users={users}
              roles={roles}
              isLoading={isLoading}
              onUsersUpdated={loadInitialData}
              confirmDialog={confirmDialog}
              setConfirmDialog={setConfirmDialog}
              permissions={{
                canCreate,
                canUpdate,
                canDelete,
                canApprove,
                canVerify,
                canSuspend,
              }}
            />

            {/* Show message if no write permissions */}
            {!canCreate && !canUpdate && !canDelete && !canSuspend && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  You have read-only access to this section. Contact an administrator to request edit permissions.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            {/* Role Management Section - Only for SUPER_ADMIN */}
            {isSuperAdmin ? (
              <RoleManagementSection
                roles={roles}
                menuItems={menuItems}
                isLoading={isLoading}
                onLoadInitialData={loadInitialData}
                confirmDialog={confirmDialog}
                setConfirmDialog={setConfirmDialog}
              />
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">
                  <strong>Access Denied:</strong> Role and permission management is restricted to Super Admin users only.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Shared Confirmation Dialog */}
        <Dialog
          open={confirmDialog.isOpen}
          onOpenChange={(open) => {
            if (!confirmDialog.isLoading) {
              setConfirmDialog((prev) => ({ ...prev, isOpen: open }));
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmDialog.title}</DialogTitle>
              <DialogDescription>{confirmDialog.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                disabled={confirmDialog.isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  setConfirmDialog((prev) => ({ ...prev, isLoading: true }));
                  try {
                    await confirmDialog.action();
                  } finally {
                    setConfirmDialog((prev) => ({ ...prev, isLoading: false }));
                  }
                }}
                disabled={confirmDialog.isLoading}
              >
                {confirmDialog.isLoading && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {confirmDialog.buttonLabel || "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminPageGuard>
  );
};

export default UserManagement;
