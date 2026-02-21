import { SkillsTable } from "@/components/BuilderConfiguration/SkillsTable";
import { useBuilderSkills } from "@/hooks/useBuilderSkills";
import { useAdminPermission, AdminPageGuard } from "@/components/ProtectedAdminRoute";
import { useRolePermissions } from "@/context/RolePermissionProvider";
import { canPerformOperation } from "@/utils/adminPermissions";
import { Navigate } from "react-router-dom";

const Index = () => {
  const { skills, addSkill, updateSkill, deleteSkill } = useBuilderSkills();
  
  // Check permissions for configuration menu
  const { hasAccess, isLoading } = useAdminPermission('configuration', 'VIEW');
  const { userMenuPermissions } = useRolePermissions();
  
  // Check specific CRUD operations
  const canCreate = canPerformOperation(userMenuPermissions, 'configuration', 'CREATE');
  const canUpdate = canPerformOperation(userMenuPermissions, 'configuration', 'UPDATE');
  const canDelete = canPerformOperation(userMenuPermissions, 'configuration', 'DELETE');

  // Handle loading state
  if (isLoading) {
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

  return (
    <AdminPageGuard requiredMenu="configuration">
      <div className="min-h-screen bg-background">
        <main className="mx-auto mt-8 max-w-8xl ">
          
         
          {/* Skills table with permission-based actions */}
          <SkillsTable
            skills={skills}
            onAdd={canCreate ? addSkill : null}
            onUpdate={canUpdate ? updateSkill : null}
            onDelete={canDelete ? deleteSkill : null}
            permissions={{
              canCreate,
              canUpdate,
              canDelete,
            }}
          />

          {/* Show message if no write permissions */}
          {!canCreate && !canUpdate && !canDelete && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                You have read-only access to this section. Contact an administrator to request edit permissions.
              </p>
            </div>
          )}
        </main>
      </div>
    </AdminPageGuard>
  );
};

export default Index;
