import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  createRole,
  updateRole,
  deleteRole,
} from "@/api/rolePermissions.api";
import { RolePermissionManager } from "@/components/RolePermissionManager";
import { RoleFormDialog } from "./role-form-dialog";
import { RolesTable } from "./roles-table";
import toast from "react-hot-toast";

interface RoleManagementSectionProps {
  roles: any[];
  menuItems: any[];
  isLoading: boolean;
  onLoadInitialData: () => Promise<void>;
  confirmDialog: any;
  setConfirmDialog: (dialog: any) => void;
}

export const RoleManagementSection = ({
  roles,
  menuItems,
  isLoading,
  onLoadInitialData,
  confirmDialog,
  setConfirmDialog,
}: RoleManagementSectionProps) => {
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);
  const [isPermissionManagerOpen, setIsPermissionManagerOpen] = useState(false);
  const [roleForPermissions, setRoleForPermissions] = useState<any | null>(null);
  const [rolesPage, setRolesPage] = useState(0);
  const [generalLoading, setGeneralLoading] = useState(false);

  const itemsPerPage = 10;

  const resetRoleForm = () => {
    setNewRoleName("");
    setNewRoleDescription("");
    setSelectedMenuItems([]);
    setEditingRole(null);
  };

  const toggleMenuItem = (menuItemId: string) => {
    setSelectedMenuItems((prev) =>
      prev.includes(menuItemId) ? prev.filter((m) => m !== menuItemId) : [...prev, menuItemId]
    );
  };

  const handleRoleSubmit = async (isEdit: boolean) => {
    if (!newRoleName.trim() || selectedMenuItems.length === 0) {
      toast.error("Role name and at least one menu item are required");
      return;
    }

    const dashboardItem = menuItems.find((item) => item.title?.toLowerCase() === "dashboard");
    const finalMenuItemIds =
      dashboardItem && !selectedMenuItems.includes(dashboardItem.id)
        ? [...selectedMenuItems, dashboardItem.id]
        : selectedMenuItems;

    setGeneralLoading(true);
    try {
      if (isEdit && editingRole) {
        await updateRole(editingRole.id, {
          name: newRoleName,
          description: newRoleDescription,
          menuItemIds: finalMenuItemIds,
        });
        toast.success("Role updated successfully. Use 'Manage Permissions' to set operations.");
      } else {
        await createRole({
          name: newRoleName,
          description: newRoleDescription,
          menuItemIds: finalMenuItemIds,
        });
        toast.success("Role created successfully. Use 'Manage Permissions' to set operations.");
      }
      await onLoadInitialData();
      resetRoleForm();
      setIsRoleDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEdit ? "update" : "create"} role`);
    } finally {
      setGeneralLoading(false);
    }
  };

  const handleEditRole = (role: any) => {
    setEditingRole(role);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description);
    const menuIds = role.menuItemIds || role.menuItems?.map((m: any) => m.id) || [];
    setSelectedMenuItems(menuIds);
    setIsRoleDialogOpen(true);
  };

  const handleDeleteRole = async (id: number | string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Role",
      description: "Are you sure you want to delete this role? This action cannot be undone.",
      action: async () => {
        try {
          await deleteRole(id);
          toast.success("Role deleted successfully");
          await onLoadInitialData();
          setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
        } catch (error: any) {
          toast.error(error.message || "Failed to delete role");
        }
      },
      isLoading: false,
    });
  };

  const handleManageRolePermissions = (role: any) => {
    setRoleForPermissions(role);
    setIsPermissionManagerOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <RoleFormDialog
          isOpen={isRoleDialogOpen}
          onOpenChange={setIsRoleDialogOpen}
          editingRole={editingRole}
          newRoleName={newRoleName}
          setNewRoleName={setNewRoleName}
          newRoleDescription={newRoleDescription}
          setNewRoleDescription={setNewRoleDescription}
          selectedMenuItems={selectedMenuItems}
          setSelectedMenuItems={setSelectedMenuItems}
          menuItems={menuItems}
          isLoading={generalLoading}
          onSubmit={handleRoleSubmit}
          onReset={resetRoleForm}
          onToggleMenuItem={toggleMenuItem}
        />
      </div>

      <RolesTable
        roles={roles}
        isLoading={isLoading}
        rolesPage={rolesPage}
        setRolesPage={setRolesPage}
        itemsPerPage={itemsPerPage}
        onEdit={handleEditRole}
        onDelete={handleDeleteRole}
        onManagePermissions={handleManageRolePermissions}
      />

      {/* Permission Manager Dialog */}
      {roleForPermissions && (
        <Dialog open={isPermissionManagerOpen} onOpenChange={setIsPermissionManagerOpen}>
          <DialogContent className="w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage CRUD Permissions</DialogTitle>
              <DialogDescription>
                Configure which operations (CREATE, READ, UPDATE, DELETE, etc.) the{" "}
                {roleForPermissions.name} role can perform on each menu item
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <RolePermissionManager
                roleId={roleForPermissions.id}
                roleName={roleForPermissions.name}
                menuItems={menuItems}
                onPermissionsUpdated={() => {
                  onLoadInitialData();
                }}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsPermissionManagerOpen(false);
                  setRoleForPermissions(null);
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
