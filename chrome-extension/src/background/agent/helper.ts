import { type ProviderConfig, type ModelConfig } from '@extension/storage';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { BaseMessage } from '@langchain/core/messages';

const maxTokens = 1024 * 4;

// Function to create a chat model - Gemini only
export function createChatModel(providerConfig: ProviderConfig, modelConfig: ModelConfig): BaseChatModel {
  return new ChatGoogleGenerativeAI({
    apiKey: providerConfig.apiKey,
    temperature: (modelConfig.parameters?.temperature ?? 0.1) as number,
    maxOutputTokens: maxTokens,
    model: modelConfig.modelName,
  });
}
