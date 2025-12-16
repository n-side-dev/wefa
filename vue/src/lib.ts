import type { App } from 'vue'
import type { Pinia } from 'pinia'
import PrimeVue from 'primevue/config'

// Export PrimeVue instance
// This needs to be installed on the importing app to ensure PrimeVue is setup properly
export { PrimeVue as PrimeVueLibConfig }

// Export your library components, functions and props in this file
export * from '@/components/AutoroutedBreadcrumb'
export * from '@/components/ControlBarComponent'
export * from '@/components/GanttChartComponent'
export * from '@/components/DashboardComponent'
export * from '@/components/FormComponent'
export * from '@/components/NetworkButton'
export * from '@/components/NotFound'
export * from '@/components/PlotlyComponent'
export * from '@/components/TableComponent'

// Export stores
export * from '@/stores/darkMode'

// Export plugins
export * from '@/plugins'

// Export utility functions
export * from '@/locales'
export * from '@/utils/markdown'

// Install as plugin
export default {
  install(
    app: App,
    options?: {
      pinia?: Pinia
    }
  ) {
    if (options?.pinia) {
      app.use(options.pinia)
    }
  },
}
