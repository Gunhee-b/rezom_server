/**
 * Consolidated Schema Definitions
 * 
 * This file contains all mindmap view schemas organized by functionality:
 * - Navigation schemas (home, profile)
 * - Content creation schemas (define, writing hub)
 * - Utility functions and re-exports
 */

import type { ViewSchema } from '@/widgets/mindmap/types';
import { idFor } from '@/shared/schema/rules';

// =============================================================================
// NAVIGATION SCHEMAS
// =============================================================================

/**
 * Home page schema - main navigation hub with logo and primary links
 */
export const homeSchema: ViewSchema = {
  nodes: [
    { id: 'logo', kind: 'logo', x: 50, y: 55 },

    // Primary navigation nodes
    { id: 'about', label: 'About', x: 20, y: 18, size: 'md', to: '/about' },
    { id: 'define', label: 'Language\ndefinition', x: 12, y: 62, size: 'md', to: '/define' },
    { id: 'todays', label: "Today's\nQuestion", x: 45, y: 30, size: 'md', to: '/todays-question' },
    { id: 'metaphor', label: 'Description\nby Metaphor', x: 80, y: 12, size: 'md', to: '/metaphor' },
    { id: 'analyze', label: 'Analyzing\nthe World', x: 88, y: 40, size: 'md', to: '/analyze' },
    { id: 'free', label: 'Free Insight', x: 22, y: 82, size: 'md', to: '/free-insight' },
    { id: 'profile', label: 'Profile', x: 60, y: 78, size: 'md', to: '/profile' },
    { id: 'reco', label: 'Recommended\nQuestions', x: 83, y: 86, size: 'md', to: '/recommend' },
  ],
  edges: [
    { id: 'vine', from: 'todays', to: 'profile', style: 'green', curvature: 0.22 },
    { id: 'line-1', from: 'todays', to: 'analyze', style: 'thin', curvature: 0.25 },
    { id: 'line-2', from: 'todays', to: 'about', style: 'thin', curvature: -0.25 },
    { id: 'line-3', from: 'profile', to: 'reco', style: 'thin', curvature: 0.2 },
    { id: 'line-4', from: 'about', to: 'define', style: 'thin', curvature: 0.35 },
    { id: 'line-5', from: 'free', to: 'profile', style: 'thin', curvature: -0.25 },
  ],
};

/**
 * Profile page schema - user information and navigation to personal content
 */
export const profileSchema: ViewSchema = {
  nodes: [
    { id: 'title', kind: 'logo', x: 50, y: 50 },
    { id: 'about', x: 18, y: 28, label: 'About me :', size: 'lg' },
    { id: 'nick', x: 82, y: 22, label: 'Nickname', size: 'sm' },
    { id: 'job', x: 26, y: 72, label: 'My job', size: 'sm' },
    { id: 'writing', x: 84, y: 70, label: 'My writing :', size: 'lg', to: '/users/me' },
  ],
  edges: [
    { id: 'e1', from: 'about', to: 'title', style: 'thin', curvature: -0.08 },
    { id: 'e2', from: 'title', to: 'writing', style: 'thin', curvature: 0.12 },
    { id: 'e3', from: 'about', to: 'job', style: 'thin', curvature: 0.25 },
    // Central green vine connecting main sections
    { id: 'vine', from: 'about', to: 'writing', style: 'green', curvature: 0.16 },
  ],
};

// =============================================================================
// CONTENT CREATION SCHEMAS
// =============================================================================

/**
 * Define page schema - language definition topics with consistent ID naming
 */
export const defineSchema: ViewSchema = {
  nodes: [
    { id: idFor('def', 'title'), x: 50, y: 48, label: 'Language\ndefinition', size: 'lg' },
    { id: idFor('def', 'happiness'), x: 12, y: 18, label: 'Happiness', size: 'sm', to: '/define/happiness' },
    { id: idFor('def', 'success'), x: 52, y: 10, label: 'Success', size: 'sm', to: '/define/success' },
    { id: idFor('def', 'art'), x: 86, y: 28, label: 'Art', size: 'sm', to: '/define/art' },
    { id: idFor('def', 'obsession'), x: 26, y: 78, label: 'Obsession', size: 'sm', to: '/define/obsession' },
    { id: idFor('def', 'direction'), x: 86, y: 78, label: 'Direction', size: 'sm', to: '/define/direction' },
  ],
  edges: [
    { id: idFor('def', 'vine1'), from: idFor('def', 'obsession'), to: idFor('def', 'title'), style: 'green', curvature: 0.16 },
    { id: idFor('def', 'vine2'), from: idFor('def', 'title'), to: idFor('def', 'art'), style: 'green', curvature: 0.12 },
    { id: idFor('def', 'thin1'), from: idFor('def', 'happiness'), to: idFor('def', 'title'), style: 'thin', curvature: -0.08 },
    { id: idFor('def', 'thin2'), from: idFor('def', 'direction'), to: idFor('def', 'title'), style: 'thin', curvature: 0.10 },
    { id: idFor('def', 'thin3'), from: idFor('def', 'success'), to: idFor('def', 'art'), style: 'thin', curvature: -0.06 },
  ],
};

