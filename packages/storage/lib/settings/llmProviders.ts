import { StorageEnum } from '../base/enums';
import { createStorage } from '../base/base';
import type { BaseStorage } from '../base/types';
import { type AgentNameEnum, llmProviderModelNames, llmProviderParameters, ProviderTypeEnum } from './types';

const AZURE_API_VERSION = '2025-04-01-preview';

// Interface for a single provider configuration
export interface ProviderConfig {
  name?: string; // Display name in the options
  type?: ProviderTypeEnum; // Help to decide which LangChain ChatModel package to use
  apiKey: string; // Must be provided, but may be empty for local models
  baseUrl?: string; // Optional base URL if provided // For Azure: Endpoint
  modelNames?: string[]; // Chosen model names (NOT used for Azure OpenAI)
  createdAt?: number; // Timestamp in milliseconds when the provider was created
  // Azure Specific Fields:
  azureDeploymentNames?: string[]; // Azure deployment names array
  azureApiVersion?: string;
}

// Interface for storing multiple LLM provider configurations
// The key is the provider id, which is the same as the provider type for built-in providers, but is custom for custom providers
export interface LLMKeyRecord {
  providers: Record<string, ProviderConfig>;
}

export type LLMProviderStorage = BaseStorage<LLMKeyRecord> & {
  setProvider: (providerId: string, config: ProviderConfig) => Promise<void>;
  getProvider: (providerId: string) => Promise<ProviderConfig | undefined>;
  removeProvider: (providerId: string) => Promise<void>;
  hasProvider: (providerId: string) => Promise<boolean>;
  getAllProviders: () => Promise<Record<string, ProviderConfig>>;
};

// Storage for LLM provider configurations
// use "llm-api-keys" as the key for the storage, for backward compatibility
const storage = createStorage<LLMKeyRecord>(
  'llm-api-keys',
  { providers: {} },
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

// Helper function to determine provider type from provider name
export function getProviderTypeByProviderId(_providerId: string): ProviderTypeEnum {
  return ProviderTypeEnum.Gemini;
}

// Helper function to get display name from provider id
export function getDefaultDisplayNameFromProviderId(_providerId: string): string {
  return 'Gemini';
}

// Get default configuration for Gemini provider
export function getDefaultProviderConfig(_providerId: string): ProviderConfig {
  return {
    apiKey: '',
    name: getDefaultDisplayNameFromProviderId(ProviderTypeEnum.Gemini),
    type: ProviderTypeEnum.Gemini,
    modelNames: [...llmProviderModelNames[ProviderTypeEnum.Gemini]],
    createdAt: Date.now(),
  };
}

export function getDefaultAgentModelParams(_providerId: string, agentName: AgentNameEnum): Record<string, number> {
  return llmProviderParameters[ProviderTypeEnum.Gemini][agentName];
}

// Helper function to ensure backward compatibility for provider configs
function ensureBackwardCompatibility(_providerId: string, config: ProviderConfig): ProviderConfig {
  const updatedConfig = { ...config };

  // Ensure required fields exist
  if (!updatedConfig.name) {
    updatedConfig.name = getDefaultDisplayNameFromProviderId(ProviderTypeEnum.Gemini);
  }
  if (!updatedConfig.type) {
    updatedConfig.type = ProviderTypeEnum.Gemini;
  }
  if (!updatedConfig.modelNames) {
    updatedConfig.modelNames = [...llmProviderModelNames[ProviderTypeEnum.Gemini]];
  }
  if (!updatedConfig.createdAt) {
    updatedConfig.createdAt = Date.now();
  }

  return updatedConfig;
}

export const llmProviderStore: LLMProviderStorage = {
  ...storage,
  async setProvider(providerId: string, config: ProviderConfig) {
    if (!providerId) {
      throw new Error('Provider id cannot be empty');
    }

    if (config.apiKey === undefined) {
      throw new Error('API key must be provided');
    }

    if (!config.apiKey?.trim()) {
      throw new Error(`API Key is required for ${getDefaultDisplayNameFromProviderId(providerId)}`);
    }

    if (!config.modelNames || config.modelNames.length === 0) {
      console.warn(`Provider ${providerId} is being saved without model names.`);
    }

    const completeConfig: ProviderConfig = {
      apiKey: config.apiKey || '',
      name: config.name || getDefaultDisplayNameFromProviderId(providerId),
      type: ProviderTypeEnum.Gemini,
      modelNames: config.modelNames || [...llmProviderModelNames[ProviderTypeEnum.Gemini]],
      createdAt: config.createdAt || Date.now(),
    };

    const current = (await storage.get()) || { providers: {} };
    await storage.set({
      providers: {
        ...current.providers,
        [providerId]: completeConfig,
      },
    });
  },
  async getProvider(providerId: string) {
    const data = (await storage.get()) || { providers: {} };
    const config = data.providers[providerId];
    return config ? ensureBackwardCompatibility(providerId, config) : undefined;
  },
  async removeProvider(providerId: string) {
    const current = (await storage.get()) || { providers: {} };
    const newProviders = { ...current.providers };
    delete newProviders[providerId];
    await storage.set({ providers: newProviders });
  },
  async hasProvider(providerId: string) {
    const data = (await storage.get()) || { providers: {} };
    return providerId in data.providers;
  },
  async getAllProviders() {
    const data = await storage.get();
    const providers = { ...data.providers };

    // Add backward compatibility for all providers
    for (const [providerId, config] of Object.entries(providers)) {
      providers[providerId] = ensureBackwardCompatibility(providerId, config);
    }

    return providers;
  },
};
