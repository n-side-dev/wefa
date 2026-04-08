import { axiosInstance } from '@/network'
import type {
  CommandPaletteAssistantConfig,
  WefaAssistantRecipeStep,
  WefaAssistantRequest,
  WefaAssistantResponse,
} from '@/components/CommandPaletteComponent'

interface BackendAssistantRouteManifestEntry {
  doc_id: string
  route_name?: string
  path_template: string
  label: string
  section?: string
}

interface BackendAssistantRequest {
  prompt: string
  locale: string
  conversation_token?: string
  current_route: {
    name?: string
    path: string
  }
  route_manifest: BackendAssistantRouteManifestEntry[]
  answers?: string[]
}

interface BackendAssistantQuestion {
  id?: string
  text: string
}

interface BackendAssistantRecipeStep {
  id: string
  title: string
  description?: string
  action_label?: string
  depends_on_step_ids?: string[]
  target?: {
    doc_id: string
    path?: string
    name?: string
    params?: Record<string, string>
    query?: Record<string, string>
  }
}

type BackendAssistantResponse =
  | {
      status: 'needs_clarification'
      conversation_token: string
      questions: BackendAssistantQuestion[]
    }
  | {
      status: 'recipe'
      conversation_token?: string
      summary: string
      warnings?: string[]
      steps: BackendAssistantRecipeStep[]
    }
  | {
      status: 'unsupported'
      message: string
    }

/**
 * Maps the command palette request contract to the backend snake_case payload.
 * @param request Frontend assistant request collected by the command palette
 * @returns Backend request payload using the Django API field names
 */
function toBackendRequest(request: WefaAssistantRequest): BackendAssistantRequest {
  return {
    prompt: request.prompt,
    locale: 'en',
    conversation_token: request.conversationToken,
    current_route: {
      name: request.currentRoute.name,
      path: request.currentRoute.path,
    },
    route_manifest: request.routeManifest.map((entry) => ({
      doc_id: entry.docId,
      route_name: entry.routeName,
      path_template: entry.pathTemplate,
      label: entry.label,
      section: entry.section,
    })),
    answers: request.answers?.map((answer) => answer.trim()),
  }
}

/**
 * Normalizes a backend recipe step into the frontend palette contract.
 * @param step Backend recipe step returned by the assistant endpoint
 * @returns Frontend recipe step shape expected by the command palette
 */
function toFrontendRecipeStep(step: BackendAssistantRecipeStep): WefaAssistantRecipeStep {
  return {
    id: step.id,
    title: step.title,
    description: step.description,
    actionLabel: step.action_label,
    dependsOnStepIds: step.depends_on_step_ids,
    target: step.target
      ? {
          docId: step.target.doc_id,
          path: step.target.path,
          name: step.target.name,
          params: step.target.params,
          query: step.target.query,
        }
      : undefined,
  }
}

/**
 * Converts the backend assistant response union into the frontend command palette union.
 * @param response Raw backend response payload
 * @returns Frontend response union used by the command palette
 */
function toFrontendResponse(response: BackendAssistantResponse): WefaAssistantResponse {
  if (response.status === 'needs_clarification') {
    return {
      status: 'needs_clarification',
      conversationToken: response.conversation_token,
      questions: response.questions,
    }
  }

  if (response.status === 'recipe') {
    return {
      status: 'recipe',
      conversationToken: response.conversation_token ?? '',
      summary: response.summary,
      warnings: response.warnings,
      steps: response.steps.map(toFrontendRecipeStep),
    }
  }

  return {
    status: 'unsupported',
    message: response.message,
  }
}

export const demoAssistantConfig: CommandPaletteAssistantConfig = {
  enabled: true,
  resumeOnOpen: true,
  askPlaceholderKey: 'navigation.command_palette_ask_placeholder',
  maxRecipeStepsVisible: 6,
  async generateRecipe(request) {
    const response = await axiosInstance.post<BackendAssistantResponse>(
      '/ai-assistant/recipes/',
      toBackendRequest(request)
    )
    return toFrontendResponse(response.data)
  },
}
