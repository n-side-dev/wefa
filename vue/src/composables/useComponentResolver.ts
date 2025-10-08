import { componentRegistry, type ResolvableComponent } from '../utils/componentRegistry' // Adjust path

/**
 * Provides a safe component resolver for dynamic component loading from the registry.
 * @param defaultFallback The fallback element/component if not found (default: 'span')
 * @returns An object with a `resolve` method to get components by name.
 */
export function useComponentResolver(defaultFallback: ResolvableComponent = 'span') {
  const resolve = (name: string): ResolvableComponent => {
    const comp = componentRegistry.get(name)
    if (!comp) {
      console.warn(`Component "${name}" not registered in the registry.`)
      return defaultFallback
    }
    return comp as ResolvableComponent
  }
  return { resolve }
}
