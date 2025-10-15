<template>
  <div
    v-if="cookiesStore.reviewNeeded"
    class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-[1000] p-4"
  >
    <div class="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
      <div class="mb-4 md:mb-0 text-center md:text-left flex-grow">
        <h4 class="mb-2 text-lg text-gray-800 font-medium">Cookie Preferences</h4>
        <p class="text-sm text-gray-600 m-0">
          We use cookies to enhance your experience. Please review your cookie preferences.
        </p>
      </div>

      <div class="flex gap-3 items-center flex-shrink-0 justify-center flex-wrap sm:flex-nowrap">
        <Button
          label="Accept All"
          class="p-button-success p-button-sm w-full sm:w-auto"
          @click="cookiesStore.acceptAllCookies"
        />
        <Button
          label="Reject All"
          class="p-button-secondary p-button-sm w-full sm:w-auto"
          @click="cookiesStore.rejectAllCookies"
        />
        <Button
          label="Manage Preferences"
          class="p-button-primary p-button-sm w-full sm:w-auto"
          @click="openPreferences"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import { useCookiesStore } from '../index'

const cookiesStore = useCookiesStore()

// Open the detailed preferences dialog
const openPreferences = () => {
  cookiesStore.showDialog()
}
</script>
