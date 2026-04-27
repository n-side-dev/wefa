import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import GanttChartComponent from './GanttChartComponent.vue'
import GanttChartRowGrid from './GanttChartRowGrid.vue'
import { BASE_ROW_HEIGHT_PX, MINI_GAP_PX, MINI_HEIGHT_PX, getWeekColumns } from './ganttChartLayout'
import type { GanttChartRowData } from './ganttChartTypes'

vi.mock('@/locales', () => ({
  useI18nLib: () => ({ t: (key: string) => key }),
}))

vi.mock('@vueuse/core', async () => {
  const vue = await import('vue')
  return {
    useResizeObserver: () => {
      /* no-op for tests */
    },
    useVirtualList: (source: unknown) => {
      const list = vue.computed(() => {
        const value = vue.unref(source) ?? []
        return (value as Array<unknown>).map((data, index) => ({ data, index }))
      })
      return {
        list,
        containerProps: {
          ref: vue.ref(null),
          onScroll: () => {
            /* no-op */
          },
          style: {},
        },
        wrapperProps: vue.computed(() => ({
          style: { width: '100%', height: '100%', marginTop: '0px' },
        })),
      }
    },
  }
})

const baseRows: GanttChartRowData[] = [
  {
    id: 1,
    label: 'Row 1',
    header: 'Line A',
    activities: [
      {
        id: 'bar-1',
        label: 'Optimized',
        startDate: new Date(2026, 0, 3),
        endDate: new Date(2026, 0, 5),
        visualType: 'bar',
        colorClass: 'bg-emerald-400/80',
      },
    ],
  },
  {
    id: 2,
    label: 'Row 2',
    header: 'Line B',
    activities: [
      {
        id: 'bar-2',
        label: 'Optimized',
        startDate: new Date(2026, 0, 5),
        endDate: new Date(2026, 0, 7),
        visualType: 'bar',
        colorClass: 'bg-emerald-400/80',
      },
    ],
  },
]

