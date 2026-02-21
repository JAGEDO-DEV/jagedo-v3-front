import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface UserFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: any | null;
  newUserEmail: string;
  setNewUserEmail: (email: string) => void;
  newUserFirstName: string;
  setNewUserFirstName: (name: string) => void;
  newUserLastName: string;
  setNewUserLastName: (name: string) => void;
  newUserPhone: string;
  setNewUserPhone: (phone: string) => void;
  selectedRoleIds: number[];
  setSelectedRoleIds: (ids: number[]) => void;
  roles: any[];
  isCreatingUser: boolean;
  onSubmit: () => Promise<void>;
  onReset: () => void;
}

export const UserFormDialog = ({
  isOpen,
  onOpenChange,
  editingUser,
  newUserEmail,
  setNewUserEmail,
  newUserFirstName,
  setNewUserFirstName,
  newUserLastName,
  setNewUserLastName,
  newUserPhone,
  setNewUserPhone,
  selectedRoleIds,
  setSelectedRoleIds,
  roles,
  isCreatingUser,
  onSubmit,
  onReset,
}: UserFormDialogProps) => {
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
          Create Admin User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingUser ? "Edit Admin User" : "Create Admin User"}</DialogTitle>
          <DialogDescription>
            {editingUser
              ? "Update admin user details and roles."
              : "Create a new admin user and assign portal roles. Credentials will be sent via email."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              placeholder="John"
              value={newUserFirstName}
              onChange={(e) => setNewUserFirstName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Doe"
              value={newUserLastName}
              onChange={(e) => setNewUserLastName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userEmail">Email Address *</Label>
            <Input
              id="userEmail"
              type="email"
              placeholder="john@example.com"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              disabled={editingUser !== null}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userPhone">Phone Number</Label>
            <Input
              id="userPhone"
              type="tel"
              placeholder="0712345678 or 0112345678"
              value={newUserPhone}
              onChange={(e) => setNewUserPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Assign Role *</Label>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
              {roles.length > 0 ? (
                roles
                  .filter((role) => !role.isSuperAdmin)
                  .map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedRoleIds([role.id])}
                    >
                      <input
                        type="radio"
                        id={`role-${role.id}`}
                        name="userRole"
                        value={role.id}
                        checked={selectedRoleIds.length > 0 && selectedRoleIds[0] === role.id}
                        onChange={() => setSelectedRoleIds([role.id])}
                      />
                      <Label htmlFor={`role-${role.id}`} className="cursor-pointer flex-1">
                        <div className="font-medium">{role.name}</div>
                        <div className="text-sm text-gray-500">{role.description}</div>
                      </Label>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-gray-500">No roles available. Create roles first.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onReset();
            }}
            disabled={isCreatingUser}
          >
            Cancel
          </Button>
          <Button
            className="bg-blue-800 hover:bg-primary-hover text-primary-foreground"
            onClick={onSubmit}
            disabled={
              !newUserEmail.trim() ||
              !newUserFirstName.trim() ||
              selectedRoleIds.length === 0 ||
              isCreatingUser
            }
          >
            {isCreatingUser && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editingUser ? "Update User" : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
