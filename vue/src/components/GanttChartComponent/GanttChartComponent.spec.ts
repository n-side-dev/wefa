import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import GanttChartComponent from './GanttChartComponent.vue'
import GanttChartRowGrid from './GanttChartRowGrid.vue'
import {
  BASE_ROW_HEIGHT_PX,
  DAY_CELL_WIDTH_PX,
  MINI_GAP_PX,
  MINI_HEIGHT_PX,
  getWeekColumns,
} from './ganttChartLayout'
import type { GanttChartActivityInteractionPayload, GanttChartRowData } from './ganttChartTypes'

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

  it('selects an activity interaction when an activity is clicked', async () => {
    const activitySelect = vi.fn()
    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 7),
        rows: baseRows,
        selectedHighlightClass: 'selected-test-class',
        activitySelect,
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

    const selected = wrapper.emitted('activitySelect')?.[0]?.[0] as
      | GanttChartActivityInteractionPayload
      | undefined
    expect(selected?.activity.id).toBe('bar-1')
    expect(selected?.rowData?.id).toBe(1)
    expect(selected?.rowKey).toBe(1)
    expect(selected?.activityKey).toBe('bar-1')
    expect(selected?.context.columnIndex).toBe(0)
    expect(wrapper.emitted('update:selectedInteraction')?.[0]?.[0]).toEqual(selected)
    expect(activitySelect).toHaveBeenCalledWith(selected)
    expect(wrapper.html()).toContain('selected-test-class')
  })

  it('clears internal selection when the selected activity cell is clicked again', async () => {
    const activitySelect = vi.fn()
    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 7),
        rows: baseRows,
        selectedHighlightClass: 'selected-test-class',
        activitySelect,
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
    await wrapper.find('span').trigger('click')

    expect(wrapper.emitted('update:selectedInteraction')?.[1]?.[0]).toBeNull()
    expect(activitySelect).toHaveBeenLastCalledWith(null)
    expect(wrapper.html()).not.toContain('selected-test-class')
  })

  it('forwards the shared interaction payload when an activity is hovered', async () => {
    const activityHover = vi.fn()
    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 7),
        rows: baseRows,
        activityHover,
      },
      global: {
        directives: {
          tooltip: () => {
            /* no-op */
          },
        },
      },
    })

    wrapper.find('span').element.dispatchEvent(
      new MouseEvent('mousemove', {
        clientX: DAY_CELL_WIDTH_PX * 2 + 1,
        clientY: 12,
        bubbles: true,
      })
    )
    await nextTick()

    const payload = activityHover.mock.calls[0]?.[3] as
      | GanttChartActivityInteractionPayload
      | undefined
    expect(payload?.activity.id).toBe('bar-1')
    expect(payload?.rowData?.id).toBe(1)
    expect(payload?.rowIndex).toBe(0)
    expect(payload?.rowKey).toBe(1)
    expect(payload?.context.columnIndex).toBe(2)
    expect(payload?.context.date).toEqual(new Date(2026, 0, 3))
  })

  it('does not mutate internal selection when selectedInteraction is controlled', async () => {
    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 7),
        rows: baseRows,
        selectedInteraction: null,
        selectedHighlightClass: 'selected-test-class',
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

    expect(wrapper.emitted('update:selectedInteraction')).toBeTruthy()
    expect(wrapper.html()).not.toContain('selected-test-class')
  })

  it('requests clearing controlled selection when the selected activity cell is clicked again', async () => {
    const selectedInteraction: GanttChartActivityInteractionPayload = {
      activity: baseRows[0]!.activities[0]!,
      rowData: baseRows[0],
      rowIndex: 0,
      rowKey: 1,
      activityKey: 'bar-1',
      context: {
        columnIndex: 0,
        viewMode: 'day',
        date: new Date(2026, 0, 1),
      },
    }
    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 7),
        rows: baseRows,
        selectedInteraction,
        selectedHighlightClass: 'selected-test-class',
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

    expect(wrapper.emitted('update:selectedInteraction')?.[0]?.[0]).toBeNull()
    expect(wrapper.html()).toContain('selected-test-class')
  })

  it('renders controlled selected interaction highlights', () => {
    const selectedInteraction: GanttChartActivityInteractionPayload = {
      activity: baseRows[0]!.activities[0]!,
      rowData: baseRows[0],
      rowIndex: 0,
      rowKey: 1,
      activityKey: 'bar-1',
      context: {
        columnIndex: 2,
        viewMode: 'day',
        date: new Date(2026, 0, 3),
      },
    }

    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 7),
        rows: baseRows,
        selectedInteraction,
        selectedHighlightClass: 'selected-test-class',
      },
      global: {
        directives: {
          tooltip: () => {
            /* no-op */
          },
        },
      },
    })

    expect(wrapper.html()).toContain('selected-test-class')
  })

  it('applies activity and related link highlight classes for a selected activity', () => {
    const selectedInteraction: GanttChartActivityInteractionPayload = {
      activity: baseRows[0]!.activities[0]!,
      rowData: baseRows[0],
      rowIndex: 0,
      rowKey: 1,
      activityKey: 'bar-1',
      context: {
        columnIndex: 2,
        viewMode: 'day',
        date: new Date(2026, 0, 3),
      },
    }

    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 7),
        rows: baseRows,
        links: [{ id: 'related', fromId: 'bar-1', toId: 'bar-2' }],
        selectedInteraction,
        activityHighlightClass: 'activity-highlight-test',
        linkHighlightClass: 'link-highlight-test',
      },
      global: {
        directives: {
          tooltip: () => {
            /* no-op */
          },
        },
      },
    })

    expect(wrapper.html()).toContain('activity-highlight-test')
    expect(wrapper.get('[data-link-id="related"]').classes()).toContain('link-highlight-test')
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

  it('supports all source and target endpoint combinations for activity links', () => {
    const linkRows: GanttChartRowData[] = [
      {
        id: 'source-row',
        header: 'Source',
        activities: [
          {
            id: 'source',
            label: 'Source',
            startDate: new Date(2026, 0, 1),
            endDate: new Date(2026, 0, 2),
            visualType: 'bar',
          },
        ],
      },
      {
        id: 'target-row',
        header: 'Target',
        activities: [
          {
            id: 'target',
            label: 'Target',
            startDate: new Date(2026, 0, 4),
            endDate: new Date(2026, 0, 5),
            visualType: 'bar',
          },
        ],
      },
    ]
    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 7),
        rows: linkRows,
        links: [
          { id: 'start-start', fromId: 'source', toId: 'target', type: 'start-start' },
          { id: 'start-end', fromId: 'source', toId: 'target', type: 'start-end' },
          { id: 'end-start', fromId: 'source', toId: 'target', type: 'end-start' },
          { id: 'end-end', fromId: 'source', toId: 'target', type: 'end-end' },
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

    const pathFor = (id: string) => wrapper.get(`[data-link-id="${id}"]`).attributes('d') ?? ''

    expect(pathFor('start-start')).toMatch(/^M 0 /)
    expect(pathFor('start-start')).toMatch(/ L 120 45$/)
    expect(pathFor('start-end')).toMatch(/^M 0 /)
    expect(pathFor('start-end')).toMatch(/ L 200 45$/)
    expect(pathFor('end-start')).toMatch(/^M 80 /)
    expect(pathFor('end-start')).toMatch(/ L 120 45$/)
    expect(pathFor('end-end')).toMatch(/^M 80 /)
    expect(pathFor('end-end')).toMatch(/ L 200 45$/)
  })

  it('uses unique arrow markers when multiple links share the same id', () => {
    const linkRows: GanttChartRowData[] = [
      {
        id: 'source-row',
        header: 'Source',
        activities: [
          {
            id: 'source',
            label: 'Source',
            startDate: new Date(2026, 0, 1),
            endDate: new Date(2026, 0, 2),
            visualType: 'bar',
          },
        ],
      },
      {
        id: 'target-row-a',
        header: 'Target A',
        activities: [
          {
            id: 'target-a',
            label: 'Target A',
            startDate: new Date(2026, 0, 4),
            endDate: new Date(2026, 0, 5),
            visualType: 'bar',
          },
        ],
      },
      {
        id: 'target-row-b',
        header: 'Target B',
        activities: [
          {
            id: 'target-b',
            label: 'Target B',
            startDate: new Date(2026, 0, 6),
            endDate: new Date(2026, 0, 7),
            visualType: 'bar',
          },
        ],
      },
    ]
    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 7),
        rows: linkRows,
        links: [
          {
            id: 'duplicate',
            fromId: 'source',
            toId: 'target-a',
            type: 'start-start',
            color: 'red',
          },
          {
            id: 'duplicate',
            fromId: 'source',
            toId: 'target-b',
            type: 'start-start',
            color: 'green',
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

    const paths = wrapper.findAll('[data-link-id="duplicate"]')
    expect(paths).toHaveLength(2)
    expect(paths[0]?.attributes('marker-end')).not.toBe(paths[1]?.attributes('marker-end'))

    const markers = wrapper.findAll('marker')
    expect(markers[0]?.find('path').attributes('fill')).toBe('red')
    expect(markers[1]?.find('path').attributes('fill')).toBe('green')
  })

  it('highlights related links when an activity is hovered', async () => {
    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 7),
        rows: baseRows,
        links: [{ id: 'related', fromId: 'bar-1', toId: 'bar-2' }],
        linkHighlightClass: 'link-highlight-test',
      },
      global: {
        directives: {
          tooltip: () => {
            /* no-op */
          },
        },
      },
    })

    wrapper.find('span').element.dispatchEvent(
      new MouseEvent('mousemove', {
        clientX: DAY_CELL_WIDTH_PX * 2 + 1,
        clientY: 12,
        bubbles: true,
      })
    )
    await nextTick()

    expect(wrapper.get('[data-link-id="related"]').classes()).toContain('link-highlight-test')
  })

  it('highlights related activities when a link is hovered without opening a popover', async () => {
    const activityHover = vi.fn()
    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 7),
        rows: baseRows,
        links: [{ id: 'related', fromId: 'bar-1', toId: 'bar-2' }],
        activityHover,
        activityPopoverShowDelayMs: 0,
        activityHighlightClass: 'activity-highlight-test',
        linkHighlightClass: 'link-highlight-test',
      },
      slots: {
        'activity-popover': () => h('div', { class: 'activity-popover-test' }, 'Popover'),
      },
      global: {
        directives: {
          tooltip: () => {
            /* no-op */
          },
        },
      },
    })

    await wrapper.get('[data-link-id="related"]').trigger('pointerenter')

    expect(activityHover).not.toHaveBeenCalled()
    expect(wrapper.find('.activity-popover-test').exists()).toBe(false)
    expect(wrapper.html()).toContain('activity-highlight-test')
    expect(wrapper.get('[data-link-id="related"]').classes()).toContain('link-highlight-test')

    await wrapper.get('[data-link-id="related"]').trigger('pointerleave')

    expect(wrapper.get('[data-link-id="related"]').classes()).not.toContain('link-highlight-test')
  })

  it('applies programmatic activity and link highlights', () => {
    const wrapper = mount(GanttChartComponent, {
      props: {
        startDate: new Date(2026, 0, 1),
        endDate: new Date(2026, 0, 7),
        rows: baseRows,
        links: [{ id: 'related', fromId: 'bar-1', toId: 'bar-2' }],
        highlightedActivityIds: ['bar-1'],
        highlightedLinkIds: ['related'],
        activityHighlightClass: 'activity-highlight-test',
        linkHighlightClass: 'link-highlight-test',
      },
      global: {
        directives: {
          tooltip: () => {
            /* no-op */
          },
        },
      },
    })

    expect(wrapper.html()).toContain('activity-highlight-test')
    expect(wrapper.get('[data-link-id="related"]').classes()).toContain('link-highlight-test')
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
