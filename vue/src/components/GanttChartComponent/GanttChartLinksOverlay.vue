<template>
  <svg
    class="absolute inset-y-0 pointer-events-none z-10"
    :style="{ left: `${leftHeaderWidthPx}px` }"
    :width="gridWidthPx"
    :height="virtualHeightPx"
    :viewBox="`0 0 ${gridWidthPx} ${virtualHeightPx}`"
  >
    <defs>
      <clipPath id="gantt-link-clip">
        <rect x="0" y="0" :width="gridWidthPx" :height="virtualHeightPx" />
      </clipPath>
      <marker
        v-for="link in linkLayers.base"
        :id="`gantt-link-arrow-${link.id}`"
        :key="`marker-${link.id}`"
        markerWidth="6"
        markerHeight="6"
        refX="6"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M 0 0 L 6 3 L 0 6 z" :fill="link.color" :stroke="link.color" />
      </marker>
    </defs>
    <g clip-path="url(#gantt-link-clip)">
      <path
        v-for="link in linkLayers.base"
        :key="link.id"
        :data-link-id="link.id"
        :d="link.path"
        :stroke="link.color"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        :marker-end="`url(#gantt-link-arrow-${link.id})`"
      />
    </g>
  </svg>
  <svg
    class="absolute inset-y-0 pointer-events-none"
    :style="{ left: `${leftHeaderWidthPx}px`, zIndex: 25 }"
    :width="gridWidthPx"
    :height="virtualHeightPx"
    :viewBox="`0 0 ${gridWidthPx} ${virtualHeightPx}`"
  >
    <defs>
      <clipPath id="gantt-link-clip-mini">
        <rect x="0" y="0" :width="gridWidthPx" :height="virtualHeightPx" />
      </clipPath>
      <marker
        v-for="link in linkLayers.mini"
        :id="`gantt-link-arrow-mini-${link.id}`"
        :key="`marker-mini-${link.id}`"
        markerWidth="6"
        markerHeight="6"
        refX="6"
        refY="3"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M 0 0 L 6 3 L 0 6 z" :fill="link.color" :stroke="link.color" />
      </marker>
    </defs>
    <g clip-path="url(#gantt-link-clip-mini)">
      <path
        v-for="link in linkLayers.mini"
        :key="`mini-${link.id}`"
        :data-link-id="link.id"
        :d="link.path"
        :stroke="link.color"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        :marker-end="`url(#gantt-link-arrow-mini-${link.id})`"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
import type { GanttLinkLayer } from '@/components/GanttChartComponent/composables/useGanttLinks'

export interface GanttChartLinksOverlayProps {
  linkLayers: {
    base: GanttLinkLayer[]
    mini: GanttLinkLayer[]
  }
  gridWidthPx: number
  virtualHeightPx: number
  leftHeaderWidthPx: number
}

defineProps<GanttChartLinksOverlayProps>()
</script>
