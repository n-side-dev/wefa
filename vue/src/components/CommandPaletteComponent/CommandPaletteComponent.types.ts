import type { WeFaAssistantManifestEntry } from '@/router'
import type { RouteLocationRaw } from 'vue-router'

export type WefaAssistantPrimitive = string | number

export interface WefaAssistantRecipeTarget {
  docId: string
  path?: string
  name?: string
  params?: Record<string, WefaAssistantPrimitive>
  query?: Record<string, WefaAssistantPrimitive>
}

export interface WefaAssistantRecipeStep {
  id: string
  title: string
  description?: string
  actionLabel?: string
  target?: WefaAssistantRecipeTarget
  dependsOnStepIds?: string[]
}

export interface WefaAssistantClarificationQuestion {
  id?: string
  text: string
}

export interface WefaAssistantContextRoute {
  name?: string
  path: string
}

export interface WefaAssistantRequest {
  prompt: string
  routeManifest: WeFaAssistantManifestEntry[]
  currentRoute: WefaAssistantContextRoute
  conversationToken?: string
  answers?: string[]
}

export interface WefaAssistantClarificationResponse {
  status: 'needs_clarification'
  conversationToken: string
  questions: Array<string | WefaAssistantClarificationQuestion>
}

export interface WefaAssistantRecipeResponse {
  status: 'recipe'
  conversationToken: string
  summary: string
  steps: WefaAssistantRecipeStep[]
  warnings?: string[]
}

export interface WefaAssistantUnsupportedResponse {
  status: 'unsupported'
  message: string
}

export type WefaAssistantResponse =
  | WefaAssistantClarificationResponse
  | WefaAssistantRecipeResponse
  | WefaAssistantUnsupportedResponse

export interface CommandPaletteAssistantConfig {
  enabled: boolean
  askPlaceholderKey?: string
  resumeOnOpen?: boolean
  maxRecipeStepsVisible?: number
  storageKey?: string
  generateRecipe: (request: WefaAssistantRequest) => Promise<WefaAssistantResponse>
}

export interface CommandPaletteComponentProps {
  assistant?: CommandPaletteAssistantConfig
}

export interface WefaAssistantSessionSnapshot {
  mode: 'navigate' | 'ask'
  prompt: string
  conversationToken?: string
  recipe: WefaAssistantRecipeResponse | null
}

export type WefaAssistantRouteTarget = RouteLocationRaw