describe('GanttChartComponent', () => {
  it('renders top-left header label and row headers', () => {
    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 7),
        rows: baseRows,
        headerLabel: 'Line',
      },
      global: {
        directives: {
          tooltip: () => {
            /* no-op */
          },
        },
      },
    })

    expect(wrapper.text()).toContain('Line')
    expect(wrapper.text()).toContain('Line A')
  })

  it('renders a custom row-label slot instead of the default row header', () => {
    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 7),
        rows: baseRows,
      },
      slots: {
        'row-label': ({ rowData }: { rowData: GanttChartRowData }) =>
          h('div', { class: 'custom-row-label' }, `Run ${rowData.header}`),
      },
      global: {
        directives: {
          tooltip: () => {
            /* no-op */
          },
        },
      },
    })

    expect(wrapper.find('.custom-row-label').exists()).toBe(true)
    expect(wrapper.text()).toContain('Run Line A')
    expect(wrapper.text()).not.toContain('gantt_chart.row')
  })

  it('emits activityClick with activity and row data', async () => {
    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 7),
        rows: baseRows,
      },
      global: {
        directives: {
          tooltip: () => {
            /* no-op */
          },
        },
      },
    })

    await wrapper.find('span').trigger('click')

    const emitted = wrapper.emitted('activityClick') as unknown[] | undefined
    expect(emitted).toBeTruthy()
    const payload = emitted?.[0] as Array<{ label?: string; id?: number }>
    expect(payload?.[0]?.label).toBe('Optimized')
    expect(payload?.[1]?.id).toBe(1)
  })

  it('renders link paths when links are provided', () => {
    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 7),
        rows: baseRows,
        links: [{ fromId: 'bar-1', toId: 'bar-2' }],
      },
      global: {
        directives: {
          tooltip: () => {
            /* no-op */
          },
        },
      },
    })

    expect(wrapper.find('[data-link-id="bar-1-bar-2"]').exists()).toBe(true)
  })

  it('renders weekly headers with month spans across overlapping weeks', () => {
    const start = new Date(2026, 0, 25)
    const end = new Date(2026, 1, 10)
    const expectedWeeks = getWeekColumns(start, end).length

    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate: start,
        endDate: end,
        rows: baseRows,
        viewMode: 'week',
      },
      global: {
        directives: {
          tooltip: () => {
            /* no-op */
          },
        },
      },
    })

    const weekLabels = wrapper.findAll('[aria-label^="gantt_chart.week "]')
    expect(weekLabels.length).toBe(expectedWeeks)
    expect(wrapper.text()).toContain('Jan 2026')
    expect(wrapper.text()).toContain('Feb 2026')
  })

  it('hides day headers in weekly view', () => {
    const startDate = new Date(2026, 0, 1)
    const endDate = new Date(2026, 0, 7)
    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate,
        endDate,
        rows: baseRows,
        viewMode: 'week',
      },
      global: {
        directives: {
          tooltip: () => {
            /* no-op */
          },
        },
      },
    })

    expect(wrapper.html()).not.toContain('Thu Jan 01 2026')
  })

  it('stacks mini activities by week when in weekly view', () => {
    const startDate = new Date(2026, 0, 1)
    const endDate = new Date(2026, 0, 7)
    const miniRows: GanttChartRowData[] = [
      {
        id: 1,
        header: 'Line A',
        activities: [
          {
            id: 'mini-1',
            label: 'Mini',
            startDate: new Date(2026, 0, 1),
            endDate: new Date(2026, 0, 2),
            visualType: 'mini',
            colorClass: 'bg-amber-400/80',
          },
          {
            id: 'mini-2',
            label: 'Mini',
            startDate: new Date(2026, 0, 3),
            endDate: new Date(2026, 0, 4),
            visualType: 'mini',
            colorClass: 'bg-amber-400/80',
          },
        ],
      },
    ]

    const dayWrapper = mount(GanttChartComponent, {
      props: {
        startDate,
        endDate,
        rows: miniRows,
        viewMode: 'day',
        stackMiniActivities: true,
      },
      global: {
        directives: {
          tooltip: () => {
            /* no-op */
          },
        },
      },
    })
    const weekWrapper = mount(GanttChartComponent, {
      props: {
        startDate,
        endDate,
        rows: miniRows,
        viewMode: 'week',
        stackMiniActivities: true,
      },
      global: {
        directives: {
          tooltip: () => {
            /* no-op */
          },
        },
      },
    })

    const [dayRow] = dayWrapper.findAllComponents(GanttChartRowGrid)
    const [weekRow] = weekWrapper.findAllComponents(GanttChartRowGrid)

    expect(dayRow?.attributes('style')).toContain(`height: ${BASE_ROW_HEIGHT_PX}px`)
    const expectedWeekHeight = BASE_ROW_HEIGHT_PX + MINI_HEIGHT_PX + MINI_GAP_PX
    expect(weekRow?.attributes('style')).toContain(`height: ${expectedWeekHeight}px`)
  })

  it('renders background activities as solid full-row blocks', () => {
    const wrapper = mount(GanttChartRowGrid, {
      props: {
        dateRange: [new Date(2026, 0, 1), new Date(2026, 0, 2), new Date(2026, 0, 3)],
        activities: [
          {
            id: 'background-1',
            startDate: new Date(2026, 0, 1),
            endDate: new Date(2026, 0, 2),
            visualType: 'background',
            color: 'rgb(255, 0, 0)',
          },
        ],
      },
      global: {
        directives: {
          tooltip: () => {
            /* no-op */
          },
        },
      },
    })

    expect(wrapper.html()).toContain('background-color: rgb(255, 0, 0)')
    expect(wrapper.html()).toContain(`height: ${BASE_ROW_HEIGHT_PX}px`)
  })

  it('adds row height and bar top offset when barOffsetTopPx is provided', () => {
    const wrapper = mount(GanttChartRowGrid, {
      props: {
        dateRange: [new Date(2026, 0, 1), new Date(2026, 0, 2), new Date(2026, 0, 3)],
        activities: [
          {
            id: 'bar-offset',
            label: 'Offset',
            startDate: new Date(2026, 0, 1),
            endDate: new Date(2026, 0, 2),
            visualType: 'bar',
            colorClass: 'bg-emerald-400/80',
            barOffsetTopPx: 8,
          },
        ],
      },
      global: {
        directives: {
          tooltip: () => {
            /* no-op */
          },
        },
      },
    })

    expect(wrapper.attributes('style')).toContain(`height: ${BASE_ROW_HEIGHT_PX + 8}px`)
    const barElement = wrapper.get('span').element.parentElement
    expect(barElement?.getAttribute('style')).toContain('top: 12px;')
  })
})
