/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { getAuthHeaders } from "@/utils/auth";
import { Role, MenuPermissionAssignment, RolePermissionResponse, MenuItem } from "@/types/permissions";

const API_BASE_URL = `${import.meta.env.VITE_SERVER_URL}/api`;

// ============ ROLE MANAGEMENT ============

/**
 * Get all available roles with their menu permissions
 */
export const getAllRoles = async (): Promise<Role[]> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/admin/roles`,
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data.data || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch roles");
  }
};

/**
 * Get a specific role by ID with its menu permissions
 */
export const getRoleById = async (roleId: string | number): Promise<Role> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/admin/roles/${roleId}`,
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data.data || response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch role");
  }
};

/**
 * Create a new role with menu item permissions
 */
export const createRole = async (data: {
  name: string;
  description: string;
  menuItemIds: string[];
  roleMenuItemOperations?: Record<string, string[]>;
}): Promise<RolePermissionResponse> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/admin/roles`,
      data,
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to create role");
  }
};

/**
 * Update an existing role and its menu permissions
 */
export const updateRole = async (
  roleId: string | number,
  data: {
    name?: string;
    description?: string;
    menuItemIds?: string[];
    roleMenuItemOperations?: Record<string, string[]>;
  }
): Promise<RolePermissionResponse> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/admin/roles/${roleId}`,
      data,
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update role");
  }
};

/**
 * Get all available menu items
 */
export const getAllMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/admin/roles/menu-items`,
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data.data || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch menu items");
  }
};

/**
 * Delete a role
 */
export const deleteRole = async (roleId: string | number): Promise<RolePermissionResponse> => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/admin/roles/${roleId}`,
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to delete role");
  }
};

// ============ MENU ITEM PERMISSIONS ============

/**
 * Get all available menu items in the system
 */
export const getAvailableMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/admin/menu-items`,
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data.data || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch menu items");
  }
};

/**
 * Assign menu permissions to a role
 */
export const assignMenuPermissionsToRole = async (
  roleId: string | number,
  menuItemIds: string[]
): Promise<RolePermissionResponse> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/admin/roles/${roleId}/permissions`,
      { menuItemIds },
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to assign permissions");
  }
};

/**
 * Remove menu permissions from a role
 */
export const removeMenuPermissionsFromRole = async (
  roleId: string | number,
  menuItemIds: string[]
): Promise<RolePermissionResponse> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/admin/roles/${roleId}/permissions/remove`,
      { menuItemIds },
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to remove permissions");
  }
};

// ============ USER ROLE ASSIGNMENT ============

/**
 * Assign a role to a user (with its menu permissions)
 */
export const assignRoleToUser = async (data: {
  userId: string | number;
  roleId: string | number;
}): Promise<RolePermissionResponse> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/admin/users/assign-role`,
      data,
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to assign role to user");
  }
};

/**
 * Get the menu permissions for a specific user's role
 */
export const getUserMenuPermissions = async (
  userId: string | number
): Promise<MenuItem[]> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/admin/users/${userId}/menu-permissions`,
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data.data || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch user menu permissions");
  }
};

/**
 * Get the current user's accessible menu items based on their role
 */
export const getCurrentUserMenuPermissions = async (): Promise<MenuItem[]> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/admin/roles/me/menu-permissions`,
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data.data || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch current user menu permissions");
  }
};

// ============ BULK OPERATIONS ============

/**
 * Bulk assign roles to multiple users
 */
export const bulkAssignRolesToUsers = async (data: {
  userIds: (string | number)[];
  roleId: string | number;
}): Promise<RolePermissionResponse> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/admin/users/bulk-assign-role`,
      data,
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to bulk assign roles");
  }
};

/**
 * Get role statistics (role names, user count, etc.)
 */
export const getRoleStatistics = async (): Promise<any> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/admin/roles/statistics`,
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data.data || response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch role statistics");
  }
};

// ============ ADMIN USER MANAGEMENT ============

/**
 * Create a new admin user with roles and send credentials via email
 */
export const createAdminUser = async (data: {
  email: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  roleIds: number[];
}): Promise<any> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/admin/roles/create-admin-user`,
      data,
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data.data || response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to create admin user");
  }
};

/**
 * Get all admin users
 */
export const getAllAdminUsers = async (): Promise<any[]> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/admin/roles/admin-users`,
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data.data || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch admin users");
  }
};

/**
 * Update admin user details (first name, last name, phone, roles)
 */
export const updateAdminUser = async (
  userId: number,
  data: {
    email: string;
    firstName: string;
    lastName?: string;
    phoneNumber?: string;
    roleIds: number[];
  }
): Promise<any> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/admin/roles/update-admin-user/${userId}`,
      data,
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data.data || response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update admin user");
  }
};

/**
 * Delete an admin user
 */
export const deleteAdminUser = async (userId: number | string): Promise<any> => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/admin/roles/admin-users/${userId}`,
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to delete admin user");
  }
};

/**
 * Suspend or unsuspend an admin user
 */
export const suspendAdminUser = async (userId: number | string): Promise<any> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/admin/roles/suspend-admin-user/${userId}`,
      {},
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to suspend/unsuspend admin user");
  }
};

// ============ OPERATION PERMISSIONS (CRUD) ============

/**
 * Get all roles with their current CRUD operation permissions for each menu
 */
export const getAllRolePermissionsWithOperations = async (): Promise<any[]> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/admin/role-permissions`,
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data || [];
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to fetch role permissions");
  }
};

/**
 * Get a specific role's operation permissions for each menu
 */
/**
 * Get simple role-menu assignments (no operations complexity)
 */
export const getRoleMenuAssignments = async (roleId: string | number): Promise<any> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/roles/${roleId}`, {
      headers: { Authorization: getAuthHeaders() },
    });
    return response.data?.data || response.data || {};
  } catch (error: any) {
    console.error('[API] Error fetching role assignments:', error.message);
    throw error;
  }
};

/**
 * @deprecated Use getRoleMenuAssignments instead
 */
export const getRoleOperationPermissions = async (roleId: string | number): Promise<any> => {
  return getRoleMenuAssignments(roleId);
};

/**
 * Update operation permissions for a role-menu combination
 * @param roleId - The role ID
 * @param menuId - The menu ID
 * @param operations - Array of operation names like ['VIEW', 'CREATE', 'UPDATE', 'DELETE']
 */
export const updateRoleMenuOperations = async (
  roleId: string | number,
  menuId: string,
  operations: string[]
): Promise<any> => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/admin/role-permissions/${roleId}/${menuId}`,
      { permissions: operations },
      {
        headers: { Authorization: getAuthHeaders() }
      }
    );
    return response.data || {};
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Failed to update role permissions");
  }
};

/**
 * NOTE: getPermissionMatrix has been moved to permissions.api.ts for simplified permission flow
 * Use: import { getPermissionMatrix } from '@/api/permissions.api';
 */
