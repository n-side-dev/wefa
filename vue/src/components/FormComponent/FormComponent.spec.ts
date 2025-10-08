import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import FormComponent from './FormComponent.vue'
import { componentRegistry } from '../../utils/componentRegistry'
import { validatorRegistry } from '@/utils/validatorRegistry'
import { Form, FormField } from '@primevue/forms'
import { z } from 'zod'

describe('FormComponent', () => {
  let formFields: import('./FormComponent.vue').FormField[]
  let modelValue: Record<string, unknown>

  const ButtonStub = {
    name: 'Button',
    template: '<button type="submit" class="button-stub">{{ label }}<slot></slot></button>',
    props: ['label', 'severity'],
  }
  const MessageStub = {
    name: 'Message',
    template: '<div class="message-stub"><slot></slot></div>',
    props: ['severity', 'size', 'variant'],
  }
  const globalStubs = {
    Button: ButtonStub,
    Message: MessageStub,
  }

  beforeEach(() => {
    formFields = [
      {
        field: 'username',
        editor: 'InputText',
        validation: { required: true, minLength: 3 },
      },
      {
        field: 'age',
        editor: 'InputNumber',
        editorProps: { min: 0 },
        validation: { required: true },
      },
    ]
    modelValue = { username: '', age: '' }
    // Ensure InputText and InputNumber are registered with stubs for testing
    componentRegistry.set('InputText', { template: '<input class="input-text-stub" />' })
    componentRegistry.set('InputNumber', {
      template: '<input type="number" class="input-number-stub" />',
    })
  })

  it('renders Form and FormFields', () => {
    const wrapper = mount(FormComponent, {
      props: { formFields, modelValue },
      global: { stubs: globalStubs, components: { Form, FormField } },
    })
    expect(wrapper.findComponent(Form).exists()).toBe(true)
    expect(wrapper.findAllComponents(FormField).length).toBe(formFields.length)
    expect(wrapper.find('.input-text-stub').exists()).toBe(true)
    expect(wrapper.find('.input-number-stub').exists()).toBe(true)
  })

  it('renders submit button', () => {
    const wrapper = mount(FormComponent, {
      props: {
        formFields,
        modelValue,
        submitProps: { label: 'Submit', severity: 'secondary' },
      },
      global: { stubs: globalStubs, components: { Form, FormField } },
    })
    const button = wrapper.find('.button-stub')
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Submit')
  })

  it('displays validation errors on submit with invalid data', async () => {
    const wrapper = mount(FormComponent, {
      props: {
        formFields,
        modelValue,
        'onUpdate:modelValue': () => {
          /* no-op for test */
        },
      },
      global: { stubs: globalStubs, components: { Form, FormField } },
      attachTo: document.body, // Ensure DOM events work as expected
    })
    // Simulate clicking the submit button to trigger validation
    const button = wrapper.find('.button-stub')
    await button.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    // Check for error messages
    expect(wrapper.text()).toMatch(
      /Username must be at least 3 characters\.|Username is required\./
    )
    expect(wrapper.text()).toMatch(/Age is required\./)
  })

  it('emits submit event with valid data', async () => {
    const wrapper = mount(FormComponent, {
      props: {
        formFields,
        modelValue: { username: 'testuser', age: 25 },
        'onUpdate:modelValue': () => {
          /* no-op for test */
        },
      },
      global: { stubs: globalStubs, components: { Form, FormField } },
      attachTo: document.body, // Ensure DOM events work as expected
    })
    // Simulate clicking the submit button
    const button = wrapper.find('.button-stub')
    await button.trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')![0]).toEqual([
      { values: { username: 'testuser', age: 25 }, valid: true },
    ])
  })

  it('preserves extra model fields on submit', async () => {
    const wrapper = mount(FormComponent, {
      props: {
        formFields,
        modelValue: { username: 'testuser', age: 25, extraField: 'untouched' },
        'onUpdate:modelValue': (newValue: Record<string, unknown>) => {
          wrapper.setProps({ modelValue: newValue })
        },
      },
      global: { stubs: globalStubs, components: { Form, FormField } },
    })
    await wrapper.find('.button-stub').trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.props('modelValue').extraField).toBe('untouched')
    expect(wrapper.props('modelValue').username).toBe('testuser')
    expect(wrapper.props('modelValue').age).toBe(25)
  })

  it('applies editorProps to dynamic components', () => {
    const wrapper = mount(FormComponent, {
      props: {
        formFields: [
          {
            field: 'username',
            editor: 'InputText',
            editorProps: { placeholder: 'Enter username' },
            validation: { required: true },
          },
        ],
        modelValue: { username: '' },
      },
      global: { stubs: globalStubs, components: { Form, FormField } },
    })
    const input = wrapper.find('.input-text-stub')
    expect(input.attributes('placeholder')).toBe('Enter username')
  })

  it('handles custom validation', async () => {
    // Mock a custom validator
    const originalValidator = validatorRegistry.get('email')
    validatorRegistry.set('email', () => z.string().email('Invalid email address.'))
    try {
      const wrapper = mount(FormComponent, {
        props: {
          formFields: [
            {
              field: 'email',
              editor: 'InputText',
              validation: { custom: 'email' },
            },
          ],
          modelValue: { email: 'invalid' },
          'onUpdate:modelValue': () => {
            /* no-op for test */
          },
        },
        global: { stubs: globalStubs, components: { Form, FormField } },
        attachTo: document.body, // Ensure DOM events work as expected
      })
      // Simulate clicking the submit button
      const button = wrapper.find('.button-stub')
      await button.trigger('click')
      await flushPromises()
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toMatch(
        /Email must be a valid email address\.|Invalid email address\./
      )
    } finally {
      if (originalValidator) validatorRegistry.set('email', originalValidator)
      else validatorRegistry.delete('email')
    }
  })

  it('handles empty formFields gracefully', () => {
    const wrapper = mount(FormComponent, {
      props: { formFields: [], modelValue: {} },
      global: { stubs: globalStubs, components: { Form, FormField } },
    })
    expect(wrapper.findAllComponents(FormField).length).toBe(0)
    expect(wrapper.findComponent({ name: 'Button' }).exists()).toBe(true)
  })
})
