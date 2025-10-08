<template>
  <Form
    :initial-values="model"
    :resolver="resolver"
    class="flex flex-col gap-4 w-full full sm:w-56"
    v-bind="formProps"
    @submit="onSubmit"
  >
    <FormField
      v-for="field in formFields"
      v-slot="$field"
      :key="field.field"
      :name="field.field"
      class="flex flex-col gap-1"
      v-bind="field.fieldProps"
    >
      <component
        :is="resolveComponent(field.editor)"
        v-if="$field"
        v-model="$field.value"
        v-bind="field.editorProps"
      />
      <Message v-if="$field && $field.invalid" severity="error" size="small" variant="simple">
        {{ $field?.error?.message }}
      </Message>
    </FormField>
    <Button
      v-if="submitProps?.label"
      type="submit"
      v-bind="submitProps"
      :label="t(submitProps.label as string)"
    />
  </Form>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import type { PropType } from 'vue'
import { Form, FormField } from '@primevue/forms'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { useComponentResolver } from '@/composables/useComponentResolver'
import { useValidatorResolver } from '@/composables/useValidatorResolver'
import { useI18nLib } from '@/locales'
import * as z from 'zod'

export interface FormFieldValidation {
  minLength?: number
  minLengthMessage?: string
  required?: boolean
  requiredMessage?: string
  custom?: string // Key to get a custom validation function from a global registry
}

export interface FormField {
  field: string // Either a string or a key to a translation
  editor: string
  editorProps?: Record<string, unknown>
  fieldProps?: Record<string, unknown>
  validation?: FormFieldValidation
}

export interface FormProps {
  formFields: FormField[]
  submitProps?: Record<string, unknown>
  formProps?: Record<string, unknown>
}

const {
  formFields,
  submitProps = { label: 'form.submit', severity: 'secondary' },
  formProps = {},
} = defineProps<FormProps>()

const { t } = useI18nLib()

const model = defineModel({ type: Object as PropType<Record<string, unknown>>, required: true })
const emit = defineEmits(['submit'])

const { resolve: resolveComponent } = useComponentResolver(
  defineAsyncComponent(() => import('primevue/inputtext'))
)
const { resolve: resolveValidator } = useValidatorResolver()

// Dynamic resolver based on field validations
const resolver = computed(() => {
  const schema = z.object(
    Object.fromEntries(
      formFields.map((field) => {
        const translationKey = `form.${field.field}`
        const fieldLabel = t(translationKey) !== translationKey ? t(translationKey) : field.field

        let validator: z.ZodTypeAny = z.any() // Default: no validation
        if (field.validation) {
          const validationConfig: FormFieldValidation = field.validation
          if (validationConfig.minLength) {
            validator = z.string().min(
              validationConfig.minLength,
              validationConfig.minLengthMessage ||
                t('validation.minLength', {
                  field: fieldLabel,
                  minLength: validationConfig.minLength,
                })
            )
          }
          if (validationConfig.required) {
            validator = validator.refine(
              (val) => val !== undefined && val !== '',
              validationConfig.requiredMessage || t('validation.required', { field: fieldLabel })
            )
          }
          if (validationConfig.custom) {
            const customValidator: z.ZodTypeAny | undefined = resolveValidator(
              validationConfig.custom,
              fieldLabel
            )
            if (customValidator) {
              validator = validator.and(customValidator)
            }
          }
        }
        return [field.field, validator]
      })
    )
  )
  return zodResolver(schema)
})

const onSubmit = ({ values, valid }: { values: Record<string, unknown>; valid: boolean }) => {
  if (valid) {
    // Merge form values into the model without overwriting extra fields
    model.value = { ...model.value, ...values }
    emit('submit', { values, valid })
  }
}
</script>
