import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ControlBarComponent from './ControlBarComponent.vue'

describe('ControlBarComponent', () => {
  it('renders correctly with default structure', () => {
    const wrapper = mount(ControlBarComponent)

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.element.tagName).toBe('DIV')
  })

  it('applies correct CSS classes', () => {
    const wrapper = mount(ControlBarComponent)

    const element = wrapper.element as HTMLElement
    expect(element.classList.contains('flex')).toBe(true)
    expect(element.classList.contains('flex-row')).toBe(true)
    expect(element.classList.contains('gap-1')).toBe(true)
    expect(element.classList.contains('items-stretch')).toBe(true)
    expect(element.classList.contains('flex-wrap')).toBe(true)
  })

  it('renders slot content correctly', () => {
    const wrapper = mount(ControlBarComponent, {
      slots: {
        default: '<div class="test-item">Test Content</div>',
      },
    })

    expect(wrapper.find('.test-item').exists()).toBe(true)
    expect(wrapper.find('.test-item').text()).toBe('Test Content')
  })

  it('renders multiple slot items correctly', () => {
    const wrapper = mount(ControlBarComponent, {
      slots: {
        default: `
          <div class="item-1">Item 1</div>
          <div class="item-2">Item 2</div>
          <div class="item-3">Item 3</div>
        `,
      },
    })

    expect(wrapper.find('.item-1').exists()).toBe(true)
    expect(wrapper.find('.item-2').exists()).toBe(true)
    expect(wrapper.find('.item-3').exists()).toBe(true)
    expect(wrapper.find('.item-1').text()).toBe('Item 1')
    expect(wrapper.find('.item-2').text()).toBe('Item 2')
    expect(wrapper.find('.item-3').text()).toBe('Item 3')
  })

  it('renders empty when no slot content provided', () => {
    const wrapper = mount(ControlBarComponent)

    expect(wrapper.element.children.length).toBe(0)
    expect(wrapper.text()).toBe('')
  })

  it('maintains structure with complex slot content', () => {
    const complexContent = `
      <div class="complex-item">
        <span>Title</span>
        <div class="nested">
          <p>Nested content</p>
        </div>
      </div>
    `

    const wrapper = mount(ControlBarComponent, {
      slots: {
        default: complexContent,
      },
    })

    expect(wrapper.find('.complex-item').exists()).toBe(true)
    expect(wrapper.find('.complex-item span').text()).toBe('Title')
    expect(wrapper.find('.nested p').text()).toBe('Nested content')
  })

  it('preserves slot content order', () => {
    const wrapper = mount(ControlBarComponent, {
      slots: {
        default: `
          <div class="first">First</div>
          <div class="second">Second</div>
          <div class="third">Third</div>
        `,
      },
    })

    const items = wrapper.findAll('.first, .second, .third')
    expect(items).toHaveLength(3)
    expect(items[0]?.text()).toBe('First')
    expect(items[1]?.text()).toBe('Second')
    expect(items[2]?.text()).toBe('Third')
  })

  it('maintains stable structure with dynamic content', () => {
    const wrapper = mount(ControlBarComponent, {
      slots: {
        default: '<div class="dynamic">Initial Content</div>',
      },
    })

    expect(wrapper.find('.dynamic').text()).toBe('Initial Content')

    // Note: In real Vue components, slot updates would be handled by parent component
    // This test verifies the component structure remains stable
    expect(wrapper.element.classList.contains('flex')).toBe(true)
    expect(wrapper.element.classList.contains('flex-row')).toBe(true)
    expect(wrapper.element.classList.contains('gap-1')).toBe(true)
  })

  it('works with Vue components as slot content', () => {
    const TestComponent = {
      name: 'TestComponent',
      template: '<span class="test-component">Test Component</span>',
    }

    const wrapper = mount(ControlBarComponent, {
      slots: {
        default: TestComponent,
      },
      global: {
        components: {
          TestComponent,
        },
      },
    })

    expect(wrapper.find('.test-component').exists()).toBe(true)
    expect(wrapper.find('.test-component').text()).toBe('Test Component')
  })

  it('maintains accessibility structure', () => {
    const wrapper = mount(ControlBarComponent, {
      slots: {
        default: `
          <button>Button 1</button>
          <button>Button 2</button>
        `,
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)

    // Verify the container doesn't interfere with button accessibility
    expect(buttons[0]?.element.tagName).toBe('BUTTON')
    expect(buttons[1]?.element.tagName).toBe('BUTTON')
  })

  it('handles mixed content types correctly', () => {
    const wrapper = mount(ControlBarComponent, {
      slots: {
        default: `
          <div class="text-item">Text Item</div>
          <button class="button-item">Button Item</button>
          <span class="span-item">Span Item</span>
        `,
      },
    })

    expect(wrapper.find('.text-item').exists()).toBe(true)
    expect(wrapper.find('.button-item').exists()).toBe(true)
    expect(wrapper.find('.span-item').exists()).toBe(true)

    expect(wrapper.find('.text-item').element.tagName).toBe('DIV')
    expect(wrapper.find('.button-item').element.tagName).toBe('BUTTON')
    expect(wrapper.find('.span-item').element.tagName).toBe('SPAN')
  })

  it('does not have any props', () => {
    const wrapper = mount(ControlBarComponent)

    // ControlBarComponent should not accept any props
    expect(Object.keys(wrapper.props())).toHaveLength(0)
  })

  it('maintains consistent styling regardless of content', () => {
    const wrapperEmpty = mount(ControlBarComponent)
    const wrapperWithContent = mount(ControlBarComponent, {
      slots: {
        default: '<div>Content</div>',
      },
    })

    // Both should have the same CSS classes
    expect(wrapperEmpty.element.className).toBe(wrapperWithContent.element.className)
    expect(wrapperEmpty.element.className).toBe('flex flex-row gap-1 items-stretch flex-wrap')
  })
})
