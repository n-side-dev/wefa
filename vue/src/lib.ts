import type { App } from 'vue'
import type { Pinia } from 'pinia'
import PrimeVue from 'primevue/config'

// Export PrimeVue instance
// This needs to be installed on the importing app to ensure PrimeVue is setup properly
export { PrimeVue as PrimeVueLibConfig }

// Export your library components, functions and props in this file
export * from './components/AutoroutedBreadcrumb/index'
export * from './components/ControlBarComponent/index'
export * from './components/GanttChartComponent/index'
export * from './components/DashboardComponent/index'
export * from './components/FormComponent/index'
export * from './components/NetworkButton/index'
export * from './components/NotFound/index'
export * from './components/PlotlyComponent/index'
export * from './components/TableComponent/index'
export * from './theme/index'

// Export stores
export * from './stores/index'

// Export plugins
export * from './plugins/index'

// Export utility functions
export * from './locales/index'
export * from './utils/markdown'

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
