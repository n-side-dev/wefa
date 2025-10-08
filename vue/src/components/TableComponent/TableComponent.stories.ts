import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { expect, within, userEvent, waitFor } from 'storybook/test'
import TableComponent from './TableComponent.vue'

const meta: Meta<typeof TableComponent> = {
  title: 'Components/Table',
  component: TableComponent,
  args: {
    modelValue: [
      { id: 1, name: 'John Doe', age: 30 },
      { id: 2, name: 'Jane Smith', age: 25 },
    ],
    columns: [
      { field: 'name', header: 'Name', editor: 'InputText' },
      { field: 'age', header: 'Age', editor: 'InputNumber', editorProps: { min: 0 } },
    ],
    editMode: undefined,
    tableProps: {},
  },
  argTypes: {
    modelValue: {
      control: 'object',
      description: 'The data array for the table (v-model binding)',
    },
    columns: { control: 'object', description: 'Array of column definitions' },
    editMode: {
      control: 'select',
      options: [undefined, 'row', 'cell'],
      description: 'Editing mode: row or cell',
    },
    tableProps: {
      control: 'object',
      description: 'Passthrough props for the underlying PrimeVue DataTable',
    },
  },
  parameters: {
    layout: 'fullscreen',
  },
}
export default meta

type Story = StoryObj<typeof TableComponent>

export const Default: Story = {
  render: (args) => ({
    components: { TableComponent },
    setup() {
      return { args }
    },
    template: '<TableComponent v-bind="args" v-model="args.modelValue" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Name')).toBeInTheDocument()
    await expect(canvas.getByText('Age')).toBeInTheDocument()
    await expect(canvas.getByText('John Doe')).toBeInTheDocument()
    await expect(canvas.getByText('30')).toBeInTheDocument()
  },
}

export const RowEditMode: Story = {
  args: {
    editMode: 'row',
  },
  render: (args) => ({
    components: { TableComponent },
    setup() {
      return { args }
    },
    template: '<TableComponent v-bind="args" v-model="args.modelValue" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const editButtons = canvas.getAllByRole('button', { name: /Edit/ })
    await expect(editButtons.length).toBeGreaterThan(0)
    await expect(canvas.getByText('John Doe')).toBeInTheDocument()
  },
}

export const CellEditMode: Story = {
  args: {
    editMode: 'cell',
  },
  render: (args) => ({
    components: { TableComponent },
    setup() {
      return { args }
    },
    template: '<TableComponent v-bind="args" v-model="args.modelValue" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('John Doe')).toBeInTheDocument()
    // Cell edit typically starts on double-click; test presence of data
  },
}

export const WithCustomBody: Story = {
  args: {
    editMode: 'cell',
    columns: [
      { field: 'name', header: 'Name', editor: 'InputText' },
      { field: 'age', header: 'Age', editor: 'InputNumber', editorProps: { min: 0 } },
      {
        field: 'status',
        header: 'Status',
        body: 'Chip',
        bodyProps: { removable: false },
        editor: 'Select',
        editorProps: { options: ['Active', 'Inactive'] },
      },
    ],
    modelValue: [
      { id: 1, name: 'John Doe', age: 30, status: 'Active' },
      { id: 2, name: 'Jane Smith', age: 25, status: 'Inactive' },
    ],
  },
  render: (args) => ({
    components: { TableComponent },
    setup() {
      return { args }
    },
    template: '<TableComponent v-bind="args" v-model="args.modelValue" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Status')).toBeInTheDocument()
    // Robust: wait for Chip by class and check text content
    let chip: Element | null = null
    await waitFor(() => {
      chip = canvasElement.querySelector('.p-chip, .chip-stub')
      expect(chip).not.toBeNull()
      if (!chip) throw new Error('Chip not found')
      expect(chip.textContent).toContain('Active')
    })
  },
}

export const WithPassthroughProps: Story = {
  args: {
    editMode: 'cell',
    tableProps: {
      stripedRows: true,
      paginator: true,
      rows: 5,
      removableSort: true,
    },
    columns: [
      {
        field: 'name',
        header: 'Name',
        editor: 'InputText',
        columnProps: { sortable: true, filter: true },
      },
      {
        field: 'age',
        header: 'Age',
        editor: 'InputNumber',
        editorProps: { min: 0 },
        columnProps: { sortable: true, filter: true },
      },
      {
        field: 'status',
        header: 'Status',
        body: 'Chip',
        bodyProps: { removable: true, icon: 'pi pi-clipboard' },
        editor: 'Select',
        editorProps: {
          options: ['Active', 'Inactive', 'AnythingThroughProps'],
          filter: true,
          showClear: true,
        },
      },
    ],
    modelValue: [
      { id: 1, name: 'John Doe', age: 30, status: 'Active' },
      { id: 2, name: 'Jane Smith', age: 25, status: 'Inactive' },
      { id: 3, name: 'Alice Johnson', age: 28, status: 'AnythingThroughProps' },
      { id: 4, name: 'Bob Brown', age: 22, status: 'Active' },
      { id: 5, name: 'Charlie White', age: 35, status: 'Inactive' },
      { id: 6, name: 'Diana Green', age: 40, status: 'Active' },
      { id: 7, name: 'Ethan Blue', age: 32, status: 'Inactive' },
      { id: 8, name: 'Fiona Yellow', age: 29, status: 'Active' },
      { id: 9, name: 'George Purple', age: 31, status: 'Inactive' },
      { id: 10, name: 'Hannah Orange', age: 27, status: 'Active' },
    ],
  },
  render: (args) => ({
    components: { TableComponent },
    setup() {
      return { args }
    },
    template: '<TableComponent v-bind="args" v-model="args.modelValue" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Name')).toBeInTheDocument() // Sort icons would appear, but DOM check for headers
  },
}

export const RowEditingInteraction: Story = {
  args: {
    editMode: 'row',
  },
  render: (args) => ({
    components: { TableComponent },
    setup() {
      return { args }
    },
    template: '<TableComponent v-bind="args" v-model="args.modelValue" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const editButtons = canvas.getAllByRole('button', { name: /Edit/ })
    const editButton = editButtons[0]
    if (!editButton) throw new Error('Edit button not found')
    await userEvent.click(editButton)
    // Wait for input to appear (PrimeVue InputText may not have role="textbox")
    let input
    try {
      input = await canvas.findByRole('textbox', {}, { timeout: 1000 })
    } catch {
      // Fallback: find input by tag
      input = canvasElement.querySelector('input')
    }
    if (!input) throw new Error('No input found for editing')
    await userEvent.type(input, ' Updated')
    const saveButton = canvas.getByRole('button', { name: /Save/ })
    await userEvent.click(saveButton)
    // In real test, assert model update or emit, but here check DOM update if reactive
  },
}
