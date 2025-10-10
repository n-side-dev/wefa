// Hash of element selectors to their corresponding Tailwind classes
// This is needed because Markdown parsing only returns non-classed semantic HTML elements
const markdownElementsToTailwindClasses = {
  h1: 'text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 mt-8 first:mt-0',
  h2: 'text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 mt-6',
  h3: 'text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 mt-5',
  h4: 'text-lg font-medium text-gray-700 dark:text-gray-200 mb-2 mt-4',
  h5: 'text-base font-medium text-gray-700 dark:text-gray-200 mb-2 mt-3',
  h6: 'text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 mt-3',
  p: 'text-gray-700 dark:text-gray-300 leading-relaxed mb-4',
  ul: 'list-disc list-inside mb-4 text-gray-700 dark:text-gray-300',
  ol: 'list-decimal list-inside mb-4 text-gray-700 dark:text-gray-300',
  li: 'mb-2',
  blockquote:
    'border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-300 mb-4',
  code: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 px-1 py-0.5 rounded text-sm font-mono',
  pre: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 p-4 rounded-lg overflow-x-auto mb-4',
  a: 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline',
  strong: 'font-semibold',
  em: 'italic',
}

/**
 * Applies Tailwind classes to Markdown elements converted to HTML tags
 * @param container The HTML element containing the Markdown content
 */
function applyMarkdownClasses(container: HTMLElement) {
  Object.keys(markdownElementsToTailwindClasses).forEach((tagName) => {
    const elements = container.querySelectorAll(tagName)
    elements.forEach((element) => {
      ;(element as HTMLElement).className =
        markdownElementsToTailwindClasses[tagName as keyof typeof markdownElementsToTailwindClasses]
    })
  })
}

export { markdownElementsToTailwindClasses, applyMarkdownClasses }
