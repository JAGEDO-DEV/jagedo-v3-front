import { useState, useEffect } from "react";
import axios from "axios";
import { getAuthHeaders } from "@/utils/auth";
import { getSkillsTree } from "@/api/builderSkillsApi.api";
import SkillsTreeTable, { SkillTreeNode } from "@/components/SkillsTreeTable";
import { SkillsTable } from "@/components/BuilderConfiguration/SkillsTable";
import { SpecializationMappingManager } from "@/components/BuilderConfiguration/SpecializationMappingManager";
import { useAdminPermission, AdminPageGuard } from "@/components/ProtectedAdminRoute";
import { useRolePermissions } from "@/context/RolePermissionProvider";
import { canPerformOperation } from "@/utils/adminPermissions";
import { useBuilderSkills } from "@/hooks/useBuilderSkills";
import { useMasterData } from "@/hooks/useMasterData";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Table2, TreePine, Link2 } from "lucide-react";
import { BuilderSkill, BuilderType } from "@/types/builder";

const Index = () => {
  const [tree, setTree] = useState<Record<string, SkillTreeNode> | null>(null);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("table");

  // Check permissions for configuration menu
  const { hasAccess, isLoading: permLoading } = useAdminPermission('configuration', 'VIEW');
  const { userMenuPermissions } = useRolePermissions();

  // Check specific CRUD operations
  const canCreate = canPerformOperation(userMenuPermissions, 'configuration', 'CREATE');
  const canUpdate = canPerformOperation(userMenuPermissions, 'configuration', 'UPDATE');
  const canDelete = canPerformOperation(userMenuPermissions, 'configuration', 'DELETE');

  // Get all builder skills with CRUD
  const { 
    skills, 
    loading: skillsLoading, 
    error: skillsError,
    addSkill,
    updateSkill,
    deleteSkill,
    addSpecToSkill,
    removeSpecFromSkill,
    deleteSkillsByType,
    deleteSkillByTypeAndName,
  } = useBuilderSkills();

  // Get builder types for UI
  const { data: builderTypes } = useMasterData("BUILDER_TYPES");

  // Load skills tree for tree view
  useEffect(() => {
    loadTree();
  }, []);

  const loadTree = async () => {
    setTreeLoading(true);
    setTreeError(null);

    try {
      const axiosInstance = axios.create({
        headers: { Authorization: getAuthHeaders() },
      });
      const data = await getSkillsTree(axiosInstance);
      setTree(data);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Failed to load skills tree';
      setTreeError(message);
    } finally {
      setTreeLoading(false);
    }
  };

  const handleSkillAction = (builderType: string, skill: any, action: 'edit' | 'delete') => {
    console.log(`${action} skill:`, { builderType, skill });
    // TODO: Implement edit/delete logic for tree view
  };

  const handleSpecAction = (
    builderType: string,
    skill: any,
    spec: any,
    action: 'edit' | 'delete'
  ) => {
    console.log(`${action} specialization:`, { builderType, skill, spec });
    // TODO: Implement edit/delete logic for specs
  };

  // Handle loading state
  if (permLoading || (treeLoading && skillsLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading builder skills...</p>
        </div>
      </div>
    );
  }

  // Handle no access
  if (!hasAccess) {
    return <Navigate to="/403" replace />;
  }

  // Calculate statistics
  const totalSkills = skills.length;
  const totalTypes = builderTypes.length;
  const skillsByType = builderTypes.map((type) => ({
    type: type.name,
    count: skills.filter((s) => s.builderType === (type.code ?? type.name)).length,
  }));

  return (
    <AdminPageGuard requiredMenu="configuration">
      <div className="min-h-screen bg-background">
        <main className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Builder Skills Configuration</h1>
            <p className="mt-2 text-gray-600">
              Manage builder types, skills, and specializations with multiple views
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Total Skills</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSkills}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <TreePine className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Builder Types</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTypes}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Table2 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Last Updated</p>
                  <p className="text-lg font-semibold text-gray-900">Just Now</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-6 bg-gray-100 p-1 rounded-lg">
              
              <TabsTrigger value="table" className="flex items-center gap-2">
                <Table2 className="h-4 w-4" />
                <span className="hidden sm:inline">All Skills</span>
              </TabsTrigger>
              <TabsTrigger value="breakdown" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">By Type</span>
              </TabsTrigger>
              <TabsTrigger value="mappings" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                <span className="hidden sm:inline">Mappings</span>
              </TabsTrigger>
            </TabsList>

       

            {/* Tab 2: Flat Table View with CRUD */}
            <TabsContent value="table" className="space-y-4">
              {skillsError && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <p className="text-red-800 text-sm">{skillsError}</p>
                  </CardContent>
                </Card>
              )}

              <SkillsTable
                skills={skills}
                onAdd={addSkill}
                onUpdate={updateSkill}
                onDelete={deleteSkill}
                onAddSpecialization={addSpecToSkill}
                onRemoveSpecialization={removeSpecFromSkill}
                onDeleteByType={deleteSkillsByType}
                onDeleteByTypeAndName={deleteSkillByTypeAndName}
                permissions={{
                  canCreate,
                  canUpdate,
                  canDelete,
                }}
              />
            </TabsContent>

            {/* Tab 3: Skills Breakdown by Builder Type */}
            <TabsContent value="breakdown" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {skillsByType.map((item) => (
                  <Card key={item.type}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{item.type}</h3>
                          <p className="text-sm text-gray-600 mt-1">{item.count} skill(s)</p>
                        </div>

                        {/* List skills for this type */}
                        <div className="space-y-2">
                          {skills
                            .filter((s) => s.builderType === item.type)
                            .map((skill) => (
                              <div
                                key={skill.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div>
                                  <p className="font-medium text-gray-900">{skill.skillName}</p>
                                  <p className="text-xs text-gray-500">
                                    Created by {skill.createdBy}
                                  </p>
                                </div>
                                <div>
                                  {skill.approvedBy ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Approved
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Pending
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          {item.count === 0 && (
                            <p className="text-gray-500 text-center py-8">No skills for this type</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Tab 4: Specialization Mappings */}
            <TabsContent value="mappings" className="space-y-4">
              <SpecializationMappingManager />
            </TabsContent>
          </Tabs>

          {/* Permission Notice */}
          {!canCreate && !canUpdate && !canDelete && (
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
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
