import { describe, it, expect } from 'vitest'
import { applyMarkdownClasses, markdownElementsToTailwindClasses } from '@/utils/markdown'

/**
 *
 * @param html
 */
function createContainer(html: string): HTMLElement {
  const container = document.createElement('div')
  container.innerHTML = html
  return container
}

describe('utils/markdown applyMarkdownClasses', () => {
  it('applies expected classes to known markdown-derived elements', () => {
    const container = createContainer(`
      <h1>Title</h1>
      <h2>Subtitle</h2>
      <p>Paragraph 1</p>
      <p>Paragraph 2</p>
      <ul><li>Item 1</li><li>Item 2</li></ul>
      <ol><li>First</li><li>Second</li></ol>
      <blockquote>Quote</blockquote>
      <pre><code>code()</code></pre>
      <a href="#">Link</a>
      <strong>Bold</strong>
      <em>Italic</em>
    `)

    applyMarkdownClasses(container)

    // Spot check a few elements and ensure multiple elements get classes
    expect(container.querySelector('h1')!.className).toBe(markdownElementsToTailwindClasses.h1)
    expect(container.querySelector('h2')!.className).toBe(markdownElementsToTailwindClasses.h2)

    const paragraphs = Array.from(container.querySelectorAll('p'))
    expect(paragraphs).toHaveLength(2)
    paragraphs.forEach((p) => {
      expect(p.className).toBe(markdownElementsToTailwindClasses.p)
    })

    const ul = container.querySelector('ul')!
    expect(ul.className).toBe(markdownElementsToTailwindClasses.ul)

    const ol = container.querySelector('ol')!
    expect(ol.className).toBe(markdownElementsToTailwindClasses.ol)

    const pre = container.querySelector('pre')!
    expect(pre.className).toBe(markdownElementsToTailwindClasses.pre)

    const code = container.querySelector('code')!
    expect(code.className).toBe(markdownElementsToTailwindClasses.code)

    const a = container.querySelector('a')!
    expect(a.className).toBe(markdownElementsToTailwindClasses.a)

    const em = container.querySelector('em')!
    expect(em.className).toBe(markdownElementsToTailwindClasses.em)

    const strong = container.querySelector('strong')!
    expect(strong.className).toBe(markdownElementsToTailwindClasses.strong)
  })

  it('overwrites existing classes', () => {
    const container = createContainer('<p class="old-class another">Test</p>')
    applyMarkdownClasses(container)
    expect(container.querySelector('p')!.className).toBe(markdownElementsToTailwindClasses.p)
  })

  it('does nothing if no known elements are present', () => {
    const container = createContainer('<div><span>Nothing</span></div>')
    applyMarkdownClasses(container)
    // Ensure no runtime errors by verifying container is unchanged structurally
    expect(container.querySelector('span')!.className).toBe('')
  })
})
