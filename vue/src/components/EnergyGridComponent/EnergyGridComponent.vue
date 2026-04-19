<template>
  <div ref="mapContainer" class="size-full" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const mapContainer = ref<HTMLElement | null>(null)
let map: maplibregl.Map | null = null
let tooltip: maplibregl.Popup | null = null

const VOLTAGE_COLOR = {
  '400000': '#00aa00',
  '275000': '#aaaa00',
  '132000': '#aa4400',
}

const VOLTAGE_WIDTH = {
  '400000': 4,
  '275000': 3,
  '132000': 2,
}

const DEFAULT_COLOR = '#111111'
const DEFAULT_WIDTH = 2

/**
 * Builds a MapLibre match expression for voltage-based styling.
 * @param property GeoJSON property name to match against.
 * @param mapping Property value to style value map.
 * @param fallback Fallback style value when the property is missing.
 * @returns MapLibre expression array.
 */
function voltageExpression(property, mapping, fallback) {
  return ['match', ['get', property], ...Object.entries(mapping).flat(), fallback]
}

/**
 * Builds the substation tooltip body from the available GeoJSON properties.
 * @param properties GeoJSON feature properties.
 * @returns HTML content for the tooltip popup.
 */
function formatSubstationTooltip(properties: Record<string, unknown> = {}) {
  const name = typeof properties.name === 'string' ? properties.name : null
  const substationType = typeof properties.substation === 'string' ? properties.substation : null
  const voltage = typeof properties.voltage === 'string' ? properties.voltage : null
  const operator = typeof properties.operator === 'string' ? properties.operator : null

  return [
    name ?? 'Substation',
    substationType ? `Type: ${substationType.replaceAll('_', ' ')}` : null,
    voltage ? `Voltage: ${voltage}` : null,
    operator ? `Operator: ${operator}` : null,
  ]
    .filter(Boolean)
    .join('<br>')
}

/**
 * Builds the power line tooltip body from the available GeoJSON properties.
 * @param properties GeoJSON feature properties.
 * @returns HTML content for the tooltip popup.
 */
function formatLineTooltip(properties: Record<string, unknown> = {}) {
  const name = typeof properties.name === 'string' ? properties.name : null
  const line = typeof properties.line === 'string' ? properties.line : null
  const circuits = typeof properties.circuits === 'string' ? properties.circuits : null
  const voltage = typeof properties.voltage === 'string' ? properties.voltage : null
  const operator = typeof properties.operator === 'string' ? properties.operator : null

  return [
    name ?? 'Power line',
    line ? `Line: ${line.replaceAll('_', ' ')}` : null,
    circuits ? `Circuits: ${circuits}` : null,
    voltage ? `Voltage: ${voltage}` : null,
    operator ? `Operator: ${operator}` : null,
  ]
    .filter(Boolean)
    .join('<br>')
}

onMounted(async () => {
  map = new maplibregl.Map({
    container: mapContainer.value,
    style: {
      version: 8,
      sources: {
        'natural-earth': {
          type: 'vector',
          url: 'https://demotiles.maplibre.org/tiles/tiles.json',
        },
      },
      layers: [
        {
          id: 'background',
          type: 'background',
          paint: { 'background-color': '#dddddd' }, // light grey sea
        },
        {
          id: 'land',
          type: 'fill',
          source: 'natural-earth',
          'source-layer': 'countries',
          paint: { 'fill-color': '#eeeeee' }, // muted land
        },
        {
          id: 'borders',
          type: 'line',
          source: 'natural-earth',
          'source-layer': 'countries',
          paint: { 'line-color': '#b0aca4', 'line-width': 0.5 },
        },
      ],
    },
    center: [-4.2, 57.0], // Scotland
    zoom: 6,
  })

  await new Promise((resolve) => map.on('load', resolve))

  const res = await fetch('/scotland-power.geojson')
  const geojson = await res.json()

  map.addSource('grid', { type: 'geojson', data: geojson })

  // Lines — glow layer
  map.addLayer({
    id: 'power-lines-glow',
    type: 'line',
    source: 'grid',
    filter: ['==', ['geometry-type'], 'LineString'],
    paint: {
      'line-color': voltageExpression('voltage', VOLTAGE_COLOR, DEFAULT_COLOR),
      'line-width': ['*', voltageExpression('voltage', VOLTAGE_WIDTH, DEFAULT_WIDTH), 4],
      'line-opacity': 0.15,
      'line-blur': 6,
    },
  })

  // Lines — sharp layer
  map.addLayer({
    id: 'power-lines',
    type: 'line',
    source: 'grid',
    filter: ['==', ['geometry-type'], 'LineString'],
    paint: {
      'line-color': voltageExpression('voltage', VOLTAGE_COLOR, DEFAULT_COLOR),
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5,
        voltageExpression('voltage', { '400000': 1.5, '275000': 1, '132000': 0.5 }, 0.5),
        10,
        voltageExpression('voltage', VOLTAGE_WIDTH, DEFAULT_WIDTH),
      ],
      'line-opacity': 0.9,
    },
  })

  // Substations
  map.addLayer({
    id: 'substations',
    type: 'circle',
    source: 'grid',
    filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'power'], 'substation']],
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 2, 12, 7],
      'circle-color': '#ffffff',
      'circle-stroke-color': voltageExpression('voltage', VOLTAGE_COLOR, DEFAULT_COLOR),
      'circle-stroke-width': 2,
    },
  })

  tooltip = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 12,
  })

  map.on('mouseenter', 'substations', (event) => {
    map?.getCanvas().style.setProperty('cursor', 'pointer')

    const feature = event.features?.[0]
    const coordinates =
      feature?.geometry.type === 'Point' ? [...feature.geometry.coordinates] : null

    if (!coordinates) {
      return
    }

    tooltip
      ?.setLngLat(coordinates as [number, number])
      .setHTML(formatSubstationTooltip(feature.properties))
      .addTo(map)
  })

  map.on('mousemove', 'substations', (event) => {
    const coordinates =
      event.features?.[0]?.geometry.type === 'Point'
        ? [...event.features[0].geometry.coordinates]
        : null

    if (coordinates) {
      tooltip?.setLngLat(coordinates as [number, number])
    }
  })

  map.on('mouseleave', 'substations', () => {
    map?.getCanvas().style.removeProperty('cursor')
    tooltip?.remove()
  })

  map.on('mouseenter', 'power-lines', (event) => {
    map?.getCanvas().style.setProperty('cursor', 'pointer')

    const feature = event.features?.[0]
    const coordinates =
      event.lngLat && feature?.geometry.type === 'LineString' ? event.lngLat : null

    if (!coordinates) {
      return
    }

    tooltip?.setLngLat(coordinates).setHTML(formatLineTooltip(feature.properties)).addTo(map)
  })

  map.on('mousemove', 'power-lines', (event) => {
    if (event.lngLat) {
      tooltip?.setLngLat(event.lngLat)
    }
  })

  map.on('mouseleave', 'power-lines', () => {
    map?.getCanvas().style.removeProperty('cursor')
    tooltip?.remove()
  })
})

onUnmounted(() => {
  tooltip?.remove()
  map?.remove()
})
</script>
