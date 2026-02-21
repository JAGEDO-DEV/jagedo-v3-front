import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Shield, Save } from "lucide-react";
import { getRoleOperationPermissions, updateRoleMenuOperations } from "@/api/rolePermissions.api";
import { getPermissionMatrix } from "@/api/permissions.api";
import toast from "react-hot-toast";

interface RolePermissionManagerProps {
  roleId: string | number;
  roleName: string;
  menuItems: any[];
  onPermissionsUpdated?: () => void;
}

/**
 * Component to manage CRUD operation permissions for a role
 * Allows selecting which operations (VIEW, CREATE, UPDATE, DELETE, etc.) each role can perform on each menu
 */
export const RolePermissionManager: React.FC<RolePermissionManagerProps> = ({
  roleId,
  roleName,
  menuItems = [],
  onPermissionsUpdated,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [matrixMenuItems, setMatrixMenuItems] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedOperations, setSelectedOperations] = useState<Record<string, string[]>>({});
  const [selectedMenu, setSelectedMenu] = useState<string>("");
  const [permissionMatrix, setPermissionMatrix] = useState<Record<string, any>>({});

  useEffect(() => {
    loadPermissionData();
  }, [roleId]);

  const loadPermissionData = async () => {
    setIsLoading(true);
    try {
      // Get permission matrix first to know valid operations per menu
      const matrix = await getPermissionMatrix();
      console.log('[RolePermissionManager] Permission Matrix:', matrix);
      setPermissionMatrix(matrix || {});

      // Get role's menu assignments with operations
      const role = await getRoleOperationPermissions(roleId);
      console.log('[RolePermissionManager] Role Data:', role);
      const menuItems = role?.menuItems || [];
      console.log('[RolePermissionManager] Menu Items:', menuItems);
      
      setMatrixMenuItems(menuItems);
      setSelectedMenu(menuItems[0]?.id || "");
      
      // Convert to selected operations map
      const rolePermsMap: Record<string, string[]> = {};
      menuItems.forEach((item: any) => {
        // Get operations from roleMenuItemOperations array or from permissions field
        let ops: string[] = [];
        
        if (item.roleMenuItemOperations && Array.isArray(item.roleMenuItemOperations)) {
          ops = item.roleMenuItemOperations.map((op: any) => op.operation || op);
        } else if (item.permissions && typeof item.permissions === 'string') {
          // Handle permissions stored as JSON string
          try {
            ops = JSON.parse(item.permissions);
          } catch {
            ops = [item.permissions];
          }
        } else if (item.permissions && Array.isArray(item.permissions)) {
          ops = item.permissions;
        }
        
        // If still no operations, don't default to VIEW - leave empty
        rolePermsMap[item.id] = ops.length > 0 ? ops : [];
        console.log(`[RolePermissionManager] Menu ${item.id}: ${JSON.stringify(rolePermsMap[item.id])}`);
      });
      
      setSelectedOperations(rolePermsMap);
    } catch (error: any) {
      console.error("[RolePermissionManager] Error:", error);
      toast.error("Failed to load role data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOperationToggle = (menuId: string, operation: string) => {
    setSelectedOperations((prev) => {
      const current = prev[menuId] || [];
      const updated = current.includes(operation)
        ? current.filter((op) => op !== operation)
        : [...current, operation];

      return {
        ...prev,
        [menuId]: updated,
      };
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedMenu) {
      toast.error("No menu selected");
      return;
    }

    setIsSaving(true);
    try {
      await updateRoleMenuOperations(
        roleId,
        selectedMenu,
        selectedOperations[selectedMenu] || []
      );

      toast.success(
        `Permissions updated for ${menuItems.find((m) => m.id === selectedMenu)?.title || "menu"}`
      );

      // Reload data
      await loadPermissionData();
      onPermissionsUpdated?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to save permissions");
    } finally {
      setIsSaving(false);
    }
  };

  const currentMenuPermissions = selectedOperations[selectedMenu] || [];
  const validOperationsForMenu = permissionMatrix[selectedMenu]?.operations || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading permissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
       
        <CardContent className="space-y-6">
          

          {/* Menu Selection */}
          <div className="space-y-2">
            <Label htmlFor="menu-select">Select Menu Item</Label>
            <Select value={selectedMenu} onValueChange={setSelectedMenu}>
              <SelectTrigger id="menu-select" className="w-full">
                <SelectValue placeholder="Choose a menu..." />
              </SelectTrigger>
              <SelectContent>
                {matrixMenuItems.length > 0 ? (
                  matrixMenuItems.map((menu) => (
                    <SelectItem key={menu.id} value={menu.id}>
                      {menu.title}
                      {(selectedOperations[menu.id] || []).length > 0 && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({(selectedOperations[menu.id] || []).length} ops)
                        </span>
                      )}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500">Loading menus...</div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Operations Checkboxes */}
          {selectedMenu && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-blue-800 font-medium">
                    Available Operations for {matrixMenuItems.find((m) => m.id === selectedMenu)?.title || selectedMenu}
                  </p>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {currentMenuPermissions.length}/{validOperationsForMenu.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                {validOperationsForMenu.length > 0 ? (
                  validOperationsForMenu.map((operation) => (
                    <div
                      key={`${selectedMenu}-${operation}`}
                      className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        id={`op-${selectedMenu}-${operation}`}
                        checked={currentMenuPermissions.includes(operation)}
                        onCheckedChange={() =>
                          handleOperationToggle(selectedMenu, operation)
                        }
                      />
                      <label
                        htmlFor={`op-${selectedMenu}-${operation}`}
                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        <div className="flex items-center justify-between">
                          <span>{operation}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getOperationColor(operation)}`}
                          >
                            {getOperationLabel(operation)}
                          </Badge>
                        </div>
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 col-span-2">
                    No operations available for this menu
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedMenu && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-sm mb-2">Selected Operations:</h4>
              {currentMenuPermissions.length === 0 ? (
                <p className="text-sm text-gray-500">No operations selected</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {currentMenuPermissions.map((op) => (
                    <Badge key={op} variant="secondary" className="text-xs">
                      {op}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSavePermissions}
            disabled={isSaving || !selectedMenu}
            className="w-full bg-blue-800 hover:bg-blue-900 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving Permissions...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Permissions for {selectedMenu ? menuItems.find((m) => m.id === selectedMenu)?.title : "Selected Menu"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* All Permissions Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Menu Permissions Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {menuItems.map((menu) => (
              <div
                key={menu.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-semibold text-sm">{menu.title}</h5>
                  <Badge
                    variant="outline"
                    className={
                      (selectedOperations[menu.id] || []).length > 0
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                    }
                  >
                    {(selectedOperations[menu.id] || []).length === 0
                      ? "No Access"
                      : `${(selectedOperations[menu.id] || []).length} Operations`}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(selectedOperations[menu.id] || []).length === 0 ? (
                    <span className="text-xs text-gray-500">No operations assigned</span>
                  ) : (
                    (selectedOperations[menu.id] || []).map((op) => (
                      <Badge key={`overview-${menu.id}-${op}`} variant="secondary" className="text-xs">
                        {op}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper functions
function getOperationColor(operation: string): string {
  const colors: Record<string, string> = {
    VIEW: "bg-blue-50 text-blue-700 border-blue-200",
    CREATE: "bg-green-50 text-green-700 border-green-200",
    UPDATE: "bg-yellow-50 text-yellow-700 border-yellow-200",
    DELETE: "bg-red-50 text-red-700 border-red-200",
    APPROVE: "bg-purple-50 text-purple-700 border-purple-200",
    VERIFY: "bg-indigo-50 text-indigo-700 border-indigo-200",
    SUSPEND: "bg-orange-50 text-orange-700 border-orange-200",
    REJECT: "bg-red-50 text-red-700 border-red-200",
    RETURN: "bg-pink-50 text-pink-700 border-pink-200",
    APPROVE_UPLOAD: "bg-teal-50 text-teal-700 border-teal-200",
    REJECT_UPLOAD: "bg-red-50 text-red-700 border-red-200",
    MANAGE: "bg-indigo-50 text-indigo-700 border-indigo-200",
    CONFIGURE: "bg-slate-50 text-slate-700 border-slate-200",
  };
  return colors[operation] || "bg-gray-50 text-gray-700 border-gray-200";
}

function getOperationLabel(operation: string): string {
  const labels: Record<string, string> = {
    VIEW: "Read",
    CREATE: "Write",
    UPDATE: "Edit",
    DELETE: "Remove",
    APPROVE: "Approve",
    VERIFY: "Verify",
    SUSPEND: "Suspend",
    REJECT: "Reject",
    RETURN: "Return",
    APPROVE_UPLOAD: "Approve Upload",
    REJECT_UPLOAD: "Reject Upload",
    MANAGE: "Manage",
    CONFIGURE: "Configure",
  };
  return labels[operation] || operation;
}

export default RolePermissionManager;
