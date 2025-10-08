import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { expect, within, userEvent, waitFor } from 'storybook/test'
import FormComponent from './FormComponent.vue'
import { onUnmounted } from 'vue'
import { useI18nLib } from '@/locales'

const meta: Meta<typeof FormComponent> = {
  title: 'Components/Form',
  component: FormComponent,
  args: {
    modelValue: { username: '', age: 0 },
    formFields: [
      {
        field: 'username',
        editor: 'InputText',
        editorProps: { placeholder: 'Username' },
        validation: { required: true, minLength: 3 },
      },
      {
        field: 'age',
        editor: 'InputNumber',
        editorProps: { min: 0 },
        validation: { required: true },
      },
    ],
    submitProps: { label: 'Submit', severity: 'secondary' },
    formProps: {},
  },
  argTypes: {
    modelValue: {
      control: 'object',
      description: 'The form data object (v-model binding)',
    },
    formFields: {
      control: 'object',
      description: 'Array of form field definitions with editors and validations',
    },
    submitProps: {
      control: 'object',
      description: 'Passthrough props for the submit Button (optional)',
    },
    formProps: {
      control: 'object',
      description: 'Passthrough props for the underlying PrimeVue Form',
    },
  },
  parameters: {
    layout: 'centered',
  },
}
export default meta

type Story = StoryObj<typeof FormComponent>

export const Default: Story = {
  render: (args) => ({
    components: { FormComponent },
    setup() {
      return { args }
    },
    template: '<FormComponent v-bind="args" v-model="args.modelValue" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() => {
      expect(canvas.getByRole('button')).toBeInTheDocument()
      expect(canvas.getByRole('spinbutton')).toBeInTheDocument() // InputNumber
      expect(canvas.getByPlaceholderText('Username')).toBeInTheDocument()
    })
  },
}

export const WithValidationErrors: Story = {
  args: {
    modelValue: { username: '', age: '' },
  },
  render: (args) => ({
    components: { FormComponent },
    setup() {
      return { args }
    },
    template: '<FormComponent v-bind="args" v-model="args.modelValue" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const submitButton = canvas.getByRole('button', { name: /Submit/ })
    await userEvent.click(submitButton)
    await waitFor(() => {
      expect(canvas.getByText('Username must be at least 3 characters.')).toBeInTheDocument()
      expect(canvas.getByText('Age is required.')).toBeInTheDocument()
    })
  },
}

export const WithCustomEditorProps: Story = {
  args: {
    formFields: [
      {
        field: 'username',
        editor: 'InputText',
        editorProps: { placeholder: 'Enter your username', class: 'w-full' },
        validation: { required: true, minLength: 3 },
      },
      {
        field: 'age',
        editor: 'InputNumber',
        editorProps: { min: 0, max: 100, showButtons: true },
        validation: { required: true },
      },
    ],
  },
  render: (args) => ({
    components: { FormComponent },
    setup() {
      return { args }
    },
    template: '<FormComponent v-bind="args" v-model="args.modelValue" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const usernameInput = canvas.getByPlaceholderText('Enter your username')
    await expect(usernameInput).toBeInTheDocument()
    const ageInput = canvas.getByRole('spinbutton')
    await expect(ageInput).toBeInTheDocument()
  },
}

export const WithCustomValidation: Story = {
  args: {
    formFields: [
      {
        field: 'email',
        editor: 'InputText',
        validation: { custom: 'email' },
      },
    ],
    modelValue: { email: '' },
  },
  render: (args) => ({
    components: { FormComponent },
    setup() {
      return { args }
    },
    template: '<FormComponent v-bind="args" v-model="args.modelValue" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const submitButton = canvas.getByRole('button', { name: /Submit/ })
    await userEvent.click(submitButton)
    await waitFor(() => {
      expect(canvas.getByText('Email must be a valid email address.')).toBeInTheDocument()
    })
  },
}

export const WithFrenchLocale: Story = {
  args: {
    formFields: [
      {
        field: 'email',
        editor: 'InputText',
        validation: { custom: 'email' },
      },
    ],
    modelValue: { email: '' },
    submitProps: { label: 'form.submit', severity: 'secondary' },
  },
  render: (args) => ({
    components: { FormComponent },
    setup() {
      const { mergeLocaleMessage, locale } = useI18nLib()
      // Register French translations
      mergeLocaleMessage('fr', {
        form: {
          email: 'E-mail',
          submit: 'Envoyer',
        },
        validation: {
          email: "{field} n'est pas une adresse e-mail valide.",
        },
      })
      // Store previous locale to restore later
      const previousLocale = locale.value
      locale.value = 'fr'
      // Restore locale on unmount
      onUnmounted(() => {
        locale.value = previousLocale
      })
      return { args }
    },
    template: '<FormComponent v-bind="args" v-model="args.modelValue" />',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const submitButton = canvas.getByRole('button', { name: /Envoyer/ })
    await expect(submitButton).toBeInTheDocument()
    await userEvent.click(submitButton)
    await waitFor(() => {
      expect(canvas.getByText("E-mail n'est pas une adresse e-mail valide.")).toBeInTheDocument()
    })
  },
}

export const FormSubmission: Story = {
  render: (args) => ({
    components: { FormComponent },
    setup() {
      return { args }
    },
    template: '<FormComponent v-bind="args" v-model="args.modelValue" @submit="args.onSubmit" />',
  }),
  args: {
    modelValue: { username: 'testuser', age: 25 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const submitButton = canvas.getByRole('button', { name: /Submit/ })
    await userEvent.click(submitButton)
    // In a real test, mock console.log or assert emit
    await expect(canvas.queryByText('username is required')).not.toBeInTheDocument()
  },
}
