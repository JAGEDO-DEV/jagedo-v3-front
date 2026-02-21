import { Loader2, AlertCircle, Settings, Edit, Trash2, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RolesTableProps {
  roles: any[];
  isLoading: boolean;
  rolesPage: number;
  setRolesPage: (page: number) => void;
  itemsPerPage: number;
  onEdit: (role: any) => void;
  onDelete: (id: number | string) => void;
  onManagePermissions: (role: any) => void;
}

export const RolesTable = ({
  roles,
  isLoading,
  rolesPage,
  setRolesPage,
  itemsPerPage,
  onEdit,
  onDelete,
  onManagePermissions,
}: RolesTableProps) => {
  const paginateArray = (array: any[], page: number) => {
    const startIndex = page * itemsPerPage;
    return array.slice(startIndex, startIndex + itemsPerPage);
  };

  const paginatedRoles = paginateArray(roles, rolesPage);
  const totalPages = Math.ceil(roles.length / itemsPerPage);

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle>All Roles</CardTitle>
        <CardDescription>Manage system roles and their permissions</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : paginatedRoles.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No roles found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Menu Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRoles.map((role) => (
                <TableRow key={role.id} className="hover:bg-accent/50 transition-colors">
                  <TableCell className="font-medium flex items-center gap-2">
                    {role.name}
                    {role.isSuperAdmin && (
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Super Admin
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{role.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(role.menuItems || [])
                        .slice(0, 3)
                        .map((item: any) => (
                          <Badge key={item.id} variant="outline" className="text-xs">
                            {item.title}
                          </Badge>
                        ))}
                      {(role.menuItems || []).length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{(role.menuItems || []).length - 3} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {role.isSuperAdmin ? (
                      <div className="flex items-center gap-2 justify-end">
                        <Shield className="h-4 w-4 text-amber-600" />
                        <span className="text-xs text-amber-600 font-medium">Protected</span>
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onManagePermissions(role)}
                          disabled={isLoading}
                          title="Manage CRUD permissions for this role"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(role)}
                          disabled={isLoading}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(role.id)}
                          disabled={isLoading || role.userCount > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {roles.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {rolesPage * itemsPerPage + 1} to{" "}
              {Math.min((rolesPage + 1) * itemsPerPage, roles.length)} of {roles.length} roles
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRolesPage(Math.max(0, rolesPage - 1))}
                disabled={rolesPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={rolesPage === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRolesPage(i)}
                    className="w-8 h-8 p-0"
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRolesPage(Math.min(totalPages - 1, rolesPage + 1))}
                disabled={rolesPage === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
