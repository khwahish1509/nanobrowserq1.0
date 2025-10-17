import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { BaseMessage } from '@langchain/core/messages';
import { AIMessage, AIMessageChunk, HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';
import { ChatGenerationChunk, type ChatResult } from '@langchain/core/outputs';

/**
 * ChatGeminiNano - LangChain-compatible wrapper for Chrome's built-in Gemini Nano
 * Uses the Chrome Prompt API (window.ai.languageModel)
 */
export class ChatGeminiNano extends BaseChatModel {
  private temperature: number;
  private topK: number;
  private modelName = 'gemini-nano';
  private isOptimizationEnabled = true; // Enable Nano-specific optimizations

  constructor(config: { temperature?: number; topK?: number } = {}) {
    super({});
    // Use optimized settings by default for Gemini Nano
    // These are tuned specifically for small model performance
    this.temperature = config.temperature ?? 0.15; // Very low for deterministic behavior
    this.topK = config.topK ?? 1; // Only best token

    console.log('[GeminiNano] Initialized with optimized settings:', {
      temperature: this.temperature,
      topK: this.topK,
      optimizationEnabled: this.isOptimizationEnabled,
    });
  }

  /**
   * Required by BaseChatModel - returns the model identifier
   */
  _llmType(): string {
    return 'gemini-nano';
  }

  /**
   * Convert LangChain messages to a format suitable for Gemini Nano
   * Adds JSON formatting instructions to improve structured output
   */
  private formatMessages(messages: BaseMessage[]): string {
    let formattedPrompt = '';
    let systemPrompt = '';
    let hasJsonInstruction = false;

    for (const message of messages) {
      if (message instanceof SystemMessage) {
        const content = message.content as string;
        systemPrompt += content + '\n\n';
        // Check if system prompt already has JSON instructions
        hasJsonInstruction = content.toLowerCase().includes('json') && content.includes('{');
      } else if (message instanceof HumanMessage) {
        formattedPrompt += `User: ${message.content}\n`;
      } else if (message instanceof AIMessage) {
        formattedPrompt += `Assistant: ${message.content}\n`;
      }
    }

    // Add explicit JSON formatting instruction if system prompt expects JSON response
    if (hasJsonInstruction) {
      formattedPrompt +=
        '\nIMPORTANT: Respond ONLY with valid JSON. Do not include any explanation, markdown, or text outside the JSON object. Start your response with { and end with }.\n';
    }

    // Combine system prompt with conversation
    return systemPrompt + formattedPrompt + 'Assistant:';
  }

  /**
   * Main method to generate chat responses
   */
  async _generate(
    messages: BaseMessage[],
    options?: this['ParsedCallOptions'],
    runManager?: CallbackManagerForLLMRun,
  ): Promise<ChatResult> {
    try {
      // Chrome's Prompt API uses a global LanguageModel object (not window.ai)
      // Check if LanguageModel is available in the global scope
      const global = typeof window !== 'undefined' ? window : globalThis;
      const LanguageModel = (global as any).LanguageModel;

      console.log('[GeminiNano] Checking API availability:', {
        hasLanguageModel: typeof LanguageModel !== 'undefined',
        languageModelType: typeof LanguageModel,
        chromeVersion: navigator?.userAgent?.match(/Chrome\/(\d+)/)?.[1],
      });

      if (typeof LanguageModel === 'undefined') {
        throw new Error(
          'Gemini Nano is not available: LanguageModel API not found. Please ensure Chrome has the built-in AI enabled (chrome://flags/#prompt-api-for-gemini-nano), the model is downloaded (chrome://components/), and Chrome has been restarted.',
        );
      }

      // Check if the model is available using the availability() static method
      const availability = await LanguageModel.availability();
      // Chrome API returns 'available', 'readily', or 'after-download'
      if (availability !== 'readily' && availability !== 'available') {
        if (availability === 'after-download') {
          throw new Error('Gemini Nano model needs to be downloaded. Please visit chrome://components/ and update.');
        }
        throw new Error(`Gemini Nano is not available. Status: ${availability}`);
      }

      // Format messages for Gemini Nano
      const prompt = this.formatMessages(messages);

      // Get system prompt if exists
      let systemPrompt = '';
      const firstMessage = messages[0];
      if (firstMessage instanceof SystemMessage) {
        systemPrompt = firstMessage.content as string;
      }

      // Create a session with Gemini Nano
      // Pass temperature and topK in the create options
      const session = await LanguageModel.create({
        temperature: this.temperature,
        topK: this.topK,
        systemPrompt: systemPrompt || undefined,
      });

      // Generate response
      const response = await session.prompt(prompt);

      // Log the raw response for debugging
      console.log('[GeminiNano] Raw response preview:', response.slice(0, 300));
      console.log('[GeminiNano] Response length:', response.length);
      console.log('[GeminiNano] Starts with JSON:', response.trimStart().startsWith('{'));

      // Clean up session
      session.destroy();

      // Create LangChain-compatible response
      const generation = new ChatGenerationChunk({
        message: new AIMessageChunk(response),
        text: response,
      });

      return {
        generations: [generation],
        llmOutput: {
          tokenUsage: {
            // Gemini Nano doesn't provide token counts
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
          },
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Gemini Nano error: ${errorMessage}`);
    }
  }

  /**
   * Streaming is not currently supported by Gemini Nano in extensions
   * Falls back to non-streaming implementation
   */
  async *_streamResponseChunks(
    messages: BaseMessage[],
    options?: this['ParsedCallOptions'],
    runManager?: CallbackManagerForLLMRun,
  ): AsyncGenerator<ChatGenerationChunk> {
    // Gemini Nano supports streaming via promptStreaming(), but it's complex to implement
    // For now, fall back to non-streaming
    const result = await this._generate(messages, options, runManager);
    for (const generation of result.generations) {
      yield generation as ChatGenerationChunk;
    }
  }

  /**
   * Check if Gemini Nano is available on this system
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const global = typeof window !== 'undefined' ? window : globalThis;
      const LanguageModel = (global as any).LanguageModel;

      if (typeof LanguageModel === 'undefined') {
        console.log('[GeminiNano] LanguageModel API not found');
        return false;
      }

      const availability = await LanguageModel.availability();
      console.log('[GeminiNano] Availability status:', availability);
      // Accept both 'available' and 'readily' as valid statuses
      return availability === 'readily' || availability === 'available';
    } catch (error) {
      console.error('[GeminiNano] Availability check failed:', error);
      return false;
    }
  }

  /**
   * Get availability status details
   */
  static async getAvailabilityStatus(): Promise<string> {
    try {
      const global = typeof window !== 'undefined' ? window : globalThis;
      const LanguageModel = (global as any).LanguageModel;

      if (typeof LanguageModel === 'undefined') {
        return 'not-supported';
      }

      return await LanguageModel.availability();
    } catch (error) {
      console.error('[GeminiNano] Status check error:', error);
      return 'error';
    }
  }
}
