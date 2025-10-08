<template>
  <PlotlyComponent :data="plotlyData" :layout="processedLayout" :config="processedConfig" /> >
</template>

<script setup lang="ts">
import { type Data, type Layout, type Config } from 'plotly.js-dist-min'
import { computed, type ComputedRef } from 'vue'
import PlotlyComponent from '@/components/PlotlyComponent/PlotlyComponent.vue'
import { useI18nLib } from '@/locales'
import { applyTranslations } from '@/utils/translations'

export interface PlotlyFromTableComponentConfig {
  x: string
  y: string
  traceConfig?: Partial<Data>
  layout?: Partial<Layout>
  config?: Partial<Config>
}
export interface PlotlyFromTableComponentProps {
  value: Record<string, unknown>[]
  config: PlotlyFromTableComponentConfig
}

const { value, config } = defineProps<PlotlyFromTableComponentProps>()

const { t } = useI18nLib()

const processedConfig: ComputedRef<Partial<Config> | undefined> = computed(() =>
  applyTranslations(config.config, ['linkText'], t)
)

const processedLayout: ComputedRef<Partial<Layout> | undefined> = computed(() =>
  applyTranslations(
    config.layout,
    [
      'title.text',
      'title.subtitle',
      'title.subtitle.text',
      'xaxis.title.text',
      'xaxis2.title.text',
      'xaxis3.title.text',
      'xaxis4.title.text',
      'xaxis5.title.text',
      'xaxis6.title.text',
      'xaxis7.title.text',
      'xaxis8.title.text',
      'xaxis9.title.text',
      'yaxis.title.text',
      'yaxis2.title.text',
      'yaxis3.title.text',
      'yaxis4.title.text',
      'yaxis5.title.text',
      'yaxis6.title.text',
      'yaxis7.title.text',
      'yaxis8.title.text',
      'yaxis9.title.text',
    ],
    t
  )
)

const plotlyData: ComputedRef<Data[]> = computed(() => {
  return [
    {
      x: value.map((row) => row[config.x]),
      y: value.map((row) => row[config.y]),
      ...(config.traceConfig ?? {}),
    },
  ] as Data[]
})
</script>
