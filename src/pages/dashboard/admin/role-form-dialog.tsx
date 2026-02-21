import { useState } from "react";
import { Loader2, Shield, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import toast from "react-hot-toast";

interface RoleFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingRole: any | null;
  newRoleName: string;
  setNewRoleName: (name: string) => void;
  newRoleDescription: string;
  setNewRoleDescription: (description: string) => void;
  selectedMenuItems: string[];
  setSelectedMenuItems: (items: string[]) => void;
  menuItems: any[];
  isLoading: boolean;
  onSubmit: (isEdit: boolean) => Promise<void>;
  onReset: () => void;
  onToggleMenuItem: (menuItemId: string) => void;
}

export const RoleFormDialog = ({
  isOpen,
  onOpenChange,
  editingRole,
  newRoleName,
  setNewRoleName,
  newRoleDescription,
  setNewRoleDescription,
  selectedMenuItems,
  setSelectedMenuItems,
  menuItems,
  isLoading,
  onSubmit,
  onReset,
  onToggleMenuItem,
}: RoleFormDialogProps) => {
  const groupedMenuItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, any>);

  const dashboardItem = menuItems.find((item) => item.title?.toLowerCase() === "dashboard");

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) onReset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-blue-900 hover:bg-primary-hover text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRole
              ? "Edit Role & Menu Permissions"
              : "Create New Role & Assign Menu Items"}
          </DialogTitle>
          <DialogDescription>
            {editingRole
              ? "Update role details and select which menu items this role can access"
              : "Define a new role and select which admin menu items users with this role can access"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="roleName">Role Name</Label>
            <Input
              id="roleName"
              placeholder="e.g., Content Manager"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleDescription">Description</Label>
            <Input
              id="roleDescription"
              placeholder="Brief description of this role"
              value={newRoleDescription}
              onChange={(e) => setNewRoleDescription(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Menu Item Permissions</Label>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-700">
                <p className="font-medium">
                  Dashboard access is included by default for all admin roles.
                </p>
              </div>
            </div>
            {Object.entries(groupedMenuItems).map(([category, items]: [string, any]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  {category}
                </h4>
                <div className="grid grid-cols-2 gap-3 pl-6">
                  {items.map((item: any) => {
                    const isDashboard = item.id === dashboardItem?.id;
                    return (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`menu-${item.id}`}
                          checked={selectedMenuItems.includes(item.id) || isDashboard}
                          onCheckedChange={() => {
                            if (!isDashboard) {
                              onToggleMenuItem(item.id);
                            }
                          }}
                          disabled={isDashboard}
                        />
                        <label
                          htmlFor={`menu-${item.id}`}
                          className={`text-sm cursor-pointer flex items-center gap-2 ${
                            isDashboard ? "text-foreground font-medium" : "text-foreground"
                          }`}
                        >
                          {item.title}
                          {isDashboard && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-100 text-blue-700 border-blue-300"
                            >
                              Default
                            </Badge>
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {selectedMenuItems.length > 0 && (
            <div className="space-y-2 border-t pt-4 bg-blue-50 p-3 rounded text-sm text-blue-700">
              <p className="font-medium">✓ Manage operations after creating the role</p>
              <p>
                Click "Manage Permissions" on the role to configure which operations (CREATE,
                UPDATE, DELETE, etc.) are allowed for each menu item.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onReset();
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="bg-blue-800 hover:bg-primary-hover text-primary-foreground"
            onClick={() => onSubmit(!!editingRole)}
            disabled={!newRoleName.trim() || selectedMenuItems.length === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {editingRole ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{editingRole ? "Update Role" : "Create Role"}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
