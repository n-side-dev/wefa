import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import GanttChartComponent from './GanttChartComponent.vue'
import GanttChartRowGrid from './GanttChartRowGrid.vue'
import type { GanttChartRowData } from './ganttChartTypes'

// Unlike GanttChartComponent.spec.ts, this suite keeps the real useVirtualList so the
// rendered row window is computed from the container height.
vi.mock('@/locales', () => ({
  useI18nLib: () => ({ t: (key: string) => key }),
}))

const VIEWPORT_HEIGHT_PX = 300

const rows: GanttChartRowData[] = Array.from({ length: 40 }, (_, index) => ({
  id: index + 1,
  label: `Row ${index + 1}`,
  activities: [
    {
      id: `bar-${index + 1}`,
      startDate: new Date(2026, 0, 2),
      endDate: new Date(2026, 0, 4),
      visualType: 'bar' as const,
    },
  ],
}))

describe('GanttChartComponent virtualization', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(VIEWPORT_HEIGHT_PX)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders enough rows to fill the viewport after the row height shrinks', async () => {
    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 7),
        rows,
        baseRowHeightPx: 30,
      },
      global: { directives: { tooltip: () => {} } },
    })
    const renderedRowsHeightPx = (rowHeightPx: number) =>
      wrapper.findAllComponents(GanttChartRowGrid).length * rowHeightPx
    await flushPromises()
    expect(renderedRowsHeightPx(30)).toBeGreaterThanOrEqual(VIEWPORT_HEIGHT_PX)

    await wrapper.setProps({ baseRowHeightPx: 10 })
    await flushPromises()

    expect(renderedRowsHeightPx(10)).toBeGreaterThanOrEqual(VIEWPORT_HEIGHT_PX)
  })
})
