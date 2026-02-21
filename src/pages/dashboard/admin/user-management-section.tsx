import { useState } from "react";
import {
  Search,
  Plus,
  MoreVertical,
  Lock,
  LockOpen,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input as TextInput } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { 
  createAdminUser, 
  getAllAdminUsers, 
  updateAdminUser, 
  deleteAdminUser,
  suspendAdminUser 
} from "@/api/rolePermissions.api";
import { resetAdminUserPassword } from "@/api/changePassword.api";
import toast from "react-hot-toast";

interface UserManagementSectionProps {
  users: any[];
  roles: any[];
  isLoading: boolean;
  onUsersUpdated: () => Promise<void>;
  confirmDialog: any;
  setConfirmDialog: (dialog: any) => void;
  permissions?: {
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
    canApprove?: boolean;
    canVerify?: boolean;
    canSuspend?: boolean;
  };
}

export const UserManagementSection = ({
  users,
  roles,
  isLoading,
  onUsersUpdated,
  confirmDialog,
  setConfirmDialog,
  permissions = {
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    canApprove: true,
    canVerify: true,
    canSuspend: true,
  },
}: UserManagementSectionProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [usersPage, setUsersPage] = useState(0);
  const [pendingInvites, setPendingInvites] = useState<Record<string, boolean>>({});
  const [localPendingUsers, setLocalPendingUsers] = useState<any[]>([]);

  const itemsPerPage = 10;

  const filteredUsers = users.filter(
    (user) =>
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.roles &&
        Array.isArray(user.roles) &&
        user.roles.some((role: any) => {
          const roleName = typeof role === "string" ? role : role.name;
          return roleName?.toLowerCase().includes(searchQuery.toLowerCase());
        }))
  );

  const paginateArray = (array: any[], page: number) => {
    const startIndex = page * itemsPerPage;
    return array.slice(startIndex, startIndex + itemsPerPage);
  };

  const paginatedUsers = paginateArray(filteredUsers, usersPage);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const resetUserForm = () => {
    setNewUserEmail("");
    setNewUserFirstName("");
    setNewUserLastName("");
    setNewUserPhone("");
    setSelectedRoleIds([]);
    setEditingUser(null);
  };

  const handleCreateAdminUser = async () => {
    if (!permissions.canCreate) {
      toast.error("You don't have permission to create admin users");
      return;
    }

    if (!newUserEmail.trim() || !newUserFirstName.trim() || selectedRoleIds.length === 0) {
      toast.error("Email, first name, and role are required");
      return;
    }

    setIsCreateUserDialogOpen(false);
    setIsCreatingUser(true);
    const loadingToastId = toast.loading(
      editingUser ? "Updating admin user..." : "Creating admin user and sending invitation..."
    );

    try {
      if (editingUser) {
        await updateAdminUser(editingUser.id, {
          email: newUserEmail,
          firstName: newUserFirstName,
          lastName: newUserLastName,
          phoneNumber: newUserPhone,
          roleIds: selectedRoleIds,
        });
        toast.dismiss(loadingToastId);
        toast.success("Admin user updated successfully!");
        await onUsersUpdated();
      } else {
        setPendingInvites((p) => ({ ...p, [newUserEmail]: true }));
        const tempRow = {
          id: `pending-${newUserEmail}`,
          email: newUserEmail,
          firstName: newUserFirstName,
          lastName: newUserLastName,
          phoneNumber: newUserPhone,
          roles: selectedRoleIds.length > 0 ? [{ id: selectedRoleIds[0] }] : [],
          isActive: false,
          __localPending: true,
          createdAt: new Date().toISOString(),
        };
        setLocalPendingUsers((prev) => [tempRow, ...prev]);

        await createAdminUser({
          email: newUserEmail,
          firstName: newUserFirstName,
          lastName: newUserLastName,
          phoneNumber: newUserPhone,
          roleIds: selectedRoleIds,
        });

        toast.dismiss(loadingToastId);
        toast.success("Admin user created — invitation queued");
        await onUsersUpdated();
        setLocalPendingUsers((prev) => prev.filter((p) => p.id !== tempRow.id));
        setPendingInvites((p) => {
          const copy = { ...p };
          delete copy[newUserEmail];
          return copy;
        });
        resetUserForm();
      }
    } catch (error: any) {
      toast.dismiss(loadingToastId);
      toast.error(error?.message || "Failed to create/update user");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setNewUserEmail(user.email);
    setNewUserFirstName(user.firstName);
    setNewUserLastName(user.lastName);
    setNewUserPhone(user.phoneNumber);

    const roleIds = user.roles && Array.isArray(user.roles)
      ? user.roles
          .map((r: any) => {
            if (typeof r === "string") {
              const matchedRole = roles.find((role) => role.name.toLowerCase() === r.toLowerCase());
              return matchedRole?.id || null;
            }
            return r.id || null;
          })
          .filter((id: any) => id !== null)
      : [];

    setSelectedRoleIds(roleIds);
    setIsCreateUserDialogOpen(true);
  };

  const handleDeleteUser = async (userId: number, user?: any) => {
    if (!permissions.canDelete) {
      toast.error("You don't have permission to delete admin users");
      return;
    }

    if (user) {
      const hasSuperAdminRole = user.roles &&
        Array.isArray(user.roles) &&
        user.roles.some((r: any) => {
          if (typeof r === "string") return r?.toUpperCase?.() === "SUPER_ADMIN";
          return r?.name?.toUpperCase?.() === "SUPER_ADMIN";
        });

      if (hasSuperAdminRole) {
        toast.error("Cannot delete SuperAdmin user. SuperAdmin role is protected.");
        return;
      }
    }

    setConfirmDialog({
      isOpen: true,
      title: "Delete Admin User",
      description: "Are you sure you want to delete this user? This action cannot be undone.",
      buttonLabel: "Delete",
      action: async () => {
        await deleteAdminUser(userId);
        toast.success("User deleted successfully");
        await onUsersUpdated();
        setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
      },
      isLoading: false,
    });
  };

  const handleSuspendUser = async (user: any) => {
    if (!permissions.canSuspend) {
      toast.error("You don't have permission to suspend/unsuspend admin users");
      return;
    }

    const hasSuperAdminRole = user.roles &&
      Array.isArray(user.roles) &&
      user.roles.some((r: any) => {
        if (typeof r === "string") return r?.toUpperCase?.() === "SUPER_ADMIN";
        return r?.name?.toUpperCase?.() === "SUPER_ADMIN";
      });

    if (hasSuperAdminRole) {
      toast.error("Cannot suspend SuperAdmin user. SuperAdmin role is protected.");
      return;
    }

    const isSuspended = !user.isActive;
    setConfirmDialog({
      isOpen: true,
      title: isSuspended ? "Unsuspend Admin User" : "Suspend Admin User",
      description: isSuspended
        ? "Are you sure you want to unsuspend this user? They will regain access to the portal."
        : "Are you sure you want to suspend this user? They will lose access to the portal.",
      buttonLabel: isSuspended ? "Unsuspend" : "Suspend",
      action: async () => {
        await suspendAdminUser(user.id);
        toast.success(user.isActive ? "User unsuspended successfully" : "User suspended successfully");
        await onUsersUpdated();
        setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
      },
      isLoading: false,
    });
  };

  const handleResetPassword = async (user: any) => {
    if (!permissions.canUpdate) {
      toast.error("You don't have permission to reset admin user passwords");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Reset User Password",
      description: `Are you sure you want to reset the password for ${user.firstName} ${user.lastName}? They will receive new credentials via email.`,
      buttonLabel: "Reset Password",
      action: async () => {
        setConfirmDialog((prev: any) => ({ ...prev, isOpen: false }));
        toast.loading("Password reset requested — email will be sent shortly");
        await resetAdminUserPassword(user.id);
        toast.success("Password reset successfully. New credentials sent to user's email");
        await onUsersUpdated();
      },
      isLoading: false,
    });
  };

  return (
    <div className="space-y-6">
      

      <div className="flex items-center justify-end">
        <Dialog
          open={isCreateUserDialogOpen}
          onOpenChange={(open) => {
            setIsCreateUserDialogOpen(open);
            if (!open) resetUserForm();
          }}
        >
          <DialogTrigger asChild>
            <Button 
              className="bg-blue-900 hover:bg-primary-hover text-primary-foreground"
              disabled={!permissions.canCreate}
              title={!permissions.canCreate ? "You don't have permission to create admin users" : "Create a new admin user"}
            >
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
                <TextInput
                  id="firstName"
                  placeholder="John"
                  value={newUserFirstName}
                  onChange={(e) => setNewUserFirstName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <TextInput
                  id="lastName"
                  placeholder="Doe"
                  value={newUserLastName}
                  onChange={(e) => setNewUserLastName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userEmail">Email Address *</Label>
                <TextInput
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
                <TextInput
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
                  setIsCreateUserDialogOpen(false);
                  resetUserForm();
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-800 hover:bg-primary-hover text-primary-foreground"
                onClick={handleCreateAdminUser}
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
      </div>

      <Card className="shadow-elegant overflow-visible">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Admin Users</CardTitle>
              <CardDescription>Admin users with portal access and role assignments</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-visible">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={`user-${user.id}`} className="hover:bg-accent/50 transition-colors">
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-muted-foreground">{user.phoneNumber}</TableCell>
                    <TableCell>
                      {user.roles && Array.isArray(user.roles) && user.roles.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={(() => {
                              const isSuperAdmin = user.roles.some((r: any) => {
                                if (typeof r === 'string') return r?.toUpperCase?.() === 'SUPER_ADMIN';
                                return r?.name?.toUpperCase?.() === 'SUPER_ADMIN';
                              });
                              return isSuperAdmin ? 'bg-amber-50 text-amber-700 border-amber-200' : '';
                            })()}
                          >
                            {user.roles.some((r: any) => {
                              if (typeof r === 'string') return r?.toUpperCase?.() === 'SUPER_ADMIN';
                              return r?.name?.toUpperCase?.() === 'SUPER_ADMIN';
                            }) && <Shield className="h-3 w-3 mr-1" />}
                            {typeof user.roles[0] === "string" ? user.roles[0] : user.roles[0]?.name}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No role</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.__localPending || pendingInvites[user.email] ? (
                        <Badge className="bg-yellow-400 text-black">Invitation sent</Badge>
                      ) : (
                        <Badge
                          variant={user.isActive === true ? "default" : "secondary"}
                          className={user.isActive === true ? "bg-green-500 text-white" : "bg-red-500 text-white"}
                        >
                          {user.isActive === true ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right relative">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          {(() => {
                            const isSuperAdmin = user.roles &&
                              Array.isArray(user.roles) &&
                              user.roles.some((r: any) => {
                                if (typeof r === "string") return r?.toUpperCase?.() === "SUPER_ADMIN";
                                return r?.name?.toUpperCase?.() === "SUPER_ADMIN";
                              });

                            if (isSuperAdmin) {
                              return (
                                <div className="px-3 py-2 bg-amber-50">
                                  <div className="flex items-center gap-2 text-amber-700">
                                    <Shield className="h-4 w-4" />
                                    <span className="text-sm font-medium">SuperAdmin Protected</span>
                                  </div>
                                  <p className="text-xs text-amber-600 mt-1">This user cannot be modified.</p>
                                </div>
                              );
                            }

                            return (
                              <>
                                {permissions.canUpdate && (
                                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {permissions.canSuspend && (
                                  <DropdownMenuItem onClick={() => handleSuspendUser(user)}>
                                    {user.isActive ? (
                                      <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Suspend
                                      </>
                                    ) : (
                                      <>
                                        <LockOpen className="h-4 w-4 mr-2" />
                                        Unsuspend
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}
                                {permissions.canUpdate && (
                                  <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                                    <Lock className="h-4 w-4 mr-2" />
                                    Reset Password
                                  </DropdownMenuItem>
                                )}
                                {permissions.canDelete && (
                                  <DropdownMenuItem onClick={() => handleDeleteUser(user.id, user)} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                                {!permissions.canUpdate && !permissions.canSuspend && !permissions.canDelete && (
                                  <div className="px-3 py-2 bg-blue-50">
                                    <p className="text-xs text-blue-600">Read-only access</p>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {usersPage * itemsPerPage + 1} to {Math.min((usersPage + 1) * itemsPerPage, filteredUsers.length)}{" "}
                of {filteredUsers.length} users
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setUsersPage(Math.max(0, usersPage - 1))}
                  disabled={usersPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button
                      key={i}
                      variant={usersPage === i ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUsersPage(i)}
                      className="w-8 h-8 p-0"
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setUsersPage(Math.min(totalPages - 1, usersPage + 1))}
                  disabled={usersPage === totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Show message if no write permissions */}
      {!permissions.canCreate && !permissions.canUpdate && !permissions.canDelete && !permissions.canSuspend && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            You have read-only access to this section. Contact an administrator to request edit permissions.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserManagementSection;
