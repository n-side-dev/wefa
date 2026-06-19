<template>
  <!-- Base activity links are drawn in a lower z-layer with individual arrow markers. -->
  <svg
    class="absolute inset-y-0 pointer-events-none z-10"
    :style="{ left: `${leftHeaderWidthPx}px` }"
    :width="gridWidthPx"
    :height="virtualHeightPx"
    :viewBox="`0 0 ${gridWidthPx} ${virtualHeightPx}`"
  >
    <defs>
      <!-- Clip to the virtualized viewport so paths don't bleed outside. -->
      <clipPath :id="baseClipPathId">
        <rect x="0" y="0" :width="gridWidthPx" :height="virtualHeightPx" />
      </clipPath>
      <!-- Each link gets its own marker so color matches the stroke. -->
      <marker
        v-for="link in linkLayers.base"
        :id="link.markerId"
        :key="`marker-${link.markerId}`"
        markerWidth="4"
        markerHeight="4"
        refX="4"
        refY="2"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M 0 0 L 4 2 L 0 4 z" :fill="link.color" :stroke="link.color" />
      </marker>
    </defs>
    <g :clip-path="`url(#${baseClipPathId})`">
      <!-- Paths are precomputed in useGanttLinks (row offsets + column widths). -->
      <path
        v-for="link in linkLayers.base"
        :key="link.markerId"
        :data-link-id="link.id"
        :d="link.path"
        :stroke="link.color"
        :class="linkPathClass(link)"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        pointer-events="stroke"
        :marker-end="`url(#${link.markerId})`"
        @pointerenter="emit('linkPointerEnter', link)"
        @pointerleave="emit('linkPointerLeave', link)"
      />
    </g>
  </svg>
  <!-- Mini activity links render above bars to avoid being obscured. -->
  <svg
    class="absolute inset-y-0 pointer-events-none"
    :style="{ left: `${leftHeaderWidthPx}px`, zIndex: 25 }"
    :width="gridWidthPx"
    :height="virtualHeightPx"
    :viewBox="`0 0 ${gridWidthPx} ${virtualHeightPx}`"
  >
    <defs>
      <!-- Clip to the virtualized viewport so paths don't bleed outside. -->
      <clipPath :id="miniClipPathId">
        <rect x="0" y="0" :width="gridWidthPx" :height="virtualHeightPx" />
      </clipPath>
      <!-- Each link gets its own marker so color matches the stroke. -->
      <marker
        v-for="link in linkLayers.mini"
        :id="link.markerId"
        :key="`marker-mini-${link.markerId}`"
        markerWidth="4"
        markerHeight="4"
        refX="4"
        refY="4"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <path d="M 0 0 L 4 2 L 0 4 z" :fill="link.color" :stroke="link.color" />
      </marker>
    </defs>
    <g :clip-path="`url(#${miniClipPathId})`">
      <path
        v-for="link in linkLayers.mini"
        :key="`mini-${link.markerId}`"
        :data-link-id="link.id"
        :d="link.path"
        :stroke="link.color"
        :class="linkPathClass(link)"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        pointer-events="stroke"
        :marker-end="`url(#${link.markerId})`"
        @pointerenter="emit('linkPointerEnter', link)"
        @pointerleave="emit('linkPointerLeave', link)"
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
  highlightedLinkMarkerIds?: Array<string>
  linkClass?: string
  linkHighlightClass?: string
  svgIdPrefix: string
  gridWidthPx: number
  virtualHeightPx: number
  leftHeaderWidthPx: number
}

const {
  linkLayers,
  gridWidthPx,
  virtualHeightPx,
  leftHeaderWidthPx,
  highlightedLinkMarkerIds = [],
  linkClass = 'opacity-70 transition-opacity',
  linkHighlightClass = 'opacity-100 [stroke-width:4]',
  svgIdPrefix,
} = defineProps<GanttChartLinksOverlayProps>()

const emit = defineEmits<{
  (event: 'linkPointerEnter', link: GanttLinkLayer): void
  (event: 'linkPointerLeave', link: GanttLinkLayer): void
}>()

const linkPathClass = (link: GanttLinkLayer) => [
  link.class,
  highlightedLinkMarkerIds.includes(link.markerId) ? linkHighlightClass : linkClass,
]

const baseClipPathId = `${svgIdPrefix}-gantt-link-clip`
const miniClipPathId = `${svgIdPrefix}-gantt-link-clip-mini`
</script>
