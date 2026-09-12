/**
 * The traversal solvers moved to `lib/world/traversal.ts`, where the pure
 * movement simulation and its tests can reach them. This door stays so every
 * existing import keeps working.
 */
export * from '@/lib/world/traversal';
