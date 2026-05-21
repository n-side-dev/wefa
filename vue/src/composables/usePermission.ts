import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { resolveBackendStore } from '@/stores/backend/resolve'

/**
 * Whether the caller must hold every listed permission (`'all'`, default)
 * or at least one (`'any'`).
 */
export type PermissionMatchMode = 'all' | 'any'

export interface UsePermissionOptions {
  /**
   * Match mode applied when the permission argument is an array.
   * Defaults to `'all'`.
   */
  mode?: PermissionMatchMode
}

/**
 * Reactive permission check against the active backend store.
 *
 * Returns `true` when the current user's permissions satisfy the requirement.
 * An empty requirement (empty array) is treated as trivially allowed.
 *
 * The `name` argument accepts a plain value, a `Ref`, or a getter so the result
 * stays reactive when the requirement itself changes (for example, when a
 * required permission is computed from props).
 * @param name - The permission(s) to check. String, array, ref, or getter.
 * @param options - Optional config; `mode` selects `'all'` vs `'any'` for arrays.
 * @returns A `ComputedRef<boolean>` that updates with both the requirement and the store.
 * @throws {Error} If called before the backend store has been created (see `resolveBackendStore`).
 * @example
 * const canDelete = usePermission('order.delete')
 *
 * const canPublish = usePermission(['article.write', 'article.publish'])
 *
 * const requirement = computed(() => props.required)
 * const allowed = usePermission(requirement, { mode: 'any' })
 */
export function usePermission(
  name: MaybeRefOrGetter<string | readonly string[]>,
  options: UsePermissionOptions = {}
): ComputedRef<boolean> {
  const mode = options.mode ?? 'all'
  const store = resolveBackendStore()

  return computed(() => {
    const raw = toValue(name)
    const required = Array.isArray(raw) ? raw : [raw as string]
    if (required.length === 0) return true

    // Pinia's store proxy auto-unwraps refs, so `store.permissions` resolves
    // directly to the underlying array even though the `BackendStore`
    // interface types it as `Ref<readonly string[]>`.
    const granted = store.permissions as unknown as readonly string[]
    return mode === 'all'
      ? required.every((perm) => granted.includes(perm))
      : required.some((perm) => granted.includes(perm))
  })
}
