import { computed, ref } from 'vue'
import { getModelConfig } from '@/api/modelConfig'
import type { ModelConfigResponse, ModelProvider } from '@/types/api'

export interface ModelProviderOption {
  key: string
  label: string
  value: string
  provider: string
  defaultModel: string
  enabled: boolean
  apiKeyConfigured: boolean
}

export function useModelConfigOptions() {
  const modelConfig = ref<ModelConfigResponse>()
  const modelConfigLoading = ref(false)

  const providerOptions = computed<ModelProviderOption[]>(() =>
    (modelConfig.value?.providers || []).map(toProviderOption)
  )

  async function loadModelConfigOptions() {
    modelConfigLoading.value = true
    try {
      const response = await getModelConfig()
      modelConfig.value = response.data
    } finally {
      modelConfigLoading.value = false
    }
  }

  function resolveDefaultModel(provider?: string) {
    const normalized = provider?.trim().toLowerCase()
    const option = providerOptions.value.find((item) => {
      return [item.value, item.key, item.provider]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase() === normalized)
    })
    return option?.defaultModel || ''
  }

  return {
    modelConfig,
    modelConfigLoading,
    providerOptions,
    loadModelConfigOptions,
    resolveDefaultModel
  }
}

function toProviderOption(provider: ModelProvider): ModelProviderOption {
  const value = provider.provider || provider.key
  const display = provider.displayName || provider.provider || provider.key

  return {
    key: provider.key,
    label: display,
    value,
    provider: provider.provider || '',
    defaultModel: provider.defaultModel || '',
    enabled: provider.enabled,
    apiKeyConfigured: provider.apiKeyConfigured
  }
}
