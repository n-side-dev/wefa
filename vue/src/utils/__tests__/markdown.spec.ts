import { describe, it, expect } from 'vitest'
import { applyMarkdownClasses, markdownElementsToTailwindClasses } from '../markdown'

describe('utils/markdown', () => {
  it('exposes a class map for common markdown tags', () => {
    const keys = Object.keys(markdownElementsToTailwindClasses)
    expect(keys).toEqual(
      expect.arrayContaining(['h1', 'h2', 'p', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a'])
    )
  })

  it('applies the mapped Tailwind classes to each matching element in the container', () => {
    const container = document.createElement('div')
    container.innerHTML = '<h1>title</h1><p>body</p><p>more</p><code>x</code>'

    applyMarkdownClasses(container)

    expect(container.querySelector('h1')?.className).toBe(markdownElementsToTailwindClasses.h1)
    const paragraphs = container.querySelectorAll('p')
    expect(paragraphs).toHaveLength(2)
    paragraphs.forEach((p) => expect(p.className).toBe(markdownElementsToTailwindClasses.p))
    expect(container.querySelector('code')?.className).toBe(markdownElementsToTailwindClasses.code)
  })

  it('overwrites any pre-existing classes on matched elements', () => {
    const container = document.createElement('div')
    container.innerHTML = '<h2 class="legacy foo">hi</h2>'

    applyMarkdownClasses(container)

    expect(container.querySelector('h2')?.className).toBe(markdownElementsToTailwindClasses.h2)
    expect(container.querySelector('h2')?.classList.contains('legacy')).toBe(false)
  })

  it('does not throw when the container has no markdown elements', () => {
    const container = document.createElement('div')
    container.innerHTML = '<span>plain</span>'
    expect(() => applyMarkdownClasses(container)).not.toThrow()
    expect(container.querySelector('span')?.className).toBe('')
  })
})
