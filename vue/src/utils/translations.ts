/**
 * Applies translations to specific paths in an object, preserving non-translatable fields.
 * @param obj - The object to process (e.g., Plotly Layout or Config)
 * @param paths - Array of dot-notation paths to translate (e.g., ['title.text', 'xaxis.title.text'])
 * @param t - Translation function from vue-i18n
 * @returns The processed object with translated values at specified paths
 */
export function applyTranslations<T>(
  obj: T | undefined,
  paths: string[],
  t: (key: string) => string
): T | undefined {
  if (!obj) return undefined
  const result = { ...obj } as Record<string, unknown>

  /**
   * Helper function to traverse object path and return target object and key
   * Traverses the object at the specified keys and returns the parent object and last key.
   * @param current - The current object to traverse
   * @param keys - The array of keys representing the path to the target property
   * @returns An object containing the parent object and last key
   */
  function traversePath(
    current: Record<string, unknown>,
    keys: string[]
  ): { parent: Record<string, unknown> | null; lastKey: string | null } {
    let parent: Record<string, unknown> | null = null
    let target = current

    let i = 0
    for (const key of keys) {
      if (i === keys.length - 1) {
        return { parent, lastKey: key }
      }
      if (!target[key] || typeof target[key] !== 'object') {
        return { parent: null, lastKey: null }
      }
      target[key] = { ...target[key] } as Record<string, unknown>
      parent = target
      target = target[key] as Record<string, unknown>
      i++
    }
    return { parent: null, lastKey: null }
  }

  for (const path of paths) {
    const keys = path.split('.')
    const { parent, lastKey } = traversePath(result, keys)

    if (parent && lastKey && typeof parent[lastKey] === 'string') {
      const translationKey = parent[lastKey]
      const translated = t(translationKey)
      parent[lastKey] = translated !== translationKey ? translated : translationKey
    }
  }

  return result as T
}
