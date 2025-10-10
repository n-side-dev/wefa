<template>
  <section>
    <Skeleton v-if="isLoading" width="100%" height="10rem"></Skeleton>
    <div
      id="legal-document"
      ref="legal-document"
      class="m-1 items-center gap-x-4 rounded-xl bg-white dark:bg-gray-900 p-6 shadow-lg outline outline-black/5 dark:outline-white/10"
      :class="classes"
    ></div>
  </section>
</template>

<script setup lang="ts">
import { apiClient } from '@/network'
import { onMounted, type Ref, ref, useTemplateRef, watch } from 'vue'
import { useLegalStore } from '@/plugins/legalConsent'
import { marked } from 'marked'
import Skeleton from 'primevue/skeleton'
import { applyMarkdownClasses } from '@/utils/markdown.ts'

export interface LegalDocumentProps {
  classes?: string
  documentEndpoint: string
}

const legalStore = useLegalStore()
const legalDocumentContainer = useTemplateRef('legal-document')
const { classes = '', documentEndpoint } = defineProps<LegalDocumentProps>()

const { data, isLoading } = apiClient.query(
  ref(`${legalStore.legalEndpoint}/${documentEndpoint}`)
) as {
  data: Ref<string | undefined>
  isLoading: Ref<boolean>
}

watch(data, () => {
  insertMarkdown(data)
})

onMounted(() => {
  insertMarkdown(data)
})

/**
 * Function to insert markdown data into the legal document container
 * @param data A ref containing the markdown data
 */
function insertMarkdown(data: Ref<string | undefined>) {
  if (data.value) {
    legalDocumentContainer.value!.innerHTML = marked.parse(data.value) as string
    // Apply classes to the dynamically generated elements
    applyMarkdownClasses(legalDocumentContainer.value!)
  }
}
</script>
