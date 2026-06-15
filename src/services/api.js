// Barrel file: the original ~470-line monolith was split into per-domain
// modules under ./api/. Every named export is re-exported unchanged so the
// ~111 importing files keep working without modification.
export * from './api/auth.js';
export * from './api/admin.js';
export * from './api/seller.js';
export * from './api/user.js';
export * from './api/catalog.js';
export * from './api/commerce.js';
export * from './api/social.js';
export * from './api/content.js';
export * from './api/analytics.js';
