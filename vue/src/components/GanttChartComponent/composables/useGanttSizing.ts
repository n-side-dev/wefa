import { computed, onMounted, ref, type Ref } from 'vue'
import { useResizeObserver } from '@vueuse/core'

// Composable to manage Gantt chart sizing and layout.
export const useGanttSizing = (
  container: Ref<HTMLElement | null>,
  header: Ref<HTMLElement | null>
) => {
  const containerHeight = ref(0)
  const headerHeight = ref(0)

  // Observe size changes of the container and header elements.
  useResizeObserver(container, (entries) => {
    const entry = entries[0]
    const { height } = entry!.contentRect
    containerHeight.value = height
  })
  useResizeObserver(header, (entries) => {
    const entry = entries[0]
    const { height } = entry!.contentRect
    headerHeight.value = height
  })

  onMounted(() => {
    containerHeight.value = container.value?.offsetHeight ?? 0
    headerHeight.value = header.value?.offsetHeight ?? 0
  })

  // Compute the body height in pixels (container height minus header height).
  const bodyHeightPx = computed(() => Math.max(0, containerHeight.value - headerHeight.value))
  // Compute the card style with dynamic height.
  const cardStyle = computed(() => ({
    height: `${containerHeight.value}px`,
  }))

  return {
    containerHeight,
    headerHeight,
    bodyHeightPx,
    cardStyle,
  }
}
