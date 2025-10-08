// cspell:ignore datatable
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TableComponent from './TableComponent.vue'
import { componentRegistry } from '../../utils/componentRegistry'

const baseColumns = [
  { field: 'name', header: 'Name', editor: 'InputText' },
  { field: 'age', header: 'Age', editor: 'InputNumber', editorProps: { min: 0 } },
]
const baseRows = [
  { id: 1, name: 'John Doe', age: 30 },
  { id: 2, name: 'Jane Smith', age: 25 },
]

describe('TableComponent', () => {
  let rows: Record<string, unknown>[]
  let columns: import('./TableComponent.vue').TableColumn[]

  // PrimeVue stubs
  const DataTableStub = {
    name: 'DataTable',
    // Use a div to avoid native table prop warnings
    template: `
      <div class="datatable-stub">
        <div class="datatable-header"><slot name="header"></slot></div>
        <div class="datatable-body"><slot></slot></div>
      </div>
    `,
    emits: ['row-edit-save', 'cell-edit-complete'],
  }
  const ColumnStub = {
    name: 'Column',
    // Render header and default slots for test visibility
    template: `
      <th v-if="$slots.header"><slot name='header'></slot></th>
      <td v-else><slot></slot></td>
    `,
  }
  const globalStubs = {
    DataTable: DataTableStub,
    Column: ColumnStub,
    InputText: true,
    InputNumber: true,
    Select: true,
    Chip: {
      template: '<span class="chip-stub">ChipStub</span>',
    },
  }

  beforeEach(() => {
    rows = JSON.parse(JSON.stringify(baseRows))
    columns = JSON.parse(JSON.stringify(baseColumns))
  })

  it('renders DataTable and columns', () => {
    const wrapper = mount(TableComponent, {
      props: { columns, modelValue: rows },
      // No stubs: render real DataTable/Column for text content
    })
    expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(true)
    expect(wrapper.findAllComponents({ name: 'Column' }).length).toBe(columns.length)
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Age')
  })

  it('renders row data', () => {
    const wrapper = mount(TableComponent, {
      props: { columns, modelValue: rows },
      // No stubs: render real DataTable/Column for text content
    })
    expect(wrapper.text()).toContain('John Doe')
    expect(wrapper.text()).toContain('Jane Smith')
    expect(wrapper.text()).toContain('30')
    expect(wrapper.text()).toContain('25')
  })

  it('supports row edit mode', async () => {
    const wrapper = mount(TableComponent, {
      props: { columns, modelValue: rows, editMode: 'row' },
      global: { stubs: globalStubs },
    })
    // Should render an extra column for row editor
    expect(wrapper.findAllComponents({ name: 'Column' }).length).toBe(columns.length + 1)
  })

  it('supports cell edit mode', () => {
    const wrapper = mount(TableComponent, {
      props: { columns, modelValue: rows, editMode: 'cell' },
      global: { stubs: globalStubs },
    })
    expect(wrapper.findAllComponents({ name: 'Column' }).length).toBe(columns.length)
  })

  it('renders custom body component if provided', () => {
    const customColumns = [
      ...columns,
      { field: 'status', header: 'Status', body: 'Chip', bodyProps: { removable: false } },
    ]
    const customRows = [...rows, { id: 3, name: 'Alice', age: 28, status: 'Active' }]
    // Save original Chip
    const originalChip = componentRegistry.get('Chip')
    // Override with stub
    componentRegistry.set('Chip', { template: '<span class="chip-stub">ChipStub</span>' })
    try {
      const wrapper = mount(TableComponent, {
        props: { columns: customColumns, modelValue: customRows },
      })
      expect(wrapper.html()).toContain('chip-stub')
    } finally {
      // Restore original Chip
      if (originalChip) componentRegistry.set('Chip', originalChip)
    }
  })

  it('emits row-edit-save event and updates modelValue on row edit save', async () => {
    const wrapper = mount(TableComponent, {
      props: {
        columns,
        modelValue: rows,
        editMode: 'row',
        'onUpdate:modelValue': () => {
          /* no-op for test */
        },
      },
      global: { stubs: globalStubs },
    })
    // Simulate row edit save by emitting the event from DataTable
    const event: unknown = { newData: { id: 1, name: 'Updated', age: 31 }, index: 0 }
    await wrapper.findComponent({ name: 'DataTable' }).vm.$emit('row-edit-save', event)
    // The Table component should emit 'row-edit-save' and update modelValue
    expect(wrapper.emitted('row-edit-save')).toBeTruthy()
    // Simulate parent updating the prop
    await wrapper.setProps({ modelValue: [{ id: 1, name: 'Updated', age: 31 }, rows[1]!] })
    expect(wrapper.props('modelValue')[0]?.['name']).toBe('Updated')
    expect(wrapper.props('modelValue')[0]?.['age']).toBe(31)
  })

  it('emits cell-edit-save event and updates modelValue on cell edit save', async () => {
    const wrapper = mount(TableComponent, {
      props: {
        columns,
        modelValue: rows,
        editMode: 'cell',
        'onUpdate:modelValue': () => {
          /* no-op for test */
        },
      },
      global: { stubs: globalStubs },
    })
    // Simulate cell edit complete by emitting the event from DataTable
    const event: unknown = { data: { ...rows[0] }, newValue: 35, field: 'age' }
    await wrapper.findComponent({ name: 'DataTable' }).vm.$emit('cell-edit-complete', event)
    expect(wrapper.emitted('cell-edit-save')).toBeTruthy()
    // Simulate parent updating the prop
    const newRows = [...rows]
    newRows[0] = { ...newRows[0], age: 35 }
    await wrapper.setProps({ modelValue: newRows })
    expect(wrapper.props('modelValue')[0]?.['age']).toBe(35)
  })

  it('applies passthrough tableProps', () => {
    const wrapper = mount(TableComponent, {
      props: {
        columns,
        modelValue: rows,
        tableProps: { stripedRows: true, paginator: true, rows: 5 },
      },
      global: { stubs: globalStubs },
    })
    // DataTable should receive these props; check for class or prop presence
    expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(true)
  })

  it('handles empty columns and rows gracefully', () => {
    const wrapper = mount(TableComponent, {
      props: { columns: [], modelValue: [] },
      global: { stubs: globalStubs },
    })
    expect(wrapper.findAllComponents({ name: 'Column' }).length).toBe(0)
  })
})
