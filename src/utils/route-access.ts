/**
 * Utility functions for route access control
 */

/**
 * Check if a user has any of the required roles
 * @param userRoles Array of user roles
 * @param requiredRoles Array of roles that grant access
 * @returns boolean True if the user has any of the required roles
 */
export function hasRequiredRole(userRoles: string[], requiredRoles: string[]): boolean {
  // If requiredRoles is empty, allow access
  if (requiredRoles.length === 0) {
    return true;
  }

  // Super admins and admins have access to everything
  if (userRoles.includes('super_admin') || userRoles.includes('admin')) {
    return true;
  }

  // Check if the user has any of the required roles
  return userRoles.some(role => requiredRoles.includes(role));
}

/**
 * Route access configuration
 * Maps routes to the roles that can access them
 */
export const routeAccess: Record<string, string[]> = {
  // Routes accessible by all roles
  '/admin/event-manager': [],
  '/admin/contacts': [],
  '/admin/gowns': [],
  '/admin/stage-queue': [],

  // Routes accessible by admins, super_admins, and ceremony_manager
  '/admin/events': ['ceremony_manager'],
  '/admin/offers': ['ceremony_manager'],
  '/admin/features': ['ceremony_manager'],

  // Routes accessible only by admins and super_admins
  '/admin/analytics': ['admin', 'super_admin'],
  '/admin/settings': ['admin', 'super_admin'],
};

/**
 * Check if a user has access to a specific route
 * @param userRoles Array of user roles
 * @param route Route path to check
 * @returns boolean True if the user has access to the route
 */
export function hasRouteAccess(userRoles: string[], route: string): boolean {
  // If the route is not in the configuration, default to admin-only
  const requiredRoles = routeAccess[route] || ['admin', 'super_admin'];
  return hasRequiredRole(userRoles, requiredRoles);
}
