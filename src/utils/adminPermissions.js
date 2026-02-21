
/**
 * SIMPLIFIED Permission Utilities - Single source of truth for client-side permission checks
 * 
 * Do NOT duplicate permission logic - use these functions everywhere
 */

/**
 * Check if user has access to a specific menu item/module
 */
export const hasMenuAccess = (userMenuPermissions, menuItemId) => {
  if (!userMenuPermissions || !Array.isArray(userMenuPermissions)) return false;
  return userMenuPermissions.some((perm) => perm.id === menuItemId);
};

/**
 * Check if user can perform an operation on a module
 * Checks both menu access AND specific operation permission
 */
export const canPerformOperation = (userMenuPermissions, menuItemId, operation) => {
  if (!userMenuPermissions || !Array.isArray(userMenuPermissions)) return false;
  
  // Find the menu item
  const menuItem = userMenuPermissions.find((perm) => perm.id === menuItemId);
  if (!menuItem) return false;
  
  // Debug: Log what we're checking
  
  // Check if the specific operation is allowed
  // operations array comes from role_menu_items.permissions in the DB
  const allowedOperations = menuItem.operations || [];
  
  // If operations array is empty, only VIEW is allowed
  if (allowedOperations.length === 0) {
    return operation === 'VIEW';
  }
  
  // Check if the requested operation is in the allowed list
  const isAllowed = allowedOperations.includes(operation);
  return isAllowed;
};

/**
 * Check if user has access to ANY of the specified menu items
 */
export const hasAnyMenuAccess = (userMenuPermissions, menuItemIds) => {
  if (!userMenuPermissions || !Array.isArray(menuItemIds)) return false;
  return menuItemIds.some((id) => hasMenuAccess(userMenuPermissions, id));
};

/**
 * Get all accessible modules for the user
 */
export const getAccessibleModules = (userMenuPermissions) => {
  if (!userMenuPermissions || !Array.isArray(userMenuPermissions)) return [];
  return userMenuPermissions.map((perm) => perm.id);
};

/**
 * Filter menu items based on user permissions
 */
export const filterMenuItemsByPermission = (allMenuItems, userMenuPermissions) => {
  if (!userMenuPermissions || !Array.isArray(userMenuPermissions)) return [];
  if (!allMenuItems || !Array.isArray(allMenuItems)) return [];

  return allMenuItems.filter((item) => hasMenuAccess(userMenuPermissions, item.id));
};

/**
 * Create a permission checker object for use in components
 */
export const createPermissionChecker = (userMenuPermissions) => {
  return {
    canAccess: (menuItemId) => hasMenuAccess(userMenuPermissions, menuItemId),
    hasAny: (menuItemIds) => hasAnyMenuAccess(userMenuPermissions, menuItemIds),
    modules: () => getAccessibleModules(userMenuPermissions),
    canViewRegister: () => 
      hasAnyMenuAccess(userMenuPermissions, ['registers-customers', 'registers-builders']),
    canManageShop: () =>
      hasMenuAccess(userMenuPermissions, 'shop-products'),
    canApproveUsers: () =>
      hasMenuAccess(userMenuPermissions, 'user-management'),
    canConfigureBuilders: () =>
      hasMenuAccess(userMenuPermissions, 'configuration'),
  };
};

export default {
  hasMenuAccess,
  hasAnyMenuAccess,
  getAccessibleModules,
  filterMenuItemsByPermission,
  createPermissionChecker,
};