/**
 * Writing hub schema - personal writing categories organized like a tree structure
 * Features central title with categorized writing topics branching out
 */
export const writingHubSchema: ViewSchema = {
  nodes: [
    // Central title at bottom
    { id: 'title', x: 50, y: 87, label: "I'm", size: 'lg', to: '/profile' },

    // Top center - featured category
    { id: 'metaphor', x: 50, y: 13, label: 'Description\nby Metaphor', size: 'lg', to: '/writing/metaphor' },

    // Left side categories
    { id: 'art', x: 14, y: 20, label: 'Art', size: 'sm', to: '/writing/art' },
    { id: 'science', x: 42, y: 36, label: 'Science', size: 'sm', to: '/writing/science' },
    { id: 'culture', x: 12, y: 58, label: 'Culture', size: 'sm', to: '/writing/culture' },
    { id: 'lifeseed', x: 24, y: 82, label: 'Life Seed', size: 'sm', to: '/writing/lifeseed' },

    // Right side categories
    { id: 'business', x: 85, y: 20, label: 'Business', size: 'sm', to: '/writing/business' },
    { id: 'humanity', x: 82, y: 50, label: 'Humanity', size: 'sm', to: '/writing/humanity' },
    { id: 'analyze', x: 88, y: 74, label: 'Analyzing\nthe World', size: 'lg', to: '/writing/analyze' },
  ],
  edges: [
    // Central trunk (brown)
    { id: 'trunk_top', from: 'metaphor', to: 'title', style: 'brown', curvature: 0.25 },

    // Left side green branches
    { id: 'v_l1', from: 'art', to: 'science', style: 'green', curvature: 0.22 },
    { id: 'v_l2', from: 'science', to: 'title', style: 'green', curvature: 0.2 },
    { id: 'v_l3', from: 'culture', to: 'lifeseed', style: 'green', curvature: 0.08 },

    // Right side green branches
    { id: 'v_r1', from: 'business', to: 'humanity', style: 'green', curvature: -0.14 },
    { id: 'v_r2', from: 'humanity', to: 'analyze', style: 'green', curvature: 0.18 },

    // Branches extending from title
    { id: 'b_left', from: 'title', to: 'culture', style: 'green', curvature: -0.12 },
    { id: 'b_right', from: 'title', to: 'analyze', style: 'green', curvature: 0.18 },
  ],
};

// =============================================================================
// SCHEMA COLLECTIONS AND UTILITIES
// =============================================================================

/**
 * Collection of all available schemas organized by category
 */
export const schemas = {
  // Navigation schemas
  navigation: {
    home: homeSchema,
    profile: profileSchema,
  },
  
  // Content creation schemas
  content: {
    define: defineSchema,
    writingHub: writingHubSchema,
  },
} as const;

/**
 * Flat collection of all schemas for easy access
 */
export const allSchemas = {
  home: homeSchema,
  profile: profileSchema,
  define: defineSchema,
  writingHub: writingHubSchema,
} as const;

/**
 * Get schema by name with type safety
 */
export function getSchema(name: keyof typeof allSchemas): ViewSchema {
  return allSchemas[name];
}

/**
 * Schema names for validation and iteration
 */
export const schemaNames = Object.keys(allSchemas) as Array<keyof typeof allSchemas>;

/**
 * Type representing all available schema names
 */
export type SchemaName = keyof typeof allSchemas;

// Re-export types and utilities for convenience
export type { ViewSchema, Node, Edge, EdgeStyle } from '@/widgets/mindmap/types';
export { idFor } from '@/shared/schema/rules';