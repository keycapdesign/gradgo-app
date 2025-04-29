/**
 * Utility functions for navigation and URL generation
 */
import { NavigateOptions } from '@tanstack/react-router';

/**
 * Default search parameters for different entity types
 */
export const defaultSearchParams: Record<string, Record<string, any>> = {
  events: {
    page: 1,
    pageSize: 25,
    sortBy: 'datetime',
    sortDirection: 'desc',
    search: ''
  },
  contacts: {
    page: 1,
    pageSize: 25,
    sortBy: 'contact_created_at',
    sortDirection: 'desc',
    search: ''
  },
  features: {
    page: 1,
    pageSize: 25,
    sortBy: 'created_at',
    sortDirection: 'desc',
    search: ''
  },
  gowns: {
    page: 1,
    pageSize: 25,
    sortBy: 'check_out_time',
    sortDirection: 'desc',
    search: ''
  },
  offers: {
    page: 1,
    pageSize: 25,
    sortBy: 'created_at',
    sortDirection: 'desc',
    search: ''
  }
};

/**
 * Generates a detail page URL for an entity
 *
 * @param entityType The type of entity (e.g., 'contacts', 'events', 'gowns')
 * @param id The ID of the entity
 * @returns The URL for the detail page
 */
export function getDetailPageUrl(entityType: string, id: string | number): string {
  return `/admin/${entityType}/${id}`;
}

/**
 * Creates a row click handler function for a specific entity type
 *
 * @param entityType The type of entity (e.g., 'contacts', 'events', 'gowns')
 * @param idField The field name that contains the ID (default: 'id')
 * @returns A function that takes a row and returns a URL
 */
export function createRowHrefGetter<T extends Record<string, any>>(
  entityType: string,
  idField: keyof T = 'id'
): (row: T) => string {
  return (row: T) => {
    const id = row[idField];
    if (!id) return '';
    return getDetailPageUrl(entityType, id);
  };
}

/**
 * Creates navigation options for going back to a list page
 *
 * @param entityType The type of entity (e.g., 'contacts', 'events', 'gowns')
 * @returns Navigation options with the correct search parameters
 */
export function getBackToListOptions(entityType: string): NavigateOptions {
  return {
    to: `/admin/${entityType}`,
    search: defaultSearchParams[entityType] || {
      page: 1,
      pageSize: 25,
      sortBy: 'created_at',
      sortDirection: 'desc',
      search: ''
    }
  };
}
