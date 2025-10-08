<template>
  <DataTable
    v-model:editing-rows="editingRows"
    :value="model"
    :edit-mode="editMode"
    data-key="id"
    v-bind="tableProps"
    @row-edit-save="onRowEditSave"
    @cell-edit-complete="onCellEditSave"
  >
    <Column
      v-for="(col, index) in columns"
      :key="index"
      :field="col.field"
      :header="t(col.header)"
      :style="{ width: colWidth, 'min-width': '8rem' }"
      v-bind="col.columnProps"
    >
      <template v-if="col.body" #body="{ data }">
        <component
          :is="resolve(col.body)"
          :value="data[col.field]"
          :label="data[col.field]"
          v-bind="col.bodyProps"
        />
      </template>

      <template v-if="col.editor" #editor="{ data, field }">
        <component
          :is="resolve(col.editor)"
          v-model="data[field]"
          :data="data"
          :field="field"
          v-bind="col.editorProps"
        />
      </template>
    </Column>

    <Column
      v-if="editMode === 'row'"
      :row-editor="true"
      :style="{ width: colWidth, 'min-width': '8rem' }"
    ></Column>
  </DataTable>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PropType } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useComponentResolver } from '../../composables/useComponentResolver'
import { useI18nLib } from '@/locales'

export interface TableColumn {
  field: string
  header: string
  editor?: string
  body?: string
  bodyProps?: Record<string, unknown>
  editorProps?: Record<string, unknown>
  columnProps?: Record<string, unknown>
}

export interface TableProps {
  columns: TableColumn[]
  editMode?: 'row' | 'cell'
  tableProps?: Record<string, unknown>
}

const { columns, editMode = undefined, tableProps = {} } = defineProps<TableProps>()

const { t } = useI18nLib()

const model = defineModel({ type: Array as PropType<Record<string, unknown>[]>, required: true })

const { resolve } = useComponentResolver()

const editingRows = ref([])

const emit = defineEmits(['row-edit-save', 'cell-edit-save'])

interface RowEditSaveEvent {
  newData: Record<string, unknown>
  index: number
}

const onRowEditSave = (event: RowEditSaveEvent) => {
  // Emit for optional parent handling (e.g., validation or additional logic)
  emit('row-edit-save', event)

  model.value[event.index] = event.newData
}

interface CellEditCompleteEvent {
  data: Record<string, unknown>
  newValue: unknown
  field: string
}

const onCellEditSave = (event: CellEditCompleteEvent) => {
  // Emit for optional parent handling (e.g., validation or additional logic)
  emit('cell-edit-save', event)

  event.data[event.field] = event.newValue
}

const colWidth = computed(() => {
  const colCount = columns.length + (editMode === 'row' ? 1 : 0)
  return `${100 / colCount}%`
})
</script>
