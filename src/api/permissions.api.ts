import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Get the complete permission matrix for all modules (public endpoint)
 */
export const getPermissionMatrix = async () => {
  try {
    const response = await axios.get(`${API_BASE}/admin/role-permissions/matrix/operations`);
    return response.data || {};
  } catch (error) {
    console.error('[permissions.api] Error fetching permission matrix:', error);
    throw error;
  }
};

/**
 * Get current user's detailed permissions including which operations they can perform
 */
export const getUserPermissions = async () => {
  try {
    const response = await axios.get(`${API_BASE}/admin/roles/me/permissions`);
    return response.data?.data || [];
  } catch (error) {
    console.error('[permissions.api] Error fetching user permissions:', error);
    throw error;
  }
};

/**
 * Get current user's accessible menu items/modules
 */
export const getCurrentUserMenuPermissions = async () => {
  try {
    const response = await axios.get(`${API_BASE}/admin/roles/me/menu-permissions`);
    return response.data?.data || [];
  } catch (error) {
    console.error('[permissions.api] Error fetching menu permissions:', error);
    throw error;
  }
};

/**
 * Get all available menu items in the system
 */
export const getAllMenuItems = async () => {
  try {
    const response = await axios.get(`${API_BASE}/admin/roles/menu-items`);
    return response.data?.data || [];
  } catch (error) {
    console.error('[permissions.api] Error fetching menu items:', error);
    throw error;
  }
};

/**
 * Check if user can perform a specific operation on a module
 */
export const checkCanPerformOperation = async (menuItemId: string, operation: string) => {
  try {
    const response = await axios.get(`${API_BASE}/admin/roles/check-permission`, {
      params: { menuItemId, operation },
    });
    return response.data?.data?.canPerform || false;
  } catch (error) {
    console.error('[permissions.api] Error checking permission:', error);
    return false;
  }
};

export default {
  getPermissionMatrix,
  getUserPermissions,
  getCurrentUserMenuPermissions,
  getAllMenuItems,
  checkCanPerformOperation,
};
