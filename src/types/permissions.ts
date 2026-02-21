/* eslint-disable @typescript-eslint/no-explicit-any */

export interface MenuItem {
  id: string;
  title: string;
  href?: string;
  category: string;
  submenu?: MenuItem[];
  operations?: string[]; // Array of operations user can perform (CREATE, UPDATE, DELETE, etc.)
}

export interface Permission {
  id: string;
  label: string;
  category: string;
}

export interface Role {
  id: string | number;
  name: string;
  description: string;
  permissions: string[]; // Array of menu item IDs
  menuItems: MenuItem[]; // The actual menu items the role has access to
  userCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RolePermissionResponse {
  success: boolean;
  message: string;
  data?: Role | Role[];
  error?: string;
}

export interface MenuPermissionAssignment {
  roleId: string | number;
  menuItemIds: string[]; // IDs of menu items to assign
}

export interface UserRole {
  id: string | number;
  name: string;
  permissions: string[]; // Menu item IDs user has access to
}