import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SkillTreeNode {
  code: string;
  name: string;
  skills?: SkillNode[];
}

export interface SkillNode {
  code: string;
  name: string;
  specializations?: SpecializationNode[];
}

export interface SpecializationNode {
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SkillsTreeTableProps {
  tree: Record<string, SkillTreeNode>;
  loading?: boolean;
  onBuilderTypeAction?: (builderType: string, action: 'edit' | 'delete') => void;
  onSkillAction?: (builderType: string, skill: SkillNode, action: 'edit' | 'delete') => void;
  onSpecAction?: (builderType: string, skill: SkillNode, spec: SpecializationNode, action: 'edit' | 'delete') => void;
  permissions?: {
    canCreateSkill?: boolean;
    canEditSkill?: boolean;
    canDeleteSkill?: boolean;
  };
}

const SkillsTreeTable = ({
  tree,
  loading = false,
  onBuilderTypeAction,
  onSkillAction,
  onSpecAction,
  permissions = {},
}: SkillsTreeTableProps) => {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const { canEditSkill = true, canDeleteSkill = true } = permissions;

  // Filter tree based on search
  const filteredTree = useMemo(() => {
    if (!searchTerm.trim()) return tree;

    const result: typeof tree = {};
    const searchLower = searchTerm.toLowerCase();

    for (const [typeCode, typeNode] of Object.entries(tree)) {
      const matchedSkills = (typeNode.skills || []).filter((skill) => {
        const skillMatches = skill.name.toLowerCase().includes(searchLower);
        const specMatches = skill.specializations?.some((spec) =>
          spec.name.toLowerCase().includes(searchLower)
        );
        return skillMatches || specMatches;
      });

      if (matchedSkills.length > 0 || typeNode.name.toLowerCase().includes(searchLower)) {
        result[typeCode] = {
          ...typeNode,
          skills: matchedSkills.length > 0 ? matchedSkills : typeNode.skills,
        };
      }
    }

    return result;
  }, [tree, searchTerm]);

  const toggleTypeExpanded = (typeCode: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(typeCode)) {
        next.delete(typeCode);
      } else {
        next.add(typeCode);
      }
      return next;
    });
  };

  const toggleSkillExpanded = (skillId: string) => {
    setExpandedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading skills tree...</p>
        </div>
      </div>
    );
  }

  if (Object.keys(filteredTree).length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No skills found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="Search skills & specializations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tree Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <tbody>
            {Object.entries(filteredTree).map(([typeCode, typeNode]) => {
              const isTypeExpanded = expandedTypes.has(typeCode);
              const skillCount = typeNode.skills?.length || 0;

              return (
                <tbody key={typeCode}>
                  {/* Builder Type Row */}
                  <tr className="bg-blue-50 border-b border-gray-200 hover:bg-blue-100 transition-colors">
                    <td className="w-12 px-4 py-3 text-center">
                      {skillCount > 0 && (
                        <button
                          onClick={() => toggleTypeExpanded(typeCode)}
                          className="p-1 hover:bg-blue-200 rounded transition-colors"
                        >
                          {isTypeExpanded ? (
                            <ChevronDown className="h-4 w-4 text-blue-600" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-blue-600" />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="flex-1 px-4 py-3">
                      <span className="font-semibold text-gray-900">{typeNode.name}</span>
                      <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                        {skillCount} skills
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">Builder Type</td>
                  </tr>

                  {/* Skills Rows */}
                  {isTypeExpanded &&
                    (typeNode.skills || []).map((skill, skillIdx) => {
                      const skillId = `${typeCode}-${skillIdx}`;
                      const isSkillExpanded = expandedSkills.has(skillId);
                      const specCount = skill.specializations?.length || 0;

                      return (
                        <tbody key={skillId}>
                          {/* Skill Row */}
                          <tr className="bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors">
                            <td className="w-12 px-20 py-2 text-center">
                              {specCount > 0 && (
                                <button
                                  onClick={() => toggleSkillExpanded(skillId)}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                >
                                  {isSkillExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-gray-600" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-600" />
                                  )}
                                </button>
                              )}
                            </td>
                            <td className="flex-1 px-4 py-2">
                              <span className="text-gray-900">{skill.name}</span>
                              {specCount > 0 && (
                                <span className="ml-2 text-xs bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full">
                                  {specCount}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right space-x-2">
                              {canEditSkill && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onSkillAction?.(typeCode, skill, 'edit')}
                                  className="text-xs"
                                >
                                  Edit
                                </Button>
                              )}
                              {canDeleteSkill && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onSkillAction?.(typeCode, skill, 'delete')}
                                  className="text-xs text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </Button>
                              )}
                            </td>
                          </tr>

                          {/* Specializations Rows */}
                          {isSkillExpanded &&
                            (skill.specializations || []).map((spec, specIdx) => (
                              <tr
                                key={`${skillId}-${specIdx}`}
                                className="bg-white border-b border-gray-200 hover:bg-blue-50 transition-colors"
                              >
                                <td className="px-48 py-2"></td>
                                <td className="flex-1 px-4 py-2">
                                  <span className="text-sm text-gray-700">{spec.name}</span>
                                  {!spec.isActive && (
                                    <span className="ml-2 text-xs text-red-600 font-semibold">
                                      (Inactive)
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onSpecAction?.(typeCode, skill, spec, 'delete')}
                                    className="text-xs text-red-600 hover:bg-red-50"
                                  >
                                    Remove
                                  </Button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      );
                    })}
                </tbody>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-600">
        Total builder types: <span className="font-semibold">{Object.keys(filteredTree).length}</span> |
        Total skills:{' '}
        <span className="font-semibold">
          {Object.values(filteredTree).reduce((sum, type) => sum + (type.skills?.length || 0), 0)}
        </span>
      </div>
    </div>
  );
};

export default SkillsTreeTable;
